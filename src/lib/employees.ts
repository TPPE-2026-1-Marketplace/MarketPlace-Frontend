import type { UserRole } from "@/context/AuthContext";

/** Funcionário retornado por GET /employees (com a pessoa do cadastro). */
export interface ApiEmployee {
  cpf: string;
  ativo: boolean;
  role_perfil: string;
  taxa_comissao: string | number;
  meta_vendas: string | number | null;
  codigo_funcionario: string | null;
  person: {
    cpf: string;
    nome: string;
    email: string;
    telefone: string | null;
  };
  createdAt?: string;
}

export const mapRoleToFrontend = (role: string): UserRole => {
  if (role === "administrador") return "superadmin";
  if (role === "gerente") return "manager";
  if (role === "caixa") return "cashier";
  if (role === "cliente") return "customer";
  return "employee";
};

export const mapFrontendToRole = (role: UserRole): string => {
  if (role === "superadmin") return "administrador";
  if (role === "manager") return "gerente";
  if (role === "cashier") return "caixa";
  if (role === "customer") return "cliente";
  return "vendedor";
};

/** Perfis da equipe como aparecem no painel (Figma: "Vendedor", "Caixa", "Gerente"). */
export const STAFF_ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Administrador",
  manager: "Gerente",
  cashier: "Caixa",
  employee: "Vendedor",
  customer: "Cliente",
};

/** "5%" a partir da taxa decimal da API (0.05). */
export function formatCommissionRate(rate: string | number): string {
  return `${(Number(rate) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}
