# Makefile do frontend. Mesmo esqueleto e mesmos nomes de comando do backend
# (MarketPlace-Backend): o que é comum aos dois fica nas seções Setup, Local,
# Desenvolvimento, Produção local e Utilidades; o que é só deste repositório
# fica em "Específicos do frontend". `make help` é gerado a partir dos
# comentários `## ` de cada alvo e dos títulos `##@`.

COMPOSE_PROJECT := marketplace-frontend
COMPOSE_DEV := docker compose -p $(COMPOSE_PROJECT) --env-file .env.development -f compose.dev.yml
COMPOSE_PROD := docker compose -p $(COMPOSE_PROJECT) --env-file .env.production -f compose.prod.yml
SERVICE := app

export DOCKER_BUILDKIT := 1
export COMPOSE_DOCKER_CLI_BUILD := 1

.DEFAULT_GOAL := help

.PHONY: help hooks hooks-off env-setup env-check install \
	dev lint test build start clean \
	dev-up dev-down dev-restart dev-build dev-rebuild dev-reset dev-logs dev-shell \
	dev-test dev-test-cov dev-lint dev-lint-fix dev-typecheck dev-check dev-ci \
	prod-up prod-down prod-logs prod-build prod-rebuild prod-image \
	check \
	selenium selenium-local selenium-local-ui selenium-prod-ui

SELENIUM_LOCAL_URL ?= http://localhost:3000
SELENIUM_PROD_URL ?= https://marketplace-frontend-jh71.onrender.com/
SELENIUM_REMOTE_URL ?= http://localhost:4444
SELENIUM_NOVNC_URL ?= http://localhost:7900/?autoconnect=1&resize=scale&password=secret
SELENIUM_UI_START_DELAY ?= 0
SELENIUM_UI_STEP_DELAY_MS ?= 1500
SELENIUM_UI_HOLD_OPEN_MS ?= 30000
SELENIUM_CHECKOUT_PAYMENT_HOLD_MS ?= 8000
SELENIUM_ALLOW_ADMIN_MUTATIONS ?= false
SELENIUM_ADMIN_MUTATION_STEP_DELAY_MS ?= 1000

##@ Setup

help: ## Lista os comandos disponíveis
	@awk 'BEGIN { FS = ":.*## " } \
		/^##@/ { printf "\n%s\n", substr($$0, 5) } \
		/^[a-zA-Z0-9_-]+:.*## / { printf "  make %-22s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "Opções: path=<padrão> (dev-test*), svc=<serviço> (dev-logs), VITE_API_URL=<url> (prod-image)"

# Aponta o Git para os hooks versionados: o commit-msg preenche os
# Co-authored-by do trio. Basta rodar uma vez por clone.
hooks: ## Ativa o commit-msg versionado (.githooks)
	git config core.hooksPath .githooks
	@echo "Hooks ativados a partir de .githooks/"

hooks-off: ## Desativa o commit-msg versionado (volta para .git/hooks)
	git config --unset core.hooksPath || true
	@echo "Hooks desativados (voltando para .git/hooks)"

env-setup: ## Cria .env.development e .env.production a partir dos .example
	cp -n .env.development.example .env.development || true
	cp -n .env.production.example .env.production || true
	@echo "Arquivos .env.development e .env.production criados (se ainda nao existiam)."
	@echo "Edite-os com os valores reais antes de subir o ambiente."

env-check: ## Compara as chaves dos .env com as dos .example (sem mostrar valores)
	@sh scripts/env-check.sh

install: ## Instala as dependências no host com pnpm
	pnpm install

##@ Local (sem Docker)

dev: ## Sobe o Vite no host (porta 3000), com o .env.development
	pnpm dev --port 3000

lint: ## ESLint no host
	pnpm lint

test: ## Testes unitários (Vitest) no host
	pnpm test

build: ## Typecheck + build de produção no host (dist/)
	pnpm build

start: ## Serve o build (dist/) com o vite preview
	pnpm preview

clean: ## Remove os artefatos de build
	rm -rf dist coverage tsconfig.tsbuildinfo tsconfig.node.tsbuildinfo

##@ Desenvolvimento (Docker)

dev-up: ## Sobe o ambiente de desenvolvimento
	$(COMPOSE_DEV) up -d $(SERVICE)

dev-down: ## Derruba o ambiente de desenvolvimento
	$(COMPOSE_DEV) down

