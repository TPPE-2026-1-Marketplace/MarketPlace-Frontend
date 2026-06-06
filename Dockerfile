# syntax=docker/dockerfile:1.7

# O uso do ARG faz com que a imagem possa mudar dinamicamente conforme o uso.
# Exemplo: docker build --build-arg NODE_VERSION=20-alpine .

ARG NODE_VERSION=22-alpine

# ─── Estágio base: Node + pnpm ───────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

# ─── Estágio deps: instala dependências com cache ─────────────────────────────
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,target=/app/.pnpm-store \
    pnpm install --frozen-lockfile --store-dir=/app/.pnpm-store

# ─── Estágio dev: servidor de desenvolvimento Vite com HMR ───────────────────
FROM deps AS dev

# Ajusta ownership para o usuario do host
# (compose define user: "${UID:-1000}:${GID:-1000}")
RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["pnpm", "dev"]

# ─── Estágio build: gera os arquivos estáticos de produção ───────────────────
FROM base AS build

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

# ─── Estágio runner: Nginx serve os arquivos estáticos ───────────────────────
FROM nginx:stable-alpine AS runner

# Copia os artefatos de build do estágio anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Copia a configuração customizada do Nginx (SPA fallback + healthcheck)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
