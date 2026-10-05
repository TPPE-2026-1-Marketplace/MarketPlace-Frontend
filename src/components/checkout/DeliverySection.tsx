import Input from "@/components/ui/Input";
import { formatCurrency, maskCep } from "@/lib/utils";
import type { DeliveryMethod, ShippingQuote } from "@/types/checkout";
import CheckoutSection from "./CheckoutSection";
import { OptionCard, OptionGroup } from "./OptionCard";
import { checkoutFieldProps, type CheckoutFieldsState } from "./fieldProps";

interface DeliverySectionProps extends CheckoutFieldsState {
  delivery: DeliveryMethod;
  onDeliveryChange: (delivery: DeliveryMethod) => void;
  quote: ShippingQuote | null;
  quoteLoading: boolean;
  addressError: string | null;
}

function describeStandardDelivery(quote: ShippingQuote | null, loading: boolean): string {
  if (loading) return "Calculando frete…";
  if (!quote) return "Informe o CEP para calcular";
  const prazo = `${quote.prazo_dias} ${quote.prazo_dias === 1 ? "dia útil" : "dias úteis"}`;
  return `${prazo} • ${quote.valor === 0 ? "grátis" : formatCurrency(quote.valor)}`;
}

export default function DeliverySection({
  delivery,
  onDeliveryChange,
  quote,
  quoteLoading,
  addressError,
  ...state
}: DeliverySectionProps) {
  return (
    <CheckoutSection
      id="entrega"
      title="Entrega"
      subtitle="Receba em casa ou retire na loja."
      mobileSubtitle="Escolha como receber."
      className="rounded-[var(--radius-xl)]"
    >
      <OptionGroup
        value={delivery}
        onValueChange={(value) => onDeliveryChange(value as DeliveryMethod)}
        aria-label="Forma de entrega"
        className="sm:grid-cols-2 lg:grid-cols-[repeat(2,368px)]"
      >
        <OptionCard
          value="entrega"
          label="Entrega padrão"
          description={describeStandardDelivery(quote, quoteLoading)}
        />
        <OptionCard value="loja" label="Retirar na loja" description="A partir de amanhã • grátis" />
      </OptionGroup>

      {delivery === "loja" ? (
        <p className="text-sm leading-[22px] text-[var(--foreground-muted)]">
          Retire na loja a partir de amanhã, sem custo de frete.
        </p>
      ) : (
        <>
          <div className="grid gap-[15px] lg:grid-cols-[220px_520px] lg:gap-x-3">
            <Input
              label="CEP"
              placeholder="70000-000"
              inputMode="numeric"
              autoComplete="postal-code"
              helper={quoteLoading ? "Calculando frete…" : (addressError ?? undefined)}
              {...checkoutFieldProps("cep", state, maskCep)}
            />
            <Input
              label="Endereço"
              placeholder="SQN 210, Bloco A"
              autoComplete="address-line1"
              {...checkoutFieldProps("rua", state)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-[220px_520px]">
            <Input label="Número" placeholder="123" {...checkoutFieldProps("numero", state)} />
            <Input
              label="Complemento (opcional)"
              placeholder="Apto 42"
              autoComplete="address-line2"
              {...checkoutFieldProps("complemento", state)}
            />
          </div>
          <div className="grid gap-[15px] lg:grid-cols-[370px_370px] lg:gap-x-3">
            <Input label="Bairro" placeholder="Asa Norte" {...checkoutFieldProps("bairro", state)} />
            <div className="grid grid-cols-[1fr_96px] gap-3 lg:contents">
              <Input
                label="Cidade"
                placeholder="Brasília"
                autoComplete="address-level2"
                {...checkoutFieldProps("cidade", state)}
              />
              <Input
                label="Estado / UF"
                placeholder="DF"
                maxLength={2}
                autoComplete="address-level1"
                containerClassName="lg:w-[220px]"
                {...checkoutFieldProps("estado", state, (value) => value.replace(/[^a-zA-Z]/g, "").toUpperCase())}
              />
            </div>
          </div>
        </>
      )}
    </CheckoutSection>
  );
}
