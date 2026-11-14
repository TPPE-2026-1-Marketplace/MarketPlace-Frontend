import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import AuthCard, { authInputClassName, type AuthMessage } from "@/components/auth/AuthCard";
import { passwordResetErrorMessage, requestPasswordReset } from "@/lib/passwordReset";

/** "Esqueci minha senha": pede o link de redefinição por e-mail (backend #250). */
export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<AuthMessage | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await requestPasswordReset(email.trim());
      setSent(true);
      setMessage({ type: "success", text: res.message });
    } catch (error) {
      setMessage({ type: "error", text: passwordResetErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard subtitle="Recupere o acesso à sua conta" message={message}>
      {sent ? (
        <div className="space-y-4 text-sm text-gray-600">
          <p>
            Confira a caixa de entrada (e o spam) de <strong>{email.trim()}</strong>. O link vale por 30
            minutos.
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setMessage(null);
            }}
            className="text-xs text-[#C8427C] hover:underline"
          >
            Não recebeu? Enviar de novo
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.
          </p>
          <div>
            <label htmlFor="forgot-email" className="block text-sm text-gray-600 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                required
                className={authInputClassName}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bt-principal w-full rounded-xl py-3 text-sm font-medium tracking-wide"
          >
            {loading ? "Enviando..." : "Enviar link"}
          </button>
        </form>
      )}

      <p className="text-center text-xs text-gray-500 mt-6">
        Lembrou a senha?{" "}
        <Link to="/login" className="text-[#C8427C] hover:underline">
          Voltar para o login
        </Link>
      </p>
    </AuthCard>
  );
}
