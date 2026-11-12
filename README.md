# Marketplace Frontend

Base de front-end para a disciplina de Técnicas de Programação em Plataformas Emergentes (TPPE), usando `React (Vite SPA)`, `Tailwind CSS`, `pnpm` e `Docker`.

## Requisitos

- Node.js 22 LTS
- Corepack habilitado
- Docker e Docker Compose

## Executando com Docker (recomendado)

```bash
make env-setup     # cria .env.development e .env.production a partir dos .example
make dev-up        # sobe o Vite com hot reload em http://localhost:3000
make dev-logs      # acompanha os logs
make dev-ci        # lint + typecheck + testes + build, como no CI
```

Para rodar a imagem de produção (nginx) localmente, com o `VITE_API_URL` do
`.env.production`:

```bash
make prod-rebuild  # http://localhost:3003
```

## Executando localmente (sem Docker)

```bash
make env-setup
make install
make dev           # http://localhost:3000
make build         # typecheck + build em dist/
make start         # serve o dist/ com o vite preview
```

## Comandos (Makefile)

`make help` lista todos, agrupados por seção. Os nomes e as seções são os mesmos
do `Makefile` do backend; o que é só do frontend (Selenium) fica em
"Específicos do frontend".

| Comando                         | O que faz                                          |
| ------------------------------- | -------------------------------------------------- |
| `make dev-up` / `dev-down`      | Sobe / derruba o ambiente de desenvolvimento       |
| `make dev-restart`              | Recria os containers sem rebuild                   |
| `make dev-rebuild`              | Reconstrói a imagem e sobe                         |
| `make dev-reset`                | Derruba e **apaga os volumes** (`node_modules`)    |
| `make dev-logs svc=app`         | Logs de um serviço                                 |
| `make dev-shell`                | Shell no container                                 |
| `make dev-test path=<padrão>`   | Testes unitários (filtrando por arquivo)           |
| `make dev-check`                | lint + typecheck                                   |
| `make dev-ci`                   | lint + typecheck + testes + build (espelha o CI)   |
| `make env-check`                | Compara os `.env` com os `.example` (só nomes)     |
| `make prod-rebuild`             | Builda e sobe a imagem de produção localmente      |

O `make dev-up` sobe só o app. O container do Selenium é iniciado pelos alvos
`selenium-*-ui`, quando necessário.

## Debug

O frontend é depurado no navegador: em dev, o Vite serve os módulos com source
maps, então os breakpoints vão direto nos `.tsx` pela aba *Sources* do DevTools
(ou pela extensão React Developer Tools). Não há modo `DEBUG=1` como no backend,
porque não existe processo Node da aplicação para conectar um inspector.

## Testes de unidade

Os testes usam [Vitest](https://vitest.dev/) com Testing Library em `jsdom`, ficam
ao lado do código (`*.test.ts(x)` em `src/`) e compartilham utilitários em
`src/test/` (render com os providers da aplicação, fábricas de produto e um
roteador de respostas para simular a API).

```bash
make dev-test        # roda todos os testes uma vez, no container
make dev-test-cov    # testes + cobertura em coverage/
pnpm test:watch      # modo watch durante o desenvolvimento (no host ou via make dev-shell)
```

O `test:coverage` gera `coverage/lcov.info` (cobertura) e
`coverage/sonar-report.xml` (execução dos testes), que o workflow do SonarCloud
envia para alimentar as métricas `coverage`, `tests` e `test_execution_time`.
Componentes de biblioteca em `src/components/ui/` ficam fora da cobertura.

## Variáveis de ambiente

Crie os arquivos reais a partir dos templates:

```bash
make env-setup
```

Variáveis públicas do Vite devem usar o prefixo `VITE_`.

### Arquivos de ambiente

| Arquivo            | Quem lê                                                        | Observação                                                       |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `.env.development` | Vite em dev (`make dev-up`, `pnpm dev`) e os alvos `selenium-*` | `VITE_API_URL` aponta para a API local (porta 3001)              |
| `.env.production`  | só `make prod-*` (build local da imagem) e `selenium-prod-ui`   | Não altera o deploy: o CD usa a variável `VITE_API_URL` do GitHub |

As `VITE_*` são embutidas no bundle **no build**: em produção, mudar uma variável
exige gerar a imagem de novo. Por isso o `compose.prod.yml` não injeta nada no
container (é um nginx estático); o `.env.production` só entra pelo `--env-file`
do `Makefile`, como build-arg. Nenhum `.env.*` entra na imagem (`.dockerignore`).

`make env-check` compara as chaves dos seus arquivos com as dos `.example` e
lista o que falta ou sobra, sem mostrar valores.

## CI/CD

- **CI** (`.github/workflows/ci.yml`): em push/PR para `dev` e `main` roda lint, testes de unidade, typecheck + build e o build da imagem Docker (`runner`).
- **SonarCloud** (`.github/workflows/sonarcloud.yml`): roda `pnpm test:coverage` e envia cobertura e execução dos testes junto com a análise.
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
