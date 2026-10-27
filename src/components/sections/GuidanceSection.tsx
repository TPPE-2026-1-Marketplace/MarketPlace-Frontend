import React from "react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    step: "01",
    title: "Encontre seu estilo",
    body: "Navegue por ocasião e refine sua escolha por tamanho e cor.",
  },
  {
    step: "02",
    title: "Salve para comparar",
    body: "Toque no coração para guardar seus favoritos neste dispositivo, sem criar uma conta.",
  },
  {
    step: "03",
    title: "Confira antes de comprar",
    body: "Escolha tamanho e cor no produto. Confira disponibilidade, frete e prazo antes de pagar.",
  },
];

export default function GuidanceSection() {
  return (
    <section className="bg-[var(--background-brand-subtle)] px-4 py-16 sm:px-6 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-serif text-2xl text-[var(--foreground)]">Seu vestido, com mais confiança</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card
              key={s.step}
              className="gap-3 rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--background-card)] p-6"
            >
              <p className="text-sm font-medium text-[var(--color-brand)]">{s.step}</p>
              <p className="text-xl font-semibold text-[var(--foreground)]">{s.title}</p>
              <p className="text-base text-[var(--foreground-secondary)]">{s.body}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
