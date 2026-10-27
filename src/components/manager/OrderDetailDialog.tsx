import { useState } from "react";
import Button from "@/components/ui/Button";
import {
  ORDER_STATUS_LABELS,
  orderCustomerCpf,
  orderCustomerName,
  type ApiOrder,
  type ApiOrderStatus,
} from "@/lib/management";
import { formatCurrency, obscureCpf } from "@/lib/utils";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import SavedConfirmation from "./SavedConfirmation";
import { adminButtonClassName, adminControlClassName } from "./adminClasses";

/** "Pago" é definido pelo pagamento, não pela gestão (mesma regra da tela anterior). */
const EDITABLE_STATUSES = (Object.keys(ORDER_STATUS_LABELS) as ApiOrderStatus[]).filter((status) => status !== "paid");

interface OrderDetailDialogProps {
  order: ApiOrder | null;
  readOnly: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: number, status: ApiOrderStatus) => Promise<void>;
  onUpdateTracking: (orderId: number, trackingCode: string) => Promise<void>;
}

function describeCustomer(order: ApiOrder) {
  const cpf = orderCustomerCpf(order);
  return cpf ? `${orderCustomerName(order)} · ${obscureCpf(cpf)}` : orderCustomerName(order);
}

/** Frames "Pedidos / Detalhe ou edição" (755:1004) e "Confirmação" (755:1060). */
export default function OrderDetailDialog(props: OrderDetailDialogProps) {
  // A key reinicia o formulário a cada pedido aberto.
  return <OrderDetailContent key={props.order?.idPedido ?? "fechado"} {...props} />;
}

function OrderDetailContent({ order, readOnly, onClose, onUpdateStatus, onUpdateTracking }: OrderDetailDialogProps) {
  const [status, setStatus] = useState<ApiOrderStatus>(order?.status ?? "pending");
  const [tracking, setTracking] = useState(order?.codigoRastreamento ?? "");
  const [saving, setSaving] = useState<"status" | "tracking" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  if (!order) return <AdminDialog open={false} onClose={onClose} title="" />;

  const isDelivery = order.tipoRetirada === "entrega";
  const canEditStatus = !readOnly && isDelivery;
  // O backend só aceita rastreio em entregas pagas ou já enviadas.
  const canEditTracking = !readOnly && isDelivery && (order.status === "paid" || order.status === "shipped");

  const save = async (kind: "status" | "tracking") => {
    setSaving(kind);
    setError(null);
    try {
      if (kind === "status") {
        await onUpdateStatus(order.idPedido, status);
        setSavedMessage(`Pedido #${order.idPedido} marcado como ${ORDER_STATUS_LABELS[status].toLocaleLowerCase("pt-BR")}`);
      } else {
        await onUpdateTracking(order.idPedido, tracking);
        setSavedMessage(`Rastreio do pedido #${order.idPedido} atualizado`);
      }
    } catch (saveError) {
      console.error(saveError);
      setError(
        kind === "status"
          ? "Não foi possível atualizar o status deste pedido."
          : "Não foi possível atualizar o rastreio deste pedido.",
      );
    } finally {
      setSaving(null);
    }
  };

  if (savedMessage) {
    return (
      <AdminDialog open onClose={onClose} title="Alterações salvas">
        <SavedConfirmation result={savedMessage} onConclude={onClose} />
      </AdminDialog>
    );
  }

  const items =
    order.items.length > 0
      ? order.items
          .map((item) => `${item.idVariante} · ${item.quantidade} ${item.quantidade === 1 ? "unidade" : "unidades"}`)
          .join("\n")
      : "Pedido sem itens retornados pela API";

  return (
    <AdminDialog
      open
      onClose={onClose}
      title={`Pedido #${order.idPedido}`}
      description="Revise os dados antes de continuar."
      actions={
        <>
          {error && (
            <p role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
              {error}
            </p>
          )}
          {canEditTracking && (
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              loading={saving === "tracking"}
              disabled={saving !== null || !tracking.trim()}
              onClick={() => void save("tracking")}
            >
              Atualizar rastreio
            </Button>
          )}
          {canEditStatus && (
            <Button
              variant="action"
              size="sm"
              className={adminButtonClassName}
              loading={saving === "status"}
              disabled={saving !== null || status === order.status}
              onClick={() => void save("status")}
            >
              Salvar alterações
            </Button>
          )}
          <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClose}>
            Cancelar
          </Button>
        </>
      }
    >
      <AdminField label="Cliente" value={describeCustomer(order)} />
      <AdminField label="Itens" value={<span className="whitespace-pre-line">{items}</span>} />
      <AdminField label="Total" value={formatCurrency(Number(order.valorTotal))} />
      <AdminField label="Modalidade" value={isDelivery ? "Entrega em casa" : "Retirada na loja"} />
      {canEditStatus ? (
        <AdminField label="Status do pedido" htmlFor="order-status">
          <select
            id="order-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ApiOrderStatus)}
            className={adminControlClassName}
          >
            {/* O status atual aparece mesmo quando não é editável (ex.: "Pago"). */}
            {[...new Set([order.status, ...EDITABLE_STATUSES])].map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </AdminField>
      ) : (
        <AdminField label="Status do pedido" value={ORDER_STATUS_LABELS[order.status]} />
      )}
      {canEditTracking ? (
        <AdminField label="Rastreio" htmlFor="order-tracking">
          <input
            id="order-tracking"
            value={tracking}
            onChange={(event) => setTracking(event.target.value)}
            placeholder="Código de rastreamento"
            className={adminControlClassName}
          />
        </AdminField>
      ) : (
        isDelivery && <AdminField label="Rastreio" value={order.codigoRastreamento || "Sem código de rastreio"} />
      )}
    </AdminDialog>
  );
}
