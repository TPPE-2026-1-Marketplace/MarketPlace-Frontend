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

- **Desenvolvimento Local:** Use `pnpm dev` ou o Docker Compose de dev.
- **Produção:** O `Dockerfile` está configurado com multi-stage build. A primeira etapa realiza o `pnpm run build` gerando estáticos no Vite, e a segunda etapa utiliza uma imagem `nginx:alpine` superleve para servir o diretório `dist/`.

> Siga estas regras rigorosamente para manter a consistência com a decisão arquitetural da equipe!
