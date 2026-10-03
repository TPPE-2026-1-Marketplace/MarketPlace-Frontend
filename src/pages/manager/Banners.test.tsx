import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Banners } from "./Banners";

const titles = () =>
  screen.getAllByText(/^(Elegância que transforma cada momento|Sua conquista merece o vestido perfeito|Vestidos que contam histórias inesquecíveis|Banner Novo)$/)
    .map((el) => el.textContent);

describe("Banners", () => {
  it("lista os banners na ordem do carrossel", () => {
    renderWithProviders(<Banners />);

    expect(screen.getByText("3 de 3 banners ativos no carrossel")).toBeInTheDocument();
    expect(titles()).toHaveLength(3);
  });

  it("reordena, ativa/desativa e pré-visualiza", async () => {
    renderWithProviders(<Banners />);

    await userEvent.click(screen.getAllByLabelText("Mover para baixo")[0]);
    expect(titles()[0]).toBe("Sua conquista merece o vestido perfeito");
    await userEvent.click(screen.getAllByLabelText("Mover para cima")[1]);
    expect(titles()[0]).toBe("Elegância que transforma cada momento");

    await userEvent.click(screen.getAllByLabelText("Desativar banner")[0]);
    expect(screen.getByText("2 de 3 banners ativos no carrossel")).toBeInTheDocument();
    expect(screen.getByLabelText("Ativar banner")).toBeInTheDocument();

    await userEvent.click(screen.getAllByLabelText("Pré-visualizar banner")[0]);
    const preview = screen.getByLabelText("Fechar preview").parentElement!;
    expect(within(preview).getByText("Inativo")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Fechar preview"));
    expect(screen.queryByLabelText("Fechar preview")).not.toBeInTheDocument();
  });

  it("valida e cria um banner novo", async () => {
    renderWithProviders(<Banners />);
    await userEvent.click(screen.getByRole("button", { name: /Novo Banner/ }));
    expect(screen.getByRole("heading", { name: "Novo Banner" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.getByText("URL da imagem é obrigatória")).toBeInTheDocument();
    expect(screen.getByText("Título é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Botão principal é obrigatório")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText("https://..."), "https://img/novo.jpg");
    await userEvent.type(screen.getByPlaceholderText("ex: Nova Coleção 2026"), "Lançamento");
    await userEvent.type(screen.getByPlaceholderText("Título principal do banner"), "Banner Novo");
    await userEvent.type(screen.getByPlaceholderText("Descrição breve do banner"), "Sub");
    await userEvent.type(screen.getByPlaceholderText("ex: Ver Coleção"), "Comprar");
    await userEvent.type(screen.getByPlaceholderText("ex: Debutante"), "Midi");
    const [primary, secondary] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(primary, "festa");
    await userEvent.selectOptions(secondary, "midi");

    await userEvent.click(screen.getByRole("button", { name: /Preview/ }));
    expect(screen.getAllByText("Lançamento").length).toBeGreaterThan(0);
    await userEvent.click(screen.getByLabelText("Fechar preview"));

    const toggle = screen.getByText("Status do banner").nextElementSibling as HTMLElement;
    await userEvent.click(toggle);
    expect(within(toggle).getByText("Inativo")).toBeInTheDocument();
    await userEvent.click(toggle);

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(screen.queryByRole("heading", { name: "Novo Banner" })).not.toBeInTheDocument();
    expect(titles()).toContain("Banner Novo");
    expect(screen.getByText("4 de 4 banners ativos no carrossel")).toBeInTheDocument();
  });

  it("edita um banner existente e cancela outra edição", async () => {
    renderWithProviders(<Banners />);

    await userEvent.click(screen.getAllByLabelText("Editar banner")[0]);
    expect(screen.getByRole("heading", { name: "Editar Banner" })).toBeInTheDocument();
    const title = screen.getByPlaceholderText("Título principal do banner");
    await userEvent.clear(title);
    await userEvent.type(title, "Banner Novo");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(titles()[0]).toBe("Banner Novo");

    await userEvent.click(screen.getAllByLabelText("Editar banner")[1]);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("heading", { name: "Editar Banner" })).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByLabelText("Editar banner")[1]);
    await userEvent.click(screen.getByLabelText("Fechar"));
    expect(screen.queryByRole("heading", { name: "Editar Banner" })).not.toBeInTheDocument();
  });

  it("confirma a remoção e mostra o estado vazio", async () => {
    renderWithProviders(<Banners />);

    await userEvent.click(screen.getAllByLabelText("Remover banner")[0]);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(titles()).toHaveLength(3);

    for (let i = 0; i < 3; i++) {
      await userEvent.click(screen.getAllByLabelText("Remover banner")[0]);
      expect(screen.getByRole("heading", { name: "Remover banner" })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Remover" }));
    }

    expect(screen.getByText("Nenhum banner cadastrado.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Criar primeiro banner" }));
    expect(screen.getByRole("heading", { name: "Novo Banner" })).toBeInTheDocument();
  });
});
