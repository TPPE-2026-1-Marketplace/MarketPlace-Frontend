import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Miniatura com fallback visual quando a imagem do banner estiver ausente ou falhar. */
export function BannerThumbnail({
  src,
  alt,
  className,
  iconClassName = "size-6 text-[var(--foreground-muted)]",
}: {
  src: string;
  alt: string;
  className?: string;
  iconClassName?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const trimmed = src.trim();
  const canShowImage = Boolean(trimmed) && failedSrc !== trimmed;

  if (!canShowImage) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-[var(--background-secondary)]",
          className,
        )}
      >
        <ImageIcon className={iconClassName} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={trimmed}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      onError={() => setFailedSrc(trimmed)}
    />
  );
}

/** Selo de status indicando se o banner está ativo ou inativo no carrossel. */
export function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium",
        active
          ? "bg-[var(--color-success)]/15 text-[var(--color-success-text)]"
          : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]",
      )}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}
