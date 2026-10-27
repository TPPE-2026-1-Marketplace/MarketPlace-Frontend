import { cn } from "@/lib/utils";

export interface AdminNavItem<K extends string = string> {
  key: K;
  label: string;
}

interface AdminNavProps<K extends string> {
  items: AdminNavItem<K>[];
  active: K;
  onSelect: (key: K) => void;
  label: string;
}

/** Lista de "Admin / Item de navegação" (749:8 Padrão / 749:10 Selecionado). */
export default function AdminNav<K extends string>({ items, active, onSelect, label }: AdminNavProps<K>) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-col gap-2">
        {items.map((item) => {
          const selected = item.key === active;
          return (
            <li key={item.key}>
              <button
                type="button"
                aria-current={selected ? "page" : undefined}
                onClick={() => onSelect(item.key)}
                className={cn(
                  "w-full rounded-[var(--radius-sm)] p-3 text-left text-sm leading-5 font-medium transition-colors duration-[var(--transition-fast)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]",
                  selected
                    ? "bg-[var(--background-brand-subtle)] text-[var(--color-brand)]"
                    : "bg-[var(--background-card)] text-[var(--foreground)] hover:bg-[var(--background-secondary)]",
                )}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
