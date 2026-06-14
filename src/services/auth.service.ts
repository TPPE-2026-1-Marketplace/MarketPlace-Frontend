import { api } from "@/lib/api";
import type { User, LoginRequest, LoginResponse, RegisterRequest } from "@/models";

const TOKEN_KEY = "dk_token";
const USER_KEY = "dk_user";

export const AuthService = {
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    // Mock validation using .env variables
    const validLogin = process.env.NEXT_PUBLIC_LOGIN_CLIENTE || "cliente123";
    const validPassword = process.env.NEXT_PUBLIC_SENHA_CLIENTE || "cliente123";

    if (credentials.email === validLogin && credentials.password === validPassword) {
      const mockToken = "mock_token_" + Date.now();
      localStorage.setItem(TOKEN_KEY, mockToken);
      
      const user: User = {
        id: "1",
        email: credentials.email,
        nome: "Cliente Teste",
        role: "customer"
      };
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return { user, token: mockToken };
    }

    throw new Error("E-mail ou senha incorretos.");
  },

  async register(data: RegisterRequest): Promise<User> {
    return api.post<User>("/auth/register", data);
  },

  async getProfile(): Promise<User> {
    return api.get<User>("/auth/profile");
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
