import Button from "@/components/ui/Button";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import { adminButtonClassName } from "./adminClasses";

interface ReportsInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Frame "Relatórios / Detalhe ou edição" (755:1876): explica como cada indicador é calculado. */
export default function ReportsInfoDialog({ open, onClose }: ReportsInfoDialogProps) {
  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title="Como os indicadores são calculados"
      description="Revise os dados antes de continuar."
      actions={
        <>
          <Button variant="action" size="sm" className={adminButtonClassName} onClick={onClose}>
            Entendi
          </Button>
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <AdminField label="Receita" value="Soma dos pedidos não cancelados" />
      <AdminField label="Pedidos válidos" value="Pedidos com status diferente de cancelado" />
      <AdminField label="Ticket médio" value="Receita dividida pelos pedidos válidos" />
      <AdminField label="Ranking" value="Quantidade vendida por SKU da variante" />
    </AdminDialog>
  );
}
