import type { FormEvent, ReactNode } from "react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { adminButtonClassName, adminCardClassName } from "./adminClasses";

interface FilterBarProps {
  /** Campos de busca e filtro (normalmente AdminField com input/select). */
  children: ReactNode;
  onApply: () => void;
}

/** "Busca e filtros" do Figma (750:48): campos lado a lado e "Aplicar filtros". */
export default function FilterBar({ children, onApply }: FilterBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(adminCardClassName, "flex flex-col gap-4 p-4 md:flex-row md:items-start")}
    >
      <div className="grid flex-1 gap-4 md:auto-cols-fr md:grid-flow-col">{children}</div>
      <Button
        type="submit"
        variant="outline-neutral"
        size="sm"
        className={cn(adminButtonClassName, "self-start")}
      >
        Aplicar filtros
      </Button>
    </form>
  );
}
