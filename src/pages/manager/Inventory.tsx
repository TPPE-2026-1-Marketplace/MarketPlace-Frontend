import { useMemo, useState } from "react";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import FilterBar from "@/components/manager/FilterBar";
import InventoryAdjustDialog from "@/components/manager/InventoryAdjustDialog";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import { formatKpiCount } from "@/components/manager/format";
import Button from "@/components/ui/Button";
import { useCreateProduct } from "@/hooks/useCreateProduct";
import { LOW_STOCK_LIMIT, useInventoryRows, type InventoryRow } from "@/hooks/useInventoryRows";
import { formatCurrency } from "@/lib/utils";
import { AddProduct } from "./AddProduct";

type Channel = "all" | "online" | "physical";
type Availability = "all" | "available" | "low" | "out";

interface InventoryFilters {
  search: string;
  channel: Channel;
  availability: Availability;
}

const EMPTY_FILTERS: InventoryFilters = { search: "", channel: "all", availability: "all" };

const CHANNEL_LABELS: Record<Channel, string> = { all: "Todos", online: "Online", physical: "Loja física" };
const AVAILABILITY_LABELS: Record<Availability, string> = {
  all: "Todas",
  available: "Disponível",
  low: "Estoque baixo",
  out: "Sem estoque",
};

function matchesFilters(row: InventoryRow, { search, channel, availability }: InventoryFilters) {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  const matchesSearch =
    !term ||
    row.title.toLocaleLowerCase("pt-BR").includes(term) ||
    row.codigoSku.toLocaleLowerCase("pt-BR").includes(term) ||
    row.baseSku.toLocaleLowerCase("pt-BR").includes(term);
  // Canal: variantes com unidades no canal escolhido.
  const channelStock = channel === "online" ? row.stockOnline : channel === "physical" ? row.stockPhysical : row.total;
  const matchesChannel = channel === "all" || channelStock > 0;
  const matchesAvailability =
    availability === "all" ||
    (availability === "out" && channelStock === 0) ||
    (availability === "low" && channelStock > 0 && channelStock <= LOW_STOCK_LIMIT) ||
    (availability === "available" && channelStock > LOW_STOCK_LIMIT);
  return matchesSearch && matchesChannel && matchesAvailability;
}

interface InventoryProps {
  /** Perfis sem permissão de estoque veem a listagem sem as ações de edição. */
  readOnly?: boolean;
}

/** Estoque do painel (Figma 755:410 / 755:640). */
export function Inventory({ readOnly = false }: InventoryProps) {
  const { rows, totals, isLoading, error, refetch, adjustStock, removeRow } = useInventoryRows();
  const createProduct = useCreateProduct(refetch);
  const [draft, setDraft] = useState<InventoryFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<InventoryFilters>(EMPTY_FILTERS);
  const [showAddProduct, setShowAddProduct] = useState(false);
  // A linha fica guardada (e não só o SKU) para a confirmação continuar aberta após excluir.
  const [selectedRow, setSelectedRow] = useState<InventoryRow | null>(null);

  const filteredRows = useMemo(() => rows.filter((row) => matchesFilters(row, filters)), [rows, filters]);

  if (showAddProduct) {
    return (
      <AddProduct
        onBack={() => setShowAddProduct(false)}
        onSave={(_product, payload) => {
          if (!payload) {
            setShowAddProduct(false);
            return;
          }
          void createProduct(payload).then((created) => created && setShowAddProduct(false));
        }}
      />
    );
  }

  const columns: RecordColumn<InventoryRow>[] = [
    {
      key: "produto",
      header: "Produto / variante",
      primary: true,
      render: (row) => (row.variantLabel ? `${row.title} · ${row.variantLabel}` : row.title),
    },
    { key: "sku", header: "SKU", render: (row) => row.codigoSku },
    { key: "preco", header: "Preço", render: (row) => formatCurrency(row.price) },
    { key: "online", header: "Online", render: (row) => row.stockOnline },
    { key: "loja", header: "Loja", render: (row) => row.stockPhysical },
    { key: "total", header: "Total", render: (row) => row.total },
  ];
  if (!readOnly) {
    columns.push({
      key: "acao",
      header: "Ação",
      hideMobileLabel: true,
      render: (row) => (
        <Button
          variant="outline-neutral"
          size="sm"
          className={`${adminButtonClassName} min-w-[128px] whitespace-nowrap`}
          onClick={() => setSelectedRow(row)}
          aria-label={`Ajustar estoque de ${row.codigoSku}`}
        >
          Ajustar estoque
        </Button>
      ),
    });
  }

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  return (
    <>
      <AdminPageHeader
        title="Estoque"
        description="Controle as variantes e a disponibilidade em cada canal de venda."
        action={
          !readOnly && (
            <Button variant="action" size="sm" className={adminButtonClassName} onClick={() => setShowAddProduct(true)}>
              Adicionar produto
            </Button>
          )
        }
      />

      {isLoading && rows.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <KpiGrid>
            <KpiCard label="Total geral" value={formatKpiCount(totals.total)} help={`${rows.length} variantes cadastradas`} />
            <KpiCard label="Online" value={formatKpiCount(totals.online)} help="Unidades no e-commerce" />
            <KpiCard label="Loja física" value={formatKpiCount(totals.physical)} help="Unidades na loja" />
            <KpiCard
              label="Estoque baixo"
              value={formatKpiCount(totals.lowStock)}
              help={`Variantes com até ${LOW_STOCK_LIMIT} unidades`}
            />
          </KpiGrid>

          <FilterBar onApply={() => setFilters(draft)}>
            <AdminField label="Buscar produto ou SKU" htmlFor="inventory-search">
              <input
                id="inventory-search"
                type="search"
                value={draft.search}
                onChange={(event) => setDraft({ ...draft, search: event.target.value })}
                placeholder="Ex.: Princesa Rosé ou DK-009"
                className={adminControlClassName}
              />
            </AdminField>
            <AdminField label={`Canal: ${CHANNEL_LABELS[draft.channel].toLocaleLowerCase("pt-BR")}`} htmlFor="inventory-channel">
              <select
                id="inventory-channel"
                value={draft.channel}
                onChange={(event) => setDraft({ ...draft, channel: event.target.value as Channel })}
                className={adminControlClassName}
              >
                {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </AdminField>
            <AdminField
              label={`Disponibilidade: ${AVAILABILITY_LABELS[draft.availability].toLocaleLowerCase("pt-BR")}`}
              htmlFor="inventory-availability"
            >
              <select
                id="inventory-availability"
                value={draft.availability}
                onChange={(event) => setDraft({ ...draft, availability: event.target.value as Availability })}
                className={adminControlClassName}
              >
                {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </AdminField>
          </FilterBar>

          {filteredRows.length === 0 ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <RecordsTable
              key={JSON.stringify(filters)}
              title="Variantes em estoque"
              columns={columns}
              rows={filteredRows}
              getRowKey={(row) => row.codigoSku}
            />
          )}
        </>
      )}

      <AccessNotice />

      <InventoryAdjustDialog
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onSave={adjustStock}
        onRemove={removeRow}
      />
    </>
  );
}
