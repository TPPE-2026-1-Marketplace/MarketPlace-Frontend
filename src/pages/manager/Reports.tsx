import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, DollarSign, Package, ShoppingBag } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fetchManagementOrders, type ApiOrder } from "@/lib/management";

export function Reports() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetchManagementOrders();
        setOrders(response.data);
      } catch (loadError) {
        console.error(loadError);
        setError("Não foi possível carregar os dados reais para os relatórios.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completedOrders = orders.filter((order) => order.status !== "cancelled");
  const revenue = completedOrders.reduce((sum, order) => sum + Number(order.valorTotal), 0);
  const averageTicket = completedOrders.length > 0 ? revenue / completedOrders.length : 0;

  const monthlyData = useMemo(() => {
    const months = new Map<string, { mes: string; receita: number; pedidos: number }>();
    completedOrders.forEach((order) => {
      const date = new Date(order.dataPedido);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const current = months.get(key) ?? {
        mes: date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        receita: 0,
        pedidos: 0,
      };
      current.receita += Number(order.valorTotal);
      current.pedidos += 1;
      months.set(key, current);
    });
    return [...months.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, value]) => value);
  }, [completedOrders]);

  const topVariants = useMemo(() => {
    const totals = new Map<string, number>();
    completedOrders.flatMap((order) => order.items).forEach((item) => {
      totals.set(item.idVariante, (totals.get(item.idVariante) ?? 0) + item.quantidade);
    });
    return [...totals.entries()]
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 5);
  }, [completedOrders]);

  if (loading) return <div className="py-16 text-center text-sm text-gray-500">Carregando relatórios...</div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-gray-900">Relatórios e Análises</h2><p className="text-gray-500 text-sm">Indicadores calculados exclusivamente com pedidos reais</p></div>
      {error && <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Receita", value: `R$ ${revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: <DollarSign className="w-5 h-5" /> },
          { label: "Pedidos válidos", value: completedOrders.length, icon: <ShoppingBag className="w-5 h-5" /> },
          { label: "Ticket médio", value: `R$ ${averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: <BarChart3 className="w-5 h-5" /> },
        ].map((metric) => (
          <div key={metric.label} className="bg-white border border-gray-100 p-5 flex gap-3 items-center">
            <div className="w-10 h-10 bg-gray-100 text-gray-700 flex items-center justify-center">{metric.icon}</div>
            <div><p className="text-xs text-gray-500">{metric.label}</p><p className="text-lg text-gray-900">{metric.value}</p></div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-gray-100 py-16 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Ainda não há pedidos reais para gerar métricas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-gray-100 p-5">
            <h3 className="text-gray-900 mb-5">Receita por mês</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="mes" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR")}`} />
                  <Bar dataKey="receita" fill="#1a1a1a" name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white border border-gray-100 p-5">
            <h3 className="text-gray-900 mb-5">Variantes mais vendidas</h3>
            {topVariants.length === 0 ? <p className="text-sm text-gray-500">Não há itens vendidos.</p> : (
              <div className="space-y-3">{topVariants.map((variant, index) => (
                <div key={variant.sku} className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <span className="w-7 h-7 bg-gray-100 flex items-center justify-center text-xs">{index + 1}</span>
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="font-mono text-sm flex-1 truncate">{variant.sku}</span>
                  <span className="text-sm text-gray-600">{variant.quantity} un.</span>
                </div>
              ))}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
