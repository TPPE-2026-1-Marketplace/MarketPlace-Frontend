import Button from "@/components/ui/Button";
import { orderCustomerCpf, orderCustomerName, type ApiOrder } from "@/lib/management";
import { formatCurrency, obscureCpf } from "@/lib/utils";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import { adminButtonClassName } from "./adminClasses";
import { POS_PAYMENT_NOT_RECORDED, formatPosSaleId, posSellerName } from "./posSales";

interface PosSaleDetailDialogProps {
  sale: ApiOrder | null;
  onClose: () => void;
}

function describeSeller(sale: ApiOrder) {
  const code = sale.employee?.codigo_funcionario;
  return code ? `${posSellerName(sale)} / ${code}` : posSellerName(sale);
}

function describeCustomer(sale: ApiOrder) {
  const cpf = orderCustomerCpf(sale);
  if (!sale.user?.nome && !sale.clienteNomeAvulso) return cpf ? obscureCpf(cpf) : "Cliente não informado";
  return cpf ? `${orderCustomerName(sale)} · ${obscureCpf(cpf)}` : orderCustomerName(sale);
}

/** "26/10/2026, 10:42", como no protótipo. */
const fullDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Frame "Vendas PDV / Detalhe ou edição" (755:1460). A venda presencial é só de
 * consulta: as duas ações do protótipo ("Voltar às vendas" e "Cancelar") fecham o dialog.
 */
export default function PosSaleDetailDialog({ sale, onClose }: PosSaleDetailDialogProps) {
  if (!sale) return <AdminDialog open={false} onClose={onClose} title="" />;

  const items =
    sale.items.length > 0
      ? sale.items.map((item) => `${item.idVariante} · ${item.quantidade}`).join("\n")
      : "Venda sem itens retornados pela API";

  return (
    <AdminDialog
      open
      onClose={onClose}
      title={`Venda ${formatPosSaleId(sale.idPedido)}`}
      description="Revise os dados antes de continuar."
      actions={
        <>
          <Button variant="action" size="sm" className={adminButtonClassName} onClick={onClose}>
            Voltar às vendas
          </Button>
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <AdminField label="Data" value={fullDate(sale.dataPedido)} />
      <AdminField label="Vendedor" value={describeSeller(sale)} />
      <AdminField label="Cliente" value={describeCustomer(sale)} />
      <AdminField label="Itens" value={<span className="whitespace-pre-line">{items}</span>} />
      <AdminField label="Pagamento" value={POS_PAYMENT_NOT_RECORDED} />
      <AdminField label="Total" value={formatCurrency(Number(sale.valorTotal))} />
    </AdminDialog>
  );
}
