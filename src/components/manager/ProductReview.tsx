import type { ReactNode } from "react";
import { variantLabel, type DraftChange, type ProductDraft } from "@/lib/productDraft";
import { formatCurrency } from "@/lib/utils";

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm leading-[22px] font-semibold text-[var(--foreground)]">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Editar ${title.toLocaleLowerCase("pt-BR")}`}
          className="text-xs leading-[18px] font-medium text-[var(--color-brand)] hover:underline"
        >
          Editar
        </button>
      </div>
      {children}
    </section>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[11px] leading-[17px] text-[var(--foreground-muted)]">{label}</span>
      <span className="text-[13px] leading-5 font-medium break-words text-[var(--foreground)]">{value || "—"}</span>
    </div>
  );
}

const Divider = () => <hr className="border-[var(--border)]" />;

interface CreateReviewProps {
  draft: ProductDraft;
  categoryNames: string[];
  onEditStep: (step: number) => void;
}

/** Frame "Cadastro de produto / Revisão antes de publicar" (755:5169). */
export function CreateReview({ draft, categoryNames, onEditStep }: CreateReviewProps) {
  const cover = draft.colors.find((color) => color.images.length > 0)?.images[0];
  const totals = draft.variants.reduce(
    (sum, variant) => ({ online: sum.online + variant.online, physical: sum.physical + variant.physical }),
    { online: 0, physical: 0 },
  );

  return (
    <>
      <div className="flex items-center gap-5">
        {cover ? (
          <img src={cover.src} alt={`Capa de ${draft.title}`} className="h-[104px] w-[78px] shrink-0 rounded-[4px] object-cover" />
        ) : (
          <div className="flex h-[104px] w-[78px] shrink-0 items-center justify-center rounded-[4px] bg-[var(--background-secondary)] text-center text-[11px] text-[var(--foreground-muted)]">
            Sem capa
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="text-lg leading-[26px] font-semibold text-[var(--foreground)]">{draft.title}</p>
          <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">
            SKU {draft.sku} · {categoryNames.join(" / ") || "Sem categoria"}
          </p>
          <p className="text-xl leading-7 font-semibold text-[var(--foreground)]">{formatCurrency(draft.basePrice)}</p>
        </div>
      </div>
      <Divider />
      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Informação básica" onEdit={() => onEditStep(0)}>
          <Info label="Descrição" value={draft.description} />
          <div className="grid grid-cols-2 gap-5">
            <Info label="SKU base" value={draft.sku} />
            <Info label="Em destaque" value={draft.featured ? "Sim" : "Não"} />
          </div>
        </Section>
        <Section title="Categoria e atributos" onEdit={() => onEditStep(1)}>
          <Info label="Categorias" value={categoryNames.join(" · ")} />
          <div className="grid grid-cols-2 gap-4">
            <Info label="Material" value={draft.material} />
            <Info label="Composição" value={draft.composition} />
            <Info label="Silhueta" value={draft.silhouette} />
            <Info label="Qual medida" value={draft.length} />
          </div>
          {draft.tags.length > 0 && (
            <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">Tags: {draft.tags.join(" · ")}</p>
          )}
        </Section>
      </div>
      <Divider />
      <Section title="Cores e imagens" onEdit={() => onEditStep(2)}>
        <ul className="grid gap-4 md:grid-cols-2">
          {draft.colors.map((color) => (
            <li key={color.name} className="flex items-center gap-3">
              <span className="size-6 shrink-0 rounded-full border border-[var(--border)]" style={{ backgroundColor: color.hex }} aria-hidden="true" />
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] leading-5 font-medium text-[var(--foreground)]">{color.name}</span>
                <span
                  className={
                    color.images.length > 0
                      ? "text-xs leading-[18px] text-[var(--foreground-muted)]"
                      : "text-xs leading-[18px] text-[var(--color-warning-text)]"
                  }
                >
                  {color.images.length > 0
                    ? `${color.images.length} ${color.images.length === 1 ? "foto" : "fotos"} · Capa definida`
                    : "Sem fotos desta cor"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </Section>
      <Divider />
      <Section title="Variantes, preços e estoque" onEdit={() => onEditStep(3)}>
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--background-secondary)] text-[11px] leading-[17px] font-medium text-[var(--foreground-muted)] uppercase">
            <tr>
              <th scope="col" className="px-3 py-2">Cor / tamanho</th>
              <th scope="col" className="px-3 py-2">Online</th>
              <th scope="col" className="px-3 py-2">Loja física</th>
              <th scope="col" className="px-3 py-2">Total</th>
              <th scope="col" className="px-3 py-2">Preço</th>
            </tr>
          </thead>
          <tbody className="text-[var(--foreground)]">
            {draft.variants.map((variant) => (
              <tr key={variant.sku}>
                <td className="px-3 py-2">{variantLabel(variant)}</td>
                <td className="px-3 py-2">{variant.online}</td>
                <td className="px-3 py-2">{variant.physical}</td>
                <td className="px-3 py-2">{variant.online + variant.physical}</td>
                <td className="px-3 py-2">{formatCurrency(variant.price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-[var(--background-secondary)] font-medium text-[var(--foreground)]">
            <tr>
              <td className="px-3 py-2">
                {draft.variants.length} {draft.variants.length === 1 ? "variante" : "variantes"}
              </td>
              <td className="px-3 py-2">{totals.online}</td>
              <td className="px-3 py-2">{totals.physical}</td>
              <td className="px-3 py-2">{totals.online + totals.physical}</td>
              <td className="px-3 py-2" />
            </tr>
          </tfoot>
        </table>
      </Section>
    </>
  );
}

interface EditReviewProps {
  changes: DraftChange[];
}

/** Frame "Edição de produto / Revisar alterações" (829:7572): antes → depois de cada campo. */
export function EditReview({ changes }: EditReviewProps) {
  return (
    <>
      <h3 className="text-xl leading-[30px] font-semibold text-[var(--foreground)]">Confira as alterações antes de salvar</h3>
      <p className="text-sm leading-[21px] text-[var(--foreground-muted)]">
        {changes.length === 0
          ? "Nenhum campo foi alterado."
          : `${changes.length} ${changes.length === 1 ? "campo alterado" : "campos alterados"} · Os demais dados serão mantidos.`}
      </p>
      <ul className="flex flex-col gap-4">
        {changes.map((change) => (
          <li key={change.label} className="flex flex-col gap-3 bg-[var(--background-secondary)] p-5">
            <p className="text-sm leading-[21px] font-semibold text-[var(--foreground)]">{change.label}</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4">
              <div className="flex min-w-0 flex-col gap-1.5 text-[var(--foreground-muted)]">
                <span className="text-[11px] leading-[17px] font-medium">ANTES</span>
                <span className="text-sm leading-[21px] break-words">{change.before}</span>
              </div>
              <span className="text-2xl leading-9 text-[var(--foreground-muted)]" aria-hidden="true">
                →
              </span>
              <div className="flex min-w-0 flex-col gap-1.5 font-medium">
                <span className="text-[11px] leading-[17px] text-[var(--color-brand)]">DEPOIS</span>
                <span className="text-sm leading-[21px] break-words text-[var(--foreground)]">{change.after}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
