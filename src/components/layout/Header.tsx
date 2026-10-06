import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ShoppingBag, User, Menu, X, Search, Heart, LogOut, LayoutDashboard, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/context/AuthContext";

type Category = { label: string; param?: "categoria" | "tipo"; value?: string };

// Mesmos parâmetros da listagem de produtos (/produtos?categoria=... e ?tipo=...)
const CATEGORIES: Category[] = [
  { label: "Todos os Vestidos" },
  { label: "Festas", param: "categoria", value: "festa" },
  { label: "Formatura", param: "categoria", value: "formatura" },
  { label: "Casamento", param: "categoria", value: "casamento" },
  { label: "Debutante", param: "categoria", value: "debutante" },
  { label: "Midi", param: "tipo", value: "midi" },
  { label: "Longo", param: "tipo", value: "longo" },
  { label: "Longuete", param: "tipo", value: "longuete" },
];

const categoryPath = (cat: Category) =>
  cat.param ? `/produtos?${cat.param}=${cat.value}` : "/produtos";

const iconProps = { className: "w-5 h-5", strokeWidth: 1.5, "aria-hidden": true } as const;

const actionClass =
  "relative flex items-center justify-center size-11 shrink-0 rounded-[var(--radius-md)] text-[var(--foreground)] hover:bg-[var(--background-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-dark)] transition-colors";

const searchPillClass =
  "flex flex-1 min-w-0 items-center gap-2 px-3 rounded-[var(--radius-full)] bg-[var(--background-secondary)] border border-[var(--border-control)] focus-within:border-[var(--color-brand-dark)] focus-within:shadow-[inset_0_0_0_1px_var(--color-brand-dark)] transition-colors";

