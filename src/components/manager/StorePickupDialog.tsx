import { useState } from "react";
import Button from "@/components/ui/Button";
import {
  ORDER_STATUS_LABELS,
  orderCustomerName,
  type ApiOrder,
} from "@/lib/management";
import { formatCurrency } from "@/lib/utils";
import AdminDialog from "./AdminDialog";
import AdminField from "./AdminField";
import { adminButtonClassName, adminControlClassName } from "./adminClasses";

type PickupStep = "step1" | "step2" | "invalid" | "completed";

interface StorePickupDialogProps {
  open: boolean;
  order: ApiOrder | null;
  customerEmail: string | null;
  onClose: () => void;
  /** Envia o código por e-mail e devolve o destino mascarado; lança Error com a mensagem em falha. */
  onSendCode: (order: ApiOrder) => Promise<string>;
  onResendCode: (order: ApiOrder) => Promise<string>;
  onValidateCode: (
    order: ApiOrder,
    pin: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

export default function StorePickupDialog(props: StorePickupDialogProps) {
  return (
    <StorePickupDialogContent
      key={`${props.open}-${props.order?.idPedido ?? "none"}`}
      {...props}
    />
  );
}

function formatOrderItems(order: ApiOrder): string {
  if (!order.items || order.items.length === 0) {
    return "Pedido sem itens retornados pela API";
  }
  return order.items
    .map(
      (item) =>
        `${item.idVariante} · ${item.quantidade} ${
          item.quantidade === 1 ? "unidade" : "unidades"
        }`,
    )
    .join(", ");
}

function StorePickupDialogContent({
  open,
  order,
  customerEmail,
  onClose,
  onSendCode,
  onResendCode,
  onValidateCode,
}: StorePickupDialogProps) {
  const [step, setStep] = useState<PickupStep>("step1");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isResent, setIsResent] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  if (!open || !order) return <AdminDialog open={false} onClose={onClose} title="" />;

  // Envio e reenvio usam o mesmo código do pedido; só muda o aviso exibido.
  const deliverCode = async (send: (order: ApiOrder) => Promise<string>, resent: boolean) => {
    setIsSending(true);
    setSendError(null);
    try {
      setSentTo(await send(order));
      setIsResent(resent);
      setCode("");
      setCodeError(null);
      setStep("step2");
    } catch (err) {
      setIsResent(false);
      setSendError(err instanceof Error ? err.message : "Não foi possível enviar o código.");
      // Falha no reenvio volta para a validação, onde o erro aparece; no primeiro envio fica no Passo 1.
      if (resent) setStep("step2");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendCode = () => deliverCode(onSendCode, false);
  const handleResendCode = () => deliverCode(onResendCode, true);

  const handleValidate = async () => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setCodeError("O código 2FA deve conter exatamente 6 dígitos.");
      return;
    }

    setIsValidating(true);
    setCodeError(null);
    try {
      const res = await onValidateCode(order, trimmed);
      if (res.success) {
        setStep("completed");
      } else if (res.error && res.error !== "invalid_code") {
        setCodeError(res.error);
      } else {
        setStep("invalid");
      }
    } catch {
      setStep("invalid");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRetry = () => {
    setSendError(null);
    setCode("");
    setCodeError(null);
    setIsResent(false);
    setStep("step2");
  };

  // 1. Passo 1 · Conferir pedido (755:4832 / 755:5000)
  if (step === "step1") {
    const paymentStatus =
      order.status === "paid" || order.status === "delivered"
        ? "Confirmado"
        : ORDER_STATUS_LABELS[order.status] ?? order.status;

    return (
      <AdminDialog
        open={open}
        onClose={onClose}
        title={`1 · Conferir pedido #${order.idPedido}`}
        description="Revise os dados antes de continuar."
        actions={
          <>
            <Button
              variant="action"
              size="sm"
              className={`${adminButtonClassName} whitespace-nowrap`}
              onClick={handleSendCode}
              disabled={isSending}
            >
              Enviar código 2FA
            </Button>
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              onClick={onClose}
            >
              Cancelar
            </Button>
          </>
        }
      >
        {sendError && (
          <p role="alert" className="text-xs text-[var(--color-error-text)]">
            {sendError}
          </p>
        )}
        <AdminField label="Cliente" value={orderCustomerName(order)} />
        <AdminField label="Pedido" value={`#${order.idPedido}`} />
        <AdminField label="Itens" value={formatOrderItems(order)} />
        <AdminField label="Pagamento" value={paymentStatus} />
        <AdminField label="Total" value={formatCurrency(Number(order.valorTotal))} />
      </AdminDialog>
    );
  }

  // 2. Passo 2 · Validar código de retirada (755:5622 / 755:5656)
  if (step === "step2") {
    // O backend devolve o destino mascarado; sem ele, o e-mail conhecido pelo painel.
    const destination = sentTo ?? customerEmail;
    const channelText = destination
      ? `E-mail cadastrado da cliente (${destination})`
      : "E-mail cadastrado da cliente";

    return (
      <AdminDialog
        open={open}
        onClose={onClose}
        title="2 · Validar código de retirada"
        actions={
          <>
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              onClick={handleResendCode}
              disabled={isSending}
            >
              Reenviar código
            </Button>
            <Button
              variant="action"
              size="sm"
              className={`${adminButtonClassName} whitespace-nowrap`}
              onClick={handleValidate}
              disabled={isValidating}
            >
              Validar e confirmar retirada
            </Button>
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              onClick={onClose}
            >
              Cancelar
            </Button>
          </>
        }
      >
        {isResent && (
          <p className="text-xs text-[var(--foreground)]">
            Código reenviado para o e-mail cadastrado.
          </p>
        )}
        {sendError && (
          <p role="alert" className="text-xs text-[var(--color-error-text)]">
            {sendError}
          </p>
        )}
        {codeError && (
          <p role="alert" className="text-xs text-[var(--color-error-text)]">
            {codeError}
          </p>
        )}

        <AdminField
          label="Pedido"
          value={`#${order.idPedido} · ${orderCustomerName(order)}`}
        />
        <AdminField label="Código enviado" value={channelText} />
        <AdminField label="Código 2FA *" htmlFor="pickup-2fa-code">
          <input
            id="pickup-2fa-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => {
              const onlyNums = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(onlyNums);
              setCodeError(null);
            }}
            className={adminControlClassName}
            aria-invalid={Boolean(codeError)}
          />
        </AdminField>
      </AdminDialog>
    );
  }

  // 3. Estado Código inválido (755:5690 / 755:5717)
  if (step === "invalid") {
    return (
      <AdminDialog
        open={open}
        onClose={onClose}
        title="Código inválido"
        actions={
          <>
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              onClick={handleResendCode}
              disabled={isSending}
            >
              Reenviar código
            </Button>
            <Button
              variant="action"
              size="sm"
              className={adminButtonClassName}
              onClick={handleRetry}
            >
              Tentar novamente
            </Button>
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              onClick={onClose}
            >
              Cancelar
            </Button>
          </>
        }
      >
        <AdminField label="Validação" value="O código informado não confere" />
        <AdminField label="Código 2FA *" value="Informe os 6 dígitos novamente" />
      </AdminDialog>
    );
  }

  // 4. Confirmação: Retirada concluída (755:4878 / 755:5046)
  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title="Retirada concluída"
      actions={
        <Button
          variant="action"
          size="sm"
          className={adminButtonClassName}
          onClick={onClose}
        >
          Concluir
        </Button>
      }
    >
      <AdminField label="Pedido" value={`#${order.idPedido}`} />
      <AdminField label="Validação" value="Código confirmado" />
      <AdminField label="Resultado" value="Produtos liberados para a cliente" />
    </AdminDialog>
  );
}
