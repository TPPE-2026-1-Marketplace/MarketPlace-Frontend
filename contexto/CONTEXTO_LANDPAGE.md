# Contexto de Implementação — Landpage DK Fashion Marketplace

**Data de criação:** 06/06/2026  
**Responsável:** Antigravity (agente)  
**Co-autora dos commits:** Yzabella Miranda <yzabellamiranda4@gmail.com>

---

## Visão Geral do Projeto

A **DK Fashion** é um marketplace de vestidos de festa (debutante, formatura, casamento, festa geral). Este documento descreve o plano de implementação da **landpage pública (e-commerce)** do projeto, conectada ao backend NestJS já construído.

### Repositórios
- **Frontend:** `/home/analu/unb/tppe/front` — Next.js + TypeScript + Tailwind CSS
- **Backend (referência):** `/home/analu/unb/tppe/back` — NestJS + TypeORM + PostgreSQL
- **Referência de design:** `/home/analu/unb/tppe/DK Fashion (Copy)` — protótipo MVC com estilos e modelos

---

## Stack do Frontend

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **pnpm** (gerenciador de pacotes)
- **Docker** (desenvolvimento e produção)

---

## Backend — Endpoints disponíveis (base URL: `/api`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login — retorna `{ access_token }` |
| POST | `/auth/register` | Cadastro de cliente |
| GET | `/products` | Listar produtos (paginado: `?page=1&limit=20`) |
| GET | `/products/:id` | Detalhe do produto |
| GET | `/categories` | Listar categorias |
| POST | `/orders` | Criar pedido |
| GET | `/orders/:id` | Detalhe de pedido |
| GET | `/shipping/quote` | Calcular frete (Melhor Envio) |
| POST | `/coupons/validate` | Validar cupom |
| GET | `/reviews` | Avaliações de produto |
| POST | `/reviews` | Criar avaliação |

### Padrão de paginação
```json
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

### Auth
- JWT via `Authorization: Bearer <token>`
- Roles: `cliente`, `caixa`, `vendedor`, `gerente`, `administrador`
- Token armazenado no localStorage / cookie HttpOnly

---

## Design System (baseado em DK Fashion Copy)

### Paleta de Cores
- **Background:** `#111111` (dark)
- **Foreground:** `#ffffff`
- **Accent / Brand:** `#C8427C` (rosa vibrante)
- **Primary dark:** `#030213`
- **Muted:** `#888888`
- **Border:** `rgba(255,255,255,0.1)`

### Tipografia
- Fonte: **Inter** ou **Outfit** (Google Fonts — elegante e moderno)
- Tracking generoso em títulos (letter-spacing)
- Hierarquia bem definida: H1 grande, subtítulos leves

### Princípios Visuais
- Dark mode como padrão
- Glassmorphism em modais e overlays
- Micro-animações em hover (cards de produto, botões)
- Layout com grid responsivo
- Imagens de produto em destaque com efeito zoom no hover

---

## Arquitetura do Frontend

Segue a arquitetura MVC definida no projeto de referência:

```
front/src/
├── app/                    # Next.js App Router
│   ├── (public)/           # Rotas públicas (landpage)
│   │   ├── page.tsx        # Home
│   │   ├── produtos/       # Catálogo de produtos
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── carrinho/page.tsx
│   │   ├── checkout/page.tsx
│   │   └── conta/page.tsx
│   ├── api/                # Route handlers (proxy/BFF opcional)
│   ├── globals.css
│   └── layout.tsx
├── components/             # Componentes reutilizáveis
│   ├── ui/                 # Primitivos (Button, Input, Badge...)
│   ├── layout/             # Header, Footer, Nav
│   └── sections/           # Seções da home (Hero, Featured, etc.)
├── lib/                    # Utilitários
│   ├── api.ts              # Cliente HTTP (fetch wrapper)
│   └── utils.ts            # Helpers gerais
├── models/                 # Tipos e interfaces TypeScript
│   ├── product.model.ts
│   ├── order.model.ts
│   ├── cart.model.ts
│   └── user.model.ts
├── services/               # Lógica de chamada à API
│   ├── product.service.ts
│   ├── auth.service.ts
│   ├── order.service.ts
│   └── cart.service.ts
└── hooks/                  # React hooks customizados
    ├── useCart.ts
    ├── useAuth.ts
    └── useProducts.ts
```

---

## Páginas a Implementar

### 1. Home (Landpage)
- Hero section com imagem principal + CTA
- Seção "Em Destaque" (produtos `featured: true`)
- Seção de Categorias (debutante, formatura, casamento, festa)
- Banner de promoção / novidades
- Seção de Avaliações (reviews)
- Footer com links e contato

### 2. Catálogo de Produtos (`/produtos`)
- Grid de produtos com filtros (categoria, tipo, faixa de preço)
- Paginação
- Search bar
- Card de produto com hover animation

