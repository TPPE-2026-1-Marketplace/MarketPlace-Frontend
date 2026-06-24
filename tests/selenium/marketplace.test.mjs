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
const apiBaseUrl = process.env.VITE_API_URL?.replace(/\/+$/, "");
const adminEmail = process.env.SELENIUM_ADMIN_EMAIL;
const adminPassword = process.env.SELENIUM_ADMIN_PASSWORD;
const prodAdminEmail = process.env.SELENIUM_PROD_ADMIN_EMAIL;
const prodAdminPassword = process.env.SELENIUM_PROD_ADMIN_PASSWORD;
const managerEmail = process.env.SELENIUM_MANAGER_EMAIL;
const managerPassword = process.env.SELENIUM_MANAGER_PASSWORD;
const checkoutEmail = process.env.SELENIUM_CHECKOUT_EMAIL ?? "selenium.checkout@example.com";
const checkoutCpf = process.env.SELENIUM_CHECKOUT_CPF ?? "11144477735";
const checkoutPhone = process.env.SELENIUM_CHECKOUT_PHONE ?? "61999999999";
const checkoutCep = process.env.SELENIUM_CHECKOUT_CEP ?? "72240811";
const allowCheckoutPayment = process.env.SELENIUM_ALLOW_CHECKOUT_PAYMENT === "true";
const allowAdminMutations = process.env.SELENIUM_ALLOW_ADMIN_MUTATIONS === "true";
const checkoutPaymentHoldMs = Number(process.env.SELENIUM_CHECKOUT_PAYMENT_HOLD_MS ?? 5_000);
const adminMutationStepDelayMs = Number(process.env.SELENIUM_ADMIN_MUTATION_STEP_DELAY_MS ?? 0);
const seleniumEnv = process.env.SELENIUM_ENV ?? "local";
const loginEmail = seleniumEnv === "production" ? prodAdminEmail : adminEmail;
const loginPassword = seleniumEnv === "production" ? prodAdminPassword : adminPassword;
const adminMutationRole = process.env.SELENIUM_ADMIN_MUTATION_ROLE ?? "cashier";
const adminMutationImageUrl =
  process.env.SELENIUM_ADMIN_PRODUCT_IMAGE_URL ?? "https://i.ibb.co/v4JCn77J/img-0.jpg";

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
      By.xpath(`//*[self::h1 or self::h2 or self::h3][normalize-space()="${text}"]`),
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

async function fillInput(selector, value) {
  const input = await driver.wait(until.elementLocated(By.css(selector)), timeout);
  await driver.wait(until.elementIsVisible(input), timeout);
  await input.clear();
  await input.sendKeys(value);
  return input;
}

async function fillElement(element, value) {
  await driver.wait(until.elementIsVisible(element), timeout);
  await element.clear();
  await element.sendKeys(value);
  return element;
}

async function findButtonByText(text) {
  return driver.wait(
    until.elementLocated(
      By.xpath(`//button[contains(normalize-space(.), "${text}")]`),
    ),
    timeout,
  );
}

async function selectOptionByText(selectSelector, optionText) {
  const select = await driver.wait(until.elementLocated(By.css(selectSelector)), timeout);
  await driver.executeScript(
    "arguments[0].scrollIntoView({block: 'center', inline: 'center'});",
    select,
  );
  const option = await select.findElement(
    By.xpath(`.//option[normalize-space(.)="${optionText}"]`),
  );
  await option.click();
}

async function selectOptionByVisibleIndex(index, optionText) {
  await driver.wait(async () => {
    const selects = await driver.findElements(By.css("select"));
    const visibleSelects = [];
    for (const select of selects) {
      if (await select.isDisplayed()) visibleSelects.push(select);
    }
    return visibleSelects.length > index ? visibleSelects : false;
  }, timeout);

  const selects = await driver.findElements(By.css("select"));
  const visibleSelects = [];
  for (const select of selects) {
    if (await select.isDisplayed()) visibleSelects.push(select);
  }

  const select = visibleSelects[index];
  await driver.executeScript(
    "arguments[0].scrollIntoView({block: 'center', inline: 'center'});",
    select,
  );
  const option = await select.findElement(
    By.xpath(`.//option[normalize-space(.)="${optionText}"]`),
  );
  await option.click();
}

async function acceptAlertIfPresent(waitMs = timeout) {
  try {
    const alert = await driver.wait(until.alertIsPresent(), waitMs);
    const text = await alert.getText();
    await alert.accept();
    return text;
  } catch {
    return null;
  }
}

