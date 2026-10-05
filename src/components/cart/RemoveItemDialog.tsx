import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

interface RemoveItemDialogProps {
  open: boolean;
  /** Último item do carrinho: muda o título (frame "Confirmar remoção final"). */
  isLastItem: boolean;
  onKeep: () => void;
  onConfirm: () => void;
}

// Usa as primitivas do Radix direto: os wrappers de ui/dialog são componentes
// sem forwardRef (padrão React 19) e o Portal do Radix precisa de ref no React 18.
export default function RemoveItemDialog({ open, isLastItem, onKeep, onConfirm }: RemoveItemDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onKeep()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" />
        <DialogPrimitive.Content className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-[400px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-[var(--radius-lg)] bg-[var(--background)] p-6 shadow-lg focus:outline-none">
          <div className="flex h-11 items-center">
            <DialogPrimitive.Title className="flex-1 text-lg leading-normal font-semibold text-[var(--foreground)]">
              {isLastItem ? "Remover o último vestido?" : "Remover este vestido?"}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="-mr-2.5 flex size-11 items-center justify-center rounded-[var(--radius-md)] text-[var(--foreground)] hover:bg-[var(--background-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            >
              <X className="size-6" strokeWidth={1.5} aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="text-sm leading-[22px] text-[var(--foreground-secondary)]">
            O item sairá do carrinho. Você pode encontrá-lo novamente no catálogo.
          </DialogPrimitive.Description>
          <Button variant="action" size="touch" fullWidth onClick={onKeep}>
            Manter no carrinho
          </Button>
          <Button variant="outline-neutral" size="touch" fullWidth onClick={onConfirm}>
            Remover vestido
          </Button>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
