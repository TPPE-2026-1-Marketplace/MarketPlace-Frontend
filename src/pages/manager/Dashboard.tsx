import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart2,
  LogOut,
  Menu,
  X,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Users,
  Store,
  Globe,
  ChevronRight,
  Bell,
  Shield,
  Award,
  ChevronDown,
  ShoppingBag,
  Download,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { PRODUCTS, MOCK_ORDERS } from "../../data/products";
import { MOCK_EMPLOYEE_SALES } from "../../data/employees";
import { Inventory } from "./Inventory";
import { Orders } from "./Orders";
import { Reports } from "./Reports";
import { Employees } from "./Employees";
import { Commissions } from "./Commissions";
import { Banners } from "./Banners";
import { POSSales } from "./POSSales";
import { Coupons } from "./Coupons";
import { ClientExport } from "./ClientExport";
const logoImage = "/dk-logo.png";

type Tab = "dashboard" | "estoque" | "pedidos" | "vendas-pdv" | "relatorios" | "usuarios" | "comissoes" | "cupons" | "exportar" | "banners";

export function ManagerDashboard() {
  const { user, logout, isManager, isSuperAdmin, isInternalUser, canEditProducts, canEditUsers, canEditStock } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moduleSwitcherOpen, setModuleSwitcherOpen] = useState(false);

  if (!isInternalUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 text-sm mb-4">
            Você precisa estar logado como funcionário, gerente ou administrador para acessar esta página.
          </p>
          <Link
            to="/login"
            className="bg-[#1a1a1a] text-white px-6 py-2 hover:bg-[#333333] transition-colors text-sm"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const totalRevenue = MOCK_ORDERS.filter((o) => o.status !== "cancelado").reduce(
    (sum, o) => sum + o.total,
    0
  );
  const lowStockProducts = PRODUCTS.filter(
    (p) => p.stockEcommerce + p.stockPhysical <= 5
  );
  const pendingOrders = MOCK_ORDERS.filter((o) => o.status === "pendente").length;
  const totalEcommerceStock = PRODUCTS.reduce((sum, p) => sum + p.stockEcommerce, 0);
  const totalPhysicalStock = PRODUCTS.reduce((sum, p) => sum + p.stockPhysical, 0);

  const totalCommissions = MOCK_EMPLOYEE_SALES.reduce((sum, s) => sum + s.commission, 0);

  const navItems: { key: Tab; label: string; icon: React.ReactNode; requiresPermission?: () => boolean }[] = [
    { key: "dashboard", label: "Visão Geral", icon: <LayoutDashboard className="w-5 h-5" /> },
    { key: "estoque", label: "Estoque", icon: <Package className="w-5 h-5" /> },
    { key: "pedidos", label: "Pedidos", icon: <ShoppingCart className="w-5 h-5" /> },
    { key: "vendas-pdv", label: "Vendas PDV", icon: <Store className="w-5 h-5" /> },
    { key: "relatorios", label: "Relatórios", icon: <BarChart2 className="w-5 h-5" />, requiresPermission: () => isManager },
    { key: "comissoes", label: "Comissões", icon: <Award className="w-5 h-5" /> },
    { key: "cupons", label: "Cupons", icon: <TrendingUp className="w-5 h-5" />, requiresPermission: () => isManager },
    { key: "exportar", label: "Exportar Clientes", icon: <Download className="w-5 h-5" />, requiresPermission: () => isManager },
    { key: "usuarios", label: "Usuários", icon: <Users className="w-5 h-5" />, requiresPermission: () => canEditUsers },
    { key: "banners", label: "Banners", icon: <Globe className="w-5 h-5" />, requiresPermission: () => isManager },
  ];

  const visibleNavItems = navItems.filter((item) => !item.requiresPermission || item.requiresPermission());

  const roleLabel = isSuperAdmin ? "Super Admin" : "Gerente";

  return (
    <div className="flex min-h-screen bg-[#f8f8f8]">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#111111] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="h-10 w-24 overflow-hidden">
            <img
              src={logoImage}
              alt="DK Fashion"
              className="h-full w-full object-contain"
            />
          </div>
          <p className="text-gray-500 text-xs mt-2 tracking-wider">PAINEL GERENCIAL</p>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-700 flex items-center justify-center text-gray-200 text-sm shrink-0">
              {user?.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-gray-200 text-xs truncate">{user?.name}</p>
              <span className="inline-block bg-gray-700 text-gray-300 text-xs px-2 py-0.5 mt-0.5">
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {visibleNavItems.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setTab(item.key);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                tab === item.key
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
              }`}
            >
              {item.icon}
              {item.label}
              {item.key === "pedidos" && pendingOrders > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {pendingOrders}
                </span>
              )}
              {item.key === "estoque" && lowStockProducts.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {lowStockProducts.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-white/10 space-y-0.5">
          <p className="text-xs text-gray-600 uppercase tracking-widest px-3 py-2">Módulos</p>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Loja Online
          </Link>
          <Link
            to="/pdv"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:bg-white/5 hover:text-gray-300 transition-colors"
          >
            <Store className="w-5 h-5" />
            PDV - Vendas
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 hover:bg-red-900/20 hover:text-red-400 transition-colors mt-2"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-gray-900 text-sm">
                {visibleNavItems.find((n) => n.key === tab)?.label}
              </h2>
              <p className="text-gray-400 text-xs">
                {new Date().toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Module Switcher */}
            <div className="relative">
              <button
                onClick={() => setModuleSwitcherOpen(!moduleSwitcherOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Trocar Módulo</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {moduleSwitcherOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setModuleSwitcherOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-lg py-1 w-56 z-50">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs text-gray-400 uppercase tracking-widest">Navegação</p>
                    </div>
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Loja Online
                    </Link>
                    <Link
                      to="/pdv"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Store className="w-4 h-4" />
                      PDV - Vendas Presenciais
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button className="relative p-2 text-gray-400 hover:text-gray-700">
              <Bell className="w-5 h-5" />
              {pendingOrders > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              {isSuperAdmin && <Shield className="w-3.5 h-3.5" />}
              <span>{roleLabel} · DK Fashion</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {tab === "dashboard" && (
            <div className="space-y-6">
              {/* Alerts */}
              {lowStockProducts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-amber-700 text-sm flex-1">
                    <strong>{lowStockProducts.length} produto(s)</strong> com estoque baixo (5 ou menos unidades)
                  </p>
                  <button
                    onClick={() => setTab("estoque")}
                    className="flex items-center gap-1 text-amber-600 text-sm hover:underline shrink-0"
                  >
                    Ver <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Receita Total",
                    value: `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    icon: <DollarSign className="w-4 h-4" />,
                    color: "text-green-700 bg-green-50",
                    sub: "Pedidos confirmados",
                  },
                  {
                    label: "Pedidos Pendentes",
                    value: pendingOrders,
                    icon: <ShoppingCart className="w-4 h-4" />,
                    color: "text-amber-700 bg-amber-50",
                    sub: "Aguardando ação",
                  },
                  {
                    label: "Estoque Online",
                    value: `${totalEcommerceStock} unid.`,
                    icon: <Globe className="w-4 h-4" />,
                    color: "text-gray-700 bg-gray-100",
                    sub: "E-commerce",
                  },
                  {
                    label: "Estoque Loja",
                    value: `${totalPhysicalStock} unid.`,
                    icon: <Store className="w-4 h-4" />,
                    color: "text-gray-700 bg-gray-100",
                    sub: "Loja Física",
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white p-5 border border-gray-100">
                    <div className={`w-9 h-9 ${kpi.color} flex items-center justify-center mb-3`}>
                      {kpi.icon}
                    </div>
                    <p className="text-gray-400 text-xs mb-1">{kpi.label}</p>
                    <p className="text-gray-900 text-lg">{kpi.value}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{kpi.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent orders */}
                <div className="bg-white p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900">Pedidos Recentes</h3>
                    <button
                      onClick={() => setTab("pedidos")}
                      className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                    >
                      Ver todos <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {MOCK_ORDERS.slice(0, 4).map((order) => (
                      <div key={order.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className={`w-2 h-2 shrink-0 ${
                          order.status === "entregue" ? "bg-green-500" :
                          order.status === "enviado" ? "bg-blue-500" :
                          order.status === "confirmado" ? "bg-gray-600" :
                          order.status === "pendente" ? "bg-amber-500" : "bg-red-500"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{order.customer}</p>
                          <p className="text-xs text-gray-400">{order.id}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm text-gray-800">
                            R$ {order.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <span className={`text-xs px-2 py-0.5 ${
                            order.type === "online"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-gray-200 text-gray-700"
                          }`}>
                            {order.type === "online" ? "Online" : "Loja"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low stock */}
                <div className="bg-white p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-900">Alertas de Estoque</h3>
                    <button
                      onClick={() => setTab("estoque")}
                      className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                    >
                      Gerenciar <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {PRODUCTS.slice(0, 5).map((product) => {
                      const total = product.stockEcommerce + product.stockPhysical;
                      const isLow = total <= 5;
                      return (
                        <div key={product.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-10 h-12 object-cover object-top shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">{product.name}</p>
                            <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                              <span>Online: {product.stockEcommerce}</span>
                              <span>Loja: {product.stockPhysical}</span>
                            </div>
                          </div>
                          {isLow && (
                            <span className="shrink-0 bg-red-50 text-red-500 text-xs px-2 py-0.5">
                              Baixo
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Commission summary if superadmin or manager */}
              <div className="bg-white p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900">Resumo de Comissões</h3>
                  <button
                    onClick={() => setTab("comissoes")}
                    className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                  >
                    Ver detalhes <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Total Vendas (Equipe)</p>
                    <p className="text-gray-900">
                      R$ {MOCK_EMPLOYEE_SALES.reduce((s, e) => s + e.amount, 0).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Total Comissões</p>
                    <p className="text-gray-900">
                      R$ {totalCommissions.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="border border-gray-100 p-4">
                    <p className="text-xs text-gray-400 mb-1">Funcionários Ativos</p>
                    <p className="text-gray-900">3 funcionários</p>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white p-5 border border-gray-100">
                <h3 className="text-gray-900 mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Estoque", icon: <Package className="w-5 h-5" />, action: () => setTab("estoque") },
                    { label: "Pedidos", icon: <ShoppingCart className="w-5 h-5" />, action: () => setTab("pedidos") },
                    { label: "Relatórios", icon: <TrendingUp className="w-5 h-5" />, action: () => setTab("relatorios") },
                    { label: "Usuários", icon: <Users className="w-5 h-5" />, action: () => setTab("usuarios") },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={action.action}
                      className="flex flex-col items-center gap-2 p-4 border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                    >
                      <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-gray-200 transition-colors">
                        {action.icon}
                      </div>
                      <span className="text-xs text-gray-600">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "estoque" && <Inventory readOnly={!canEditStock} />}
          {tab === "pedidos" && <Orders />}
          {tab === "vendas-pdv" && <POSSales />}
          {tab === "relatorios" && <Reports />}
          {tab === "comissoes" && <Commissions />}
          {tab === "cupons" && <Coupons />}
          {tab === "exportar" && <ClientExport />}
          {tab === "usuarios" && <Employees />}
          {tab === "banners" && <Banners />}
        </main>
      </div>
    </div>
  );
}