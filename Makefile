COMPOSE_DEV := docker compose --env-file .env.development -f compose.dev.yml
COMPOSE_PROD := docker compose --env-file .env.production -f compose.prod.yml
SERVICE := app

export DOCKER_BUILDKIT := 1
export COMPOSE_DOCKER_CLI_BUILD := 1

.PHONY: help env-setup install dev lint build start \
    dev-up dev-down dev-logs dev-shell dev-build dev-rebuild dev-reset \
    prod-up prod-down prod-logs prod-build prod-rebuild \
    clean check

help:
	@echo "Setup e local:"
	@echo "  make env-setup        Cria .env.development e .env.production a partir dos .example"
	@echo "  make install          Instala dependencias localmente com pnpm"
	@echo "  make dev              Sobe o Next.js localmente em modo desenvolvimento"
	@echo "  make lint             Executa o lint do projeto"
	@echo "  make build            Gera o build local de producao"
	@echo "  make start            Inicia a aplicacao local usando o build"
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
	rm -rf .next

check:
	docker build . --check
