import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddProduct } from "./AddProduct";

const next = () => userEvent.click(screen.getByRole("button", { name: /Avançar/ }));

function setup() {
  const onBack = vi.fn();
  const onSave = vi.fn();
  render(<AddProduct onBack={onBack} onSave={onSave} />);
  return { onBack, onSave };
}

async function fillStep1() {
  await userEvent.type(screen.getByPlaceholderText(/Ex: Vestido de Festa Longo/), "Vestido Gala");
  await userEvent.type(screen.getByPlaceholderText(/Descreva os detalhes/), "Longo em tule");
  await userEvent.type(screen.getByPlaceholderText("Ex: DK-009"), "DK-GALA");
  await next();
}

async function fillStep2() {
  const [l1] = screen.getAllByRole("combobox");
  await userEvent.selectOptions(l1, "Vestuário");
  await userEvent.selectOptions(screen.getAllByRole("combobox")[1], "Vestidos");
  await userEvent.selectOptions(screen.getAllByRole("combobox")[2], "Festa");
  await userEvent.selectOptions(screen.getAllByRole("combobox")[3], "Tule");
  const tag = screen.getByPlaceholderText(/Digite uma tag/);
  await userEvent.type(tag, "Festa{enter}");
  await next();
}

async function addColor(name: string) {
  await userEvent.click(screen.getByRole("button", { name: /Adicionar Cor/ }));
  await userEvent.type(screen.getByPlaceholderText("Nome da cor (Ex: Rosa Nude)"), `${name}{enter}`);
}

describe("AddProduct", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exige título e SKU no primeiro passo e volta pelo botão", async () => {
    const { onBack } = setup();

    await next();
    expect(screen.getByText("O título do produto é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("O SKU é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Passo 1 de 4")).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(onBack).toHaveBeenCalled();
  });

  it("exige departamento e categoria no segundo passo", async () => {
    setup();
    await fillStep1();
    expect(screen.getByText("Passo 2 de 4")).toBeInTheDocument();

    await next();
    expect(screen.getByText("Selecione o departamento")).toBeInTheDocument();
    expect(screen.getByText("Selecione a categoria")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Anterior/ }));
    expect(screen.getByText("Passo 1 de 4")).toBeInTheDocument();
  });

  it("valida preço e cores no terceiro passo", async () => {
    setup();
    await fillStep1();
    await fillStep2();
    expect(screen.getByText("Passo 3 de 4")).toBeInTheDocument();

    await next();
    expect(screen.getByText("Defina o preço de venda")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Adicionar Cor/ }));
    await userEvent.type(screen.getByPlaceholderText("Nome da cor (Ex: Rosa Nude)"), "{enter}");
    expect(screen.getByText("Informe um nome para a cor.")).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText("Nome da cor (Ex: Rosa Nude)"), "Preto{enter}");
    await addColor("preto");
    expect(screen.getByText("Esta cor já foi adicionada.")).toBeInTheDocument();
  });

  it("gera as variantes, aplica estoque a todas e posta o produto", async () => {
    const { onSave } = setup();
    await fillStep1();
    await fillStep2();

    fireEvent.change(screen.getByPlaceholderText("0,00"), { target: { value: "350" } });
    await userEvent.click(screen.getByRole("button", { name: "M" }));
    await userEvent.click(screen.getByRole("button", { name: "G" }));
    await userEvent.click(screen.getByRole("button", { name: "PP" }));
    await userEvent.click(screen.getByRole("button", { name: "PP" }));
    await addColor("Preto");
    await addColor("Rosa Nude");
    await next();
    expect(screen.getByText("Passo 4 de 4")).toBeInTheDocument();

    const [online, fisica] = screen.getAllByPlaceholderText("0");
    fireEvent.change(online, { target: { value: "3" } });
    fireEvent.change(fisica, { target: { value: "1" } });
    const aplicar = screen.getAllByRole("button", { name: "Aplicar" });
    await userEvent.click(aplicar[0]);
    await userEvent.click(aplicar[1]);

    await userEvent.click(screen.getByRole("button", { name: /Postar Produto/ }));

    expect(onSave).toHaveBeenCalledTimes(1);
    const [product, payload] = onSave.mock.calls[0];
    expect(product).toMatchObject({
      sku: "DK-GALA",
      name: "Vestido Gala",
      price: 350,
      category: "festa",
      sizes: ["M", "G"],
      colors: ["Preto", "Rosa Nude"],
      stockEcommerce: 12,
      stockPhysical: 4,
      tags: ["festa"],
    });
    expect(payload.form.attrs).toEqual({ Material: "Tule" });
    expect(payload.variants.map((v: { codigoSku: string }) => v.codigoSku)).toEqual([
      "DKGALA-PRETO-M",
      "DKGALA-ROSANUDE-M",
      "DKGALA-PRETO-G",
      "DKGALA-ROSANUDE-G",
    ]);
    expect(payload.variants.every((v: { price: number }) => v.price === 350)).toBe(true);
  });

  it("sem cores e tamanhos gera uma variante padrão", async () => {
    const { onSave } = setup();
    await fillStep1();
    await fillStep2();
    fireEvent.change(screen.getByPlaceholderText("0,00"), { target: { value: "99" } });
    await next();

    await userEvent.click(screen.getByRole("button", { name: /Postar Produto/ }));

    const [product, payload] = onSave.mock.calls[0];
    expect(payload.variants).toEqual([
      { codigoSku: "DKGALA-PADRAO-UNICO", color: "Padrão", size: "Único", stockOnline: 0, stockPhysical: 0, price: 99 },
    ]);
    expect(product.images).toHaveLength(1);
  });

  it("salva rascunho temporariamente", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setup();

    await userEvent.click(screen.getByRole("button", { name: /Salvar Rascunho/ }));
    expect(screen.getByRole("button", { name: /Rascunho Salvo/ })).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.getByRole("button", { name: /Salvar Rascunho/ })).toBeInTheDocument();
  });

  it("navega pelos passos já concluídos no menu lateral", async () => {
    setup();
    await fillStep1();

    await userEvent.click(screen.getByText("Informação Básica"));
    expect(screen.getByText("Passo 1 de 4")).toBeInTheDocument();
    expect(within(document.body).getByDisplayValue("Vestido Gala")).toBeInTheDocument();
  });
});
