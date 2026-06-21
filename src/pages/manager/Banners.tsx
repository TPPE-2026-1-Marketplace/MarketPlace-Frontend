import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  X,
  ImageIcon,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Image,
} from "lucide-react";
import {
  useBanners,
  Banner,
  CATEGORY_OPTIONS,
  categoryToPath,
} from "../../context/BannerContext";

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Preview mini-card ───────────────────────────────────────────────────────

function BannerPreviewModal({
  banner,
  onClose,
}: {
  banner: Banner;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden"
        style={{ aspectRatio: "16/7" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background image */}
        {banner.image ? (
          <img
            src={banner.image}
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-[#0a0a0a]/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-end p-8">
          <div className="max-w-xs">
            {banner.tag && (
              <p className="text-gray-300 text-xs tracking-widest uppercase mb-2">
                {banner.tag}
              </p>
            )}
            <h3 className="text-white text-xl mb-2" style={{ lineHeight: 1.2 }}>
              {banner.title || "Título do banner"}
            </h3>
            <p className="text-gray-300 text-xs mb-4 leading-relaxed line-clamp-2">
              {banner.subtitle}
            </p>
            <div className="flex gap-2">
              {banner.primaryCta && (
                <span className="bg-white text-[#1a1a1a] px-5 py-2 text-xs">
                  {banner.primaryCta}
                </span>
              )}
              {banner.secondaryCta && (
                <span className="border border-gray-400 text-gray-200 px-5 py-2 text-xs">
                  {banner.secondaryCta}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
          aria-label="Fechar preview"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-xs px-2.5 py-1 ${
              banner.active
                ? "bg-green-500 text-white"
                : "bg-gray-500 text-white"
            }`}
          >
            {banner.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Form modal ──────────────────────────────────────────────────────────────

function BannerFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial: FormState;
  onSave: (data: FormState) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.image.trim()) e.image = "URL da imagem é obrigatória";
    if (!form.title.trim()) e.title = "Título é obrigatório";
    if (!form.primaryCta.trim()) e.primaryCta = "Botão principal é obrigatório";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(form);
  };

  const fieldClass = (key: keyof FormState) =>
    `w-full border px-4 py-2.5 text-sm focus:outline-none transition-colors ${
      errors[key]
        ? "border-red-400 focus:border-red-500"
        : "border-gray-200 focus:border-[#1a1a1a]"
    }`;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h3 className="text-gray-900">
              {initial.title ? "Editar Banner" : "Novo Banner"}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100">
              <span className="text-sm text-gray-700">Status do banner</span>
              <button
                onClick={() => set("active", !form.active)}
                className="flex items-center gap-2 text-sm"
              >
                {form.active ? (
                  <>
                    <ToggleRight className="w-6 h-6 text-green-600" />
                    <span className="text-green-700">Ativo</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                    <span className="text-gray-500">Inativo</span>
                  </>
                )}
              </button>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                URL da Imagem <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
                placeholder="https://..."
                className={fieldClass("image")}
              />
              {errors.image && (
                <p className="text-red-500 text-xs mt-1">{errors.image}</p>
              )}
              {form.image && (
                <div className="mt-2 h-20 overflow-hidden border border-gray-100">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tag */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Tag (texto acima do título)
              </label>
              <input
                type="text"
                value={form.tag}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="ex: Nova Coleção 2026"
                className={fieldClass("tag")}
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Título principal do banner"
                className={fieldClass("title")}
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Subtítulo</label>
              <textarea
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="Descrição breve do banner"
                rows={2}
                className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] resize-none"
              />
            </div>

            {/* Primary CTA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Botão Principal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.primaryCta}
                  onChange={(e) => set("primaryCta", e.target.value)}
                  placeholder="ex: Ver Coleção"
                  className={fieldClass("primaryCta")}
                />
                {errors.primaryCta && (
                  <p className="text-red-500 text-xs mt-1">{errors.primaryCta}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Categoria destino
                </label>
                <select
                  value={form.primaryCategory}
                  onChange={(e) => set("primaryCategory", e.target.value)}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preview of primary CTA link */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Link: {categoryToPath(form.primaryCategory)}</span>
            </div>

            {/* Secondary CTA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Botão Secundário{" "}
                  <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={form.secondaryCta}
                  onChange={(e) => set("secondaryCta", e.target.value)}
                  placeholder="ex: Debutante"
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Categoria destino
                </label>
                <select
                  value={form.secondaryCategory}
                  onChange={(e) => set("secondaryCategory", e.target.value)}
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
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

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
            <button
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 hover:border-gray-400 transition-colors text-sm"
            >
              <Image className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 hover:border-gray-400 transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-[#1a1a1a] text-white py-2.5 hover:bg-[#333333] transition-colors text-sm"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>

      {/* Preview */}
      {previewOpen && (
        <BannerPreviewModal
          banner={{ ...form, id: "_preview", order: 0 }}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}

// ─── Delete confirmation ─────────────────────────────────────────────────────

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white p-6 max-w-sm w-full border border-gray-100">
        <h4 className="text-gray-900 mb-2">Remover banner</h4>
        <p className="text-gray-500 text-sm mb-5">
          Tem certeza que deseja remover{" "}
          <strong className="text-gray-700">"{bannerTitle}"</strong>? Esta ação
          não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 hover:border-gray-400 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2.5 hover:bg-red-700 transition-colors text-sm"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

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
  } = useBanners();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

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

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">
            {activeBanners.length} de {banners.length} banners ativos no carrossel
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2.5 hover:bg-[#333333] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Banner
        </button>
      </div>

      {/* Empty state */}
      {banners.length === 0 && (
        <div className="bg-white border border-gray-100 p-10 text-center">
          <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Nenhum banner cadastrado.</p>
          <button
            onClick={openNew}
            className="mt-4 text-sm text-[#1a1a1a] underline hover:no-underline"
          >
            Criar primeiro banner
          </button>
        </div>
      )}

      {/* Banner list */}
      <div className="space-y-3">
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className={`bg-white border flex items-stretch gap-0 overflow-hidden transition-colors ${
              banner.active ? "border-gray-200" : "border-gray-100 opacity-60"
            }`}
          >
            {/* Order controls */}
            <div className="flex flex-col border-r border-gray-100 shrink-0">
              <button
                onClick={() => moveUp(banner.id)}
                disabled={idx === 0}
                className="flex-1 px-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Mover para cima"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <div className="text-center text-xs text-gray-400 py-1 border-t border-b border-gray-100 px-2.5 select-none">
                {idx + 1}
              </div>
              <button
                onClick={() => moveDown(banner.id)}
                disabled={idx === banners.length - 1}
                className="flex-1 px-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Mover para baixo"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail */}
            <div className="w-28 sm:w-36 shrink-0 overflow-hidden">
              {banner.image ? (
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-3 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 ${
                    banner.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {banner.active ? "Ativo" : "Inativo"}
                </span>
                {banner.tag && (
                  <span className="text-xs text-gray-400 truncate">{banner.tag}</span>
                )}
              </div>
              <p className="text-sm text-gray-800 line-clamp-1">{banner.title}</p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                {banner.subtitle}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5">
                  {CATEGORY_OPTIONS.find((c) => c.value === banner.primaryCategory)?.label ??
                    banner.primaryCategory}
                </span>
                {banner.secondaryCta && (
                  <span className="text-xs text-gray-400">+ {banner.secondaryCta}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 pr-3 shrink-0">
              <button
                onClick={() => setPreviewBanner(banner)}
                className="p-2 text-gray-400 hover:text-gray-700 transition-colors"
                title="Preview"
                aria-label="Pré-visualizar banner"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleActive(banner.id)}
                className={`p-2 transition-colors ${
                  banner.active
                    ? "text-green-600 hover:text-gray-500"
                    : "text-gray-400 hover:text-green-600"
                }`}
                title={banner.active ? "Desativar" : "Ativar"}
                aria-label={banner.active ? "Desativar banner" : "Ativar banner"}
              >
                {banner.active ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={() => openEdit(banner)}
                className="p-2 text-gray-400 hover:text-[#1a1a1a] transition-colors"
                title="Editar"
                aria-label="Editar banner"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(banner)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Remover"
                aria-label="Remover banner"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      {banners.length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Apenas banners ativos aparecem no carrossel da página inicial. A ordem
          acima é a ordem de exibição.
        </p>
      )}

      {/* Form modal */}
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
          onSave={handleSave}
          onClose={() => {
            setFormOpen(false);
            setEditingBanner(null);
          }}
        />
      )}

      {/* Preview modal */}
      {previewBanner && (
        <BannerPreviewModal
          banner={previewBanner}
          onClose={() => setPreviewBanner(null)}
        />
      )}

      {/* Delete confirm */}
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
