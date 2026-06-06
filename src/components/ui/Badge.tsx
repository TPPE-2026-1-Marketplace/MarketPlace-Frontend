import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "brand" | "success" | "warning" | "error";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-white/10 text-[var(--foreground-secondary)]",
  brand:
    "bg-[var(--color-brand)]/15 text-[var(--color-brand-light)]",
  success:
    "bg-[var(--color-success)]/15 text-[var(--color-success)]",
  warning:
    "bg-[var(--color-warning)]/15 text-[var(--color-warning)]",
  error:
    "bg-[var(--color-error)]/15 text-[var(--color-error)]",
};

export default function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase rounded-[var(--radius-full)]",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
