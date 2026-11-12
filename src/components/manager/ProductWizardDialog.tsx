import { useMemo, useState, type ReactNode } from "react";
import Button from "@/components/ui/Button";
import type { ApiCategory, SaveResult } from "@/hooks/useProductPersistence";
import { ApiError } from "@/lib/api";
import type { Product } from "@/lib/catalog";
import { TIPOS } from "@/lib/categories";
import {
  EMPTY_DRAFT,
  NEUTRAL_SWATCH,
  PRODUCT_DRAFT_STORAGE_KEY,
  PRODUCT_STEPS,
  STANDARD_SIZES,
  SUGGESTED_COLORS,
  buildVariants,
  diffDrafts,
  draftFromProduct,
  validateStep,
  variantLabel,
  type DraftImage,
  type DraftVariant,
  type ProductDraft,
} from "@/lib/productDraft";
import { cn, formatCurrency } from "@/lib/utils";
import AdminField from "./AdminField";
import ProductImagesDialog from "./ProductImagesDialog";
import { CreateReview, EditReview } from "./ProductReview";
import WideDialog from "./WideDialog";
import { adminButtonClassName, adminControlClassName } from "./adminClasses";

const TAG_SUGGESTIONS = ["debutante", "gala", "coleção 2026"];

/** Rascunho salvo, sem as fotos enviadas do computador (pesadas demais para o navegador guardar). */
function loadStoredDraft(): ProductDraft | null {
  try {
    const raw = localStorage.getItem(PRODUCT_DRAFT_STORAGE_KEY);
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as ProductDraft) } : null;
  } catch {
    return null;
  }
}

function storeDraft(draft: ProductDraft) {
  const light = {
    ...draft,
    colors: draft.colors.map((color) => ({ ...color, images: color.images.filter((image) => !image.src.startsWith("data:")) })),
  };
  localStorage.setItem(PRODUCT_DRAFT_STORAGE_KEY, JSON.stringify(light));
}

const toNumber = (value: string) => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

type Mode = { kind: "create" } | { kind: "edit"; product: Product };
type View = "steps" | "review" | "saved";

interface ProductWizardDialogProps {
  /** null fecha o dialog. */
  mode: Mode | null;
  categories: ApiCategory[];
  onClose: () => void;
  onCreate: (draft: ProductDraft) => Promise<SaveResult>;
  onUpdate: (idProduto: number, original: ProductDraft, draft: ProductDraft) => Promise<SaveResult>;
}

/**
 * Cadastro (Figma 847:5998) e edição (850:5697) de produto em 4 etapas, com a revisão
 * antes de publicar/salvar e a confirmação. As fotos de cada cor abrem "Imagens do produto".
 */
export default function ProductWizardDialog(props: ProductWizardDialogProps) {
  const key = props.mode === null ? "fechado" : props.mode.kind === "edit" ? `edit-${props.mode.product.idProduto}` : "create";
  return <ProductWizardContent key={key} {...props} />;
}