### 3. Detalhe do Produto (`/produtos/[id]`)
- Galeria de imagens
- Seleção de tamanho e cor
- Cálculo de frete por CEP
- Botão "Adicionar ao Carrinho"
- Avaliações e nota média

### 4. Carrinho (`/carrinho`)
- Lista de itens
- Subtotal + frete
- Campo de cupom
- Botão para ir ao checkout

### 5. Checkout (`/checkout`)
- Formulário de endereço
- Seleção de método de pagamento (PIX, cartão de crédito)
- Resumo do pedido
- Confirmação

### 6. Conta do Cliente (`/conta`)
- Login / cadastro (modal ou página dedicada)
- Histórico de pedidos
- Dados pessoais

---

## Passos de Implementação

> **Instrução de commit:** Cada commit deve seguir Conventional Commits e incluir co-autoria:
> ```
> Co-authored-by: Yzabella <yzabellamiranda4@gmail.com>
> ```

---

### ETAPA 1 — Fundação: Design System e Estrutura Base ✅

- [x] **1.1** Configurar `globals.css` com tokens de cor, tipografia e variáveis CSS do dark mode
- [x] **1.2** Instalar dependências: `lucide-react`, `clsx`, `tailwind-merge`
- [x] **1.3** Criar `src/lib/utils.ts` (helper `cn()` para classnames)
- [x] **1.4** Criar `src/lib/api.ts` — cliente HTTP com base URL do backend e interceptor de token
- [x] **1.5** Criar modelos TypeScript em `src/models/` (Product, Order, Cart, User)
- [x] **1.6** Atualizar `src/app/layout.tsx` com fonte Google Fonts (Inter/Outfit), metadata SEO global

**Commit:** `feat(foundation): design system, tipos e cliente HTTP` ✅ `bcbaa90`

---

### ETAPA 2 — Componentes de Layout ✅

- [x] **2.1** Criar `src/components/layout/Header.tsx` — navbar com logo, nav links, ícone carrinho (badge), botão login
- [x] **2.2** Criar `src/components/layout/Footer.tsx` — links, redes sociais, contato
- [x] **2.3** Criar `src/components/ui/Button.tsx` — variantes: primary, secondary, ghost, outline
- [x] **2.4** Criar `src/components/ui/Badge.tsx` — para categorias, status
- [x] **2.5** Criar `src/components/ui/Input.tsx` — campo de texto estilizado
- [x] **2.6** Atualizar `src/app/layout.tsx` para incluir Header e Footer globais

**Commit:** `feat(layout): header, footer e componentes UI base` ✅ `8d6c41d`

---

### ETAPA 3 — Serviços e Hooks ✅

- [x] **3.1** Criar `src/services/product.service.ts` — `getProducts()`, `getProductById()`, `getFeaturedProducts()`, `getCategories()`
- [x] **3.2** Criar `src/services/auth.service.ts` — `login()`, `register()`, `logout()`, `getSession()`
- [x] **3.3** Criar `src/services/cart.service.ts` — lógica de carrinho (localStorage-only conforme decisão do backend)
- [x] **3.4** Criar `src/services/order.service.ts` — `createOrder()`, `getOrder()`
- [x] **3.5** Criar `src/hooks/useCart.ts` — hook com estado do carrinho (add, remove, clear, total)
- [x] **3.6** Criar `src/hooks/useAuth.ts` — hook com estado de autenticação (user, login, logout)
- [x] **3.7** Criar `src/hooks/useProducts.ts` — hook de busca e filtros de produtos

**Commit:** `feat(services): serviços HTTP e hooks de estado` ✅ `6bddd81`

---

### ETAPA 4 — Página Home (Landpage) ✅

- [x] **4.1** Criar `src/components/sections/HeroSection.tsx` — hero com imagem em fullscreen, título impactante, CTA "Ver Coleção"
- [x] **4.2** Criar `src/components/sections/FeaturedProducts.tsx` — carrossel/grid de produtos em destaque (dados do backend)
- [x] **4.3** Criar `src/components/sections/CategorySection.tsx` — cards de categoria (debutante, formatura, casamento, festa)
- [x] **4.4** Criar `src/components/sections/ReviewsSection.tsx` — avaliações de clientes com estrelas
- [x] **4.5** Criar `src/components/sections/PromoSection.tsx` — banner promocional
- [x] **4.6** Montar `src/app/page.tsx` com todas as seções acima
- [x] **4.7** Gerar imagens para o hero e seções com generate_image

**Commit:** `feat(home): landpage com hero, destaques, categorias e reviews` ✅ `b943be3`

---

### ETAPA 5 — Catálogo de Produtos ✅

- [x] **5.1** Criar `src/components/ui/ProductCard.tsx` — card com imagem, nome, preço, hover animation
- [x] **5.2** Criar `src/components/ui/ProductFilters.tsx` — filtros laterais (categoria, tipo, preço)
- [x] **5.3** Criar `src/components/ui/Pagination.tsx` — navegação de páginas
- [x] **5.4** Criar `src/app/(public)/produtos/page.tsx` — página de catálogo com grid + filtros
- [x] **5.5** Conectar ao backend: `GET /api/products` com query params de filtro e paginação

