import { useMemo, useState } from "react";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import FilterBar from "@/components/manager/FilterBar";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import UserFormDialog from "@/components/manager/UserFormDialog";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import { formatKpiCount } from "@/components/manager/format";
import Button from "@/components/ui/Button";
import { useAuth, type UserRole } from "@/context/AuthContext";
import { useManagementEmployees } from "@/hooks/useManagementEmployees";
import {
  STAFF_ROLE_LABELS,
  formatCommissionRate,
  mapRoleToFrontend,
  type ApiEmployee,
} from "@/lib/employees";
import { onlyDigits } from "@/lib/utils";

type StatusFilter = "active" | "inactive" | "all";

const STATUS_LABELS: Record<StatusFilter, string> = {
  active: "Ativos",
  inactive: "Inativos",
  all: "Todos",
};

interface UserFilters {
  search: string;
  role: "all" | UserRole;
  status: StatusFilter;
}

// O protótipo abre em "Status: ativos"; "Limpar filtros" mostra todos.
const INITIAL_FILTERS: UserFilters = { search: "", role: "all", status: "active" };
const EMPTY_FILTERS: UserFilters = { search: "", role: "all", status: "all" };

function matchesFilters(employee: ApiEmployee, { search, role, status }: UserFilters) {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const digits = onlyDigits(term);
  const matchesSearch =
    !term ||
    employee.person.nome.toLocaleLowerCase("pt-BR").includes(term) ||
    employee.person.email.toLocaleLowerCase("pt-BR").includes(term) ||
    (digits.length > 0 && employee.cpf.includes(digits));
  return (
    matchesSearch &&
    (role === "all" || mapRoleToFrontend(employee.role_perfil) === role) &&
    (status === "all" || employee.ativo === (status === "active"))
  );
}

/** Usuários internos do painel (Figma 755:2102 / 755:2443). */
export function Employees() {
  const { user, isSuperAdmin } = useAuth();
  const { employees, isLoading, error, refetch, createEmployee, updateEmployee } = useManagementEmployees();
  const [draft, setDraft] = useState<UserFilters>(INITIAL_FILTERS);
  const [filters, setFilters] = useState<UserFilters>(INITIAL_FILTERS);
  // undefined = fechado; null = novo cadastro.
  const [selected, setSelected] = useState<ApiEmployee | null | undefined>(undefined);

  // Clientes ficam fora; o gerente não vê administradores (como na tela anterior).
  const staff = useMemo(
    () =>
      employees.filter((employee) => {
        const role = mapRoleToFrontend(employee.role_perfil);
        return role !== "customer" && (isSuperAdmin || role !== "superadmin");
      }),
    [employees, isSuperAdmin],
  );
  const filteredStaff = useMemo(
    () => staff.filter((employee) => matchesFilters(employee, filters)).sort((a, b) => a.person.nome.localeCompare(b.person.nome, "pt-BR")),
    [staff, filters],
  );
  const countActive = (role: UserRole) =>
    staff.filter((employee) => employee.ativo && mapRoleToFrontend(employee.role_perfil) === role).length;
  const roleOptions: UserRole[] = isSuperAdmin ? ["employee", "cashier", "manager", "superadmin"] : ["employee", "cashier", "manager"];

  const columns: RecordColumn<ApiEmployee>[] = [
    {
      key: "usuario",
      header: "Usuário",
      primary: true,
      render: (employee) => (employee.cpf === user?.id ? `${employee.person.nome} (você)` : employee.person.nome),
    },
    { key: "perfil", header: "Perfil", render: (employee) => STAFF_ROLE_LABELS[mapRoleToFrontend(employee.role_perfil)] },
    { key: "contato", header: "Contato", render: (employee) => employee.person.email },
    { key: "codigo", header: "Cód. vendedor", render: (employee) => employee.codigo_funcionario || "—" },
    {
      key: "comissao",
      header: "Comissão",
      render: (employee) =>
        mapRoleToFrontend(employee.role_perfil) === "employee" ? formatCommissionRate(employee.taxa_comissao) : "—",
    },
    { key: "status", header: "Status", render: (employee) => (employee.ativo ? "Ativo" : "Inativo") },
    {
      key: "acao",
      header: "Ação",
      hideMobileLabel: true,
      render: (employee) => (
        <Button
          variant="outline-neutral"
          size="sm"
          className={`${adminButtonClassName} min-w-[128px] whitespace-nowrap`}
          onClick={() => setSelected(employee)}
          aria-label={`${isSuperAdmin ? "Editar" : "Ver"} usuário ${employee.person.nome}`}
        >
          {isSuperAdmin ? "Editar usuário" : "Ver usuário"}
        </Button>
      ),
    },
  ];

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  return (
    <>
      <AdminPageHeader
        title="Usuários"
        description="Gerencie os acessos e os perfis da equipe."
        action={
          isSuperAdmin && (
            <Button variant="action" size="sm" className={adminButtonClassName} onClick={() => setSelected(null)}>
              Novo usuário
            </Button>
          )
        }
      />

      {isLoading && employees.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <KpiGrid>
            <KpiCard label="Funcionários" value={formatKpiCount(countActive("employee"))} help="Vendedores ativos" />
            <KpiCard label="Gerentes" value={formatKpiCount(countActive("manager"))} help="Gerentes ativos" />
            <KpiCard label="Caixas" value={formatKpiCount(countActive("cashier"))} help="Caixas ativos" />
            <KpiCard
              label="Ativos"
              value={formatKpiCount(staff.filter((employee) => employee.ativo).length)}
              help="Toda a equipe com acesso"
            />
          </KpiGrid>

          <FilterBar onApply={() => setFilters(draft)}>
            <AdminField label="Buscar nome, e-mail ou CPF" htmlFor="users-search">
              <input
                id="users-search"
                type="search"
                value={draft.search}
                onChange={(event) => setDraft({ ...draft, search: event.target.value })}
                placeholder="Ex.: Ana, ana@dkfashion.com.br ou 123.456.789-00"
                className={adminControlClassName}
              />
            </AdminField>
            <AdminField
              label={`Perfil: ${draft.role === "all" ? "todos" : STAFF_ROLE_LABELS[draft.role].toLocaleLowerCase("pt-BR")}`}
              htmlFor="users-role"
            >
              <select
                id="users-role"
                value={draft.role}
                onChange={(event) => setDraft({ ...draft, role: event.target.value as UserFilters["role"] })}
                className={adminControlClassName}
              >
                <option value="all">Todos</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {STAFF_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label={`Status: ${STATUS_LABELS[draft.status].toLocaleLowerCase("pt-BR")}`} htmlFor="users-status">
              <select
                id="users-status"
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as StatusFilter })}
                className={adminControlClassName}
              >
                {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((value) => (
                  <option key={value} value={value}>
                    {STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </AdminField>
          </FilterBar>

          {filteredStaff.length === 0 ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <RecordsTable
              key={JSON.stringify(filters)}
              title="Registros recentes"
              columns={columns}
              rows={filteredStaff}
              getRowKey={(employee) => employee.cpf}
            />
          )}
        </>
      )}

      <AccessNotice />

      <UserFormDialog
        open={selected !== undefined}
        employee={selected ?? null}
        readOnly={!isSuperAdmin}
        currentUserCpf={user?.id}
        onClose={() => setSelected(undefined)}
        onCreate={createEmployee}
        onUpdate={updateEmployee}
      />
    </>
  );
}
