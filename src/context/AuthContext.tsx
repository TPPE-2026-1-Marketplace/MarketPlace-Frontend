import React, { createContext, useContext, useState, ReactNode } from "react";
import { api, ApiError } from "@/lib/api";

export type UserRole = "customer" | "manager" | "superadmin" | "employee";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  sellerCode?: string;
  commissionRate?: number;
  salesTarget?: number;
  bonusEnabled?: boolean;
  bonusAmount?: number;
  active: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  sellerCode?: string;
  commissionRate?: number;
  salesTarget?: number;
  bonusEnabled?: boolean;
  bonusAmount?: number;
}

/** Shape returned by POST /api/auth/login */
interface LoginApiResponse {
  access_token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    cpf?: string | null;
    telefone?: string | null;
    createdAt: string;
  };
}

/** Shape returned by POST /api/users */
interface RegisterApiResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  cpf?: string | null;
  telefone?: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  users: ManagedUser[];
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isManager: boolean;
  isSuperAdmin: boolean;
  isEmployee: boolean;
  isInternalUser: boolean;
  isAuthenticated: boolean;
  canEditProducts: boolean;
  canEditUsers: boolean;
  canEditStock: boolean;
  canEditOrders: boolean;
  canEditCommissions: boolean;
  canEditBanners: boolean;
  addUser: (userData: Omit<ManagedUser, "id" | "createdAt">) => { success: boolean; message: string };
  updateUser: (id: string, userData: Partial<ManagedUser>) => { success: boolean; message: string };
  deleteUser: (id: string) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INITIAL_USERS: ManagedUser[] = [
  {
    id: "u-001",
    name: "Super Admin DK",
    email: "superadmin@dkfestas.com.br",
    password: "super123",
    role: "superadmin",
    phone: "(11) 99999-0001",
    active: true,
    createdAt: "2024-01-01",
  },
  {
    id: "u-002",
    name: "Gerente DK",
    email: "gerente@dkfestas.com.br",
    password: "gerente123",
    role: "manager",
    phone: "(11) 99999-0000",
    active: true,
    createdAt: "2024-01-15",
  },
  {
    id: "u-003",
    name: "Ana Vendas",
    email: "ana.vendas@dkfestas.com.br",
    password: "ana123",
    role: "employee",
    phone: "(11) 98888-1111",
    sellerCode: "ANA01",
    commissionRate: 5,
    salesTarget: 20000,
    bonusEnabled: true,
    bonusAmount: 500,
    active: true,
    createdAt: "2024-02-01",
  },
  {
    id: "u-004",
    name: "Carlos Moda",
    email: "carlos.moda@dkfestas.com.br",
    password: "carlos123",
    role: "employee",
    phone: "(11) 98888-2222",
    sellerCode: "CARLOS23",
    commissionRate: 4.5,
    salesTarget: 18000,
    bonusEnabled: true,
    bonusAmount: 400,
    active: true,
    createdAt: "2024-03-01",
  },
  {
    id: "u-005",
    name: "Beatriz Estilo",
    email: "beatriz.estilo@dkfestas.com.br",
    password: "beatriz123",
    role: "employee",
    phone: "(11) 98888-3333",
    sellerCode: "BEA05",
    commissionRate: 5.5,
    salesTarget: 22000,
    bonusEnabled: false,
    bonusAmount: 600,
    active: true,
    createdAt: "2024-04-01",
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("dk_user");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      // Corrupt stored session — clear it instead of white-screening the app
      localStorage.removeItem("dk_user");
      return null;
    }
  });
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);

  React.useEffect(() => {
    if (user) {
      localStorage.setItem("dk_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("dk_user");
    }
  }, [user]);

  /**
   * Attempts login via the backend API first.
   * Falls back to the local users list for internal roles (manager, superadmin, employee)
   * that may not exist in the database yet.
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    // 1. Try the real backend API
    try {
      const response = await api.post<LoginApiResponse>("/auth/login", { email, password });

      // Store the JWT token for authenticated API calls
      localStorage.setItem("dk_token", response.access_token);

      const apiUser: User = {
        id: String(response.user.id),
        name: response.user.name,
        email: response.user.email,
        role: (response.user.role as UserRole) || "customer",
        phone: response.user.telefone || undefined,
      };

      setUser(apiUser);
      return { success: true, message: "Login realizado com sucesso!" };
    } catch (err) {
      // If the API is unreachable or returns 401, fall back to local users
      const isApiError = err instanceof ApiError;
      const isUnauthorized = isApiError && err.status === 401;
      const isNetworkError = !isApiError;

      if (isNetworkError) {
        console.warn("Backend indisponível, usando autenticação local como fallback.");
      }

      // 2. Fallback: check local users (for manager/employee/superadmin roles)
      if (isUnauthorized || isNetworkError) {
        const found = users.find(
          (u) => u.email === email && u.password === password && u.active
        );
        if (found) {
          // Generate a mock token for internal users
          localStorage.setItem("dk_token", `local_${found.id}_${Date.now()}`);
          setUser({
            id: found.id,
            name: found.name,
            email: found.email,
            role: found.role,
            phone: found.phone,
            sellerCode: found.sellerCode,
            commissionRate: found.commissionRate,
            salesTarget: found.salesTarget,
            bonusEnabled: found.bonusEnabled,
            bonusAmount: found.bonusAmount,
          });
          return { success: true, message: "Login realizado com sucesso!" };
        }
      }

      return {
        success: false,
        message: isApiError ? err.message : "E-mail ou senha incorretos.",
      };
    }
  };

  /**
   * Registers a new customer account via the backend API.
   * Falls back to local registration if the API is unavailable.
   */
  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string
  ): Promise<{ success: boolean; message: string }> => {
    // 1. Try the real backend API
    try {
      const newUser = await api.post<RegisterApiResponse>("/users", {
        name,
        email,
        password,
        telefone: phone || undefined,
      });

      // Auto-login after registration: call the login endpoint to get a JWT
      try {
        const loginRes = await api.post<LoginApiResponse>("/auth/login", { email, password });
        localStorage.setItem("dk_token", loginRes.access_token);
      } catch {
        // If auto-login fails, the user can log in manually
        localStorage.setItem("dk_token", `registered_${newUser.id}_${Date.now()}`);
      }

      const apiUser: User = {
        id: String(newUser.id),
        name: newUser.name,
        email: newUser.email,
        role: (newUser.role as UserRole) || "customer",
        phone: newUser.telefone || undefined,
      };

      setUser(apiUser);
      return { success: true, message: "Cadastro realizado com sucesso!" };
    } catch (err) {
      const isApiError = err instanceof ApiError;

      // Conflict (email already exists)
      if (isApiError && err.status === 409) {
        return { success: false, message: "E-mail ou CPF já cadastrado." };
      }

      // Validation error
      if (isApiError && err.status === 400) {
        return { success: false, message: err.message || "Dados inválidos. Verifique os campos." };
      }

      // Network error — fallback to local registration
      if (!isApiError) {
        console.warn("Backend indisponível, usando cadastro local como fallback.");

        if (users.some((u) => u.email === email)) {
          return { success: false, message: "E-mail já cadastrado." };
        }

        const localUser: ManagedUser = {
          id: `u-${Date.now()}`,
          name,
          email,
          password,
          role: "customer",
          phone,
          active: true,
          createdAt: new Date().toISOString().split("T")[0],
        };
        setUsers((prev) => [...prev, localUser]);
        localStorage.setItem("dk_token", `local_${localUser.id}_${Date.now()}`);
        setUser({ id: localUser.id, name, email, role: "customer", phone });
        return { success: true, message: "Cadastro realizado com sucesso!" };
      }

      return { success: false, message: isApiError ? err.message : "Erro ao criar conta." };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("dk_token");
    localStorage.removeItem("dk_user");
  };

  const addUser = (userData: Omit<ManagedUser, "id" | "createdAt">) => {
    if (users.some((u) => u.email === userData.email)) {
      return { success: false, message: "E-mail já cadastrado." };
    }
    const newUser: ManagedUser = {
      ...userData,
      id: `u-${Date.now()}`,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newUser]);
    return { success: true, message: "Usuário cadastrado com sucesso!" };
  };

  const updateUser = (id: string, userData: Partial<ManagedUser>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...userData } : u))
    );
    return { success: true, message: "Usuário atualizado com sucesso!" };
  };

  const deleteUser = (id: string) => {
    if (id === user?.id) {
      return { success: false, message: "Não é possível remover o próprio usuário." };
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    return { success: true, message: "Usuário removido com sucesso!" };
  };

  const isManager = user?.role === "manager" || user?.role === "superadmin";
  const isSuperAdmin = user?.role === "superadmin";
  const isEmployee = user?.role === "employee";
  const isInternalUser = isManager || isEmployee;

  // Permission controls
  const canEditProducts = isManager;
  const canEditUsers = isManager;
  const canEditStock = isManager;
  const canEditOrders = isManager;
  const canEditCommissions = isManager;
  const canEditBanners = isManager;

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        register,
        logout,
        isManager,
        isSuperAdmin,
        isEmployee,
        isInternalUser,
        isAuthenticated: !!user,
        canEditProducts,
        canEditUsers,
        canEditStock,
        canEditOrders,
        canEditCommissions,
        canEditBanners,
        addUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
