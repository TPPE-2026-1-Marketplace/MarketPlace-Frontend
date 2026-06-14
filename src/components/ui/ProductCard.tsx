
import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Heart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

  const mockSizes = ["38", "40", "42", "44", "46"];

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
          <button className="absolute top-3 right-3 w-8 h-8 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 border border-gray-100">
            <Heart className="w-4 h-4 text-gray-600" />
          </button>
          {/* Quick add */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                // Add to cart logic will go here
              }}
              className="w-full bg-[#1a1a1a] text-white py-2.5 flex items-center justify-center gap-2 hover:bg-[#333333] transition-colors text-xs tracking-wide"
            >
              <ShoppingCart className="w-4 h-4" />
              Adicionar ao Carrinho
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
          <div className="flex gap-1 mt-2 flex-wrap">
            {mockSizes.map((s) => (
              <span
                key={s}
                className="text-xs border border-gray-200 px-1.5 py-0.5 text-gray-500 hover:border-gray-800 transition-colors"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