export default function Header() {
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("busca") ?? "");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Auth state
  const { user, logout, isManager, isSuperAdmin, isInternalUser } = useAuth();

  const onProducts = location.pathname === "/produtos";

  // O termo da busca acompanha a URL (ex.: ao voltar no histórico)
  const urlQuery = searchParams.get("busca") ?? "";
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape fecha menus abertos e devolve o foco ao botão que os abriu
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (userMenuOpen) {
        setUserMenuOpen(false);
        userButtonRef.current?.focus();
      } else if (menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [userMenuOpen, menuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.trim();
    if (!term && !onProducts) return;

    // Na listagem, mantém os filtros atuais e troca só o termo
    const params = new URLSearchParams(onProducts ? searchParams : undefined);
    if (term) params.set("busca", term);
    else params.delete("busca");
    const query = params.toString();
    navigate(query ? `/produtos?${query}` : "/produtos");
    setMenuOpen(false);
  };

  const isActiveCategory = (cat: Category) => {
    if (!onProducts) return false;
    if (!cat.param) return !searchParams.get("categoria") && !searchParams.get("tipo");
    return searchParams.get(cat.param) === cat.value;
  };

  const handleFavoritesClick = () => {
    if (user) {
      navigate("/favoritos");
    } else {
      navigate("/login");
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  const searchInput = (placeholder: string) => (
    <input
      type="search"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder={placeholder}
      aria-label="Buscar produtos"
      className="flex-1 min-w-0 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
    />
  );

  return (
    <header className="bg-[var(--background-card)] sticky top-0 z-50">
      {/* 1. ANNOUNCEMENT */}
      <div className="bg-[var(--action-primary)] text-[var(--color-white)] flex items-center justify-center text-xs leading-[18px] h-5 lg:h-7">
        <span className="lg:hidden">Compra segura • Entrega no DF</span>
        <span className="hidden lg:inline whitespace-pre">{"Enviamos para todo o DF  |  Compra segura"}</span>
      </div>

      {/* 2. MAIN */}
      <div className="flex items-center justify-between gap-2 lg:gap-8 h-[72px] px-4 lg:px-8">
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile menu */}
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(actionClass, "lg:hidden")}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X {...iconProps} /> : <Menu {...iconProps} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center shrink-0" aria-label="DK Fashion — página inicial">
            {/* index.css força img { height: auto; display: block }: o tamanho vem da largura */}
            <span className="lg:hidden">
              <img src="/dk-logo-mark.svg" alt="" className="w-[72px]" />
            </span>
            <span className="hidden lg:block">
              <img src="/dk-logo.svg" alt="" className="w-[63px]" />
            </span>
          </Link>
        </div>

        {/* Search (desktop) */}
        <form onSubmit={handleSearch} role="search" className={cn(searchPillClass, "hidden lg:flex h-10 text-xs leading-[18px]")}>
          <Search {...iconProps} className="w-5 h-5 shrink-0 text-[var(--foreground)]" />
          {searchInput("Buscar vestidos, ocasiões e estilos...")}
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleFavoritesClick} className={actionClass} aria-label="Favoritos">
            <Heart {...iconProps} />
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              ref={userButtonRef}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={actionClass}
              aria-label="Minha conta"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <User {...iconProps} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-lg py-1 w-52 z-50">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                      {user.role && (
                        <span className="inline-block mt-1.5 bg-[#1a1a1a] text-white text-xs px-2 py-0.5">
                          {user.role === "superadmin"
                            ? "Super Admin"
                            : user.role === "manager"
                            ? "Gerente"
                            : user.role === "employee"
                            ? "Funcionário"
                            : "Cliente"}
                        </span>
                      )}
                    </div>

                    {/* Module navigation for internal users */}
                    {isInternalUser && (
                      <>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                          <p className="text-xs text-gray-400 uppercase tracking-widest">Módulos</p>
                        </div>
                        <Link
                          to="/"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          Loja Online
                        </Link>
                        {(isManager || isSuperAdmin) && (
                          <Link
                            to="/painel"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Painel Gerencial
                          </Link>
                        )}
                        <Link
                          to="/pdv"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Store className="w-4 h-4" />
                          PDV - Vendas Presenciais
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                      </>
                    )}

                    <Link
                      to="/conta"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Minha Conta
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Entrar
                    </Link>
                    <Link
                      to="/login?modo=cadastro"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Criar Conta
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <Link to="/carrinho" data-testid="cart-link" aria-label="Carrinho" className={actionClass}>
            <ShoppingBag {...iconProps} />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 bg-[var(--action-primary)] text-[var(--color-white)] text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center leading-none">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Search (mobile) */}
      <div className="lg:hidden px-4 pt-2 pb-4">
        <form onSubmit={handleSearch} role="search" className={cn(searchPillClass, "h-12 text-base leading-6")}>
          <Search {...iconProps} className="w-5 h-5 shrink-0 text-[var(--foreground)]" />
          {searchInput("Buscar vestidos...")}
        </form>
      </div>

      {/* 3. CATEGORIES (desktop) */}
      <nav
        aria-label="Categorias"
        className="hidden lg:flex items-center justify-center gap-8 h-11 border-t border-[var(--border)] overflow-x-auto"
      >
        {CATEGORIES.map((cat) => {
          const active = isActiveCategory(cat);
          return (
            <Link
              key={cat.label}
              to={categoryPath(cat)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-center h-11 px-3 rounded-[var(--radius-sm)] text-xs leading-[18px] whitespace-nowrap hover:bg-[var(--background-secondary)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--color-brand-dark)] transition-colors",
              )}
            >
              {/* index.css força a { color: inherit }: a cor fica no span */}
              <span className={active ? "text-[var(--color-brand)]" : "text-[var(--foreground)]"}>{cat.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <nav id="mobile-menu" aria-label="Categorias" className="lg:hidden border-t border-[var(--border)] px-4 py-2">
          {CATEGORIES.map((cat) => {
            const active = isActiveCategory(cat);
            return (
              <Link
                key={cat.label}
                to={categoryPath(cat)}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center h-11 px-3 rounded-[var(--radius-sm)] text-sm hover:bg-[var(--background-secondary)] transition-colors",
                )}
              >
                <span className={active ? "text-[var(--color-brand)]" : "text-[var(--foreground)]"}>{cat.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
