
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, User, Menu, X, Search, Heart, LogOut, LayoutDashboard, Store, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/context/AuthContext";

const MAIN_CATEGORIES = [
  { label: "Festa", path: "/produtos?categoria=festa" },
  { label: "Formatura", path: "/produtos?categoria=formatura" },
  { label: "Casamento", path: "/produtos?categoria=casamento" },
  { label: "Debutante", path: "/produtos?categoria=debutante" },
];

const TYPE_CATEGORIES = [
  { label: "Midi", path: "/produtos?tipo=midi" },
  { label: "Longo", path: "/produtos?tipo=longo" },
  { label: "Longuete", path: "/produtos?tipo=longuete" },
];

export default function Header() {
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Auth state
  const { user, isAuthenticated, logout, isManager, isSuperAdmin, isInternalUser } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/produtos?busca=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMenuOpen(false);
    }
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

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
      {/* 1. TOP BAR */}
      <div className="bg-[#1a1a1a] text-white text-center py-2 text-xs tracking-widest">
        Enviamos para todo o DF&nbsp;&nbsp;|&nbsp;&nbsp;Compra segura
      </div>

      {/* 2. MAIN HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 h-16">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-gray-600 shrink-0"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center">
            <div className="bg-[#1a1a1a] px-3 py-1 flex flex-col items-center justify-center">
              <span className="text-white font-serif text-lg leading-none tracking-widest">DK</span>
              <span className="text-white text-[8px] tracking-[0.2em] uppercase leading-none mt-0.5">Fashion</span>
            </div>
          </Link>

          {/* Central search bar (desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex flex-1 max-w-xl mx-auto relative"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar vestidos..."
              className="w-full border border-gray-200 bg-gray-50 px-5 py-2.5 pr-12 focus:outline-none focus:border-[#1a1a1a] text-sm transition-colors text-[var(--foreground)]"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 h-full px-4 text-gray-500 hover:text-[#1a1a1a] transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Icons */}
          <div className="flex items-center gap-0.5 ml-auto lg:ml-0">
            <button
              onClick={handleFavoritesClick}
              className="p-2.5 text-gray-600 hover:text-[#1a1a1a] active:scale-95 transition-all"
              aria-label="Favoritos"
            >
              <Heart className="w-5 h-5" />
            </button>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2.5 text-gray-600 hover:text-[#1a1a1a] transition-colors flex items-center gap-1.5"
              >
                <User className="w-5 h-5" />
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
            <Link
              to="/carrinho"
              className="relative p-2.5 text-gray-600 hover:text-[#1a1a1a] transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1a1a1a] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* 3. CATEGORY MENU (desktop) */}
        <nav className="hidden lg:flex items-center justify-center gap-0 border-t border-gray-100 overflow-x-auto">
          <Link
            to="/produtos"
            className="px-4 py-3 text-xs tracking-widest uppercase text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Todos os Vestidos
          </Link>

          <span className="text-gray-200 text-sm px-1">|</span>

          {MAIN_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              to={cat.path}
              className="px-4 py-3 text-xs tracking-widest uppercase text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              {cat.label}
            </Link>
          ))}

          <span className="text-gray-200 text-sm px-1">|</span>

          {TYPE_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              to={cat.path}
              className="px-4 py-3 text-xs tracking-widest uppercase text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              {cat.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 pb-4">
          <div className="px-4 pt-4 pb-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar vestidos..."
                className="w-full border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 focus:outline-none focus:border-[#1a1a1a] text-sm text-[var(--foreground)]"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
          <div className="px-4 space-y-0.5">
            <Link
              to="/produtos"
              onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-sm text-gray-700 hover:text-[#1a1a1a] border-b border-gray-50 tracking-wide"
            >
              Todos os Vestidos
            </Link>
            <p className="text-xs text-gray-400 uppercase tracking-widest pt-3 pb-1">Coleções</p>
            {MAIN_CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                to={cat.path}
                onClick={() => setMenuOpen(false)}
                className="block py-2 pl-2 text-sm text-gray-600 hover:text-[#1a1a1a]"
              >
                {cat.label}
              </Link>
            ))}
            <p className="text-xs text-gray-400 uppercase tracking-widest pt-3 pb-1">Comprimento</p>
            {TYPE_CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                to={cat.path}
                onClick={() => setMenuOpen(false)}
                className="block py-2 pl-2 text-sm text-gray-500 hover:text-[#1a1a1a]"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
