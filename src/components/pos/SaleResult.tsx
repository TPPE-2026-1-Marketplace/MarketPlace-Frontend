import type { ReactNode } from "react";
import { adminButtonClassName, adminCardClassName } from "@/components/manager/adminClasses";
import Button from "@/components/ui/Button";
import { cn, formatCurrency, onlyDigits, obscureCpf } from "@/lib/utils";

interface ResultPanelProps {
  title: string;
  children: ReactNode;
  actions: ReactNode;
}

function ResultPanel({ title, children, actions }: ResultPanelProps) {
  return (
    <section className={cn(adminCardClassName, "flex flex-col gap-4 p-6")} aria-labelledby="pdv-result-title">
      <h2 id="pdv-result-title" className="text-[32px] leading-[38px] font-semibold text-[var(--foreground)]">
        {title}
      </h2>
      {children}
      <div className="flex flex-col items-start gap-3">{actions}</div>
    </section>
  );
}

const bodyClassName = "text-sm leading-[22px] text-[var(--foreground-secondary)]";

// O vendedor é identificado pelo código ou, para quem vende logado, pelo CPF (que não aparece inteiro).
const sellerLabel = (sellerCode: string) => (onlyDigits(sellerCode).length === 11 ? obscureCpf(sellerCode) : sellerCode);

interface SaleCompletedProps {
  saleId: string;
  customerName?: string;
  sellerCode: string;
  total: number;
  onNewSale: () => void;
}

/** Estado "Venda concluída" do PDV (Figma 759:14395 e 761:1606). */
export function SaleCompleted({ saleId, customerName, sellerCode, total, onNewSale }: SaleCompletedProps) {
  const details = [
    customerName && `Cliente: ${customerName}`,
    `Vendedor: ${sellerLabel(sellerCode)}`,
    `Total: ${formatCurrency(total)}`,
  ].filter(Boolean);

  return (
    <div role="status">
      <ResultPanel
        title="Venda concluída"
        actions={
          <Button variant="action" size="sm" className={adminButtonClassName} onClick={onNewSale}>
            Nova venda
          </Button>
        }
      >
        <p className={bodyClassName}>Venda #{saleId} registrada com sucesso.</p>
        <p className="text-sm leading-[22px] text-[var(--foreground)]">{details.join(" · ")}</p>
      </ResultPanel>
    </div>
  );
}

interface SaleFailedProps {
  /** Motivo devolvido pela API, quando houver. */
  reason?: string;
  retrying?: boolean;
  onRetry: () => void;
  onBack: () => void;
}

/** Estado "Falha na venda" do PDV (Figma 759:14425): os itens seguem na venda. */
export function SaleFailed({ reason, retrying = false, onRetry, onBack }: SaleFailedProps) {
  return (
    <div role="alert">
      <ResultPanel
        title="Falha na venda"
        actions={
          <>
            <Button variant="action" size="sm" className={adminButtonClassName} loading={retrying} onClick={onRetry}>
              Tentar novamente
            </Button>
            <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onBack}>
              Voltar à venda
            </Button>
          </>
        }
      >
        <p className={bodyClassName}>Não foi possível registrar a venda. Os itens foram preservados para tentar novamente.</p>
        {reason && <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">Motivo: {reason}</p>}
      </ResultPanel>
    </div>
  );
}
