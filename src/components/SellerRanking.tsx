import React from "react";
import { Trophy, TrendingUp, Target, Award } from "lucide-react";
import { MOCK_EMPLOYEE_SALES } from "../data/employees";

/**
 * TODO: Integrar com o backend quando endpoints de vendas/funcionários estiverem disponíveis.
 * Atualmente usa dados mock de `data/employees.ts` pois o backend ainda não possui
 * endpoints para GET /api/sales ou GET /api/employees.
 */

interface Seller {
  id: string;
  name: string;
  avatar: string;
  totalSales: number;
  totalCommission: number;
  salesCount: number;
  goal: number;
}

const SELLERS: Seller[] = [
  { id: "u-005", name: "Beatriz Estilo", avatar: "B", totalSales: 0, totalCommission: 0, salesCount: 0, goal: 18000 },
  { id: "u-003", name: "Ana Vendas", avatar: "A", totalSales: 0, totalCommission: 0, salesCount: 0, goal: 16000 },
  { id: "u-004", name: "Carlos Moda", avatar: "C", totalSales: 0, totalCommission: 0, salesCount: 0, goal: 15000 },
];

export function SellerRanking({ compact = false }: { compact?: boolean }) {
  // Compute totals from mock data
  const sellers = SELLERS.map((seller) => {
    const sales = MOCK_EMPLOYEE_SALES.filter((s) => s.employeeId === seller.id);
    return {
      ...seller,
      totalSales: sales.reduce((sum, s) => sum + s.amount, 0),
      totalCommission: sales.reduce((sum, s) => sum + s.commission, 0),
      salesCount: sales.length,
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  const totalTeamSales = sellers.reduce((sum, s) => sum + s.totalSales, 0);
  const teamGoal = 50000;
  const teamProgress = Math.min((totalTeamSales / teamGoal) * 100, 100);

  const medals = ["#c8a840", "#a0a0a0", "#c87840"];
  const medalLabels = ["1°", "2°", "3°"];

  if (compact) {
    return (
      <div className="space-y-3">
        {sellers.slice(0, 3).map((seller, i) => {
          const progress = Math.min((seller.totalSales / seller.goal) * 100, 100);
          return (
            <div key={seller.id} className="flex items-center gap-3">
              <div
                className="w-7 h-7 flex items-center justify-center text-white text-xs shrink-0"
                style={{ backgroundColor: medals[i] }}
              >
                {medalLabels[i]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-800 truncate">{seller.name}</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">
                    R$ {seller.totalSales.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: i === 0 ? "#c8a840" : "#1a1a1a",
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
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
          <p className="text-gray-500 text-sm">Desempenho e metas — Março 2026</p>
        </div>
      </div>

      {/* Team goal */}
      <div className="bg-[#1a1a1a] p-6 text-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-gray-400 text-xs tracking-widest uppercase mb-1">Meta Coletiva</p>
            <p className="text-white" style={{ fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
              R$ {totalTeamSales.toLocaleString("pt-BR")}
              <span className="text-gray-500 text-sm"> / R$ {teamGoal.toLocaleString("pt-BR")}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs mb-1">Progresso</p>
            <p className="text-white text-2xl">{teamProgress.toFixed(0)}%</p>
          </div>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-700"
            style={{ width: `${teamProgress}%` }}
          />
        </div>
        <p className="text-gray-500 text-xs mt-2">
          Faltam R${" "}
          {Math.max(0, teamGoal - totalTeamSales).toLocaleString("pt-BR")} para atingir a meta da equipe
        </p>
      </div>

      {/* Individual ranking */}
      <div className="bg-white border border-gray-100 p-5">
        <h3 className="text-gray-900 mb-5">Ranking Individual</h3>
        <div className="space-y-5">
          {sellers.map((seller, i) => {
            const progress = Math.min((seller.totalSales / seller.goal) * 100, 100);
            const isLeader = i === 0;
            return (
              <div
                key={seller.id}
                className={`p-4 border transition-all ${
                  isLeader ? "border-amber-200 bg-amber-50" : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  {/* Position */}
                  <div
                    className="w-10 h-10 flex items-center justify-center text-white text-sm shrink-0"
                    style={{ backgroundColor: medals[i] }}
                  >
                    {medalLabels[i]}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-gray-700 shrink-0">
                    {seller.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{seller.name}</p>
                      {isLeader && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> Líder
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{seller.salesCount} vendas</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <p className="text-gray-900">
                      R$ {seller.totalSales.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-gray-400">
                      Comissão: R$ {seller.totalCommission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">
                      Meta individual: R$ {seller.goal.toLocaleString("pt-BR")}
                    </span>
                    <span
                      className={
                        progress >= 100 ? "text-green-600" : progress >= 70 ? "text-amber-600" : "text-gray-500"
                      }
                    >
                      {progress.toFixed(0)}%
                      {progress >= 100 && " (Meta atingida!)"}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progress}%`,
                        backgroundColor:
                          progress >= 100
                            ? "#16a34a"
                            : isLeader
                            ? "#c8a840"
                            : "#1a1a1a",
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Faltam R${" "}
                    {Math.max(0, seller.goal - seller.totalSales).toLocaleString("pt-BR")} para a meta
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: <TrendingUp className="w-4 h-4" />,
            label: "Total de Vendas",
            value: `R$ ${totalTeamSales.toLocaleString("pt-BR")}`,
            sub: "Equipe completa",
          },
          {
            icon: <Award className="w-4 h-4" />,
            label: "Total Comissões",
            value: `R$ ${sellers.reduce((s, e) => s + e.totalCommission, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            sub: "A pagar aos vendedores",
          },
          {
            icon: <Target className="w-4 h-4" />,
            label: "Meta Coletiva",
            value: `${teamProgress.toFixed(0)}%`,
            sub: `R$ ${teamGoal.toLocaleString("pt-BR")} no mês`,
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2 text-gray-500">
              {stat.icon}
              <span className="text-xs text-gray-400">{stat.label}</span>
            </div>
            <p className="text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
