import { useMemo, useState } from "react";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import AdminPanel from "@/components/manager/AdminPanel";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import CouponFormDialog from "@/components/manager/CouponFormDialog";
import FilterBar from "@/components/manager/FilterBar";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import {
  COUPON_STATUS_LABELS,
  couponStatus,
  formatCouponUsage,
  formatDiscount,
  type CouponStatus,
} from "@/components/manager/couponStatus";
import { formatKpiCount, formatShortDate } from "@/components/manager/format";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useManagementCoupons, type ApiCoupon } from "@/hooks/useManagementCoupons";

interface CouponFilters {
  search: string;
  status: "all" | CouponStatus;
}

const EMPTY_FILTERS: CouponFilters = { search: "", status: "all" };

// Sem campanha/parceiro informado, o cupom é da própria loja (Figma: "DK Fashion").
const partnerName = (coupon: ApiCoupon) => coupon.nomeInfluenciador || "DK Fashion";

interface CouponsProps {
  /** Data de referência para "Expirado"; os testes fixam. */
  now?: Date;
}

/** Cupons do painel (Figma 755:3208 / 755:3520). Só o administrador acessa (rotas do backend). */
export function Coupons({ now }: CouponsProps) {
  const { isSuperAdmin } = useAuth();
  const { coupons, isLoading, error, refetch, createCoupon, updateCoupon, deleteCoupon } =
    useManagementCoupons(isSuperAdmin);
  const [openedAt] = useState(() => now ?? new Date());
  const [draft, setDraft] = useState<CouponFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<CouponFilters>(EMPTY_FILTERS);
  // undefined = fechado; null = novo cupom.
  const [selected, setSelected] = useState<ApiCoupon | null | undefined>(undefined);

  const filteredCoupons = useMemo(() => {
    const term = filters.search.trim().toLocaleLowerCase("pt-BR");
    return coupons
      .filter(
        (coupon) =>
          (!term ||
            coupon.numeroDoCupom.toLocaleLowerCase("pt-BR").includes(term) ||
            (coupon.nomeInfluenciador ?? "").toLocaleLowerCase("pt-BR").includes(term)) &&
          (filters.status === "all" || couponStatus(coupon, openedAt) === filters.status),
      )
      .sort((a, b) => new Date(b.dataFim).getTime() - new Date(a.dataFim).getTime());
  }, [coupons, filters, openedAt]);

  const indicators = useMemo(() => {
    const percentage = coupons.filter((coupon) => coupon.tipoCupom === "porcentagem");
    return {
      active: coupons.filter((coupon) => couponStatus(coupon, openedAt) === "active").length,
      usage: coupons.reduce((sum, coupon) => sum + coupon.usosAtuais, 0),
      averageDiscount:
        percentage.length > 0
          ? Math.round(percentage.reduce((sum, coupon) => sum + Number(coupon.valorDesconto), 0) / percentage.length)
          : 0,
    };
  }, [coupons, openedAt]);

  if (!isSuperAdmin) {
    return (
      <AdminPanel title="Acesso restrito">
        <AdminField label="Cupons" value="Apenas administradores podem gerenciar cupons." />
      </AdminPanel>
    );
  }

  const columns: RecordColumn<ApiCoupon>[] = [
    {
      key: "campanha",
      header: "Campanha / código",
      primary: true,
      render: (coupon) =>
        coupon.nomeInfluenciador ? `${coupon.nomeInfluenciador} · ${coupon.numeroDoCupom}` : coupon.numeroDoCupom,
    },
    { key: "desconto", header: "Desconto", render: formatDiscount },
    { key: "validade", header: "Validade", render: (coupon) => formatShortDate(coupon.dataFim) },
    { key: "usos", header: "Usos", render: formatCouponUsage },
    { key: "parceiro", header: "Parceiro", render: partnerName },
    { key: "status", header: "Status", render: (coupon) => COUPON_STATUS_LABELS[couponStatus(coupon, openedAt)] },
    {
      key: "acao",
      header: "Ação",
      hideMobileLabel: true,
      render: (coupon) => (
        <Button
          variant="outline-neutral"
          size="sm"
          className={`${adminButtonClassName} min-w-[128px] whitespace-nowrap`}
          onClick={() => setSelected(coupon)}
          aria-label={`Editar cupom ${coupon.numeroDoCupom}`}
        >
          Editar cupom
        </Button>
      ),
    },
  ];

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  return (
    <>
      <AdminPageHeader
        title="Cupons"
        description="Organize campanhas e acompanhe validade e uso dos descontos."
        action={
          <Button variant="action" size="sm" className={adminButtonClassName} onClick={() => setSelected(null)}>
            Novo cupom
          </Button>
        }
      />

      {isLoading && coupons.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <KpiGrid>
            <KpiCard label="Ativos" value={formatKpiCount(indicators.active)} help="Válidos hoje" />
            <KpiCard label="Usos" value={formatKpiCount(indicators.usage)} help="Somando todos os cupons" />
            <KpiCard label="Desconto médio" value={`${indicators.averageDiscount}%`} help="Entre os percentuais" />
            <KpiCard label="Total de cupons" value={formatKpiCount(coupons.length)} help="Cadastrados" />
          </KpiGrid>

          <FilterBar onApply={() => setFilters(draft)}>
            <AdminField label="Buscar código, campanha ou parceiro" htmlFor="coupons-search">
              <input
                id="coupons-search"
                type="search"
                value={draft.search}
                onChange={(event) => setDraft({ ...draft, search: event.target.value })}
                placeholder="Ex.: BEMVINDA10 ou @influenciadora"
                className={adminControlClassName}
              />
            </AdminField>
            <AdminField
              label={`Status: ${draft.status === "all" ? "todos" : COUPON_STATUS_LABELS[draft.status].toLocaleLowerCase("pt-BR")}`}
              htmlFor="coupons-status"
            >
              <select
                id="coupons-status"
                value={draft.status}
                onChange={(event) => setDraft({ ...draft, status: event.target.value as CouponFilters["status"] })}
                className={adminControlClassName}
              >
                <option value="all">Todos</option>
                {(Object.keys(COUPON_STATUS_LABELS) as CouponStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {COUPON_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </AdminField>
          </FilterBar>

          {filteredCoupons.length === 0 ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <RecordsTable
              key={JSON.stringify(filters)}
              title="Registros recentes"
              columns={columns}
              rows={filteredCoupons}
              getRowKey={(coupon) => coupon.numeroDoCupom}
            />
          )}
        </>
      )}

      <AccessNotice />

      <CouponFormDialog
        open={selected !== undefined}
        coupon={selected ?? null}
        onClose={() => setSelected(undefined)}
        onCreate={createCoupon}
        onUpdate={updateCoupon}
        onDelete={deleteCoupon}
      />
    </>
  );
}
