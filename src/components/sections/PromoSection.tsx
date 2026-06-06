import React from "react";
import Link from "next/link";
import { Sparkles, Truck, Shield } from "lucide-react";
import Button from "@/components/ui/Button";

export default function PromoSection() {
  return (
    <section className="py-20 sm:py-28 bg-[var(--background-secondary)] overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main promo banner */}
        <div className="relative rounded-[var(--radius-xl)] overflow-hidden">
          {/* Background gradient */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #1a0a12 0%, #2d0f1e 30%, #0a0a0a 70%, #0f0a15 100%)",
            }}
          />
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-[var(--color-brand)]/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[var(--color-brand)]/5 blur-3xl" />

          {/* Content */}
          <div className="relative z-10 px-8 sm:px-14 py-14 sm:py-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-[var(--radius-full)] border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10">
              <Sparkles size={14} className="text-[var(--color-brand-light)]" />
              <span className="text-xs font-medium tracking-[0.15em] uppercase text-[var(--color-brand-light)]">
                Promoção exclusiva
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-light text-white max-w-2xl mx-auto leading-tight">
              Até{" "}
              <span className="font-bold text-gradient">30% OFF</span>{" "}
              na coleção de inverno
            </h2>
            <p className="text-base text-white/50 mt-4 max-w-lg mx-auto">
              Condições especiais para compras acima de R$ 1.500. Frete grátis
              para o Distrito Federal.
            </p>
            <div className="mt-8">
              <Link href="/produtos">
                <Button size="lg">
                  Aproveitar agora
                  <Sparkles size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12">
          {[
            {
              icon: Truck,
              title: "Entrega para todo Brasil",
              desc: "Frete grátis no DF • Envio rastreado",
            },
            {
              icon: Shield,
              title: "Compra segura",
              desc: "PIX e cartão até 12x • Dados protegidos",
            },
            {
              icon: Sparkles,
              title: "Qualidade garantida",
              desc: "Tecidos premium • Acabamento impecável",
            },
          ].map((badge) => (
            <div
              key={badge.title}
              className="flex items-start gap-4 p-6 rounded-[var(--radius-lg)] bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors duration-[var(--transition-fast)]"
            >
              <div className="shrink-0 w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-brand)]/10 flex items-center justify-center">
                <badge.icon size={20} className="text-[var(--color-brand)]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">
                  {badge.title}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                  {badge.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
