import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { SIZE_TABLE } from "./sizeTable";

interface ProductDetailsSectionProps {
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

export function ProductDetailsSection({
  description,
  sku,
  categoryName,
  colors,
  sizes,
  stockEcommerce,
  selectedSize,
  className,
}: ProductDetailsSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("descricao");

  const productSizeTable = sizes.length > 0
    ? SIZE_TABLE.filter(([size]) => sizes.includes(size))
    : SIZE_TABLE;

  return (
    <div
      className={cn(
        "bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius-xl)] p-6 lg:p-8 mb-8 shadow-sm",
        className,
      )}
    >
      <div className="mb-6">
        <h2 className="text-xl lg:text-2xl font-serif text-[var(--foreground)] font-normal mb-2">
          Conheça o vestido
        </h2>
        <p className="text-sm font-sans text-[var(--foreground-secondary)] leading-relaxed">
          {description ||
            "Corpete estruturado com aplicações delicadas, saia volumosa e acabamento interno confortável. Ideal para festas de debutante e eventos formais."}
        </p>
      </div>

      {/* Tabs Header para navegação de detalhes e medidas */}
      <div className="flex gap-6 sm:gap-8 border-b border-[var(--border)] mb-6 overflow-x-auto pb-px">
        {[
          { key: "descricao", label: "Detalhes" },
          { key: "tamanhos", label: "Guia de Medidas" },
          { key: "info", label: "Informações" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key as TabKey)}
            className={cn(
              "pb-3 text-sm font-sans transition-colors border-b-2 -mb-px whitespace-nowrap cursor-pointer",
              activeTab === t.key
                ? "border-[var(--action-primary)] text-[var(--action-primary)] font-semibold"
                : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Detalhes */}
      {activeTab === "descricao" && (
        <div className="space-y-4">
          <p className="text-[var(--foreground-secondary)] leading-relaxed text-sm font-sans">
            Cada vestido DK Fashion é desenhado para oferecer caimento sob medida, tecidos nobres e acabamento impecável para ocasiões memoráveis.
          </p>
        </div>
      )}

      {/* Tab: Guia de Medidas */}
      {activeTab === "tamanhos" && (
        <div>
          <p className="text-[var(--foreground-muted)] text-xs mb-4 font-sans">
            Medidas do vestido em centímetros (cm):
          </p>
          <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
            <table className="w-full text-sm font-sans text-[var(--foreground-secondary)]">
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
        <div className="divide-y divide-[var(--border)] text-sm font-sans text-[var(--foreground-secondary)]">
          {[
            ["SKU", sku],
            ["Categoria", categoryName ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1) : "—"],
            ["Cores disponíveis", colors.join(", ") || "—"],
            ["Tamanhos disponíveis", sizes.join(", ") || "—"],
            ["Estoque online", `${stockEcommerce} unidades`],
            ["Área de entrega", "Distrito Federal"],
            ["Prazo de entrega", "3 a 7 dias úteis"],
            ["Troca / Devolução", "7 dias corridos (CDC)"],
          ].map(([key, value]) => (
            <div key={key} className="flex gap-4 py-2.5">
              <span className="text-[var(--foreground-muted)] w-40 sm:w-48 shrink-0 font-medium font-sans">
                {key}
              </span>
              <span className="text-[var(--foreground)] font-normal font-sans">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
