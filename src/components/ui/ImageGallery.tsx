import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { ProductImageZoomModal } from "@/components/product/ProductImageZoomModal";
import { cn } from "@/lib/utils";

export interface ImageGalleryItem {
  idImagem?: number;
  url: string;
  ordem?: number;
  descricao?: string | null;
  image?: { url: string };
}

interface ImageGalleryProps {
  images: ImageGalleryItem[] | any[];
  productName: string;
  selectedIndex?: number;
  onSelectImage?: (index: number) => void;
  discount?: number | null;
  isLowStock?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  className?: string;
}

export default function ImageGallery({
  images,
  productName,
  selectedIndex,
  onSelectImage,
  discount,
  isLowStock,
  isFavorite,
  onToggleFavorite,
  className,
}: ImageGalleryProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const activeIndex = selectedIndex !== undefined ? selectedIndex : internalIndex;

  const handleSelect = (idx: number) => {
    if (onSelectImage) {
      onSelectImage(idx);
    } else {
      setInternalIndex(idx);
    }
  };

  const safeImages = images && images.length > 0
    ? images
    : [{ idImagem: 0, url: "/hero-dress.png", ordem: 0, descricao: null }];

  const currentImageUrl =
    safeImages[activeIndex]?.url ??
    safeImages[activeIndex]?.image?.url ??
    safeImages[0]?.url ??
    safeImages[0]?.image?.url ??
    "/hero-dress.png";

  const handlePrev = () => {
    const nextIdx = activeIndex === 0 ? safeImages.length - 1 : activeIndex - 1;
    handleSelect(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = activeIndex === safeImages.length - 1 ? 0 : activeIndex + 1;
    handleSelect(nextIdx);
  };

  return (
    <div className={cn("w-full flex flex-col lg:flex-row gap-3 lg:gap-4", className)}>
      {/* Desktop Vertical Thumbnails (Figma: w=64px, gap=12px) */}
      {safeImages.length > 1 && (
        <div className="hidden lg:flex flex-col gap-3 w-16 shrink-0">
          {safeImages.map((img, i) => {
            const url = img.url ?? img.image?.url ?? "/hero-dress.png";
            const isSelected = i === activeIndex;
            return (
              <button
                key={img.idImagem || img.id_imagem || i}
                type="button"
                onClick={() => handleSelect(i)}
                className={cn(
                  "relative w-16 h-20 rounded-[var(--radius-sm)] overflow-hidden border-2 transition-all shrink-0 bg-[var(--background-secondary)]",
                  isSelected
                    ? "border-[var(--color-brand)] shadow-sm"
                    : "border-[var(--border)] hover:border-[var(--border-hover)] opacity-75 hover:opacity-100",
                )}
                aria-label={`${productName} thumbnail ${i + 1}`}
              >
                <img
                  src={url}
                  alt={`${productName} ${i + 1}`}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Main Image Container (Figma: Desktop 544x632px, Mobile 343x420px) */}
      <div className="flex-1 relative">
        <div
          onClick={() => setIsZoomOpen(true)}
          className="relative aspect-[3/4] rounded-[var(--radius-lg)] overflow-hidden bg-[var(--background-secondary)] border border-[var(--border)] shadow-sm cursor-zoom-in group"
        >
          <img
            src={currentImageUrl}
            alt={productName}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Badges de Desconto e Estoque */}
          {discount && (
            <div className="absolute top-4 left-4 bg-[var(--action-primary)] text-[var(--color-white)] px-3 py-1 text-xs tracking-wide rounded-[var(--radius-sm)] font-medium">
              -{discount}%
            </div>
          )}

          {isLowStock && (
            <div className="absolute top-4 right-14 bg-[var(--foreground-secondary)] text-[var(--color-white)] px-3 py-1 text-xs rounded-[var(--radius-sm)] font-medium">
              Últimas unidades
            </div>
          )}

          {/* Botão de Favoritar (Heart) */}
          <button
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onToggleFavorite?.();
            }}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[var(--background-card)]/90 backdrop-blur-sm flex items-center justify-center hover:bg-[var(--background-card)] transition-colors border border-[var(--border)] shadow-sm text-[var(--foreground)] cursor-pointer"
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart
              className={cn(
                "w-4 h-4 transition-colors",
                isFavorite
                  ? "fill-[var(--color-brand)] text-[var(--color-brand)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--color-brand)]",
              )}
            />
          </button>

          {/* Setas de navegação */}
          {safeImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--background-card)]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[var(--background-card)] transition-colors text-[var(--foreground)] shadow-sm cursor-pointer"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="w-4 h-4 text-[var(--foreground-secondary)]" />
              </button>
              <button
                type="button"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--background-card)]/80 backdrop-blur-sm flex items-center justify-center hover:bg-[var(--background-card)] transition-colors text-[var(--foreground)] shadow-sm cursor-pointer"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="w-4 h-4 text-[var(--foreground-secondary)]" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Horizontal Thumbnails */}
        {safeImages.length > 1 && (
          <div className="lg:hidden flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin">
            {safeImages.map((img, i) => {
              const url = img.url ?? img.image?.url ?? "/hero-dress.png";
              const isSelected = i === activeIndex;
              return (
                <button
                  key={`mobile-${img.idImagem || img.id_imagem || i}`}
                  type="button"
                  onClick={() => handleSelect(i)}
                  className={cn(
                    "relative w-14 h-18 rounded-[var(--radius-sm)] overflow-hidden border-2 transition-all shrink-0 bg-[var(--background-secondary)]",
                    isSelected
                      ? "border-[var(--color-brand)] shadow-sm"
                      : "border-[var(--border)] opacity-75 hover:opacity-100",
                  )}
                  aria-label={`${productName} thumbnail ${i + 1}`}
                >
                  <img
                    src={url}
                    alt={`${productName} ${i + 1}`}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* Indicador de fotos com gatilho de zoom (Figma: 1 / 5 fotos · Toque na imagem para ampliar) */}
        <button
          type="button"
          onClick={() => setIsZoomOpen(true)}
          className="w-full mt-2 text-center text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        >
          {activeIndex + 1} / {safeImages.length} fotos · Toque na imagem para ampliar
        </button>
      </div>

      {/* Modal de Foto Ampliada do Figma (Node 417:338 e 417:511) */}
      <ProductImageZoomModal
        isOpen={isZoomOpen}
        imageUrl={currentImageUrl}
        productName={productName}
        onClose={() => setIsZoomOpen(false)}
      />
    </div>
  );
}
