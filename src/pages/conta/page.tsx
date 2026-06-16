
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { User, Package, Heart, LogOut, ChevronRight, Edit2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ContaPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"dados" | "pedidos" | "favoritos">("dados");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8] font-sans">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-gray-700 mb-2 font-serif text-2xl">Você precisa estar logada</h2>
          <p className="text-gray-500 text-sm mb-4">Faça login para acessar sua conta.</p>
          <Link
            to="/login"
            className="bg-[#1a1a1a] text-white px-6 py-2 hover:bg-[#333333] transition-colors text-sm inline-block"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const myOrders: any[] = []; // Placeholder for actual orders

  const tabs = [
    { key: "dados", label: "Meus Dados", icon: <User className="w-4 h-4" /> },
    { key: "pedidos", label: "Meus Pedidos", icon: <Package className="w-4 h-4" /> },
    { key: "favoritos", label: "Favoritos", icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="bg-[#1a1a1a] text-white py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 flex items-center justify-center text-white text-2xl font-serif">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-white font-serif text-2xl">{user?.name || "Usuário"}</h1>
              <p className="text-gray-300 text-sm font-sans">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
        <div className="flex flex-col sm:flex-row gap-6">
          <aside className="sm:w-56 shrink-0">
            <div className="bg-white border border-gray-100 overflow-hidden">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as typeof tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-b border-gray-50 last:border-0 ${
                    tab === t.key
                      ? "bg-gray-100 text-[#1a1a1a]"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t.icon}
                  {t.label}
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </aside>

          <div className="flex-1">
            {tab === "dados" && (
              <div className="bg-white p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-gray-900 font-serif text-xl">Meus Dados</h2>
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                </div>
                <div className="space-y-1">
                  {[
                    ["Nome", user?.name],
                    ["E-mail", user?.email],
                    ["Telefone", "Não informado"],
                    ["CPF", "***.***.***-**"],
                    ["Data de Nascimento", "Não informado"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-4 py-3 border-b border-gray-50 last:border-0">
                      <span className="text-gray-400 text-sm w-36 shrink-0">{label}</span>
                      <span className="text-gray-900 text-sm">{value || "Não informado"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "pedidos" && (
              <div className="bg-white p-6 border border-gray-100">
                <h2 className="text-gray-900 mb-5 font-serif text-xl">Meus Pedidos</h2>
                <div className="space-y-4">
                  {myOrders.length === 0 ? (
                    <div className="text-center py-10">
                      <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Você ainda não tem pedidos.</p>
                    </div>
                  ) : (
                    myOrders.map((order) => (
                      <div key={order.id} className="border border-gray-100 p-4">
                        {/* Order details */}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {tab === "favoritos" && (
              <div className="bg-white p-6 border border-gray-100 text-center py-16">
                <Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-gray-500 mb-2 font-serif text-xl">Nenhum favorito ainda</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Salve seus vestidos favoritos para não perder!
                </p>
                <Link
                  to="/produtos"
                  className="text-gray-700 text-sm hover:underline"
                >
                  Explorar vestidos
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
