import Button from "@/components/ui/Button";
import AdminField from "./AdminField";
import AdminPanel from "./AdminPanel";
import { adminButtonClassName } from "./adminClasses";

/** Frame "Fluxo / loading" (755:6164). */
export function LoadingState() {
  return (
    <div role="status" aria-busy="true">
      <AdminPanel title="Carregando dados">
        <AdminField label="Estado" value="Buscando os registros mais recentes" />
      </AdminPanel>
    </div>
  );
}

interface ErrorStateProps {
  /** Mensagem de falha vinda do carregamento. */
  message?: string;
  onRetry: () => void;
}

/** Frame "Fluxo / error" (755:6116). */
export function ErrorState({ message = "Falha de conexão", onRetry }: ErrorStateProps) {
  return (
    <div role="alert">
      <AdminPanel
        title="Não foi possível carregar os dados"
        actions={
          <Button variant="action" size="sm" className={adminButtonClassName} onClick={onRetry}>
            Tentar novamente
          </Button>
        }
      >
        <AdminField label="Estado" value={message} />
        <AdminField label="Orientação" value="Tente novamente em alguns instantes" />
      </AdminPanel>
    </div>
  );
}
