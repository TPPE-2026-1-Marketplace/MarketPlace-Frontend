import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--foreground-secondary)] tracking-wide"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-[var(--radius-md)] border border-[var(--border)]",
            "bg-[var(--background-card)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)]",
            "px-4 py-2.5 text-base transition-all duration-[var(--transition-fast)]",
            "focus:outline-none focus:border-[var(--color-brand)] focus:ring-1 focus:ring-[var(--color-brand)]/40",
            "hover:border-[var(--border-hover)]",
            icon && "pl-10",
            error && "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/40",
            className,
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}
