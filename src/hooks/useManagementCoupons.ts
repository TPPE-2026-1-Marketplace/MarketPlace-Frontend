import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/** Cupom de GET /coupons (só administrador). */
export interface ApiCoupon {
  numeroDoCupom: string;
  tipoCupom: "porcentagem" | "fixo";
  valorDesconto: number | string;
  ativo: boolean;
  dataInicio: string;
  dataFim: string;
  usoMaximo: number | null;
  usosAtuais: number;
  /** Único nome do cupom no backend: campanha ou parceiro/influenciador. */
  nomeInfluenciador: string | null;
  products?: Array<{ idProduto: number; titulo?: string }>;
}

/** Corpo de POST /coupons e PATCH /coupons/:numero. */
export interface CouponPayload {
  numeroDoCupom?: string;
  tipoCupom: "porcentagem" | "fixo";
  valorDesconto: number;
  ativo: boolean;
  dataInicio: string;
  dataFim: string;
  usoMaximo: number | null;
  nomeInfluenciador: string | null;
}

/** Cupons da gestão e as escritas; as falhas sobem para o dialog mostrar. */
export function useManagementCoupons(enabled: boolean) {
  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      api
        .get<ApiCoupon[]>("/coupons")
        .then((response) => {
          setCoupons(response);
          setError(null);
        })
        .catch((loadError) => {
          console.error("Erro ao carregar cupons", loadError);
          setError("Não foi possível carregar os cupons.");
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
    if (enabled) void load();
  }, [enabled, load]);

  const createCoupon = useCallback(
    async (payload: CouponPayload) => {
      await api.post("/coupons", payload);
      await load();
    },
    [load],
  );

  const updateCoupon = useCallback(
    async (code: string, payload: Partial<CouponPayload>) => {
      await api.patch(`/coupons/${code}`, payload);
      await load();
    },
    [load],
  );

  const deleteCoupon = useCallback(
    async (code: string) => {
      await api.delete(`/coupons/${code}`);
      await load();
    },
    [load],
  );

  return { coupons, isLoading, error, refetch, createCoupon, updateCoupon, deleteCoupon };
}
