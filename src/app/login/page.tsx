"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, User, Lock, Mail, Phone, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("modo");
  const retorno = searchParams.get("retorno");
  
  const [isRegister, setIsRegister] = useState(mode === "cadastro");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  
  const { login, register, isAuthenticated, user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      if (retorno === "checkout") {
        router.push("/checkout");
      } else {
        const isInternalUser = user?.role === "manager" || user?.role === "superadmin" || user?.role === "employee";
        // Redirect internal users to / (or dashboard), customers to /conta
        router.push(isInternalUser ? "/" : "/conta");
      }
    }
  }, [isAuthenticated, user, router, retorno]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    // Artificial delay for UX
    await new Promise((r) => setTimeout(r, 600));
    
    try {
      if (isRegister) {
        await register({
          nome: form.name,
          email: form.email,
          password: form.password,
          // phone is not directly handled by register model yet but we pass it anyway 
        } as any);
        setMessage({ type: "success", text: "Cadastro realizado com sucesso!" });
      } else {
        await login({ email: form.email, password: form.password });
        // The useEffect will handle redirection
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Ocorreu um erro." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center py-12 px-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo or Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif mb-2">DK Fashion</h1>
          <p className="text-gray-500 text-sm mt-2">
            {isRegister ? "Crie sua conta e comece a comprar" : "Bem-vinda de volta"}
          </p>
        </div>

        <div className="bg-white border border-gray-100 shadow-sm p-8">
          {/* Tabs as solid buttons */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setIsRegister(false); setMessage(null); }}
              className={`flex-1 py-3 text-sm transition-colors rounded-xl ${
                !isRegister ? "bg-black !text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setIsRegister(true); setMessage(null); }}
              className={`flex-1 py-3 text-sm transition-colors rounded-xl ${
                isRegister ? "bg-black !text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm ${
                message.type === "error"
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-green-50 text-green-600 border border-green-100"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0" />
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome"
                    required
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="seu@email.com"
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Sua senha"
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isRegister && (
              <div className="text-right">
                <Link href="#" className="text-xs text-[#C8427C] hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black !text-white py-3 hover:bg-[#333333] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Aguarde...
                </span>
              ) : isRegister ? (
                "Criar Conta"
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Ao entrar, você concorda com nossos{" "}
          <Link href="/politicas#termos" className="text-gray-600 hover:underline">Termos de Uso</Link>{" "}
          e{" "}
          <Link href="/politicas#lgpd" className="text-gray-600 hover:underline">Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  );
}
