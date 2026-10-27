import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api";
import {
  createReview,
  deleteMyReview,
  fetchMyReviewStatus,
  updateReview,
  type MyReviewStatus,
} from "@/lib/catalog";
import { renderWithProviders } from "@/test/render";
import { MyReviewPanel } from "./MyReviewPanel";

vi.mock("@/lib/catalog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/catalog")>()),
  fetchMyReviewStatus: vi.fn(),
  createReview: vi.fn(),
  updateReview: vi.fn(),
  deleteMyReview: vi.fn(),
}));

const statusMock = vi.mocked(fetchMyReviewStatus);
const customer = { id: "11144477735", name: "Mariana Lima", email: "mariana@email.com", role: "customer" as const };

const podeAvaliar: MyReviewStatus = { avaliacao: null, podeAvaliar: true, motivo: "PODE_AVALIAR" };
const semCompra: MyReviewStatus = { avaliacao: null, podeAvaliar: false, motivo: "SEM_COMPRA_VERIFICADA" };
const jaAvaliou: MyReviewStatus = {
  avaliacao: { idProduto: 7, nota: 4, comentario: "Caimento ótimo", dataAvaliacao: "2026-10-01T10:00:00Z", dataEdicao: null },
  podeAvaliar: false,
  motivo: "JA_AVALIOU",
};

const star = (n: number) => screen.getByRole("radio", { name: new RegExp(`^${n} ${n === 1 ? "estrela" : "estrelas"}`) });

function renderPanel(onChanged = vi.fn(), logged = true) {
  renderWithProviders(<MyReviewPanel productId={7} onChanged={onChanged} />, logged ? { user: customer } : {});
  return onChanged;
}

