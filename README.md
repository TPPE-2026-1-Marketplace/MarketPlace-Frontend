# Marketplace Frontend

Base de front-end para a disciplina de Técnicas de Programação em Plataformas Emergentes (TPPE), usando `Next.js`, `Tailwind CSS`, `pnpm` e `Docker`.

## Requisitos

- Node.js 22 LTS
- Corepack habilitado
- Docker e Docker Compose

## Executando localmente

```bash
npm install -g pnpm
pnpm install
pnpm dev
```

O projeto ficará disponível em `http://localhost:3000`.

## Executando com Docker

```bash
docker compose up --build
```

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

Copie os valores necessários a partir de `.env.example`. Variáveis públicas do Next.js devem usar o prefixo `NEXT_PUBLIC_`.
