"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CatalogImage } from "@/models";

interface ImageGalleryProps {
  images: CatalogImage[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="relative flex-1 aspect-[3/4] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--background-card)] border border-[var(--border)]">
        <Image
          src="/hero-dress.png"
          alt={productName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
    );
  }

  const currentImageUrl = images[selectedImageIndex]?.image?.url ?? "/hero-dress.png";

  return (
    <div className="w-full lg:w-1/2 flex flex-col sm:flex-row gap-4">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex sm:flex-col gap-2 order-2 sm:order-1">
          {images.map((img, i) => (
            <button
              key={img.id_imagem || i}
              onClick={() => setSelectedImageIndex(i)}
              className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-[var(--radius-md)] overflow-hidden border-2 transition-all duration-[var(--transition-fast)] shrink-0 ${
                i === selectedImageIndex
                  ? "border-[var(--color-brand)]"
                  : "border-[var(--border)] hover:border-[var(--border-hover)]"
              }`}
            >
              <Image
                src={img.image?.url ?? "/hero-dress.png"}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1 aspect-[3/4] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--background-card)] border border-[var(--border)] order-1 sm:order-2">
        <Image
          src={currentImageUrl}
          alt={productName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {/* Navigation arrows for multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedImageIndex((i) => (i === 0 ? images.length - 1 : i - 1))
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center text-[var(--foreground)] hover:bg-white/20 transition-all"
              aria-label="Imagem anterior"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() =>
                setSelectedImageIndex((i) => (i === images.length - 1 ? 0 : i + 1))
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center text-[var(--foreground)] hover:bg-white/20 transition-all"
              aria-label="Próxima imagem"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
