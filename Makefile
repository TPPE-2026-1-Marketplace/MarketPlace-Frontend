# Makefile do frontend. Mesmo esqueleto e mesmos nomes de comando do backend
# (MarketPlace-Backend): o que é comum aos dois fica nas seções Setup, Local,
# Desenvolvimento, Produção local e Utilidades; o que é só deste repositório
# fica em "Específicos do frontend". `make help` é gerado a partir dos
# comentários `## ` de cada alvo e dos títulos `##@`. Cada alvo declara o
# próprio `.PHONY` logo acima dele.
#
# Requer Docker >= 27 com o Compose v2 (`docker compose`): os Dockerfiles
# dependem do BuildKit (`RUN --mount`), padrão desde o Docker 23, e o alvo
# `check` usa `docker build --check`, disponível a partir do Docker 27.

COMPOSE_PROJECT := marketplace-frontend
COMPOSE_DEV := docker compose --project-name $(COMPOSE_PROJECT) --env-file .env.development --file compose.dev.yml
COMPOSE_PROD := docker compose --project-name $(COMPOSE_PROJECT) --env-file .env.production --file compose.prod.yml
SERVICE := app

.DEFAULT_GOAL := help

##@ Setup

.PHONY: help
help: ## Lista os comandos disponíveis
	@awk 'BEGIN { FS = ":.*## " } \
		/^##@/ { printf "\n%s\n", substr($$0, 5) } \
		/^[a-zA-Z0-9_-]+:.*## / { printf "  make %-22s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ""
	@echo "Opções: path=<padrão> (dev-test*), svc=<serviço> (dev-logs), VITE_API_URL=<url> (prod-image),"
	@echo "        HEADLESS=false (selenium-local/selenium-prod); demais em tests/selenium/README.md"

# Aponta o Git para os hooks versionados: o commit-msg preenche os
# Co-authored-by do trio. Basta rodar uma vez por clone.
.PHONY: hooks
hooks: ## Ativa o commit-msg versionado (.githooks)
	git config core.hooksPath .githooks
	@echo "Hooks ativados a partir de .githooks/"

.PHONY: hooks-off
hooks-off: ## Desativa o commit-msg versionado (volta para .git/hooks)
	git config --unset core.hooksPath || true
	@echo "Hooks desativados (voltando para .git/hooks)"

.PHONY: env-setup
env-setup: ## Cria .env.development e .env.production a partir dos .example
	cp -n .env.development.example .env.development || true
	cp -n .env.production.example .env.production || true
	@echo "Arquivos .env.development e .env.production criados (se ainda nao existiam)."
	@echo "Edite-os com os valores reais antes de subir o ambiente."

.PHONY: env-check
env-check: ## Compara as chaves dos .env com as dos .example (sem mostrar valores)
	@sh scripts/env-check.sh

.PHONY: install
install: ## Instala as dependências no host com pnpm
	pnpm install

##@ Local (sem Docker)

.PHONY: dev
dev: ## Sobe o Vite no host (porta 3000), com o .env.development
	pnpm dev --port 3000

.PHONY: lint
lint: ## ESLint no host
	pnpm lint

.PHONY: test
test: ## Testes unitários (Vitest) no host
	pnpm test

.PHONY: build
build: ## Typecheck + build de produção no host (dist/)
	pnpm build

.PHONY: start
start: ## Serve o build (dist/) com o vite preview
	pnpm preview

.PHONY: clean
clean: ## Remove os artefatos de build
	rm -rf dist coverage tsconfig.tsbuildinfo tsconfig.node.tsbuildinfo

##@ Desenvolvimento (Docker)

.PHONY: dev-up
dev-up: ## Sobe o ambiente de desenvolvimento
	$(COMPOSE_DEV) up -d $(SERVICE)

.PHONY: dev-down
dev-down: ## Derruba o ambiente de desenvolvimento
	$(COMPOSE_DEV) down

.PHONY: dev-restart
dev-restart: ## Recria os containers (down + up) sem rebuild
	$(COMPOSE_DEV) down
	$(COMPOSE_DEV) up -d $(SERVICE)

.PHONY: dev-build
dev-build: ## Só constrói a imagem de desenvolvimento
	$(COMPOSE_DEV) build $(SERVICE)

.PHONY: dev-rebuild
dev-rebuild: ## Reconstrói a imagem e sobe o ambiente
	$(COMPOSE_DEV) up --build -d $(SERVICE)

