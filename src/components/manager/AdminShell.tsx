import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { buttonClassName } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import AdminNav, { type AdminNavItem } from "./AdminNav";
import { adminButtonClassName } from "./adminClasses";

interface AdminShellProps<K extends string> {
  items: AdminNavItem<K>[];
  active: K;
  onSelect: (key: K) => void;
  userName: string;
  roleLabel: string;
  /** Rótulo do período no canto da barra de contexto ("Outubro 2026"). */
  periodLabel: string;
  onLogout: () => void;
  children: ReactNode;
}

function PanelActions({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Link to="/pdv" className={buttonClassName({ variant: "outline-neutral", size: "sm", className: adminButtonClassName })}>
        Abrir PDV
      </Link>
      <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={onLogout}>
        Sair do painel
      </Button>
    </div>
  );
}

/**
 * Shell do painel (Figma 755:3 e 755:225): "Navegação administrativa" fixa no
 * desktop, barra "Contexto" e, no mobile, o "Menu administrativo" (755:6224).
 */
export default function AdminShell<K extends string>({
  items,
  active,
  onSelect,
  userName,
  roleLabel,
  periodLabel,
  onLogout,
  children,
}: AdminShellProps<K>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const activeLabel = items.find((item) => item.key === active)?.label ?? "";

  const selectFromMenu = (key: K) => {
    setMenuOpen(false);
    onSelect(key);
  };

  return (
    <div className="flex min-h-screen bg-[var(--background-store)]">
      <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col gap-2 overflow-y-auto bg-[var(--background-card)] p-4 lg:flex">
        <p className="text-xl leading-7 font-semibold text-[var(--foreground)]">DK Fashion</p>
        <p className="text-xs leading-4 font-medium tracking-[0.5px] text-[var(--foreground-muted)]">PAINEL GERENCIAL</p>
        <p className="text-xs leading-[18px] text-[var(--foreground-secondary)]">
          {userName} · {roleLabel}
        </p>
        <AdminNav items={items} active={active} onSelect={onSelect} label="Navegação administrativa" />
        <PanelActions onLogout={onLogout} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-8">
        <div className="flex items-start gap-4 text-sm leading-5 font-medium">
          <p className="flex-1 text-[var(--foreground-secondary)]">
            Painel / <span aria-current="page">{activeLabel}</span>
          </p>
          <p className="hidden text-xs leading-4 tracking-[0.5px] text-[var(--foreground-muted)] lg:block">
            {roleLabel} · {periodLabel}
          </p>
          <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <DialogPrimitive.Trigger
              className={cn(buttonClassName({ variant: "outline-neutral", size: "sm" }), adminButtonClassName, "min-w-[140px] lg:hidden")}
            >
              Menu
            </DialogPrimitive.Trigger>
            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] lg:hidden" />
              <DialogPrimitive.Content
                aria-describedby={undefined}
                className="fixed inset-y-0 left-0 z-50 flex w-full max-w-[375px] flex-col gap-4 overflow-y-auto bg-[var(--background-card)] p-6 focus:outline-none lg:hidden"
              >
                <DialogPrimitive.Title className="text-xl leading-7 font-semibold text-[var(--foreground)]">
                  Painel gerencial
                </DialogPrimitive.Title>
                <p className="text-xs leading-[18px] text-[var(--foreground-secondary)]">
                  {userName} · {roleLabel}
                </p>
                <AdminNav items={items} active={active} onSelect={selectFromMenu} label="Menu administrativo" />
                <PanelActions onLogout={onLogout} />
                <DialogPrimitive.Close className="self-start text-sm leading-5 font-medium text-[var(--foreground-secondary)] underline">
                  Fechar menu
                </DialogPrimitive.Close>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
        <main className="flex min-w-0 flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
