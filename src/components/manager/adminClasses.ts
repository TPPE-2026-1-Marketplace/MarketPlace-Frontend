/** Card branco com borda do painel (Figma: Indicadores, Busca e filtros, Registros). */
export const adminCardClassName =
  "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)]";

/** Rótulo do "Admin / Campo" (Figma 749:18, Typography/Label/Small). */
export const adminLabelClassName =
  "text-xs leading-4 font-medium tracking-[0.5px] text-[var(--foreground-secondary)]";

/** "Controle" do "Admin / Campo" (Figma 749:19), aplicado a input, select e valor somente leitura. */
export const adminControlClassName = [
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)]",
  "p-3 text-xs leading-[18px] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]",
  "focus:outline-none focus-visible:border-[var(--color-brand)] focus-visible:ring-2 focus-visible:ring-[var(--border-accent)]",
  "disabled:cursor-not-allowed disabled:bg-[var(--background-secondary)] disabled:text-[var(--foreground-muted)]",
].join(" ");

/**
 * "Admin / Botão" (Figma 749:21 e 749:23): sobre o Button "action"/"outline-neutral",
 * com raio pequeno, 12px de respiro, contorno neutro e 180px de largura mínima.
 */
export const adminButtonClassName =
  "min-w-[180px] rounded-[var(--radius-sm)] border border-[var(--border-control)] p-3 text-sm leading-5";
