import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, Users } from "lucide-react";

import { fetchPeople, type ApiPerson } from "@/lib/management";
import { api } from "@/lib/api";

const csvCell = (value: string) => `"${value.replace(/"/g, '""')}"`;

export function ClientExport() {
  const [people, setPeople] = useState<ApiPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const [peopleRes, empRes] = await Promise.all([
          fetchPeople(),
          api.get<{ data: any[] }>("/employees?limit=100")
        ]);
        const employeeCpfs = new Set(empRes.data.map((e: any) => e.cpf));
        setPeople(peopleRes.data.filter((p: ApiPerson) => !employeeCpfs.has(p.cpf)));
      } catch (loadError) {
        console.error(loadError);
        setError("Não foi possível carregar os clientes do backend.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredPeople = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return people.filter((person) =>
      !term ||
      person.nome.toLocaleLowerCase("pt-BR").includes(term) ||
      person.email.toLocaleLowerCase("pt-BR").includes(term) ||
      person.cpf.includes(term),
    );
  }, [people, search]);

  const exportCsv = () => {
    const rows = [
      ["nome", "email", "telefone", "cpf"],
      ...filteredPeople.map((person) => [
        person.nome,
        person.email,
        person.telefone ?? "",
        person.cpf,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Clientes</h2>
          <p className="text-gray-500 text-sm">Base real cadastrada no backend</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filteredPeople.length === 0}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 hover:bg-gray-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed text-sm"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {error && <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome, e-mail ou CPF..."
            className="w-full border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-gray-900"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Carregando clientes...</div>
        ) : filteredPeople.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum cliente real encontrado.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr><th className="text-left px-4 py-3">Nome</th><th className="text-left px-4 py-3">E-mail</th><th className="text-left px-4 py-3">Telefone</th><th className="text-left px-4 py-3">CPF</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPeople.map((person) => (
                <tr key={person.cpf} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{person.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{person.email}</td>
                  <td className="px-4 py-3 text-gray-600">{person.telefone ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{person.cpf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
