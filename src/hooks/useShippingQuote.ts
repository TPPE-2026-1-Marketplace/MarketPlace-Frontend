import { useCallback, useRef, useState } from "react";
import { api } from "@/lib/api";
import { onlyDigits } from "@/lib/utils";
import type { ShippingQuote } from "@/types/checkout";

export const INVALID_CEP_MESSAGE = "CEP inválido. Use 8 dígitos.";
const SHIPPING_ERROR_MESSAGE = "Não foi possível calcular o frete para este CEP.";

/**
 * Cotação de frete pelo CEP (POST /shipping/calculate).
 * Respostas fora de ordem são descartadas: vale sempre o último CEP pedido.
 */
export function useShippingQuote() {
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRequest = useRef(0);

  const calculate = useCallback(async (cep: string): Promise<ShippingQuote | null> => {
    const requestId = ++lastRequest.current;
    const cleanCep = onlyDigits(cep);

    if (cleanCep.length !== 8) {
      setQuote(null);
      setLoading(false);
      setError(INVALID_CEP_MESSAGE);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.post<ShippingQuote>("/shipping/calculate", {
        cep_destino: cleanCep,
      });
      if (requestId !== lastRequest.current) return null;
      setQuote(result);
      return result;
    } catch (err) {
      if (requestId !== lastRequest.current) return null;
      setQuote(null);
      setError(err instanceof Error && err.message ? err.message : SHIPPING_ERROR_MESSAGE);
      return null;
    } finally {
      if (requestId === lastRequest.current) setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    lastRequest.current++;
    setQuote(null);
    setLoading(false);
    setError(null);
  }, []);

  return { quote, loading, error, calculate, reset };
}

export interface AddressLookup {
  rua: string;
  bairro: string;
  cidade: string;
  estado: string;
}

/** Preenche o endereço a partir do CEP (ViaCEP). */
export function useAddressLookup() {
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (cep: string): Promise<AddressLookup | null> => {
    const cleanCep = onlyDigits(cep);
    if (cleanCep.length !== 8) return null;

    setError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) {
        setError("CEP não encontrado.");
        return null;
      }
      return {
        rua: data.logradouro ?? "",
        bairro: data.bairro ?? "",
        cidade: data.localidade ?? "",
        estado: data.uf ?? "",
      };
    } catch {
      setError("Não foi possível consultar o CEP.");
      return null;
    }
  }, []);

  return { lookup, error };
}
