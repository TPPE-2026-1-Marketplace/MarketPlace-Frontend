import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import CartLineItem from "@/components/cart/CartLineItem";
import CouponField from "@/components/cart/CouponField";
import OrderSummary from "@/components/cart/OrderSummary";
import RemoveItemDialog from "@/components/cart/RemoveItemDialog";
import ShippingEstimate from "@/components/cart/ShippingEstimate";
import Button from "@/components/ui/Button";
import { buttonClassName } from "@/components/ui/button-variants";
import EmptyState from "@/components/ui/EmptyState";
import { useCart } from "@/hooks/useCart";
import { formatCurrency, formatItemCount } from "@/lib/utils";

export default function CarrinhoPage() {
  const { cart, itemCount, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (cart.items.length === 0) {
    return (
      <div className="bg-[var(--background)] px-4 py-12 lg:py-20" data-testid="cart-page">
        <h1 className="sr-only">Seu carrinho</h1>
        <EmptyState
          icon={<ShoppingBag className="size-6" strokeWidth={1.5} />}
          title="Seu carrinho está vazio"
          body="Encontre um vestido para o seu próximo momento. Seus favoritos continuam salvos."
          action={
            <Link to="/produtos" className={buttonClassName({ variant: "action", size: "touch" })}>
              Explorar vestidos
            </Link>
          }
        />
      </div>
    );
  }

  const hasShipping = Boolean(cart.cep);
  const goToCheckout = () => navigate("/checkout");

  const confirmRemoval = () => {
    if (pendingRemoval) removeItem(pendingRemoval);
    setPendingRemoval(null);
  };

  return (
    <div className="bg-[var(--background)]" data-testid="cart-page">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 lg:px-20 lg:py-12">
        <h1 className="font-serif text-[32px] leading-[38px] font-normal text-[var(--foreground)] lg:text-[40px] lg:leading-[48px]">
          Seu carrinho
        </h1>
        <p className="text-sm leading-[22px] text-[var(--foreground-muted)]">
          {formatItemCount(itemCount)} · Confira tamanho e cor
        </p>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,820px)_400px] lg:items-start lg:gap-10">
          <section
            aria-label="Itens do carrinho"
            className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] p-3.5 lg:gap-[22px] lg:p-6"
          >
            {cart.items.map((item, index) => (
              <React.Fragment key={item.variant.codigoSku}>
                {index > 0 && <div className="h-px bg-[var(--border)]" />}
                <CartLineItem
                  item={item}
                  onIncrease={() => updateQuantity(item.variant.codigoSku, item.quantity + 1)}
                  onDecrease={() =>
                    item.quantity > 1
                      ? updateQuantity(item.variant.codigoSku, item.quantity - 1)
                      : setPendingRemoval(item.variant.codigoSku)
                  }
                  onRemove={() => setPendingRemoval(item.variant.codigoSku)}
                />
              </React.Fragment>
            ))}
            <ShippingEstimate variant="box" className="hidden lg:block" />
          </section>

          <ShippingEstimate variant="button" className="lg:hidden" />

          <div className="flex flex-col gap-6 lg:gap-4">
            <OrderSummary
              variant="cart"
              className="order-2 lg:order-1"
              itemCount={itemCount}
              subtotal={cart.subtotal}
              frete={hasShipping ? (cart.frete ?? 0) : null}
              desconto={cart.desconto}
              total={cart.total}
              note={hasShipping ? "Frete incluído no total" : "Informe o CEP para incluir o frete"}
            >
              <Button variant="action" size="touch" fullWidth onClick={goToCheckout}>
                Finalizar a compra
              </Button>
            </OrderSummary>
            <CouponField className="order-1 lg:order-2" />
          </div>
        </div>

        <Link to="/produtos" className={buttonClassName({ variant: "outline-neutral", size: "touch", fullWidth: true })}>
          Continuar explorando
        </Link>
      </div>

      {/* Barra de compra persistente (só mobile) */}
      <div className="sticky bottom-0 z-10 flex flex-col gap-2 bg-[var(--background-card)] px-4 pt-3 pb-6 lg:hidden">
        <p className="text-base font-semibold text-black">
          Total&nbsp;&nbsp;{formatCurrency(cart.total)}
        </p>
        <Button variant="action" size="touch" fullWidth onClick={goToCheckout}>
          Finalizar a compra
        </Button>
      </div>

      <RemoveItemDialog
        open={pendingRemoval !== null}
        isLastItem={cart.items.length === 1}
        onKeep={() => setPendingRemoval(null)}
        onConfirm={confirmRemoval}
      />
    </div>
  );
}
