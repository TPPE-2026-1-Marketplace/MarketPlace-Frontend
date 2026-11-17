import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { adminCardClassName, adminLabelClassName } from "./adminClasses";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  help: string;
}

/** "Admin / Indicador" do Figma (749:13): rótulo, valor (Data/KPI) e ajuda. */
export default function KpiCard({ label, value, help }: KpiCardProps) {
  return (
    <div className={cn(adminCardClassName, "flex min-w-0 flex-col gap-2 p-5")}>
      <p className={adminLabelClassName}>{label}</p>
      <p className="text-2xl leading-8 font-semibold text-[var(--foreground)]">{value}</p>
      <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">{help}</p>
    </div>
  );
}

interface KpiGridProps {
  children: ReactNode;
  /** Colunas no desktop: 4 na maioria das telas, 3 em Vendas PDV (Figma 755:1331). */
  columns?: 3 | 4;
}

/** Linha "Indicadores": 4 (ou 3) colunas no desktop e 2 no mobile. */
export function KpiGrid({ children, columns = 4 }: KpiGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4")}>
      {children}
    </div>
  );
}
