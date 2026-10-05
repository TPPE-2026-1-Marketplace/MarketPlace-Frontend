import React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

/** Grupo de opções (Radix): seleção exclusiva com navegação por setas. */
export function OptionGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("grid gap-3", className)} {...props} />;
}

interface OptionCardProps {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/** Card com Radio do Figma: selecionado ganha borda de 2px em --border-accent. */
export function OptionCard({ value, label, description, disabled, className }: OptionCardProps) {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      disabled={disabled}
      className={cn(
        "group flex flex-col items-start gap-[5px] rounded-[10px] border border-[var(--border)] bg-[var(--background-card)] p-3.5 text-left transition-colors",
        "data-[state=checked]:border-[var(--border-accent)] data-[state=checked]:shadow-[inset_0_0_0_1px_var(--border-accent)]",
        "hover:border-[var(--border-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--background-secondary)] disabled:hover:border-[var(--border)]",
        className,
      )}
    >
      <span className="flex h-11 items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--foreground-secondary)] group-data-[state=checked]:border-[var(--foreground)] group-disabled:border-[var(--foreground-subtle)]"
        >
          <span className="size-2.5 rounded-full bg-[var(--foreground)] opacity-0 group-data-[state=checked]:opacity-100" />
        </span>
        <span className="text-sm leading-[22px] text-[var(--foreground)] group-disabled:text-[var(--foreground-muted)]">
          {label}
        </span>
      </span>
      {description && (
        <span className="text-xs leading-[18px] text-[var(--foreground-muted)]">{description}</span>
      )}
    </RadioGroupPrimitive.Item>
  );
}
