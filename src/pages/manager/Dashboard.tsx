import { Link, useLocation, useNavigate } from "react-router-dom";
import AdminField from "@/components/manager/AdminField";
import AdminPanel from "@/components/manager/AdminPanel";
import AdminShell from "@/components/manager/AdminShell";
import type { AdminNavItem } from "@/components/manager/AdminNav";
import { adminButtonClassName } from "@/components/manager/adminClasses";
import { buttonClassName } from "@/components/ui/button-variants";
import { useAuth, type UserRole } from "../../context/AuthContext";
import { Inventory } from "./Inventory";
import { Orders } from "./Orders";
import { Overview } from "./Overview";
import { Reports } from "./Reports";
import { Employees } from "./Employees";
import { Commissions } from "./Commissions";
import { Banners } from "./Banners";
import { POSSales } from "./POSSales";
import { Coupons } from "./Coupons";
import { ClientExport } from "./ClientExport";

type Tab = "dashboard" | "estoque" | "pedidos" | "vendas-pdv" | "relatorios" | "usuarios" | "comissoes" | "cupons" | "exportar" | "banners";

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Administrador",
  manager: "Gerente",
  employee: "Vendedor",
  cashier: "Caixa",
  customer: "Cliente",
};

/** "Acesso restrito" no formato do frame "Fluxo / access" (755:6068). */
function RestrictedAccess() {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-[var(--background-store)] p-4 md:p-8">
      <p className="text-sm leading-5 font-medium text-[var(--foreground-secondary)]">DK Fashion / Gestão</p>
      <AdminPanel
        title="Acesso restrito"
        actions={
          <>
            <Link to="/login" className={buttonClassName({ variant: "action", size: "sm", className: adminButtonClassName })}>
              Fazer login
            </Link>
            <Link to="/" className={buttonClassName({ variant: "outline-neutral", size: "sm", className: adminButtonClassName })}>
              Voltar à loja
            </Link>
          </>
        }
      >
        <AdminField label="Perfil" value="Sem permissão para acessar o painel gerencial" />
        <AdminField label="Orientação" value="Entre com um perfil de funcionário, gerente ou administrador" />
      </AdminPanel>
    </div>
  );
}

export function ManagerDashboard() {
  const { user, logout, isManager, isSuperAdmin, isInternalUser, canEditUsers, canEditStock } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathPart = location.pathname.split("/")[2];
  const tab: Tab = (pathPart as Tab) || "dashboard";
  const setTab = (newTab: Tab) => {
    navigate(newTab === "dashboard" ? "/painel" : `/painel/${newTab}`);
  };

  if (!isInternalUser || !user) {
    return <RestrictedAccess />;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Ordem e rótulos do "Menu administrativo" do Figma, só com as abas que existem.
  const navItems: (AdminNavItem<Tab> & { requiresPermission?: () => boolean })[] = [
    { key: "dashboard", label: "Visão geral" },
    { key: "estoque", label: "Estoque" },
    { key: "pedidos", label: "Pedidos" },
    { key: "vendas-pdv", label: "Vendas PDV" },
    { key: "relatorios", label: "Relatórios", requiresPermission: () => isManager },
    { key: "usuarios", label: "Usuários", requiresPermission: () => canEditUsers },
    { key: "comissoes", label: "Comissões" },
    { key: "cupons", label: "Cupons", requiresPermission: () => isSuperAdmin },
    { key: "exportar", label: "Clientes", requiresPermission: () => isManager },
    { key: "banners", label: "Banners", requiresPermission: () => isManager },
  ];
  const visibleNavItems = navItems.filter((item) => !item.requiresPermission || item.requiresPermission());

  const period = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }).replace(" de ", " ");
  const periodLabel = period.charAt(0).toLocaleUpperCase("pt-BR") + period.slice(1);

  return (
    <AdminShell
      items={visibleNavItems}
      active={tab}
      onSelect={setTab}
      userName={user.name}
      roleLabel={ROLE_LABELS[user.role]}
      periodLabel={periodLabel}
      onLogout={handleLogout}
    >
      {tab === "dashboard" && <Overview />}
      {tab === "estoque" && <Inventory readOnly={!canEditStock} />}
      {tab === "pedidos" && <Orders />}
      {tab === "vendas-pdv" && <POSSales />}
      {tab === "relatorios" && <Reports />}
      {tab === "comissoes" && <Commissions />}
      {tab === "cupons" && <Coupons />}
      {tab === "exportar" && <ClientExport />}
      {tab === "usuarios" && <Employees />}
      {tab === "banners" && <Banners />}
    </AdminShell>
  );
}