function ProductWizardContent({ mode, categories, onClose, onCreate, onUpdate }: ProductWizardDialogProps) {
  const isEdit = mode?.kind === "edit";
  const original = useMemo(() => (mode?.kind === "edit" ? draftFromProduct(mode.product) : null), [mode]);
  const [restored] = useState(() => (mode?.kind === "create" ? loadStoredDraft() : null));
  const [draft, setDraft] = useState<ProductDraft>(() => original ?? restored ?? EMPTY_DRAFT);
  const [step, setStep] = useState(0);
  // Etapa mais avançada já visitada: o stepper só leva até ela.
  const [reached, setReached] = useState(() => (original ? PRODUCT_STEPS.length - 1 : 0));
  const [view, setView] = useState<View>("steps");
  const [activeColor, setActiveColor] = useState(0);
  const [newColor, setNewColor] = useState({ name: "", hex: "#1d4ed8" });
  const [tagInput, setTagInput] = useState("");
  const [bulk, setBulk] = useState({ online: "0", physical: "0", price: "" });
  const [imagesColor, setImagesColor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(restored ? "Rascunho restaurado" : null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SaveResult | null>(null);

  if (!mode) return <WideDialog open={false} onClose={onClose} title="">{null}</WideDialog>;

  const update = (patch: Partial<ProductDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const categoryName = (id: number) => categories.find((category) => category.idCategoria === id)?.nome ?? `Categoria ${id}`;
  const savedColorNames = new Set(original?.colors.map((color) => color.name) ?? []);
  const color = draft.colors[activeColor];

  const goTo = (target: number) => {
    setError(null);
    setNotice(null);
    // Ao chegar no estoque, as variantes acompanham as cores e tamanhos escolhidos.
    if (target === 3) setDraft((current) => ({ ...current, variants: buildVariants(current) }));
    setStep(target);
    setReached((current) => Math.max(current, target));
    setView("steps");
  };

  const next = () => {
    const problem = validateStep(step, draft);
    if (problem) {
      setError(problem);
      return;
    }
    if (step < PRODUCT_STEPS.length - 1) goTo(step + 1);
    else {
      setError(null);
      setView("review");
    }
  };

  const saveDraft = () => {
    try {
      storeDraft(draft);
      setNotice("Rascunho salvo neste navegador");
    } catch {
      setNotice("Não foi possível salvar o rascunho neste navegador");
    }
  };

  const publish = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = isEdit && original ? await onUpdate(mode.product.idProduto, original, draft) : await onCreate(draft);
      if (!isEdit) localStorage.removeItem(PRODUCT_DRAFT_STORAGE_KEY);
      setResult(saved);
      setView("saved");
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof ApiError && saveError.message
          ? `Não foi possível salvar: ${saveError.message}`
          : "Não foi possível salvar o produto. Revise os dados e tente de novo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const errorAlert = error && (
    <p role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
      {error}
    </p>
  );

  if (view === "saved" && result) {
    return (
      <WideDialog
        open
        onClose={onClose}
        title={isEdit ? "Alterações salvas" : "Produto publicado"}
        footer={
          <Button variant="action" size="sm" className={`${adminButtonClassName} md:min-w-[220px]`} onClick={onClose}>
            Voltar ao estoque
          </Button>
        }
      >
        <p className="text-sm leading-[21px] text-[var(--foreground-secondary)]">
          {isEdit
            ? `${draft.title} foi atualizado.`
            : `${draft.title} foi publicado com ${draft.variants.length} ${draft.variants.length === 1 ? "variante" : "variantes"}.`}
        </p>
        {result.imageFailures.length > 0 && (
          <p role="alert" className="text-xs leading-[18px] text-[var(--color-warning-text)]">
            Não foi possível enviar estas fotos: {result.imageFailures.join(", ")}. Adicione-as depois pela edição do produto.
          </p>
        )}
      </WideDialog>
    );
  }

  if (view === "review") {
    const changes = original ? diffDrafts(original, draft, categoryName) : [];
    return (
      <WideDialog
        open
        onClose={onClose}
        title={isEdit ? "Revisar alterações" : "Revisar cadastro"}
        description={isEdit ? `${draft.sku} · ${original?.title}` : "Confira os dados antes de publicar."}
        footer={
          <>
            <Button variant="outline-neutral" size="sm" className={`${adminButtonClassName} md:min-w-[205px]`} onClick={() => setView("steps")}>
              {isEdit ? "Voltar à edição" : "Voltar ao cadastro"}
            </Button>
            <div className="flex flex-col items-stretch gap-2 md:items-end">
              {errorAlert}
              <Button
                variant="action"
                size="sm"
                className={`${adminButtonClassName} md:min-w-[240px]`}
                loading={saving}
                disabled={isEdit && changes.length === 0}
                onClick={() => void publish()}
              >
                {isEdit ? "Confirmar e salvar" : "Confirmar e publicar"}
              </Button>
            </div>
          </>
        }
      >
        {isEdit ? (
          <EditReview changes={changes} />
        ) : (
          <CreateReview draft={draft} categoryNames={draft.categoryIds.map(categoryName)} onEditStep={goTo} />
        )}
      </WideDialog>
    );
  }

  const isLastStep = step === PRODUCT_STEPS.length - 1;

  return (
    <>
      <WideDialog
        open={imagesColor === null}
        onClose={onClose}
        title={isEdit ? "Editar produto" : "Cadastrar produto"}
        description={isEdit ? `${draft.sku} · Altere os dados e revise antes de salvar.` : "Preencha os dados e configure as variantes do produto."}
        footer={
          <>
            <div className="flex flex-col gap-3 md:flex-row">
              <Button
                variant="outline-neutral"
                size="sm"
                className={`${adminButtonClassName} md:min-w-[140px]`}
                onClick={() => (step === 0 ? onClose() : goTo(step - 1))}
              >
                {step === 0 ? "Cancelar" : "Anterior"}
              </Button>
              {!isEdit && (
                <Button variant="outline-neutral" size="sm" className={`${adminButtonClassName} md:min-w-[190px]`} onClick={saveDraft}>
                  Salvar rascunho
                </Button>
              )}
            </div>
            <div className="flex flex-col items-stretch gap-2 md:items-end">
              {errorAlert}
              <Button variant="action" size="sm" className={`${adminButtonClassName} md:min-w-[220px]`} onClick={next}>
                {isLastStep ? (isEdit ? "Revisar alterações" : "Revisar produto") : "Próxima etapa"}
              </Button>
            </div>
          </>
        }
      >
        <nav aria-label="Etapas do formulário">
          <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {PRODUCT_STEPS.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  disabled={index > reached}
                  aria-current={index === step ? "step" : undefined}
                  onClick={() => goTo(index)}
                  className={cn(
                    "w-full p-2.5 text-left text-xs leading-[18px] font-medium disabled:cursor-not-allowed",
                    index === step
                      ? "bg-[var(--background-brand-subtle)] text-[var(--color-brand)]"
                      : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]",
                  )}
                >
                  {index + 1} · {label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
        {notice && (
          <p role="status" className="text-xs leading-[18px] text-[var(--color-brand)]">
            {notice}
          </p>
        )}
        <h3 className="text-xl leading-[30px] font-semibold text-[var(--foreground)]">{PRODUCT_STEPS[step]}</h3>

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <AdminField label="Título *" htmlFor="product-title">
              <input
                id="product-title"
                value={draft.title}
                maxLength={180}
                onChange={(event) => update({ title: event.target.value })}
                placeholder="Ex.: Vestido de Festa Princesa Rosé"
                className={adminControlClassName}
              />
            </AdminField>
            <AdminField label="Descrição *" htmlFor="product-description">
              <textarea
                id="product-description"
                rows={4}
                value={draft.description}
                onChange={(event) => update({ description: event.target.value })}
                placeholder="Tecido, modelagem, ocasião e cuidados"
                className={cn(adminControlClassName, "resize-y")}
              />
            </AdminField>
            <AdminField label="SKU base *" htmlFor="product-sku">
              <input
                id="product-sku"
                value={draft.sku}
                maxLength={80}
                disabled={isEdit}
                onChange={(event) => update({ sku: event.target.value.toUpperCase() })}
                placeholder="Ex.: DK-009"
                className={adminControlClassName}
              />
            </AdminField>
            <p className="-mt-2 text-xs leading-[18px] text-[var(--foreground-muted)]">
              {isEdit
                ? "O SKU identifica as variantes já vendidas e não pode ser alterado."
                : "Identificador base para gerar o SKU de cada cor e tamanho."}
            </p>
            <AdminField label="Produto em destaque" htmlFor="product-featured">
              <select
                id="product-featured"
                value={draft.featured ? "sim" : "nao"}
                onChange={(event) => update({ featured: event.target.value === "sim" })}
                className={adminControlClassName}
              >
                <option value="nao">Não · Exibir como produto regular</option>
                <option value="sim">Sim · Destacar na vitrine</option>
              </select>
            </AdminField>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-xs leading-4 font-medium tracking-[0.5px] text-[var(--foreground-secondary)]">Categorias *</legend>
              {categories.length === 0 ? (
                <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">Nenhuma categoria cadastrada no catálogo.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {categories.map((category) => {
                    const checked = draft.categoryIds.includes(category.idCategoria);
                    return (
                      <label
                        key={category.idCategoria}
                        className={cn(
                          adminControlClassName,
                          "flex cursor-pointer items-center gap-2",
                          checked && "border-[var(--color-brand)]",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            update({
                              categoryIds: checked
                                ? draft.categoryIds.filter((id) => id !== category.idCategoria)
                                : [...draft.categoryIds, category.idCategoria],
                            })
                          }
                          className="accent-[var(--color-brand)]"
                        />
                        {category.nome}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
            <h4 className="text-base leading-6 font-semibold text-[var(--foreground)]">Atributos do produto</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Material" htmlFor="product-material">
                <input id="product-material" value={draft.material} maxLength={120} onChange={(event) => update({ material: event.target.value })} placeholder="Ex.: Tule" className={adminControlClassName} />
              </AdminField>
              <AdminField label="Composição" htmlFor="product-composition">
                <input id="product-composition" value={draft.composition} maxLength={180} onChange={(event) => update({ composition: event.target.value })} placeholder="Ex.: 100% Poliéster" className={adminControlClassName} />
              </AdminField>
              <AdminField label="Silhueta" htmlFor="product-silhouette">
                <input id="product-silhouette" value={draft.silhouette} maxLength={120} onChange={(event) => update({ silhouette: event.target.value })} placeholder="Ex.: Princesa" className={adminControlClassName} />
              </AdminField>
              <AdminField label="Qual medida" htmlFor="product-length">
                <select id="product-length" value={draft.length} onChange={(event) => update({ length: event.target.value })} className={adminControlClassName}>
                  <option value="">Não informado</option>
                  {TIPOS.map((tipo) => (
                    <option key={tipo.value} value={tipo.label}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </AdminField>
            </div>
            <AdminField label="Tags e palavras-chave" htmlFor="product-tag">
              <div className={cn(adminControlClassName, "flex flex-wrap items-center gap-2")}>
                {draft.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remover tag ${tag}`}
                      onClick={() => update({ tags: draft.tags.filter((item) => item !== tag) })}
                      className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  id="product-tag"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Digite e tecle Enter"
                  className="min-w-[160px] flex-1 bg-transparent focus:outline-none"
                />
              </div>
            </AdminField>
            <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">
              <button type="button" className="hover:underline" onClick={() => addTag(tagInput)}>
                Adicionar palavra-chave +
              </button>
              {"  ·  Sugestões: "}
              {TAG_SUGGESTIONS.map((tag, index) => (
                <span key={tag}>
                  {index > 0 && " · "}
                  <button type="button" className="hover:underline" onClick={() => addTag(tag)}>
                    {tag}
                  </button>
                </span>
              ))}
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <AdminField label="Preço base *" htmlFor="product-price">
              <input
                id="product-price"
                type="number"
                min={0}
                step={0.01}
                value={draft.basePrice || ""}
                onChange={(event) => update({ basePrice: toNumber(event.target.value) })}
                placeholder="0,00"
                className={adminControlClassName}
              />
            </AdminField>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-xs leading-4 font-medium tracking-[0.5px] text-[var(--foreground-secondary)]">Tamanhos *</legend>
              <div className={cn(adminControlClassName, "flex flex-wrap gap-2")}>
                {STANDARD_SIZES.map((size) => {
                  const active = draft.sizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        update({ sizes: active ? draft.sizes.filter((item) => item !== size) : [...draft.sizes, size] })
                      }
                      className={cn(
                        "min-w-9 rounded-[var(--radius-sm)] border px-2 py-1",
                        active
                          ? "border-[var(--color-brand)] bg-[var(--background-brand-subtle)] text-[var(--color-brand)]"
                          : "border-transparent text-[var(--foreground)]",
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <h4 className="text-base leading-6 font-semibold text-[var(--foreground)]">Cores e imagens por variante</h4>
            <div className="flex flex-wrap gap-3">
              {draft.colors.map((item, index) => (
                <Button
                  key={item.name}
                  variant="outline-neutral"
                  size="sm"
                  aria-pressed={index === activeColor}
                  className={cn(
                    "gap-2 rounded-[var(--radius-sm)] border border-[var(--border-control)] p-3",
                    index === activeColor && "border-[var(--color-brand)] text-[var(--color-brand)]",
                  )}
                  onClick={() => setActiveColor(index)}
                >
                  <span className="size-3 rounded-full border border-[var(--border)]" style={{ backgroundColor: item.hex }} aria-hidden="true" />
                  {item.name}
                </Button>
              ))}
              <Button
                variant="outline-neutral"
                size="sm"
                className="rounded-[var(--radius-sm)] border border-[var(--border-control)] p-3"
                onClick={() => document.getElementById("new-color-name")?.focus()}
              >
                + Adicionar cor
              </Button>
            </div>

            {color && (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Nome da cor *" value={color.name} />
                  <AdminField label="Código da cor" htmlFor="color-hex">
                    <div className="flex items-center gap-2">
                      <input
                        id="color-hex"
                        type="color"
                        value={color.hex}
                        onChange={(event) => updateColor(activeColor, { hex: event.target.value })}
                        className="h-11 w-14 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--border)]"
                      />
                      <span className={adminControlClassName}>{color.hex.toUpperCase()}</span>
                    </div>
                  </AdminField>
                </div>
                <div className="flex flex-wrap items-start gap-4">
                  {color.images.map((image, index) => (
                    <figure key={image.id} className="flex w-[128px] flex-col gap-1.5">
                      <img src={image.src} alt={`Foto ${index + 1} de ${color.name}`} className="h-[160px] w-[128px] rounded-[6px] object-cover" />
                      <figcaption className="text-[10px] leading-[15px] text-[var(--foreground-muted)]">
                        {index === 0 ? "Capa ✓" : `Foto ${index + 1}`}
                      </figcaption>
                    </figure>
                  ))}
                  <Button
                    variant="outline-neutral"
                    size="sm"
                    className="rounded-[var(--radius-sm)] border border-[var(--border-control)] p-3 md:min-w-[170px]"
                    onClick={() => setImagesColor(activeColor)}
                  >
                    + Enviar fotos
                  </Button>
                </div>
                <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">
                  A primeira foto é a capa da cor · Recorte obrigatório 3:4.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline-neutral"
                    size="sm"
                    className={`${adminButtonClassName} md:min-w-[220px]`}
                    onClick={() => setImagesColor(activeColor)}
                  >
                    Gerenciar fotos da cor
                  </Button>
                  {!savedColorNames.has(color.name) && (
                    <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={removeActiveColor}>
                      Remover cor
                    </Button>
                  )}
                </div>
              </div>
            )}

            <h4 className="text-base leading-6 font-semibold text-[var(--foreground)]">Nova cor</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Nome" htmlFor="new-color-name">
                <input
                  id="new-color-name"
                  value={newColor.name}
                  onChange={(event) => setNewColor({ ...newColor, name: event.target.value })}
                  placeholder="Ex.: Azul Royal"
                  className={adminControlClassName}
                />
              </AdminField>
              <AdminField label="Cor personalizada" htmlFor="new-color-hex">
                <div className="flex items-center gap-2">
                  <input
                    id="new-color-hex"
                    type="color"
                    value={newColor.hex}
                    onChange={(event) => setNewColor({ ...newColor, hex: event.target.value })}
                    className="h-11 w-14 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-[var(--border)]"
                  />
                  <span className={adminControlClassName}>{newColor.hex.toUpperCase()}</span>
                </div>
              </AdminField>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_COLORS.filter((item) => !draft.colors.some((existing) => existing.name === item.name)).map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setNewColor(item)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--foreground-secondary)] hover:border-[var(--border-control)]"
                >
                  <span className="size-3 rounded-full border border-[var(--border)]" style={{ backgroundColor: item.hex }} aria-hidden="true" />
                  {item.name}
                </button>
              ))}
            </div>
            <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">
              Selecione uma cor sugerida ou informe o nome e o código da nova cor.
            </p>
            <Button variant="outline-neutral" size="sm" className={`${adminButtonClassName} self-start md:min-w-[200px]`} onClick={addColor}>
              Adicionar cor
            </Button>
          </div>
        )}

        {step === 3 && <StockStep draft={draft} bulk={bulk} setBulk={setBulk} onChange={(variants) => update({ variants })} />}
      </WideDialog>

      <ProductImagesDialog
        color={imagesColor === null ? null : draft.colors[imagesColor]}
        productSku={draft.sku}
        onClose={() => setImagesColor(null)}
        onSave={(images: DraftImage[]) => {
          if (imagesColor !== null) updateColor(imagesColor, { images });
          setImagesColor(null);
        }}
      />
    </>
  );

  function addTag(value: string) {
    const tag = value.trim().toLocaleLowerCase("pt-BR");
    if (tag && !draft.tags.includes(tag)) update({ tags: [...draft.tags, tag] });
    setTagInput("");
  }

  function updateColor(index: number, patch: Partial<ProductDraft["colors"][number]>) {
    setDraft((current) => ({
      ...current,
      colors: current.colors.map((item, position) => (position === index ? { ...item, ...patch } : item)),
    }));
  }

  function addColor() {
    const name = newColor.name.trim();
    if (!name) {
      setError("Informe o nome da nova cor.");
      return;
    }
    if (draft.colors.some((item) => item.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR"))) {
      setError(`A cor ${name} já foi adicionada.`);
      return;
    }
    setError(null);
    update({ colors: [...draft.colors, { name, hex: newColor.hex || NEUTRAL_SWATCH, images: [] }] });
    setActiveColor(draft.colors.length);
    setNewColor({ name: "", hex: "#1d4ed8" });
  }

  function removeActiveColor() {
    update({ colors: draft.colors.filter((_, index) => index !== activeColor) });
    setActiveColor(0);
  }
}

interface StockStepProps {
  draft: ProductDraft;
  bulk: { online: string; physical: string; price: string };
  setBulk: (bulk: { online: string; physical: string; price: string }) => void;
  onChange: (variants: DraftVariant[]) => void;
}

function Summary({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 bg-[var(--background-secondary)] p-4">
      <span className="text-xs leading-[18px] text-[var(--foreground-muted)]">{label}</span>
      <span className="text-xl leading-[30px] font-semibold text-[var(--foreground)]">{value}</span>
    </div>
  );
}

const quantity = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

/** Etapa 4 (755:5504): resumo por canal, aplicar a todas e estoque/preço por variante. */
function StockStep({ draft, bulk, setBulk, onChange }: StockStepProps) {
  const totals = draft.variants.reduce(
    (sum, variant) => ({ online: sum.online + variant.online, physical: sum.physical + variant.physical }),
    { online: 0, physical: 0 },
  );
  const units = (value: number) => `${value} ${value === 1 ? "unidade" : "unidades"}`;
  const setVariant = (sku: string, patch: Partial<DraftVariant>) =>
    onChange(draft.variants.map((variant) => (variant.sku === sku ? { ...variant, ...patch } : variant)));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Summary label="Online" value={units(totals.online)} />
        <Summary label="Loja física" value={units(totals.physical)} />
        <Summary label="Total" value={units(totals.online + totals.physical)} />
      </div>
      <h4 className="text-base leading-6 font-semibold text-[var(--foreground)]">Aplicar a todas as variantes</h4>
      <div className="grid gap-4 md:grid-cols-3">
        <AdminField label="Quantidade online" htmlFor="bulk-online">
          <input id="bulk-online" type="number" min={0} value={bulk.online} onChange={(event) => setBulk({ ...bulk, online: event.target.value })} className={adminControlClassName} />
        </AdminField>
        <AdminField label="Quantidade física" htmlFor="bulk-physical">
          <input id="bulk-physical" type="number" min={0} value={bulk.physical} onChange={(event) => setBulk({ ...bulk, physical: event.target.value })} className={adminControlClassName} />
        </AdminField>
        <AdminField label="Preço unitário" htmlFor="bulk-price">
          <input
            id="bulk-price"
            type="number"
            min={0}
            step={0.01}
            value={bulk.price}
            onChange={(event) => setBulk({ ...bulk, price: event.target.value })}
            placeholder={formatCurrency(draft.basePrice)}
            className={adminControlClassName}
          />
        </AdminField>
      </div>
      <Button
        variant="outline-neutral"
        size="sm"
        className={`${adminButtonClassName} self-start md:min-w-[210px]`}
        onClick={() =>
          onChange(
            draft.variants.map((variant) => ({
              ...variant,
              online: quantity(bulk.online),
              physical: quantity(bulk.physical),
              price: bulk.price ? toNumber(bulk.price) : variant.price,
            })),
          )
        }
      >
        Aplicar às variantes
      </Button>
      <h4 className="text-base leading-6 font-semibold text-[var(--foreground)]">Estoque e preço por variante</h4>
      <ul className="flex flex-col gap-4">
        {draft.variants.map((variant) => (
          <li key={variant.sku} className="flex flex-col gap-3 bg-[var(--background-secondary)] p-4" aria-label={`Variante ${variantLabel(variant)}`}>
            <p className="text-[13px] leading-5 font-medium text-[var(--foreground)]">
              {variant.color} · {variant.size} · {variant.sku}
              {variant.saved ? "" : " · nova"}
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <AdminField label="Online" htmlFor={`online-${variant.sku}`}>
                <input id={`online-${variant.sku}`} type="number" min={0} value={variant.online} onChange={(event) => setVariant(variant.sku, { online: quantity(event.target.value) })} className={adminControlClassName} />
              </AdminField>
              <AdminField label="Loja física" htmlFor={`physical-${variant.sku}`}>
                <input id={`physical-${variant.sku}`} type="number" min={0} value={variant.physical} onChange={(event) => setVariant(variant.sku, { physical: quantity(event.target.value) })} className={adminControlClassName} />
              </AdminField>
              <AdminField label="Preço" htmlFor={`price-${variant.sku}`}>
                <input id={`price-${variant.sku}`} type="number" min={0} step={0.01} value={variant.price} onChange={(event) => setVariant(variant.sku, { price: toNumber(event.target.value) })} className={adminControlClassName} />
              </AdminField>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">
        Total calculado automaticamente: online + loja física. Cada canal mantém seu estoque.
      </p>
    </div>
  );
}
