import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fetchPeople, type ApiPerson } from "@/lib/management";

interface UseManagementClientsResult {
  clients: ApiPerson[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** Clientes da gestão: as pessoas cadastradas (GET /people) sem os funcionários (GET /employees). */
export function useManagementClients(): UseManagementClientsResult {
  const [clients, setClients] = useState<ApiPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [peopleResponse, employeesResponse] = await Promise.all([
        fetchPeople(),
        api.get<{ data: { cpf: string }[] }>("/employees?limit=100"),
      ]);
      const employeeCpfs = new Set(employeesResponse.data.map((employee) => employee.cpf));
      setClients(peopleResponse.data.filter((person) => !employeeCpfs.has(person.cpf)));
    } catch (loadError) {
      console.error("Erro ao carregar os clientes da gestão", loadError);
      setError("Não foi possível carregar os clientes do backend.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  return { clients, isLoading, error, refetch };
}
