import { useState } from "react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import Button from "@/components/ui/Button";
import {
  CATEGORY_OPTIONS,
  categoryToPath,
  type Banner,
} from "@/context/BannerContext";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import SavedConfirmation from "./SavedConfirmation";
import { adminButtonClassName, adminControlClassName } from "./adminClasses";
import { getCategoryLabel } from "./bannerFormat";

export interface BannerFormData {
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  primaryCategory: string;
  secondaryCta: string;
  secondaryCategory: string;
  order: number;
  active: boolean;
}

interface BannerFormDialogProps {
  open: boolean;
  banner: Banner | null;
  defaultOrder?: number;
  onClose: () => void;
  onSave: (data: BannerFormData) => void;
}

type Step = "form" | "preview" | "saved";

function toForm(banner: Banner | null, defaultOrder = 1): BannerFormData {
  if (!banner) {
    return {
      image: "",
      tag: "",
      title: "",
      subtitle: "",
      primaryCta: "",
      primaryCategory: "all",
      secondaryCta: "",
      secondaryCategory: "",
      order: defaultOrder,
      active: true,
    };
  }

  return {
    image: banner.image,
    tag: banner.tag ?? "",
    title: banner.title,
    subtitle: banner.subtitle ?? "",
    primaryCta: banner.primaryCta ?? "",
    primaryCategory: banner.primaryCategory || "all",
    secondaryCta: banner.secondaryCta ?? "",
    secondaryCategory: banner.secondaryCategory ?? "",
    order: banner.order,
    active: banner.active,
  };
}

export default function BannerFormDialog(props: BannerFormDialogProps) {
  return (
    <BannerFormContent
      key={`${props.open}-${props.banner?.id ?? "novo"}`}
      {...props}
    />
  );
}

