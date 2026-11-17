import React, { createContext, useContext, useState, ReactNode } from "react";
import { api, ApiError } from "@/lib/api";

export type UserRole = "customer" | "manager" | "superadmin" | "employee" | "cashier";

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
}

const VALID_ROLES = new Set<UserRole>(["customer", "manager", "superadmin", "employee", "cashier"]);

const SENSITIVE_STORAGE_KEYS = [
  "dk_last_order",
  "dk_pending_order",
  "dk_checkout_draft",
  "dk_product_draft",
  "dk_product_wizard_draft_v1",
] as const;

/**
 * Decodifica o payload de um JWT (formato Base64URL) sem validar assinatura.
 * Usado apenas para extrair claims do token emitido pela API.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(window.atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return typeof payload?.exp === "number" && payload.exp * 1000 <= Date.now();
}

function parseStoredUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<User> | null;
    if (!parsed || typeof parsed !== "object" || typeof parsed.id !== "string" || typeof parsed.email !== "string") {
      return null;
    }
    const role: UserRole =
      typeof parsed.role === "string" && VALID_ROLES.has(parsed.role as UserRole)
        ? (parsed.role as UserRole)
        : "customer";
    return { ...parsed, role } as User;
  } catch {
    return null;
  }
}

function clearAuthStorage() {
  localStorage.removeItem("dk_token");
  localStorage.removeItem("dk_user");
  for (const key of SENSITIVE_STORAGE_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

const mapRole = (backendRole: string): UserRole => {
  // Backend usa papéis em português
  if (backendRole === "administrador") return "superadmin";
  if (backendRole === "gerente") return "manager";
  if (backendRole === "caixa") return "cashier";
  if (backendRole === "vendedor") return "employee";
  if (backendRole === "cliente") return "customer";
  // Compatibilidade com papéis em inglês (legado)
  if (backendRole === "superadmin") return "superadmin";
  if (backendRole === "manager") return "manager";
  if (backendRole === "cashier") return "cashier";
  if (backendRole === "employee") return "employee";
  return "customer";
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (name: string, email: string, password: string, phone: string, cpf: string) => Promise<{ success: boolean; message: string }>;
  updateUserProfile: (data: Partial<Pick<User, "name" | "email" | "phone">>) => void;
  logout: () => void;
  isManager: boolean;
  isSuperAdmin: boolean;
  isEmployee: boolean;
  isCashier: boolean;
  isInternalUser: boolean;
  isAuthenticated: boolean;
  canEditProducts: boolean;
  canEditUsers: boolean;
  canEditStock: boolean;
  canEditOrders: boolean;
  canEditCommissions: boolean;
  canEditBanners: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("dk_user");
    const token = localStorage.getItem("dk_token");
    if (isTokenExpired(token)) {
      localStorage.removeItem("dk_token");
      localStorage.removeItem("dk_user");
      return null;
    }
    const parsed = parseStoredUser(stored);
    if (stored && !parsed) {
      // Corrupt stored session — clear it instead of white-screening the app
      localStorage.removeItem("dk_user");
    }
    return parsed;
  });

  React.useEffect(() => {
    if (user) {
      localStorage.setItem("dk_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("dk_user");
    }
  }, [user]);

  /** Authenticates user via the backend API (POST /auth/login) and fetches profile. */
  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post<LoginApiResponse>("/auth/login", { email, senha: password });

      localStorage.setItem("dk_token", response.access_token);

      // Decode JWT to get user info (sub=cpf, email, role)
      const payload = decodeJwtPayload(response.access_token);
      const cpf = (payload?.sub as string) ?? '';
      const role = (payload?.role as string) ?? 'cliente';
      const tokenEmail = (payload?.email as string) ?? email;

      let userName = tokenEmail;
      let userPhone: string | undefined;

      // Fetch full profile from people endpoint
      if (cpf) {
        try {
          const profile = await api.get<{ nome?: string; email?: string; telefone?: string | null }>(`/people/${cpf}`);
          userName = profile.nome ?? tokenEmail;
          userPhone = profile.telefone ?? undefined;
        } catch {
          // Profile fetch failed — use token data
        }
      }

      const apiUser: User = {
        id: cpf,
        name: userName,
        email: tokenEmail,
        role: mapRole(role),
        phone: userPhone,
      };

      setUser(apiUser);
      return { success: true, message: "Login realizado com sucesso!" };
    } catch (err) {
      const isApiError = err instanceof ApiError;
      const isNetworkError = !isApiError;

      if (isNetworkError) {
        return {
          success: false,
          message: "Erro de conexão com o servidor. Tente novamente mais tarde.",
        };
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
    phone: string,
    cpf: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const cleanCpf = cpf.replace(/\D/g, "");
      await api.post("/people/register-user", {
        nome: name,
        email,
        senha: password,
        telefone: phone || undefined,
        cpf: cleanCpf,
      });

      try {
        const loginRes = await api.post<LoginApiResponse>("/auth/login", { email, senha: password });
        localStorage.setItem("dk_token", loginRes.access_token);

        // Decode JWT to get user info
        const payload = decodeJwtPayload(loginRes.access_token);
        const role = (payload?.role as string) ?? 'cliente';

        const apiUser: User = {
          id: cleanCpf || email,
          name,
          email,
          role: mapRole(role),
          phone: phone || undefined,
        };

        setUser(apiUser);
      } catch (err) {
        console.error("Erro no login automático após cadastro", err);
        return { success: false, message: "Cadastro concluído, mas falha no auto-login." };
      }

      return { success: true, message: "Cadastro realizado com sucesso!" };
    } catch (err) {
      const isApiError = err instanceof ApiError;

      if (isApiError && err.status === 409) {
        return { success: false, message: "E-mail ou CPF já cadastrado." };
      }

      if (isApiError && err.status === 400) {
        let errorMsg = err.message || "Dados inválidos. Verifique os campos.";
        const errors = (err.data as { errors?: { message: string }[] } | undefined)?.errors;
        if (Array.isArray(errors)) {
          errorMsg = errors.map((e) => e.message).join(", ");
        }
        return { success: false, message: errorMsg };
      }

      if (!isApiError) {
        return {
          success: false,
          message: "Erro de conexão com o servidor ao tentar realizar o cadastro.",
        };
      }

      return { success: false, message: "Erro ao criar conta." };
    }
  };

  const updateUserProfile = React.useCallback((data: Partial<Pick<User, "name" | "email" | "phone">>) => {
    setUser((prev) => {
      if (!prev) return null;
      const next = { ...prev, ...data };
      try {
        localStorage.setItem("dk_user", JSON.stringify(next));
      } catch {
        // Ignore storage write failure.
      }
      return next;
    });
  }, []);

  const logout = React.useCallback(() => {
    setUser(null);
    clearAuthStorage();
    window.dispatchEvent(new Event("clear-cart"));
  }, []);

  React.useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || (event.key === "dk_token" && !event.newValue)) {
        setUser(null);
        return;
      }
      if (event.key === "dk_user") {
        setUser(parseStoredUser(event.newValue));
      }
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("storage", handleStorage);
    };
  }, [logout]);

  const isManager = user?.role === "manager" || user?.role === "superadmin";
  const isSuperAdmin = user?.role === "superadmin";
  const isEmployee = user?.role === "employee";
  const isCashier = user?.role === "cashier";
  const isInternalUser = isManager || isEmployee || isCashier;

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
        login,
        register,
        updateUserProfile,
        logout,
        isManager,
        isSuperAdmin,
        isEmployee,
        isCashier,
        isInternalUser,
        isAuthenticated: !!user,
        canEditProducts,
        canEditUsers,
        canEditStock,
        canEditOrders,
        canEditCommissions,
        canEditBanners,
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
