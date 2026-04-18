# DOCS

Este documento descreve como rodar o projeto localmente, como usar o ambiente Docker no dia a dia e como funciona o fluxo de produção.

## Visão geral

O projeto foi configurado com:

- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `pnpm`
- `Docker`
- `Docker Compose`

Existem dois modos principais de trabalho:

- ambiente local com `pnpm`
- ambiente containerizado com `docker compose`

Para desenvolvimento, o mais comum é escolher um dos dois e seguir sempre com ele. O ambiente Docker foi preparado para permitir hot reload sem precisar instalar dependências do projeto na máquina toda vez.

## Estrutura relevante

Arquivos principais:

- [package.json](/home/brunobreis/Documents/unb/semestres/atual/tppe/front/package.json)
- [Dockerfile](/home/brunobreis/Documents/unb/semestres/atual/tppe/front/Dockerfile)
- [compose.dev.yml](/home/brunobreis/Documents/unb/semestres/atual/tppe/front/compose.dev.yml)
- [compose.prod.yml](/home/brunobreis/Documents/unb/semestres/atual/tppe/front/compose.prod.yml)
- [Makefile](/home/brunobreis/Documents/unb/semestres/atual/tppe/front/Makefile)
- [.env.development.example](/home/brunobreis/Documents/unb/semestres/atual/tppe/front/.env.development.example)
- [.env.production.example](/home/brunobreis/Documents/unb/semestres/atual/tppe/front/.env.production.example)

## Requisitos

### Para rodar localmente sem Docker

- `Node.js` instalado
- `pnpm` instalado

Exemplo:

```bash
npm install -g pnpm
```

### Para rodar com Docker

- `Docker`
- `Docker Compose`

## Variáveis de ambiente

O projeto usa templates versionados e arquivos reais locais:

```bash
.env.development.example
.env.production.example
```

Os arquivos reais usados pela aplicação são:

```bash
.env.development
.env.production
```

Eles não devem ser versionados. Para criar ambos rapidamente:

```bash
make env-setup
```

Se o projeto passar a depender de valores sensíveis, mantenha segredos apenas nesses arquivos locais ou em variáveis injetadas pelo ambiente/CI/CD.

Variáveis públicas expostas ao navegador no Next.js devem começar com:

```bash
NEXT_PUBLIC_
```

### Sobre `NODE_ENV`

O `NODE_ENV` não fica fixado no `Dockerfile`.

Ele é definido de forma explícita por ambiente:

- `compose.dev.yml` usa `NODE_ENV=development`
- `compose.prod.yml` usa `NODE_ENV=production`

Essa decisão foi tomada para que o modo de execução fique controlado pelo runtime de cada ambiente, e não pela imagem base compartilhada entre desenvolvimento e produção.

## Como rodar localmente sem Docker

Esse fluxo usa o Node da sua própria máquina.

### 1. Instalar dependências

Antes, crie os arquivos `.env` locais:

```bash
make env-setup
```

```bash
make install
```

Ou:

```bash
pnpm install
```

### 2. Subir o servidor de desenvolvimento

```bash
make dev
```

Ou:

```bash
pnpm dev
```

### 3. Acessar a aplicação

Abra:

```text
http://localhost:3000
```

### 4. Validar qualidade e build

Lint:

```bash
make lint
```

Build:

```bash
make build
```

Executar build de produção localmente:

```bash
make start
```

## Como rodar com Docker

Esse fluxo usa containers para o ambiente da aplicação.

### Como o ambiente Docker foi desenhado

- o código do projeto é montado dentro do container via volume
- as dependências ficam em volume separado
- o cache do `pnpm` fica em volume separado
- o arquivo `compose.dev.yml` sobe o serviço em modo desenvolvimento com `pnpm dev`
- o arquivo `compose.prod.yml` sobe a imagem final do estágio `runner`
- o `NODE_ENV` é definido no Compose correspondente ao ambiente
- o hot reload funciona sem reinstalar tudo a cada alteração de código

## Fluxo Docker na primeira vez

Esse é o fluxo recomendado para a primeira execução.

### 1. Construir e subir o ambiente

Antes, garanta que `.env.development` exista:

```bash
make env-setup
```

```bash
make docker-up
```

Se quiser forçar reconstrução da imagem:

```bash
make docker-rebuild
```

Equivalente direto:

```bash
docker compose -f compose.dev.yml up --build -d
```

### 2. Ver logs do serviço

```bash
make docker-logs
```

Isso ajuda a confirmar:

- se o container subiu corretamente
- se o Next.js iniciou
- se houve erro de dependência ou configuração

### 3. Acessar a aplicação

Abra:

```text
http://localhost:3000
```

### O que acontece nessa primeira execução

Na primeira vez, o Docker:

- lê o `Dockerfile`
- cria a imagem a partir da base Node
- instala as dependências com `pnpm`
- cria os volumes persistentes
- sobe o container com o comando `pnpm dev`

Os volumes principais são:

- `node_modules`
- `.pnpm-store`

Isso evita reinstalar tudo do zero a cada subida do ambiente.

## Fluxo Docker no dia a dia para atualizar o front

Depois que o ambiente já foi criado, o fluxo normal de desenvolvimento é simples.

### 1. Subir o ambiente

```bash
make docker-up
```

### 2. Editar arquivos do frontend

Você altera arquivos como:

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/globals.css`

Como a pasta do projeto está montada no container, o Next.js detecta a mudança e recompila automaticamente.

### 3. Ver as mudanças no navegador

Basta recarregar ou aguardar o hot reload.

### 4. Acompanhar logs se necessário

```bash
make docker-logs
```

### 5. Entrar no container, se precisar inspecionar algo

```bash
make docker-shell
```

## Quando reconstruir o ambiente Docker

Nem toda alteração exige rebuild.

### Não precisa rebuild quando:

- você alterou arquivos de código em `src/`
- você alterou estilos
- você alterou componentes

### Precisa rebuild quando:

- você alterou o `Dockerfile`
- você alterou o `package.json`
- você alterou o `pnpm-lock.yaml`
- você alterou alguma configuração que afete a imagem base

Nesse caso:

```bash
make docker-rebuild
```

## Quando resetar os volumes Docker

Às vezes o ambiente pode ficar inconsistente, especialmente após mudanças de dependência.

Para derrubar tudo e remover os volumes:

```bash
make docker-reset
```

Esse comando:

- derruba os containers
- remove volumes do Compose
- apaga dependências armazenadas no ambiente Docker

Depois disso, suba novamente:

```bash
make docker-rebuild
```

## Fluxo de produção

O ambiente de desenvolvimento e o ambiente de produção não usam exatamente o mesmo caminho.

### Desenvolvimento

No desenvolvimento:

- usa `compose.dev.yml`
- monta o código local como volume
- roda `pnpm dev`
- define `NODE_ENV=development`
- tem hot reload

### Produção

Na produção:

- usa `compose.prod.yml`
- a imagem é construída com o `Dockerfile`
- o build depende de `.env.production` existir localmente
- o projeto passa pelo `pnpm build`
- o Next gera o artefato otimizado
- a imagem final roda com `node server.js`
- define `NODE_ENV=production`
- o container final é menor e não depende do código-fonte montado em volume

### Como subir produção com Compose

```bash
make docker-prod-build
make docker-prod-up
```

Para acompanhar os logs:

```bash
make docker-prod-logs
```

Para derrubar:

```bash
make docker-prod-down
```

## Como gerar a imagem de produção

```bash
docker build -t marketplace-frontend .
```

## Como rodar a imagem de produção

```bash
docker run --rm -p 3000:3000 marketplace-frontend
```

Depois acesse:

```text
http://localhost:3000
```

## Diferença prática entre desenvolvimento e produção

No desenvolvimento:

- você edita o código localmente
- o container enxerga as mudanças imediatamente
- a aplicação recompila durante o trabalho

Na produção:

- o código é empacotado dentro da imagem
- não há hot reload
- a imagem já sobe pronta para servir a aplicação

## Comandos úteis

Listar comandos disponíveis:

```bash
make help
```

Instalar dependências localmente:

```bash
make env-setup
make install
```

Subir ambiente local sem Docker:

```bash
make dev
```

Rodar lint:

```bash
make lint
```

Gerar build local:

```bash
make build
```

Subir Docker:

```bash
make docker-up
```

Reconstruir Docker:

```bash
make docker-rebuild
```

Subir Docker de produção:

```bash
make docker-prod-up
```

Construir Docker de produção:

```bash
make docker-prod-build
```

Ver logs da produção:

```bash
make docker-prod-logs
```

Derrubar produção:

```bash
make docker-prod-down
```

Ver logs:

```bash
make docker-logs
```

Entrar no container:

```bash
make docker-shell
```

Derrubar containers:

```bash
make docker-down
```

Remover containers e volumes:

```bash
make docker-reset
```

## Recomendação prática de workflow

### Opção 1: desenvolvimento sem Docker

Use quando:

- você quer mais simplicidade
- sua máquina já está pronta com Node e `pnpm`
- você não precisa isolar o ambiente

Fluxo:

```bash
make install
make dev
make lint
make build
```

### Opção 2: desenvolvimento com Docker

Use quando:

- você quer ambiente padronizado
- quer evitar instalar dependências do projeto diretamente na máquina
- quer trabalhar mais próximo do ambiente containerizado

Fluxo:

```bash
make docker-up
make docker-logs
make docker-rebuild
make docker-down
```

## Observações finais

- `docker-up` normalmente basta para o dia a dia depois da primeira execução
- `docker-rebuild` é mais indicado após mudança de dependências ou da imagem
- `docker-reset` é uma limpeza mais agressiva, útil quando o ambiente Docker entra em estado inconsistente
- para produção, o ideal é automatizar `build`, teste e publicação da imagem em um pipeline de CI/CD
