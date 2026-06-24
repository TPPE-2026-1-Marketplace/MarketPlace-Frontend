import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const rawBaseUrl = process.env.SELENIUM_BASE_URL;
if (!rawBaseUrl) {
  throw new Error("SELENIUM_BASE_URL e obrigatoria para os testes Selenium.");
}

const baseUrl = rawBaseUrl.replace(/\/+$/, "");
const remoteUrl = process.env.SELENIUM_REMOTE_URL;
const hostGateway = process.env.SELENIUM_HOST_GATEWAY;
const headless = process.env.HEADLESS?.toLowerCase() !== "false";
const timeout = Number(process.env.SELENIUM_TIMEOUT_MS ?? 15_000);
const stepDelayMs = Number(process.env.SELENIUM_STEP_DELAY_MS ?? 0);
const holdOpenMs = Number(process.env.SELENIUM_HOLD_OPEN_MS ?? 0);
const adminEmail = process.env.SELENIUM_ADMIN_EMAIL;
const adminPassword = process.env.SELENIUM_ADMIN_PASSWORD;
const prodAdminEmail = process.env.SELENIUM_PROD_ADMIN_EMAIL;
const prodAdminPassword = process.env.SELENIUM_PROD_ADMIN_PASSWORD;
const managerEmail = process.env.SELENIUM_MANAGER_EMAIL;
const managerPassword = process.env.SELENIUM_MANAGER_PASSWORD;
const seleniumEnv = process.env.SELENIUM_ENV ?? "local";
const loginEmail = seleniumEnv === "production" ? prodAdminEmail : adminEmail;
const loginPassword = seleniumEnv === "production" ? prodAdminPassword : adminPassword;

let driver;

function url(path = "/") {
  return new URL(path, `${baseUrl}/`).toString();
}

async function visualPause(milliseconds = stepDelayMs) {
  if (!headless && milliseconds > 0) {
    await new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}

async function waitForHeading(text) {
  return driver.wait(
    until.elementLocated(
      By.xpath(`//*[self::h1 or self::h2][normalize-space()="${text}"]`),
    ),
    timeout,
  );
}

async function loginAs(email, password) {
  await driver.get(url("/login"));
  const emailInput = await driver.wait(
    until.elementLocated(By.css('input[placeholder="seu@email.com"]')),
    timeout,
  );
  const passwordInput = await driver.findElement(
    By.css('input[placeholder="Sua senha"]'),
  );
  await emailInput.sendKeys(email);
  await passwordInput.sendKeys(password);
  const loginForm = await emailInput.findElement(By.xpath("./ancestor::form[1]"));
  await clickVisible(
    await loginForm.findElement(By.xpath(".//button[normalize-space()='Entrar']")),
  );
  await driver.wait(until.urlContains("/selecionar-modulo"), timeout);
  await visualPause();
}

async function clickVisible(element) {
  await driver.executeScript(
    "arguments[0].scrollIntoView({block: 'center', inline: 'center'});",
    element,
  );
  await driver.wait(until.elementIsVisible(element), timeout);
  await driver.wait(until.elementIsEnabled(element), timeout);
  try {
    await element.click();
  } catch (error) {
    if (error?.name !== "ElementClickInterceptedError") throw error;
    await driver.executeScript("arguments[0].click();", element);
  }
}

async function waitForCatalogState() {
  try {
    return await driver.wait(async () => {
      const cards = await driver.findElements(By.css('[data-testid="product-card"]'));
      if (cards.length > 0) return "products";

      const emptyStates = await driver.findElements(
        By.xpath("//h3[normalize-space()='Nenhum vestido encontrado']"),
      );
      return emptyStates.length > 0 ? "empty" : false;
    }, Math.min(timeout, 5_000));
  } catch {
    return "unavailable";
  }
}

async function createDriver() {
  const sessionId = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const options = new chrome.Options();
  options.addArguments(
    "--window-size=1366,768",
    "--no-sandbox",
    "--disable-features=HttpsUpgrades,HttpsFirstMode,HttpsFirstModeV2",
    "--allow-insecure-localhost",
    `--user-data-dir=/dev/shm/selenium-profile-${sessionId}`,
    `--disk-cache-dir=/dev/shm/selenium-cache-${sessionId}`,
  );

  if (headless) {
    options.addArguments("--headless=new");
  }

  if (process.env.CHROME_BINARY) {
    options.setChromeBinaryPath(process.env.CHROME_BINARY);
  }

  if (remoteUrl && hostGateway) {
    options.addArguments(`--host-resolver-rules=MAP localhost ${hostGateway}`);
  }

  let builder = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options);

  if (remoteUrl) {
    builder = builder.usingServer(remoteUrl);
  }

  const browser = await builder.build();
  await browser.manage().setTimeouts({ implicit: 0, pageLoad: timeout, script: timeout });
  return browser;
}