dev-restart: ## Recria os containers (down + up) sem rebuild
	$(COMPOSE_DEV) down
	$(COMPOSE_DEV) up -d $(SERVICE)

dev-build: ## Só constrói a imagem de desenvolvimento
	$(COMPOSE_DEV) build $(SERVICE)

dev-rebuild: ## Reconstrói a imagem e sobe o ambiente
	$(COMPOSE_DEV) up --build -d $(SERVICE)

dev-reset: ## Derruba tudo e APAGA OS VOLUMES (node_modules)
	$(COMPOSE_DEV) down -v

dev-logs: ## Acompanha os logs (svc=app|selenium para filtrar)
	$(COMPOSE_DEV) logs -f $(svc)

dev-shell: ## Abre um shell no container do app
	$(COMPOSE_DEV) exec $(SERVICE) sh

dev-test: ## Testes unitários no container (path=<padrão> filtra)
	$(COMPOSE_DEV) exec $(SERVICE) pnpm test $(path)

dev-test-cov: ## Testes com cobertura no container (coverage/)
	$(COMPOSE_DEV) exec $(SERVICE) pnpm test:coverage $(path)

dev-lint: ## ESLint no container (sem fix)
	$(COMPOSE_DEV) exec $(SERVICE) pnpm lint

dev-lint-fix: ## ESLint com auto-fix no container
	$(COMPOSE_DEV) exec $(SERVICE) pnpm lint:fix

dev-typecheck: ## Verifica os tipos (tsc -b) no container
	$(COMPOSE_DEV) exec $(SERVICE) pnpm typecheck

dev-check: ## lint + typecheck no container
	$(COMPOSE_DEV) exec $(SERVICE) sh -c "pnpm lint && pnpm typecheck"

dev-ci: ## dev-check + testes + build no container (espelha o CI)
	$(COMPOSE_DEV) exec $(SERVICE) sh -c "pnpm lint && pnpm typecheck && pnpm test && pnpm build"

##@ Produção local (Docker)

prod-up: ## Sobe a imagem de produção localmente (.env.production)
	$(COMPOSE_PROD) up -d

prod-down: ## Derruba o ambiente de produção local
	$(COMPOSE_PROD) down

prod-logs: ## Acompanha os logs da produção local
	$(COMPOSE_PROD) logs -f

prod-build: ## Só constrói a imagem de produção (VITE_API_URL do .env.production)
	$(COMPOSE_PROD) build $(SERVICE)

prod-rebuild: ## Reconstrói a imagem de produção e sobe
	$(COMPOSE_PROD) up --build -d

# Espelha o build do CD (.github/workflows/cd.yml).
prod-image: ## Builda a imagem runner como o CD (VITE_API_URL=... obrigatório)
	@test -n "$(VITE_API_URL)" || (echo "ERRO: informe VITE_API_URL, por exemplo: VITE_API_URL=http://localhost:3001/api make prod-image" && exit 2)
	docker build --target runner --build-arg VITE_API_URL="$(VITE_API_URL)" -t marketplace-frontend:local .

##@ Utilidades

check: ## Valida o Dockerfile (docker build --check)
	docker build . --check

##@ Específicos do frontend

selenium: ## Selenium no host contra SELENIUM_BASE_URL (produção)
	@test -n "$(SELENIUM_BASE_URL)" || (echo "ERRO: informe a URL de producao, por exemplo: SELENIUM_BASE_URL=https://loja.exemplo.com make selenium" && exit 2)
	SELENIUM_ENV=production SELENIUM_BASE_URL="$(SELENIUM_BASE_URL)" HEADLESS="$(HEADLESS)" pnpm test:selenium

selenium-local: ## Selenium no host contra o front local (porta 3000)
	@curl --fail --silent --show-error "$(SELENIUM_LOCAL_URL)" > /dev/null || (echo "ERRO: front indisponivel em $(SELENIUM_LOCAL_URL). Inicie com make dev-up." && exit 2)
	set -a && . ./.env.development && set +a && \
	SELENIUM_ENV=local \
	SELENIUM_BASE_URL="$${SELENIUM_BASE_URL:-$(SELENIUM_LOCAL_URL)}" \
	HEADLESS="$(HEADLESS)" \
	pnpm test:selenium

