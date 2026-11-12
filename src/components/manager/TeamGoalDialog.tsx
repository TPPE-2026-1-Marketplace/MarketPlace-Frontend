import { useState } from "react";
import Button from "@/components/ui/Button";
import type { Competence, SalesGoal } from "@/hooks/useCommissions";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import SavedConfirmation from "./SavedConfirmation";
import { adminButtonClassName, adminControlClassName } from "./adminClasses";
import { formatCompetence, formatPercentInput, parsePercentInput } from "./format";

interface TeamGoalDialogProps {
  open: boolean;
  goal: SalesGoal | null;
  competence: Competence;
  onClose: () => void;
  onSave: (valorMeta: number, valorBonus: number) => Promise<void>;
}

/**
 * "Configurar metas" do protótipo: meta coletiva da competência, usada pelo backend
 * para quem não tem meta individual.
 */
export default function TeamGoalDialog(props: TeamGoalDialogProps) {
  return <TeamGoalContent key={`${props.open}-${props.goal?.idGoal ?? "nova"}`} {...props} />;
}

function TeamGoalContent({ open, goal, competence, onClose, onSave }: TeamGoalDialogProps) {
  const [target, setTarget] = useState(() => String(Number(goal?.valorMeta ?? 0)));
  const [bonusRate, setBonusRate] = useState(() => formatPercentInput(Number(goal?.valorBonus ?? 0)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const label = formatCompetence(competence.mes, competence.ano);

  if (saved) {
    return (
      <AdminDialog open={open} onClose={onClose} title="Alterações salvas">
        <SavedConfirmation result={`Meta da equipe salva para ${label.toLocaleLowerCase("pt-BR")}`} onConclude={onClose} />
      </AdminDialog>
    );
  }

  const save = async () => {
    const valorMeta = Number(target);
    const valorBonus = parsePercentInput(bonusRate);
    if (![valorMeta, valorBonus].every((value) => Number.isFinite(value) && value >= 0)) {
      setError("Informe valores numéricos não negativos.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(valorMeta, valorBonus);
      setSaved(true);
    } catch (saveError) {
      console.error(saveError);
      setError("Não foi possível salvar a meta da equipe.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title="Meta da equipe"
      description="Vale para os vendedores sem meta individual na competência."
      actions={
        <>
          {error && (
            <p role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
              {error}
            </p>
          )}
          <Button variant="action" size="sm" className={adminButtonClassName} loading={saving} onClick={() => void save()}>
            Salvar meta
          </Button>
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <AdminField label="Competência" value={label} />
      <AdminField label="Meta de vendas (R$)" htmlFor="team-goal-target">
        <input
          id="team-goal-target"
          type="number"
          min={0}
          step={1000}
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          className={adminControlClassName}
        />
      </AdminField>
      <AdminField label="Bônus ao bater a meta (%)" htmlFor="team-goal-bonus">
        <input
          id="team-goal-bonus"
          inputMode="decimal"
          value={bonusRate}
          onChange={(event) => setBonusRate(event.target.value)}
          className={adminControlClassName}
        />
      </AdminField>
    </AdminDialog>
  );
}