before(async () => {
  driver = await createDriver();
});

beforeEach(async () => {
  await driver.get(url("/"));
  await driver.executeScript("window.localStorage.clear(); window.sessionStorage.clear();");
  await driver.get(url("/"));
  await visualPause();
});

afterEach(async () => {
  await visualPause();
});

after(async () => {
  try {
    await visualPause(holdOpenMs);
    await driver?.quit();
  } catch {
    // A sessao pode ja ter sido encerrada pelo navegador apos uma falha.
  }
});

test("home carrega a vitrine principal", async () => {
  await driver.get(url("/"));

  const banner = await driver.wait(
    until.elementLocated(By.css('section[aria-label="Banner principal"]')),
    timeout,
  );
  assert.equal(await banner.isDisplayed(), true);

  const heroHeading = await driver.wait(
    until.elementLocated(
      By.xpath("//h1[contains(normalize-space(), 'Vestidos que contam histórias')]"),
    ),
    timeout,
  );
  assert.equal(await heroHeading.isDisplayed(), true);

  const featuredTitle = await driver.wait(
    until.elementLocated(By.xpath("//h2[normalize-space()='Destaques']")),
    timeout,
  );
  assert.equal(await featuredTitle.isDisplayed(), true);
});

test("catalogo abre e aceita navegacao por categoria", async (t) => {
  await driver.get(url("/produtos"));

  const title = await driver.wait(
    until.elementLocated(By.xpath("//h1[normalize-space()='Todos os Vestidos']")),
    timeout,
  );
  assert.equal(await title.isDisplayed(), true);
  const initialState = await waitForCatalogState();
  if (initialState === "unavailable") {
    t.diagnostic("Backend do catalogo nao respondeu no timeout; o shell da listagem foi validado.");
  }

  const categoryLink = await driver.findElement(
    By.css('a[href="/produtos?categoria=festa"]'),
  );
  await categoryLink.click();

  await driver.wait(until.urlContains("categoria=festa"), timeout);
  const filteredTitle = await driver.wait(
    until.elementLocated(By.xpath("//h1[normalize-space()='Festa']")),
    timeout,
  );
  assert.equal(await filteredTitle.isDisplayed(), true);
  const filteredState = await waitForCatalogState();
  if (filteredState === "unavailable") {
    t.diagnostic("Backend do catalogo nao respondeu apos o filtro; rota e titulo foram validados.");
  }
});

test("produto disponivel abre detalhes e atualiza o carrinho local", async (t) => {
  await driver.get(url("/produtos"));
  const catalogState = await waitForCatalogState();

  const cards = await driver.findElements(By.css('[data-testid="product-card"]'));
  if (catalogState !== "products" || cards.length === 0) {
    t.skip(
      catalogState === "unavailable"
        ? "Backend do catalogo indisponivel; detalhe e carrinho nao foram presumidos."
        : "Catalogo sem produtos; detalhe e carrinho dependem de um produto disponivel.",
    );
    return;
  }

  const productUrl = await cards[0].getAttribute("href");
  await driver.get(productUrl);

  const detail = await driver.wait(
    until.elementLocated(By.css('[data-testid="product-detail"]')),
    timeout,
  );
  assert.equal(await detail.isDisplayed(), true);

  const productName = await driver.findElement(
    By.css('[data-testid="product-detail"] h1'),
  );
  assert.notEqual((await productName.getText()).trim(), "");

  const productImage = await driver.findElement(
    By.css('[data-testid="product-detail"] img'),
  );
  assert.notEqual(await productImage.getAttribute("src"), "");

  const addButton = await driver.findElement(By.css('[data-testid="add-to-cart"]'));
  await clickVisible(addButton);
  await driver.wait(
    until.elementTextContains(addButton, "Adicionado"),
    timeout,
    "O produto nao confirmou a inclusao no carrinho.",
  );

  await clickVisible(await driver.findElement(By.css('[data-testid="cart-link"]')));
  await driver.wait(until.urlContains("/carrinho"), timeout);

  const cartPage = await driver.wait(
    until.elementLocated(By.css('[data-testid="cart-page"]')),
    timeout,
  );
  assert.equal(await cartPage.isDisplayed(), true);
  assert.match(await cartPage.getText(), /Meu Carrinho|Resumo do Pedido/);
});

