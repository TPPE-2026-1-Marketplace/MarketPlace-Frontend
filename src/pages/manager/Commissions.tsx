import { useMemo, useState } from "react";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import CommissionDetailDialog from "@/components/manager/CommissionDetailDialog";
import FilterBar from "@/components/manager/FilterBar";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import TeamGoalDialog from "@/components/manager/TeamGoalDialog";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import { formatCompetence } from "@/components/manager/format";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { bonusEarned, useCommissions, type Competence, type SellerCommission } from "@/hooks/useCommissions";
import { formatCurrency } from "@/lib/utils";

const MONTHS_IN_FILTER = 12;

const competenceKey = ({ mes, ano }: Competence) => `${ano}-${String(mes).padStart(2, "0")}`;

/** Competência atual e as 11 anteriores, da mais recente para a mais antiga. */
function recentCompetences(now: Date): Competence[] {
  return Array.from({ length: MONTHS_IN_FILTER }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    return { mes: date.getMonth() + 1, ano: date.getFullYear() };
  });
}

function progress(seller: SellerCommission): number | null {
  const target = seller.report?.meta_vendas ?? 0;
  return target > 0 ? Math.round(((seller.report?.total_vendas ?? 0) / target) * 100) : null;
}

interface CommissionsProps {
  /** Data de referência da competência inicial; os testes fixam. */
  now?: Date;
}

/** Comissões do painel (Figma 755:2745 / 755:2996). */
export function Commissions({ now }: CommissionsProps) {
  const { isSuperAdmin } = useAuth();
  const [openedAt] = useState(() => now ?? new Date());
  const competences = useMemo(() => recentCompetences(openedAt), [openedAt]);
  const [draft, setDraft] = useState({ competence: competenceKey(competences[0]), search: "" });
  const [filters, setFilters] = useState(draft);
  const competence = competences.find((item) => competenceKey(item) === filters.competence) ?? competences[0];
  const { sellers, teamGoal, isLoading, error, refetch, saveSellerSettings, saveTeamGoal } = useCommissions(
    competence,
    isSuperAdmin,
  );
  const [selectedCpf, setSelectedCpf] = useState<string | null>(null);
  const [teamGoalOpen, setTeamGoalOpen] = useState(false);

  const filteredSellers = useMemo(() => {
    const term = filters.search.trim().toLocaleLowerCase("pt-BR");
    return sellers
      .filter(
        (seller) =>
          !term ||
          seller.employee.person.nome.toLocaleLowerCase("pt-BR").includes(term) ||
          (seller.employee.codigo_funcionario ?? "").toLocaleLowerCase("pt-BR").includes(term),
      )
      .sort((a, b) => (b.report?.total_vendas ?? 0) - (a.report?.total_vendas ?? 0));
  }, [sellers, filters.search]);

  const totals = useMemo(
    () => ({
      sales: sellers.reduce((sum, seller) => sum + (seller.report?.total_vendas ?? 0), 0),
      commission: sellers.reduce((sum, seller) => sum + (seller.report?.comissao ?? 0), 0),
      targetsHit: sellers.filter((seller) => seller.report?.meta_batida).length,
      bonus: sellers.reduce((sum, seller) => sum + bonusEarned(seller.report), 0),
    }),
    [sellers],
  );
  const selectedSeller = sellers.find((seller) => seller.employee.cpf === selectedCpf) ?? null;

  const columns: RecordColumn<SellerCommission>[] = [
    { key: "vendedor", header: "Vendedor", primary: true, render: (seller) => seller.employee.person.nome },
    { key: "vendas", header: "Vendas", render: (seller) => formatCurrency(seller.report?.total_vendas ?? 0) },
    {
      key: "meta",
      header: "Meta",
      render: (seller) => (seller.report?.meta_vendas ? formatCurrency(seller.report.meta_vendas) : "Sem meta"),
    },
    {
      key: "progresso",
      header: "Progresso",
      render: (seller) => {
        const value = progress(seller);
        return value === null ? "—" : `${value}%`;
      },
    },
    {
      key: "comissao",
      header: "Comissão",
      render: (seller) => (seller.report ? formatCurrency(seller.report.comissao) : "Indisponível"),
    },
    { key: "bonus", header: "Bônus", render: (seller) => formatCurrency(bonusEarned(seller.report)) },
    {
      key: "acao",
      header: "Ação",
      hideMobileLabel: true,
      render: (seller) => (
        <Button
          variant="outline-neutral"
          size="sm"
          className={`${adminButtonClassName} min-w-[128px] whitespace-nowrap`}
          onClick={() => setSelectedCpf(seller.employee.cpf)}
          aria-label={`Ver detalhes de ${seller.employee.person.nome}`}
        >
          Ver detalhes
        </Button>
      ),
    },
  ];

  const clearSearch = () => {
    const next = { ...filters, search: "" };
    setDraft(next);
    setFilters(next);
  };

  return (
    <>
      <AdminPageHeader
        title="Comissões"
        description="Acompanhe metas, comissões e bônus da equipe por competência."
        action={
          isSuperAdmin && (
            <Button variant="action" size="sm" className={adminButtonClassName} onClick={() => setTeamGoalOpen(true)}>
              Configurar metas
            </Button>
          )
        }
      />

      {isLoading && sellers.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <KpiGrid>
            <KpiCard label="Vendas da equipe" value={formatCurrency(totals.sales)} help="Na competência" />
            <KpiCard label="Comissões" value={formatCurrency(totals.commission)} help="A pagar na competência" />
            <KpiCard
              label="Metas atingidas"
              value={`${totals.targetsHit} de ${sellers.length}`}
              help="Vendedores ativos"
            />
            <KpiCard label="Bônus" value={formatCurrency(totals.bonus)} help="Pago por metas batidas" />
          </KpiGrid>

          <FilterBar onApply={() => setFilters(draft)}>
            <AdminField
              label={`Competência: ${formatCompetence(
                Number(draft.competence.slice(5)),
                Number(draft.competence.slice(0, 4)),
              ).toLocaleLowerCase("pt-BR")}`}
              htmlFor="commissions-competence"
            >
              <select
                id="commissions-competence"
                value={draft.competence}
                onChange={(event) => setDraft({ ...draft, competence: event.target.value })}
                className={adminControlClassName}
              >
                {competences.map((item) => (
                  <option key={competenceKey(item)} value={competenceKey(item)}>
                    {formatCompetence(item.mes, item.ano)}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField label="Buscar vendedor" htmlFor="commissions-search">
              <input
                id="commissions-search"
                type="search"
                value={draft.search}
                onChange={(event) => setDraft({ ...draft, search: event.target.value })}
                placeholder="Nome ou código do vendedor"
                className={adminControlClassName}
              />
            </AdminField>
          </FilterBar>

          {filteredSellers.length === 0 ? (
            <NoResults onClear={clearSearch} />
          ) : (
            <RecordsTable
              key={JSON.stringify(filters)}
              title="Registros recentes"
              columns={columns}
              rows={filteredSellers}
              getRowKey={(seller) => seller.employee.cpf}
            />
          )}
        </>
      )}

      <AccessNotice />

      <CommissionDetailDialog
        seller={selectedSeller}
        competence={competence}
        readOnly={!isSuperAdmin}
        onClose={() => setSelectedCpf(null)}
        onSave={saveSellerSettings}
      />
      {isSuperAdmin && (
        <TeamGoalDialog
          open={teamGoalOpen}
          goal={teamGoal}
          competence={competence}
          onClose={() => setTeamGoalOpen(false)}
          onSave={saveTeamGoal}
        />
      )}
    </>
  );
}
