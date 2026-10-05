import React from "react";
import { Loader2 } from "lucide-react";
import { buttonClassName, type ButtonSize, type ButtonVariant } from "./button-variants";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  fullWidth?: boolean;
  /** Mostra o spinner e bloqueia novos cliques (estado Loading do Figma). */
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ variant, size, fullWidth, loading, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="size-5 animate-spin" strokeWidth={1.5} aria-hidden="true" />}
      {children}
    </button>
  );
}
