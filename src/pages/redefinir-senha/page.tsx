import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock } from "lucide-react";
import AuthCard, { authInputClassName, type AuthMessage } from "@/components/auth/AuthCard";
import { passwordResetErrorMessage, resetPassword } from "@/lib/passwordReset";

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72;

/** Nova senha a partir do link enviado por e-mail (`/redefinir-senha?token=...`). */
export default function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setMessage({ type: "error", text: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` });
      return;
    }
    if (password !== confirmation) {
      setMessage({ type: "error", text: "As senhas não conferem." });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await resetPassword(token, password);
      navigate("/login?senha=redefinida", { replace: true });
    } catch (error) {
      setMessage({ type: "error", text: passwordResetErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthCard
        subtitle="Redefinir senha"
        message={{ type: "error", text: "Link de redefinição inválido ou incompleto." }}
      >
        <Link to="/esqueci-senha" className="text-sm text-[#C8427C] hover:underline">
          Pedir um novo link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard subtitle="Crie uma nova senha" message={message}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm text-gray-600 mb-1.5">
            Nova senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="new-password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo de 8 caracteres"
              required
              maxLength={MAX_PASSWORD}
              className={`${authInputClassName} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="confirm-password" className="block text-sm text-gray-600 mb-1.5">
            Confirmar nova senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="confirm-password"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Repita a nova senha"
              required
              maxLength={MAX_PASSWORD}
              className={authInputClassName}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bt-principal w-full rounded-xl py-3 text-sm font-medium tracking-wide"
        >
          {loading ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-6">
        Link vencido?{" "}
        <Link to="/esqueci-senha" className="text-[#C8427C] hover:underline">
          Pedir um novo
        </Link>
      </p>
    </AuthCard>
  );
}
