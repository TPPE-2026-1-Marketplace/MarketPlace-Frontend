import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "action"
  | "outline-neutral";
export type ButtonSize = "sm" | "md" | "lg" | "touch";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-brand)] text-[var(--foreground)] hover:bg-[var(--color-brand-light)] active:bg-[var(--color-brand-dark)] shadow-md hover:shadow-lg",
  secondary:
    "bg-[var(--background-elevated)] text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--background-card)]",
  ghost:
    "bg-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-black/5",
  outline:
    "bg-transparent text-[var(--color-brand)] border border-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-[var(--foreground)]",
  // Button/Action do Figma: ação principal preta. A cor do texto leva `!` porque
  // o `a { color: inherit }` global (fora de layer) venceria em links (<Link>).
  action:
    "bg-[var(--action-primary)] text-[var(--color-white)]! hover:bg-[var(--action-primary-hover)]",
  // Button/Outline do Figma: ação secundária com contorno neutro.
  "outline-neutral":
    "bg-[var(--background-card)] text-[var(--foreground)] border border-[var(--border-control)] hover:bg-[var(--background-secondary)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-2.5 text-base",
  lg: "px-8 py-3.5 text-lg",
  // Large do Figma (48px): alvo de toque.
  touch: "h-12 px-8 text-base leading-6",
};

/** Classes do botão, para aplicar o mesmo visual em links (`<Link>`). */
export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-medium tracking-wide",
    "rounded-[var(--radius-md)] transition-all duration-[var(--transition-base)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    (variant === "action" || variant === "outline-neutral") && "tracking-normal",
    // No Loading o botão continua com a cor cheia; só não recebe cliques.
    loading && "disabled:opacity-100",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className,
  );
}
