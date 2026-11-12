import { useState, type ChangeEvent } from "react";
import Button from "@/components/ui/Button";
import { localImageId, type DraftColor, type DraftImage } from "@/lib/productDraft";
import { cn } from "@/lib/utils";
import ImageCropDialog from "./ImageCropDialog";
import WideDialog from "./WideDialog";
import { adminButtonClassName, adminControlClassName } from "./adminClasses";

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

interface ProductImagesDialogProps {
  /** Cor aberta; null fecha o dialog. */
  color: DraftColor | null;
  productSku: string;
  onClose: () => void;
  onSave: (images: DraftImage[]) => void;
}

type CropTarget = { kind: "new"; src: string } | { kind: "replace"; index: number };

/**
 * Frames "Produto / Gerenciar imagens" (764:14744), "Capa atualizada" (764:14812),
 * "Recorte aplicado" (866:4242), "Remover imagem" (866:4339) e "Imagem removida" (866:4292).
 * Fotos já salvas no backend só são exibidas: a API não remove nem reordena vínculos.
 */
export default function ProductImagesDialog(props: ProductImagesDialogProps) {
  return <ProductImagesContent key={props.color?.name ?? "fechado"} {...props} />;
}

function ProductImagesContent({ color, productSku, onClose, onSave }: ProductImagesDialogProps) {
  const [images, setImages] = useState<DraftImage[]>(() => color?.images ?? []);
  const [selected, setSelected] = useState(0);
  const [crop, setCrop] = useState<CropTarget | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!color) return <WideDialog open={false} onClose={onClose} title="">{null}</WideDialog>;

  const current = images[selected];
  const hasSaved = images.some((image) => image.saved);
  const editable = current && !current.saved;

  const addFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setError("Envie uma imagem JPG, PNG ou WebP.");
      return;
    }
    setError(null);
    // Toda foto nova passa pelo recorte 3:4.
    setCrop({ kind: "new", src: await readFileAsDataUrl(file) });
  };

  const addLink = () => {
    const url = link.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setError("Informe um link começando com http:// ou https://.");
      return;
    }
    setError(null);
    setImages((list) => [...list, { id: localImageId(), src: url, saved: false }]);
    setSelected(images.length);
    setLink("");
    setStatus("Foto adicionada por link");
  };

  const applyCrop = (dataUrl: string) => {
    if (crop?.kind === "new") {
      setImages((list) => [...list, { id: localImageId(), src: dataUrl, saved: false }]);
      setSelected(images.length);
    } else if (crop?.kind === "replace") {
      setImages((list) => list.map((image, index) => (index === crop.index ? { ...image, src: dataUrl } : image)));
    }
    setCrop(null);
    setStatus("Recorte aplicado");
  };

  const makeCover = () => {
    setImages((list) => [list[selected], ...list.filter((_, index) => index !== selected)]);
    setSelected(0);
    setStatus("Capa atualizada");
  };

  const remove = () => {
    setImages((list) => list.filter((_, index) => index !== selected));
    setSelected(0);
    setConfirmRemove(false);
    setStatus("Imagem removida");
  };

  return (
    <>
      <WideDialog
        open={crop === null}
        onClose={onClose}
        title="Imagens do produto"
        footer={
          <>
            <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="action"
              size="sm"
              className={`${adminButtonClassName} md:min-w-[220px]`}
              onClick={() => onSave(images)}
            >
              Salvar imagens
            </Button>
          </>
        }
      >
        <div className="flex items-start justify-between gap-4">
          <p className="text-[13px] leading-5 font-medium text-[var(--foreground)]">
            {color.name} · {productSku || "SKU a definir"}
          </p>
          <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">
            {images.length} {images.length === 1 ? "foto" : "fotos"}
          </p>
        </div>
        {status && (
          <p role="status" className="text-xs leading-[18px] text-[var(--color-brand)]">
            {status}
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-6 md:flex-row">
          <figure className="flex w-full shrink-0 flex-col items-center gap-2 md:w-[320px]">
            {current ? (
              <img
                src={current.src}
                alt={`Foto ${selected + 1} de ${color.name}`}
                className="aspect-[3/4] w-full rounded-[6px] object-cover"
              />
            ) : (
              <div className="flex aspect-[3/4] w-full items-center justify-center rounded-[6px] bg-[var(--background-secondary)] text-xs text-[var(--foreground-muted)]">
                Nenhuma foto desta cor
              </div>
            )}
            {current && (
              <figcaption className="text-xs leading-[18px] text-[var(--foreground-muted)]">Foto {selected + 1}</figcaption>
            )}
          </figure>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {images.length > 0 && (
              <ul className="grid grid-cols-3 gap-3" aria-label="Fotos da cor">
                {images.map((image, index) => (
                  <li key={image.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(index);
                        setConfirmRemove(false);
                      }}
                      aria-pressed={index === selected}
                      aria-label={`Selecionar foto ${index + 1}`}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-[6px] text-left",
                        index === selected && "ring-2 ring-[var(--color-brand)]",
                      )}
                    >
                      <img src={image.src} alt="" className="aspect-[3/4] w-full rounded-[6px] object-cover" />
                      <span
                        className={cn(
                          "text-[11px] leading-[17px] font-medium",
                          index === selected ? "text-[var(--color-brand)]" : "text-[var(--foreground-muted)]",
                        )}
                      >
                        {index === 0 ? "Capa" : index === selected ? "Selecionada" : `Foto ${index + 1}`}
                        {image.saved && " · salva"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label className="flex cursor-pointer gap-4 rounded-[6px] bg-[var(--background-secondary)] p-4">
              <span className="text-2xl leading-9 text-[var(--foreground)]" aria-hidden="true">
                +
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-sm leading-[21px] font-medium text-[var(--foreground)]">Adicionar fotos</span>
                <span className="text-xs leading-[18px] text-[var(--foreground-muted)]">JPG ou PNG · Recorte em 3:4</span>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Adicionar fotos"
                onChange={(event) => void addFiles(event)}
              />
            </label>

            {confirmRemove && editable ? (
              <div className="flex flex-col gap-3 rounded-[6px] border border-[var(--border)] p-4" role="group" aria-label="Remover imagem">
                <p className="text-sm leading-[21px] text-[var(--foreground)]">Remover a foto {selected + 1}? Ela ainda não foi enviada.</p>
                <div className="flex gap-3">
                  <Button variant="action" size="sm" className={adminButtonClassName} onClick={remove}>
                    Remover foto
                  </Button>
                  <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={() => setConfirmRemove(false)}>
                    Manter foto
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline-neutral"
                  size="sm"
                  className={cn(adminButtonClassName, "min-w-0")}
                  disabled={!editable}
                  onClick={() => setCrop({ kind: "replace", index: selected })}
                >
                  Recortar
                </Button>
                <Button
                  variant="outline-neutral"
                  size="sm"
                  className={cn(adminButtonClassName, "min-w-0")}
                  disabled={!editable}
                  onClick={() => setConfirmRemove(true)}
                >
                  Remover
                </Button>
              </div>
            )}
            <Button
              variant="outline-neutral"
              size="sm"
              className={cn(adminButtonClassName, "w-full")}
              disabled={!editable || selected === 0 || hasSaved}
              onClick={makeCover}
            >
              Usar como capa
            </Button>
            {hasSaved && (
              <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">
                Fotos já salvas mantêm a ordem e não podem ser removidas por aqui. As novas entram depois delas.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="product-image-link" className="text-xs leading-[18px] text-[var(--foreground-muted)]">
                Ou adicionar por link
              </label>
              <div className="flex gap-2">
                <input
                  id="product-image-link"
                  type="url"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="https://…"
                  className={adminControlClassName}
                />
                <Button variant="outline-neutral" size="sm" className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--border-control)] p-3" onClick={addLink}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </WideDialog>

      <ImageCropDialog
        src={crop ? (crop.kind === "new" ? crop.src : images[crop.index].src) : null}
        onClose={() => setCrop(null)}
        onApply={applyCrop}
      />
    </>
  );
}