function BannerFormContent({
  open,
  banner,
  defaultOrder = 1,
  onClose,
  onSave,
}: BannerFormDialogProps) {
  const [form, setForm] = useState<BannerFormData>(() => toForm(banner, defaultOrder));
  const [step, setStep] = useState<Step>("form");
  const [fieldErrors, setFieldErrors] = useState<{ image?: string; title?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  if (!open) return <AdminDialog open={false} onClose={onClose} title="" />;

  const update = (patch: Partial<BannerFormData>) => {
    setForm((current) => ({ ...current, ...patch }));
    // Limpa erros do campo atualizado
    if (patch.image !== undefined) {
      setFieldErrors((prev) => ({ ...prev, image: undefined }));
    }
    if (patch.title !== undefined) {
      setFieldErrors((prev) => ({ ...prev, title: undefined }));
    }
    setGeneralError(null);
  };

  const validate = (): boolean => {
    const errors: { image?: string; title?: string } = {};
    if (!form.image.trim()) {
      errors.image = "URL da imagem é obrigatória.";
    }
    if (!form.title.trim()) {
      errors.title = "Título é obrigatório.";
    }

    setFieldErrors(errors);
    if (errors.image || errors.title) {
      setGeneralError("Preencha todos os campos obrigatórios.");
      return false;
    }
    return true;
  };

  const handlePreview = () => {
    if (!validate()) return;
    setStep("preview");
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
    setStep("saved");
  };

  const dialogTitle = banner ? `Banner · ${banner.title}` : "Novo banner";

  if (step === "saved") {
    const savedText = banner
      ? `Banner ${banner.title} atualizado`
      : `Banner ${form.title} criado`;

    return (
      <AdminDialog open={open} onClose={onClose} title="Alterações salvas">
        <SavedConfirmation result={savedText} onConclude={onClose} />
      </AdminDialog>
    );
  }

  if (step === "preview") {
    return (
      <AdminDialog
        open={open}
        onClose={onClose}
        title="Pré-visualização do banner"
        actions={
          <>
            <Button
              variant="action"
              size="sm"
              className={adminButtonClassName}
              onClick={() => setStep("form")}
            >
              Voltar à edição
            </Button>
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              onClick={onClose}
            >
              Cancelar
            </Button>
          </>
        }
      >
        <div className="h-[220px] w-full overflow-hidden border border-[var(--border)] bg-[var(--background-card)]">
          <ImageWithFallback
            src={form.image}
            alt={form.title}
            className="h-full w-full object-cover"
          />
        </div>
        <AdminField
          label="Coleção"
          value={form.tag.trim() || getCategoryLabel(form.primaryCategory) || "—"}
        />
        <AdminField label="Título" value={form.title.trim() || "—"} />
        <AdminField label="Descrição" value={form.subtitle.trim() || "—"} />
        <AdminField label="Botão principal" value={form.primaryCta.trim() || "—"} />
        <AdminField
          label="Destino"
          value={categoryToPath(form.primaryCategory)}
        />
      </AdminDialog>
    );
  }

  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title={dialogTitle}
      description="Revise os dados antes de continuar."
      actions={
        <>
          <Button
            variant="outline-neutral"
            size="sm"
            className={adminButtonClassName}
            onClick={handlePreview}
          >
            Pré-visualizar
          </Button>
          <Button
            variant="action"
            size="sm"
            className={adminButtonClassName}
            onClick={handleSave}
          >
            Salvar banner
          </Button>
          <Button
            variant="outline-neutral"
            size="sm"
            className={adminButtonClassName}
            onClick={onClose}
          >
            Cancelar
          </Button>
        </>
      }
    >
      {generalError && (
        <p
          role="alert"
          className="mb-4 text-xs leading-[18px] text-[var(--color-error-text)]"
        >
          {generalError}
        </p>
      )}

      <AdminField label="URL da imagem *" htmlFor="banner-image">
        <input
          id="banner-image"
          type="url"
          value={form.image}
          onChange={(e) => update({ image: e.target.value })}
          placeholder="https://..."
          aria-invalid={Boolean(fieldErrors.image)}
          className={adminControlClassName}
        />
        {fieldErrors.image && (
          <p className="text-xs text-[var(--color-error-text)]">{fieldErrors.image}</p>
        )}
      </AdminField>

      <AdminField label="Coleção" htmlFor="banner-tag">
        <input
          id="banner-tag"
          type="text"
          value={form.tag}
          onChange={(e) => update({ tag: e.target.value })}
          placeholder="Ex.: Nova Coleção 2026"
          className={adminControlClassName}
        />
      </AdminField>

      <AdminField label="Título *" htmlFor="banner-title">
        <input
          id="banner-title"
          type="text"
          value={form.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Título principal do banner"
          aria-invalid={Boolean(fieldErrors.title)}
          className={adminControlClassName}
        />
        {fieldErrors.title && (
          <p className="text-xs text-[var(--color-error-text)]">{fieldErrors.title}</p>
        )}
      </AdminField>

      <AdminField label="Subtítulo" htmlFor="banner-subtitle">
        <input
          id="banner-subtitle"
          type="text"
          value={form.subtitle}
          onChange={(e) => update({ subtitle: e.target.value })}
          placeholder="Subtítulo ou descrição breve"
          className={adminControlClassName}
        />
      </AdminField>

      <AdminField label="Texto do botão principal" htmlFor="banner-primary-cta">
        <input
          id="banner-primary-cta"
          type="text"
          value={form.primaryCta}
          onChange={(e) => update({ primaryCta: e.target.value })}
          placeholder="Ex.: Ver Coleção"
          className={adminControlClassName}
        />
      </AdminField>

      <AdminField label="Destino do botão" htmlFor="banner-primary-destination">
        <select
          id="banner-primary-destination"
          value={form.primaryCategory}
          onChange={(e) => update({ primaryCategory: e.target.value })}
          className={adminControlClassName}
        >
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label} ({categoryToPath(cat.value)})
            </option>
          ))}
        </select>
      </AdminField>

      <AdminField
        label="Texto do botão secundário"
        htmlFor="banner-secondary-cta"
      >
        <input
          id="banner-secondary-cta"
          type="text"
          value={form.secondaryCta}
          onChange={(e) => update({ secondaryCta: e.target.value })}
          placeholder="Ex.: Debutante"
          className={adminControlClassName}
        />
      </AdminField>

      <AdminField
        label="Destino secundário"
        htmlFor="banner-secondary-destination"
      >
        <select
          id="banner-secondary-destination"
          value={form.secondaryCategory}
          onChange={(e) => update({ secondaryCategory: e.target.value })}
          className={adminControlClassName}
        >
          <option value="">Nenhum</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label} ({categoryToPath(cat.value)})
            </option>
          ))}
        </select>
      </AdminField>

      <AdminField label="Ordem" htmlFor="banner-order">
        <input
          id="banner-order"
          type="number"
          min={1}
          step={1}
          value={form.order}
          onChange={(e) => update({ order: Number(e.target.value) || 1 })}
          className={adminControlClassName}
        />
      </AdminField>

      <AdminField label="Status" htmlFor="banner-status">
        <select
          id="banner-status"
          value={form.active ? "published" : "draft"}
          onChange={(e) => update({ active: e.target.value === "published" })}
          className={adminControlClassName}
        >
          <option value="published">Publicado</option>
          <option value="draft">Rascunho</option>
        </select>
      </AdminField>
    </AdminDialog>
  );
}
