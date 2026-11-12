import { useMemo, useState } from "react";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import AdminPanel from "@/components/manager/AdminPanel";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import BannerFormDialog, {
  type BannerFormData,
} from "@/components/manager/BannerFormDialog";
import { getCategoryLabel } from "@/components/manager/bannerFormat";
import FilterBar from "@/components/manager/FilterBar";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import { formatKpiCount } from "@/components/manager/format";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import type { Banner } from "@/context/BannerContext";
import { useManagementBanners } from "@/hooks/useManagementBanners";

type BannerStatusFilter = "all" | "published" | "draft";

interface BannerFilters {
  search: string;
  status: BannerStatusFilter;
}

const EMPTY_FILTERS: BannerFilters = { search: "", status: "all" };

const STATUS_FILTER_LABELS: Record<BannerStatusFilter, string> = {
  all: "todos",
  published: "publicado",
  draft: "rascunho",
};

/** Tela de Banners do painel administrativo (Figma 755:4135 / 755:4445). */
export function Banners() {
  const { isManager, canEditBanners } = useAuth();
  const {
    banners,
    publishedCount,
    draftCount,
    isLoading,
    error,
    refetch,
    createBanner,
    updateBanner,
  } = useManagementBanners();

  const [draft, setDraft] = useState<BannerFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<BannerFilters>(EMPTY_FILTERS);
  // undefined = fechado; null = novo banner; Banner = edição.
  const [selected, setSelected] = useState<Banner | null | undefined>(undefined);

  const filteredBanners = useMemo(() => {
    const term = filters.search.trim().toLocaleLowerCase("pt-BR");
    return banners.filter((banner) => {
      const categoryLabel = getCategoryLabel(banner.primaryCategory).toLocaleLowerCase("pt-BR");
      const matchesSearch =
        !term ||
        banner.title.toLocaleLowerCase("pt-BR").includes(term) ||
        (banner.tag ?? "").toLocaleLowerCase("pt-BR").includes(term) ||
        categoryLabel.includes(term);

      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "published" && banner.active) ||
        (filters.status === "draft" && !banner.active);

      return matchesSearch && matchesStatus;
    });
  }, [banners, filters]);

  if (!isManager && !canEditBanners) {
    return (
      <AdminPanel title="Acesso restrito">
        <AdminField
          label="Banners"
          value="Apenas gerentes e administradores podem gerenciar banners."
        />
      </AdminPanel>
    );
  }

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  const handleSave = (data: BannerFormData) => {
    if (selected) {
      updateBanner(selected.id, data);
    } else {
      createBanner(data);
    }
  };

  const nextOrder =
    banners.length > 0 ? Math.max(...banners.map((b) => b.order)) + 1 : 1;

  const columns: RecordColumn<Banner>[] = [
    {
      key: "ordem",
      header: "Ordem",
      primary: true,
      render: (banner) => formatKpiCount(banner.order),
    },
    {
      key: "banner",
      header: "Banner",
      render: (banner) => banner.title,
    },
    {
      key: "colecao",
      header: "Coleção",
      render: (banner) => banner.tag || getCategoryLabel(banner.primaryCategory) || "—",
    },
    {
      key: "botao",
      header: "Botão",
      render: (banner) => banner.primaryCta || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (banner) => (banner.active ? "Publicado" : "Rascunho"),
    },
    {
      key: "acao",
      header: "Ação",
      hideMobileLabel: true,
      render: (banner) => (
        <Button
          variant="outline-neutral"
          size="sm"
          className={`${adminButtonClassName} min-w-[128px] whitespace-nowrap`}
          onClick={() => setSelected(banner)}
          aria-label={`Editar banner ${banner.title}`}
        >
          Editar banner
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Banners"
        description="Gerencie a ordem e a publicação dos destaques da loja."
        action={
          <Button
            variant="action"
            size="sm"
            className={adminButtonClassName}
            onClick={() => setSelected(null)}
          >
            Novo banner
          </Button>
        }
      />

      <KpiGrid>
        <KpiCard
          label="Publicados"
          value={formatKpiCount(publishedCount)}
          help="No período selecionado"
        />
        <KpiCard
          label="Rascunhos"
          value={formatKpiCount(draftCount)}
          help="No período selecionado"
        />
      </KpiGrid>

      <FilterBar onApply={() => setFilters(draft)}>
        <AdminField label="Buscar título ou coleção" htmlFor="banners-search">
          <input
            id="banners-search"
            type="search"
            value={draft.search}
            onChange={(e) => setDraft((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Título ou coleção..."
            className={adminControlClassName}
          />
        </AdminField>

        <AdminField
          label={`Status: ${STATUS_FILTER_LABELS[draft.status]}`}
          htmlFor="banners-status"
        >
          <select
            id="banners-status"
            value={draft.status}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                status: e.target.value as BannerStatusFilter,
              }))
            }
            className={adminControlClassName}
          >
            <option value="all">Todos</option>
            <option value="published">Publicado</option>
            <option value="draft">Rascunho</option>
          </select>
        </AdminField>
      </FilterBar>

      {filteredBanners.length === 0 ? (
        <NoResults onClear={clearFilters} />
      ) : (
        <RecordsTable
          title="Registros recentes"
          columns={columns}
          rows={filteredBanners}
          getRowKey={(banner) => banner.id}
        />
      )}

      <AccessNotice />

      <BannerFormDialog
        open={selected !== undefined}
        banner={selected ?? null}
        defaultOrder={nextOrder}
        onClose={() => setSelected(undefined)}
        onSave={handleSave}
      />
    </div>
  );
}
