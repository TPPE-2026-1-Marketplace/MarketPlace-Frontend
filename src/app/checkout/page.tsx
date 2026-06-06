"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MapPin, CreditCard, Smartphone, ArrowRight, CheckCircle2, Truck, Store } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { OrderService } from "@/services";
import { formatCurrency } from "@/lib/utils";
import type { OrderType } from "@/models";

type Step = "entrega" | "pagamento" | "confirmacao";
type PaymentMethod = "pix" | "credit_card" | "debit_card";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "PIX",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
};

export default function CheckoutPage() {
  const { cart, clear } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("entrega");
  const [orderType, setOrderType] = useState<OrderType>("entrega");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [isLoading, setIsLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [address, setAddress] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  });

  const formatCEP = (v: string) =>
    v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

  const handleSubmitOrder = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const order = await OrderService.createOrder({
        items: cart.items.map((item) => ({
          codigo_sku: item.variant.codigo_sku,
          quantidade: item.quantity,
        })),
        tipo_retirada: orderType,
        endereco:
          orderType === "entrega"
            ? {
                cep: address.cep.replace("-", ""),
                logradouro: address.logradouro,
                numero: address.numero,
                complemento: address.complemento || undefined,
                bairro: address.bairro,
                cidade: address.cidade,
                uf: address.uf,
              }
            : undefined,
      });
      setOrderId(order.id_pedido);
      clear();
      setStep("confirmacao");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao finalizar pedido. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if cart empty
  if (cart.items.length === 0 && step !== "confirmacao") {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="text-center animate-fade-in">
          <h1 className="text-2xl font-semibold text-white mb-3">
            Carrinho vazio
          </h1>
          <Link href="/produtos">
            <Button>Ver coleção</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Confirmation screen
  if (step === "confirmacao") {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="w-full max-w-lg px-4 text-center animate-scale-in">
          <div className="inline-flex w-20 h-20 rounded-full bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 items-center justify-center mb-6">
            <CheckCircle2 size={36} className="text-[var(--color-success)]" />
          </div>
          <h1 className="text-3xl font-light text-white mb-3">
            Pedido <span className="font-semibold text-gradient">confirmado!</span>
          </h1>
          <p className="text-[var(--foreground-muted)] mb-2">
            Obrigada pela sua compra. Seu pedido foi recebido com sucesso.
          </p>
          {orderId && (
            <p className="text-sm text-[var(--foreground-subtle)] mb-8">
              Número do pedido: <span className="font-mono text-white">#{orderId}</span>
            </p>
          )}
          <div className="space-y-3">
            <Link href="/produtos">
              <Button size="lg" fullWidth>
                Continuar comprando
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" fullWidth>
                Voltar ao início
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const steps: Step[] = ["entrega", "pagamento", "confirmacao"];
  const stepLabels: Record<Step, string> = {
    entrega: "Entrega",
    pagamento: "Pagamento",
    confirmacao: "Confirmação",
  };

  return (
    <div className="min-h-screen py-12 animate-fade-in">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-light text-white mb-6">
            Finalizar <span className="font-semibold text-gradient">pedido</span>
          </h1>

          {/* Step indicator */}
          <nav className="flex items-center gap-2">
            {steps.slice(0, 2).map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s
                        ? "bg-[var(--color-brand)] text-white"
                        : steps.indexOf(step) > steps.indexOf(s)
                        ? "bg-[var(--color-success)] text-white"
                        : "bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground-muted)]"
                    }`}
                  >
                    {steps.indexOf(step) > steps.indexOf(s) ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step === s
                        ? "text-white"
                        : "text-[var(--foreground-subtle)]"
                    }`}
                  >
                    {stepLabels[s]}
                  </span>
                </div>
                {i < 1 && (
                  <ChevronRight
                    size={16}
                    className="text-[var(--foreground-subtle)]"
                  />
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main form */}
          <div className="flex-1">
            {/* STEP 1: Delivery */}
            {step === "entrega" && (
              <div className="space-y-6 animate-fade-in">
                {/* Delivery type */}
                <div className="rounded-[var(--radius-xl)] bg-[var(--background-card)] border border-[var(--border)] p-6">
                  <h2 className="text-lg font-semibold text-white mb-5">
                    Tipo de entrega
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setOrderType("entrega")}
                      className={`flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border-2 text-left transition-all duration-[var(--transition-fast)] ${
                        orderType === "entrega"
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
                          : "border-[var(--border)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 ${orderType === "entrega" ? "bg-[var(--color-brand)]/20" : "bg-[var(--background-elevated)]"}`}>
                        <Truck size={20} className={orderType === "entrega" ? "text-[var(--color-brand)]" : "text-[var(--foreground-muted)]"} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Entrega em casa</p>
                        <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Enviamos para todo o Brasil</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setOrderType("loja")}
                      className={`flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border-2 text-left transition-all duration-[var(--transition-fast)] ${
                        orderType === "loja"
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
                          : "border-[var(--border)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 ${orderType === "loja" ? "bg-[var(--color-brand)]/20" : "bg-[var(--background-elevated)]"}`}>
                        <Store size={20} className={orderType === "loja" ? "text-[var(--color-brand)]" : "text-[var(--foreground-muted)]"} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Retirar na loja</p>
                        <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Taguatinga Sul — Brasília, DF</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Address form */}
                {orderType === "entrega" && (
                  <div className="rounded-[var(--radius-xl)] bg-[var(--background-card)] border border-[var(--border)] p-6">
                    <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                      <MapPin size={18} className="text-[var(--color-brand)]" />
                      Endereço de entrega
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.1em] mb-2">CEP</label>
                        <input
                          type="text"
                          placeholder="00000-000"
                          value={address.cep}
                          onChange={(e) => setAddress({ ...address, cep: formatCEP(e.target.value) })}
                          maxLength={9}
                          className="w-full sm:w-48 px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors font-mono"
                        />
                      </div>

                      {[
                        { id: "logradouro", label: "Logradouro", placeholder: "Rua, Av., etc.", colSpan: "sm:col-span-2" },
                        { id: "numero", label: "Número", placeholder: "123", colSpan: "" },
                        { id: "complemento", label: "Complemento", placeholder: "Apto, bloco (opcional)", colSpan: "" },
                        { id: "bairro", label: "Bairro", placeholder: "Seu bairro", colSpan: "" },
                        { id: "cidade", label: "Cidade", placeholder: "Sua cidade", colSpan: "" },
                        { id: "uf", label: "UF", placeholder: "DF", colSpan: "" },
                      ].map(({ id, label, placeholder, colSpan }) => (
                        <div key={id} className={colSpan}>
                          <label className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.1em] mb-2">
                            {label}
                          </label>
                          <input
                            type="text"
                            placeholder={placeholder}
                            value={(address as Record<string, string>)[id]}
                            onChange={(e) => setAddress({ ...address, [id]: e.target.value })}
                            className="w-full px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  size="lg"
                  fullWidth
                  onClick={() => setStep("pagamento")}
                >
                  Continuar para pagamento
                  <ArrowRight size={18} />
                </Button>
              </div>
            )}

            {/* STEP 2: Payment */}
            {step === "pagamento" && (
              <div className="space-y-6 animate-fade-in">
                <div className="rounded-[var(--radius-xl)] bg-[var(--background-card)] border border-[var(--border)] p-6">
                  <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                    <CreditCard size={18} className="text-[var(--color-brand)]" />
                    Forma de pagamento
                  </h2>

                  <div className="space-y-3">
                    {(["pix", "credit_card", "debit_card"] as PaymentMethod[]).map(
                      (method) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={`w-full flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border-2 text-left transition-all duration-[var(--transition-fast)] ${
                            paymentMethod === method
                              ? "border-[var(--color-brand)] bg-[var(--color-brand)]/5"
                              : "border-[var(--border)] hover:border-[var(--border-hover)]"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0 ${paymentMethod === method ? "bg-[var(--color-brand)]/20" : "bg-[var(--background-elevated)]"}`}>
                            {method === "pix" ? (
                              <Smartphone size={20} className={paymentMethod === method ? "text-[var(--color-brand)]" : "text-[var(--foreground-muted)]"} />
                            ) : (
                              <CreditCard size={20} className={paymentMethod === method ? "text-[var(--color-brand)]" : "text-[var(--foreground-muted)]"} />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {PAYMENT_LABELS[method]}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                              {method === "pix" && "Aprovação imediata · 5% de desconto"}
                              {method === "credit_card" && "Parcelamento em até 12x sem juros"}
                              {method === "debit_card" && "Débito à vista"}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method ? "border-[var(--color-brand)]" : "border-[var(--border)]"}`}>
                            {paymentMethod === method && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-brand)]" />
                            )}
                          </div>
                        </button>
                      )
                    )}
                  </div>

                  {paymentMethod === "pix" && (
                    <div className="mt-4 p-4 rounded-[var(--radius-md)] bg-[var(--color-success)]/5 border border-[var(--color-success)]/20">
                      <p className="text-sm text-[var(--color-success)]">
                        ✓ Pagamento via PIX — chave gerada após confirmação do pedido.
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
                    {error}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setStep("entrega")}
                  >
                    Voltar
                  </Button>
                  <Button
                    size="lg"
                    fullWidth
                    onClick={handleSubmitOrder}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processando..." : (
                      <>
                        Confirmar pedido
                        <ArrowRight size={18} />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:w-80 shrink-0">
            <div className="sticky top-[calc(var(--header-height)+2rem)] rounded-[var(--radius-xl)] bg-[var(--background-card)] border border-[var(--border)] p-6">
              <h2 className="text-base font-semibold text-white mb-5">
                Resumo ({cart.items.length} {cart.items.length === 1 ? "item" : "itens"})
              </h2>

              {/* Items preview */}
              <div className="space-y-3 mb-5">
                {cart.items.map((item) => (
                  <div key={item.variant.codigo_sku} className="flex gap-3">
                    <div className="relative w-14 aspect-[3/4] rounded-[var(--radius-sm)] overflow-hidden shrink-0">
                      <Image
                        src={item.imageUrl ?? "/hero-dress.png"}
                        alt={item.product.titulo}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white line-clamp-2">
                        {item.product.titulo}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                        {[item.variant.cor, item.variant.tamanho]
                          .filter(Boolean)
                          .join(" · ")} · Qtd: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-white mt-1">
                        {formatCurrency(item.variant.preco_variante * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-[var(--border)] mb-4" />

              <dl className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <dt className="text-[var(--foreground-muted)]">Subtotal</dt>
                  <dd className="text-[var(--foreground-secondary)]">{formatCurrency(cart.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-[var(--foreground-muted)]">Frete</dt>
                  <dd className="text-[var(--color-success)]">A calcular</dd>
                </div>
              </dl>

              <hr className="border-[var(--border)] mb-4" />

              <div className="flex justify-between">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-white">
                  {formatCurrency(cart.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
