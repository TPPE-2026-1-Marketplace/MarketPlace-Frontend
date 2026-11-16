import { useState } from "react";
import Button from "@/components/ui/Button";
import type { Competence, SellerCommission, SellerSettings } from "@/hooks/useCommissions";
import { useDiscardGuard } from "@/hooks/useDiscardGuard";
import { formatCurrency } from "@/lib/utils";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import SavedConfirmation from "./SavedConfirmation";
import { adminButtonClassName, adminControlClassName } from "./adminClasses";
import { formatCompetence, formatPercentInput, formatShortDate, parsePercentInput } from "./format";
import { formatPosSaleId } from "./posSales";

interface CommissionDetailDialogProps {
  readonly seller: SellerCommission | null;
  readonly competence: Competence;
  /** Só o administrador altera taxa, meta e bônus (regra do backend). */
  readonly readOnly: boolean;
  readonly onClose: () => void;
  readonly onSave: (cpf: string, settings: SellerSettings) => Promise<void>;
}

/**
 * Frames "Comissões / Detalhe ou edição" (755:2911), "Histórico" (755:5868) e
 * "Confirmação" (755:2974).
 */
export default function CommissionDetailDialog(props: Readonly<CommissionDetailDialogProps>) {
  // A key reinicia o formulário a cada vendedor aberto.
  return <CommissionDetailContent key={props.seller?.employee.cpf ?? "fechado"} {...props} />;
}

function CommissionDetailContent({
  seller,
  competence,
  readOnly,
  onClose,
  onSave,
}: Readonly<CommissionDetailDialogProps>) {
  const report = seller?.report;
  const initialRate = formatPercentInput(Number(seller?.employee.taxa_comissao ?? 0));
  const initialTarget = String(report?.meta_vendas || Number(seller?.employee.meta_vendas) || 0);
  const initialBonusEnabled = (report?.valor_bonus ?? 0) > 0;
  const initialBonusRate = formatPercentInput(report?.valor_bonus ?? 0);

  const [rate, setRate] = useState(initialRate);
  const [target, setTarget] = useState(initialTarget);
  const [bonusEnabled, setBonusEnabled] = useState(initialBonusEnabled);
  const [bonusRate, setBonusRate] = useState(initialBonusRate);
  const [view, setView] = useState<"detail" | "history">("detail");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isDirty =
    Boolean(seller) &&
    !readOnly &&
    !saved &&
    (rate !== initialRate ||
      target !== initialTarget ||
      bonusEnabled !== initialBonusEnabled ||
      bonusRate !== initialBonusRate);
  const baseGuard = useDiscardGuard(isDirty, onClose);
  const discardGuard = {
    ...baseGuard,
    requestClose: () => {
      setError(null);
      baseGuard.requestClose();
    },
  };

  if (!seller) return <AdminDialog open={false} onClose={onClose} title="" />;

  const name = seller.employee.person.nome;
  const baseRate = Number(seller.employee.taxa_comissao);

  if (saved) {
    return (
      <AdminDialog open onClose={onClose} title="Alterações salvas">
        <SavedConfirmation
          result={`Comissão e meta de ${name} salvas para ${formatCompetence(competence.mes, competence.ano).toLocaleLowerCase("pt-BR")}`}
          onConclude={onClose}
        />
      </AdminDialog>
    );
  }

  if (view === "history") {
    const sales = report?.pedidos ?? [];
    return (
      <AdminDialog
        open
        onClose={onClose}
        discardGuard={discardGuard}
        title={`Histórico de vendas · ${name}`}
        actions={
          <>
            <Button variant="action" size="sm" className={adminButtonClassName} onClick={() => setView("detail")}>
              Voltar às comissões
            </Button>
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              onClick={discardGuard.requestClose}
            >
              Cancelar
            </Button>
          </>
        }
      >
        {sales.length === 0 ? (
          <AdminField label="Vendas" value="Nenhuma venda presencial nesta competência" />
        ) : (
          sales.map((sale) => (
            <AdminField
              key={sale.idPedido}
              label={`${formatShortDate(sale.dataPedido)} · ${formatPosSaleId(sale.idPedido)}`}
              value={`${formatCurrency(Number(sale.valorTotal))} · Comissão ${formatCurrency(Number(sale.valorTotal) * baseRate)}`}
            />
          ))
        )}
      </AdminDialog>
    );
  }

  const save = async () => {
    const taxaComissao = parsePercentInput(rate);
    const valorMeta = Number(target);
    const valorBonus = bonusEnabled ? parsePercentInput(bonusRate) : 0;
    if ([taxaComissao, valorMeta, valorBonus].some((value) => !Number.isFinite(value) || value < 0)) {
      setError("Informe valores numéricos não negativos.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(seller.employee.cpf, { taxaComissao, valorMeta, valorBonus });
      setSaved(true);
    } catch (saveError) {
      console.error(saveError);
      setError("Não foi possível salvar a configuração de comissão.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDialog
      open
      onClose={onClose}
      discardGuard={discardGuard}
      title={`Comissão e meta · ${name}`}
      description="Revise os dados antes de continuar."
      actions={
        <>
          {error && (
            <p role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
              {error}
            </p>
          )}
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={() => setView("history")}>
            Histórico de vendas
          </Button>
          {!readOnly && (
            <Button variant="action" size="sm" className={adminButtonClassName} loading={saving} onClick={() => void save()}>
              Salvar configuração
            </Button>
          )}
          <Button
            variant="outline-neutral"
            size="sm"
            className={adminButtonClassName}
            onClick={discardGuard.requestClose}
          >
            {readOnly ? "Fechar" : "Cancelar"}
          </Button>
        </>
      }
    >
      <AdminField label="Competência" value={formatCompetence(competence.mes, competence.ano)} />
      {readOnly ? (
        <>
          <AdminField label="Taxa de comissão (%)" value={rate} />
          <AdminField label="Meta de vendas (R$)" value={formatCurrency(Number(target))} />
          <AdminField label="Bônus ao bater a meta (%)" value={bonusEnabled ? bonusRate : "Sem bônus"} />
        </>
      ) : (
        <>
          <AdminField label="Taxa de comissão (%)" htmlFor="commission-rate">
            <input
              id="commission-rate"
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              className={adminControlClassName}
            />
          </AdminField>
          <AdminField label="Meta de vendas (R$)" htmlFor="commission-target">
            <input
              id="commission-target"
              type="number"
              min={0}
              step={100}
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className={adminControlClassName}
            />
          </AdminField>
          <AdminField label="Bônus habilitado" htmlFor="commission-bonus-enabled">
            <select
              id="commission-bonus-enabled"
              value={bonusEnabled ? "sim" : "nao"}
              onChange={(event) => setBonusEnabled(event.target.value === "sim")}
              className={adminControlClassName}
            >
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </AdminField>
          {bonusEnabled && (
            <AdminField label="Bônus ao bater a meta (%)" htmlFor="commission-bonus">
              <input
                id="commission-bonus"
                inputMode="decimal"
                value={bonusRate}
                onChange={(event) => setBonusRate(event.target.value)}
                className={adminControlClassName}
              />
            </AdminField>
          )}
        </>
      )}
      <AdminField label="Vendas no mês" value={formatCurrency(report?.total_vendas ?? 0)} />
      <AdminField label="Comissão calculada" value={report ? formatCurrency(report.comissao) : "Relatório indisponível"} />
    </AdminDialog>
  );
}
