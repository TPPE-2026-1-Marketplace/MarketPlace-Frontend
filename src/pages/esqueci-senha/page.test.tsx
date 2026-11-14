import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/render";
import EsqueciSenhaPage from "./page";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn() },
}));
const postMock = vi.mocked(api.post);

const GENERIC = "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.";

async function submit(email: string) {
  await userEvent.type(screen.getByLabelText("E-mail"), email);
  await userEvent.click(screen.getByRole("button", { name: "Enviar link" }));
}

describe("EsqueciSenhaPage", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("pede o link e mostra a confirmação genérica", async () => {
    postMock.mockResolvedValueOnce({ message: GENERIC });
    renderWithProviders(<EsqueciSenhaPage />, { route: "/esqueci-senha", path: "/esqueci-senha" });

    await submit("  maria@dk.com ");

    expect(postMock).toHaveBeenCalledWith("/auth/forgot-password", { email: "maria@dk.com" });
    expect(await screen.findByRole("status")).toHaveTextContent(GENERIC);
    expect(screen.getByText("maria@dk.com")).toBeInTheDocument();

    // "Enviar de novo" volta ao formulário com o e-mail preenchido.
    await userEvent.click(screen.getByRole("button", { name: "Não recebeu? Enviar de novo" }));
    expect(screen.getByLabelText("E-mail")).toHaveValue("maria@dk.com");
  });

  it.each([
    [new ApiError(429, "Too Many Requests"), "Muitas tentativas. Aguarde alguns minutos e tente de novo."],
    [new ApiError(503, "x"), "Recuperação de senha indisponível no momento. Fale com a loja."],
    [new Error("rede"), "Não foi possível concluir agora. Tente novamente."],
  ])("mostra o erro e mantém o formulário (%s)", async (error, text) => {
    postMock.mockRejectedValueOnce(error);
    renderWithProviders(<EsqueciSenhaPage />, { route: "/esqueci-senha", path: "/esqueci-senha" });

    await submit("maria@dk.com");

    expect(await screen.findByRole("alert")).toHaveTextContent(text);
    expect(screen.getByRole("button", { name: "Enviar link" })).toBeInTheDocument();
  });

  it("tem link de volta para o login", () => {
    renderWithProviders(<EsqueciSenhaPage />, { route: "/esqueci-senha", path: "/esqueci-senha" });
    expect(screen.getByRole("link", { name: "Voltar para o login" })).toHaveAttribute("href", "/login");
  });
});
