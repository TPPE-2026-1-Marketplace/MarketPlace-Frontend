"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

interface ProductCardProps {
  id: number;
  titulo: string;
  preco: number;
  precoOriginal?: number;
  imagem: string;
  categoria?: string;
  nota?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function ProductCard({
  id,
  titulo,
  preco,
  precoOriginal,
  imagem,
  categoria,
  nota,
  className,
  style,
}: ProductCardProps) {
  const desconto = precoOriginal
    ? Math.round(((precoOriginal - preco) / precoOriginal) * 100)
    : null;

  return (
    <Link
      href={`/produtos/${id}`}
      className={cn("group block", className)}
      style={style}
    >
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--background-card)] border border-[var(--border)] transition-all duration-[var(--transition-base)] hover:border-[var(--border-accent)] hover:shadow-[var(--shadow-glow)]">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={imagem}
            alt={titulo}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--transition-base)]" />

          {/* Badges */}
          {categoria && (
            <div className="absolute top-3 left-3">
              <Badge variant="brand">{categoria}</Badge>
            </div>
          )}
          {desconto && (
            <div className="absolute top-3 right-3">
              <Badge variant="error">-{desconto}%</Badge>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute bottom-3 inset-x-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[var(--transition-base)]">
            <div className="glass rounded-[var(--radius-md)] px-4 py-2.5 text-center text-sm font-medium text-white">
              Ver Detalhes
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {nota && (
            <div className="flex items-center gap-1 mb-2">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              <span className="text-xs text-[var(--foreground-muted)]">
                {nota}
              </span>
            </div>
          )}
          <h3 className="text-sm font-medium text-[var(--foreground-secondary)] line-clamp-1 group-hover:text-white transition-colors">
            {titulo}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-semibold text-white">
              {formatCurrency(preco)}
            </span>
            {precoOriginal && (
              <span className="text-sm text-[var(--foreground-subtle)] line-through">
                {formatCurrency(precoOriginal)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
