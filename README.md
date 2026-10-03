# Marketplace Frontend

Base de front-end para a disciplina de Técnicas de Programação em Plataformas Emergentes (TPPE), usando `React (Vite SPA)`, `Tailwind CSS`, `pnpm` e `Docker`.

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

Variáveis públicas do Vite devem usar o prefixo `VITE_`.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): em push/PR para `dev` e `main` roda lint, typecheck + build e o build da imagem Docker (`runner`).
- **CD** (`.github/workflows/cd.yml`): após o CI verde em push na `main`, builda a imagem nginx com `VITE_API_URL` embutida, publica em `ghcr.io/tppe-2026-1-marketplace/marketplace-frontend` (`latest` e `sha-<commit>`), dispara o deploy da imagem (por digest) no Render e roda um smoke test (`/healthz`, `/` e fallback de SPA).

Configuração necessária no GitHub (Settings → Environments → `production`):

| Tipo | Nome | Exemplo |
| --- | --- | --- |
| Secret | `RENDER_API_KEY` | chave da API do Render |
| Secret | `RENDER_SERVICE_ID` | `srv-...` |
| Variable | `RENDER_SERVICE_URL` | `https://dk-fashion-web-image.onrender.com` |
| Variable | `VITE_API_URL` | `https://dk-fashion-api-image.onrender.com/api` |

No Render, o serviço é do tipo *Existing image* (ver `render.yaml`), usando as credenciais de registry `github-container-registry` e com auto-deploy desligado — quem dispara o deploy é o CD.

Para reproduzir localmente a imagem do CD:

```bash
VITE_API_URL=http://localhost:3001/api make prod-image
docker run --rm -p 8080:80 marketplace-frontend:local
```
