import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  User,
  Shield,
  Users,
  Mail,
  Phone,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { useAuth, ManagedUser, UserRole } from "../../context/AuthContext";
import { MOCK_EMPLOYEE_SALES } from "../../data/employees";

type Tab = "list" | "add" | "edit";

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Super Admin",
  manager: "Gerente",
  employee: "Funcionário",
  customer: "Cliente",
};

const ROLE_COLORS: Record<UserRole, string> = {
  superadmin: "bg-gray-900 text-white",
  manager: "bg-gray-700 text-white",
  employee: "bg-gray-200 text-gray-800",
  customer: "bg-gray-100 text-gray-600",
};

export function Employees() {
  const { users, user: currentUser, addUser, updateUser, deleteUser, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("list");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [detailUser, setDetailUser] = useState<ManagedUser | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const canManageManagers = isSuperAdmin;

  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    phone: string;
    sellerCode: string;
    role: UserRole;
    commissionRate: string;
    salesTarget: string;
    bonusEnabled: boolean;
    bonusAmount: string;
    active: boolean;
  }>({
    name: "",
    email: "",
    password: "",
    phone: "",
    sellerCode: "",
    role: "employee",
    commissionRate: "5",
    salesTarget: "20000",
    bonusEnabled: true,
    bonusAmount: "500",
    active: true,
  });

  const filteredUsers = users.filter((u) => {
    if (u.role === "customer") return false; // Don't show customers
    if (!canManageManagers && u.role === "superadmin") return false;
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    return true;
  });

  const availableRoles: UserRole[] = canManageManagers
    ? ["superadmin", "manager", "employee"]
    : ["employee"];

  const resetForm = () => {
    setForm({
      name: "", email: "", password: "", phone: "", sellerCode: "",
      role: "employee", commissionRate: "5", salesTarget: "20000",
      bonusEnabled: true, bonusAmount: "500", active: true,
    });
    setEditingUser(null);
    setShowPassword(false);
  };

  const openEdit = (u: ManagedUser) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      password: u.password,
      phone: u.phone || "",
      sellerCode: u.sellerCode || "",
      role: u.role,
      commissionRate: String(u.commissionRate || 5),
      salesTarget: String(u.salesTarget || 20000),
      bonusEnabled: u.bonusEnabled ?? true,
      bonusAmount: String(u.bonusAmount || 500),
      active: u.active,
    });
    setActiveTab("edit");
  };

  const handleSave = () => {
    if (!form.name || !form.email || !form.password) {
      setMsg({ type: "error", text: "Preencha todos os campos obrigatórios." });
      return;
    }

    // Validate seller code for employees
    if (form.role === "employee") {
      if (!form.sellerCode.trim()) {
        setMsg({ type: "error", text: "Código do vendedor é obrigatório para funcionários." });
        return;
      }
      // Check uniqueness
      const isDuplicate = users.some((u) =>
        u.sellerCode === form.sellerCode && u.id !== editingUser?.id
      );
      if (isDuplicate) {
        setMsg({ type: "error", text: "Este código de vendedor já está em uso." });
        return;
      }
    }

    if (editingUser) {
      const result = updateUser(editingUser.id, {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        sellerCode: form.role === "employee" ? form.sellerCode : undefined,
        role: form.role,
        commissionRate: form.role === "employee" ? Number(form.commissionRate) : undefined,
        salesTarget: form.role === "employee" ? Number(form.salesTarget) : undefined,
        bonusEnabled: form.role === "employee" ? form.bonusEnabled : undefined,
        bonusAmount: form.role === "employee" ? Number(form.bonusAmount) : undefined,
        active: form.active,
      });
      setMsg({ type: result.success ? "success" : "error", text: result.message });
    } else {
      const result = addUser({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        sellerCode: form.role === "employee" ? form.sellerCode : undefined,
        role: form.role,
        commissionRate: form.role === "employee" ? Number(form.commissionRate) : undefined,
        salesTarget: form.role === "employee" ? Number(form.salesTarget) : undefined,
        bonusEnabled: form.role === "employee" ? form.bonusEnabled : undefined,
        bonusAmount: form.role === "employee" ? Number(form.bonusAmount) : undefined,
        active: form.active,
      });
      setMsg({ type: result.success ? "success" : "error", text: result.message });
      if (result.success) resetForm();
    }
    if (editingUser) {
      resetForm();
      setActiveTab("list");
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDelete = (u: ManagedUser) => {
    if (u.id === currentUser?.id) {
      setMsg({ type: "error", text: "Não é possível remover o próprio usuário." });
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    if (confirm(`Remover ${u.name}?`)) {
      const result = deleteUser(u.id);
      setMsg({ type: result.success ? "success" : "error", text: result.message });
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const getSalesForEmployee = (employeeId: string) => {
    return MOCK_EMPLOYEE_SALES.filter((s) => s.employeeId === employeeId);
  };

  const getEmployeeTotal = (employeeId: string) => {
    return getSalesForEmployee(employeeId).reduce((sum, s) => sum + s.amount, 0);
  };

  const FormSection = () => (
    <div className="bg-white border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-gray-900">
          {editingUser ? `Editar: ${editingUser.name}` : "Novo Usuário"}
        </h3>
        <button
          onClick={() => { resetForm(); setActiveTab("list"); }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nome Completo *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
            placeholder="Ex: Ana Silva"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">E-mail *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
            placeholder="usuario@dkfestas.com.br"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Senha *</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[#1a1a1a]"
              placeholder="Senha de acesso"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Telefone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
            placeholder="(11) 99999-0000"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Perfil</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        {form.role === "employee" && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Código do Vendedor *{" "}
              <span className="text-amber-600">
                <AlertTriangle className="inline w-3 h-3 -mt-0.5" />
              </span>
            </label>
            <input
              type="text"
              value={form.sellerCode}
              onChange={(e) => setForm({ ...form, sellerCode: e.target.value.toUpperCase() })}
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] font-mono"
              placeholder="Ex: ANA01"
              maxLength={20}
            />
            <p className="text-xs text-gray-400 mt-1">
              Este código será usado para identificar vendas e calcular comissão automaticamente.
            </p>
          </div>
        )}
        <div className="flex items-center gap-3 pt-5">
          <input
            type="checkbox"
            id="active"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="accent-[#1a1a1a] w-4 h-4"
          />
          <label htmlFor="active" className="text-sm text-gray-600">Usuário ativo</label>
        </div>

        {/* Commission fields - only for employees */}
        {form.role === "employee" && (
          <>
            <div className="col-span-full">
              <div className="border-t border-gray-100 my-2 pt-4">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Configurações de Comissão</p>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Taxa de Comissão (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  min="0"
                  max="30"
                  step="0.5"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Meta de Vendas (R$)</label>
              <input
                type="number"
                value={form.salesTarget}
                onChange={(e) => setForm({ ...form, salesTarget: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                min="0"
                step="1000"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valor do Bônus (R$)</label>
              <input
                type="number"
                value={form.bonusAmount}
                onChange={(e) => setForm({ ...form, bonusAmount: e.target.value })}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                min="0"
                step="50"
              />
            </div>
            <div className="flex items-center gap-3 pt-4">
              <input
                type="checkbox"
                id="bonusEnabled"
                checked={form.bonusEnabled}
                onChange={(e) => setForm({ ...form, bonusEnabled: e.target.checked })}
                className="accent-[#1a1a1a] w-4 h-4"
              />
              <label htmlFor="bonusEnabled" className="text-sm text-gray-600">
                Programa de bônus por meta ativo
              </label>
            </div>
          </>
        )}
      </div>

      {msg && (
        <div className={`mt-4 p-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={() => { resetForm(); setActiveTab("list"); }}
          className="flex-1 border border-gray-200 text-gray-600 py-2 text-sm hover:border-gray-400 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-[#1a1a1a] text-white py-2 text-sm hover:bg-[#333333] transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {editingUser ? "Salvar Alterações" : "Cadastrar Usuário"}
        </button>
      </div>
    </div>
  );

  const staffUsers = filteredUsers;
  const employeeCount = users.filter((u) => u.role === "employee").length;
  const managerCount = users.filter((u) => u.role === "manager").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Gestão de Usuários</h2>
          <p className="text-gray-500 text-sm">
            {employeeCount} funcionário(s) · {managerCount} gerente(s)
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setActiveTab("add"); }}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2.5 hover:bg-[#333333] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Novo Usuário
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Funcionários", value: employeeCount, icon: <Users className="w-4 h-4" />, color: "text-gray-700 bg-gray-100" },
          { label: "Gerentes", value: managerCount, icon: <Shield className="w-4 h-4" />, color: "text-gray-700 bg-gray-100" },
          { label: "Total", value: staffUsers.length, icon: <User className="w-4 h-4" />, color: "text-gray-700 bg-gray-100" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${stat.color} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-gray-900 text-lg">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Role filter */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "superadmin", "manager", "employee"] as const).filter(r =>
          r === "all" || canManageManagers || r === "employee"
        ).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r as any)}
            className={`px-3 py-1 text-xs transition-colors border ${
              roleFilter === r
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {r === "all" ? "Todos" : ROLE_LABELS[r as UserRole]}
          </button>
        ))}
      </div>

      {/* Add / Edit form */}
      {(activeTab === "add" || activeTab === "edit") && <FormSection />}

      {msg && activeTab === "list" && (
        <div className={`p-3 text-sm ${msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Users table */}
      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs">
                <th className="text-left px-4 py-3">Usuário</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Perfil</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Contato</th>
                <th className="text-center px-4 py-3 hidden lg:table-cell">Cód. Vendedor</th>
                <th className="text-center px-4 py-3 hidden lg:table-cell">Comissão</th>
                <th className="text-center px-4 py-3 hidden lg:table-cell">Status</th>
                <th className="text-center px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staffUsers.map((u) => {
                const totalSales = getEmployeeTotal(u.id);
                const isCurrent = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 flex items-center justify-center shrink-0 text-gray-600 text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-gray-900 truncate max-w-36">
                            {u.name}
                            {isCurrent && (
                              <span className="ml-1 text-xs text-gray-400">(você)</span>
                            )}
                          </p>
                          <p className="text-gray-400 text-xs truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-block text-xs px-2 py-0.5 ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />{u.email}
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />{u.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {u.role === "employee" && u.sellerCode ? (
                        <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-0.5">
                          {u.sellerCode}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {u.role === "employee" ? (
                        <div>
                          <p className="text-gray-700 text-xs">{u.commissionRate}%</p>
                          {totalSales > 0 && (
                            <p className="text-gray-400 text-xs">
                              R$ {totalSales.toLocaleString("pt-BR")} em vendas
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className={`text-xs px-2 py-0.5 ${u.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>
                        {u.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDetailUser(detailUser?.id === u.id ? null : u)}
                          className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Ver detalhes"
                        >
                          <User className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {staffUsers.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>
      </div>

      {/* User detail expanded */}
      {detailUser && (
        <div className="bg-white border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">{detailUser.name}</h3>
            <button onClick={() => setDetailUser(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2.5 text-sm">
              <p><span className="text-gray-400">Perfil:</span> <span className={`inline-block text-xs px-2 py-0.5 ml-1 ${ROLE_COLORS[detailUser.role]}`}>{ROLE_LABELS[detailUser.role]}</span></p>
              <p className="text-gray-600"><span className="text-gray-400">E-mail:</span> {detailUser.email}</p>
              <p className="text-gray-600"><span className="text-gray-400">Telefone:</span> {detailUser.phone || "—"}</p>
              <p className="text-gray-600"><span className="text-gray-400">Cadastrado em:</span> {new Date(detailUser.createdAt).toLocaleDateString("pt-BR")}</p>
              <p><span className="text-gray-400">Status:</span> <span className={`text-xs ml-1 px-2 py-0.5 ${detailUser.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"}`}>{detailUser.active ? "Ativo" : "Inativo"}</span></p>
            </div>
            {detailUser.role === "employee" && (
              <div className="border border-gray-100 p-4 space-y-2.5 text-sm">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Comissão</p>
                <p className="text-gray-600">
                  <span className="text-gray-400">Código Vendedor:</span>{" "}
                  <span className="font-mono text-gray-900">{detailUser.sellerCode || "—"}</span>
                </p>
                <p className="text-gray-600"><span className="text-gray-400">Taxa:</span> {detailUser.commissionRate}%</p>
                <p className="text-gray-600"><span className="text-gray-400">Meta:</span> R$ {Number(detailUser.salesTarget).toLocaleString("pt-BR")}</p>
                <p className="text-gray-600">
                  <span className="text-gray-400">Bônus:</span>{" "}
                  {detailUser.bonusEnabled ? (
                    <span className="text-green-700">R$ {Number(detailUser.bonusAmount).toLocaleString("pt-BR")} (ativo)</span>
                  ) : (
                    <span className="text-gray-400">Desativado</span>
                  )}
                </p>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-600">
                    <span className="text-gray-400">Total vendido:</span>{" "}
                    R$ {getEmployeeTotal(detailUser.id).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-gray-600">
                    <span className="text-gray-400">Progresso da meta:</span>{" "}
                    {detailUser.salesTarget
                      ? `${Math.min(100, Math.round((getEmployeeTotal(detailUser.id) / detailUser.salesTarget) * 100))}%`
                      : "—"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
