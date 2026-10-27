import React from "react";
import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { buttonClassName } from "@/components/ui/button-variants";
import { formatCurrency } from "@/lib/utils";
import { useFavorites } from "@/context/FavoritesContext";
import type { ProductVariant } from "@/lib/catalog";

interface ProductCardProps {
  id: number;
  titulo: string;
  preco: number;
  precoOriginal?: number;
  imagem: string;
  categoria?: string;
  /** Nota média (0 a 5). A linha de avaliação só aparece com `totalAvaliacoes` maior que zero. */
  nota?: number;
  totalAvaliacoes?: number;
  className?: string;
  style?: React.CSSProperties;
  variant?: ProductVariant;
}

function formatRating(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Card de produto do design system (Figma "ProductCard"): imagem 3:4,
 * favorito sempre visível (alvo de 44px) e "Escolher opções" leva ao
 * detalhe do produto, onde tamanho/cor são selecionados antes da compra.
 */
export default function ProductCard({
  id,
  titulo,
  preco,
  precoOriginal,
  imagem,
  categoria,
  nota,
  totalAvaliacoes = 0,
  className,
  style,
}: ProductCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorited = isFavorite(String(id));
  const href = `/produtos/${id}`;

  const desconto = precoOriginal
    ? Math.round(((precoOriginal - preco) / precoOriginal) * 100)
    : null;

  return (
    <div
      data-testid="product-card"
      className={`overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] ${className || ""}`}
      style={style}
    >
      <div className="group relative aspect-[3/4] overflow-hidden bg-gray-50">
        <Link to={href} className="block h-full w-full">
          <img
            src={imagem}
            alt={titulo}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        {desconto && (
          <span className="absolute top-3 left-3 bg-[var(--action-primary)] px-2 py-0.5 text-xs tracking-wide text-white">
            -{desconto}%
          </span>
        )}
        <button
          onClick={() => toggleFavorite(String(id))}
          aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={favorited}
          className={`absolute top-2 right-2 flex size-11 items-center justify-center rounded-full transition-colors ${
            favorited ? "bg-[var(--action-primary)] text-white" : "bg-[var(--background-card)] text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Heart className={`size-5 ${favorited ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="flex flex-col gap-1 px-3 pt-3">
        <p className="text-xs font-medium tracking-widest text-[var(--foreground-muted)] uppercase">
          {categoria || "Vestido"}
        </p>
        <Link to={href} className="truncate text-base font-medium text-[var(--foreground)] hover:text-gray-600">
          {titulo}
        </Link>
        {nota !== undefined && totalAvaliacoes > 0 && (
          <div
            className="flex items-center gap-1.5"
            aria-label={`Nota ${formatRating(nota)} de 5, ${totalAvaliacoes} ${totalAvaliacoes === 1 ? "avaliação" : "avaliações"}`}
          >
            <div className="flex items-center gap-0.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  data-filled={star <= Math.round(nota)}
                  className={`size-3 ${
                    star <= Math.round(nota)
                      ? "fill-[var(--action-primary)] text-[var(--action-primary)]"
                      : "text-[var(--border-control)]"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[var(--foreground-secondary)]" aria-hidden="true">
              {formatRating(nota)} ({totalAvaliacoes})
            </span>
          </div>
        )}
        <p className="text-base font-semibold text-[var(--foreground)]">
          {formatCurrency(preco)}
          {precoOriginal && (
            <span className="ml-2 text-xs font-normal text-gray-400 line-through">
              {formatCurrency(precoOriginal)}
            </span>
          )}
        </p>
      </div>

      <div className="p-3">
        <Link to={href} className={buttonClassName({ variant: "action", size: "touch", fullWidth: true })}>
          Escolher opções
        </Link>
      </div>
    </div>
  );
}
