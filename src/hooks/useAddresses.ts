import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface Address {
  id: number;
  nome: string | null;
  principal: boolean;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface AddressFormValues {
  nome?: string;
  principal?: boolean;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface UseAddressesResult {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  createAddress: (values: AddressFormValues) => Promise<void>;
  updateAddress: (id: number, values: AddressFormValues) => Promise<void>;
  removeAddress: (id: number) => Promise<void>;
}

/** Endereços da cliente autenticada (`/addresses`), usados na aba "Endereços" da conta. */
export function useAddresses(): UseAddressesResult {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<Address[]>("/addresses/my");
      setAddresses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar endereços");
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAddresses();
  }, [fetchAddresses]);

  const createAddress = useCallback(
    async (values: AddressFormValues) => {
      await api.post<Address>("/addresses", values);
      await fetchAddresses();
    },
    [fetchAddresses],
  );

  const updateAddress = useCallback(
    async (id: number, values: AddressFormValues) => {
      await api.patch<Address>(`/addresses/${id}`, values);
      await fetchAddresses();
    },
    [fetchAddresses],
  );

  const removeAddress = useCallback(
    async (id: number) => {
      await api.delete(`/addresses/${id}`);
      await fetchAddresses();
    },
    [fetchAddresses],
  );

  return { addresses, isLoading, error, createAddress, updateAddress, removeAddress };
}
