COMPOSE := docker compose
SERVICE := app

.PHONY: help install dev lint build start docker-build docker-up docker-down docker-logs docker-shell docker-rebuild docker-reset clean

help:
	@echo "Comandos disponíveis:"
	@echo "  make install         Instala dependências localmente com pnpm"
	@echo "  make dev             Sobe o Next.js localmente em modo desenvolvimento"
	@echo "  make lint            Executa o lint do projeto"
	@echo "  make build           Gera o build local de produção"
	@echo "  make start           Inicia a aplicação local usando o build de produção"
	@echo "  make docker-build    Constrói a imagem/serviço Docker"
	@echo "  make docker-up       Sobe o ambiente Docker em background"
	@echo "  make docker-down     Derruba os containers mantendo os volumes"
	@echo "  make docker-logs     Exibe os logs do serviço $(SERVICE)"
	@echo "  make docker-shell    Abre um shell dentro do container $(SERVICE)"
	@echo "  make docker-rebuild  Reconstrói a imagem e sobe o ambiente"
	@echo "  make docker-reset    Derruba containers e remove volumes"
	@echo "  make clean           Remove artefatos locais de build"

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
	$(COMPOSE) build

docker-up:
	$(COMPOSE) up -d

docker-down:
	$(COMPOSE) down

docker-logs:
	$(COMPOSE) logs -f $(SERVICE)

docker-shell:
	$(COMPOSE) exec $(SERVICE) sh

docker-rebuild:
	$(COMPOSE) up --build -d

docker-reset:
	$(COMPOSE) down -v

clean:
	rm -rf .next
