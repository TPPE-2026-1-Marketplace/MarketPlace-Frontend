import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { DiscardChangesAlert } from "@/components/ui/DiscardChangesAlert";
import Input from "@/components/ui/Input";
import { useDiscardGuard } from "@/hooks/useDiscardGuard";
import { api, ApiError } from "@/lib/api";

interface ChangePasswordModalProps {
  readonly open: boolean;
  readonly cpf: string;
  readonly onClose: () => void;
}

export default function ChangePasswordModal({ open, cpf, onClose }: Readonly<ChangePasswordModalProps>) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmar("");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isDirty = open && Boolean(senhaAtual || novaSenha || confirmar);
  const baseGuard = useDiscardGuard(isDirty, handleClose);
  const discardGuard = {
    ...baseGuard,
    requestClose: () => {
      setError(null);
      baseGuard.requestClose();
    },
  };

  const handleSubmit = async () => {
    setError(null);

    if (novaSenha.length < 8) {
      setError("Use pelo menos 8 caracteres, combinando letras e números.");
      return;
    }
    if (novaSenha !== confirmar) {
      setError("A confirmação não bate com a nova senha.");
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/people/${cpf}/senha`, { senhaAtual, novaSenha });
      handleClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao atualizar a senha. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && discardGuard.requestClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[var(--radius-lg)] bg-[var(--background-card)] p-6 shadow-lg focus:outline-none">
          <div className="flex items-center gap-3">
            <DialogPrimitive.Title className="flex-1 text-xl leading-7 font-semibold text-[var(--foreground)]">
              Alterar senha
            </DialogPrimitive.Title>
            <button
              type="button"
              aria-label="Fechar"
              onClick={discardGuard.requestClose}
              className="flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-control)] text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          <DialogPrimitive.Description className="sr-only">
            Formulário para trocar a senha da conta.
          </DialogPrimitive.Description>

          <Input
            label="Senha atual"
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
          />
          <Input label="Nova senha" type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
          <Input
            label="Confirmar nova senha"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            error={error ?? undefined}
            helper={error ? undefined : "Use pelo menos 8 caracteres, combinando letras e números."}
          />

          {discardGuard.confirmDiscard && (
            <DiscardChangesAlert
              onContinue={discardGuard.cancelDiscard}
              onDiscard={discardGuard.confirmAndClose}
            />
          )}

          <Button variant="action" size="touch" fullWidth loading={saving} onClick={handleSubmit}>
            Atualizar senha
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
