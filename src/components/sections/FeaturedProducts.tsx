"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

/** Mock featured products — replaced by backend data when connected */
const MOCK_FEATURED = [
  {
    id: 1,
    titulo: "Vestido Rosa Encanto",
    preco_base: 1890.0,
    preco_original: 2200.0,
    imagem: "/hero-dress.png",
    categoria: "Debutante",
    nota: 4.8,
  },
  {
    id: 2,
    titulo: "Vestido Azul Noite",
    preco_base: 2350.0,
    imagem: "/cat-formatura.png",
    categoria: "Formatura",
    nota: 4.9,
  },
  {
    id: 3,
    titulo: "Vestido Dourado Elegance",
    preco_base: 3100.0,
    imagem: "/cat-casamento.png",
    categoria: "Casamento",
    nota: 5.0,
  },
  {
    id: 4,
    titulo: "Vestido Vermelho Glamour",
    preco_base: 1650.0,
    preco_original: 1950.0,
    imagem: "/cat-festa.png",
    categoria: "Festa",
    nota: 4.7,
  },
];

export default function FeaturedProducts() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-brand)]">
              Curadoria especial
            </span>
            <h2 className="text-3xl sm:text-4xl font-light text-white mt-2">
              Em{" "}
              <span className="font-semibold text-gradient">Destaque</span>
            </h2>
          </div>
          <Link
            href="/produtos"
            className="group inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--color-brand-light)] transition-colors"
          >
            Ver toda a coleção
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_FEATURED.map((product, index) => (
            <Link
              key={product.id}
              href={`/produtos/${product.id}`}
              className="group block animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--background-card)] border border-[var(--border)] transition-all duration-[var(--transition-base)] hover:border-[var(--border-accent)] hover:shadow-[var(--shadow-glow)]">
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={product.imagem}
                    alt={product.titulo}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--transition-base)]" />

                  {/* Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="brand">{product.categoria}</Badge>
                  </div>

                  {/* Discount */}
                  {product.preco_original && (
                    <div className="absolute top-3 right-3">
                      <Badge variant="error">
                        -{Math.round(
                          ((product.preco_original - product.preco_base) /
                            product.preco_original) *
                            100,
                        )}
                        %
                      </Badge>
                    </div>
                  )}

                  {/* Quick action */}
                  <div className="absolute bottom-3 inset-x-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[var(--transition-base)]">
                    <div className="glass rounded-[var(--radius-md)] px-4 py-2.5 text-center text-sm font-medium text-white">
                      Ver Detalhes
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center gap-1 mb-2">
                    <Star
                      size={12}
                      className="fill-amber-400 text-amber-400"
                    />
                    <span className="text-xs text-[var(--foreground-muted)]">
                      {product.nota}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-[var(--foreground-secondary)] line-clamp-1 group-hover:text-white transition-colors">
                    {product.titulo}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-semibold text-white">
                      {formatCurrency(product.preco_base)}
                    </span>
                    {product.preco_original && (
                      <span className="text-sm text-[var(--foreground-subtle)] line-through">
                        {formatCurrency(product.preco_original)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
