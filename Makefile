COMPOSE_PROJECT := marketplace-frontend
COMPOSE_DEV := docker compose -p $(COMPOSE_PROJECT) --env-file .env.development -f compose.dev.yml
COMPOSE_PROD := docker compose -p $(COMPOSE_PROJECT) --env-file .env.production -f compose.prod.yml
SERVICE := app

export DOCKER_BUILDKIT := 1
export COMPOSE_DOCKER_CLI_BUILD := 1

.PHONY: help env-setup install dev lint test build start preview \
	dev-up dev-down dev-logs dev-logs-once dev-logs-app dev-shell dev-build dev-rebuild dev-restart dev-reset \
	dev-lint dev-lint-fix dev-format dev-typecheck dev-check \
	prod-up prod-down prod-logs prod-build prod-rebuild \
	clean check dev-ci prod-image

help:
	@echo "Setup e local:"
	@echo "  make env-setup        Cria .env.development e .env.production a partir dos .example"
	@echo "  make install          Instala dependencias localmente com pnpm"
	@echo "  make dev              Sobe o Vite localmente (sem Docker) em modo desenvolvimento"
	@echo "  make lint             Executa o lint do projeto"
	@echo "  make test             Executa os testes do projeto"
	@echo "  make build            Gera o build local de producao"
	@echo "  make preview          Serve o build local de producao via Vite preview"
	@echo "  make start            Alias de preview"
	@echo ""
	@echo "Desenvolvimento (Docker):"
	@echo "  make dev-up           Sobe o ambiente Docker de desenvolvimento"
	@echo "  make dev-down         Derruba o ambiente Docker de desenvolvimento"
	@echo "  make dev-logs         Exibe logs do ambiente Docker de desenvolvimento"
	@echo "  make dev-logs-once    Exibe logs (uma vez) do ambiente Docker de desenvolvimento"
	@echo "  make dev-logs-app     Exibe logs apenas do servico da aplicacao"
	@echo "  make dev-shell        Abre um shell no container da aplicacao"
	@echo "  make dev-build        Apenas constroi a imagem de desenvolvimento"
	@echo "  make dev-rebuild      Constroi e sobe o ambiente Docker de desenvolvimento"
	@echo "  make dev-restart      Recria os containers (down + up) sem rebuild"
	@echo "  make dev-reset        Derruba o ambiente e REMOVE TODOS OS VOLUMES"
	@echo ""
	@echo "Qualidade de codigo (rodam dentro do container):"
	@echo "  make dev-lint         Executa ESLint (sem fix)"
	@echo "  make dev-lint-fix     Executa ESLint com auto-fix"
	@echo "  make dev-format       Aplica Prettier nos arquivos"
	@echo "  make dev-typecheck    Verifica tipos com tsc --noEmit"
	@echo "  make dev-check        Roda lint + typecheck + format:check (espelha o CI)"
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
	@echo ""
	@echo "CI/CD:"
	@echo "  make dev-ci           Roda lint + typecheck + format:check + build no container (espelha o CI)"
	@echo "  make prod-image       Builda a imagem Docker de producao standalone (espelha o CD)"

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

test:
	pnpm test

build:
	pnpm build

preview:
	pnpm preview

start:
	pnpm preview

dev-up:
	$(COMPOSE_DEV) up -d

dev-down:
	$(COMPOSE_DEV) down

dev-logs:
	$(COMPOSE_DEV) logs -f

dev-logs-once:
	$(COMPOSE_DEV) logs --tail $${TAIL:-120}

dev-logs-app:
	$(COMPOSE_DEV) logs -f $(SERVICE)

dev-shell:
	$(COMPOSE_DEV) exec $(SERVICE) sh

dev-lint:
	$(COMPOSE_DEV) exec $(SERVICE) pnpm lint

dev-lint-fix:
	$(COMPOSE_DEV) exec $(SERVICE) pnpm lint:fix

dev-format:
	$(COMPOSE_DEV) exec $(SERVICE) pnpm format

dev-typecheck:
	$(COMPOSE_DEV) exec $(SERVICE) pnpm typecheck

dev-check:
	$(COMPOSE_DEV) exec $(SERVICE) sh -c "pnpm lint && pnpm typecheck && pnpm format:check"

dev-build:
	$(COMPOSE_DEV) build $(SERVICE)

dev-rebuild:
	$(COMPOSE_DEV) up --build -d

dev-restart:
	$(COMPOSE_DEV) down
	$(COMPOSE_DEV) up -d

dev-reset:
	$(COMPOSE_DEV) down -v
	rm -rf dist tsconfig.tsbuildinfo

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
	rm -rf dist tsconfig.tsbuildinfo

check:
	docker build . --check

dev-ci:
	$(COMPOSE_DEV) exec $(SERVICE) sh -c "pnpm lint && pnpm typecheck && pnpm format:check && pnpm build"

prod-image:
	docker build --target runner -t marketplace-frontend:local .
