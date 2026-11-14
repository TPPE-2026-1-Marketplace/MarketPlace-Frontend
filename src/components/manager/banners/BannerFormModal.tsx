import { useState } from "react";
import {
  ExternalLink,
  Image as ImageIcon,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import {
  adminControlClassName,
  adminLabelClassName,
} from "@/components/manager/adminClasses";
import Button from "@/components/ui/Button";
import {
  type Banner,
  CATEGORY_OPTIONS,
  categoryToPath,
} from "@/context/BannerContext";
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
}: {
  initial?: BannerFormState;
  isEditing: boolean;
  onSave: (data: BannerFormState) => void;
  onClose: () => void;
}) {
  const initialState = initial ?? EMPTY_BANNER_FORM;
  const [form, setForm] = useState<BannerFormState>(initialState);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BannerFormState, string>>>({});

  const set = (key: keyof BannerFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof BannerFormState, string>> = {};
    if (!form.image.trim()) nextErrors.image = "URL da imagem é obrigatória";
    if (!form.title.trim()) nextErrors.title = "Título é obrigatório";
    if (!form.primaryCta.trim()) nextErrors.primaryCta = "Botão principal é obrigatório";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
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
              onClick={onClose}
              className="rounded-[var(--radius-sm)] p-2 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
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
              <label htmlFor="banner-image-url" className={cn(adminLabelClassName, "mb-1.5 block")}>
                URL da Imagem <span className="text-[var(--color-error-text)]">*</span>
              </label>
              <input
                id="banner-image-url"
                type="url"
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="https://..."
                className={fieldClass("image")}
              />
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

          <div className="sticky bottom-0 flex gap-3 border-t border-[var(--border)] bg-[var(--background-card)] px-6 py-4">
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
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="action"
              size="sm"
              className="flex-1 rounded-[var(--radius-sm)] py-2.5"
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {previewOpen && (
        <BannerPreviewModal
          banner={{ ...form, id: "_preview", order: 0 }}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
