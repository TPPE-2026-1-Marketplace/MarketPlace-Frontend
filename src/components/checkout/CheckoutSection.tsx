import React from "react";
import { cn } from "@/lib/utils";

interface CheckoutSectionProps {
  id: string;
  title: string;
  /** Subtítulo do desktop; `mobileSubtitle` substitui abaixo de lg (textos do Figma mobile). */
  subtitle: string;
  mobileSubtitle?: string;
  className?: string;
  children: React.ReactNode;
}

/** Card das seções do checkout (Dados de contato, Entrega, Pagamento). */
export default function CheckoutSection({
  id,
  title,
  subtitle,
  mobileSubtitle,
  className,
  children,
}: CheckoutSectionProps) {
  const headingId = `${id}-titulo`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "flex scroll-mt-44 flex-col gap-[15px] border border-[var(--border)] bg-[var(--background-card)] p-4 lg:p-6",
        className,
      )}
    >
      <h2 id={headingId} className="font-serif text-2xl leading-[31px] font-normal text-[var(--foreground)]">
        {title}
      </h2>
      <p className="text-sm leading-[22px] text-[var(--foreground-muted)]">
        {mobileSubtitle ? (
          <>
            <span className="lg:hidden">{mobileSubtitle}</span>
            <span className="hidden lg:inline">{subtitle}</span>
          </>
        ) : (
          subtitle
        )}
      </p>
      {children}
    </section>
  );
}
