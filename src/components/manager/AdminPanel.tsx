import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { adminCardClassName } from "./adminClasses";

interface AdminPanelProps {
  title: ReactNode;
  description?: ReactNode;
  /** Campos (AdminField) do painel. */
  children?: ReactNode;
  /** Botões empilhados ao final, como nos frames de detalhe/edição. */
  actions?: ReactNode;
  /** Elemento do título; o dialog passa o Title do Radix para ligar o aria. */
  titleAs?: ElementType;
  className?: string;
}

/**
 * Card de formulário/estado do painel (Figma "Admin / Formulário" e "Admin / Fluxo",
 * ex.: 755:165, 755:197, 6068): título, descrição, campos e ações em coluna.
 */
export default function AdminPanel({
  title,
  description,
  children,
  actions,
  titleAs: Title = "h2",
  className,
}: AdminPanelProps) {
  return (
    <div className={cn(adminCardClassName, "flex w-full max-w-[560px] flex-col gap-4 p-6", className)}>
      <Title className="text-xl leading-7 font-semibold text-[var(--foreground)]">{title}</Title>
      {description && <div className="text-xs leading-[18px] text-[var(--foreground-secondary)]">{description}</div>}
      {children}
      {actions && <div className="flex flex-col items-start gap-3">{actions}</div>}
    </div>
  );
}
