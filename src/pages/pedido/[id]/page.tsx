import { useEffect } from "react";
import { useParams } from "react-router-dom";
import OrderConfirmation from "@/components/checkout/OrderConfirmation";
import { readPendingOrderId, useOrderSnapshot } from "@/hooks/useOrderSnapshot";

/**
 * Tela "Finalizado": retorno do checkout hospedado (InfinitePay redireciona
 * para /pedido/:idPedido). Confirma o recebimento do pedido com o resumo salvo
 * no navegador antes do redirect; a aprovação do pagamento chega por e-mail.
 */
export default function PedidoConfirmacaoPage() {
  const params = useParams();
  const orderId = params.idPedido ?? readPendingOrderId();
  const snapshot = useOrderSnapshot(orderId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[var(--background)] px-4 py-4 lg:px-20 lg:py-12">
      <div className="mx-auto w-full max-w-[800px]">
        <OrderConfirmation snapshot={snapshot} orderId={orderId} />
      </div>
    </div>
  );
}
