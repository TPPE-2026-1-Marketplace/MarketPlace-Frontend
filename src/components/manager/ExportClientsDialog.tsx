import { useState } from "react";
import Button from "@/components/ui/Button";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import { adminButtonClassName } from "./adminClasses";

interface ExportClientsDialogProps {
  /** Clientes do resultado atual da busca. */
  count: number;
  /** Nome do arquivo que será baixado. */
  filename: string;
  /** Gera o download; chamado ao confirmar a exportação. */
  onConfirm: () => void;
  onClose: () => void;
}

type Step = "review" | "done";

const clientsLabel = (count: number) => `${count.toLocaleString("pt-BR")} ${count === 1 ? "cliente" : "clientes"}`;

/** Frames "Clientes / Detalhe ou edição" (755:3910) e "Confirmação" (755:3949). */
export default function ExportClientsDialog({ count, filename, onConfirm, onClose }: ExportClientsDialogProps) {
  const [step, setStep] = useState<Step>("review");

  if (step === "done") {
    return (
      <AdminDialog
        open
        onClose={onClose}
        title="Exportação preparada"
        actions={
          <Button variant="action" size="sm" className={adminButtonClassName} onClick={onClose}>
            Concluir
          </Button>
        }
      >
        <AdminField label="Arquivo" value={filename} />
        <AdminField label="Quantidade" value={clientsLabel(count)} />
      </AdminDialog>
    );
  }

  return (
    <AdminDialog
      open
      onClose={onClose}
      title="Exportar clientes"
      description="Revise os dados antes de continuar."
      actions={
        <>
          <Button
            variant="action"
            size="sm"
            className={adminButtonClassName}
            onClick={() => {
              onConfirm();
              setStep("done");
            }}
          >
            Confirmar exportação
          </Button>
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <AdminField label="Seleção" value="Resultado atual da busca" />
      <AdminField label="Quantidade" value={clientsLabel(count)} />
      <AdminField label="Formato" value="CSV" />
      <AdminField label="Colunas" value="Nome, e-mail, telefone e CPF" />
    </AdminDialog>
  );
}
