import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function ModuleSelection() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const canAccessManagement = user?.role === "superadmin" || user?.role === "manager";

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="w-24 h-12 mx-auto mb-4 overflow-hidden">
            <img
              src="figma:asset/65bd0ec255fb348be2810d7107aa837bd84441e2.png"
              alt="DK Fashion"
              className="w-full h-full object-contain"
              style={{ filter: "none" }}
            />
          </div>
          <h1 className="text-gray-900 text-2xl mb-2">
            Bem-vinda, {user.name}
          </h1>
          <p className="text-gray-500 text-sm">Selecione o módulo que deseja acessar</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {canAccessManagement && (
            <button
              onClick={() => navigate("/painel")}
              className="group bg-white border border-gray-100 p-8 hover:shadow-lg transition-all text-left"
            >
              <div className="w-14 h-14 bg-[#1a1a1a] flex items-center justify-center mb-4 group-hover:bg-[#333333] transition-colors">
                <LayoutDashboard className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-gray-900 text-xl mb-2">Módulo de Gestão</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Acesse o painel administrativo para gerenciar produtos, estoque,
                pedidos, vendas online, funcionários e relatórios.
              </p>
              <div className="mt-4 text-xs text-gray-400 uppercase tracking-widest">
                Acesso: {user.role === "superadmin" ? "Super Admin" : "Gerente"}
              </div>
            </button>
          )}

          <button
            onClick={() => navigate("/pdv")}
            className="group bg-white border border-gray-100 p-8 hover:shadow-lg transition-all text-left"
          >
            <div className="w-14 h-14 bg-[#1a1a1a] flex items-center justify-center mb-4 group-hover:bg-[#333333] transition-colors">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-gray-900 text-xl mb-2">PDV - Vendas Presenciais</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Sistema de ponto de venda para atendimento de clientes na loja física.
              Realize vendas, consulte estoque e registre pagamentos.
            </p>
            <div className="mt-4 text-xs text-gray-400 uppercase tracking-widest">
              Acesso: Todos os funcionários
            </div>
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair do sistema
          </button>
        </div>

        <div className="mt-8 bg-white border border-gray-100 p-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Informações da Conta</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Nome:</span>
              <span className="text-gray-700 ml-2">{user.name}</span>
            </div>
            <div>
              <span className="text-gray-400">E-mail:</span>
              <span className="text-gray-700 ml-2">{user.email}</span>
            </div>
            <div>
              <span className="text-gray-400">Perfil:</span>
              <span className="text-gray-700 ml-2 capitalize">
                {user.role === "superadmin"
                  ? "Super Admin"
                  : user.role === "manager"
                  ? "Gerente"
                  : "Funcionário"}
              </span>
            </div>
            {user.commissionRate && (
              <div>
                <span className="text-gray-400">Comissão:</span>
                <span className="text-gray-700 ml-2">{user.commissionRate}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
