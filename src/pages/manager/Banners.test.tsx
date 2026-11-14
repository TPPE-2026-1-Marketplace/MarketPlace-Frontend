import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import HeroSection from "@/components/sections/HeroSection";
import { api } from "@/lib/api";
import { renderWithProviders } from "@/test/render";
import { Banners } from "./Banners";

class LoadedBannerImage {
  naturalWidth = 1600;
  naturalHeight = 700;
  crossOrigin = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(_value: string) {
    setTimeout(() => this.onload?.(), 0);
  }
}

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

  it("reordena os banners via drag-and-drop", () => {
    renderWithProviders(<Banners />);

    const items = screen.getAllByRole("listitem");
    expect(titles()).toEqual([
      "Elegância que transforma cada momento",
      "Sua conquista merece o vestido perfeito",
      "Vestidos que contam histórias inesquecíveis",
    ]);

    fireEvent.dragStart(items[2]);
    fireEvent.dragOver(items[0]);
    fireEvent.drop(items[0]);
    fireEvent.dragEnd(items[2]);

    expect(titles()).toEqual([
      "Vestidos que contam histórias inesquecíveis",
      "Elegância que transforma cada momento",
      "Sua conquista merece o vestido perfeito",
    ]);
  });

  it("reflete reordenação e desativação no carrossel da vitrine", async () => {
    renderWithProviders(
      <>
        <Banners />
        <HeroSection />
      </>,
    );

    const hero = screen.getByLabelText("Banner principal");
    expect(within(hero).getByRole("heading", { level: 1 })).toHaveTextContent(
      "Elegância que transforma cada momento",
    );

    await userEvent.click(screen.getAllByLabelText("Desativar banner")[0]);
    expect(within(hero).getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sua conquista merece o vestido perfeito",
    );
    expect(within(hero).getByText("01 / 02")).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    fireEvent.dragStart(items[2]);
    fireEvent.dragOver(items[0]);
    fireEvent.drop(items[0]);
    expect(within(hero).getByRole("heading", { level: 1 })).toHaveTextContent(
      "Vestidos que contam histórias inesquecíveis",
    );
  });

  it("faz upload de imagem com recorte 16:7 para o ImgBB e trata falha mantendo fallback por URL", async () => {
    vi.stubGlobal("Image", LoadedBannerImage);
    vi.stubGlobal("PointerEvent", MouseEvent);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ blob: async () => new Blob(["img"], { type: "image/jpeg" }) })),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/jpeg;base64,BANNER_RECORTE",
    );
    const postSpy = vi
      .spyOn(api, "post")
      .mockRejectedValueOnce(new Error("ImgBB indisponível"))
      .mockResolvedValueOnce({ idImagem: 77, url: "https://i.ibb.co/banner-novo.jpg" });

    renderWithProviders(<Banners />);
    await userEvent.click(screen.getByRole("button", { name: /Novo Banner/ }));

    fireEvent.change(screen.getByLabelText("Enviar imagem do computador"), {
      target: { files: [new File(["x"], "banner.gif", { type: "image/gif" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("Envie uma imagem JPG, PNG ou WebP.");

    fireEvent.change(screen.getByLabelText("Enviar imagem do computador"), {
      target: { files: [new File(["x"], "banner.png", { type: "image/png" })] },
    });
    expect(await screen.findByRole("heading", { name: "Recortar imagem" })).toBeInTheDocument();
    expect(screen.getByText("Proporção fixa 16:7")).toBeInTheDocument();
    const cropDialog = screen.getByRole("dialog");
    await waitFor(() =>
      expect(within(cropDialog).getByRole("button", { name: "Aplicar recorte" })).toBeEnabled(),
    );
    await userEvent.click(within(cropDialog).getByRole("button", { name: "Aplicar recorte" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível enviar a imagem para o servidor",
    );
    expect(screen.getByPlaceholderText("https://...")).toHaveValue("");

    fireEvent.change(screen.getByLabelText("Enviar imagem do computador"), {
      target: { files: [new File(["x"], "banner-ok.jpg", { type: "image/jpeg" })] },
    });
    const retryCropDialog = await screen.findByRole("dialog");
    await waitFor(() =>
      expect(within(retryCropDialog).getByRole("button", { name: "Aplicar recorte" })).toBeEnabled(),
    );
    await userEvent.click(
      within(retryCropDialog).getByRole("button", { name: "Aplicar recorte" }),
    );

    await waitFor(() =>
      expect(screen.getByPlaceholderText("https://...")).toHaveValue(
        "https://i.ibb.co/banner-novo.jpg",
      ),
    );
    expect(postSpy).toHaveBeenCalledWith("/images/upload", expect.any(FormData));
    const uploadedFormData = postSpy.mock.calls[0][1] as FormData;
    expect(uploadedFormData.get("local_renderizacao")).toBe("banner");
  });

  it("protege contra perda de alterações não salvas ao tentar fechar o formulário", async () => {
    renderWithProviders(<Banners />);
    await userEvent.click(screen.getByRole("button", { name: /Novo Banner/ }));

    const titleInput = screen.getByPlaceholderText("Título principal do banner");
    await userEvent.type(titleInput, "Campanha em Edição");

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Você tem alterações não salvas. Deseja descartá-las?",
    );

    await userEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(
      screen.queryByText("Você tem alterações não salvas. Deseja descartá-las?"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Novo Banner" })).toBeInTheDocument();
    expect(titleInput).toHaveValue("Campanha em Edição");

    await userEvent.click(screen.getByLabelText("Fechar"));
    await userEvent.click(screen.getByRole("button", { name: "Descartar alterações" }));
    expect(screen.queryByRole("heading", { name: "Novo Banner" })).not.toBeInTheDocument();
  });

  it("filtra por status e trava a reordenação enquanto um filtro estiver ativo", async () => {
    renderWithProviders(<Banners />);

    await userEvent.click(screen.getAllByLabelText("Desativar banner")[0]);

    await userEvent.click(screen.getByRole("button", { name: "Ativos (2)" }));
    expect(screen.getByRole("button", { name: "Ativos (2)" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText(/Exibindo apenas banners filtrados/)).toBeInTheDocument();
    for (const btn of screen.getAllByLabelText("Mover para cima")) {
      expect(btn).toBeDisabled();
    }
    for (const btn of screen.getAllByLabelText("Mover para baixo")) {
      expect(btn).toBeDisabled();
    }

    await userEvent.click(screen.getByRole("button", { name: "Inativos (1)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("Elegância que transforma cada momento")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Todos (3)" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.queryByText(/Exibindo apenas banners filtrados/)).not.toBeInTheDocument();
  });
});
