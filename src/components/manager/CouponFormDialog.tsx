import { useState } from "react";
import Button from "@/components/ui/Button";
import type { ApiCoupon, CouponPayload } from "@/hooks/useManagementCoupons";
import { ApiError } from "@/lib/api";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import SavedConfirmation from "./SavedConfirmation";
import { adminButtonClassName, adminControlClassName } from "./adminClasses";

interface CouponForm {
  name: string;
  code: string;
  type: "porcentagem" | "fixo";
  value: string;
  start: string;
  end: string;
  limit: string;
  active: boolean;
}

/** "2026-10-01" a partir do ISO da API, no fuso local. */
const toDateInput = (iso: string) => {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

function toForm(coupon: ApiCoupon | null): CouponForm {
  if (!coupon) return { name: "", code: "", type: "porcentagem", value: "", start: "", end: "", limit: "", active: true };
  return {
    name: coupon.nomeInfluenciador ?? "",
    code: coupon.numeroDoCupom,
    type: coupon.tipoCupom,
    value: String(Number(coupon.valorDesconto)),
    start: toDateInput(coupon.dataInicio),
    end: toDateInput(coupon.dataFim),
    limit: coupon.usoMaximo ? String(coupon.usoMaximo) : "",
    active: coupon.ativo,
  };
}

function validate(form: CouponForm): string | null {
  if (!form.code.trim() || !form.value || !form.start || !form.end) {
    return "Preencha código, valor do desconto, data início e data fim.";
  }
  const value = Number(form.value);
  if (!(value > 0)) return "O valor do desconto deve ser maior que zero.";
  if (form.type === "porcentagem" && value > 100) return "O desconto percentual vai até 100%.";
  if (form.end < form.start) return "A data fim deve ser igual ou posterior à data início.";
  if (form.limit && !(Number.isInteger(Number(form.limit)) && Number(form.limit) > 0)) {
    return "O limite de usos deve ser um número inteiro maior que zero.";
  }
  return null;
}

function toPayload(form: CouponForm): CouponPayload {
  return {
    tipoCupom: form.type,
    valorDesconto: Number(form.value),
    ativo: form.active,
    // Início no começo do dia e fim no fim do dia, no fuso da loja.
    dataInicio: new Date(`${form.start}T00:00:00`).toISOString(),
    dataFim: new Date(`${form.end}T23:59:59`).toISOString(),
    usoMaximo: form.limit ? Number(form.limit) : null,
    nomeInfluenciador: form.name.trim() || null,
  };
}

type Step = "form" | "confirmDeactivate" | "confirmDelete";

interface CouponFormDialogProps {
  open: boolean;
  /** null = novo cupom. */
  coupon: ApiCoupon | null;
  onClose: () => void;
  onCreate: (payload: CouponPayload) => Promise<void>;
  onUpdate: (code: string, payload: Partial<CouponPayload>) => Promise<void>;
  onDelete: (code: string) => Promise<void>;
}

/**
 * Frames "Cupons / Detalhe ou edição" (755:3374), "Novo cadastro" (755:3473),
 * "Cupom / Confirmar desativação" (764:14879) e "Confirmação" (755:3451).
 */
export default function CouponFormDialog(props: CouponFormDialogProps) {
  return <CouponFormContent key={`${props.open}-${props.coupon?.numeroDoCupom ?? "novo"}`} {...props} />;
}

function CouponFormContent({ open, coupon, onClose, onCreate, onUpdate, onDelete }: CouponFormDialogProps) {
  const [form, setForm] = useState<CouponForm>(() => toForm(coupon));
  const [step, setStep] = useState<Step>("form");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  if (!open) return <AdminDialog open={false} onClose={onClose} title="" />;

  const update = (patch: Partial<CouponForm>) => setForm((current) => ({ ...current, ...patch }));

  const run = async (action: () => Promise<void>, message: string) => {
    setSaving(true);
    setError(null);
    try {
      await action();
      setSavedMessage(message);
    } catch (actionError) {
      console.error(actionError);
      setError(actionError instanceof ApiError && actionError.message ? actionError.message : "Não foi possível salvar o cupom.");
      setStep("form");
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    const problem = validate(form);
    if (problem) {
      setError(problem);
      return;
    }
    const code = form.code.trim().toUpperCase();
    void run(
      () => (coupon ? onUpdate(coupon.numeroDoCupom, toPayload(form)) : onCreate({ ...toPayload(form), numeroDoCupom: code })),
      coupon ? `Cupom ${code} atualizado` : `Cupom ${code} criado`,
    );
  };

  if (savedMessage) {
    return (
      <AdminDialog open onClose={onClose} title="Alterações salvas">
        <SavedConfirmation result={savedMessage} onConclude={onClose} />
      </AdminDialog>
    );
  }

  const errorAlert = error && (
    <p role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
      {error}
    </p>
  );

  if (coupon && step !== "form") {
    const isDelete = step === "confirmDelete";
    return (
      <AdminDialog
        open
        onClose={onClose}
        title={isDelete ? "Confirmar exclusão" : "Confirmar desativação"}
        actions={
          <>
            {errorAlert}
            <Button
              variant="action"
              size="sm"
              className={adminButtonClassName}
              loading={saving}
              onClick={() =>
                void (isDelete
                  ? run(() => onDelete(coupon.numeroDoCupom), `Cupom ${coupon.numeroDoCupom} excluído`)
                  : run(() => onUpdate(coupon.numeroDoCupom, { ativo: false }), `Cupom ${coupon.numeroDoCupom} desativado`))
              }
            >
              {isDelete ? "Confirmar exclusão" : "Confirmar desativação"}
            </Button>
            <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={() => setStep("form")}>
              Cancelar
            </Button>
          </>
        }
      >
        <AdminField label="Ação" value={isDelete ? `Excluir o cupom ${coupon.numeroDoCupom}` : `Desativar o cupom ${coupon.numeroDoCupom}`} />
        <AdminField
          label="Consequência"
          value={
            isDelete
              ? "O cupom será removido após a confirmação"
              : "O cupom deixa de ser aceito no checkout; o histórico de uso é mantido"
          }
        />
      </AdminDialog>
    );
  }

  const products = coupon?.products ?? [];

  return (
    <AdminDialog
      open
      onClose={onClose}
      title={coupon ? `Cupom · ${coupon.numeroDoCupom}` : "Novo cupom"}
      description="Revise os dados antes de continuar."
      actions={
        <>
          {errorAlert}
          {coupon?.ativo && (
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              disabled={saving}
              onClick={() => setStep("confirmDeactivate")}
            >
              Desativar cupom
            </Button>
          )}
          <Button variant="action" size="sm" className={adminButtonClassName} loading={saving} onClick={save}>
            Salvar cupom
          </Button>
          {coupon && (
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              disabled={saving}
              onClick={() => setStep("confirmDelete")}
            >
              Excluir cupom
            </Button>
          )}
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <AdminField label="Campanha / parceiro" htmlFor="coupon-name">
        <input
          id="coupon-name"
          maxLength={100}
          value={form.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder="Ex.: Primeira compra ou @influenciadora"
          className={adminControlClassName}
        />
      </AdminField>
      {coupon ? (
        <AdminField label="Código *" value={coupon.numeroDoCupom} />
      ) : (
        <AdminField label="Código *" htmlFor="coupon-code">
          <input
            id="coupon-code"
            value={form.code}
            onChange={(event) => update({ code: event.target.value.toUpperCase() })}
            placeholder="Ex.: BEMVINDA10"
            className={adminControlClassName}
          />
        </AdminField>
      )}
      <AdminField label="Tipo de desconto *" htmlFor="coupon-type">
        <select
          id="coupon-type"
          value={form.type}
          onChange={(event) => update({ type: event.target.value as CouponForm["type"] })}
          className={adminControlClassName}
        >
          <option value="porcentagem">Percentual</option>
          <option value="fixo">Valor fixo (R$)</option>
        </select>
      </AdminField>
      <AdminField label="Valor do desconto *" htmlFor="coupon-value">
        <input
          id="coupon-value"
          type="number"
          min={0}
          step={form.type === "porcentagem" ? 1 : 0.01}
          value={form.value}
          onChange={(event) => update({ value: event.target.value })}
          className={adminControlClassName}
        />
      </AdminField>
      <AdminField label="Data início *" htmlFor="coupon-start">
        <input
          id="coupon-start"
          type="date"
          value={form.start}
          onChange={(event) => update({ start: event.target.value })}
          className={adminControlClassName}
        />
      </AdminField>
      <AdminField label="Data fim *" htmlFor="coupon-end">
        <input
          id="coupon-end"
          type="date"
          value={form.end}
          onChange={(event) => update({ end: event.target.value })}
          className={adminControlClassName}
        />
      </AdminField>
      <AdminField label="Limite de usos" htmlFor="coupon-limit">
        <input
          id="coupon-limit"
          type="number"
          min={1}
          step={1}
          value={form.limit}
          onChange={(event) => update({ limit: event.target.value })}
          placeholder="Sem limite"
          className={adminControlClassName}
        />
      </AdminField>
      <AdminField
        label="Produtos aplicáveis"
        value={
          products.length === 0
            ? "Todos os produtos"
            : products.map((product) => product.titulo ?? `Produto #${product.idProduto}`).join(", ")
        }
      />
      <AdminField label="Status" htmlFor="coupon-status">
        <select
          id="coupon-status"
          value={form.active ? "ativo" : "inativo"}
          onChange={(event) => update({ active: event.target.value === "ativo" })}
          className={adminControlClassName}
        >
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </AdminField>
    </AdminDialog>
  );
}
