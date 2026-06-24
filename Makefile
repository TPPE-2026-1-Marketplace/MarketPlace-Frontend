COMPOSE_DEV := docker compose --env-file .env.development -f compose.dev.yml
COMPOSE_PROD := docker compose --env-file .env.production -f compose.prod.yml
SERVICE := app

export DOCKER_BUILDKIT := 1
export COMPOSE_DOCKER_CLI_BUILD := 1

.PHONY: help env-setup install dev lint build start selenium selenium-local selenium-local-ui selenium-prod-ui \
    dev-up dev-down dev-logs dev-shell dev-build dev-rebuild dev-reset \
    prod-up prod-down prod-logs prod-build prod-rebuild \
    clean check

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

help:
	@echo "Setup e local:"
	@echo "  make env-setup        Cria .env.development e .env.production a partir dos .example"
	@echo "  make install          Instala dependencias localmente com pnpm"
	@echo "  make dev              Sobe o Next.js localmente em modo desenvolvimento"
	@echo "  make lint             Executa o lint do projeto"
	@echo "  make build            Gera o build local de producao"
	@echo "  make start            Inicia a aplicacao local usando o build"
	@echo "  make selenium         Executa Selenium contra SELENIUM_BASE_URL (producao)"
	@echo "  make selenium-local   Executa Selenium contra o front local (porta 3000)"
	@echo "  make selenium-local-ui Executa Selenium remoto com Chrome e noVNC"
	@echo "  make selenium-prod-ui Executa Selenium remoto contra a producao com Chrome e noVNC"
	@echo ""
	@echo "Desenvolvimento (Docker):"
	@echo "  make dev-up           Sobe o ambiente Docker de desenvolvimento"
	@echo "  make dev-down         Derruba o ambiente Docker de desenvolvimento"
	@echo "  make dev-logs         Exibe logs do ambiente Docker de desenvolvimento"
	@echo "  make dev-shell        Abre um shell no container da aplicacao"
	@echo "  make dev-build        Apenas constroi a imagem de desenvolvimento"
	@echo "  make dev-rebuild      Constroi e sobe o ambiente Docker de desenvolvimento"
	@echo "  make dev-reset        Derruba o ambiente e REMOVE OS VOLUMES (apaga banco!)"
	@echo ""
	@echo "Producao (Docker):"
	@echo "  make prod-up          Sobe o ambiente Docker de producao"
	@echo "  make prod-down        Derruba o ambiente Docker de producao"
	@echo "  make prod-logs        Exibe logs do ambiente Docker de producao"
	@echo "  make prod-build       Apenas constroi a imagem de producao"
	@echo "  make prod-rebuild     Constroi e sobe o ambiente Docker de producao"
	@echo ""
	@echo "Utilidades:"
	@echo "  make clean            Remove artefatos locais de build"
	@echo "  make check            Verifica se o Dockerfile esta correto"

env-setup:
	cp -n .env.development.example .env.development || true
	cp -n .env.production.example .env.production || true
	@echo "Arquivos .env.development e .env.production criados (se ainda nao existiam)."
	@echo "Edite-os com os valores reais antes de subir o ambiente."

install:
	pnpm install

dev:
	pnpm dev

lint:
	pnpm lint

build:
	pnpm build

start:
	pnpm start

selenium:
	@test -n "$(SELENIUM_BASE_URL)" || (echo "ERRO: informe a URL de producao, por exemplo: SELENIUM_BASE_URL=https://loja.exemplo.com make selenium" && exit 2)
	SELENIUM_ENV=production SELENIUM_BASE_URL="$(SELENIUM_BASE_URL)" HEADLESS="$(HEADLESS)" pnpm test:selenium

selenium-local:
	@curl --fail --silent --show-error "$(SELENIUM_LOCAL_URL)" > /dev/null || (echo "ERRO: front indisponivel em $(SELENIUM_LOCAL_URL). Inicie com make dev-up." && exit 2)
	set -a && . ./.env.development && set +a && \
	SELENIUM_ENV=local \
	SELENIUM_BASE_URL="$${SELENIUM_BASE_URL:-$(SELENIUM_LOCAL_URL)}" \
	HEADLESS="$(HEADLESS)" \
	pnpm test:selenium

selenium-local-ui:
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

selenium-prod-ui:
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

dev-up:
	$(COMPOSE_DEV) up -d

dev-down:
	$(COMPOSE_DEV) down

dev-logs:
	$(COMPOSE_DEV) logs -f

dev-shell:
	$(COMPOSE_DEV) exec $(SERVICE) sh

dev-build:
	$(COMPOSE_DEV) build $(SERVICE)

dev-rebuild:
	$(COMPOSE_DEV) up --build -d

dev-reset:
	$(COMPOSE_DEV) down -v

prod-up:
	$(COMPOSE_PROD) up -d

prod-down:
	$(COMPOSE_PROD) down

prod-logs:
	$(COMPOSE_PROD) logs -f

prod-build:
	$(COMPOSE_PROD) build $(SERVICE)

prod-rebuild:
	$(COMPOSE_PROD) up --build -d

clean:
	rm -rf dist node_modules

check:
	docker build . --check
