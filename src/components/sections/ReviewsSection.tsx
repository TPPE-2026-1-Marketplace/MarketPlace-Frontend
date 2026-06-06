"use client";

import React from "react";
import { Star, Quote } from "lucide-react";

const reviews = [
  {
    name: "Maria Clara",
    rating: 5,
    text: "O vestido superou todas as minhas expectativas! A qualidade do tecido é incrível e o atendimento foi perfeito. Me senti uma princesa na minha formatura.",
    occasion: "Formatura",
    date: "Maio 2026",
  },
  {
    name: "Ana Beatriz",
    rating: 5,
    text: "Comprei meu vestido de debutante aqui e não poderia estar mais feliz. A equipe me ajudou a encontrar o modelo perfeito. Recomendo demais!",
    occasion: "Debutante",
    date: "Abril 2026",
  },
  {
    name: "Juliana Santos",
    rating: 5,
    text: "Vestido maravilhoso para o casamento da minha irmã. Entrega super rápida para Brasília e caimento perfeito. Voltarei com certeza!",
    occasion: "Casamento",
    date: "Março 2026",
  },
  {
    name: "Fernanda Lima",
    rating: 4,
    text: "Adorei a variedade de modelos e cores. O vestido ficou lindo e recebi muitos elogios na festa. Preço justo pela qualidade oferecida.",
    occasion: "Festa",
    date: "Maio 2026",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-[var(--foreground-subtle)]"
          }
        />
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-brand)]">
            Depoimentos
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-white mt-2">
            O que nossas{" "}
            <span className="font-semibold text-gradient">clientes</span>{" "}
            dizem
          </h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <StarRating rating={5} />
            <span className="text-sm text-[var(--foreground-muted)]">
              4.9 de 5 · +200 avaliações
            </span>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-[var(--radius-lg)] bg-[var(--background-card)] border border-[var(--border)] hover:border-[var(--border-accent)] transition-all duration-[var(--transition-base)] animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Quote icon */}
              <Quote
                size={24}
                className="text-[var(--color-brand)]/20 mb-4"
              />

              {/* Stars */}
              <StarRating rating={review.rating} />

              {/* Text */}
              <p className="mt-4 text-sm text-[var(--foreground-secondary)] leading-relaxed line-clamp-4">
                &ldquo;{review.text}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-5 pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-3">
                  {/* Avatar placeholder */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] flex items-center justify-center text-white text-xs font-bold">
                    {review.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {review.name}
                    </p>
                    <p className="text-xs text-[var(--foreground-subtle)]">
                      {review.occasion} · {review.date}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
