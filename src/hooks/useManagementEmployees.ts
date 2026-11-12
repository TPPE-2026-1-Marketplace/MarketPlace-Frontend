import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ApiEmployee } from "@/lib/employees";

/** Corpo aceito por POST /employees e PATCH /employees/:cpf. */
export type EmployeePayload = Record<string, unknown>;

interface UseManagementEmployeesResult {
  employees: ApiEmployee[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createEmployee: (payload: EmployeePayload) => Promise<void>;
  updateEmployee: (cpf: string, payload: EmployeePayload) => Promise<void>;
}

/** Equipe da gestão (GET /employees) e o cadastro/edição; as falhas de escrita sobem para o dialog. */
export function useManagementEmployees(): UseManagementEmployeesResult {
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      api
        .get<{ data: ApiEmployee[] }>("/employees?limit=100")
        .then((response) => setEmployees(response.data))
        .catch((loadError) => {
          console.error("Erro ao carregar funcionários", loadError);
          setError("Não foi possível carregar os usuários.");
        })
        .finally(() => setIsLoading(false)),
    [],
  );

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await load();
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const createEmployee = useCallback(
    async (payload: EmployeePayload) => {
      await api.post("/employees", payload);
      await load();
    },
    [load],
  );

  const updateEmployee = useCallback(
    async (cpf: string, payload: EmployeePayload) => {
      await api.patch(`/employees/${cpf}`, payload);
      await load();
    },
    [load],
  );

  return { employees, isLoading, error, refetch, createEmployee, updateEmployee };
}
