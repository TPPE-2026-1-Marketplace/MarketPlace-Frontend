import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Users } from "lucide-react";
import { adminCardClassName, adminLabelClassName } from "@/components/manager/adminClasses";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Item retornado por GET /api/employees/ranking (já ordenado por vendas, DESC). */
interface RankingEntry {
  nome: string;
  codigo_funcionario: string;
  total_vendas: number;
  posicao: number;
}

interface SellerRankingProps {
  compact?: boolean;
  mes?: number;
  ano?: number;
}

function formatBRL(value: number, fractionDigits = 0): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  });
}

function positionBadgeClass(position: number): string {
  if (position === 1) return "bg-[var(--color-brand)] text-[var(--color-white)]";
  if (position === 2) return "bg-[var(--foreground)] text-[var(--color-white)]";
  if (position === 3) return "bg-[var(--foreground-secondary)] text-[var(--color-white)]";
  return "bg-[var(--background-secondary)] text-[var(--foreground-secondary)]";
}

export function SellerRanking({ compact = false, mes: mesProp, ano: anoProp }: Readonly<SellerRankingProps>) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [now] = useState(() => new Date());
  const mes = mesProp ?? now.getMonth() + 1;
  const ano = anoProp ?? now.getFullYear();
  const periodo = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  useEffect(() => {
    let cancelled = false;

    api
      .get<RankingEntry[]>("/employees/ranking", { mes, ano })
      .then((data) => {
        if (!cancelled) {
          setError(null);
          setRanking(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar o ranking");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mes, ano]);

  if (isLoading) {
    return (
      <div className={cn(adminCardClassName, "p-6")}>
        <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">Carregando ranking...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(adminCardClassName, "p-6")}>
        <p role="alert" className="text-xs leading-[18px] text-[var(--color-error-text)]">
          Não foi possível carregar o ranking: {error}
        </p>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className={cn(adminCardClassName, "p-6")}>
        <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">
          Nenhum vendedor no ranking deste mês.
        </p>
      </div>
    );
  }

  const topSales = Math.max(...ranking.map((seller) => seller.total_vendas));
  const totalTeamSales = ranking.reduce((sum, seller) => sum + seller.total_vendas, 0);
  // A barra compara cada vendedor com o líder do mês.
  const shareOfLeader = (value: number) => (topSales > 0 ? (value / topSales) * 100 : 0);
  const hasSales = topSales > 0;

  if (compact) {
    return (
      <div className="space-y-3">
        {ranking.slice(0, 3).map((seller) => (
          <div key={seller.codigo_funcionario} className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-xs font-medium",
                positionBadgeClass(seller.posicao),
              )}
            >
              {seller.posicao}°
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between">
                <span className="truncate text-sm font-medium text-[var(--foreground)]">{seller.nome}</span>
                <span className="ml-2 shrink-0 text-xs text-[var(--foreground-muted)]">
                  R$ {formatBRL(seller.total_vendas)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[var(--radius-full)] bg-[var(--background-secondary)]">
                <div
                  className={cn(
                    "h-full rounded-[var(--radius-full)] transition-all duration-500",
                    seller.posicao === 1 ? "bg-[var(--color-brand)]" : "bg-[var(--foreground)]",
                  )}
                  style={{ width: `${shareOfLeader(seller.total_vendas)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section aria-label="Ranking de Vendedores" className={cn(adminCardClassName, "flex flex-col gap-5 p-6")}>
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--foreground)] text-[var(--color-white)]">
          <Trophy className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl leading-7 font-semibold text-[var(--foreground)]">Ranking de Vendedores</h2>
          <p className="text-xs leading-[18px] text-[var(--foreground-secondary)]">Vendas na loja — {periodo}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className={adminLabelClassName}>Ranking Individual</h3>
        <div className="space-y-3">
          {ranking.map((seller) => {
            const isLeader = seller.posicao === 1 && hasSales;
            const share = shareOfLeader(seller.total_vendas);
            return (
              <div
                key={seller.codigo_funcionario}
                className={cn(
                  "rounded-[var(--radius-md)] border p-4 transition-colors",
                  isLeader
                    ? "border-[var(--border-accent)] bg-[var(--background-brand-subtle)]"
                    : "border-[var(--border)] bg-[var(--background-card)]",
                )}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-xs font-semibold",
                      positionBadgeClass(seller.posicao),
                    )}
                  >
                    {seller.posicao}°
                  </div>

                  <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-full)] bg-[var(--background-secondary)] text-xs font-semibold text-[var(--foreground)]">
                    {seller.nome.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">{seller.nome}</p>
                      {isLeader && (
                        <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-[var(--color-brand)] px-2 py-0.5 text-xs font-medium text-[var(--color-white)]">
                          <Trophy className="size-3" aria-hidden="true" /> Líder
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)]">Código {seller.codigo_funcionario}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-[var(--foreground)]">R$ {formatBRL(seller.total_vendas, 2)}</p>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-[var(--radius-full)] bg-[var(--background-secondary)]">
                  <div
                    className={cn(
                      "h-full rounded-[var(--radius-full)] transition-all duration-700",
                      isLeader ? "bg-[var(--color-brand)]" : "bg-[var(--foreground)]",
                    )}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={cn(adminCardClassName, "p-4")}>
          <div className="mb-1 flex items-center gap-2 text-[var(--foreground-muted)]">
            <TrendingUp className="size-4" aria-hidden="true" />
            <span className={adminLabelClassName}>Total de Vendas</span>
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">R$ {formatBRL(totalTeamSales, 2)}</p>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">Equipe completa</p>
        </div>
        <div className={cn(adminCardClassName, "p-4")}>
          <div className="mb-1 flex items-center gap-2 text-[var(--foreground-muted)]">
            <Users className="size-4" aria-hidden="true" />
            <span className={adminLabelClassName}>Vendedores</span>
          </div>
          <p className="text-lg font-semibold text-[var(--foreground)]">{ranking.length}</p>
          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">No ranking do mês</p>
        </div>
      </div>
    </section>
  );
}
