import Button from "@/components/ui/Button";
import AdminField from "./AdminField";
import { adminButtonClassName } from "./adminClasses";

interface SavedConfirmationProps {
  /** O que foi salvo (campo "Resultado"). */
  result: string;
  onConclude: () => void;
}

/** Conteúdo do frame "Confirmação" (755:197): "Alterações salvas" com Resultado e Próximo passo. */
export default function SavedConfirmation({ result, onConclude }: SavedConfirmationProps) {
  return (
    <>
      <AdminField label="Resultado" value={result} />
      <AdminField label="Próximo passo" value="Retorne à listagem para continuar" />
      <div className="flex flex-col items-start gap-3">
        <Button variant="action" size="sm" className={adminButtonClassName} onClick={onConclude}>
          Concluir
        </Button>
      </div>
    </>
  );
}