async function findLinkByHrefPart(hrefPart) {
  return driver.wait(
    until.elementLocated(By.xpath(`//a[contains(@href, "${hrefPart}")]`)),
    timeout,
  );
}

async function clickPanelNav(label) {
  await clickVisible(
    await driver.wait(
      until.elementLocated(By.xpath(`//nav//button[contains(normalize-space(.), "${label}")]`)),
      timeout,
    ),
  );
}

async function apiRequest(token, path, options = {}) {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_URL e obrigatoria para criar dados administrativos.");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`API ${path} falhou com status ${response.status}: ${text}`);
  }

  if (response.status === 204) return undefined;
  return response.json();
}

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function cpfCheckDigit(numbers) {
  let sum = 0;
  for (let index = 0; index < numbers.length; index += 1) {
    sum += Number(numbers[index]) * (numbers.length + 1 - index);
  }
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

function createValidCpf(seed) {
  const base = onlyDigits(String(seed)).padStart(9, "0").slice(-9);
  const firstDigit = cpfCheckDigit(base);
  const secondDigit = cpfCheckDigit(`${base}${firstDigit}`);
  return `${base}${firstDigit}${secondDigit}`;
}

async function createAdminMutationRecords() {
  const token = await driver.executeScript("return window.localStorage.getItem('dk_token');");
  assert.ok(token, "Token do admin nao foi encontrado apos login.");

  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
  const productTitle = `Produto Selenium ${suffix}`;
  const sku = `SEL-${suffix}`;
  const variantSku = `${sku}-PRETO-M`;
  const userCpf = createValidCpf(Date.now());
  const role = adminMutationRole === "manager" ? "gerente" : "caixa";
  const roleLabel = role === "gerente" ? "Gerente" : "Caixa";
  const userName = `${roleLabel} Selenium ${suffix}`;
  const userEmail = `selenium.${role}.${suffix.toLowerCase()}@dkfashion.test`;

  const createdProduct = await apiRequest(token, "/products", {
    method: "POST",
    body: {
      titulo: productTitle,
      sku,
      preco_base: 129.9,
      descricao: "Produto criado automaticamente pelo Selenium para validar o fluxo administrativo.",
      destaque: false,
      qual_medida: "Midi",
      material: "Tule",
      composicao: "100% Poliester",
      silhueta: "Reto",
      tags: ["selenium", "teste"],
    },
  });

  await apiRequest(token, "/product-variants", {
    method: "POST",
    body: {
      idProduto: createdProduct.idProduto,
      codigo_sku: variantSku,
      preco_variante: 129.9,
      ativo: true,
      cor: "Preto",
      tamanho: "M",
    },
  });

  await apiRequest(token, `/inventory/${encodeURIComponent(variantSku)}`, {
    method: "PATCH",
    body: {
      qtdOnline: 2,
      qtdLojaFisica: 1,
      motivo: "Cadastro Selenium",
      tipoMovimentacao: "ajuste",
    },
  });

  const image = await apiRequest(token, "/images", {
    method: "POST",
    body: {
      url: adminMutationImageUrl,
      ordem: 1,
      descricao: "Imagem cadastrada pelo Selenium",
    },
  });

  await apiRequest(token, "/images/catalog", {
    method: "POST",
    body: {
      imageId: image.idImagem,
      variantSku,
      ordem_no_catalogo: 1,
    },
  });

  await apiRequest(token, "/employees", {
    method: "POST",
    body: {
      cpf: userCpf,
      nome: userName,
      email: userEmail,
      senha: `Selenium@${suffix}1`,
      telefone: "61999999999",
      ativo: true,
      role_perfil: role,
    },
  });

  return { productTitle, sku, variantSku, userName, userEmail, roleLabel };
}

async function productLinks() {
  const links = await driver.findElements(By.xpath('//a[contains(@href, "/produtos/")]'));
  const usable = [];
  for (const link of links) {
    const href = await link.getAttribute("href");
    if (/\/produtos\/\d+/.test(href ?? "")) usable.push(link);
  }
  return usable;
}

async function waitForCatalogState() {
  try {
    return await driver.wait(async () => {
      const cards = await driver.findElements(By.css('[data-testid="product-card"]'));
      if (cards.length > 0) return "products";

      const links = await productLinks();
      if (links.length > 0) return "products";

      const emptyStates = await driver.findElements(
        By.xpath("//h3[normalize-space()='Nenhum vestido encontrado']"),
      );
      return emptyStates.length > 0 ? "empty" : false;
    }, timeout);
  } catch {
    return "unavailable";
  }
}

async function openFirstAvailableProduct(t) {
  await driver.get(url("/produtos"));
  const catalogState = await waitForCatalogState();

  const cards = await driver.findElements(By.css('[data-testid="product-card"]'));
  const links = cards.length > 0 ? cards : await productLinks();
  if (catalogState !== "products" || links.length === 0) {
    t.skip(
      catalogState === "unavailable"
        ? "Backend do catalogo indisponivel; fluxo de produto nao foi presumido."
        : "Catalogo sem produtos; fluxo de compra depende de um produto disponivel.",
    );
    return false;
  }

  const productUrl = await links[0].getAttribute("href");
  await driver.get(productUrl);

  const addButton = await driver.wait(
    until.elementLocated(
      By.xpath('//*[@data-testid="add-to-cart" or self::button[contains(normalize-space(.), "Adicionar ao Carrinho")]]'),
    ),
    timeout,
  );
  assert.equal(await addButton.isDisplayed(), true);
  return true;
}

async function createDriver() {
  const sessionId = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const options = new chrome.Options();
  options.setPageLoadStrategy("eager");
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
  if (!(await openFirstAvailableProduct(t))) return;

  const productName = await driver.findElement(
    By.css("h1"),
  );
  assert.notEqual((await productName.getText()).trim(), "");

  const productImage = await driver.findElement(
    By.css("img"),
  );
  assert.notEqual(await productImage.getAttribute("src"), "");

  const addButton = await driver.findElement(
    By.xpath('//*[@data-testid="add-to-cart" or self::button[contains(normalize-space(.), "Adicionar ao Carrinho")]]'),
  );
  await clickVisible(addButton);
  await driver.wait(
    until.elementTextContains(addButton, "Adicionado"),
    timeout,
    "O produto nao confirmou a inclusao no carrinho.",
  );

  await clickVisible(await findLinkByHrefPart("/carrinho"));
  await driver.wait(until.urlContains("/carrinho"), timeout);

  assert.equal(await (await waitForHeading("Meu Carrinho")).isDisplayed(), true);
});

