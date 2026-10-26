import type { ReactNode } from "react";

interface AdminPageHeaderProps {
  title: string;
  description: string;
  /** Ação principal ao lado do título (ex.: "Adicionar produto"). */
  action?: ReactNode;
}

/** "Título e ações" do Figma (750:3): título Display, descrição e ação principal. */
export default function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <div className="flex max-w-[680px] flex-1 flex-col gap-2">
        <h1 className="text-[32px] leading-[38px] font-semibold text-[var(--foreground)]">{title}</h1>
        <p className="text-sm leading-[22px] text-[var(--foreground-secondary)]">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
