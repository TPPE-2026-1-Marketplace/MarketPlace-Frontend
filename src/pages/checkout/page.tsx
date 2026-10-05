import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import OrderSummary from "@/components/cart/OrderSummary";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import ContactSection from "@/components/checkout/ContactSection";
import DeliverySection from "@/components/checkout/DeliverySection";
import PaymentSection from "@/components/checkout/PaymentSection";
import { checkoutFieldId } from "@/components/checkout/fieldProps";
import Button from "@/components/ui/Button";
import { useCart } from "@/hooks/useCart";
import { getFirstInvalidField, MAX_INSTALLMENTS, useCheckout } from "@/hooks/useCheckout";
import { formatCurrency } from "@/lib/utils";

export default function CheckoutPage() {
  const { cart } = useCart();
  const navigate = useNavigate();
  const checkout = useCheckout();
  const { summary, completed } = checkout;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sem itens não há checkout. Depois do envio o carrinho esvazia de propósito.
  useEffect(() => {
    if (cart.items.length === 0 && !completed) navigate("/carrinho", { replace: true });
  }, [cart.items.length, completed, navigate]);

  if (cart.items.length === 0 && !completed) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors = await checkout.submit();
    const firstInvalid = getFirstInvalidField(errors);
    if (firstInvalid) document.getElementById(checkoutFieldId(firstInvalid))?.focus();
  };

  const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const fields = { form: checkout.form, errors: checkout.errors, setField: checkout.setField };

  return (
    <div className="bg-[var(--background)]">
      <div className="mx-auto max-w-[1440px] px-3.5 pt-6 pb-10 lg:px-20 lg:pt-8 lg:pb-[60px]">
        <h1 className="font-serif text-[32px] leading-[38px] font-normal text-[var(--foreground)] lg:text-[40px] lg:leading-[48px]">
          Finalizar compra
        </h1>
        <CheckoutStepper
          className="mt-5 lg:mt-[26px] lg:w-[820px]"
          current={checkout.currentStep}
          onStepClick={scrollToSection}
        />

        <form
          noValidate
          onSubmit={handleSubmit}
          className="mt-5 flex flex-col gap-5 lg:mt-[26px] lg:grid lg:grid-cols-[minmax(0,820px)_400px] lg:items-start lg:gap-10"
        >
          <div className="flex flex-col gap-5 lg:gap-[18px]">
            <ContactSection {...fields} />
            <DeliverySection
              {...fields}
              delivery={checkout.delivery}
              onDeliveryChange={checkout.setDelivery}
              quote={checkout.shipping.quote}
              quoteLoading={checkout.shipping.loading}
              addressError={checkout.addressError}
            />
            <PaymentSection
              method={checkout.paymentMethod}
              onMethodChange={checkout.setPaymentMethod}
              installments={checkout.installments}
              onInstallmentsChange={checkout.setInstallments}
              total={summary.total}
            />
          </div>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-44 lg:gap-3.5">
            <OrderSummary
              itemCount={summary.itemCount}
              subtotal={summary.subtotal}
              frete={summary.frete}
              freteLoading={checkout.delivery === "entrega" && checkout.shipping.loading}
              desconto={summary.desconto}
              total={summary.total}
              note={`ou ${MAX_INSTALLMENTS}x de ${formatCurrency(summary.total / MAX_INSTALLMENTS)} sem juros`}
            />

            {checkout.submitError && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--background-error-subtle)] p-3 text-sm leading-5 text-[var(--color-error-text)]"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                {checkout.submitError}
              </p>
            )}

            <Button
              type="submit"
              variant="action"
              size="touch"
              fullWidth
              loading={checkout.submitting || checkout.completed}
              disabled={checkout.delivery === "entrega" && checkout.shipping.loading}
            >
              {checkout.submitting || checkout.completed ? "Carregando..." : "Finalizar pedido"}
            </Button>
            <p className="text-center text-xs leading-4 text-[var(--foreground-muted)] lg:text-left lg:leading-[18px]">
              <span className="lg:hidden">Compra segura • troca facilitada</span>
              <span className="hidden lg:inline">Ao finalizar, você concorda com os termos e políticas.</span>
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
