# Testes E2E com Selenium

A suíte usa `selenium-webdriver`, Google Chrome e o test runner nativo do Node.js.
Os testes são headless por padrão e não enviam login, checkout, pedidos, vendas de
PDV ou alterações administrativas.

## Comandos

Na raiz do projeto:

```bash
SELENIUM_BASE_URL=https://url-publica-da-loja.example make selenium
make selenium-local
make selenium-local-ui
make selenium-prod-ui
```

`make selenium-local` espera que o Vite esteja disponível em
`http://localhost:3000`. Inicie-o com Docker:

```bash
make dev-up
```

Também é possível executar os mesmos targets dentro de `front`.

O modo visual local sobe o serviço `selenium/standalone-chrome`, usa o front do
mesmo Compose pelo alias interno `http://app.internal:3000` e disponibiliza:

- WebDriver: `http://localhost:4444`
- noVNC: `http://localhost:7900/?autoconnect=1&resize=scale&password=secret`

`make selenium-prod-ui` usa por padrão a URL pública do front em
`https://marketplace-frontend-jh71.onrender.com/`, sobe apenas o Selenium
remoto local com noVNC e executa a suíte em modo visual contra a produção.
Abra para acompanhar o navegador:

```bash
http://localhost:7900/?autoconnect=1&resize=scale&password=secret
```

## Variáveis de ambiente

- `SELENIUM_BASE_URL`: URL alvo. É obrigatória em produção e pode sobrescrever a
  URL local.
- `HEADLESS`: use `false` para abrir o navegador; o padrão é `true`.
- `SELENIUM_REMOTE_URL`: servidor WebDriver remoto, usado pelo modo visual.
- `SELENIUM_TIMEOUT_MS`: timeout dos waits explícitos em milissegundos; padrão
  `15000`.
- `CHROME_BINARY`: caminho opcional para um binário específico do Chrome.
- `SELENIUM_STEP_DELAY_MS`: pausa entre cenários no modo visual.
- `SELENIUM_HOLD_OPEN_MS`: tempo que o navegador permanece aberto ao final.
- `SELENIUM_CHECKOUT_PAYMENT_HOLD_MS`: tempo que o navegador fica na aba do
  checkout externo antes de fechar e voltar para a loja; padrão `8000` no
  `make selenium-prod-ui` e `5000` no runner direto.
- `SELENIUM_ADMIN_EMAIL` e `SELENIUM_ADMIN_PASSWORD`: administrador criado pelo
  `make demo` do backend.
- `SELENIUM_PROD_ADMIN_EMAIL` e `SELENIUM_PROD_ADMIN_PASSWORD`: credenciais do
  administrador de produção usadas quando `SELENIUM_ENV=production`.
- `SELENIUM_MANAGER_EMAIL` e `SELENIUM_MANAGER_PASSWORD`: gerente local
  opcional; o cenário é ignorado quando não estão definidos.
- `SELENIUM_ALLOW_CHECKOUT_PAYMENT`: use `true` apenas quando quiser que o
  fluxo de checkout crie pedido, abra o checkout externo de pagamento em uma
  nova aba e volte para a loja. O `make selenium-prod-ui` ativa esse fluxo por
  padrão para demonstração visual. O teste não clica em pagar dentro do checkout
  externo.
- `SELENIUM_ALLOW_ADMIN_MUTATIONS`: permite que o admin crie um produto com
  imagem e um usuário operacional. Use `true` para ativar. Esse cenário grava
  dados reais no backend e fica desativado por padrão.
- `SELENIUM_ADMIN_MUTATION_ROLE`: perfil do usuário operacional criado pelo
  cenário administrativo; use `cashier` ou `manager`. O padrão é `cashier`.
- `SELENIUM_ADMIN_PRODUCT_IMAGE_URL`: URL da imagem usada no produto criado
  pelo cenário administrativo.
- `SELENIUM_ADMIN_MUTATION_STEP_DELAY_MS`: pausa visual entre as etapas do
  cenário administrativo; padrão `1000` no `make selenium-prod-ui`.

No ambiente demo/local, `SELENIUM_ADMIN_EMAIL` deve corresponder ao administrador
criado por `make demo` e `SELENIUM_ADMIN_PASSWORD` deve usar a senha demo
`admin123`. Essas credenciais devem existir somente em `.env.development`.
Não as copie para `.env.production`: em produção, informe apenas a URL segura
por `SELENIUM_BASE_URL` e use uma estratégia de credenciais própria do ambiente.
Para `make selenium-prod-ui`, defina `SELENIUM_PROD_ADMIN_EMAIL` e
`SELENIUM_PROD_ADMIN_PASSWORD` no ambiente do shell ou no carregador de
variáveis que você já usa antes de chamar o alvo.

Exemplo para depuração:

```bash
HEADLESS=false make selenium-local
```

`make selenium-local-ui` inicia sem pausa artificial, pausa 1,5 segundo
entre cenários e mantém o Chrome aberto por 30 segundos após o resultado. Esses
valores podem ser ajustados:

```bash
make selenium-local-ui \
  SELENIUM_UI_START_DELAY=20 \
  SELENIUM_UI_STEP_DELAY_MS=3000 \
  SELENIUM_UI_HOLD_OPEN_MS=60000
```

## Cobertura

- carregamento da home e da vitrine;
- listagem de produtos, estado vazio e filtro por categoria;
- detalhe de produto, nome e imagem;
- inclusão no carrinho armazenado no navegador, quando existe produto;
- fluxo de cliente por carrinho, dados pessoais, endereço e preparação do
  checkout de pagamento;
- abertura do checkout externo de pagamento e retorno para a loja quando
  `SELENIUM_ALLOW_CHECKOUT_PAYMENT=true`;
- abertura do formulário de autenticação sem uso de credenciais;
- bloqueio seguro da área de gestão para usuário anônimo;
- redirecionamento seguro do PDV para login;
- login do administrador demo e seleção do módulo de gestão;
- login do administrador de produção quando `SELENIUM_ENV=production` e as
  credenciais `SELENIUM_PROD_*` estão configuradas;
- navegação somente leitura por estoque, pedidos, relatórios, comissões e
  cupons;
- criação autenticada de produto com imagem e usuário operacional quando
  `SELENIUM_ALLOW_ADMIN_MUTATIONS=true`;
- abertura autenticada do PDV sem iniciar venda;
- validação básica das permissões do gerente, quando houver credenciais.

## Limitações

- Produto, detalhe e carrinho dependem do endpoint de catálogo configurado no
  ambiente. Se o catálogo estiver vazio ou indisponível, o cenário dependente de
  produto é marcado como `SKIP`, enquanto o estado vazio continua validado.
- A suíte autentica somente usuários demo configurados e não executa operações
  de escrita no backend.
- O cenário de produção só roda com credenciais explícitas de produção e não
  usa `SELENIUM_ADMIN_*` quando `SELENIUM_ENV=production`.
- A tela de gestão de usuários não faz parte da cobertura remota por ainda ser
  um módulo parcialmente em desenvolvimento.
- `make selenium` continua exigindo `SELENIUM_BASE_URL`; `make selenium-prod-ui`
  usa `https://marketplace-frontend-jh71.onrender.com/` como fallback quando a
  variável não foi definida no ambiente.
- O Selenium Manager pode precisar de acesso à rede na primeira execução para
  resolver um driver compatível com o Chrome instalado.
