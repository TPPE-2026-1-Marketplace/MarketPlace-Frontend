import { ApiError, api } from "@/lib/api";

/** Pede o link de redefinição (backend #250). A resposta é a mesma exista a conta ou não. */
export const requestPasswordReset = (email: string) =>
  api.post<{ message: string }>("/auth/forgot-password", { email });

/** Define a nova senha com o token recebido por e-mail. */
export const resetPassword = (token: string, novaSenha: string) =>
  api.post<{ message: string }>("/auth/reset-password", { token, novaSenha });

/** Mensagem para a cliente a partir do erro da API. */
export function passwordResetErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
    if (error.status === 503) return "Recuperação de senha indisponível no momento. Fale com a loja.";
    if (error.status === 400) return error.message;
  }
  return "Não foi possível concluir agora. Tente novamente.";
}
