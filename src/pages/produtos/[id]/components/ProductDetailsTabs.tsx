import React, { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIZE_TABLE } from "./sizeTable";

interface ProductDetailsTabsProps {
  description: string | null;
  sku: string;
  categoryName: string;
  colors: string[];
  sizes: string[];
  stockEcommerce: number;
  selectedSize?: string;
  className?: string;
}

type TabKey = "descricao" | "tamanhos" | "info";

export function ProductDetailsTabs({
  description,
  sku,
  categoryName,
  colors,
  sizes,
  stockEcommerce,
  selectedSize,
  className,
}: ProductDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("descricao");

  const productSizeTable = sizes.length > 0
    ? SIZE_TABLE.filter(([size]) => sizes.includes(size))
    : SIZE_TABLE;

  return (
    <div className={cn("bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 mb-12 shadow-sm", className)}>
      {/* Tabs Header */}
      <div className="flex gap-6 sm:gap-8 border-b border-[var(--border)] mb-6 overflow-x-auto pb-px">
        {[
          { key: "descricao", label: "Descrição" },
          { key: "tamanhos", label: "Guia de Medidas" },
          { key: "info", label: "Informações" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as TabKey)}
            className={cn(
              "pb-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer",
              activeTab === t.key
                ? "border-[var(--action-primary)] text-[var(--action-primary)] font-semibold"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Descrição */}
      {activeTab === "descricao" && (
        <div className="space-y-6">
          <p className="text-[var(--foreground-secondary)] leading-relaxed text-sm">
            {description || "Vestido confeccionado com tecidos selecionados, acabamento nobre e modelagem exclusiva."}
          </p>

          <div className="border-t border-[var(--border)] pt-5">
            <h4 className="text-[var(--foreground)] mb-3 font-serif font-medium text-base">Avaliações (1)</h4>
            <div className="bg-[var(--background-secondary)] rounded-[var(--radius-md)] p-4 border border-[var(--border)]">
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-3.5 h-3.5 fill-[var(--action-primary)] text-[var(--action-primary)]" />
                ))}
              </div>
              <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed mb-2">
                "Vestido simplesmente incrível! O caimento é perfeito, o tecido é de altíssima qualidade e chegou muito bem embalado. Recebi muitos elogios na festa. Com certeza comprarei novamente!"
              </p>
              <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span className="font-medium text-[var(--foreground)]">Camila R. — verificado</span>
                <span>Março 2026</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Guia de Medidas */}
      {activeTab === "tamanhos" && (
        <div>
          <p className="text-[var(--foreground-muted)] text-xs mb-4">
            Todas as medidas em centímetros (cm). Recomendamos medir o corpo e comparar com a tabela abaixo antes de realizar o pedido.
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
                {productSizeTable.map(([size, busto, cintura, quadril, comp]) => (
                  <tr
                    key={size}
                    className={cn(
                      "hover:bg-[var(--background-secondary)]/50 transition-colors",
                      selectedSize === size && "bg-[var(--background-secondary)] font-medium",
                    )}
                  >
                    <td className="py-2 px-3 font-medium text-[var(--foreground)]">{size}</td>
                    <td className="py-2 px-3">{busto}</td>
                    <td className="py-2 px-3">{cintura}</td>
                    <td className="py-2 px-3">{quadril}</td>
                    <td className="py-2 px-3">{comp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Informações */}
      {activeTab === "info" && (
        <div className="divide-y divide-[var(--border)] text-sm text-[var(--foreground-secondary)]">
          {[
            ["SKU", sku],
            ["Categoria", categoryName.charAt(0).toUpperCase() + categoryName.slice(1)],
            ["Cores disponíveis", colors.join(", ") || "—"],
            ["Tamanhos disponíveis", sizes.join(", ") || "—"],
            ["Estoque online", `${stockEcommerce} unidades`],
            ["Área de entrega", "Distrito Federal"],
            ["Prazo de entrega", "3 a 7 dias úteis"],
            ["Troca / Devolução", "7 dias corridos (CDC)"],
          ].map(([key, value]) => (
            <div key={key} className="flex gap-4 py-2.5">
              <span className="text-[var(--foreground-muted)] w-40 sm:w-48 shrink-0 font-medium">{key}</span>
              <span className="text-[var(--foreground)] font-normal">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
