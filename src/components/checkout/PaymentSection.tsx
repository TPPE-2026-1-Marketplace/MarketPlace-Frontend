import { ChevronDown } from "lucide-react";
import { buildInstallmentOptions, MAX_INSTALLMENTS } from "@/hooks/useCheckout";
import type { PaymentMethod } from "@/types/checkout";
import CheckoutSection from "./CheckoutSection";
import { OptionCard, OptionGroup } from "./OptionCard";
import { checkoutFieldId } from "./fieldProps";

interface PaymentSectionProps {
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  installments: number;
  onInstallmentsChange: (installments: number) => void;
  total: number;
}

/**
 * Pagamento: o cartão é digitado no checkout hospedado (InfinitePay), então aqui
 * só escolhemos o método e as parcelas. Boleto aparece desabilitado (sem suporte no backend).
 */
export default function PaymentSection({
  method,
  onMethodChange,
  installments,
  onInstallmentsChange,
  total,
}: PaymentSectionProps) {
  const installmentsId = checkoutFieldId("parcelas");

  return (
    <CheckoutSection
      id="pagamento"
      title="Pagamento"
      subtitle="Ambiente seguro e dados protegidos."
      mobileSubtitle="Dados protegidos."
      className="rounded-[var(--radius-xl)]"
    >
      <OptionGroup
        value={method}
        onValueChange={(value) => onMethodChange(value as PaymentMethod)}
        aria-label="Forma de pagamento"
        className="gap-2.5 sm:grid-cols-3 lg:grid-cols-[230px_190px_190px]"
      >
        <OptionCard
          value="credit_card"
          label="Cartão de crédito"
          description={method === "credit_card" ? "Selecionado" : `Até ${MAX_INSTALLMENTS}x sem juros`}
        />
        <OptionCard value="pix" label="PIX" description="Aprovação imediata" />
        <OptionCard value="boleto" label="Boleto" description="Em breve" disabled />
      </OptionGroup>

      {method === "credit_card" && (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={installmentsId} className="text-sm leading-5 font-medium text-[var(--foreground)]">
              Parcelas
            </label>
            <div className="relative">
              <select
                id={installmentsId}
                name="parcelas"
                value={installments}
                onChange={(event) => onInstallmentsChange(Number(event.target.value))}
                className="h-10 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--border-control)] bg-[var(--background-card)] px-3 pr-10 text-sm leading-[22px] text-[var(--foreground)] focus:outline-none focus-visible:border-[var(--color-brand)] focus-visible:ring-2 focus-visible:ring-[var(--border-accent)]"
              >
                {buildInstallmentOptions(total).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                strokeWidth={1.5}
                className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-[var(--foreground-muted)]"
              />
            </div>
          </div>
          <p className="text-sm leading-[22px] text-[var(--foreground-muted)]">
            Os dados do cartão são informados no ambiente seguro de pagamento, logo após finalizar a compra.
          </p>
        </>
      )}

      {method === "pix" && (
        <p className="text-sm leading-[22px] text-[var(--foreground-muted)]">
          Será gerado um QR com validade durante 10 minutos após a finalização da compra.
        </p>
      )}
    </CheckoutSection>
  );
}
