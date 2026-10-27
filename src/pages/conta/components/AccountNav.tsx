import { MapPin, Package, Shield, User } from "lucide-react";
import type { ReactNode } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AccountTabKey = "dados" | "pedidos" | "enderecos" | "seguranca";

const TABS: Array<{ key: AccountTabKey; label: string; icon: ReactNode }> = [
  { key: "dados", label: "Meus dados", icon: <User className="size-4" /> },
  { key: "pedidos", label: "Meus pedidos", icon: <Package className="size-4" /> },
  { key: "enderecos", label: "Endereços", icon: <MapPin className="size-4" /> },
  { key: "seguranca", label: "Segurança", icon: <Shield className="size-4" /> },
];

interface AccountNavProps {
  displayName: string;
  onLogout: () => void;
}

export default function AccountNav({ displayName, onLogout }: AccountNavProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--background-card)] p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--background-brand-subtle)]">
          <p className="text-sm font-semibold text-[var(--color-brand)]">{displayName.charAt(0) || "U"}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">{displayName}</p>
          <p className="text-xs text-[var(--foreground-secondary)]">Bem-vinda à DK Fashion</p>
        </div>
      </div>

      <TabsList className="h-auto w-full flex-col items-stretch justify-start gap-1 rounded-none bg-transparent p-0">
        {TABS.map((t) => (
          <TabsTrigger
            key={t.key}
            value={t.key}
            className="h-12 w-full justify-start gap-2 rounded-[var(--radius-sm)] border-b border-[var(--border)] px-3 text-sm font-medium text-[var(--foreground)] last:border-b-0 data-[state=active]:border-b-0 data-[state=active]:border-l-4 data-[state=active]:border-[var(--color-brand)] data-[state=active]:bg-[var(--background-brand-subtle)] data-[state=active]:font-semibold data-[state=active]:text-[var(--color-brand)] data-[state=active]:shadow-none"
          >
            {t.icon}
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <button
        onClick={onLogout}
        className="flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-control)] text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--background-secondary)]"
      >
        Sair da conta
      </button>
    </div>
  );
}
