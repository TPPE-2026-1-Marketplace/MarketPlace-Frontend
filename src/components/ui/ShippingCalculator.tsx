
import React, { useState } from "react";
import { MapPin, Check } from "lucide-react";
import { api } from "@/lib/api";

export default function ShippingCalculator() {
  const [cep, setCep] = useState("");
  const [quote, setQuote] = useState<{ valor: number; prazo_dias: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShippingCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setQuote(null);
      setError("CEP inválido. Use 8 dígitos.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.post<{ valor: number; prazo_dias: number }>("/shipping/calculate", {
        cep_destino: cleanCep,
      });
      setQuote(response);
    } catch (requestError) {
      setQuote(null);
      setError(requestError instanceof Error ? requestError.message : "Erro ao calcular frete.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 rounded-[var(--radius-lg)] bg-[var(--background-secondary)] border border-[var(--border)]">
      <p className="text-sm font-medium text-[var(--foreground)] mb-3 flex items-center gap-2">
        <MapPin size={16} className="text-[var(--foreground-muted)]" />
        Simular Entrega
      </p>
      <form onSubmit={handleShippingCheck} className="flex gap-2">
        <input
          type="text"
          value={cep}
          onChange={(e) => {
            setCep(e.target.value);
            setQuote(null);
            setError(null);
          }}
          placeholder="Digite seu CEP"
          maxLength={9}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand)] bg-[var(--background)] text-[var(--foreground)] transition-colors"
        />
        <button
          type="submit"
          className="rounded-[var(--radius-md)] bg-[var(--color-brand)] text-white px-4 py-2 text-sm hover:bg-[var(--color-brand-dark)] transition-colors font-medium"
        >
          OK
        </button>
      </form>

      {loading && (
        <p className="mt-3 text-xs text-[var(--foreground-muted)]">Calculando frete...</p>
      )}

      {quote && !loading && (
        <div className="mt-3 p-3 rounded bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
          <p className="text-[var(--color-success)] text-xs flex items-start gap-1.5 font-medium leading-relaxed">
            <Check size={14} className="shrink-0 mt-0.5" />
            Frete {quote.valor.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })} · prazo de {quote.prazo_dias} dia{quote.prazo_dias !== 1 ? "s" : ""} útil
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="mt-3 p-3 rounded bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
          <p className="text-[var(--color-warning)] text-xs font-medium leading-relaxed">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
