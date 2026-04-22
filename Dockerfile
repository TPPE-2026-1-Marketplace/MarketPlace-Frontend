# syntax=docker/dockerfile:1.7

# O uso do ARG faz com o que a imagem pode mudar dinamicamente conforme o uso
# isso é bom para fazer uma validação da melhor imagem
# Exemplo: docker build --build-arg NODE_VERSION=20-alpine .

ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir=/pnpm/store

FROM deps AS dev

# CMD ["pnpm", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
CMD ["sh", "-c", "if [ ! -d node_modules ] || [ -z \"$(ls -A node_modules 2>/dev/null)\" ]; then pnpm install; fi && pnpm dev --hostname 0.0.0.0 --port 3000"]

FROM base AS build

COPY . .
ENV NODE_ENV=production
RUN pnpm build

FROM base AS runner

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=build --chown=nextjs:nextjs /app/public ./public
RUN mkdir .next && chown nextjs:nextjs .next
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
