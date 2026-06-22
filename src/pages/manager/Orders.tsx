import React, { useEffect, useMemo, useState } from "react";
import { Eye, Globe, Package, Search, Store, Truck, X } from "lucide-react";

import { api } from "@/lib/api";
import {
  fetchManagementOrders,
  ORDER_STATUS_LABELS,
  type ApiOrder,
  type ApiOrderStatus,
  type ApiPickupType,
} from "@/lib/management";

const STATUS_STYLES: Record<ApiOrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function Orders() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ApiOrderStatus>("all");
  const [pickupType, setPickupType] = useState<"all" | ApiPickupType>("all");
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchManagementOrders();
      setOrders(response.data);
    } catch (loadError) {
      console.error(loadError);
      setError("Não foi possível carregar os pedidos do backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return orders.filter((order) => {
      const matchesSearch =
        !term ||
        String(order.idPedido).includes(term) ||
        (order.clienteNomeAvulso?.toLocaleLowerCase("pt-BR") || "").includes(term) ||
        (order.user?.nome?.toLocaleLowerCase("pt-BR") || "").includes(term) ||
        (order.clienteCpfAvulso || "").includes(term) ||
        (order.idUsuario?.toLocaleLowerCase("pt-BR") || "").includes(term) ||
        order.items.some((item) => item.idVariante.toLocaleLowerCase("pt-BR").includes(term));
      return (
        matchesSearch &&
        (status === "all" || order.status === status) &&
        (pickupType === "all" || order.tipoRetirada === pickupType)
      );
    });
  }, [orders, pickupType, search, status]);

  const updateTracking = async (order: ApiOrder) => {
    const tracking = window.prompt("Informe o código de rastreamento", order.codigoRastreamento ?? "");
    if (!tracking?.trim()) return;
    try {
      await api.patch(`/orders/${order.idPedido}/tracking`, {
        codigo_rastreamento: tracking.trim(),
      });
      await loadOrders();
    } catch (updateError) {
      console.error(updateError);
      setError("Não foi possível atualizar o rastreamento deste pedido.");
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      await api.patch(`/orders/${selectedOrder.idPedido}/status`, { status: newStatus });
      setSelectedOrder({ ...selectedOrder, status: newStatus as ApiOrderStatus });
      await loadOrders();
    } catch (updateError) {
      console.error(updateError);
      setError("Não foi possível atualizar o status deste pedido.");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-gray-900">Gerenciamento de Pedidos</h2>
        <p className="text-gray-500 text-sm">{orders.length} pedido(s) carregado(s) do backend</p>
      </div>

      {error && <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white p-4 border border-gray-100 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por pedido, CPF ou SKU da variante..."
            className="w-full border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-gray-900"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          className="border border-gray-200 px-3 py-2 text-sm bg-white"
        >
          <option value="all">Todos os status</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          {(["all", "entrega", "loja"] as const).map((type) => (
            <button
              type="button"
              key={type}
              onClick={() => setPickupType(type)}
              className={`px-3 py-2 border text-xs transition-colors ${
                pickupType === type
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-500"
              }`}
            >
              {type === "all" ? "Todos" : type === "entrega" ? "Entrega" : "Loja"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">Carregando pedidos...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhum pedido real encontrado.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Pedido</th>
                <th className="text-left px-4 py-3">Cliente/CPF</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Modalidade</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.idPedido} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">#{order.idPedido}</td>
                  <td className="px-4 py-3">{order.clienteNomeAvulso || order.user?.nome || order.clienteCpfAvulso || order.idUsuario || "Não identificado"}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(order.dataPedido).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      {order.tipoRetirada === "entrega" ? <Globe className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
                      {order.tipoRetirada === "entrega" ? "Entrega" : "Retirada"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">R$ {Number(order.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs ${STATUS_STYLES[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button type="button" onClick={() => setSelectedOrder(order)} className="p-2 bg-gray-100 text-gray-700 hover:bg-gray-200" title="Ver detalhes">
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.tipoRetirada === "entrega" && (order.status === "paid" || order.status === "shipped") && (
                        <button type="button" onClick={() => void updateTracking(order)} className="p-2 bg-gray-900 text-white hover:bg-gray-700" title="Atualizar rastreamento">
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="bg-white w-full max-w-xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg text-gray-900">Pedido #{selectedOrder.idPedido}</h3>
              <button type="button" onClick={() => setSelectedOrder(null)} className="p-1 text-gray-500 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            
            {selectedOrder.tipoRetirada === "entrega" && (
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Status do Pedido</label>
                <select 
                  value={selectedOrder.status}
                  onChange={(e) => void updateOrderStatus(e.target.value)}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                >
                  {Object.entries(ORDER_STATUS_LABELS)
                    .filter(([value]) => value !== 'paid')
                    .map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2 text-sm">
              {selectedOrder.items.map((item) => (
                <div key={item.idItemPedido} className="border border-gray-100 p-3 flex justify-between gap-3">
                  <div><p className="font-mono text-gray-800">{item.idVariante}</p><p className="text-gray-500">Quantidade: {item.quantidade}</p></div>
                  <p>R$ {Number(item.precoUnitario).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              ))}
              {selectedOrder.items.length === 0 && <p className="text-gray-500">Pedido sem itens retornados pela API.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
