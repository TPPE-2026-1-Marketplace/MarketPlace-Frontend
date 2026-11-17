import { useState } from "react";

export interface DiscardGuard {
  readonly confirmDiscard: boolean;
  readonly requestClose: () => void;
  readonly cancelDiscard: () => void;
  readonly confirmAndClose: () => void;
}

/** Controla a confirmação de descarte ao tentar sair de um formulário com alterações pendentes. */
export function useDiscardGuard(isDirty: boolean, onDiscard: () => void): DiscardGuard {
  const [confirmDiscardState, setConfirmDiscardState] = useState(false);

  const requestClose = () => {
    if (isDirty) {
      setConfirmDiscardState(true);
      return;
    }
    setConfirmDiscardState(false);
    onDiscard();
  };

  const cancelDiscard = () => setConfirmDiscardState(false);

  const confirmAndClose = () => {
    setConfirmDiscardState(false);
    onDiscard();
  };

  return {
    confirmDiscard: isDirty && confirmDiscardState,
    requestClose,
    cancelDiscard,
    confirmAndClose,
  };
}
