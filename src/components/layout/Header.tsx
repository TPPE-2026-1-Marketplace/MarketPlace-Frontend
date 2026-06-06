"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, User, Menu, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { itemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/produtos", label: "Coleção" },
    { href: "/produtos?categoria=debutante", label: "Debutante" },
    { href: "/produtos?categoria=formatura", label: "Formatura" },
    { href: "/produtos?categoria=casamento", label: "Casamento" },
    { href: "/produtos?categoria=festa", label: "Festa" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-[var(--transition-base)]",
        isScrolled
          ? "glass py-3 shadow-lg"
          : "bg-transparent py-5",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-2"
          >
            <div className="border border-white/20 px-4 py-1.5 transition-all duration-[var(--transition-base)] group-hover:border-[var(--color-brand)]/50 group-hover:shadow-[var(--shadow-glow)]">
              <span className="text-lg font-bold tracking-[0.3em] text-white">
                DK FASHION
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative text-sm font-medium tracking-[0.1em] uppercase text-white/70 transition-colors duration-[var(--transition-fast)] hover:text-white after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-0 after:bg-[var(--color-brand)] after:transition-all after:duration-[var(--transition-base)] hover:after:w-full"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-all duration-[var(--transition-fast)]"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            <Link
              href="/conta"
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-all duration-[var(--transition-fast)]"
              aria-label="Minha conta"
            >
              <User size={20} />
            </Link>

            <Link
              href="/carrinho"
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-all duration-[var(--transition-fast)]"
              aria-label="Carrinho"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-brand)] text-[10px] font-bold text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {/* Mobile toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex lg:hidden items-center justify-center w-10 h-10 rounded-full text-white/70 hover:text-white hover:bg-white/5 transition-all duration-[var(--transition-fast)]"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-[var(--transition-base)]",
          isMobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="glass mx-4 mt-3 rounded-[var(--radius-lg)] p-4 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium tracking-[0.1em] uppercase text-white/70 hover:text-white hover:bg-white/5 rounded-[var(--radius-md)] transition-all duration-[var(--transition-fast)]"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-[var(--border)] mt-2 pt-2 flex gap-2">
            <Link
              href="/conta"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-[var(--radius-md)] transition-all"
            >
              <User size={16} />
              Conta
            </Link>
            <Link
              href="/carrinho"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-[var(--radius-md)] transition-all"
            >
              <ShoppingBag size={16} />
              Carrinho
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
