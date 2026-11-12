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

  if (!open || !order) return <AdminDialog open={false} onClose={onClose} title="" />;

  const handleSendCode = async () => {
    try {
      await onSendCode(order);
      setStep("step2");
      setCode("");
      setCodeError(null);
      setIsResent(false);
    } catch {
      setStep("step2");
    }
  };

  const handleResendCode = async () => {
    try {
      await onResendCode(order);
      setIsResent(true);
      setCode("");
      setCodeError(null);
      setStep("step2");
    } catch {
      setIsResent(true);
      setStep("step2");
    }
  };

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
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <Button
              variant="action"
              size="sm"
              className={`${adminButtonClassName} whitespace-nowrap`}
              onClick={handleSendCode}
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
          </div>
        }
      >
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
    const channelText = customerEmail
      ? `E-mail cadastrado da cliente (${customerEmail})`
      : "E-mail cadastrado da cliente";

    return (
      <AdminDialog
        open={open}
        onClose={onClose}
        title="2 · Validar código de retirada"
        description="Revise os dados antes de continuar."
        actions={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline-neutral"
                size="sm"
                className={adminButtonClassName}
                onClick={handleResendCode}
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
            </div>
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        }
      >
        {isResent && (
          <p className="mb-4 text-xs text-[var(--foreground)]">
            Novo código enviado para o e-mail cadastrado.
          </p>
        )}
        {codeError && (
          <p role="alert" className="mb-4 text-xs text-[var(--color-error-text)]">
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
            placeholder="000000"
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
        description="Revise os dados antes de continuar."
        actions={
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline-neutral"
                size="sm"
                className={adminButtonClassName}
                onClick={handleResendCode}
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
            </div>
            <Button
              variant="outline-neutral"
              size="sm"
              className={adminButtonClassName}
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
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
      description="Revise os dados antes de continuar."
      actions={
        <div className="flex w-full flex-wrap items-center justify-start gap-3">
          <Button
            variant="action"
            size="sm"
            className={adminButtonClassName}
            onClick={onClose}
          >
            Concluir
          </Button>
        </div>
      }
    >
      <AdminField label="Pedido" value={`#${order.idPedido}`} />
      <AdminField label="Validação" value="Código confirmado" />
      <AdminField label="Resultado" value="Produtos liberados para a cliente" />
    </AdminDialog>
  );
}
