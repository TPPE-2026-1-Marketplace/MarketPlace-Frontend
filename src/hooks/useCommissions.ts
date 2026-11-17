import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ApiEmployee } from "@/lib/employees";

/** Competência (mês 1–12 e ano) usada pelas rotas de comissão e metas. */
export interface Competence {
  mes: number;
  ano: number;
}

/** Venda presencial devolvida em GET /employees/:cpf/commissions. */
export interface CommissionSale {
  idPedido: number;
  dataPedido: string;
  valorTotal: number | string;
}

/** GET /employees/:cpf/commissions?mes&ano. `valor_bonus` é uma taxa (0.015 = +1,5%). */
export interface CommissionReport {
  total_vendas: number;
  comissao: number;
  meta_batida: boolean;
  meta_vendas: number;
  valor_bonus: number;
  pedidos: CommissionSale[];
}

export interface SalesGoal {
  idGoal: number;
  /** null = meta coletiva da equipe. */
  cpfFuncionario: string | null;
  mes: number;
  ano: number;
  valorMeta: number | string;
  valorBonus: number | string | null;
}

export interface SellerCommission {
  employee: ApiEmployee;
  /** Ausente quando o relatório do vendedor não carregou. */
  report?: CommissionReport;
}

/** Valor em R$ que o bônus rendeu: a taxa extra só vale com a meta batida. */
export function bonusEarned(report?: CommissionReport): number {
  if (!report?.meta_batida) return 0;
  return Number((report.total_vendas * report.valor_bonus).toFixed(2));
}

export interface SellerSettings {
  /** Taxa base, decimal (0.05). */
  taxaComissao: number;
  valorMeta: number;
  /** Taxa extra ao bater a meta, decimal (0.015), ou 0 sem bônus. */
  valorBonus: number;
}

/**
 * Comissões dos vendedores ativos na competência. Metas (GET/POST/PATCH /sales-goals)
 * são só do administrador no backend; `canManage` evita chamá-las para o gerente.
 */
export function useCommissions(competence: Competence, canManage: boolean) {
  const [sellers, setSellers] = useState<SellerCommission[]>([]);
  const [teamGoal, setTeamGoal] = useState<SalesGoal | null>(null);
  // Competência já carregada: trocar de competência mostra o carregamento de novo.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mes, ano } = competence;
  const key = `${ano}-${mes}`;

  const fetchGoals = useCallback(
    () => api.get<SalesGoal[]>(`/sales-goals?mes=${mes}&ano=${ano}`),
    [mes, ano],
  );

  const loadReports = useCallback(
    (employees: ApiEmployee[]): Promise<SellerCommission[]> =>
      Promise.all(
        employees
          .filter((employee) => employee.ativo && employee.role_perfil === "vendedor")
          .map((employee) =>
            api
              .get<CommissionReport>(`/employees/${employee.cpf}/commissions?mes=${mes}&ano=${ano}`)
              .then((report): SellerCommission => ({ employee, report }))
              .catch((reportError): SellerCommission => {
                console.error("Relatório de comissão indisponível", employee.cpf, reportError);
                return { employee };
              }),
          ),
      ),
    [mes, ano],
  );

  const load = useCallback(
    () =>
      api
        .get<{ data: ApiEmployee[] }>("/employees?limit=100")
        .then((response) => loadReports(response.data))
        .then(async (withReports) => {
          setSellers(withReports);
          setError(null);
          if (canManage) {
            const goals = await fetchGoals().catch(() => [] as SalesGoal[]);
            setTeamGoal(goals.find((goal) => goal.cpfFuncionario === null) ?? null);
          }
        })
        .catch((loadError) => {
          console.error("Erro ao carregar comissões", loadError);
          setError("Não foi possível carregar as comissões.");
        })
        .finally(() => setLoadedKey(key)),
    [key, canManage, fetchGoals, loadReports],
  );

  const refetch = useCallback(async () => {
    setIsRefetching(true);
    setError(null);
    await load();
    setIsRefetching(false);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const isLoading = isRefetching || loadedKey !== key;

  /** Cria ou atualiza a meta (do vendedor, ou da equipe com cpf null) na competência. */
  const saveGoal = useCallback(
    async (cpfFuncionario: string | null, valorMeta: number, valorBonus: number) => {
      const goals = await fetchGoals();
      const existing = goals.find((goal) => goal.cpfFuncionario === cpfFuncionario);
      const payload = { cpfFuncionario, mes, ano, valorMeta, valorBonus };
      if (existing) await api.patch(`/sales-goals/${existing.idGoal}`, payload);
      else await api.post("/sales-goals", payload);
    },
    [fetchGoals, mes, ano],
  );

  const saveSellerSettings = useCallback(
    async (cpf: string, settings: SellerSettings) => {
      await api.patch(`/employees/${cpf}`, {
        taxa_comissao: settings.taxaComissao,
        meta_vendas: settings.valorMeta,
      });
      await saveGoal(cpf, settings.valorMeta, settings.valorBonus);
      await load();
    },
    [saveGoal, load],
  );

  const saveTeamGoal = useCallback(
    async (valorMeta: number, valorBonus: number) => {
      await saveGoal(null, valorMeta, valorBonus);
      await load();
    },
    [saveGoal, load],
  );

  return { sellers, teamGoal, isLoading, error, refetch, saveSellerSettings, saveTeamGoal };
}
