import { Link } from "react-router-dom";
import OrderSummary from "@/components/cart/OrderSummary";
import { buttonClassName } from "@/components/ui/button-variants";
import { formatCurrency } from "@/lib/utils";
import type { OrderSnapshot } from "@/types/checkout";

interface OrderConfirmationProps {
  /** Resumo salvo antes do redirect; sem ele, a tela mostra só a confirmação. */
  snapshot: OrderSnapshot | null;
  orderId: string | null;
}

function paymentNote(snapshot: OrderSnapshot): string {
  if (snapshot.metodoPagamento === "pix") return "Pagamento via PIX";
  return `${snapshot.parcelas}x de ${formatCurrency(snapshot.total / snapshot.parcelas)} sem juros no cartão`;
}

/** "Confirmação de pedido" do Figma: confirma o recebimento, não a aprovação do pagamento. */
export default function OrderConfirmation({ snapshot, orderId }: OrderConfirmationProps) {
  const firstName = snapshot?.nome.split(/\s+/)[0];
  const orderLabel = orderId ? ` #${orderId}` : "";

  return (
    <div className="flex w-full flex-col items-center gap-6 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--background-card)] p-6 lg:p-10">
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <p className="text-xs leading-4 font-medium tracking-[2px] text-[var(--color-brand)]">PEDIDO RECEBIDO</p>
        <h1 className="font-serif text-[32px] leading-[38px] font-normal text-[var(--foreground)]">
          Obrigada pela sua compra!
        </h1>
        <p className="text-sm leading-[22px] text-[var(--foreground-secondary)]">
          {firstName ? `${firstName}, seu pedido${orderLabel} foi registrado.` : `Seu pedido${orderLabel} foi registrado.`}
          <br />
          Acompanhe a confirmação do pagamento e as próximas atualizações pelo e-mail informado.
        </p>
      </div>

      {snapshot && (
        <OrderSummary
          className="w-full"
          itemCount={snapshot.itemCount}
          subtotal={snapshot.subtotal}
          frete={snapshot.frete}
          desconto={snapshot.desconto}
          total={snapshot.total}
          note={paymentNote(snapshot)}
        />
      )}

      <div className="flex w-full flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--background-secondary)] p-4 text-sm">
        <p className="leading-5 font-medium text-[var(--foreground)]">E agora?</p>
        <p className="leading-[22px] text-[var(--foreground-secondary)]">
          Assim que o pagamento for confirmado, iniciaremos a preparação do seu pedido. Você receberá as orientações de
          entrega ou retirada por e-mail.
        </p>
      </div>

      <Link to="/" className={buttonClassName({ variant: "action", size: "touch", fullWidth: true })}>
        Continuar comprando
      </Link>

      <p className="text-center text-xs leading-[18px] text-[var(--foreground-muted)]">
        DK Fashion • Feito para os seus momentos especiais
      </p>
    </div>
  );
}
