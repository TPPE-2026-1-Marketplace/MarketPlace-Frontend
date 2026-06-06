# CLAUDE.md — Marketplace Frontend (DK Fashion)

Convenções de código e arquitetura do frontend. Para plano de entrega, equipe e
datas, ver `DOCS.md`.

---

## Stack

- **React 19** + **TypeScript 5.9** + **Vite 6**
- **Tailwind CSS v4** via `@tailwindcss/vite` (sem `tailwind.config.*` nem `postcss.config.*`)
- **ESLint 9** (flat config) + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh`
- **Prettier** para formatação
- **pnpm 10** + Node 22 Alpine + Docker Compose + **Nginx** (produção)

### Dependências que NÃO usar

- `next` / `remix` / qualquer framework SSR (projeto é SPA puro)
- `moment` (use `date-fns` se precisar manipular datas)
- `axios` (use `fetch` nativo ou `ky` se precisar de interceptors)
- `class-validator` / `class-transformer`

---

## Estrutura de pastas

```
src/
├── main.tsx          # entry point — createRoot
├── App.tsx           # componente raiz / roteamento
├── index.css         # estilos globais + @import "tailwindcss"
├── vite-env.d.ts     # tipos Vite (imports CSS, import.meta.env)
├── components/       # componentes reutilizáveis
│   └── ui/           # primitivos de UI (Button, Input, Modal…)
├── pages/            # uma pasta por rota
│   └── Home/
│       ├── index.tsx
│       └── Home.module.css   # CSS Modules se necessário
├── hooks/            # custom hooks
├── services/         # chamadas à API (fetch wrappers)
├── types/            # interfaces e types compartilhados
└── utils/            # helpers puros (sem efeitos colaterais)
```

> Crie a pasta apenas quando houver o segundo arquivo. Não criar profilaticamente.

---

## Convenções de código

- **Componentes:** `PascalCase`, arquivo `.tsx`. Um componente por arquivo.
- **Hooks:** prefixo `use`, arquivo `camelCase.ts` (ex.: `useAuth.ts`).
- **Serviços:** sufixo `Service`, arquivo `camelCase.ts` (ex.: `authService.ts`).
- **Types/Interfaces:** `PascalCase`, prefixo `I` apenas para interfaces de serviço.
- **CSS:** Tailwind utilitários inline + CSS Modules para estilos específicos de componente.
  Evitar `style={{}}` inline exceto para valores dinâmicos (ex.: largura calculada).
- **Sem magic numbers:** extrair constantes em `src/utils/constants.ts`.
- **`export default`** para componentes de página; **named exports** para utilitários e hooks.

### Variáveis de ambiente

- Prefixo **`VITE_`** obrigatório para expor variáveis ao browser (ex.: `VITE_API_URL`).
- Acessar via `import.meta.env.VITE_*` — nunca `process.env`.
- Declarar novos tipos em `src/vite-env.d.ts`:
  ```ts
  interface ImportMetaEnv {
    readonly VITE_API_URL: string
  }
  ```

---

## Docker

### Desenvolvimento

```
base → deps → dev (Vite HMR na porta 3000)
```

- Vite HMR funciona nativamente no Docker — **sem polling** (`CHOKIDAR_USEPOLLING` não é necessário).
- `node_modules` é volume nomeado — **não rodar `pnpm install` no host** (gera divergência).
  Instalar dependências dentro do container:
  ```bash
  make dev-shell
  pnpm add <pacote>
  ```
  Depois de adicionar, rode `make dev-rebuild` para sincronizar o lockfile na imagem.

### Produção

```
build (Node/Vite) → runner (Nginx, porta 80)
```

- `pnpm build` gera `dist/` estático; **Nginx** serve os arquivos — sem Node.js em runtime.
- SPA fallback: toda rota não-encontrada retorna `index.html` (configurado em `nginx.conf`).
- Health check: `GET /health` retornado diretamente pelo Nginx (sem chamada ao backend).
- Assets com hash no nome (ex.: `index-D4rCX8b.js`) têm cache agressivo de 1 ano.

---

## Comandos do projeto

```bash
make dev-up           # sobe Docker dev (porta APP_PORT no .env.development)
make dev-down         # derruba o ambiente
make dev-restart      # reinicia sem rebuild
make dev-logs         # acompanha todos os logs
make dev-logs-app     # logs só da aplicação
make dev-shell        # shell no container
make dev-rebuild      # build + sobe (necessário após mudar package.json)
make dev-reset        # derruba tudo e remove volumes (limpa node_modules e dist)
```

**Qualidade de código (dentro do container):**

```bash
make dev-lint         # ESLint sem fix
make dev-lint-fix     # ESLint com auto-fix
make dev-format       # Prettier write
make dev-typecheck    # tsc --noEmit
make dev-check        # lint + typecheck + format:check (espelha CI)
```

**Produção:**

```bash
make prod-image       # builda imagem marketplace-frontend:local (Nginx)
make prod-rebuild     # builda e sobe ambiente de produção
```

> ⚠️ **Porta ocupada?** Se a porta 3000 já estiver em uso por outro projeto,
> edite `APP_PORT` no `.env.development` (ex.: `APP_PORT=3001`) antes de
> rodar `make dev-up`. O valor padrão está documentado em
> `.env.development.example`.

---

## Lint, format e tipagem

```bash
# Dentro do container (make dev-shell):
pnpm lint           # ESLint flat config (eslint.config.mjs)
pnpm lint:fix       # ESLint + auto-fix
pnpm format         # Prettier write em src/**/*.{ts,tsx,js,jsx,json,css,md}
pnpm format:check   # Prettier check (sem write) — usado pelo CI
pnpm typecheck      # tsc --noEmit
```

**Configuração:**
- ESLint flat config em `eslint.config.mjs` — regras: `react-hooks/recommended` + `react-refresh/only-export-components`.
- Prettier em `.prettierrc.json` (se existir) — defaults do Prettier caso contrário.

---

## Integração com o Backend

- URL base da API: `import.meta.env.VITE_API_URL` (definida em `.env.development`).
- **Nunca commitar** valores reais de `.env.development` / `.env.production`.
  Usar apenas os `.example` como referência.
- Para gerar o contrato da API (OpenAPI/Swagger): rodar `make dev-openapi` no **backend**
  (`back/`). O schema gerado pode ser usado para tipagem dos responses.

---

## CI/CD

Pipeline espelhado pelo `make dev-ci`:

```
pnpm lint && pnpm typecheck && pnpm format:check && pnpm build
```

- `make prod-image` espelha o CD — builda a imagem de produção Nginx localmente.
- A imagem de produção **não** contém `node_modules` — apenas os arquivos estáticos
  de `dist/` copiados para o Nginx.

---

## Convenções de commit

Conventional Commits no título: `feat(home):`, `fix(cart):`, `chore(deps):`.
Fechar issues via commit: `feat(auth): adicionar tela de login (closes #12)`.
