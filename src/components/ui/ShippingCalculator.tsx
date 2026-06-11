"use client";

import React, { useState } from "react";
import { MapPin, Check } from "lucide-react";

export default function ShippingCalculator() {
  const [cep, setCep] = useState("");
  const [cepResult, setCepResult] = useState<null | "ok" | "erro">(null);

  const handleShippingCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      // Mock check — DF CEPs começam com 70 até 73
      const num = parseInt(cleanCep.slice(0, 2), 10);
      setCepResult(num >= 70 && num <= 73 ? "ok" : "erro");
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
            setCepResult(null);
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
      
      {cepResult === "ok" && (
        <div className="mt-3 p-3 rounded bg-[var(--color-success)]/10 border border-[var(--color-success)]/20">
          <p className="text-[var(--color-success)] text-xs flex items-start gap-1.5 font-medium leading-relaxed">
            <Check size={14} className="shrink-0 mt-0.5" />
            Entregamos no seu endereço! Prazo estimado: 3 a 7 dias úteis via correios.
          </p>
        </div>
      )}
      
      {cepResult === "erro" && (
        <div className="mt-3 p-3 rounded bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20">
          <p className="text-[var(--color-warning)] text-xs font-medium leading-relaxed">
            No momento, atendemos entregas padrão apenas para o Distrito Federal. Entre em contato para envios especiais.
          </p>
        </div>
      )}
    </div>
  );
}
