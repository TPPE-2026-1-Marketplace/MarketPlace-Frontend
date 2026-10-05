import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Texto de ajuda exibido abaixo do campo quando não há erro. */
  helper?: string;
  icon?: React.ReactNode;
  /** Classes do contêiner (label + campo + mensagens). */
  containerClassName?: string;
}

/**
 * Input do design system (Figma "Input", Medium 40px).
 * Label sempre visível; erro com texto, aria-invalid e aria-describedby.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, icon, className, containerClassName, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? helper;

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm leading-5 font-medium text-[var(--foreground)]"
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
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(
            "h-10 w-full rounded-[var(--radius-md)] border border-[var(--border-control)]",
            "bg-[var(--background-card)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]",
            "px-3 text-sm leading-[22px] transition-colors duration-[var(--transition-fast)]",
            "focus:outline-none focus-visible:border-[var(--color-brand)] focus-visible:ring-2 focus-visible:ring-[var(--border-accent)]",
            "disabled:cursor-not-allowed disabled:bg-[var(--background-secondary)] disabled:text-[var(--foreground-muted)]",
            icon && "pl-10",
            error && "border-[var(--color-error-text)] focus-visible:border-[var(--color-error-text)]",
            className,
          )}
          {...props}
        />
      </div>
      {message && (
        <p
          id={messageId}
          className={cn(
            "text-xs leading-[18px]",
            error ? "text-[var(--color-error-text)]" : "text-[var(--foreground-muted)]",
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
});

export default Input;
