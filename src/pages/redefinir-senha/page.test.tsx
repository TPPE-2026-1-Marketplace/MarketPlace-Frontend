import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "@/lib/api";
import { renderWithProviders } from "@/test/render";
import RedefinirSenhaPage from "./page";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  api: { get: vi.fn(), post: vi.fn() },
}));
const postMock = vi.mocked(api.post);
const location = () => screen.getByTestId("location").textContent;

function renderWithToken(token = "tok_abc-123") {
  renderWithProviders(<RedefinirSenhaPage />, {
    route: `/redefinir-senha${token ? `?token=${token}` : ""}`,
    path: "/redefinir-senha",
  });
}

async function fill(password: string, confirmation = password) {
  await userEvent.type(screen.getByLabelText("Nova senha"), password);
  await userEvent.type(screen.getByLabelText("Confirmar nova senha"), confirmation);
  await userEvent.click(screen.getByRole("button", { name: "Salvar nova senha" }));
}

describe("RedefinirSenhaPage", () => {
  beforeEach(() => {
    postMock.mockReset();
  });

  it("salva a nova senha e volta para o login", async () => {
    postMock.mockResolvedValueOnce({ message: "ok" });
    renderWithToken();

    await fill("novaSenha123");

    expect(postMock).toHaveBeenCalledWith("/auth/reset-password", {
      token: "tok_abc-123",
      novaSenha: "novaSenha123",
    });
    await waitFor(() => expect(location()).toBe("/login?senha=redefinida"));
  });

  it("valida tamanho e confirmação antes de chamar a API", async () => {
    renderWithToken();

    await fill("curta");
    expect(screen.getByRole("alert")).toHaveTextContent("pelo menos 8 caracteres");

    await userEvent.clear(screen.getByLabelText("Nova senha"));
    await userEvent.clear(screen.getByLabelText("Confirmar nova senha"));
    await fill("novaSenha123", "outraSenha123");
    expect(screen.getByRole("alert")).toHaveTextContent("As senhas não conferem.");
    expect(postMock).not.toHaveBeenCalled();
  });

  it("mostra o erro de link vencido vindo da API", async () => {
    postMock.mockRejectedValueOnce(
      new ApiError(400, "Link de redefinição inválido ou expirado. Peça um novo."),
    );
    renderWithToken();

    await fill("novaSenha123");

    expect(await screen.findByRole("alert")).toHaveTextContent("inválido ou expirado");
    expect(screen.getByRole("link", { name: "Pedir um novo" })).toHaveAttribute("href", "/esqueci-senha");
  });

  it("sem token mostra link inválido e oferece pedir outro", () => {
    renderWithToken("");

    expect(screen.getByRole("alert")).toHaveTextContent("Link de redefinição inválido ou incompleto.");
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedir um novo link" })).toHaveAttribute("href", "/esqueci-senha");
  });

  it("alterna a visibilidade das senhas", async () => {
    renderWithToken();
    const senha = screen.getByLabelText("Nova senha");
    expect(senha).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    expect(senha).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Confirmar nova senha")).toHaveAttribute("type", "text");
  });
});
