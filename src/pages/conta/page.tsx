import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Heart, LogOut, Package, User } from "lucide-react";
import { buttonClassName } from "@/components/ui/button-variants";
import EmptyState from "@/components/ui/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { PHONE_INVALID_MESSAGE, isValidPhone } from "@/lib/br-validators";
import { maskCpf, maskPhone, onlyDigits } from "@/lib/utils";
import AccountHeader from "./components/AccountHeader";
import MeusDados from "./components/MeusDados";
import MeusFavoritos from "./components/MeusFavoritos";
import MeusPedidos from "./components/MeusPedidos";

interface UserProfile {
  cpf: string;
  nome: string | null;
  email: string;
  telefone?: string | null;
}

interface AccountForm {
  name: string;
  email: string;
  telefone: string;
  cpf: string;
}

type TabKey = "dados" | "pedidos" | "favoritos";

const TABS: Array<{ key: TabKey; label: string; icon: ReactNode }> = [
  { key: "dados", label: "Meus Dados", icon: <User className="w-4 h-4" /> },
  { key: "pedidos", label: "Meus Pedidos", icon: <Package className="w-4 h-4" /> },
  { key: "favoritos", label: "Favoritos", icon: <Heart className="w-4 h-4" /> },
];

export default function ContaPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("dados");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [telefoneError, setTelefoneError] = useState<string | null>(null);

  // Profile data from the backend (may have more fields than the auth context)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<AccountForm>({ name: "", email: "", telefone: "", cpf: "" });

  // Fetch full profile from backend on mount
  useEffect(() => {
    if (!user?.id) return;

    api
      .get<UserProfile>(`/people/${user.id}`)
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.nome || "",
          email: data.email || "",
          telefone: maskPhone(data.telefone ?? ""),
          cpf: maskCpf(data.cpf ?? ""),
        });
      })
      .catch(() => {
        // Fallback: use auth context data
        setForm({
          name: user.name || "",
          email: user.email || "",
          telefone: maskPhone(user.phone ?? ""),
          cpf: user.id || "",
        });
      });
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <EmptyState
          icon={<User className="size-7" />}
          title="Você precisa estar logada"
          body="Faça login para acessar sua conta."
          action={
            <Link to="/login" className={buttonClassName({ variant: "action", size: "sm" })}>
              Fazer Login
            </Link>
          }
        />
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
    setTelefoneError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setMessage(null);
    setTelefoneError(null);
    // Reset form to current profile data
    setForm({
      name: profile?.nome || user?.name || "",
      email: profile?.email || user?.email || "",
      telefone: maskPhone(profile?.telefone || user?.phone || ""),
      cpf: maskCpf(profile?.cpf ?? ""),
    });
  };

  const handleFieldChange = (key: keyof AccountForm, raw: string) => {
    if (key === "telefone") setTelefoneError(null);
    const value = key === "telefone" ? maskPhone(raw) : raw;
    setForm((prev) => ({ ...prev, [key]: value }));
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
    setTelefoneError(null);

    try {
      const updatePayload: Record<string, string | null> = {};

      // Only send changed fields
      const currentName = profile?.nome || user?.name || "";
      const currentEmail = profile?.email || user?.email || "";
      const currentTelefone = profile?.telefone || "";

      if (form.name !== currentName) updatePayload.nome = form.name;
      if (form.email !== currentEmail) updatePayload.email = form.email;
      // O CPF é a chave da conta (PK) e não pode ser alterado por aqui.
      const newTelefone = onlyDigits(form.telefone);
      const telefoneChanged = newTelefone !== onlyDigits(currentTelefone);

      // Valida só o que o usuário alterou, para não bloquear quem tem dado antigo salvo.
      if (telefoneChanged && newTelefone && !isValidPhone(newTelefone)) {
        setTelefoneError(PHONE_INVALID_MESSAGE);
        setSaving(false);
        return;
      }

      // `null` remove o telefone cadastrado (o backend aceita null).
      if (telefoneChanged) updatePayload.telefone = newTelefone || null;

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
        telefone: maskPhone(updated.telefone ?? ""),
        cpf: maskCpf(updated.cpf ?? ""),
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
    } catch (err: unknown) {
      // Traduz mensagens comuns do backend para português
      const rawMsg = err instanceof Error ? err.message : "";
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

  return (
    <div className="min-h-screen bg-gray-50">
      <AccountHeader displayName={displayName} displayEmail={displayEmail} />

      <div className="mx-auto max-w-4xl px-4 py-8 font-sans sm:px-6 lg:px-8">
        <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)} orientation="vertical">
          <div className="flex flex-col gap-6 sm:flex-row">
            <aside className="shrink-0 sm:w-56">
              <div className="overflow-hidden border border-gray-100 bg-white">
                <TabsList className="h-auto w-full flex-col items-stretch justify-start gap-0 rounded-none bg-transparent p-0">
                  {TABS.map((t) => (
                    <TabsTrigger
                      key={t.key}
                      value={t.key}
                      className="h-auto w-full justify-start gap-3 rounded-none border-b border-gray-50 px-4 py-3 text-sm last:border-0 data-[state=active]:bg-gray-100 data-[state=active]:text-[var(--action-primary)] data-[state=active]:shadow-none"
                    >
                      {t.icon}
                      {t.label}
                      <ChevronRight className="ml-auto w-4 h-4" />
                    </TabsTrigger>
                  ))}
                </TabsList>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            </aside>

            <div className="flex-1">
              <TabsContent value="dados">
                <MeusDados
                  isEditing={isEditing}
                  saving={saving}
                  message={message}
                  telefoneError={telefoneError}
                  form={form}
                  displayName={displayName}
                  displayEmail={displayEmail}
                  displayPhone={displayPhone}
                  displayCpf={displayCpf}
                  onEdit={handleEdit}
                  onCancel={handleCancel}
                  onSave={handleSave}
                  onFieldChange={handleFieldChange}
                />
              </TabsContent>
              <TabsContent value="pedidos">
                <MeusPedidos />
              </TabsContent>
              <TabsContent value="favoritos">
                <MeusFavoritos />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
