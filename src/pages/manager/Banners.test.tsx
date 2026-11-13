import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { customer, renderWithProviders, superadmin } from "@/test/render";
import { Banners } from "./Banners";

const rows = () => screen.getAllByRole("row").slice(1);
const kpi = (label: string) => screen.getByText(label, { selector: "p" }).nextElementSibling;
const dialog = () => within(screen.getByRole("dialog"));

async function renderBanners() {
  renderWithProviders(<Banners />, { user: superadmin });
  await screen.findByRole("heading", { level: 1, name: "Banners" });
}

async function applyFilters(values: { search?: string; status?: string }) {
  const searchInput = screen.getByLabelText("Buscar título ou coleção");
  await userEvent.clear(searchInput);
  if (values.search) await userEvent.type(searchInput, values.search);
  if (values.status) {
    await userEvent.selectOptions(screen.getByLabelText(/^Status:/), values.status);
  }
  await userEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
}

describe("Banners", () => {
  it("bloqueia quem não possui permissão de gerenciamento", () => {
    renderWithProviders(<Banners />, { user: customer });

    expect(
      screen.getByText("Apenas gerentes e administradores podem gerenciar banners."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Novo banner" })).not.toBeInTheDocument();
  });

  it("lista os banners com indicadores, ordem, coleção, botão e status", async () => {
    await renderBanners();

    expect(screen.getByRole("heading", { level: 1, name: "Banners" })).toBeInTheDocument();
    expect(kpi("Publicados")).toHaveTextContent("03");
    expect(kpi("Rascunhos")).toHaveTextContent("00");

    expect(rows()).toHaveLength(3);
    const firstRow = rows()[0];
    expect(firstRow).toHaveTextContent("01");
    expect(firstRow).toHaveTextContent("Elegância que transforma cada momento");
    expect(firstRow).toHaveTextContent("Nova Coleção 2026");
    expect(firstRow).toHaveTextContent("Ver Coleção");
    expect(firstRow).toHaveTextContent("Publicado");
    expect(screen.getByText("Acesso conforme o perfil do usuário")).toBeInTheDocument();
  });

  it("filtra por busca e status e limpa os filtros", async () => {
    await renderBanners();

    await applyFilters({ search: "Formatura" });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent("Sua conquista merece o vestido perfeito");

    await applyFilters({ status: "draft" });
    expect(screen.getByText("Nenhum resultado encontrado")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(rows()).toHaveLength(3);
  });

  it("valida campos obrigatórios no cadastro de novo banner", async () => {
    await renderBanners();

    await userEvent.click(screen.getByRole("button", { name: "Novo banner" }));
    expect(dialog().getByRole("heading", { name: "Novo banner" })).toBeInTheDocument();

    await userEvent.click(dialog().getByRole("button", { name: "Salvar banner" }));
    expect(dialog().getByRole("alert")).toHaveTextContent("Preencha todos os campos obrigatórios.");
    expect(dialog().getByText("URL da imagem é obrigatória.")).toBeInTheDocument();
    expect(dialog().getByText("Título é obrigatório.")).toBeInTheDocument();

    await userEvent.click(dialog().getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("pré-visualiza o banner e volta à edição mantendo os dados preenchidos", async () => {
    await renderBanners();

    await userEvent.click(screen.getByRole("button", { name: "Novo banner" }));

    await userEvent.type(
      dialog().getByLabelText("URL da imagem *"),
      "https://example.com/banner.jpg",
    );
    await userEvent.type(dialog().getByLabelText("Coleção"), "Preview Teste");
    await userEvent.type(dialog().getByLabelText("Título *"), "Título do Preview");
    await userEvent.type(dialog().getByLabelText("Subtítulo"), "Descrição do Preview");
    await userEvent.type(dialog().getByLabelText("Texto do botão principal"), "Botão Ação");

    await userEvent.click(dialog().getByRole("button", { name: "Pré-visualizar" }));
    expect(dialog().getByRole("heading", { name: "Pré-visualização do banner" })).toBeInTheDocument();
    expect(dialog().getByText("Título do Preview")).toBeInTheDocument();
    expect(dialog().getByText("Descrição do Preview")).toBeInTheDocument();
    expect(dialog().getByText("Botão Ação")).toBeInTheDocument();
    expect(dialog().getByText("/produtos")).toBeInTheDocument();

    await userEvent.click(dialog().getByRole("button", { name: "Voltar à edição" }));
    expect(dialog().getByRole("heading", { name: "Novo banner" })).toBeInTheDocument();
    expect(dialog().getByLabelText("URL da imagem *")).toHaveValue("https://example.com/banner.jpg");
    expect(dialog().getByLabelText("Título *")).toHaveValue("Título do Preview");

    await userEvent.click(dialog().getByRole("button", { name: "Cancelar" }));
  });

  it("cria um novo banner com sucesso e mostra a confirmação", async () => {
    await renderBanners();

    await userEvent.click(screen.getByRole("button", { name: "Novo banner" }));

    await userEvent.type(
      dialog().getByLabelText("URL da imagem *"),
      "https://images.unsplash.com/photo-test",
    );
    await userEvent.type(dialog().getByLabelText("Coleção"), "Primavera 2026");
    await userEvent.type(dialog().getByLabelText("Título *"), "Flores de Primavera");
    await userEvent.type(dialog().getByLabelText("Subtítulo"), "Novos modelos para a estação");
    await userEvent.type(dialog().getByLabelText("Texto do botão principal"), "Conhecer");

    await userEvent.click(dialog().getByRole("button", { name: "Salvar banner" }));

    expect(await screen.findByRole("heading", { name: "Alterações salvas" })).toBeInTheDocument();
    expect(dialog().getByText("Resultado").nextElementSibling).toHaveTextContent(
      'Banner Flores de Primavera criado',
    );

    await userEvent.click(dialog().getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(rows()).toHaveLength(4);
    expect(kpi("Publicados")).toHaveTextContent("04");
  });

  it("edita um banner existente e salva as alterações", async () => {
    await renderBanners();

    await userEvent.click(
      screen.getByRole("button", {
        name: "Editar banner Elegância que transforma cada momento",
      }),
    );

    expect(
      dialog().getByRole("heading", {
        name: "Banner · Elegância que transforma cada momento",
      }),
    ).toBeInTheDocument();

    const titleInput = dialog().getByLabelText("Título *");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Elegância Renovada");

    await userEvent.selectOptions(dialog().getByLabelText("Status"), "draft");

    await userEvent.click(dialog().getByRole("button", { name: "Salvar banner" }));

    expect(await screen.findByRole("heading", { name: "Alterações salvas" })).toBeInTheDocument();
    expect(dialog().getByText("Resultado").nextElementSibling).toHaveTextContent(
      'Banner Elegância que transforma cada momento atualizado',
    );

    await userEvent.click(dialog().getByRole("button", { name: "Concluir" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

    expect(screen.getByText("Elegância Renovada")).toBeInTheDocument();
    expect(kpi("Publicados")).toHaveTextContent("02");
    expect(kpi("Rascunhos")).toHaveTextContent("01");
  });
});
