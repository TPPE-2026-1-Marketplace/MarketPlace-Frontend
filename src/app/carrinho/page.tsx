"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Tag, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";

export default function CarrinhoPage() {
  const { cart, updateQuantity, removeItem, clear } = useCart();
  const [couponCode, setCouponCode] = React.useState("");
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = React.useState<string | null>(null);

  const handleApplyCoupon = () => {
    // Coupon validation to be integrated with backend
    if (!couponCode.trim()) {
      setCouponError("Digite um código de cupom.");
      return;
    }
    setCouponError("Cupom inválido ou expirado.");
    setCouponSuccess(null);
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="text-center animate-fade-in">
          <div className="inline-flex w-24 h-24 rounded-full bg-[var(--background-card)] border border-[var(--border)] items-center justify-center mb-6">
            <ShoppingBag size={40} className="text-[var(--foreground-subtle)]" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-3">
            Carrinho vazio
          </h1>
          <p className="text-[var(--foreground-muted)] mb-8 max-w-sm mx-auto">
            Você ainda não adicionou nenhum produto. Explore nossa coleção e
            encontre o vestido perfeito.
          </p>
          <Link href="/produtos">
            <Button size="lg">
              Ver coleção
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-light text-white">
              Meu{" "}
              <span className="font-semibold text-gradient">Carrinho</span>
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              {cart.items.length} {cart.items.length === 1 ? "item" : "itens"}
            </p>
          </div>
          <button
            onClick={clear}
            className="text-sm text-[var(--foreground-subtle)] hover:text-[var(--color-error)] transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            Limpar tudo
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart items */}
          <div className="flex-1 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.variant.codigo_sku}
                className="flex gap-4 p-4 sm:p-5 rounded-[var(--radius-lg)] bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-[var(--transition-fast)] animate-scale-in"
              >
                {/* Image */}
                <Link
                  href={`/produtos/${item.product.id_produto}`}
                  className="relative w-24 sm:w-32 aspect-[3/4] rounded-[var(--radius-md)] overflow-hidden shrink-0 hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={item.imageUrl ?? "/hero-dress.png"}
                    alt={item.product.titulo}
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/produtos/${item.product.id_produto}`}
                      className="text-base font-medium text-white hover:text-[var(--color-brand-light)] transition-colors line-clamp-2"
                    >
                      {item.product.titulo}
                    </Link>
                    <button
                      onClick={() => removeItem(item.variant.codigo_sku)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[var(--foreground-subtle)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-all duration-[var(--transition-fast)]"
                      aria-label="Remover item"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Variant details */}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {item.variant.cor && (
                      <span className="text-xs text-[var(--foreground-muted)] bg-[var(--background-elevated)] px-2.5 py-1 rounded-[var(--radius-full)]">
                        Cor: {item.variant.cor}
                      </span>
                    )}
                    {item.variant.tamanho && (
                      <span className="text-xs text-[var(--foreground-muted)] bg-[var(--background-elevated)] px-2.5 py-1 rounded-[var(--radius-full)]">
                        Tam: {item.variant.tamanho}
                      </span>
                    )}
                    <span className="text-xs text-[var(--foreground-subtle)] font-mono">
                      SKU: {item.variant.codigo_sku}
                    </span>
                  </div>

                  {/* Price & quantity */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.variant.codigo_sku,
                            item.quantity - 1
                          )
                        }
                        className="w-9 h-9 flex items-center justify-center text-[var(--foreground-muted)] hover:text-white hover:bg-white/5 transition-all"
                        aria-label="Diminuir"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.variant.codigo_sku,
                            item.quantity + 1
                          )
                        }
                        className="w-9 h-9 flex items-center justify-center text-[var(--foreground-muted)] hover:text-white hover:bg-white/5 transition-all"
                        aria-label="Aumentar"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {formatCurrency(item.variant.preco_variante * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-[var(--foreground-subtle)]">
                          {formatCurrency(item.variant.preco_variante)} cada
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Link
              href="/produtos"
              className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--color-brand-light)] transition-colors mt-2"
            >
              ← Continuar comprando
            </Link>
          </div>

          {/* Order summary */}
          <div className="lg:w-96 shrink-0">
            <div className="sticky top-[calc(var(--header-height)+2rem)] rounded-[var(--radius-xl)] bg-[var(--background-card)] border border-[var(--border)] p-6">
              <h2 className="text-lg font-semibold text-white mb-6">
                Resumo do pedido
              </h2>

              {/* Coupon */}
              <div className="mb-6">
                <label htmlFor="coupon" className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.1em] mb-2">
                  Cupom de desconto
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                    <input
                      id="coupon"
                      type="text"
                      placeholder="CODIGO"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      className="w-full pl-9 pr-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors font-mono tracking-wider"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleApplyCoupon}
                  >
                    Aplicar
                  </Button>
                </div>
                {couponError && (
                  <p className="text-xs text-[var(--color-error)] mt-1.5">
                    {couponError}
                  </p>
                )}
                {couponSuccess && (
                  <p className="text-xs text-[var(--color-success)] mt-1.5">
                    {couponSuccess}
                  </p>
                )}
              </div>

              <hr className="border-[var(--border)] mb-5" />

              {/* Totals */}
              <dl className="space-y-3 mb-5">
                <div className="flex justify-between text-sm">
                  <dt className="text-[var(--foreground-muted)]">Subtotal</dt>
                  <dd className="text-[var(--foreground-secondary)]">
                    {formatCurrency(cart.subtotal)}
                  </dd>
                </div>
                {cart.desconto > 0 && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-[var(--color-success)]">Desconto</dt>
                    <dd className="text-[var(--color-success)]">
                      -{formatCurrency(cart.desconto)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <dt className="text-[var(--foreground-muted)]">Frete</dt>
                  <dd className="text-[var(--foreground-secondary)]">
                    {cart.frete === 0 ? (
                      <span className="text-[var(--color-success)]">Grátis</span>
                    ) : (
                      formatCurrency(cart.frete)
                    )}
                  </dd>
                </div>
              </dl>

              <hr className="border-[var(--border)] mb-5" />

              <div className="flex justify-between items-center mb-6">
                <span className="text-base font-semibold text-white">Total</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(cart.total)}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    ou 12x de {formatCurrency(cart.total / 12)} sem juros
                  </p>
                </div>
              </div>

              <Link href="/checkout">
                <Button size="lg" fullWidth>
                  Finalizar pedido
                  <ArrowRight size={18} />
                </Button>
              </Link>

              {/* Trust badges */}
              <div className="mt-5 space-y-2">
                {[
                  "🔒 Pagamento 100% seguro",
                  "📦 Envio rastreado para todo Brasil",
                  "✨ Frete grátis no Distrito Federal",
                ].map((text) => (
                  <p key={text} className="text-xs text-[var(--foreground-subtle)] text-center">
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
