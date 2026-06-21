
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { User, Package, Heart, LogOut, ChevronRight, Edit2, Save, X, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useProducts } from "@/hooks/useProducts";
import { api } from "@/lib/api";

interface UserProfile {
  cpf: string;
  nome: string | null;
  email: string;
  telefone?: string | null;
}

export default function ContaPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const { favorites } = useFavorites();
  const { products } = useProducts({ page: 1, limit: 200 });
  const navigate = useNavigate();
  const [tab, setTab] = useState<"dados" | "pedidos" | "favoritos">("dados");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile data from the backend (may have more fields than the auth context)
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form state for editing
  const [form, setForm] = useState({
    name: "",
    email: "",
    telefone: "",
    cpf: "",
  });

  // Fetch full profile from backend on mount
  useEffect(() => {
    if (!user?.id) return;

    api.get<UserProfile>(`/people/${user.id}`)
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          cpf: data.cpf || "",
        });
      })
      .catch(() => {
        // Fallback: use auth context data
        setForm({
          name: user.name || "",
          email: user.email || "",
          telefone: user.phone || "",
          cpf: user.id || "",
        });
      });
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8] font-sans">
        <div className="text-center">
          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-gray-700 mb-2 font-serif text-2xl">Você precisa estar logada</h2>
          <p className="text-gray-500 text-sm mb-4">Faça login para acessar sua conta.</p>
          <Link
            to="/login"
            className="bt-principal px-6 py-2 text-sm inline-block"
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

  const handleEdit = () => {
    setIsEditing(true);
    setMessage(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage(null);
    // Reset form to current profile data
    setForm({
      name: profile?.nome || user?.name || "",
      email: profile?.email || user?.email || "",
      telefone: profile?.telefone || user?.phone || "",
      cpf: profile?.cpf || "",
    });
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Verifica se o ID é numérico (usuário cadastrado no backend)
    const numericId = Number(user.id);
    if (isNaN(numericId)) {
      setMessage({
        type: "error",
        text: "Sua conta é local e não pode ser editada. Faça logout e cadastre-se novamente.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const updatePayload: Record<string, string | undefined> = {};

      // Only send changed fields
      const currentName = profile?.nome || user?.name || "";
      const currentEmail = profile?.email || user?.email || "";
      const currentTelefone = profile?.telefone || "";
      const currentCpf = profile?.cpf || "";

      if (form.name !== currentName) updatePayload.nome = form.name;
      if (form.email !== currentEmail) updatePayload.email = form.email;
      if (form.telefone !== currentTelefone) updatePayload.telefone = form.telefone || undefined;
      if (form.cpf !== currentCpf) updatePayload.cpf = form.cpf || undefined;

      if (Object.keys(updatePayload).length === 0) {
        setMessage({ type: "error", text: "Nenhuma alteração detectada." });
        setSaving(false);
        return;
      }

      const updated = await api.patch<UserProfile>(`/people/${user.id}`, updatePayload);
      setProfile(updated);
      setForm({
        name: updated.nome || "",
        email: updated.email || "",
        telefone: updated.telefone || "",
        cpf: updated.cpf || "",
      });

      // Update localStorage user data
      const storedUser = localStorage.getItem("dk_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.name = updated.nome;
        parsed.email = updated.email;
        parsed.phone = updated.telefone || undefined;
        localStorage.setItem("dk_user", JSON.stringify(parsed));
      }

      setIsEditing(false);
      setMessage({ type: "success", text: "Dados atualizados com sucesso!" });
    } catch (err: any) {
      // Traduz mensagens comuns do backend para português
      const rawMsg: string = err?.message || "";
      let translated = "Erro ao atualizar dados. Tente novamente.";

      if (rawMsg.includes("numeric string is expected")) {
        translated = "ID de usuário inválido. Faça logout e entre novamente.";
      } else if (rawMsg.includes("not found") || rawMsg.includes("não encontrado")) {
        translated = "Usuário não encontrado. Faça logout e cadastre-se novamente.";
      } else if (rawMsg.includes("already") || rawMsg.includes("já cadastrado")) {
        translated = "E-mail ou CPF já cadastrado por outro usuário.";
      } else if (rawMsg.includes("Validation") || rawMsg.includes("validation")) {
        translated = "Dados inválidos. Verifique os campos e tente novamente.";
      } else if (rawMsg) {
        translated = rawMsg;
      }

      setMessage({ type: "error", text: translated });
    } finally {
      setSaving(false);
    }
  };

  const displayName = profile?.nome || user?.name || "Usuário";
  const displayEmail = profile?.email || user?.email || "";
  const displayPhone = profile?.telefone || user?.phone || "";
  const displayCpf = profile?.cpf || "";

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
              {displayName.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-white font-serif text-2xl">{displayName}</h1>
              <p className="text-gray-300 text-sm font-sans">{displayEmail}</p>
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
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" /> Editar
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <X className="w-4 h-4" /> Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bt-principal flex items-center gap-1 text-sm px-3 py-1.5"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Salvar
                      </button>
                    </div>
                  )}
                </div>

                {message && (
                  <div
                    className={`mb-4 p-3 text-sm ${
                      message.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-4">
                    {[
                      { label: "Nome", key: "name", type: "text" },
                      { label: "E-mail", key: "email", type: "email" },
                      { label: "Telefone", key: "telefone", type: "tel" },
                      { label: "CPF", key: "cpf", type: "text" },
                    ].map((field) => (
                      <div key={field.key} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <label className="text-gray-400 text-sm w-36 shrink-0">{field.label}</label>
                        <input
                          type={field.type}
                          value={form[field.key as keyof typeof form]}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                          className="flex-1 border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400 transition-colors"
                          placeholder={`Informe seu ${field.label.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {[
                      ["Nome", displayName],
                      ["E-mail", displayEmail],
                      ["Telefone", displayPhone || "Não informado"],
                      ["CPF", displayCpf ? `***.***.***-${displayCpf.slice(-2)}` : "Não informado"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex gap-4 py-3 border-b border-gray-50 last:border-0">
                        <span className="text-gray-400 text-sm w-36 shrink-0">{label}</span>
                        <span className="text-gray-900 text-sm">{value || "Não informado"}</span>
                      </div>
                    ))}
                  </div>
                )}
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
              <div className="bg-white p-6 border border-gray-100">
                <h2 className="text-gray-900 mb-5 font-serif text-xl">Meus Favoritos</h2>
                {(() => {
                  const favProducts = products.filter((p: any) =>
                    favorites.includes(String(p.id_produto ?? p.id))
                  );
                  if (favProducts.length === 0) {
                    return (
                      <div className="text-center py-10">
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
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {favProducts.map((product: any) => {
                        const price = product.variants?.[0]?.preco_variante ?? product.preco_base ?? product.price;
                        const image = product.imagens?.[0]?.url ?? product.images?.[0] ?? "";
                        const nome = product.titulo ?? product.name ?? "";
                        const cat = product.categoria ?? product.category ?? "Vestido";
                        const id = product.id_produto ?? product.id;
                        return (
                          <Link
                            key={id}
                            to={`/produtos/${id}`}
                            className="flex gap-4 p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
                          >
                            <div className="w-20 h-28 shrink-0 bg-gray-50 overflow-hidden">
                              {image && (
                                <img
                                  src={image}
                                  alt={nome}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-400 uppercase tracking-widest">{cat}</p>
                              <h4 className="text-sm text-gray-900 truncate group-hover:text-gray-600 transition-colors">
                                {nome}
                              </h4>
                              <p className="text-sm text-gray-900 mt-1">
                                R$ {typeof price === "number" ? price.toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : price}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
