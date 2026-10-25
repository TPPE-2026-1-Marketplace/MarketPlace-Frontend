import React, { useEffect } from "react";
import Button from "@/components/ui/Button";

interface ProductImageZoomModalProps {
  isOpen: boolean;
  imageUrl: string;
  productName: string;
  onClose: () => void;
}

export function ProductImageZoomModal({
  isOpen,
  imageUrl,
  productName,
  onClose,
}: ProductImageZoomModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/75 z-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label={`Foto ampliada de ${productName}`}
      >
        <div
          className="bg-[var(--background-card)] rounded-[var(--radius-xl)] max-w-[700px] w-full p-4 sm:p-5 shadow-2xl relative border border-[var(--border)] flex flex-col items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Imagem Ampliada (Figma: Desktop 668x740, Mobile 311x440) */}
          <div className="w-full max-h-[75vh] sm:max-h-[80vh] flex items-center justify-center overflow-hidden rounded-[var(--radius-lg)] bg-[var(--background-secondary)]">
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-auto max-h-[75vh] sm:max-h-[80vh] object-contain rounded-[var(--radius-lg)]"
            />
          </div>

          {/* Botão de Fechar Imagem (Figma Node 417:340 / 417:513) */}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full h-12 text-base font-medium rounded-[var(--radius-md)] border-[var(--border-control)] hover:bg-[var(--background-secondary)]"
          >
            Fechar imagem
          </Button>
        </div>
      </div>
    </>
  );
}
