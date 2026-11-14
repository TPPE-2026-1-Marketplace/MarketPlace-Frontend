import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import {
  adminButtonClassName,
  adminCardClassName,
} from "@/components/manager/adminClasses";
import { BannerDeleteDialog } from "@/components/manager/banners/BannerDeleteDialog";
import {
  BannerFormModal,
  type BannerFormState,
} from "@/components/manager/banners/BannerFormModal";
import { BannerPreviewModal } from "@/components/manager/banners/BannerPreviewModal";
import {
  BannerThumbnail,
  StatusPill,
} from "@/components/manager/banners/BannerThumbnail";
import Button from "@/components/ui/Button";
import {
  type Banner,
  CATEGORY_OPTIONS,
  useBanners,
} from "@/context/BannerContext";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "inactive";

/** Página administrativa para listagem, ordenação, pré-visualização e edição de banners Hero. */
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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const inactiveCount = banners.length - activeBanners.length;
  const isFiltered = statusFilter !== "all";
  const canReorder = !isFiltered && banners.length > 1;
  const filteredBanners = banners.filter((banner) => {
    if (statusFilter === "active") return banner.active;
    if (statusFilter === "inactive") return !banner.active;
    return true;
  });

  const openNew = () => {
    setEditingBanner(null);
    setFormOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormOpen(true);
  };

  const handleSave = (data: BannerFormState) => {
    if (editingBanner) {
      updateBanner(editingBanner.id, data);
      toast.success("Banner atualizado com sucesso.");
    } else {
      addBanner(data);
      toast.success("Banner criado com sucesso.");
    }
    setFormOpen(false);
    setEditingBanner(null);
  };

  const handleToggleActive = (banner: Banner) => {
    toggleActive(banner.id);
    toast.success(banner.active ? "Banner desativado." : "Banner ativado no carrossel.");
  };

  const resetDrag = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const selectFilter = (next: StatusFilter) => {
    setStatusFilter(next);
    resetDrag();
  };

  const filterOptions: Array<{ key: StatusFilter; label: string }> = [
    { key: "all", label: `Todos (${banners.length})` },
    { key: "active", label: `Ativos (${activeBanners.length})` },
    { key: "inactive", label: `Inativos (${inactiveCount})` },
  ];

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Filtrar banners por status"
            className="flex flex-wrap items-center gap-2"
          >
            {filterOptions.map((option) => {
              const selected = statusFilter === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => selectFilter(option.key)}
                  className={cn(
                    "rounded-[var(--radius-full)] border px-3 py-1.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-[var(--color-brand)] bg-[var(--background-brand-subtle)] text-[var(--color-brand)]"
                      : "border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {isFiltered && (
            <p className="text-xs text-[var(--foreground-muted)]">
              Exibindo apenas banners filtrados — selecione "Todos" para reordenar o carrossel.
            </p>
          )}
        </div>
      )}

      {banners.length > 0 && filteredBanners.length === 0 && (
        <div className={cn(adminCardClassName, "p-8 text-center")}>
          <p className="text-sm text-[var(--foreground-secondary)]">
            Nenhum banner encontrado para este filtro.
          </p>
          <Button
            type="button"
            variant="outline-neutral"
            size="sm"
            className="mt-4 rounded-[var(--radius-sm)]"
            onClick={() => selectFilter("all")}
          >
            Ver todos os banners
          </Button>
        </div>
      )}

      {filteredBanners.length > 0 && (
        <div role="list" aria-label="Lista de banners do carrossel" className="space-y-3">
          {filteredBanners.map((banner, idx) => {
            const isDragging = draggedId === banner.id;
            const isDragOver = dragOverId === banner.id && draggedId !== banner.id;

            return (
              <div
                key={banner.id}
                role="listitem"
                draggable={canReorder}
                onDragStart={(e) => {
                  if (!canReorder) return;
                  setDraggedId(banner.id);
                  if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", banner.id);
                  }
                }}
                onDragOver={(e) => {
                  if (!canReorder) return;
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
                  if (!canReorder) return;
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
                    canReorder && "cursor-grab active:cursor-grabbing",
                  )}
                  title={canReorder ? "Arraste para reordenar" : undefined}
                >
                  <div className="hidden items-center justify-center pl-2 text-[var(--foreground-subtle)] sm:flex">
                    <GripVertical className="size-4" aria-hidden="true" />
                  </div>
                  <div className="flex h-full flex-col">
                    <button
                      type="button"
                      onClick={() => moveUp(banner.id)}
                      disabled={isFiltered || idx === 0}
                      className="flex flex-1 items-center justify-center px-2.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Mover para cima"
                    >
                      <ChevronUp className="size-4" aria-hidden="true" />
                    </button>
                    <div className="select-none border-y border-[var(--border)] px-2.5 py-1 text-center text-xs font-medium tabular-nums text-[var(--foreground-secondary)]">
                      {banner.order}
                    </div>
                    <button
                      type="button"
                      onClick={() => moveDown(banner.id)}
                      disabled={isFiltered || idx === filteredBanners.length - 1}
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
                    onClick={() => handleToggleActive(banner)}
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
              : undefined
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
        <BannerDeleteDialog
          bannerTitle={deleteTarget.title}
          onConfirm={() => {
            deleteBanner(deleteTarget.id);
            setDeleteTarget(null);
            toast.success("Banner removido com sucesso.");
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
