# Marketplace Frontend

Base de front-end para a disciplina de Técnicas de Programação em Plataformas Emergentes (TPPE), usando `Next.js`, `Tailwind CSS`, `pnpm` e `Docker`.

## Requisitos

- Node.js 22 LTS
- Corepack habilitado
- Docker e Docker Compose

## Executando localmente

```bash
make env-setup
npm install -g pnpm
pnpm install
pnpm dev
```

O projeto ficará disponível em `http://localhost:3000`.

## Executando com Docker

```bash
make docker-rebuild
```

Para produção com Compose:

```bash
make docker-prod-build
make docker-prod-up
```

O ambiente define `NODE_ENV` e usa arquivos locais por ambiente:

- `.env.development` para desenvolvimento
- `.env.production` para produção
- `.env.development.example` e `.env.production.example` como templates versionados

## Build de produção

```bash
pnpm build
pnpm start
```

Ou via Docker:

```bash
docker build -t marketplace-frontend .
docker run --rm -p 3000:3000 marketplace-frontend
```

## Variáveis de ambiente

Crie os arquivos reais a partir dos templates:

```bash
make env-setup
```

Variáveis públicas do Next.js devem usar o prefixo `NEXT_PUBLIC_`.
