import React from "react";
import Link from "next/link";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--background)] border-t border-[var(--border)]">
      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="border border-white/20 px-4 py-1.5 inline-block">
              <span className="text-lg font-bold tracking-[0.3em] text-white">
                DK FASHION
              </span>
            </div>
            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed max-w-xs">
              Vestidos de festa exclusivos para os momentos mais especiais da sua vida.
              Qualidade e elegância no Distrito Federal.
            </p>
            <div className="flex gap-3 pt-2">
              <a
                href="https://www.instagram.com/dkfashion"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--color-brand)] hover:border-[var(--color-brand)]/50 transition-all duration-[var(--transition-fast)]"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Links — Navegação */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white">
              Navegação
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Início" },
                { href: "/produtos", label: "Coleção" },
                { href: "/produtos?categoria=debutante", label: "Debutante" },
                { href: "/produtos?categoria=formatura", label: "Formatura" },
                { href: "/produtos?categoria=casamento", label: "Casamento" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--foreground-muted)] hover:text-[var(--color-brand-light)] transition-colors duration-[var(--transition-fast)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links — Conta */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white">
              Minha Conta
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/conta", label: "Meus Dados" },
                { href: "/conta", label: "Meus Pedidos" },
                { href: "/carrinho", label: "Carrinho" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--foreground-muted)] hover:text-[var(--color-brand-light)] transition-colors duration-[var(--transition-fast)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-white">
              Contato
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-[var(--foreground-muted)]">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[var(--color-brand)]" />
                <span>Brasília — Distrito Federal</span>
              </li>
              <li>
                <a
                  href="tel:+5561999999999"
                  className="flex items-center gap-2.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--color-brand-light)] transition-colors duration-[var(--transition-fast)]"
                >
                  <Phone size={16} className="shrink-0 text-[var(--color-brand)]" />
                  (61) 99999-9999
                </a>
              </li>
              <li>
                <a
                  href="mailto:contato@dkfashion.com.br"
                  className="flex items-center gap-2.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--color-brand-light)] transition-colors duration-[var(--transition-fast)]"
                >
                  <Mail size={16} className="shrink-0 text-[var(--color-brand)]" />
                  contato@dkfashion.com.br
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[var(--foreground-subtle)]">
            © {currentYear} DK Fashion. Todos os direitos reservados.
          </p>
          <div className="flex gap-6">
            <Link
              href="#"
              className="text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors"
            >
              Termos de Uso
            </Link>
            <Link
              href="#"
              className="text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