describe("MyReviewPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    statusMock.mockReset();
    vi.mocked(createReview).mockReset().mockResolvedValue(undefined);
    vi.mocked(updateReview).mockReset().mockResolvedValue(undefined);
    vi.mocked(deleteMyReview).mockReset().mockResolvedValue(undefined);
  });

  describe("estados", () => {
    it("convida a entrar quando não há login, sem chamar a API", () => {
      renderPanel(vi.fn(), false);

      expect(screen.getByRole("link", { name: "Entre na sua conta" })).toHaveAttribute("href", "/login");
      expect(statusMock).not.toHaveBeenCalled();
    });

    it("mostra o carregamento enquanto verifica", async () => {
      statusMock.mockReturnValueOnce(new Promise(() => {}));
      renderPanel();

      expect(await screen.findByText("Verificando a sua avaliação...")).toBeInTheDocument();
    });

    it("explica quando o cliente não comprou o produto", async () => {
      statusMock.mockResolvedValueOnce(semCompra);
      renderPanel();

      expect(await screen.findByText("Só quem comprou e pagou por este produto pode avaliá-lo.")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Publicar avaliação" })).not.toBeInTheDocument();
    });

    it("mostra o formulário quando o cliente pode avaliar", async () => {
      statusMock.mockResolvedValueOnce(podeAvaliar);
      renderPanel();

      expect(await screen.findByRole("button", { name: "Publicar avaliação" })).toBeInTheDocument();
    });

    it("mostra a avaliação do cliente quando ele já avaliou", async () => {
      statusMock.mockResolvedValueOnce(jaAvaliou);
      renderPanel();

      expect(await screen.findByText("Caimento ótimo")).toBeInTheDocument();
      expect(screen.getByLabelText("Sua nota: 4 de 5")).toBeInTheDocument();
      expect(screen.getByText(/Avaliado em 01\/10\/2026$/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remover" })).toBeInTheDocument();
    });

    it("marca a avaliação como editada", async () => {
      statusMock.mockResolvedValueOnce({
        ...jaAvaliou,
        avaliacao: { ...jaAvaliou.avaliacao!, dataEdicao: "2026-10-02T10:00:00Z" },
      });
      renderPanel();

      expect(await screen.findByText(/· editada/)).toBeInTheDocument();
    });

    it("permite tentar de novo quando a verificação falha", async () => {
      statusMock.mockRejectedValueOnce(new Error("rede")).mockResolvedValueOnce(podeAvaliar);
      renderPanel();

      expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível verificar a sua avaliação.");
      await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

      expect(await screen.findByRole("button", { name: "Publicar avaliação" })).toBeInTheDocument();
    });
  });

  describe("criar", () => {
    it("publica a avaliação, recarrega o estado e avisa a página", async () => {
      statusMock.mockResolvedValueOnce(podeAvaliar).mockResolvedValueOnce(jaAvaliou);
      const onChanged = renderPanel();

      await userEvent.click(await screen.findByRole("radio", { name: /^4 estrelas/ }));
      await userEvent.type(screen.getByLabelText(/Comentário/), "Caimento ótimo");
      await userEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));

      expect(createReview).toHaveBeenCalledWith(7, { nota: 4, comentario: "Caimento ótimo" });
      expect(await screen.findByText("Avaliado em 01/10/2026")).toBeInTheDocument();
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it("envia sem comentário quando o campo fica vazio", async () => {
      statusMock.mockResolvedValueOnce(podeAvaliar).mockResolvedValueOnce(jaAvaliou);
      renderPanel();

      await userEvent.click(await screen.findByRole("radio", { name: /^5 estrelas/ }));
      await userEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));

      expect(createReview).toHaveBeenCalledWith(7, { nota: 5, comentario: undefined });
    });

    it("mostra a mensagem do 403 sem recarregar a lista", async () => {
      statusMock.mockResolvedValueOnce(podeAvaliar);
      vi.mocked(createReview).mockRejectedValueOnce(new ApiError(403, "Forbidden"));
      const onChanged = renderPanel();

      await userEvent.click(await screen.findByRole("radio", { name: /^3 estrelas/ }));
      await userEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Só quem comprou e pagou por este produto pode avaliá-lo.");
      expect(onChanged).not.toHaveBeenCalled();
    });

    it("no 409 avisa que já avaliou e atualiza para a avaliação salva", async () => {
      statusMock.mockResolvedValueOnce(podeAvaliar).mockResolvedValueOnce(jaAvaliou);
      vi.mocked(createReview).mockRejectedValueOnce(new ApiError(409, "Conflict"));
      renderPanel();

      await userEvent.click(await screen.findByRole("radio", { name: /^3 estrelas/ }));
      await userEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));

      expect(await screen.findByText("Você já avaliou este produto.")).toBeInTheDocument();
      expect(await screen.findByText("Caimento ótimo")).toBeInTheDocument();
    });

    it("mostra uma mensagem genérica para erros inesperados", async () => {
      statusMock.mockResolvedValueOnce(podeAvaliar);
      vi.mocked(createReview).mockRejectedValueOnce(new Error("boom"));
      renderPanel();

      await userEvent.click(await screen.findByRole("radio", { name: /^3 estrelas/ }));
      await userEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível concluir. Tente novamente em instantes.");
    });
  });

  describe("editar", () => {
    it("abre o formulário preenchido, salva e volta a mostrar a avaliação", async () => {
      const editada: MyReviewStatus = {
        ...jaAvaliou,
        avaliacao: { ...jaAvaliou.avaliacao!, nota: 2, comentario: "Apertado", dataEdicao: "2026-10-02T10:00:00Z" },
      };
      statusMock.mockResolvedValueOnce(jaAvaliou).mockResolvedValueOnce(editada);
      const onChanged = renderPanel();

      await userEvent.click(await screen.findByRole("button", { name: "Editar" }));
      expect(star(4)).toHaveAttribute("aria-checked", "true");
      expect(screen.getByLabelText(/Comentário/)).toHaveValue("Caimento ótimo");

      await userEvent.click(star(2));
      const campo = screen.getByLabelText(/Comentário/);
      await userEvent.clear(campo);
      await userEvent.type(campo, "Apertado");
      await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

      expect(updateReview).toHaveBeenCalledWith(7, { nota: 2, comentario: "Apertado" });
      expect(await screen.findByText("Apertado")).toBeInTheDocument();
      expect(screen.getByText(/· editada/)).toBeInTheDocument();
      expect(onChanged).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("button", { name: "Salvar alterações" })).not.toBeInTheDocument();
    });

    it("limpa o comentário enviando texto vazio", async () => {
      statusMock.mockResolvedValueOnce(jaAvaliou).mockResolvedValueOnce(jaAvaliou);
      renderPanel();

      await userEvent.click(await screen.findByRole("button", { name: "Editar" }));
      await userEvent.clear(screen.getByLabelText(/Comentário/));
      await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

      expect(updateReview).toHaveBeenCalledWith(7, { nota: 4, comentario: "" });
    });

    it("cancela a edição sem chamar a API", async () => {
      statusMock.mockResolvedValueOnce(jaAvaliou);
      renderPanel();

      await userEvent.click(await screen.findByRole("button", { name: "Editar" }));
      await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(updateReview).not.toHaveBeenCalled();
      expect(screen.getByText("Caimento ótimo")).toBeInTheDocument();
    });

    it("mantém o formulário aberto e mostra o erro quando salvar falha", async () => {
      statusMock.mockResolvedValueOnce(jaAvaliou);
      vi.mocked(updateReview).mockRejectedValueOnce(new ApiError(400, "Bad Request"));
      renderPanel();

      await userEvent.click(await screen.findByRole("button", { name: "Editar" }));
      await userEvent.click(star(5));
      await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Confira a nota e o comentário e tente de novo.");
      expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
    });
  });

  describe("remover", () => {
    it("pede confirmação, remove e volta a oferecer o formulário", async () => {
      statusMock.mockResolvedValueOnce(jaAvaliou).mockResolvedValueOnce(podeAvaliar);
      const onChanged = renderPanel();

      await userEvent.click(await screen.findByRole("button", { name: "Remover" }));
      expect(screen.getByText("Remover a sua avaliação? Essa ação não pode ser desfeita.")).toBeInTheDocument();
      expect(deleteMyReview).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole("button", { name: "Remover avaliação" }));

      expect(deleteMyReview).toHaveBeenCalledWith(7);
      expect(await screen.findByRole("button", { name: "Publicar avaliação" })).toBeInTheDocument();
      expect(onChanged).toHaveBeenCalledTimes(1);
    });

    it("desiste da remoção sem chamar a API", async () => {
      statusMock.mockResolvedValueOnce(jaAvaliou);
      renderPanel();

      await userEvent.click(await screen.findByRole("button", { name: "Remover" }));
      await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(deleteMyReview).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    });

    it("mostra o erro e mantém a avaliação quando a remoção falha", async () => {
      statusMock.mockResolvedValueOnce(jaAvaliou);
      vi.mocked(deleteMyReview).mockRejectedValueOnce(new Error("boom"));
      renderPanel();

      await userEvent.click(await screen.findByRole("button", { name: "Remover" }));
      await userEvent.click(screen.getByRole("button", { name: "Remover avaliação" }));

      expect(await screen.findByText("Não foi possível concluir. Tente novamente em instantes.")).toBeInTheDocument();
      expect(screen.getByText("Caimento ótimo")).toBeInTheDocument();
    });
  });
});
