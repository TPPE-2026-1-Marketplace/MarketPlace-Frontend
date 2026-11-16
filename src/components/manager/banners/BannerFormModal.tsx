import { type ChangeEvent, useState } from "react";
import {
  ExternalLink,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import ImageCropDialog from "@/components/manager/ImageCropDialog";
import {
  adminControlClassName,
  adminLabelClassName,
} from "@/components/manager/adminClasses";
import Button from "@/components/ui/Button";
import { DiscardChangesAlert } from "@/components/ui/DiscardChangesAlert";
import {
  type Banner,
  CATEGORY_OPTIONS,
  categoryToPath,
} from "@/context/BannerContext";
import { readFileAsDataUrl, uploadBannerImageDataUrl } from "@/lib/imageUpload";
import { cn } from "@/lib/utils";
import { BannerPreviewModal } from "./BannerPreviewModal";
import { BannerThumbnail } from "./BannerThumbnail";

export type BannerFormState = Omit<Banner, "id" | "order">;

const EMPTY_BANNER_FORM: BannerFormState = {
  image: "",
  tag: "",
  title: "",
  subtitle: "",
  primaryCta: "",
  primaryCategory: "all",
  secondaryCta: "",
  secondaryCategory: "all",
  active: true,
};

/** Modal de criação e edição de banners do carrossel. */
export function BannerFormModal({
  initial,
  isEditing,
  onSave,
  onClose,
}: Readonly<{
  initial?: BannerFormState;
  isEditing: boolean;
  onSave: (data: BannerFormState) => void;
  onClose: () => void;
}>) {
  const initialState = initial ?? EMPTY_BANNER_FORM;
  const [form, setForm] = useState<BannerFormState>(initialState);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BannerFormState, string>>>({});

  const isDirty =
    form.image !== initialState.image ||
    form.tag !== initialState.tag ||
    form.title !== initialState.title ||
    form.subtitle !== initialState.subtitle ||
    form.primaryCta !== initialState.primaryCta ||
    form.primaryCategory !== initialState.primaryCategory ||
    form.secondaryCta !== initialState.secondaryCta ||
    form.secondaryCategory !== initialState.secondaryCategory ||
    form.active !== initialState.active;

  const set = (key: keyof BannerFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (confirmDiscard) {
      setConfirmDiscard(false);
    }
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const requestClose = () => {
    if (isUploading) return;
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setUploadError("Envie uma imagem JPG, PNG ou WebP.");
      return;
    }

    setUploadError(null);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCropSrc(dataUrl);
    } catch {
      setUploadError("Não foi possível ler o arquivo selecionado.");
    }
  };

  const handleCropApply = async (croppedDataUrl: string) => {
    setCropSrc(null);
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploadedUrl = await uploadBannerImageDataUrl(croppedDataUrl, {
        descricao: form.title || form.tag || "Banner",
      });
      set("image", uploadedUrl);
      toast.success("Imagem enviada com sucesso.");
    } catch {
      setShowUrlInput(true);
      setUploadError(
        "Não foi possível enviar a imagem para o servidor. Tente novamente ou informe uma URL abaixo.",
      );
      toast.error("Não foi possível enviar a imagem do banner.");
    } finally {
      setIsUploading(false);
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof BannerFormState, string>> = {};
    const trimmedImage = form.image.trim();
    if (!trimmedImage) {
      nextErrors.image = "URL da imagem é obrigatória";
    } else if (!/^https?:\/\/\S+$/i.test(trimmedImage)) {
      nextErrors.image = "Informe uma URL válida iniciando com https://";
    }
    if (!form.title.trim()) nextErrors.title = "Título é obrigatório";
    if (!form.primaryCta.trim()) nextErrors.primaryCta = "Botão principal é obrigatório";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!isUploading && validate()) onSave(form);
  };

  const fieldClass = (key: keyof BannerFormState) =>
    cn(
      adminControlClassName,
      "px-3.5 py-2.5 text-sm leading-5 transition-colors",
      errors[key] &&
        "border-[var(--color-error)] focus-visible:border-[var(--color-error)]",
    );

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--overlay)] p-4">
        <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)] shadow-lg">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background-card)] px-6 py-4">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {isEditing ? "Editar Banner" : "Novo Banner"}
            </h3>
            <button
              type="button"
              onClick={requestClose}
              disabled={isUploading}
              className="rounded-[var(--radius-sm)] p-2 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Fechar"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-store)] p-3">
              <span className="text-sm font-medium text-[var(--foreground-secondary)]">
                Status do banner
              </span>
              <button
                type="button"
                onClick={() => set("active", !form.active)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-sm font-medium transition-colors hover:bg-[var(--background-secondary)]"
              >
                {form.active ? (
                  <>
                    <ToggleRight className="size-6 text-[var(--color-success)]" aria-hidden="true" />
                    <span className="text-[var(--color-success-text)]">Ativo</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="size-6 text-[var(--foreground-muted)]" aria-hidden="true" />
                    <span className="text-[var(--foreground-muted)]">Inativo</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <span className={cn(adminLabelClassName, "mb-1.5 block")}>
                Imagem do Banner <span className="text-[var(--color-error-text)]">*</span>
              </span>
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--background-store)] p-3 transition-colors hover:border-[var(--color-brand)]",
                  isUploading && "cursor-not-allowed opacity-60",
                )}
              >
                <Upload className="size-5 shrink-0 text-[var(--color-brand)]" aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {isUploading ? "Enviando imagem para o servidor..." : "Enviar imagem do computador"}
                  </span>
                  <span className="text-xs text-[var(--foreground-muted)]">
                    JPG, PNG ou WebP · Recorte panorâmico 16:7 (hospedado via ImgBB)
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-label="Enviar imagem do computador"
                  disabled={isUploading}
                  onChange={(e) => void handleFileSelect(e)}
                />
              </label>

              {uploadError && (
                <p role="alert" className="mt-1.5 text-xs text-[var(--color-error-text)]">
                  {uploadError}
                </p>
              )}

              {!showUrlInput ? (
                <div className="mt-1.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="text-xs font-medium text-[var(--color-brand)] transition-colors hover:underline"
                  >
                    Adição manual de URL
                  </button>
                </div>
              ) : (
                <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-store)]/60 p-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label htmlFor="banner-image-url" className={adminLabelClassName}>
                      URL da Imagem <span className="text-[var(--color-error-text)]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="text-xs font-medium text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)] hover:underline"
                    >
                      Ocultar adição manual de URL
                    </button>
                  </div>
                  <input
                    id="banner-image-url"
                    type="url"
                    value={form.image}
                    onChange={(e) => set("image", e.target.value)}
                    placeholder="https://..."
                    disabled={isUploading}
                    className={fieldClass("image")}
                  />
                </div>
              )}

              {errors.image && (
                <p className="mt-1 text-xs text-[var(--color-error-text)]">{errors.image}</p>
              )}
              {form.image && (
                <div className="mt-2 h-24 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background-secondary)]">
                  <BannerThumbnail src={form.image} alt="Preview" />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="banner-tag" className={cn(adminLabelClassName, "mb-1.5 block")}>
                Tag (texto acima do título)
              </label>
              <input
                id="banner-tag"
                type="text"
                value={form.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="ex: Nova Coleção 2026"
                className={fieldClass("tag")}
              />
            </div>

            <div>
              <label htmlFor="banner-title" className={cn(adminLabelClassName, "mb-1.5 block")}>
                Título <span className="text-[var(--color-error-text)]">*</span>
              </label>
              <input
                id="banner-title"
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Título principal do banner"
                className={fieldClass("title")}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-[var(--color-error-text)]">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="banner-subtitle" className={cn(adminLabelClassName, "mb-1.5 block")}>
                Subtítulo
              </label>
              <textarea
                id="banner-subtitle"
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="Descrição breve do banner"
                rows={2}
                className={cn(fieldClass("subtitle"), "resize-none")}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="banner-primary-cta" className={cn(adminLabelClassName, "mb-1.5 block")}>
                  Botão Principal <span className="text-[var(--color-error-text)]">*</span>
                </label>
                <input
                  id="banner-primary-cta"
                  type="text"
                  value={form.primaryCta}
                  onChange={(e) => set("primaryCta", e.target.value)}
                  placeholder="ex: Ver Coleção"
                  className={fieldClass("primaryCta")}
                />
                {errors.primaryCta && (
                  <p className="mt-1 text-xs text-[var(--color-error-text)]">{errors.primaryCta}</p>
                )}
              </div>
              <div>
                <label htmlFor="banner-primary-category" className={cn(adminLabelClassName, "mb-1.5 block")}>
                  Categoria destino
                </label>
                <select
                  id="banner-primary-category"
                  value={form.primaryCategory}
                  onChange={(e) => set("primaryCategory", e.target.value)}
                  className={fieldClass("primaryCategory")}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
              <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Link: {categoryToPath(form.primaryCategory)}</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="banner-secondary-cta" className={cn(adminLabelClassName, "mb-1.5 block")}>
                  Botão Secundário{" "}
                  <span className="text-xs font-normal text-[var(--foreground-muted)]">
                    (opcional)
                  </span>
                </label>
                <input
                  id="banner-secondary-cta"
                  type="text"
                  value={form.secondaryCta}
                  onChange={(e) => set("secondaryCta", e.target.value)}
                  placeholder="ex: Debutante"
                  className={fieldClass("secondaryCta")}
                />
              </div>
              <div>
                <label htmlFor="banner-secondary-category" className={cn(adminLabelClassName, "mb-1.5 block")}>
                  Categoria destino
                </label>
                <select
                  id="banner-secondary-category"
                  value={form.secondaryCategory}
                  onChange={(e) => set("secondaryCategory", e.target.value)}
                  className={fieldClass("secondaryCategory")}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 space-y-3 border-t border-[var(--border)] bg-[var(--background-card)] px-6 py-4">
            {confirmDiscard && (
              <DiscardChangesAlert onContinue={() => setConfirmDiscard(false)} onDiscard={onClose} />
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline-neutral"
                size="sm"
                className="rounded-[var(--radius-sm)] px-4 py-2.5"
                onClick={() => setPreviewOpen(true)}
              >
                <ImageIcon className="size-4" aria-hidden="true" />
                Preview
              </Button>
              <Button
                type="button"
                variant="outline-neutral"
                size="sm"
                className="flex-1 rounded-[var(--radius-sm)] py-2.5"
                disabled={isUploading}
                onClick={requestClose}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="action"
                size="sm"
                className="flex-1 rounded-[var(--radius-sm)] py-2.5"
                disabled={isUploading}
                onClick={handleSave}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ImageCropDialog
        src={cropSrc}
        aspectPreset="banner-16-7"
        onClose={() => setCropSrc(null)}
        onApply={(croppedDataUrl) => void handleCropApply(croppedDataUrl)}
      />

      {previewOpen && (
        <BannerPreviewModal
          banner={{ ...form, id: "_preview", order: 0 }}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
