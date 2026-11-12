import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DraftColor } from "@/lib/productDraft";
import ImageCropDialog from "./ImageCropDialog";
import ProductImagesDialog from "./ProductImagesDialog";

/** Image do jsdom não carrega: esta dispara onload com 600 × 800 (3:4). */
class LoadedImage {
  naturalWidth = 600;
  naturalHeight = 800;
  crossOrigin = "";
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  set src(value: string) {
    setTimeout(() => (value.includes("quebrada") ? this.onerror?.() : this.onload?.()), 0);
  }
}

const drawImage = vi.fn();

beforeEach(() => {
  vi.stubGlobal("Image", LoadedImage);
  // O jsdom não tem PointerEvent: sem ele o clientX do arraste se perde.
  vi.stubGlobal("PointerEvent", MouseEvent);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,RECORTE");
  drawImage.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const color = (images: DraftColor["images"] = []): DraftColor => ({ name: "Rosa Bebê", hex: "#f9a8d4", images });
const dialog = () => {
  const dialogs = screen.getAllByRole("dialog");
  return within(dialogs[dialogs.length - 1]);
};

describe("ProductImagesDialog", () => {
  it("adiciona por link, define a capa, remove com confirmação e salva", async () => {
    const onSave = vi.fn();
    render(<ProductImagesDialog color={color([{ id: "1", src: "https://img/1.jpg", saved: false }])} productSku="DK-009" onClose={vi.fn()} onSave={onSave} />);

    expect(dialog().getByText("Rosa Bebê · DK-009")).toBeInTheDocument();
    await userEvent.type(dialog().getByLabelText("Ou adicionar por link"), "ftp://x");
    await userEvent.click(dialog().getByRole("button", { name: "Adicionar" }));
    expect(dialog().getByRole("alert")).toHaveTextContent("http:// ou https://");
    await userEvent.clear(dialog().getByLabelText("Ou adicionar por link"));
    await userEvent.type(dialog().getByLabelText("Ou adicionar por link"), "https://img/2.jpg");
    await userEvent.click(dialog().getByRole("button", { name: "Adicionar" }));
    expect(dialog().getByText("2 fotos")).toBeInTheDocument();
    expect(dialog().getByRole("button", { name: "Selecionar foto 2" })).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(dialog().getByRole("button", { name: "Usar como capa" }));
    expect(dialog().getByRole("status")).toHaveTextContent("Capa atualizada");

    await userEvent.click(dialog().getByRole("button", { name: "Selecionar foto 2" }));
    await userEvent.click(dialog().getByRole("button", { name: "Remover" }));
    await userEvent.click(dialog().getByRole("button", { name: "Manter foto" }));
    await userEvent.click(dialog().getByRole("button", { name: "Remover" }));
    await userEvent.click(dialog().getByRole("button", { name: "Remover foto" }));
    expect(dialog().getByRole("status")).toHaveTextContent("Imagem removida");

    await userEvent.click(dialog().getByRole("button", { name: "Salvar imagens" }));
    expect(onSave).toHaveBeenCalledWith([expect.objectContaining({ src: "https://img/2.jpg", saved: false })]);
  });

  it("fotos salvas ficam só para consulta", () => {
    render(<ProductImagesDialog color={color([{ id: "s", src: "https://img/salva.jpg", saved: true }])} productSku="DK-009" onClose={vi.fn()} onSave={vi.fn()} />);

    expect(dialog().getByText("Capa · salva")).toBeInTheDocument();
    expect(dialog().getByRole("button", { name: "Recortar" })).toBeDisabled();
    expect(dialog().getByRole("button", { name: "Remover" })).toBeDisabled();
    expect(dialog().getByText(/Fotos já salvas mantêm a ordem/)).toBeInTheDocument();
  });

  it("envia um arquivo pelo recorte 3:4 e recusa formatos inválidos", async () => {
    const onSave = vi.fn();
    render(<ProductImagesDialog color={color()} productSku="DK-009" onClose={vi.fn()} onSave={onSave} />);
    expect(dialog().getByText("Nenhuma foto desta cor")).toBeInTheDocument();

    fireEvent.change(dialog().getByLabelText("Adicionar fotos"), { target: { files: [new File(["x"], "a.gif", { type: "image/gif" })] } });
    expect(dialog().getByRole("alert")).toHaveTextContent("Envie uma imagem JPG, PNG ou WebP.");

    fireEvent.change(dialog().getByLabelText("Adicionar fotos"), { target: { files: [new File(["x"], "a.png", { type: "image/png" })] } });
    expect(await screen.findByRole("heading", { name: "Recortar imagem" })).toBeInTheDocument();
    await waitFor(() => expect(dialog().getByRole("button", { name: "Aplicar recorte" })).toBeEnabled());
    await userEvent.click(dialog().getByRole("button", { name: "Aplicar recorte" }));

    expect(await screen.findByRole("heading", { name: "Imagens do produto" })).toBeInTheDocument();
    expect(dialog().getByRole("status")).toHaveTextContent("Recorte aplicado");
    await userEvent.click(dialog().getByRole("button", { name: "Recortar" }));
    await waitFor(() => expect(dialog().getByRole("button", { name: "Aplicar recorte" })).toBeEnabled());
    await userEvent.click(dialog().getByRole("button", { name: "Cancelar" }));
    await userEvent.click(await screen.findByRole("button", { name: "Salvar imagens" }));
    expect(onSave).toHaveBeenCalledWith([expect.objectContaining({ src: "data:image/jpeg;base64,RECORTE" })]);
  });
});

describe("ImageCropDialog", () => {
  it("ajusta zoom e enquadramento e exporta a área 3:4", async () => {
    const onApply = vi.fn();
    render(<ImageCropDialog src="data:image/png;base64,AAA" onClose={vi.fn()} onApply={onApply} />);
    await waitFor(() => expect(screen.getByAltText("Foto em ajuste")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: "Aumentar zoom" }));
    expect(screen.getByText("Zoom 110%")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Zoom da imagem"), { target: { value: "200" } });
    await userEvent.click(screen.getByRole("button", { name: "Diminuir zoom" }));
    expect(screen.getByText("Zoom 190%")).toBeInTheDocument();

    const frame = screen.getByTestId("crop-frame");
    fireEvent.pointerDown(frame, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(frame, { clientX: 5000, clientY: 5000, pointerId: 1 });
    fireEvent.pointerUp(frame, { pointerId: 1 });
    // Arrastar além da borda para no limite: a imagem continua cobrindo a moldura.
    expect(screen.getByAltText("Foto em ajuste").style.transform).toBe("translate(0px, 0px)");

    await userEvent.click(screen.getByRole("button", { name: "Redefinir enquadramento" }));
    expect(screen.getByText("Zoom 100%")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
    expect(drawImage).toHaveBeenCalledWith(expect.any(LoadedImage), 0, 0, 600, 800, 0, 0, 900, 1200);
    expect(onApply).toHaveBeenCalledWith("data:image/jpeg;base64,RECORTE");
  });

  it("avisa quando a imagem não carrega ou não pode ser recortada", async () => {
    const { unmount } = render(<ImageCropDialog src="https://img/quebrada.jpg" onClose={vi.fn()} onApply={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar esta imagem");
    unmount();

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(HTMLCanvasElement.prototype.toDataURL).mockImplementation(() => {
      throw new DOMException("Tainted canvas", "SecurityError");
    });
    render(<ImageCropDialog src="https://img/externa.jpg" onClose={vi.fn()} onApply={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Aplicar recorte" })).toBeEnabled());
    await userEvent.click(screen.getByRole("button", { name: "Aplicar recorte" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Envie o arquivo pelo computador");
  });
});
