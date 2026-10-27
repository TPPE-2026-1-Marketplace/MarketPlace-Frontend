import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReviewForm } from "./ReviewForm";

const star = (n: number) => screen.getByRole("radio", { name: new RegExp(`^${n} ${n === 1 ? "estrela" : "estrelas"}`) });

describe("ReviewForm", () => {
  it("envia a nota escolhida e o comentário", async () => {
    const onSubmit = vi.fn();
    render(<ReviewForm submitLabel="Publicar avaliação" onSubmit={onSubmit} />);

    await userEvent.click(star(4));
    await userEvent.type(screen.getByLabelText(/Comentário/), "  Caimento perfeito  ");
    await userEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));

    expect(onSubmit).toHaveBeenCalledWith({ nota: 4, comentario: "Caimento perfeito" });
  });

  it("exige a nota antes de enviar", async () => {
    const onSubmit = vi.fn();
    render(<ReviewForm submitLabel="Publicar avaliação" onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Escolha uma nota de 1 a 5 estrelas.");

    await userEvent.click(star(5));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("permite avaliar sem comentário", async () => {
    const onSubmit = vi.fn();
    render(<ReviewForm submitLabel="Publicar avaliação" onSubmit={onSubmit} />);

    await userEvent.click(star(2));
    await userEvent.click(screen.getByRole("button", { name: "Publicar avaliação" }));

    expect(onSubmit).toHaveBeenCalledWith({ nota: 2, comentario: "" });
  });

  it("marca a estrela escolhida e mostra o rótulo da nota", async () => {
    render(<ReviewForm submitLabel="Publicar avaliação" onSubmit={vi.fn()} />);

    await userEvent.click(star(3));

    expect(star(3)).toHaveAttribute("aria-checked", "true");
    expect(star(4)).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Bom")).toBeInTheDocument();
  });

  it("muda a nota pelas setas do teclado", async () => {
    render(<ReviewForm submitLabel="Publicar avaliação" onSubmit={vi.fn()} />);

    await userEvent.click(star(3));
    await userEvent.keyboard("{ArrowRight}");
    expect(star(4)).toHaveAttribute("aria-checked", "true");

    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}{ArrowLeft}{ArrowLeft}");
    expect(star(1)).toHaveAttribute("aria-checked", "true");
  });

  it("limita o comentário a 2000 caracteres e mostra o contador", async () => {
    render(<ReviewForm submitLabel="Publicar avaliação" onSubmit={vi.fn()} />);

    const campo = screen.getByLabelText(/Comentário/);
    expect(campo).toHaveAttribute("maxlength", "2000");
    await userEvent.type(campo, "abc");

    expect(screen.getByText("3/2000")).toBeInTheDocument();
  });

  it("começa preenchido no modo edição e oferece cancelar", async () => {
    const onCancel = vi.fn();
    render(
      <ReviewForm
        initialValues={{ nota: 2, comentario: "Apertado" }}
        submitLabel="Salvar alterações"
        onSubmit={vi.fn()}
        onCancel={onCancel}
      />,
    );

    expect(star(2)).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText(/Comentário/)).toHaveValue("Apertado");

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro da API e bloqueia o envio enquanto salva", () => {
    render(
      <ReviewForm
        initialValues={{ nota: 5, comentario: "" }}
        submitLabel="Salvar alterações"
        isSubmitting
        error="Não foi possível concluir."
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível concluir.");
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
  });
});
