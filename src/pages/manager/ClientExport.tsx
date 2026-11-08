import { useMemo, useState } from "react";
import AccessNotice from "@/components/manager/AccessNotice";
import AdminField from "@/components/manager/AdminField";
import AdminPageHeader from "@/components/manager/AdminPageHeader";
import { ErrorState, LoadingState } from "@/components/manager/AdminStates";
import FilterBar from "@/components/manager/FilterBar";
import KpiCard, { KpiGrid } from "@/components/manager/KpiCard";
import NoResults from "@/components/manager/NoResults";
import RecordsTable, { type RecordColumn } from "@/components/manager/RecordsTable";
import { adminButtonClassName, adminControlClassName } from "@/components/manager/adminClasses";
import Button from "@/components/ui/Button";
import { useManagementClients } from "@/hooks/useManagementClients";
import { buildClientsCsv, clientsCsvFilename, downloadCsv } from "@/lib/csv";
import type { ApiPerson } from "@/lib/management";
import { maskPhone, obscureCpf, onlyDigits } from "@/lib/utils";

const formatCount = (value: number) => value.toLocaleString("pt-BR");

function matchesSearch(client: ApiPerson, search: string) {
  const term = search.trim().toLocaleLowerCase("pt-BR");
  if (!term) return true;
  const digits = onlyDigits(term);
  return (
    client.nome.toLocaleLowerCase("pt-BR").includes(term) ||
    client.email.toLocaleLowerCase("pt-BR").includes(term) ||
    (digits.length > 0 && onlyDigits(client.cpf).includes(digits))
  );
}

const columns: RecordColumn<ApiPerson>[] = [
  { key: "nome", header: "Nome", primary: true, render: (client) => client.nome },
  { key: "email", header: "E-mail", render: (client) => client.email },
  { key: "telefone", header: "Telefone", render: (client) => (client.telefone ? maskPhone(client.telefone) : "—") },
  { key: "cpf", header: "CPF", render: (client) => obscureCpf(client.cpf) },
];

/** Clientes do painel (Figma 755:3793 / 755:3986). */
export function ClientExport() {
  const { clients, isLoading, error, refetch } = useManagementClients();
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => clients.filter((client) => matchesSearch(client, search)), [clients, search]);

  const clearFilters = () => {
    setDraft("");
    setSearch("");
  };

  const exportCsv = () => downloadCsv(clientsCsvFilename(), buildClientsCsv(filteredClients));

  return (
    <>
      <AdminPageHeader
        title="Clientes"
        description="Consulte a base de clientes e exporte o resultado da busca."
        action={
          <Button
            variant="action"
            size="sm"
            className={adminButtonClassName}
            disabled={filteredClients.length === 0}
            onClick={exportCsv}
          >
            Exportar CSV
          </Button>
        }
      />

      {isLoading && clients.length === 0 ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <KpiGrid>
            <KpiCard label="Clientes" value={formatCount(clients.length)} help="Cadastrados na base" />
            <KpiCard label="Resultado da busca" value={formatCount(filteredClients.length)} help="Correspondem à busca" />
          </KpiGrid>

          <FilterBar onApply={() => setSearch(draft)}>
            <AdminField label="Buscar nome, e-mail ou CPF" htmlFor="clients-search">
              <input
                id="clients-search"
                type="search"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ex.: Marina, marina@dk.com ou 123.456.789-00"
                className={adminControlClassName}
              />
            </AdminField>
          </FilterBar>

          {filteredClients.length === 0 ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <RecordsTable
              key={search}
              title="Registros recentes"
              columns={columns}
              rows={filteredClients}
              getRowKey={(client) => client.cpf}
            />
          )}
        </>
      )}

      <AccessNotice />
    </>
  );
}