**Commit:** `feat(catalog): catálogo de produtos com filtros e paginação` ✅

---

### ETAPA 6 — Detalhe do Produto ✅

- [x] **6.1** Criar `src/components/ui/ImageGallery.tsx` — galeria de imagens com thumbnails
- [x] **6.2** Criar `src/components/ui/SizeSelector.tsx` — seleção de tamanho
- [x] **6.3** Criar `src/components/ui/ColorSelector.tsx` — seleção de cor
- [x] **6.4** Criar `src/components/ui/ShippingCalculator.tsx` — input de CEP + chamada ao backend
- [x] **6.5** Criar `src/app/(public)/produtos/[id]/page.tsx` — página de detalhe do produto
- [x] **6.6** Conectar ao backend: `GET /api/products/:id`, `GET /api/shipping/quote`

**Commit:** `feat(product-detail): página de detalhe com galeria, variantes e frete` ✅

---

### ETAPA 7 — Carrinho

- [ ] **7.1** Criar `src/components/ui/CartItem.tsx` — item do carrinho (imagem, nome, variante, preço, quantidade)
- [ ] **7.2** Criar `src/components/ui/CartDrawer.tsx` — drawer lateral do carrinho (abre ao clicar no ícone)
- [ ] **7.3** Criar `src/app/(public)/carrinho/page.tsx` — página completa do carrinho
- [ ] **7.4** Implementar campo de cupom com chamada a `POST /api/coupons/validate`
- [ ] **7.5** Calcular totais (subtotal, frete, desconto, total)

**Commit:** `feat(cart): carrinho com drawer, cupom e cálculo de totais`

---

### ETAPA 8 — Checkout

- [ ] **8.1** Criar `src/components/checkout/AddressForm.tsx` — formulário de endereço com ViaCEP
- [ ] **8.2** Criar `src/components/checkout/PaymentSelector.tsx` — seleção PIX / cartão de crédito
- [ ] **8.3** Criar `src/components/checkout/OrderSummary.tsx` — resumo do pedido
- [ ] **8.4** Criar `src/app/(public)/checkout/page.tsx` — página de checkout
- [ ] **8.5** Conectar ao backend: `POST /api/orders`
- [ ] **8.6** Página de confirmação de pedido

**Commit:** `feat(checkout): fluxo de checkout com endereço e pagamento`

---

### ETAPA 9 — Autenticação e Conta

- [ ] **9.1** Criar `src/components/auth/LoginModal.tsx` — modal de login com glassmorphism
- [ ] **9.2** Criar `src/components/auth/RegisterModal.tsx` — modal de cadastro
- [ ] **9.3** Criar `src/app/(public)/conta/page.tsx` — área do cliente (pedidos, dados)
- [ ] **9.4** Conectar ao backend: `POST /api/auth/login`, `POST /api/auth/register`
- [ ] **9.5** Implementar middleware de proteção de rota para `/conta` e `/checkout`

**Commit:** `feat(auth): login, cadastro e área do cliente`

---

### ETAPA 10 — Polimento e SEO

- [ ] **10.1** Adicionar metadata SEO em cada página (`title`, `description`, `og:image`)
- [ ] **10.2** Implementar loading states (skeletons) para listas de produtos
- [ ] **10.3** Implementar error boundaries e páginas de erro (404, 500)
- [ ] **10.4** Otimizar imagens (next/image com lazy loading)
- [ ] **10.5** Revisar responsividade (mobile-first)
- [ ] **10.6** Testar fluxo completo (home → produto → carrinho → checkout)

**Commit:** `chore(polish): SEO, loading states, erros e responsividade`

---

## Convenções de Commit

Seguir **Conventional Commits** com co-autoria:

```
feat(escopo): descrição curta da mudança

Co-authored-by: Yzabella <yzabellamiranda4@gmail.com>
```

Escopos possíveis: `foundation`, `layout`, `services`, `home`, `catalog`, `product-detail`, `cart`, `checkout`, `auth`, `polish`

---

## Observações Importantes

1. **Carrinho é frontend-only** — O backend espera a lista de itens pronta no `POST /api/orders`. Usar `localStorage` para persistência do carrinho.
2. **Imagens de produto** — Serão carregadas das URLs retornadas pelo backend (campo `url` da entidade `Image`). Usar `next/image` com domínios externos permitidos.
3. **Variáveis de ambiente** — `NEXT_PUBLIC_API_URL` já configurada em `.env.development`.
4. **Tokens CSS** — Priorizar variáveis CSS (`--color-accent`, etc.) ao invés de valores fixos no Tailwind.
5. **Mobile first** — Toda seção deve ser responsiva; usar breakpoints do Tailwind (`sm:`, `md:`, `lg:`).
6. **Não mexer no backend** — Este documento e toda a implementação estão restritos à pasta `front/`.
