# CLAUDE.md — Marketplace Frontend (DK Fashion)

Diretrizes e convenções de código para o desenvolvimento do Frontend.

---

## Stack Atual

- **React 18** (Single Page Application pura)
- **Vite** como bundler principal
- **TypeScript 5**
- **Tailwind CSS** para estilização
- **React Router DOM** para roteamento client-side
- **pnpm** como gerenciador de pacotes
- Docker + Nginx para servir arquivos estáticos (`dist/`) em produção

---

## Restrições de Arquitetura (Extremamente Importante)

1. **APENAS VIEW (MVC)**: O frontend representa EXCLUSIVAMENTE a camada "View" (V) da arquitetura MVC.
2. **SEM MODELS**: É proibido criar ou manter uma pasta `src/models`. As interfaces e tipagens devem ser definidas onde são consumidas ou em pastas `types/`.
3. **SEM SERVICES**: É proibido criar ou manter uma pasta `src/services`. Toda a lógica de negócio e as requisições para a API devem ser feitas DIRETAMENTE pelos **Hooks** ou componentes através do cliente HTTP central (`src/lib/api.ts`).
4. **Sem Next.js**: O framework Next.js foi removido. **NÃO utilize** componentes como `next/image` ou `next/link`.
   - Use `<img>` ao invés de `<Image>`.
   - Use `<Link to="...">` (do `react-router-dom`) ao invés de `<Link href="...">` (do Next).
   - Use `useNavigate()` ao invés de `useRouter()`.

---

## Variáveis de Ambiente

Como estamos utilizando Vite, todas as variáveis de ambiente que precisarem ser acessadas pelo código rodando no navegador (client-side) devem OBRIGATORIAMENTE começar com o prefixo `VITE_` (ex: `VITE_LOGIN_CLIENTE`, `VITE_API_URL`).

O uso do antigo prefixo `NEXT_PUBLIC_` não funcionará.

---

## Infraestrutura e Execução

- **Desenvolvimento Local:** Use `make dev-up` (Docker) ou `make dev` (host). `make help` lista todos os comandos, com os mesmos nomes do backend; testes e checagens com `make dev-test` / `make dev-ci`.
- **Produção:** O `Dockerfile` está configurado com multi-stage build. A primeira etapa realiza o `pnpm run build` gerando estáticos no Vite, e a segunda etapa utiliza uma imagem `nginx:alpine` superleve para servir o diretório `dist/`.
- **Setup, variáveis de ambiente e CI/CD:** ver `README.md`. Testes E2E: `tests/selenium/README.md`.

### Ambiente Docker de desenvolvimento

O código é montado no container por bind mount e o `node_modules` fica em um volume
próprio. Por isso, alterar código em `src/` aparece na hora (hot reload), sem rebuild.

| Situação | Comando |
| --- | --- |
| Mudou código, estilos ou componentes | nada: o Vite recarrega sozinho |
| Mudou `Dockerfile`, `package.json` ou `pnpm-lock.yaml` | `make dev-rebuild` |
| Ambiente inconsistente (dependências quebradas, volume velho) | `make dev-reset` e depois `make dev-rebuild` |

`make dev-reset` apaga os volumes (inclusive o `node_modules`). Instale dependências
**dentro do container** (`make dev-shell` e `pnpm add ...`): rodar `pnpm install` no
host gera um `node_modules` diferente do usado pelo container.

Em produção não há hot reload: o código é empacotado na imagem no build, e mudar
uma variável `VITE_*` exige gerar a imagem de novo.

> Siga estas regras rigorosamente para manter a consistência com a decisão arquitetural da equipe!
