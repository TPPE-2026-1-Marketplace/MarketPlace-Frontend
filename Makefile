COMPOSE_DEV := docker compose -f compose.dev.yml
COMPOSE_PROD := docker compose -f compose.prod.yml
SERVICE := app

.PHONY: help env-setup install dev lint build start docker-build docker-up docker-down docker-logs docker-shell docker-rebuild docker-reset docker-prod-build docker-prod-up docker-prod-down docker-prod-logs clean

help:
	@echo "Comandos disponíveis:"
	@echo "  make env-setup       Cria .env.development e .env.production a partir dos exemplos"
	@echo "  make install         Instala dependências localmente com pnpm"
	@echo "  make dev             Sobe o Next.js localmente em modo desenvolvimento"
	@echo "  make lint            Executa o lint do projeto"
	@echo "  make build           Gera o build local de produção"
	@echo "  make start           Inicia a aplicação local usando o build de produção"
	@echo "  make docker-build    Constrói a imagem do ambiente de desenvolvimento"
	@echo "  make docker-up       Sobe o ambiente Docker de desenvolvimento"
	@echo "  make docker-down     Derruba o ambiente Docker de desenvolvimento"
	@echo "  make docker-logs     Exibe os logs do ambiente de desenvolvimento"
	@echo "  make docker-shell    Abre um shell no container de desenvolvimento"
	@echo "  make docker-rebuild  Reconstrói e sobe o ambiente de desenvolvimento"
	@echo "  make docker-reset    Derruba o ambiente de desenvolvimento e remove volumes"
	@echo "  make docker-prod-build Constrói a imagem do ambiente de produção"
	@echo "  make docker-prod-up  Sobe o ambiente Docker de produção"
	@echo "  make docker-prod-down Derruba o ambiente Docker de produção"
	@echo "  make docker-prod-logs Exibe os logs do ambiente de produção"
	@echo "  make clean           Remove artefatos locais de build"

env-setup:
	cp -n .env.development.example .env.development
	cp -n .env.production.example .env.production

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

docker-build:
	$(COMPOSE_DEV) build

docker-up:
	$(COMPOSE_DEV) up -d

docker-down:
	$(COMPOSE_DEV) down

docker-logs:
	$(COMPOSE_DEV) logs -f $(SERVICE)

docker-shell:
	$(COMPOSE_DEV) exec $(SERVICE) sh

docker-rebuild:
	$(COMPOSE_DEV) up --build -d

docker-reset:
	$(COMPOSE_DEV) down -v

docker-prod-build:
	$(COMPOSE_PROD) build

docker-prod-up:
	$(COMPOSE_PROD) up -d

docker-prod-down:
	$(COMPOSE_PROD) down

docker-prod-logs:
	$(COMPOSE_PROD) logs -f $(SERVICE)

clean:
	rm -rf .next
