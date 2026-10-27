import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { buttonClassName } from "@/components/ui/button-variants";
import ChangePasswordModal from "./ChangePasswordModal";

interface MeusSegurancaProps {
  cpf: string;
  onLogout: () => void;
}

export default function MeusSeguranca({ cpf, onLogout }: MeusSegurancaProps) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6" data-testid="meus-seguranca">
      <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Segurança</h2>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">Proteja o acesso à sua conta.</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Senha de acesso</p>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Use uma senha exclusiva para sua conta DK Fashion.
          </p>
        </div>
        <button
          onClick={() => setPasswordModalOpen(true)}
          className={buttonClassName({ variant: "outline-neutral", className: "self-start" })}
        >
          Alterar senha
        </button>
      </div>

      <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div>
          <p className="text-base font-semibold text-[var(--foreground)]">Sair da conta</p>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Em um dispositivo compartilhado, saia da conta após concluir suas compras.
          </p>
        </div>
        <button
          onClick={() => setLogoutModalOpen(true)}
          className={buttonClassName({ variant: "outline-neutral", className: "self-start" })}
        >
          Sair da conta
        </button>
      </div>

      <ChangePasswordModal open={passwordModalOpen} cpf={cpf} onClose={() => setPasswordModalOpen(false)} />

      <DialogPrimitive.Root open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" />
          <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[var(--radius-lg)] bg-[var(--background-card)] p-6 shadow-lg focus:outline-none">
            <div className="flex items-center gap-3">
              <DialogPrimitive.Title className="flex-1 text-xl leading-7 font-semibold text-[var(--foreground)]">
                Sair da conta?
              </DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Fechar"
                className="flex size-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-control)] text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
              >
                <X className="size-4" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="text-sm leading-[22px] text-[var(--foreground-secondary)]">
              Você poderá entrar novamente para acompanhar seus pedidos e acessar seus dados.
            </DialogPrimitive.Description>
            <Button variant="action" size="touch" fullWidth onClick={onLogout}>
              Sair
            </Button>
            <button
              onClick={() => setLogoutModalOpen(false)}
              className={buttonClassName({ variant: "outline-neutral", size: "touch", fullWidth: true })}
            >
              Continuar na conta
            </button>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
