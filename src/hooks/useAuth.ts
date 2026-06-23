import { useState, useCallback, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  nome?: string;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("dk_user");
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);

  useEffect(() => {
    setIsAuthenticated(!!user);
    if (user) {
      localStorage.setItem("dk_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("dk_user");
      localStorage.removeItem("dk_token");
    }
  }, [user]);

  const login = useCallback(async (credentials: any) => {
    const validLogin = import.meta.env.VITE_LOGIN_CLIENTE;
    const validPassword = import.meta.env.VITE_SENHA_CLIENTE;
    
    if (credentials.email === validLogin && credentials.password === validPassword) {
      const mockUser = {
        id: "1",
        email: credentials.email,
        nome: "Cliente Demo"
      };
      setUser(mockUser);
      localStorage.setItem("dk_token", "mock_token");
      return { user: mockUser, token: "mock_token" };
    }
    throw new Error("Credenciais inválidas");
  }, []);

  const register = useCallback(async (data: any) => {
    const newUser = {
      id: "2",
      email: data.email,
      nome: data.nome
    };
    setUser(newUser);
    localStorage.setItem("dk_token", "mock_token");
    return { user: newUser, token: "mock_token" };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    window.location.href = "/";
  }, []);

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
