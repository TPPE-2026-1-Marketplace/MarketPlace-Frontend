import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from "lucide-react";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import {
  adminButtonClassName,
  adminCardClassName,
  adminControlClassName,
  adminLabelClassName,
} from "@/components/manager/adminClasses";
import Button from "@/components/ui/Button";
import {
  Banner,
  CATEGORY_OPTIONS,
  categoryToPath,
  useBanners,
} from "@/context/BannerContext";
import { cn } from "@/lib/utils";

type FormState = Omit<Banner, "id" | "order">;

const EMPTY_FORM: FormState = {
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

function BannerThumbnail({
  src,
  alt,
  className,
  iconClassName = "size-6 text-[var(--foreground-muted)]",
}: {
  src: string;
  alt: string;
  className?: string;
  iconClassName?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const trimmed = src.trim();
  const canShowImage = Boolean(trimmed) && failedSrc !== trimmed;

  if (!canShowImage) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-[var(--background-secondary)]",
          className,
        )}
      >
        <ImageIcon className={iconClassName} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={trimmed}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      onError={() => setFailedSrc(trimmed)}
    />
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium",
        active
          ? "bg-[var(--color-success)]/15 text-[var(--color-success-text)]"
          : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]",
      )}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function BannerPreviewModal({
  banner,
  onClose,
}: {
  banner: Banner;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)] shadow-lg"
        style={{ aspectRatio: "16/7" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0">
          <BannerThumbnail
            src={banner.image}
            alt={banner.title}
            iconClassName="size-12 text-[var(--foreground-muted)]"
          />
        </div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.52) 40%, rgba(0, 0, 0, 0.08) 100%)",
          }}
        />

        <div className="absolute inset-0 flex items-end p-6 sm:p-8">
          <div className="max-w-md">
            {banner.tag && (
              <p className="mb-2 font-sans text-xs font-medium tracking-[2px] text-[var(--color-white)]/85 uppercase">
                {banner.tag}
              </p>
            )}
            <h3 className="mb-2 font-serif text-xl leading-tight text-[var(--color-white)] sm:text-2xl">
              {banner.title || "Título do banner"}
            </h3>
            {banner.subtitle && (
              <p className="mb-4 line-clamp-2 font-sans text-xs leading-relaxed text-[var(--color-white)]/85">
                {banner.subtitle}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {banner.primaryCta && (
                <span className="rounded-[var(--radius-sm)] bg-[var(--background-card)] px-5 py-2 text-xs font-medium text-[var(--foreground)]">
                  {banner.primaryCta}
                </span>
              )}
              {banner.secondaryCta && (
                <span className="rounded-[var(--radius-sm)] border border-[var(--color-white)]/45 bg-black/25 px-5 py-2 text-xs font-medium text-[var(--color-white)] backdrop-blur-sm">
                  {banner.secondaryCta}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-black/55 text-[var(--color-white)] transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
          aria-label="Fechar preview"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="absolute top-3 left-3">
          <span
            className={cn(
              "rounded-[var(--radius-full)] px-2.5 py-1 text-xs font-medium",
              banner.active
                ? "bg-[var(--color-success)] text-[var(--color-white)]"
                : "bg-black/60 text-[var(--color-white)]",
            )}
          >
            {banner.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>
    </div>
  );
}

function BannerFormModal({
  initial,
  isEditing,
  onSave,
  onClose,
}: {
  initial: FormState;
  isEditing: boolean;
  onSave: (data: FormState) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.image.trim()) nextErrors.image = "URL da imagem é obrigatória";
    if (!form.title.trim()) nextErrors.title = "Título é obrigatório";
    if (!form.primaryCta.trim()) nextErrors.primaryCta = "Botão principal é obrigatório";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
  };

  const fieldClass = (key: keyof FormState) =>
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

function DeleteConfirm({
  bannerTitle,
  onConfirm,
  onCancel,
}: {
  bannerTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4">
      <div className="w-full max-w-sm rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-lg">
        <h4 className="mb-2 text-base font-semibold text-[var(--foreground)]">
          Remover banner
        </h4>
        <p className="mb-5 text-sm leading-5 text-[var(--foreground-secondary)]">
          Tem certeza que deseja remover{" "}
          <strong className="font-semibold text-[var(--foreground)]">"{bannerTitle}"</strong>? Esta
          ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline-neutral"
            size="sm"
            className="flex-1 rounded-[var(--radius-sm)] py-2.5"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-[var(--radius-sm)] bg-[var(--color-error)] py-2.5 text-sm font-medium text-[var(--color-white)] transition-opacity hover:opacity-90"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}

export function Banners() {
  const {
    banners,
    activeBanners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleActive,
    moveUp,
    moveDown,
    reorderBanners,
  } = useBanners();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const openNew = () => {
    setEditingBanner(null);
    setFormOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormOpen(true);
  };

  const handleSave = (data: Omit<Banner, "id" | "order">) => {
    if (editingBanner) {
      updateBanner(editingBanner.id, data);
    } else {
      addBanner(data);
    }
    setFormOpen(false);
    setEditingBanner(null);
  };

  const resetDrag = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Banners"
        description={`${activeBanners.length} de ${banners.length} banners ativos no carrossel`}
        action={
          <Button
            type="button"
            variant="action"
            size="sm"
            className={adminButtonClassName}
            onClick={openNew}
          >
            <Plus className="size-4" aria-hidden="true" />
            Novo Banner
          </Button>
        }
      />

      {banners.length === 0 && (
        <div className={cn(adminCardClassName, "p-10 text-center")}>
          <ImageIcon className="mx-auto mb-3 size-10 text-[var(--foreground-subtle)]" aria-hidden="true" />
          <p className="text-sm text-[var(--foreground-secondary)]">Nenhum banner cadastrado.</p>
          <Button
            type="button"
            variant="outline-neutral"
            size="sm"
            className="mt-4 rounded-[var(--radius-sm)]"
            onClick={openNew}
          >
            Criar primeiro banner
          </Button>
        </div>
      )}

      {banners.length > 0 && (
        <div role="list" aria-label="Lista de banners do carrossel" className="space-y-3">
          {banners.map((banner, idx) => {
            const isDragging = draggedId === banner.id;
            const isDragOver = dragOverId === banner.id && draggedId !== banner.id;

            return (
              <div
                key={banner.id}
                role="listitem"
                draggable={banners.length > 1}
                onDragStart={(e) => {
                  setDraggedId(banner.id);
                  if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", banner.id);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = "move";
                  }
                  if (dragOverId !== banner.id) setDragOverId(banner.id);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverId((prev) => (prev === banner.id ? null : prev));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const sourceId = draggedId || e.dataTransfer?.getData("text/plain");
                  if (sourceId && sourceId !== banner.id) {
                    reorderBanners(sourceId, banner.id);
                  }
                  resetDrag();
                }}
                onDragEnd={resetDrag}
                className={cn(
                  adminCardClassName,
                  "flex items-stretch gap-0 overflow-hidden transition-all",
                  banner.active
                    ? "hover:border-[var(--border-hover)]"
                    : "bg-[var(--background-store)]",
                  isDragging && "border-dashed border-[var(--color-brand)] opacity-50",
                  isDragOver && "border-[var(--color-brand)] ring-2 ring-[var(--border-accent)]",
                )}
              >
                <div
                  className={cn(
                    "flex shrink-0 items-center border-r border-[var(--border)] bg-[var(--background-store)]/60",
                    banners.length > 1 && "cursor-grab active:cursor-grabbing",
                  )}
                  title={banners.length > 1 ? "Arraste para reordenar" : undefined}
                >
                  <div className="hidden items-center justify-center pl-2 text-[var(--foreground-subtle)] sm:flex">
                    <GripVertical className="size-4" aria-hidden="true" />
                  </div>
                  <div className="flex h-full flex-col">
                    <button
                      type="button"
                      onClick={() => moveUp(banner.id)}
                      disabled={idx === 0}
                      className="flex flex-1 items-center justify-center px-2.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Mover para cima"
                    >
                      <ChevronUp className="size-4" aria-hidden="true" />
                    </button>
                    <div className="select-none border-y border-[var(--border)] px-2.5 py-1 text-center text-xs font-medium tabular-nums text-[var(--foreground-secondary)]">
                      {idx + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => moveDown(banner.id)}
                      disabled={idx === banners.length - 1}
                      className="flex flex-1 items-center justify-center px-2.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Mover para baixo"
                    >
                      <ChevronDown className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="w-28 shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--background-secondary)] sm:w-40">
                  <BannerThumbnail
                    src={banner.image}
                    alt={banner.title}
                    className={!banner.active ? "opacity-75" : undefined}
                  />
                </div>

                <div className="min-w-0 flex-1 px-4 py-3">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <StatusPill active={banner.active} />
                    {banner.tag && (
                      <span className="truncate text-xs font-medium text-[var(--foreground-muted)]">
                        {banner.tag}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "line-clamp-1 text-sm font-semibold",
                      banner.active ? "text-[var(--foreground)]" : "text-[var(--foreground-secondary)]",
                    )}
                  >
                    {banner.title}
                  </p>
                  {banner.subtitle && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-[var(--foreground-muted)]">
                      {banner.subtitle}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background-store)] px-2 py-0.5 text-xs text-[var(--foreground-secondary)]">
                      {CATEGORY_OPTIONS.find((c) => c.value === banner.primaryCategory)?.label ??
                        banner.primaryCategory}
                    </span>
                    {banner.secondaryCta && (
                      <span className="text-xs text-[var(--foreground-muted)]">
                        + {banner.secondaryCta}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid shrink-0 grid-cols-2 content-center gap-0.5 pr-2 sm:flex sm:items-center sm:gap-1 sm:pr-3">
                  <button
                    type="button"
                    onClick={() => setPreviewBanner(banner)}
                    className="rounded-[var(--radius-sm)] p-2 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                    title="Preview"
                    aria-label="Pré-visualizar banner"
                  >
                    <Eye className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(banner.id)}
                    className={cn(
                      "rounded-[var(--radius-sm)] p-2 transition-colors hover:bg-[var(--background-secondary)]",
                      banner.active
                        ? "text-[var(--color-success)] hover:text-[var(--foreground-secondary)]"
                        : "text-[var(--foreground-muted)] hover:text-[var(--color-success)]",
                    )}
                    title={banner.active ? "Desativar" : "Ativar"}
                    aria-label={banner.active ? "Desativar banner" : "Ativar banner"}
                  >
                    {banner.active ? (
                      <ToggleRight className="size-5" aria-hidden="true" />
                    ) : (
                      <ToggleLeft className="size-5" aria-hidden="true" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(banner)}
                    className="rounded-[var(--radius-sm)] p-2 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                    title="Editar"
                    aria-label="Editar banner"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(banner)}
                    className="rounded-[var(--radius-sm)] p-2 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-error-subtle)] hover:text-[var(--color-error-text)]"
                    title="Remover"
                    aria-label="Remover banner"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {banners.length > 0 && (
        <p className="text-center text-xs text-[var(--foreground-muted)]">
          Apenas banners ativos aparecem no carrossel da página inicial. Arraste os cards ou use as
          setas para definir a ordem de exibição.
        </p>
      )}

      {formOpen && (
        <BannerFormModal
          initial={
            editingBanner
              ? {
                  image: editingBanner.image,
                  tag: editingBanner.tag,
                  title: editingBanner.title,
                  subtitle: editingBanner.subtitle,
                  primaryCta: editingBanner.primaryCta,
                  primaryCategory: editingBanner.primaryCategory,
                  secondaryCta: editingBanner.secondaryCta,
                  secondaryCategory: editingBanner.secondaryCategory,
                  active: editingBanner.active,
                }
              : EMPTY_FORM
          }
          isEditing={Boolean(editingBanner)}
          onSave={handleSave}
          onClose={() => {
            setFormOpen(false);
            setEditingBanner(null);
          }}
        />
      )}

      {previewBanner && (
        <BannerPreviewModal
          banner={previewBanner}
          onClose={() => setPreviewBanner(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          bannerTitle={deleteTarget.title}
          onConfirm={() => {
            deleteBanner(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