test("cliente percorre carrinho, endereco e prepara checkout de pagamento", async (t) => {
  if (!(await openFirstAvailableProduct(t))) return;

  await clickVisible(await findButtonByText("Adicionar ao Carrinho"));
  await clickVisible(await findLinkByHrefPart("/carrinho"));
  await driver.wait(until.urlContains("/carrinho"), timeout);
  assert.equal(await (await waitForHeading("Meu Carrinho")).isDisplayed(), true);

  await clickVisible(await findButtonByText("Finalizar Compra"));
  await driver.wait(until.urlContains("/checkout"), timeout);
  assert.equal(await (await waitForHeading("Finalizar Compra")).isDisplayed(), true);

  await fillInput('input[placeholder="Seu nome (opcional)"]', "Cliente Selenium");
  await fillInput('input[placeholder="seu@email.com"]', checkoutEmail);
  await fillInput('input[placeholder="000.000.000-00"]', checkoutCpf);
  await fillInput('input[placeholder="(61) 9 9999-9999"]', checkoutPhone);
  await clickVisible(await findButtonByText("Continuar"));
  await clickVisible(await findButtonByText("Continuar como Convidado"));

  assert.equal(await (await waitForHeading("Endereço de Entrega")).isDisplayed(), true);
  await fillInput('input[placeholder="CEP"]', checkoutCep);
  await fillInput('input[placeholder="Número"]', "100");

  const finishOrder = await findButtonByText("Finalizar Pedido");
  await driver.wait(async () => (await finishOrder.isEnabled()) === true, timeout);

  if (!allowCheckoutPayment) {
    t.diagnostic(
      "Checkout preenchido ate endereco; defina SELENIUM_ALLOW_CHECKOUT_PAYMENT=true para criar pedido e abrir a etapa de pagamento.",
    );
    return;
  }

  await clickVisible(finishOrder);
  await driver.wait(
    until.elementLocated(
      By.xpath("//*[contains(normalize-space(.), 'Gerando pagamento') or contains(normalize-space(.), 'Pedido registrado')]"),
    ),
    timeout,
  );

  const paymentLink = await driver.wait(
    until.elementLocated(By.xpath('//a[contains(normalize-space(.), "Abrir pagamento")]')),
    timeout,
  );
  const originalWindow = await driver.getWindowHandle();
  const existingWindows = await driver.getAllWindowHandles();
  await clickVisible(paymentLink);

  await driver.wait(async () => {
    const handles = await driver.getAllWindowHandles();
    return handles.length > existingWindows.length;
  }, timeout);

  const openedWindows = await driver.getAllWindowHandles();
  const paymentWindow = openedWindows.find((handle) => !existingWindows.includes(handle));
  assert.ok(paymentWindow, "O checkout de pagamento nao abriu em uma nova aba.");

  await driver.switchTo().window(paymentWindow);
  await driver.wait(async () => {
    const currentUrl = await driver.getCurrentUrl();
    return currentUrl && currentUrl !== "about:blank";
  }, timeout);
  await visualPause(checkoutPaymentHoldMs);
  await driver.close();

  await driver.switchTo().window(originalWindow);
  await clickVisible(await findButtonByText("Voltar à loja"));
  await driver.wait(until.urlIs(url("/")), timeout);
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

if (allowAdminMutations) {
  test("administrador cria produto com imagem e usuario operacional", async (t) => {
    if (!loginEmail || !loginPassword) {
      t.skip(
        seleniumEnv === "production"
          ? "Credenciais de producao ausentes em SELENIUM_PROD_ADMIN_EMAIL/SELENIUM_PROD_ADMIN_PASSWORD."
          : "Credenciais demo ausentes em SELENIUM_ADMIN_EMAIL/SELENIUM_ADMIN_PASSWORD.",
      );
      return;
    }

    await loginAs(loginEmail, loginPassword);
    await clickVisible(
      await driver.findElement(
        By.xpath("//button[.//h2[normalize-space()='Módulo de Gestão']]"),
      ),
    );
    await driver.wait(until.urlContains("/painel"), timeout);
    assert.equal(await (await waitForHeading("Visão Geral")).isDisplayed(), true);
    await visualPause(adminMutationStepDelayMs);

    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
    const productTitle = `Produto Selenium ${suffix}`;
    const sku = `SEL-${suffix}`;
    const variantSku = `SEL${suffix}-PRETO-M`;
    const role = adminMutationRole === "manager" ? "manager" : "cashier";
    const roleLabel = role === "manager" ? "Gerente" : "Caixa";
    const userCpf = createValidCpf(Date.now());
    const userName = `${roleLabel} Selenium ${suffix}`;
    const userEmail = `selenium.${role}.${suffix.toLowerCase()}@dkfashion.test`;
    const userPassword = `Selenium@${suffix}1`;
    const productImagePath = `${process.cwd()}/public/hero-dress.png`;

    await clickPanelNav("Estoque");
    assert.equal(await (await waitForHeading("Controle de Estoque")).isDisplayed(), true);
    await visualPause(adminMutationStepDelayMs);

    await clickVisible(await findButtonByText("Novo Produto"));
    assert.equal(await (await waitForHeading("Informação Básica")).isDisplayed(), true);
    await visualPause(adminMutationStepDelayMs);

    await fillInput('input[placeholder^="Ex: Vestido de Festa"]', productTitle);
    await visualPause(adminMutationStepDelayMs);
    await fillInput(
      'textarea[placeholder^="Descreva os detalhes"]',
      "Produto criado visualmente pelo Selenium para demonstrar o cadastro administrativo completo.",
    );
    await visualPause(adminMutationStepDelayMs);
    await fillInput('input[placeholder="Ex: DK-009"]', sku);
    await visualPause(adminMutationStepDelayMs);
    await clickVisible(await findButtonByText("Avançar"));

    assert.equal(await (await waitForHeading("Atributos de Categoria")).isDisplayed(), true);
    await visualPause(adminMutationStepDelayMs);
    await selectOptionByVisibleIndex(0, "Vestuário");
    await visualPause(adminMutationStepDelayMs);
    await selectOptionByVisibleIndex(1, "Vestidos");
    await visualPause(adminMutationStepDelayMs);
    await selectOptionByVisibleIndex(2, "Festa");
    await visualPause(adminMutationStepDelayMs);
    await clickVisible(await findButtonByText("Avançar"));

    assert.equal(await (await waitForHeading("Especificações de Venda")).isDisplayed(), true);
    await visualPause(adminMutationStepDelayMs);
    await fillInput('input[placeholder="0,00"]', "129.90");
    await visualPause(adminMutationStepDelayMs);
    await clickVisible(
      await driver.wait(until.elementLocated(By.xpath('//button[normalize-space()="M"]')), timeout),
    );
    await visualPause(adminMutationStepDelayMs);
    await clickVisible(await findButtonByText("Adicionar Cor"));
    await visualPause(adminMutationStepDelayMs);
    await fillInput('input[placeholder="Nome da cor (Ex: Rosa Nude)"]', "Preto");
    await visualPause(adminMutationStepDelayMs);
    await clickVisible(await findButtonByText("Confirmar Cor"));
    await visualPause(adminMutationStepDelayMs);

    const fileInput = await driver.wait(
      until.elementLocated(By.css('input[type="file"][accept="image/*"]')),
      timeout,
    );
    await fileInput.sendKeys(productImagePath);
    await visualPause(adminMutationStepDelayMs);
    await clickVisible(
      await driver.wait(
        until.elementLocated(By.xpath('//button[contains(normalize-space(.), "Aplicar Corte")]')),
        timeout,
      ),
    );
    await visualPause(adminMutationStepDelayMs);
    await clickVisible(await findButtonByText("Avançar"));

    assert.equal(await (await waitForHeading("Gestão de Estoque")).isDisplayed(), true);
    await visualPause(adminMutationStepDelayMs);
    const stockInputs = await driver.findElements(By.xpath("//tbody//input[@type='number']"));
    assert.ok(stockInputs.length >= 3, "Inputs de estoque/preco da variante nao foram encontrados.");
    await fillElement(stockInputs[0], "2");
    await visualPause(adminMutationStepDelayMs);
    await fillElement(stockInputs[1], "1");
    await visualPause(adminMutationStepDelayMs);
    await fillElement(stockInputs[2], "129.90");
    await visualPause(adminMutationStepDelayMs);
    await clickVisible(await findButtonByText("Postar Produto"));
    await acceptAlertIfPresent();
    await visualPause(adminMutationStepDelayMs);

    assert.equal(await (await waitForHeading("Controle de Estoque")).isDisplayed(), true);
    await fillInput('input[placeholder="Buscar por produto, SKU base ou SKU da variante..."]', sku);
    await driver.wait(
      until.elementLocated(By.xpath(`//*[contains(normalize-space(.), "${variantSku}")]`)),
      timeout,
    );
    await visualPause(adminMutationStepDelayMs);
    await visualPause(adminMutationStepDelayMs);

    await clickPanelNav("Usuários");
    assert.equal(await (await waitForHeading("Gestão de Usuários")).isDisplayed(), true);
    await visualPause(adminMutationStepDelayMs);
    await clickVisible(await findButtonByText("Novo Usuário"));
    assert.equal(await (await waitForHeading("Novo Usuário")).isDisplayed(), true);
    await visualPause(adminMutationStepDelayMs);
    await fillInput('input[placeholder="000.000.000-00"]', userCpf);
    await visualPause(adminMutationStepDelayMs);
    await fillInput('input[placeholder="Ex: Ana Silva"]', userName);
    await visualPause(adminMutationStepDelayMs);
    await fillInput('input[placeholder="usuario@dkfestas.com.br"]', userEmail);
    await visualPause(adminMutationStepDelayMs);
    await fillInput('input[placeholder="Senha de acesso"]', userPassword);
    await visualPause(adminMutationStepDelayMs);
    await fillInput('input[placeholder="(11) 99999-0000"]', "61999999999");
    await visualPause(adminMutationStepDelayMs);
    await selectOptionByText("select", roleLabel);
    await visualPause(adminMutationStepDelayMs);
    await clickVisible(await findButtonByText("Cadastrar Usuário"));
    await visualPause(adminMutationStepDelayMs);
    await driver.wait(
      until.elementLocated(
        By.xpath(`//*[contains(normalize-space(.), "${userEmail}") or contains(normalize-space(.), "${userName}")]`),
      ),
      timeout,
    );
    await visualPause(adminMutationStepDelayMs);
    await visualPause(adminMutationStepDelayMs);

    t.diagnostic(
      `Criados visualmente produto ${sku} com imagem e usuario ${userEmail} (${roleLabel}).`,
    );
  });
}

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
