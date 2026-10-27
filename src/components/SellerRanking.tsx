import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Users } from "lucide-react";
import { api } from "@/lib/api";

/** Item retornado por GET /api/employees/ranking (já ordenado por vendas, DESC). */
interface RankingEntry {
  nome: string;
  codigo_funcionario: string;
  total_vendas: number;
  posicao: number;
}

const MEDAL_COLORS = ["#c8a840", "#a0a0a0", "#c87840"];

function formatBRL(value: number, fractionDigits = 0): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  });
}

export function SellerRanking({ compact = false }: { compact?: boolean }) {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const mes = now.getMonth() + 1;
  const ano = now.getFullYear();
  const periodo = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  useEffect(() => {
    let cancelled = false;

    api
      .get<RankingEntry[]>("/employees/ranking", { mes, ano })
      .then((data) => {
        if (!cancelled) setRanking(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro ao carregar o ranking");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mes, ano]);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Carregando ranking...</p>;
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Não foi possível carregar o ranking: {error}
      </p>
    );
  }

  if (ranking.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum vendedor no ranking deste mês.</p>;
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
              className="w-7 h-7 flex items-center justify-center text-white text-xs shrink-0"
              style={{ backgroundColor: MEDAL_COLORS[seller.posicao - 1] ?? "#1a1a1a" }}
            >
              {seller.posicao}°
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-800 truncate">{seller.nome}</span>
                <span className="text-xs text-gray-500 shrink-0 ml-2">
                  R$ {formatBRL(seller.total_vendas)}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${shareOfLeader(seller.total_vendas)}%`,
                    backgroundColor: seller.posicao === 1 ? "#c8a840" : "#1a1a1a",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center text-white">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-gray-900">Ranking de Vendedores</h2>
          <p className="text-gray-500 text-sm">Vendas na loja — {periodo}</p>
        </div>
      </div>

      {/* Individual ranking */}
      <div className="bg-white border border-gray-100 p-5">
        <h3 className="text-gray-900 mb-5">Ranking Individual</h3>
        <div className="space-y-5">
          {ranking.map((seller) => {
            const isLeader = seller.posicao === 1 && hasSales;
            const share = shareOfLeader(seller.total_vendas);
            return (
              <div
                key={seller.codigo_funcionario}
                className={`p-4 border transition-all ${
                  isLeader ? "border-amber-200 bg-amber-50" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-10 h-10 flex items-center justify-center text-white text-sm shrink-0"
                    style={{ backgroundColor: MEDAL_COLORS[seller.posicao - 1] ?? "#1a1a1a" }}
                  >
                    {seller.posicao}°
                  </div>

                  <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-gray-700 shrink-0">
                    {seller.nome.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{seller.nome}</p>
                      {isLeader && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Líder
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">Código {seller.codigo_funcionario}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-gray-900">R$ {formatBRL(seller.total_vendas, 2)}</p>
                  </div>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${share}%`,
                      backgroundColor: isLeader ? "#c8a840" : "#1a1a1a",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs text-gray-400">Total de Vendas</span>
          </div>
          <p className="text-gray-900">R$ {formatBRL(totalTeamSales, 2)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Equipe completa</p>
        </div>
        <div className="bg-white border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Users className="w-4 h-4" />
            <span className="text-xs text-gray-400">Vendedores</span>
          </div>
          <p className="text-gray-900">{ranking.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">No ranking do mês</p>
        </div>
      </div>
    </div>
  );
}