selenium-local-ui: ## Selenium remoto (Chrome + noVNC) contra o front local
	$(COMPOSE_DEV) up -d app
	$(COMPOSE_DEV) up -d --force-recreate selenium
	@echo "Aguardando front em $(SELENIUM_LOCAL_URL)..."
	@attempt=0; until curl --fail --silent "$(SELENIUM_LOCAL_URL)" > /dev/null; do \
		attempt=$$((attempt + 1)); \
		if [ $$attempt -ge 60 ]; then echo "ERRO: front indisponivel em $(SELENIUM_LOCAL_URL)."; exit 2; fi; \
		sleep 1; \
	done
	@echo "Aguardando Selenium em $(SELENIUM_REMOTE_URL)/status..."
	@attempt=0; until curl --fail --silent "$(SELENIUM_REMOTE_URL)/status" > /dev/null; do \
		attempt=$$((attempt + 1)); \
		if [ $$attempt -ge 90 ]; then echo "ERRO: Selenium indisponivel em $(SELENIUM_REMOTE_URL)/status."; exit 2; fi; \
		sleep 1; \
	done
	@echo "Abra para acompanhar o navegador:"
	@echo "$(SELENIUM_NOVNC_URL)"
	@echo "Os testes iniciam em $(SELENIUM_UI_START_DELAY) segundos."
	@sleep $(SELENIUM_UI_START_DELAY)
	set -a && . ./.env.development && set +a && \
	SELENIUM_ENV=local \
	SELENIUM_BASE_URL="$(SELENIUM_LOCAL_URL)" \
	SELENIUM_REMOTE_URL="$(SELENIUM_REMOTE_URL)" \
	SELENIUM_HOST_GATEWAY="$$( $(COMPOSE_DEV) exec -T selenium getent hosts host.docker.internal | awk 'NR==1 { print $$1 }')" \
	HEADLESS=false \
	SELENIUM_STEP_DELAY_MS="$(SELENIUM_UI_STEP_DELAY_MS)" \
	SELENIUM_HOLD_OPEN_MS="$(SELENIUM_UI_HOLD_OPEN_MS)" \
	pnpm test:selenium

selenium-prod-ui: ## Selenium remoto (Chrome + noVNC) contra a produção
	$(COMPOSE_DEV) up -d --force-recreate --no-deps selenium
	@echo "Aguardando Selenium em $(SELENIUM_REMOTE_URL)/status..."
	@attempt=0; until curl --fail --silent "$(SELENIUM_REMOTE_URL)/status" > /dev/null; do \
		attempt=$$((attempt + 1)); \
		if [ $$attempt -ge 90 ]; then echo "ERRO: Selenium indisponivel em $(SELENIUM_REMOTE_URL)/status."; exit 2; fi; \
		sleep 1; \
	done
	@echo "Abra para acompanhar o navegador:"
	@echo "$(SELENIUM_NOVNC_URL)"
	@echo "Os testes iniciam em $(SELENIUM_UI_START_DELAY) segundos."
	@sleep $(SELENIUM_UI_START_DELAY)
	set -a && . ./.env.production && set +a && \
	SELENIUM_ENV=production \
	SELENIUM_BASE_URL="$${SELENIUM_BASE_URL:-$(SELENIUM_PROD_URL)}" \
	SELENIUM_REMOTE_URL="$(SELENIUM_REMOTE_URL)" \
	SELENIUM_ALLOW_CHECKOUT_PAYMENT="$${SELENIUM_ALLOW_CHECKOUT_PAYMENT:-true}" \
	SELENIUM_CHECKOUT_PAYMENT_HOLD_MS="$${SELENIUM_CHECKOUT_PAYMENT_HOLD_MS:-$(SELENIUM_CHECKOUT_PAYMENT_HOLD_MS)}" \
	SELENIUM_ALLOW_ADMIN_MUTATIONS="$(SELENIUM_ALLOW_ADMIN_MUTATIONS)" \
	SELENIUM_ADMIN_MUTATION_STEP_DELAY_MS="$${SELENIUM_ADMIN_MUTATION_STEP_DELAY_MS:-$(SELENIUM_ADMIN_MUTATION_STEP_DELAY_MS)}" \
	HEADLESS=false \
	SELENIUM_STEP_DELAY_MS="$(SELENIUM_UI_STEP_DELAY_MS)" \
	SELENIUM_HOLD_OPEN_MS="$(SELENIUM_UI_HOLD_OPEN_MS)" \
	pnpm test:selenium