.PHONY: dev-reset
dev-reset: ## Derruba tudo e APAGA OS VOLUMES (node_modules)
	$(COMPOSE_DEV) down -v

.PHONY: dev-logs
dev-logs: ## Acompanha os logs (svc=app|selenium para filtrar)
	$(COMPOSE_DEV) logs --follow $(svc)

.PHONY: dev-shell
dev-shell: ## Abre um shell no container do app
	$(COMPOSE_DEV) exec $(SERVICE) sh

.PHONY: dev-test
dev-test: ## Testes unitários no container (path=<padrão> filtra)
	$(COMPOSE_DEV) exec $(SERVICE) pnpm test $(path)

.PHONY: dev-test-cov
dev-test-cov: ## Testes com cobertura no container (coverage/)
	$(COMPOSE_DEV) exec $(SERVICE) pnpm test:coverage $(path)

.PHONY: dev-lint
dev-lint: ## ESLint no container (sem fix)
	$(COMPOSE_DEV) exec $(SERVICE) pnpm lint

.PHONY: dev-lint-fix
dev-lint-fix: ## ESLint com auto-fix no container
	$(COMPOSE_DEV) exec $(SERVICE) pnpm lint:fix

.PHONY: dev-typecheck
dev-typecheck: ## Verifica os tipos (tsc -b) no container
	$(COMPOSE_DEV) exec $(SERVICE) pnpm typecheck

.PHONY: dev-check
dev-check: ## lint + typecheck no container
	$(COMPOSE_DEV) exec $(SERVICE) sh -c "pnpm lint && pnpm typecheck"

.PHONY: dev-ci
dev-ci: ## dev-check + testes + build no container (espelha o CI)
	$(COMPOSE_DEV) exec $(SERVICE) sh -c "pnpm lint && pnpm typecheck && pnpm test && pnpm build"

##@ Produção local (Docker)

.PHONY: prod-up
prod-up: ## Sobe a imagem de produção localmente (.env.production)
	$(COMPOSE_PROD) up -d

.PHONY: prod-down
prod-down: ## Derruba o ambiente de produção local
	$(COMPOSE_PROD) down

.PHONY: prod-logs
prod-logs: ## Acompanha os logs da produção local
	$(COMPOSE_PROD) logs -f

.PHONY: prod-build
prod-build: ## Só constrói a imagem de produção (VITE_API_URL do .env.production)
	$(COMPOSE_PROD) build $(SERVICE)

.PHONY: prod-rebuild
prod-rebuild: ## Reconstrói a imagem de produção e sobe
	$(COMPOSE_PROD) up --build -d

# Espelha o build do CD (.github/workflows/cd.yml).
.PHONY: prod-image
prod-image: ## Builda a imagem runner como o CD (VITE_API_URL=... obrigatório)
	@test -n "$(VITE_API_URL)" || (echo "ERRO: informe VITE_API_URL, por exemplo: VITE_API_URL=http://localhost:3001/api make prod-image" && exit 2)
	docker build --target runner --build-arg VITE_API_URL="$(VITE_API_URL)" -t marketplace-frontend:local .

##@ Utilidades

.PHONY: check
check: ## Valida o Dockerfile (docker build --check)
	docker build . --check

##@ Específicos do frontend

# A lógica dos alvos de Selenium fica em scripts/selenium.sh; padrões e
# variáveis aceitas estão no cabeçalho do script e em tests/selenium/README.md.

.PHONY: selenium-local
selenium-local: ## Selenium no host contra o front local (precisa de make dev-up)
	@COMPOSE="$(COMPOSE_DEV)" bash scripts/selenium.sh local

.PHONY: selenium-prod
selenium-prod: ## Selenium no host contra a produção
	@COMPOSE="$(COMPOSE_DEV)" bash scripts/selenium.sh prod

.PHONY: selenium-local-ui
selenium-local-ui: ## Selenium remoto (Chrome + noVNC) contra o front local
	@COMPOSE="$(COMPOSE_DEV)" bash scripts/selenium.sh local-ui

.PHONY: selenium-prod-ui
selenium-prod-ui: ## Selenium remoto (Chrome + noVNC) contra a produção
	@COMPOSE="$(COMPOSE_DEV)" bash scripts/selenium.sh prod-ui
