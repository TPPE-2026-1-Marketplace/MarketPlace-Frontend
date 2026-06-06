"use client";

import React, { useState } from "react";
import { Eye, EyeOff, User, Lock, Mail, Phone, CreditCard, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "register";

export default function ContaPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { login, register, user, logout } = useAuth();
  const router = useRouter();

  // Login form state
  const [loginData, setLoginData] = useState({ email: "", senha: "" });

  // Register form state
  const [registerData, setRegisterData] = useState({
    cpf: "",
    nome: "",
    email: "",
    senha: "",
    telefone: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ email: loginData.email, senha: loginData.senha });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "E-mail ou senha incorretos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register({
        cpf: registerData.cpf.replace(/\D/g, ""),
        nome: registerData.nome,
        email: registerData.email,
        senha: registerData.senha,
        telefone: registerData.telefone || undefined,
      });
      setSuccess("Cadastro realizado com sucesso! Faça login para continuar.");
      setMode("login");
      setLoginData({ email: registerData.email, senha: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // If already authenticated, show profile
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16">
        <div className="w-full max-w-md px-4 animate-fade-in">
          <div className="rounded-[var(--radius-xl)] bg-[var(--background-card)] border border-[var(--border)] p-8 text-center">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
              {user.nome
                ? user.nome
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : user.email.slice(0, 2).toUpperCase()}
            </div>

            <h1 className="text-2xl font-semibold text-white mb-1">
              Olá, {user.nome?.split(" ")[0] ?? "Cliente"}!
            </h1>
            <p className="text-sm text-[var(--foreground-muted)] mb-8">{user.email}</p>

            <dl className="space-y-3 text-left mb-8">
              {user.cpf && (
                <div className="flex justify-between text-sm py-2 border-b border-[var(--border)]">
                  <dt className="text-[var(--foreground-muted)]">CPF</dt>
                  <dd className="text-white font-mono">{user.cpf}</dd>
                </div>
              )}
              {user.telefone && (
                <div className="flex justify-between text-sm py-2 border-b border-[var(--border)]">
                  <dt className="text-[var(--foreground-muted)]">Telefone</dt>
                  <dd className="text-white">{user.telefone}</dd>
                </div>
              )}
            </dl>

            <div className="space-y-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => router.push("/produtos")}
              >
                Ver coleção
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={logout}
              >
                Sair da conta
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-16">
      <div className="w-full max-w-md px-4 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-full bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 items-center justify-center mb-4">
            <User size={24} className="text-[var(--color-brand)]" />
          </div>
          <h1 className="text-3xl font-light text-white">
            {mode === "login" ? "Bem-vinda de volta" : "Criar conta"}
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-2">
            {mode === "login"
              ? "Entre na sua conta para continuar"
              : "Cadastre-se e encontre o vestido dos seus sonhos"}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex rounded-[var(--radius-lg)] bg-[var(--background-card)] border border-[var(--border)] p-1 mb-6">
          <button
            onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-[var(--transition-base)] ${
              mode === "login"
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-white"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
            className={`flex-1 py-2.5 text-sm font-medium rounded-[var(--radius-md)] transition-all duration-[var(--transition-base)] ${
              mode === "register"
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-white"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Form card */}
        <div className="rounded-[var(--radius-xl)] bg-[var(--background-card)] border border-[var(--border)] p-6 sm:p-8">
          {/* Feedback messages */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 px-4 py-3 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 text-sm text-[var(--color-success)]">
              {success}
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.1em] mb-2">
                  E-mail
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-senha" className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.1em] mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <input
                    id="login-senha"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={loginData.senha}
                    onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" size="lg" fullWidth disabled={isLoading}>
                {isLoading ? "Entrando..." : (
                  <>Entrar <ArrowRight size={16} /></>
                )}
              </Button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="reg-nome" className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.1em] mb-2">
                  Nome completo
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <input
                    id="reg-nome"
                    type="text"
                    autoComplete="name"
                    placeholder="Seu nome"
                    value={registerData.nome}
                    onChange={(e) => setRegisterData({ ...registerData, nome: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-cpf" className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.1em] mb-2">
                  CPF <span className="text-[var(--color-error)]">*</span>
                </label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <input
                    id="reg-cpf"
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    value={registerData.cpf}
                    onChange={(e) => setRegisterData({ ...registerData, cpf: formatCPF(e.target.value) })}
                    maxLength={14}
                    className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.1em] mb-2">
                  E-mail <span className="text-[var(--color-error)]">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-telefone" className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.1em] mb-2">
                  Telefone
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <input
                    id="reg-telefone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(61) 99999-9999"
                    value={registerData.telefone}
                    onChange={(e) => setRegisterData({ ...registerData, telefone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-senha" className="block text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-[0.1em] mb-2">
                  Senha <span className="text-[var(--color-error)]">*</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]" />
                  <input
                    id="reg-senha"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={registerData.senha}
                    minLength={8}
                    onChange={(e) => setRegisterData({ ...registerData, senha: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-elevated)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <p className="text-xs text-[var(--foreground-subtle)]">
                Ao se cadastrar, você concorda com nossos termos de uso e política de privacidade.
              </p>

              <Button type="submit" size="lg" fullWidth disabled={isLoading}>
                {isLoading ? "Criando conta..." : (
                  <>Criar minha conta <ArrowRight size={16} /></>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
