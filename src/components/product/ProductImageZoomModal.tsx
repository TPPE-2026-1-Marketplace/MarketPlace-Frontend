import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ZoomImageItem {
  idImagem?: number;
  id_imagem?: number;
  url?: string;
  image?: { url: string };
  ordem?: number;
  descricao?: string | null;
}

export interface ProductImageZoomModalProps {
  isOpen: boolean;
  images?: Array<ZoomImageItem | string>;
  imageUrl?: string;
  initialIndex?: number;
  productName: string;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

function getImageUrl(item: ZoomImageItem | string | undefined): string {
  if (!item) return "/hero-dress.png";
  if (typeof item === "string") return item;
  return item.url ?? item.image?.url ?? "/hero-dress.png";
}

export function ProductImageZoomModal({
  isOpen,
  images,
  imageUrl,
  initialIndex = 0,
  productName,
  onClose,
  onIndexChange,
}: ProductImageZoomModalProps) {
  const normalizedImages =
    images && images.length > 0 ? images : [imageUrl || "/hero-dress.png"];

  const [prevInitialIndex, setPrevInitialIndex] = useState(initialIndex);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  // Padrão oficial React para ajuste de estado quando prop muda
  if (initialIndex !== prevInitialIndex || isOpen !== prevIsOpen) {
    setPrevInitialIndex(initialIndex);
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomActive(false);
      setZoomOrigin({ x: 50, y: 50 });
    }
  }

  const changeImage = useCallback(
    (newIndex: number) => {
      setCurrentIndex(newIndex);
      setIsZoomActive(false);
      setZoomOrigin({ x: 50, y: 50 });
      onIndexChange?.(newIndex);
    },
    [onIndexChange],
  );

  const handlePrev = useCallback(() => {
    const nextIdx =
      currentIndex === 0 ? normalizedImages.length - 1 : currentIndex - 1;
    changeImage(nextIdx);
  }, [currentIndex, normalizedImages.length, changeImage]);

  const handleNext = useCallback(() => {
    const nextIdx =
      currentIndex === normalizedImages.length - 1 ? 0 : currentIndex + 1;
    changeImage(nextIdx);
  }, [currentIndex, normalizedImages.length, changeImage]);

  // Atalhos de teclado: Esc para fechar, setas para navegar
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen) return null;

  const currentImageUrl = getImageUrl(normalizedImages[currentIndex]);

  const updateCoordinates = (
    clientX: number,
    clientY: number,
    currentTarget: HTMLElement,
  ) => {
    const rect = currentTarget.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    updateCoordinates(e.clientX, e.clientY, e.currentTarget);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovering(true);
    updateCoordinates(e.clientX, e.clientY, e.currentTarget);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (!isZoomActive) {
      setZoomOrigin({ x: 50, y: 50 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    const touch = e.touches[0];
    updateCoordinates(touch.clientX, touch.clientY, e.currentTarget);
  };

  const toggleZoom = () => {
    setIsZoomActive((prev: boolean) => !prev);
  };

  const showZoom = isZoomActive || isHovering;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 z-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={`Foto ampliada de ${productName}`}
      >
        <div className="bg-[var(--background-card)] rounded-[var(--radius-xl)] max-w-4xl w-full p-4 sm:p-5 shadow-2xl relative border border-[var(--border)] flex flex-col gap-3 my-auto">
          {/* Header Superior do Modal */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs font-sans text-[var(--foreground-secondary)]">
              <span className="font-semibold text-[var(--foreground)]">
                {currentIndex + 1} de {normalizedImages.length}
              </span>
              <span>·</span>
              <span className="hidden sm:inline">
                Passe o cursor ou toque na imagem para ampliar os detalhes
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleZoom}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-[var(--radius-sm)] border transition-colors cursor-pointer",
                  isZoomActive
                    ? "bg-[var(--action-primary)] text-[var(--color-white)] border-transparent"
                    : "bg-[var(--background-secondary)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--border)]/30",
                )}
                aria-label={isZoomActive ? "Desativar zoom" : "Ativar zoom 2.5x"}
              >
                {isZoomActive ? (
                  <>
                    <ZoomOut className="size-3.5" />
                    <span className="hidden xs:inline">Zoom 2.5x ativo</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="size-3.5" />
                    <span className="hidden xs:inline">Zoom 2.5x</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] p-1 rounded-full transition-colors cursor-pointer"
                aria-label="Fechar modal"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Área da Imagem Ampliada com Lupa / Zoom Interativo */}
          <div className="relative w-full h-[55vh] sm:h-[65vh] md:h-[70vh] flex items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--background-secondary)] select-none">
            <div
              role="button"
              tabIndex={0}
              aria-label={
                showZoom
                  ? "Reduzir zoom dos detalhes da imagem"
                  : "Ampliar detalhes da imagem"
              }
              className={cn(
                "relative w-full h-full flex items-center justify-center overflow-hidden focus:outline-hidden",
                showZoom ? "cursor-zoom-out" : "cursor-zoom-in",
              )}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchMove={handleTouchMove}
              onClick={toggleZoom}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleZoom();
                }
              }}
            >
              <img
                src={currentImageUrl}
                alt={`${productName} foto ${currentIndex + 1}`}
                style={{
                  transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                  transform: showZoom ? "scale(2.4)" : "scale(1)",
                  transition: showZoom
                    ? "transform 0.06s ease-out"
                    : "transform 0.25s ease-out",
                }}
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>

            {/* Setas de Navegação Entre Imagens */}
            {normalizedImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-[var(--background-card)]/90 backdrop-blur-sm border border-[var(--border)] shadow-md flex items-center justify-center hover:bg-[var(--background-card)] text-[var(--foreground)] transition-all cursor-pointer z-10"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-[var(--background-card)]/90 backdrop-blur-sm border border-[var(--border)] shadow-md flex items-center justify-center hover:bg-[var(--background-card)] text-[var(--foreground)] transition-all cursor-pointer z-10"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
          </div>

          {/* Miniaturas (Thumbnails) para Troca Direta de Imagens */}
          {normalizedImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 max-w-full scrollbar-thin">
              {normalizedImages.map((img, idx) => {
                const url = getImageUrl(img);
                const isSelected = idx === currentIndex;
                return (
                  <button
                    key={`thumb-modal-${idx}`}
                    type="button"
                    onClick={() => changeImage(idx)}
                    className={cn(
                      "relative w-12 h-14 sm:w-14 sm:h-16 rounded-[var(--radius-sm)] overflow-hidden border-2 transition-all shrink-0 bg-[var(--background-secondary)] cursor-pointer",
                      isSelected
                        ? "border-[var(--color-brand)] shadow-sm scale-105"
                        : "border-[var(--border)] opacity-70 hover:opacity-100",
                    )}
                    aria-label={`Ver foto ${idx + 1}`}
                  >
                    <img
                      src={url}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover object-top"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Botão de Fechar Imagem (Figma Node 417:340 / 417:513) */}
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full h-11 text-base font-medium rounded-[var(--radius-md)] border-[var(--border-control)] hover:bg-[var(--background-secondary)] cursor-pointer"
            >
              Fechar imagem
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
