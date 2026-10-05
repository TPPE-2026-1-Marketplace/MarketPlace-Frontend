import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useCart } from "@/hooks/useCart";
import { useShippingQuote } from "@/hooks/useShippingQuote";
import { cn, maskCep, onlyDigits } from "@/lib/utils";

interface ShippingEstimateProps {
  /** `box`: faixa cinza dentro da lista (desktop); `button`: botão outline (mobile). */
  variant: "box" | "button";
  className?: string;
}

/** Frete do carrinho: "Entrega para 00000-000 · Editar CEP" com edição inline. */
export default function ShippingEstimate({ variant, className }: ShippingEstimateProps) {
  const { cart, setShipping } = useCart();
  const { calculate, loading, error, reset } = useShippingQuote();
  const savedCep = cart.cep ? maskCep(cart.cep) : "";
  const [editing, setEditing] = useState(!savedCep);
  const [cep, setCep] = useState(savedCep);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const quote = await calculate(cep);
    if (!quote) return;
    setShipping({ cep: onlyDigits(cep), valor: quote.valor, prazoDias: quote.prazo_dias });
    setEditing(false);
  };

  const cancel = () => {
    reset();
    setCep(savedCep);
    setEditing(false);
  };

  const form = (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <Input
        label="CEP de entrega"
        name="cep"
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="00000-000"
        value={cep}
        onChange={(event) => setCep(maskCep(event.target.value))}
        error={error ?? undefined}
        containerClassName="sm:w-[220px]"
      />
      <div className="flex gap-2 sm:mt-[26px]">
        <Button type="submit" variant="action" loading={loading} className="h-10 flex-1 px-6 py-0 text-sm sm:flex-none">
          Calcular
        </Button>
        {savedCep && (
          <Button type="button" variant="ghost" onClick={cancel} className="h-10 px-4 py-0 text-sm">
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );

  if (variant === "button") {
    return (
      <div className={className}>
        {editing ? (
          <div className="rounded-[var(--radius-md)] bg-[var(--background-secondary)] p-4">{form}</div>
        ) : (
          <Button variant="outline-neutral" size="touch" fullWidth onClick={() => setEditing(true)}>
            Editar CEP na entrega
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("rounded-[var(--radius-md)] bg-[var(--background-secondary)] p-4", className)}>
      {editing ? (
        form
      ) : (
        <div className="flex flex-wrap items-center gap-4 text-sm leading-5 font-medium">
          <p className="text-[var(--foreground)]">Entrega para {savedCep}</p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[var(--color-brand)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            Editar CEP
          </button>
        </div>
      )}
    </div>
  );
}
