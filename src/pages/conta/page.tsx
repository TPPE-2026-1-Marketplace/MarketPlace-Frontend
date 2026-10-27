import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { buttonClassName } from "@/components/ui/button-variants";
import EmptyState from "@/components/ui/EmptyState";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { PHONE_INVALID_MESSAGE, isValidPhone } from "@/lib/br-validators";
import { maskCpf, maskPhone, onlyDigits } from "@/lib/utils";
import AccountHeader from "./components/AccountHeader";
import AccountNav, { type AccountTabKey } from "./components/AccountNav";
import MeusDados from "./components/MeusDados";
import MeusEnderecos from "./components/MeusEnderecos";
import MeusPedidos from "./components/MeusPedidos";
import MeusSeguranca from "./components/MeusSeguranca";

interface UserProfile {
  cpf: string;
  nome: string | null;
  email: string;
  telefone?: string | null;
  dataNascimento?: string | null;
}

interface AccountForm {
  name: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  cpf: string;
}

export default function ContaPage() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AccountTabKey>("dados");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [telefoneError, setTelefoneError] = useState<string | null>(null);

  // Profile data from the backend (may have more fields than the auth context)
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<AccountForm>({
    name: "",
    email: "",
    telefone: "",
    dataNascimento: "",
    cpf: "",
  });

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
          dataNascimento: data.dataNascimento ?? "",
          cpf: maskCpf(data.cpf ?? ""),
        });
      })
      .catch(() => {
        // Fallback: use auth context data
        setForm({
          name: user.name || "",
          email: user.email || "",
          telefone: maskPhone(user.phone ?? ""),
          dataNascimento: "",
          cpf: user.id || "",
        });
      });
  }, [user]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] font-sans">
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
      dataNascimento: profile?.dataNascimento ?? "",
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
      const currentBirthdate = profile?.dataNascimento || "";

      if (form.name !== currentName) updatePayload.nome = form.name;
      if (form.email !== currentEmail) updatePayload.email = form.email;
      if (form.dataNascimento !== currentBirthdate) {
        updatePayload.dataNascimento = form.dataNascimento || null;
      }
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
        dataNascimento: updated.dataNascimento ?? "",
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
  const displayBirthdate = profile?.dataNascimento ?? null;
  const displayCpf = profile?.cpf || "";

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans">
      <AccountHeader />

      <Tabs value={tab} onValueChange={(value) => setTab(value as AccountTabKey)} orientation="vertical">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
          <aside className="shrink-0 lg:w-60">
            <AccountNav displayName={displayName} onLogout={handleLogout} />
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
                displayBirthdate={displayBirthdate}
                displayCpf={displayCpf}
                onEdit={handleEdit}
                onCancel={handleCancel}
                onSave={handleSave}
                onFieldChange={handleFieldChange}
                onSelectTab={setTab}
              />
            </TabsContent>
            <TabsContent value="pedidos">
              <MeusPedidos />
            </TabsContent>
            <TabsContent value="enderecos">
              <MeusEnderecos />
            </TabsContent>
            <TabsContent value="seguranca">
              <MeusSeguranca cpf={displayCpf} onLogout={handleLogout} />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
