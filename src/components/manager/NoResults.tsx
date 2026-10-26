import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { adminButtonClassName, adminCardClassName } from "./adminClasses";

interface NoResultsProps {
  onClear: () => void;
}

/**
 * "Admin / Estado vazio" + "Limpar filtros" do Figma (755:219). O EmptyState da
 * biblioteca é centralizado e exige ícone; no painel o estado é alinhado à esquerda.
 */
export default function NoResults({ onClear }: NoResultsProps) {
  return (
    <div className="flex flex-col items-start gap-6">
      <div className={cn(adminCardClassName, "flex w-full max-w-[680px] flex-col gap-4 p-6")} role="status">
        <h2 className="text-xl leading-7 font-semibold text-[var(--foreground)]">Nenhum resultado encontrado</h2>
        <p className="text-sm leading-[22px] text-[var(--foreground-secondary)]">
          Altere os filtros ou limpe a busca para tentar novamente.
        </p>
      </div>
      <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onClear}>
        Limpar filtros
      </Button>
    </div>
  );
}
