import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  body?: string;
  /** Ação opcional (normalmente um Link ou Button com a variante action). */
  action?: React.ReactNode;
  className?: string;
}

/** EmptyState do design system: larguras de 343px (mobile) e 512px (desktop). */
export default function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[512px] flex-col items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--background-card)] p-6 text-center",
        className,
      )}
    >
      <div
        className="flex size-16 items-center justify-center rounded-full bg-[var(--background-brand-subtle)] text-[var(--foreground)]"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h2 className="text-2xl leading-8 font-medium text-[var(--foreground)]">{title}</h2>
      {body && (
        <p className="text-base leading-[26px] text-[var(--foreground-secondary)]">{body}</p>
      )}
      {action}
    </div>
  );
}
