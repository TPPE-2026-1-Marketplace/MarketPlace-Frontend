import { X } from "lucide-react";
import type { Banner } from "@/context/BannerContext";
import { cn } from "@/lib/utils";
import { BannerThumbnail } from "./BannerThumbnail";

/** Modal de pré-visualização contextual do banner no formato Hero da vitrine. */
export function BannerPreviewModal({
  banner,
  onClose,
}: Readonly<{
  banner: Banner;
  onClose: () => void;
}>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[var(--overlay)] p-4">
      <div className="relative flex min-h-[260px] w-full max-w-3xl flex-col justify-end overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)] shadow-lg sm:aspect-[16/7] sm:min-h-[320px]">
        <div className="pointer-events-none absolute inset-0">
          <BannerThumbnail
            src={banner.image}
            alt={banner.title}
            iconClassName="size-12 text-[var(--foreground-muted)]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/25 sm:bg-gradient-to-r sm:from-black/80 sm:via-black/45 sm:to-black/10" />

        <div className="relative z-10 mt-auto flex flex-col justify-end p-4 pt-14 sm:p-8 sm:pt-16">
          <div className="max-w-md">
            {banner.tag && (
              <p className="mb-1.5 font-sans text-[11px] font-medium tracking-[1.5px] text-[var(--color-white)]/85 uppercase sm:mb-2 sm:text-xs sm:tracking-[2px]">
                {banner.tag}
              </p>
            )}
            <h3 className="mb-1.5 font-serif text-lg leading-snug text-[var(--color-white)] sm:mb-2 sm:text-2xl sm:leading-tight">
              {banner.title || "Título do banner"}
            </h3>
            {banner.subtitle && (
              <p className="mb-3 line-clamp-3 font-sans text-xs leading-relaxed text-[var(--color-white)]/85 sm:mb-4 sm:line-clamp-2">
                {banner.subtitle}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {banner.primaryCta && (
                <span className="rounded-[var(--radius-sm)] bg-[var(--background-card)] px-3.5 py-1.5 text-xs font-medium text-[var(--foreground)] sm:px-5 sm:py-2">
                  {banner.primaryCta}
                </span>
              )}
              {banner.secondaryCta && (
                <span className="rounded-[var(--radius-sm)] border border-[var(--color-white)]/45 bg-black/25 px-3.5 py-1.5 text-xs font-medium text-[var(--color-white)] backdrop-blur-sm sm:px-5 sm:py-2">
                  {banner.secondaryCta}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-black/55 text-[var(--color-white)] transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
          aria-label="Fechar preview"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="absolute top-3 left-3 z-20">
          <span
            className={cn(
              "rounded-[var(--radius-full)] px-2.5 py-1 text-xs font-medium",
              banner.active
                ? "bg-[var(--color-success)] text-[var(--color-white)]"
                : "bg-black/60 text-[var(--color-white)]",
            )}
          >
            {banner.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>
    </div>
  );
}
