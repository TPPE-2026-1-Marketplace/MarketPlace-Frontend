import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { adminControlClassName, adminLabelClassName } from "./adminClasses";

interface AdminFieldProps {
  label: string;
  /** Id do controle editável passado em `children`; liga o rótulo ao campo. */
  htmlFor?: string;
  /** Valor somente leitura, exibido na caixa do "Controle". */
  value?: ReactNode;
  /** Controle editável (input/select). Tem prioridade sobre `value`. */
  children?: ReactNode;
  className?: string;
}

/**
 * "Admin / Campo" do Figma (749:17): rótulo pequeno sobre um controle.
 * Não usa o Input da biblioteca porque o rótulo e o controle do painel têm
 * outra escala (12px, borda clara e 12px de respiro).
 */
export default function AdminField({ label, htmlFor, value, children, className }: AdminFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className={adminLabelClassName}>
          {label}
        </label>
      ) : (
        <span className={adminLabelClassName}>{label}</span>
      )}
      {children ?? <p className={cn(adminControlClassName, "break-words")}>{value}</p>}
    </div>
  );
}
