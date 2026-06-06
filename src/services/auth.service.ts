import { api } from "@/lib/api";
import type { User, LoginRequest, LoginResponse, RegisterRequest } from "@/models";

const TOKEN_KEY = "dk_token";
const USER_KEY = "dk_user";

export const AuthService = {
  async login(credentials: LoginRequest): Promise<{ user: User; token: string }> {
    const response = await api.post<LoginResponse>("/auth/login", credentials);

    // Store token
    localStorage.setItem(TOKEN_KEY, response.access_token);

    // Fetch user profile
    const user = await this.getProfile();
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return { user, token: response.access_token };
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
