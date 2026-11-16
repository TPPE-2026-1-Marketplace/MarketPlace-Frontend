import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { DiscardChangesAlert, type DiscardGuard } from "@/components/ui/DiscardChangesAlert";
import AdminPanel from "./AdminPanel";

interface AdminDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children?: ReactNode;
  readonly actions?: ReactNode;
  readonly discardGuard?: DiscardGuard;
}

// Primitivas do Radix direto, como no RemoveItemDialog do carrinho: os wrappers de
// ui/dialog não repassam ref e o Portal do Radix precisa dela no React 18.
/** Frames "Detalhe ou edição" e "Confirmação" do painel abertos sobre a listagem. */
export default function AdminDialog({
  open,
  onClose,
  title,
  description,
  children,
  actions,
  discardGuard,
}: Readonly<AdminDialogProps>) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => !next && (discardGuard ? discardGuard.requestClose() : onClose())}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100vh-32px)] w-[calc(100%-32px)] max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto focus:outline-none"
        >
          <AdminPanel
            title={title}
            titleAs={DialogPrimitive.Title}
            description={description}
            actions={actions}
            className="shadow-lg"
          >
            {children}
            {discardGuard?.confirmDiscard && (
              <DiscardChangesAlert
                onContinue={discardGuard.cancelDiscard}
                onDiscard={discardGuard.confirmAndClose}
              />
            )}
          </AdminPanel>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
