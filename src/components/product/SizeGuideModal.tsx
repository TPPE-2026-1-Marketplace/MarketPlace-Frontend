import React, { useState } from "react";
import { X, Ruler } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { SIZE_TABLE } from "./sizeTable";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizes?: string[];
  selectedSize?: string;
  initialTab?: "tabela" | "guia";
}

export function SizeGuideModal({
  isOpen,
  onClose,
  sizes = [],
  selectedSize,
  initialTab = "tabela",
}: SizeGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"tabela" | "guia">(initialTab);

  if (!isOpen) return null;

  const filteredTable = sizes.length > 0
    ? SIZE_TABLE.filter(([size]) => sizes.includes(size))
    : SIZE_TABLE;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50 transition-opacity backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-modal-title"
      >
        <div className="bg-[var(--background-card)] rounded-[var(--radius-xl)] max-w-lg w-full p-6 shadow-xl relative border border-[var(--border)]">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-5">
            <h2
              id="size-guide-modal-title"
              className="text-lg font-serif text-[var(--foreground)] flex items-center gap-2"
            >
              <Ruler className="size-5 text-[var(--color-brand)]" />
              Guia de Medidas
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] p-1 rounded-full transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Abas internas do modal (Tabela de Medidas vs Como Medir) */}
          <div className="flex gap-2 p-1 bg-[var(--background-secondary)] rounded-[var(--radius-md)] mb-5">
            <button
              type="button"
              onClick={() => setActiveTab("tabela")}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-all cursor-pointer",
                activeTab === "tabela"
                  ? "bg-[var(--background-card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              Tabela de Medidas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("guia")}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-all cursor-pointer",
                activeTab === "guia"
                  ? "bg-[var(--background-card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              Como Tirar suas Medidas
            </button>
          </div>

          {activeTab === "guia" ? (
            <div className="space-y-4 mb-6 text-sm text-[var(--foreground-secondary)]">
              <div>
                <strong className="block font-medium text-[var(--foreground)] mb-1">
                  1. Busto
                </strong>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  Passe a fita métrica sobre a parte mais saliente do busto, mantendo a fita reta e paralela ao chão nas costas.
                </p>
              </div>
              <div>
                <strong className="block font-medium text-[var(--foreground)] mb-1">
                  2. Cintura
                </strong>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  Meça a parte mais estreita do seu tronco, geralmente cerca de 2 a 3 dedos acima do umbigo.
                </p>
              </div>
              <div>
                <strong className="block font-medium text-[var(--foreground)] mb-1">
                  3. Quadril
                </strong>
                <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                  Contorne a parte mais larga dos quadris e glúteos com a fita alinhada horizontalmente.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto mb-6">
              <p className="text-xs text-[var(--foreground-muted)] mb-3">
                Medidas da peça em centímetros (cm):
              </p>
              <table className="w-full text-xs text-left text-[var(--foreground-secondary)] border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--foreground-muted)]">
                    <th className="py-2 px-3 font-semibold text-[var(--foreground)]">Tam.</th>
                    <th className="py-2 px-3 font-semibold">Busto (cm)</th>
                    <th className="py-2 px-3 font-semibold">Cintura (cm)</th>
                    <th className="py-2 px-3 font-semibold">Quadril (cm)</th>
                    <th className="py-2 px-3 font-semibold">Comp. (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredTable.map(([size, busto, cintura, quadril, comp]) => (
                    <tr
                      key={size}
                      className={
                        selectedSize === size
                          ? "bg-[var(--background-secondary)] font-medium"
                          : "hover:bg-[var(--background-secondary)]/50 transition-colors"
                      }
                    >
                      <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">{size}</td>
                      <td className="py-2.5 px-3">{busto}</td>
                      <td className="py-2.5 px-3">{cintura}</td>
                      <td className="py-2.5 px-3">{quadril}</td>
                      <td className="py-2.5 px-3">{comp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Botão de Fechar / Voltar ao Produto (Figma Node 443:365) */}
          <div className="pt-2">
            <Button
              type="button"
              variant="action"
              onClick={onClose}
              className="w-full"
            >
              Voltar ao produto
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
