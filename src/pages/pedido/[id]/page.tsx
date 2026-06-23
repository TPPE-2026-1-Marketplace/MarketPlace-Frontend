import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Check, Clock, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type PaymentInfo = {
  status: string;
  amount?: number;
  paidAmount?: number | null;
};

const MAX_POLLS = 8;
const POLL_INTERVAL_MS = 3000;

/**
 * Tela de status do pagamento de um pedido. Usada principalmente como retorno
 * dos gateways hospedados (ex.: InfinitePay), que pagam de forma assíncrona via
 * webhook. Faz polling de GET /payments/order/:idPedido até resolver.
 *
 * O id vem da rota (/pedido/:idPedido) ou, no retorno do gateway sem id na URL,
 * do `dk_pending_order` salvo no checkout antes do redirect.
 */
export default function PedidoStatusPage() {
  const params = useParams();
  const navigate = useNavigate();
  const orderId = params.idPedido ?? localStorage.getItem("dk_pending_order") ?? null;

  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setError("Não foi possível identificar o pedido.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let tries = 0;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const info = await api.get<PaymentInfo>(`/payments/order/${orderId}`);
        if (cancelled) return;
        setPayment(info);
        setLoading(false);
        if (info.status === "paid") {
          localStorage.removeItem("dk_pending_order");
        } else if (info.status === "pending" && tries < MAX_POLLS) {
          tries += 1;
          timer = window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Não foi possível consultar o pagamento.",
        );
        setLoading(false);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderId]);

  const status = payment?.status;
  const isPaid = status === "paid";
  const isPending = status === "pending";
  const isFailed = status === "failed" || status === "cancelled";

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center font-sans">
      <div className="bg-white p-10 border border-gray-100 max-w-md w-full mx-4 text-center">
        {loading && (
          <>
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-gray-900 mb-2 font-serif text-2xl">Consultando pagamento…</h2>
            <p className="text-gray-500 text-sm">Aguarde um instante.</p>
          </>
        )}

        {!loading && error && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-gray-900 mb-2 font-serif text-2xl">Não foi possível verificar</h2>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
          </>
        )}

        {!loading && !error && isPaid && (
          <>
            <div className="w-20 h-20 bg-green-100 flex items-center justify-center mx-auto mb-4 rounded-full">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-gray-900 mb-2 font-serif text-2xl">Pagamento confirmado!</h2>
            <p className="text-gray-500 text-sm mb-2">
              O pedido #{orderId} foi pago com sucesso.
            </p>
            {payment?.paidAmount != null && (
              <p className="text-gray-900 font-medium mb-4">
                {formatCurrency(Number(payment.paidAmount))}
              </p>
            )}
          </>
        )}

        {!loading && !error && isPending && (
          <>
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-gray-900 mb-2 font-serif text-2xl">Aguardando confirmação</h2>
            <p className="text-gray-500 text-sm mb-6">
              Seu pedido #{orderId} foi registrado e o pagamento está sendo processado.
              Você pode acompanhar o status na sua conta.
            </p>
          </>
        )}

        {!loading && !error && isFailed && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-gray-900 mb-2 font-serif text-2xl">Pagamento não concluído</h2>
            <p className="text-gray-500 text-sm mb-6">
              O pagamento do pedido #{orderId} não foi confirmado. Você pode tentar novamente.
            </p>
          </>
        )}

        {!loading && (
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => navigate("/conta")}
              className="bt-principal w-full py-3 text-sm tracking-wide"
            >
              Ver meus pedidos
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full border border-gray-300 text-gray-700 py-3 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors text-sm"
            >
              Voltar à loja
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
