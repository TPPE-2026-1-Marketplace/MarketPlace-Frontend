# Testes E2E com Selenium

A suíte usa `selenium-webdriver`, Google Chrome e o test runner nativo do Node.js.
Os testes são headless por padrão e não enviam login, checkout, pedidos, vendas de
PDV ou alterações administrativas.

## Comandos

Na raiz do projeto:

```bash
make selenium-local      # Chrome no host contra o front local
make selenium-prod       # Chrome no host contra a produção
make selenium-local-ui   # Chrome no container (noVNC) contra o front local
make selenium-prod-ui    # Chrome no container (noVNC) contra a produção
```

Os quatro alvos chamam `scripts/selenium.sh <modo>`, que concentra a lógica:
carrega o `.env` do modo (`.env.development` nos modos locais,
`.env.production` nos de produção), espera os serviços responderem e aplica os
padrões do modo visual. As variáveis do shell (ou `make alvo VAR=valor`) têm
prioridade sobre as do `.env`, que têm prioridade sobre os padrões do script.

`make selenium-local` espera que o Vite esteja disponível em
`http://localhost:3000`. Inicie-o com Docker:

```bash
make dev-up
```

O modo visual local sobe o serviço `selenium/standalone-chrome`, usa o front do
mesmo Compose pelo alias interno `http://app.internal:3000` e disponibiliza:

- WebDriver: `http://localhost:4444`
- noVNC: `http://localhost:7900/?autoconnect=1&resize=scale&password=secret`

Os modos de produção (`make selenium-prod` e `make selenium-prod-ui`) usam por
padrão a URL pública do front em
`https://marketplace-frontend-jh71.onrender.com/`. O `selenium-prod-ui` sobe apenas o Selenium
remoto local com noVNC e executa a suíte em modo visual contra a produção.
Abra para acompanhar o navegador:

```bash
http://localhost:7900/?autoconnect=1&resize=scale&password=secret
```

## Variáveis de ambiente

- `SELENIUM_BASE_URL`: URL alvo. Sobrescreve a URL padrão do modo (local ou
  produção).
- `HEADLESS`: use `false` para abrir o navegador; o padrão é `true`.
- `SELENIUM_REMOTE_URL`: servidor WebDriver remoto, usado pelo modo visual.
- `SELENIUM_TIMEOUT_MS`: timeout dos waits explícitos em milissegundos; padrão
  `15000`.
- `CHROME_BINARY`: caminho opcional para um binário específico do Chrome.
- `SELENIUM_STEP_DELAY_MS`: pausa entre cenários no modo visual.
- `SELENIUM_HOLD_OPEN_MS`: tempo que o navegador permanece aberto ao final.
- `SELENIUM_CHECKOUT_PAYMENT_HOLD_MS`: tempo que o navegador fica no
  checkout externo antes de voltar para a tela de pedido recebido da loja;
  padrão `8000` no `make selenium-prod-ui` e `5000` no runner direto.
- `SELENIUM_ADMIN_EMAIL` e `SELENIUM_ADMIN_PASSWORD`: administrador criado pelo
  `make demo` do backend.
- `SELENIUM_PROD_ADMIN_EMAIL` e `SELENIUM_PROD_ADMIN_PASSWORD`: credenciais do
  administrador de produção usadas quando `SELENIUM_ENV=production`.
- `SELENIUM_MANAGER_EMAIL` e `SELENIUM_MANAGER_PASSWORD`: gerente local
  opcional; o cenário é ignorado quando não estão definidos.
- `SELENIUM_ALLOW_CHECKOUT_PAYMENT`: use `true` apenas quando quiser que o
  fluxo de checkout crie pedido, siga (na mesma aba) para o checkout externo de
  pagamento e volte para a tela de pedido recebido. O `make selenium-prod-ui`
  ativa esse fluxo por padrão para demonstração visual. O teste não clica em
  pagar dentro do checkout externo.
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
Para `make selenium-prod` e `make selenium-prod-ui`, defina
`SELENIUM_PROD_ADMIN_EMAIL` e `SELENIUM_PROD_ADMIN_PASSWORD` no
`.env.production` ou no shell antes de chamar o alvo.

Exemplo para depuração:

```bash
make selenium-local HEADLESS=false
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
- fluxo de cliente por carrinho e checkout em página única (dados de contato,
  entrega e pagamento);
- redirecionamento para o checkout externo de pagamento e retorno para a tela
  de pedido recebido quando `SELENIUM_ALLOW_CHECKOUT_PAYMENT=true`;
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
- `make selenium-prod` e `make selenium-prod-ui` usam
  `https://marketplace-frontend-jh71.onrender.com/` quando `SELENIUM_BASE_URL`
  não foi definida no shell nem no `.env.production`.
- O Selenium Manager pode precisar de acesso à rede na primeira execução para
  resolver um driver compatível com o Chrome instalado.