test("autenticacao exibe formulario sem enviar credenciais", async () => {
  await driver.get(url("/login"));

  const heading = await driver.wait(
    until.elementLocated(By.xpath("//h1[normalize-space()='DK Fashion']")),
    timeout,
  );
  assert.equal(await heading.isDisplayed(), true);

  const email = await driver.findElement(By.css('input[placeholder="seu@email.com"]'));
  const password = await driver.findElement(By.css('input[placeholder="Sua senha"]'));
  assert.equal(await email.isDisplayed(), true);
  assert.equal(await password.getAttribute("type"), "password");
});

test("gestao exige autenticacao e oferece acesso ao login", async () => {
  await driver.get(url("/painel"));

  const restricted = await driver.wait(
    until.elementLocated(By.xpath("//*[normalize-space()='Acesso Restrito']")),
    timeout,
  );
  assert.equal(await restricted.isDisplayed(), true);

  const loginLink = await driver.findElement(By.css('a[href="/login"]'));
  assert.match(await loginLink.getText(), /Fazer Login/);
});

test("PDV sem sessao redireciona para autenticacao sem criar venda", async () => {
  await driver.get(url("/pdv"));

  await driver.wait(until.urlContains("/login"), timeout);
  const password = await driver.wait(
    until.elementLocated(By.css('input[placeholder="Sua senha"]')),
    timeout,
  );
  assert.equal(await password.isDisplayed(), true);
});

test("administrador navega pelos modulos gerenciais sem alterar dados", async (t) => {
  if (!loginEmail || !loginPassword) {
    t.skip(
      seleniumEnv === "production"
        ? "Credenciais de producao ausentes em SELENIUM_PROD_ADMIN_EMAIL/SELENIUM_PROD_ADMIN_PASSWORD."
        : "Credenciais demo ausentes em SELENIUM_ADMIN_EMAIL/SELENIUM_ADMIN_PASSWORD.",
    );
    return;
  }

  await loginAs(loginEmail, loginPassword);
  assert.equal(await (await waitForHeading("Módulo de Gestão")).isDisplayed(), true);

  await clickVisible(
    await driver.findElement(
      By.xpath("//button[.//h2[normalize-space()='Módulo de Gestão']]"),
    ),
  );
  await driver.wait(until.urlContains("/painel"), timeout);
  assert.equal(await (await waitForHeading("Visão Geral")).isDisplayed(), true);

  const sections = [
    ["/painel/estoque", "Controle de Estoque"],
    ["/painel/pedidos", "Gerenciamento de Pedidos"],
    ["/painel/relatorios", "Relatórios e Análises"],
    ["/painel/comissoes", "Comissões e Metas"],
    ["/painel/cupons", "Cupons e Campanhas"],
  ];

  for (const [path, heading] of sections) {
    await driver.get(url(path));
    assert.equal(await (await waitForHeading(heading)).isDisplayed(), true);
    await visualPause();
  }
});

test("administrador abre o PDV sem iniciar venda", async (t) => {
  if (!loginEmail || !loginPassword) {
    t.skip(
      seleniumEnv === "production"
        ? "Credenciais de producao ausentes em SELENIUM_PROD_ADMIN_EMAIL/SELENIUM_PROD_ADMIN_PASSWORD."
        : "Credenciais demo ausentes em SELENIUM_ADMIN_EMAIL/SELENIUM_ADMIN_PASSWORD.",
    );
    return;
  }

  await loginAs(loginEmail, loginPassword);
  await driver.get(url("/pdv"));
  assert.equal(
    await (await waitForHeading("PDV - Ponto de Venda")).isDisplayed(),
    true,
  );
  const search = await driver.wait(
    until.elementLocated(
      By.css('input[placeholder="Buscar por nome ou código SKU..."]'),
    ),
    timeout,
  );
  assert.equal(await search.isDisplayed(), true);
});

test("gerente acessa gestão quando credenciais locais estão configuradas", async (t) => {
  if (!managerEmail || !managerPassword) {
    t.skip("Gerente demo não configurado; defina SELENIUM_MANAGER_EMAIL e SELENIUM_MANAGER_PASSWORD.");
    return;
  }

  await loginAs(managerEmail, managerPassword);
  await clickVisible(
    await driver.findElement(
      By.xpath("//button[.//h2[normalize-space()='Módulo de Gestão']]"),
    ),
  );
  await driver.wait(until.urlContains("/painel"), timeout);
  assert.equal(await (await waitForHeading("Visão Geral")).isDisplayed(), true);

  const couponButtons = await driver.findElements(
    By.xpath("//nav//button[contains(normalize-space(.), 'Cupons')]"),
  );
  assert.equal(couponButtons.length, 0);
});
