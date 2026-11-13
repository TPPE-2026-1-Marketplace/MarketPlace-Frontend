#!/usr/bin/env bash
# Roda a suíte Selenium (tests/selenium) em um dos quatro modos abaixo.
# Chamado pelos alvos selenium-* do Makefile, que passam o comando do Compose
# de dev em $COMPOSE. Uso: bash scripts/selenium.sh <modo>
#
#   local      Chrome no host contra o front local (precisa de `make dev-up`)
#   prod       Chrome no host contra a produção
#   local-ui   Chrome no container (acompanhe pelo noVNC) contra o front local
#   prod-ui    Chrome no container (acompanhe pelo noVNC) contra a produção
#
# Precedência das variáveis: shell (ou `make alvo VAR=valor`) > arquivo .env
# do modo > padrão deste script. As variáveis lidas pelos testes estão
# documentadas em tests/selenium/README.md.
set -euo pipefail

: "${COMPOSE:=docker compose}"

# Padrões dos endereços. Podem ser sobrescritos pelo shell.
LOCAL_URL="${SELENIUM_LOCAL_URL:-http://localhost:3000}"
PROD_URL="${SELENIUM_PROD_URL:-https://marketplace-frontend-jh71.onrender.com/}"
REMOTE_URL="${SELENIUM_REMOTE_URL:-http://localhost:4444}"
NOVNC_URL="${SELENIUM_NOVNC_URL:-http://localhost:7900/?autoconnect=1&resize=scale&password=secret}"

die() {
  echo "ERRO: $*" >&2
  exit 2
}

# Exporta as linhas NOME=valor de um .env, pulando as variáveis que já vieram
# do shell (o shell tem prioridade). Aspas em volta do valor são removidas.
load_env() {
  local file="$1" line key value
  [ -f "$file" ] || die "$file não existe (rode make env-setup)."
  while IFS= read -r line || [ -n "$line" ]; do
    [[ $line =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]%$'\r'}"
    [ -n "${!key+definida}" ] && continue
    if [[ $value =~ ^\"(.*)\"$ || $value =~ ^\'(.*)\'$ ]]; then
      value="${BASH_REMATCH[1]}"
    fi
    export "$key=$value"
  done < "$file"
}

# Espera uma URL responder, tentando uma vez por segundo.
wait_for() {
  local url="$1" name="$2" attempts="$3" i
  echo "Aguardando $name em $url..."
  for ((i = 1; i <= attempts; i++)); do
    curl --fail --silent --output /dev/null "$url" && return 0
    sleep 1
  done
  die "$name indisponível em $url."
}

# Sobe o Chrome remoto (selenium/standalone-chrome) e espera o WebDriver.
# Recebe flags extras do `compose up` (ex.: --no-deps).
start_remote_browser() {
  $COMPOSE up --detach --force-recreate "$@" selenium
  wait_for "$REMOTE_URL/status" "Selenium" 90

  # Valores do modo visual: mais lentos que os do runner, para dar tempo de
  # acompanhar o navegador.
  export SELENIUM_REMOTE_URL="$REMOTE_URL"
  export HEADLESS=false
  export SELENIUM_STEP_DELAY_MS="${SELENIUM_UI_STEP_DELAY_MS:-1500}"
  export SELENIUM_HOLD_OPEN_MS="${SELENIUM_UI_HOLD_OPEN_MS:-30000}"

  local start_delay="${SELENIUM_UI_START_DELAY:-0}"
  echo "Abra para acompanhar o navegador:"
  echo "$NOVNC_URL"
  echo "Os testes iniciam em $start_delay segundos."
  sleep "$start_delay"
}

run_tests() {
  exec pnpm test:selenium
}

mode="${1:-}"
case "$mode" in
  local)
    load_env .env.development
    export SELENIUM_ENV=local
    export SELENIUM_BASE_URL="${SELENIUM_BASE_URL:-$LOCAL_URL}"
    curl --fail --silent --output /dev/null "$SELENIUM_BASE_URL" ||
      die "front indisponível em $SELENIUM_BASE_URL. Inicie com make dev-up."
    ;;

  prod)
    load_env .env.production
    export SELENIUM_ENV=production
    export SELENIUM_BASE_URL="${SELENIUM_BASE_URL:-$PROD_URL}"
    ;;

  local-ui)
    load_env .env.development
    export SELENIUM_ENV=local
    export SELENIUM_BASE_URL="${SELENIUM_BASE_URL:-$LOCAL_URL}"
    $COMPOSE up --detach app
    wait_for "$SELENIUM_BASE_URL" "front" 60
    start_remote_browser
    # O Chrome roda no container: "localhost" precisa apontar para o host.
    SELENIUM_HOST_GATEWAY="$($COMPOSE exec -T selenium getent hosts host.docker.internal | awk 'NR == 1 { print $1 }')"
    export SELENIUM_HOST_GATEWAY
    ;;

  prod-ui)
    load_env .env.production
    export SELENIUM_ENV=production
    export SELENIUM_BASE_URL="${SELENIUM_BASE_URL:-$PROD_URL}"
    # Demonstração visual: segue até o checkout externo de pagamento.
    export SELENIUM_ALLOW_CHECKOUT_PAYMENT="${SELENIUM_ALLOW_CHECKOUT_PAYMENT:-true}"
    export SELENIUM_CHECKOUT_PAYMENT_HOLD_MS="${SELENIUM_CHECKOUT_PAYMENT_HOLD_MS:-8000}"
    export SELENIUM_ADMIN_MUTATION_STEP_DELAY_MS="${SELENIUM_ADMIN_MUTATION_STEP_DELAY_MS:-1000}"
    start_remote_browser --no-deps
    ;;

  *)
    die "modo inválido: '$mode'. Use local, prod, local-ui ou prod-ui."
    ;;
esac

run_tests
