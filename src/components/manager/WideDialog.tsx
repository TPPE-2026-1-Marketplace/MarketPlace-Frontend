import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

interface WideDialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Linha abaixo do título (ex.: orientação do formulário). */
  description?: ReactNode;
  children: ReactNode;
  /** Barra de ações ao final (Anterior / Salvar rascunho / Próxima etapa). */
  footer?: ReactNode;
}

/**
 * Modal largo do cadastro de produto (Figma 755:5137, 764:14744): 900px, raio 12,
 * cabeçalho com "×", conteúdo rolável e ações ao final. Em telas pequenas ocupa a largura.
 */
export default function WideDialog({ open, onClose, title, description, children, footer }: WideDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-32px)] w-[calc(100%-32px)] max-w-[900px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[12px] bg-[var(--background-card)] shadow-lg focus:outline-none"
        >
          <div className="flex items-start justify-between gap-4 px-4 pt-6 md:px-8 md:pt-8">
            <DialogPrimitive.Title className="text-2xl leading-9 font-semibold text-[var(--foreground)]">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="flex size-11 shrink-0 items-center justify-center text-2xl leading-9 text-[var(--foreground-muted)] hover:text-[var(--foreground)] focus-visible:ring-2 focus-visible:ring-[var(--border-accent)] focus-visible:outline-none"
            >
              ×
            </DialogPrimitive.Close>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 md:px-8">
            {description && <p className="text-sm leading-[21px] text-[var(--foreground-secondary)]">{description}</p>}
            {children}
          </div>
          {footer && (
            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] px-4 py-4 md:flex-row md:items-start md:justify-between md:px-8">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
