import React from "react";
import { X, Ruler } from "lucide-react";

import { SIZE_TABLE } from "./sizeTable";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizes?: string[];
  selectedSize?: string;
}

export function SizeGuideModal({
  isOpen,
  onClose,
  sizes = [],
  selectedSize,
}: SizeGuideModalProps) {
  if (!isOpen) return null;

  const filteredTable = sizes.length > 0
    ? SIZE_TABLE.filter(([size]) => sizes.includes(size))
    : SIZE_TABLE;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--background-card)] max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border)] shadow-xl">
          <div className="sticky top-0 bg-[var(--background-card)] border-b border-[var(--border)] p-5 flex items-center justify-between z-10">
            <h3 className="text-[var(--foreground)] font-serif text-xl font-medium">Guia de Medidas</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors p-1 rounded-[var(--radius-sm)]"
              aria-label="Fechar guia de medidas"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--background-secondary)] border border-[var(--border)]">
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[var(--color-brand)]" />
                Como tirar suas medidas
              </h4>
              <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed mb-3">
                Use uma fita métrica junto ao corpo, sem apertar, mantendo-a nivelada:
              </p>
              <ul className="text-xs text-[var(--foreground-secondary)] space-y-1.5 list-disc pl-4">
                <li><strong>Busto:</strong> Meça na parte mais saliente do busto.</li>
                <li><strong>Cintura:</strong> Meça na parte mais estreita do tronco, acima do umbigo.</li>
                <li><strong>Quadril:</strong> Meça na parte mais larga dos quadris e glúteos.</li>
                <li><strong>Comprimento:</strong> Do ombro até a barra do vestido.</li>
              </ul>
            </div>

            <p className="text-[var(--foreground-muted)] text-xs">
              Todas as medidas em centímetros (cm). Recomendamos comparar com a tabela abaixo antes de realizar o pedido.
            </p>

            <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
              <table className="w-full text-sm text-[var(--foreground-secondary)]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)]">
                    <th className="text-left py-2.5 px-3 text-[var(--foreground)] font-semibold">Tam.</th>
                    <th className="text-left py-2.5 px-3 text-[var(--foreground)] font-semibold">Busto (cm)</th>
                    <th className="text-left py-2.5 px-3 text-[var(--foreground)] font-semibold">Cintura (cm)</th>
                    <th className="text-left py-2.5 px-3 text-[var(--foreground)] font-semibold">Quadril (cm)</th>
                    <th className="text-left py-2.5 px-3 text-[var(--foreground)] font-semibold">Comprimento (cm)</th>
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
          </div>
        </div>
      </div>
    </>
  );
}
