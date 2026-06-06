import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden -mt-[var(--header-height)]">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/hero-dress.png"
          alt="Vestido de festa elegante DK Fashion"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-[var(--header-height)]">
        <div className="max-w-2xl animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-[var(--radius-full)] border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] animate-pulse" />
            <span className="text-xs font-medium tracking-[0.15em] uppercase text-[var(--color-brand-light)]">
              Nova Coleção 2026
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-light tracking-tight text-white leading-[1.1] mb-6">
            Vestidos que
            <br />
            <span className="font-semibold text-gradient">
              transformam
            </span>
            <br />
            momentos.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-white/60 max-w-lg mb-10 leading-relaxed">
            Encontre o vestido perfeito para debutantes, formandas, madrinhas e
            convidadas. Qualidade e elegância no Distrito Federal.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link href="/produtos">
              <Button size="lg">
                Ver Coleção
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/produtos?categoria=debutante">
              <Button variant="outline" size="lg">
                Debutantes
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-14 pt-8 border-t border-white/10">
            {[
              { value: "500+", label: "Vestidos" },
              { value: "4.9★", label: "Avaliação" },
              { value: "DF", label: "Entrega rápida" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xl sm:text-2xl font-semibold text-white">
                  {stat.value}
                </div>
                <div className="text-xs text-white/40 tracking-wide uppercase mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-in">
        <span className="text-[10px] tracking-[0.2em] uppercase text-white/30">
          Role para baixo
        </span>
        <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
          <div className="w-1 h-2 rounded-full bg-white/40 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
