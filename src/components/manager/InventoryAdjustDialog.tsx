import { useState } from "react";
import Button from "@/components/ui/Button";
import type { InventoryRow } from "@/hooks/useInventoryRows";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import SavedConfirmation from "./SavedConfirmation";
import { adminButtonClassName, adminControlClassName } from "./adminClasses";

interface InventoryAdjustDialogProps {
  row: InventoryRow | null;
  onClose: () => void;
  onSave: (codigoSku: string, stock: { online: number; physical: number }) => Promise<void>;
  onRemove: (row: InventoryRow) => Promise<void>;
}

type Step = "form" | "confirm-remove" | "saved" | "removed";

/** Frames "Estoque / Detalhe ou edição" (755:583), "Confirmação" (755:618) e "confirmDelete" (755:6020). */
export default function InventoryAdjustDialog(props: InventoryAdjustDialogProps) {
  // A key reinicia as quantidades a cada variante aberta.
  return <InventoryAdjustContent key={props.row?.codigoSku ?? "fechado"} {...props} />;
}

const toQuantity = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

function InventoryAdjustContent({ row, onClose, onSave, onRemove }: InventoryAdjustDialogProps) {
  const [online, setOnline] = useState(row?.stockOnline ?? 0);
  const [physical, setPhysical] = useState(row?.stockPhysical ?? 0);
  const [step, setStep] = useState<Step>("form");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!row) return <AdminDialog open={false} onClose={onClose} title="" />;

  // Última variante: excluir remove o produto inteiro do catálogo.
  const removesProduct = row.isOrphan || row.product.variants.length === 1;
  const variantText = row.variantLabel ? `${row.variantLabel} · ${row.codigoSku}` : row.codigoSku;

  const run = async (action: () => Promise<void>, next: Step, failure: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setStep(next);
    } catch (actionError) {
      console.error(actionError);
      setError(failure);
    } finally {
      setBusy(false);
    }
  };

  if (step === "saved" || step === "removed") {
    return (
      <AdminDialog open onClose={onClose} title="Alterações salvas">
        <SavedConfirmation
          result={
            step === "saved"
              ? `Estoque de ${row.codigoSku} atualizado: ${online} online e ${physical} na loja`
              : removesProduct
                ? `Produto ${row.title} excluído do catálogo`
                : `Variante ${row.codigoSku} excluída do catálogo`
          }
          onConclude={onClose}
        />
      </AdminDialog>
    );
  }

  const errorMessage = error && (
    <p role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
      {error}
    </p>
  );

  if (step === "confirm-remove") {
    return (
      <AdminDialog
        open
        onClose={onClose}
        title={removesProduct ? "Excluir produto?" : "Excluir variante?"}
        description="Esta ação não pode ser desfeita."
        actions={
          <>
            {errorMessage}
            <Button
              variant="action"
              size="sm"
              className={adminButtonClassName}
              loading={busy}
              onClick={() =>
                void run(() => onRemove(row), "removed", "Não foi possível concluir a exclusão.")
              }
            >
              {removesProduct ? "Excluir produto" : "Excluir variante"}
            </Button>
            <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={() => setStep("form")}>
              Cancelar
            </Button>
          </>
        }
      >
        <AdminField
          label="Item"
          value={removesProduct ? `${row.title} e todas as variantes` : `${row.title} · ${variantText}`}
        />
      </AdminDialog>
    );
  }

  return (
    <AdminDialog
      open
      onClose={onClose}
      title={`Ajustar estoque · ${row.title}`}
      description="Revise os dados antes de continuar."
      actions={
        <>
          {errorMessage}
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={() => setStep("confirm-remove")}>
            {removesProduct ? "Excluir produto" : "Excluir variante"}
          </Button>
          {!row.isOrphan && (
            <Button
              variant="action"
              size="sm"
              className={adminButtonClassName}
              loading={busy}
              onClick={() =>
                void run(() => onSave(row.codigoSku, { online, physical }), "saved", "Não foi possível atualizar o estoque.")
              }
            >
              Salvar estoque
            </Button>
          )}
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <AdminField label="Variante" value={variantText} />
      {row.isOrphan ? (
        <AdminField label="Estoque" value="Cadastre uma variante para controlar o estoque deste produto" />
      ) : (
        <>
          <AdminField label="Quantidade online" htmlFor="stock-online">
            <input
              id="stock-online"
              type="number"
              min={0}
              inputMode="numeric"
              value={online}
              onChange={(event) => setOnline(toQuantity(event.target.value))}
              className={adminControlClassName}
            />
          </AdminField>
          <AdminField label="Quantidade loja física" htmlFor="stock-physical">
            <input
              id="stock-physical"
              type="number"
              min={0}
              inputMode="numeric"
              value={physical}
              onChange={(event) => setPhysical(toQuantity(event.target.value))}
              className={adminControlClassName}
            />
          </AdminField>
        </>
      )}
    </AdminDialog>
  );
}
