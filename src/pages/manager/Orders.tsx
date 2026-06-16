import React, { useState, useEffect } from "react";
import {
  Search,
  Eye,
  X,
  Globe,
  Store,
  Clock,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  ChevronDown,
  Send,
  CheckCircle2,
  Edit2,
} from "lucide-react";
import { Order, MOCK_ORDERS } from "../../data/products";

type OrderStatus = Order["status"];
type FilterStatus = "all" | OrderStatus;
type FilterType = "all" | "online" | "loja";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", color: "bg-amber-100 text-amber-700", icon: <Clock className="w-3 h-3" /> },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-700", icon: <CheckCircle className="w-3 h-3" /> },
  enviado: { label: "Enviado", color: "bg-purple-100 text-purple-700", icon: <Truck className="w-3 h-3" /> },
  entregue: { label: "Entregue", color: "bg-green-100 text-green-700", icon: <Package className="w-3 h-3" /> },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: <XCircle className="w-3 h-3" /> },
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  // States for modal detail status change
  const [selectedStatusInModal, setSelectedStatusInModal] = useState<OrderStatus | null>(null);
  const [modalTrackingCode, setModalTrackingCode] = useState("");
  const [isEditingTracking, setIsEditingTracking] = useState(false);

  // Reset modal states when order changes or closes
  useEffect(() => {
    if (!selectedOrder) {
      setSelectedStatusInModal(null);
      setModalTrackingCode("");
      setIsEditingTracking(false);
    } else {
      // If order has tracking code, populate it
      if (selectedOrder.trackingCode) {
        setModalTrackingCode(selectedOrder.trackingCode);
      }
    }
  }, [selectedOrder]);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchType = filterType === "all" || o.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  // Update status from table dropdown
  const updateStatus = (orderId: string, status: OrderStatus) => {
    // If changing to "enviado", open tracking modal
    if (status === "enviado") {
      setPendingOrderId(orderId);
      setPendingStatus(status);
      setShowTrackingModal(true);
      setUpdatingStatus(null);
      return;
    }

    // For other statuses, update directly
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => prev ? { ...prev, status } : null);
    }
    setUpdatingStatus(null);
  };

  // Handle status selection in detail modal
  const handleModalStatusSelect = (status: OrderStatus) => {
    setSelectedStatusInModal(status);
    if (status !== "enviado") {
      setModalTrackingCode("");
    }
  };

  // Confirm status change from detail modal
  const confirmModalStatusChange = () => {
    if (!selectedOrder || !selectedStatusInModal) return;

    // If enviado and no tracking code, don't update
    if (selectedStatusInModal === "enviado" && !modalTrackingCode.trim()) {
      return;
    }

    // Update order
    const updateData: Partial<Order> = { status: selectedStatusInModal };
    if (selectedStatusInModal === "enviado" && modalTrackingCode.trim()) {
      updateData.trackingCode = modalTrackingCode.trim();
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? { ...o, ...updateData } : o))
    );

    setSelectedOrder((prev) => (prev ? { ...prev, ...updateData } : null));

    // Show success toast
    if (selectedStatusInModal === "enviado") {
      setToast({ message: "E-mail com código de rastreio enviado com sucesso!", show: true });
      setTimeout(() => setToast({ message: "", show: false }), 4000);
    }

    // Reset modal state
    setSelectedStatusInModal(null);
    setModalTrackingCode(selectedOrder.trackingCode || "");
    setIsEditingTracking(false);
  };

  // Update tracking code only (without changing status)
  const updateTrackingCode = () => {
    if (!selectedOrder || !modalTrackingCode.trim()) return;

    const isNewCode = !selectedOrder.trackingCode;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id ? { ...o, trackingCode: modalTrackingCode.trim() } : o
      )
    );

    setSelectedOrder((prev) =>
      prev ? { ...prev, trackingCode: modalTrackingCode.trim() } : null
    );

    // Show success toast
    const message = isNewCode
      ? "E-mail com código de rastreio enviado com sucesso!"
      : "Código de rastreio atualizado e e-mail reenviado!";
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: "", show: false }), 4000);

    setIsEditingTracking(false);
  };

  const handleSendWithTracking = () => {
    if (!trackingCode.trim()) {
      return;
    }

    if (pendingOrderId && pendingStatus) {
      // Update order with tracking code
      setOrders((prev) =>
        prev.map((o) =>
          o.id === pendingOrderId
            ? { ...o, status: pendingStatus, trackingCode: trackingCode.trim() }
            : o
        )
      );

      if (selectedOrder?.id === pendingOrderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: pendingStatus, trackingCode: trackingCode.trim() } : null
        );
      }

      // Show success toast
      setToast({ message: "E-mail com código de rastreio enviado com sucesso!", show: true });
      setTimeout(() => setToast({ message: "", show: false }), 4000);

      // Reset modal
      setShowTrackingModal(false);
      setTrackingCode("");
      setPendingOrderId(null);
      setPendingStatus(null);
    }
  };

  const totalByStatus = (status: FilterStatus) =>
    orders.filter((o) => status === "all" || o.status === status).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Gerenciamento de Pedidos</h2>
        <p className="text-gray-500 text-sm">{orders.length} pedidos no total</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["pendente", "confirmado", "enviado", "entregue", "cancelado"] as OrderStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const count = orders.filter((o) => o.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? "all" : status)}
              className={`p-3 border text-left transition-all ${
                filterStatus === status
                  ? "border-[#1a1a1a] shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-200"
              } bg-white shadow-sm`}
            >
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs mb-1 ${config.color}`}>
                {config.icon} {config.label}
              </div>
              <p className="text-gray-900 text-lg">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, pedido ou e-mail..."
            className="w-full border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "online", "loja"] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs transition-colors ${
                filterType === type ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {type === "all" ? "Todos" : type === "online" ? <><Globe className="w-3 h-3" /> Online</> : <><Store className="w-3 h-3" /> Loja</>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs">
                <th className="text-left px-4 py-3">Pedido</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Data</th>
                <th className="text-center px-4 py-3 hidden sm:table-cell">Tipo</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => {
                const config = STATUS_CONFIG[order.status];
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-gray-800 font-mono text-xs">{order.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-gray-900">{order.customer}</p>
                        <p className="text-gray-400 text-xs">{order.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-500 text-xs">
                        {new Date(order.date).toLocaleDateString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        order.type === "online" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                      }`}>
                        {order.type === "online" ? <Globe className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                        {order.type === "online" ? "Online" : "Loja"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[#C8427C]">
                        R$ {order.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="relative">
                        <button
                          onClick={() => setUpdatingStatus(updatingStatus === order.id ? null : order.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.color} cursor-pointer hover:opacity-80 transition-opacity`}
                        >
                          {config.icon}
                          {config.label}
                          <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                        </button>
                        {updatingStatus === order.id && (
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white shadow-lg rounded-xl py-1 z-10 w-36 border border-gray-100">
                            {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => {
                              const sc = STATUS_CONFIG[s];
                              return (
                                <button
                                  key={s}
                                  onClick={() => updateStatus(order.id, s)}
                                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-left ${
                                    order.status === s ? "text-gray-900" : "text-gray-600"
                                  }`}
                                >
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${sc.color}`}>
                                    {sc.icon}
                                  </span>
                                  {sc.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              Nenhum pedido encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[60] transition-all duration-300">
          <div className="bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-sm">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Tracking Code Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-gray-900">Código de Rastreio</h3>
              <button
                onClick={() => {
                  setShowTrackingModal(false);
                  setTrackingCode("");
                  setPendingOrderId(null);
                  setPendingStatus(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Informe o código de rastreio para enviar por e-mail ao cliente.
              </p>
              <div>
                <label className="block text-xs text-gray-500 mb-2">Código de Rastreio</label>
                <input
                  type="text"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && trackingCode.trim()) {
                      handleSendWithTracking();
                    }
                  }}
                  placeholder="Ex: BR123456789BR"
                  className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a] rounded-lg"
                  autoFocus
                />
              </div>
              <button
                onClick={handleSendWithTracking}
                disabled={!trackingCode.trim()}
                className="w-full bg-[#1a1a1a] text-white py-2.5 hover:bg-[#333333] transition-colors text-sm rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Enviar E-mail com Código
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-gray-900">{selectedOrder.id}</h3>
                <p className="text-gray-400 text-xs">
                  {new Date(selectedOrder.date).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Customer */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">Cliente</p>
                <p className="text-gray-900 text-sm">{selectedOrder.customer}</p>
                <p className="text-gray-500 text-xs">{selectedOrder.email}</p>
                <p className="text-gray-500 text-xs">{selectedOrder.phone}</p>
                {selectedOrder.address && (
                  <p className="text-gray-500 text-xs mt-1">{selectedOrder.address}</p>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Itens</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex gap-3 items-center border border-gray-100 rounded-xl p-3">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-10 h-12 object-cover object-top rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-400">
                          Tam: {item.size} · Cor: {item.color} · Qtd: {item.quantity}
                        </p>
                      </div>
                      <span className="text-sm text-[#C8427C] shrink-0">
                        R$ {(item.product.price * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Total */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pagamento</span>
                  <span className="text-gray-700">{selectedOrder.payment}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Canal</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                    selectedOrder.type === "online" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                  }`}>
                    {selectedOrder.type === "online" ? "Online" : "Loja Física"}
                  </span>
                </div>
                {selectedOrder.trackingCode && !isEditingTracking && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Rastreio</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-mono text-xs">{selectedOrder.trackingCode}</span>
                      <button
                        onClick={() => setIsEditingTracking(true)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Editar código de rastreio"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {isEditingTracking && (
                  <div className="space-y-2">
                    <label className="block text-xs text-gray-500">Código de Rastreio</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={modalTrackingCode}
                        onChange={(e) => setModalTrackingCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && modalTrackingCode.trim()) {
                            updateTrackingCode();
                          }
                          if (e.key === "Escape") {
                            setIsEditingTracking(false);
                            setModalTrackingCode(selectedOrder.trackingCode || "");
                          }
                        }}
                        placeholder="Ex: BR123456789BR"
                        className="flex-1 border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-[#1a1a1a] rounded-lg font-mono"
                        autoFocus
                      />
                      <button
                        onClick={updateTrackingCode}
                        disabled={!modalTrackingCode.trim() || modalTrackingCode.trim() === selectedOrder.trackingCode}
                        className="bg-[#1a1a1a] text-white px-3 py-1.5 hover:bg-[#333333] transition-colors text-xs rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingTracking(false);
                          setModalTrackingCode(selectedOrder.trackingCode || "");
                        }}
                        className="border border-gray-200 text-gray-600 px-3 py-1.5 hover:bg-gray-50 transition-colors text-xs rounded-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                {/* Show option to add tracking code if order is "enviado" but has no code */}
                {selectedOrder.status === "enviado" && !selectedOrder.trackingCode && !isEditingTracking && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-500">Rastreio</span>
                    <button
                      onClick={() => setIsEditingTracking(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Adicionar código
                    </button>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[#C8427C]">
                    R$ {selectedOrder.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Status update */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Atualizar Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map((s) => {
                    const sc = STATUS_CONFIG[s];
                    return (
                      <button
                        key={s}
                        onClick={() => handleModalStatusSelect(s)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs transition-colors ${
                          selectedStatusInModal === s
                            ? "border-[#1a1a1a] bg-gray-100 text-gray-900"
                            : selectedOrder.status === s
                            ? "border-gray-300 bg-gray-50 text-gray-700"
                            : "border-gray-100 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className={`p-1 rounded-lg ${sc.color}`}>{sc.icon}</span>
                        {sc.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tracking code input if "enviado" is selected */}
                {selectedStatusInModal === "enviado" && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-xl space-y-2">
                    <label className="block text-xs text-gray-600">
                      Código de Rastreio *
                    </label>
                    <input
                      type="text"
                      value={modalTrackingCode}
                      onChange={(e) => setModalTrackingCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && modalTrackingCode.trim()) {
                          confirmModalStatusChange();
                        }
                      }}
                      placeholder="Ex: BR123456789BR"
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] rounded-lg"
                    />
                  </div>
                )}

                {/* Confirm button */}
                {selectedStatusInModal && selectedStatusInModal !== selectedOrder.status && (
                  <button
                    onClick={confirmModalStatusChange}
                    disabled={selectedStatusInModal === "enviado" && !modalTrackingCode.trim()}
                    className="w-full mt-3 bg-[#1a1a1a] text-white py-2.5 hover:bg-[#333333] transition-colors text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedStatusInModal === "enviado" ? (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar E-mail com Código
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Confirmar Alteração
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}