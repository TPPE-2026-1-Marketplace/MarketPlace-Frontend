"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthService } from "@/services";
import type { User, LoginRequest, RegisterRequest } from "@/models";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = AuthService.getStoredUser();
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const result = await AuthService.login(credentials);
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const newUser = await AuthService.register(data);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}
