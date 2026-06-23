
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useFavorites } from "@/context/FavoritesContext";
import { useCart } from "@/hooks/useCart";
import type { ProductVariant } from "@/lib/catalog";

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
  variant?: ProductVariant;
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
  variant,
}: ProductCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const favorited = isFavorite(String(id));

  const desconto = precoOriginal
    ? Math.round(((precoOriginal - preco) / precoOriginal) * 100)
    : null;

  const availableSize = variant?.tamanho;
  const canQuickAdd = Boolean(variant?.ativo && variant.stock.qtdOnline > 0);

  return (
    <Link
      to={`/produtos/${id}`}
      className={`group block ${className || ""}`}
      style={style}
    >
      <div className="bg-white overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
        {/* Image */}
        <div className="relative overflow-hidden aspect-[3/4] bg-gray-50">
          <img
            src={imagem}
            alt={titulo}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {desconto && (
              <span className="bg-[#1a1a1a] text-white text-xs px-2 py-0.5 tracking-wide">
                -{desconto}%
              </span>
            )}
            <span className="bg-gray-600 text-white text-xs px-2 py-0.5 tracking-wide">
              Destaque
            </span>
          </div>
          {/* Wishlist */}
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(String(id));
            }}
            className={`absolute top-3 right-3 w-8 h-8 flex items-center justify-center transition-opacity border border-gray-100 ${
              favorited
                ? "bg-[#1a1a1a] text-white opacity-100"
                : "bg-white text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-gray-100"
            }`}
          >
            <Heart className={`w-4 h-4 ${favorited ? "fill-current" : ""}`} />
          </button>
          {/* Quick add */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                if (added || !variant || !canQuickAdd) return;
                setAdded(true);
                addItem(
                  {
                    codigoSku: variant.codigoSku,
                    precoVariante: variant.precoVariante,
                    tamanho: variant.tamanho,
                    cor: variant.cor,
                    produto: { idProduto: id, titulo, precoBase: preco },
                    images: variant.images,
                  },
                  1
                );
                setTimeout(() => setAdded(false), 1500);
              }}
              disabled={!canQuickAdd}
              className="bt-principal w-full py-2.5 flex items-center justify-center gap-2 text-xs tracking-wide"
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  Adicionado!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  {canQuickAdd ? "Adicionar ao Carrinho" : "Indisponível"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
            {categoria || "Vestido"}
          </p>
          <h3 className="text-gray-900 text-sm truncate group-hover:text-gray-600 transition-colors">
            {titulo}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-gray-900 text-sm">
              {formatCurrency(preco)}
            </span>
            {precoOriginal && (
              <span className="text-gray-400 line-through text-xs">
                {formatCurrency(precoOriginal)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            12x de {formatCurrency(preco / 12)}
          </p>
          {/* Sizes preview */}
          {availableSize && (
            <div className="flex gap-1 mt-2 flex-wrap">
              <span
                key={`${variant?.codigoSku}-${availableSize}`}
                className="text-xs border border-gray-200 px-1.5 py-0.5 text-gray-500 hover:border-gray-800 transition-colors"
              >
                {availableSize}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
