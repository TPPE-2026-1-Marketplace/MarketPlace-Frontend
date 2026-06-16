import React, { useState } from "react";
import {
  Store,
  Search,
  Check,
  X,
  Shield,
  Package,
  Clock,
  QrCode,
  RefreshCw,
  User,
  ShoppingCart,
} from "lucide-react";
import { MOCK_ORDERS } from "../../data/products";

type PickupStep = "buscar" | "verificar" | "validar" | "concluido";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function StorePickup() {
  const [step, setStep] = useState<PickupStep>("buscar");
  const [search, setSearch] = useState("");
  const [foundOrder, setFoundOrder] = useState<(typeof MOCK_ORDERS)[0] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [twoFACode] = useState(generateCode);
  const [enteredCode, setEnteredCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [completedOrders, setCompletedOrders] = useState<string[]>([]);

  const storeOrders = MOCK_ORDERS.filter(
    (o) => o.type === "loja" || o.status === "confirmado"
  ).filter((o) => !completedOrders.includes(o.id));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = search.trim().toLowerCase();
    const found = storeOrders.find(
      (o) =>
        o.id.toLowerCase().includes(term) ||
        o.customer.toLowerCase().includes(term) ||
        o.email.toLowerCase().includes(term)
    );
    if (found) {
      setFoundOrder(found);
      setNotFound(false);
      setStep("verificar");
    } else {
      setNotFound(true);
      setFoundOrder(null);
    }
  };

  const handleSend2FA = () => {
    setStep("validar");
    setEnteredCode("");
    setCodeError("");
  };

  const handleValidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCode === twoFACode) {
      setStep("concluido");
      if (foundOrder) {
        setCompletedOrders((prev) => [...prev, foundOrder.id]);
      }
    } else {
      setCodeError("Código inválido. Verifique e tente novamente.");
    }
  };

  const handleReset = () => {
    setStep("buscar");
    setSearch("");
    setFoundOrder(null);
    setNotFound(false);
    setEnteredCode("");
    setCodeError("");
  };

  const statusColor: Record<string, string> = {
    pendente: "bg-amber-100 text-amber-700",
    confirmado: "bg-gray-100 text-gray-600",
    enviado: "bg-blue-100 text-blue-700",
    entregue: "bg-green-100 text-green-700",
    cancelado: "bg-red-100 text-red-600",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#1a1a1a] flex items-center justify-center text-white">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-gray-900">Retirada na Loja</h2>
          <p className="text-gray-500 text-sm">Validação de pedidos com código 2FA</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Checkout flow */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step indicator */}
          <div className="bg-white border border-gray-100 p-4">
            <div className="flex items-center gap-0">
              {[
                { label: "Buscar Pedido", icon: <Search className="w-3.5 h-3.5" /> },
                { label: "Verificar", icon: <Package className="w-3.5 h-3.5" /> },
                { label: "Validar 2FA", icon: <Shield className="w-3.5 h-3.5" /> },
                { label: "Concluído", icon: <Check className="w-3.5 h-3.5" /> },
              ].map((s, i) => {
                const stepOrder: PickupStep[] = ["buscar", "verificar", "validar", "concluido"];
                const currentIdx = stepOrder.indexOf(step);
                const isActive = i === currentIdx;
                const isDone = i < currentIdx;
                return (
                  <React.Fragment key={s.label}>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-8 h-8 flex items-center justify-center text-xs border-2 transition-all ${
                          isDone
                            ? "bg-[#1a1a1a] border-[#1a1a1a] text-white"
                            : isActive
                            ? "border-[#1a1a1a] text-[#1a1a1a]"
                            : "border-gray-200 text-gray-400"
                        }`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : s.icon}
                      </div>
                      <span
                        className={`text-xs hidden sm:block ${
                          isActive ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < 3 && (
                      <div
                        className={`flex-1 h-0.5 -mt-4 mx-1 ${
                          i < currentIdx ? "bg-[#1a1a1a]" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step 1: Search */}
          {step === "buscar" && (
            <div className="bg-white border border-gray-100 p-6">
              <h3 className="text-gray-900 mb-4">Buscar Pedido</h3>
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Número do pedido, nome ou e-mail da cliente..."
                    className="w-full border border-gray-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#1a1a1a] text-white px-5 py-2.5 text-sm hover:bg-[#333] transition-colors"
                >
                  Buscar
                </button>
              </form>
              {notFound && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 text-sm text-red-700">
                  <X className="w-4 h-4" />
                  Nenhum pedido encontrado. Verifique o número, nome ou e-mail.
                </div>
              )}
              <p className="text-xs text-gray-400">
                Busque pelo ID do pedido (ex: PED-2026-001), nome ou e-mail da cliente.
              </p>
            </div>
          )}

          {/* Step 2: Verify */}
          {step === "verificar" && foundOrder && (
            <div className="bg-white border border-gray-100 p-6">
              <h3 className="text-gray-900 mb-5">Verificar Pedido</h3>
              <div className="border border-gray-100 p-4 mb-5">
                {/* Order header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Número do Pedido</p>
                    <p className="text-gray-900">{foundOrder.id}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 ${statusColor[foundOrder.status]}`}>
                    {foundOrder.status.charAt(0).toUpperCase() + foundOrder.status.slice(1)}
                  </span>
                </div>

                {/* Customer */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Cliente</p>
                    <p className="text-gray-800">{foundOrder.customer}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">E-mail</p>
                    <p className="text-gray-800">{foundOrder.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Telefone</p>
                    <p className="text-gray-800">{foundOrder.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs mb-0.5">Pagamento</p>
                    <p className="text-gray-800">{foundOrder.payment}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-gray-700 text-sm mb-3">Itens do Pedido:</p>
                  <div className="space-y-2">
                    {foundOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-12 h-14 object-cover object-top border border-gray-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500">
                            Tam: {item.size} · Cor: {item.color} · Qtd: {item.quantity}
                          </p>
                          <p className="text-xs text-gray-400">{item.product.sku}</p>
                        </div>
                        <p className="text-sm text-gray-800 shrink-0">
                          R$ {item.product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between">
                  <span className="text-gray-700">Total do Pedido</span>
                  <span className="text-gray-900">
                    R$ {foundOrder.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 text-sm hover:border-gray-400 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={handleSend2FA}
                  className="flex-1 bg-[#1a1a1a] text-white py-2.5 text-sm hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Enviar Código 2FA
                </button>
              </div>
            </div>
          )}

          {/* Step 3: 2FA Validation */}
          {step === "validar" && (
            <div className="bg-white border border-gray-100 p-6">
              <h3 className="text-gray-900 mb-2">Validação 2FA</h3>
              <p className="text-gray-500 text-sm mb-6">
                Um código de verificação foi enviado via SMS e WhatsApp para o cliente.
                Solicite que o cliente informe o código recebido.
              </p>

              {/* Simulated code display (for demo) */}
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700 text-xs">
                    MODO DEMO — Código enviado para o cliente:
                  </span>
                </div>
                <p className="text-amber-900 tracking-[0.5em] text-2xl">{twoFACode}</p>
                <p className="text-amber-600 text-xs mt-1">
                  Em produção, este código seria exibido apenas no dispositivo do cliente.
                </p>
              </div>

              <form onSubmit={handleValidate} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Código informado pela cliente:
                  </label>
                  <input
                    type="text"
                    value={enteredCode}
                    onChange={(e) => {
                      setEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setCodeError("");
                    }}
                    placeholder="000000"
                    maxLength={6}
                    className={`w-full border px-4 py-3 text-center text-xl tracking-[0.5em] focus:outline-none ${
                      codeError
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 focus:border-[#1a1a1a]"
                    }`}
                  />
                  {codeError && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" /> {codeError}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("verificar")}
                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 text-sm hover:border-gray-400 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={enteredCode.length !== 6}
                    className="flex-1 bg-[#1a1a1a] text-white py-2.5 text-sm hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirmar Retirada
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 4: Done */}
          {step === "concluido" && (
            <div className="bg-white border border-gray-100 p-8 text-center">
              <div className="w-20 h-20 bg-green-100 flex items-center justify-center mx-auto mb-5">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-gray-900 mb-2">Retirada Confirmada!</h3>
              <p className="text-gray-500 text-sm mb-1">
                Pedido <strong>{foundOrder?.id}</strong> entregue para:
              </p>
              <p className="text-gray-800 mb-5">{foundOrder?.customer}</p>

              <div className="bg-gray-50 border border-gray-100 p-4 mb-6 text-sm text-left space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Total</span>
                  <span>R$ {foundOrder?.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Data/Hora</span>
                  <span>
                    {new Date().toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Validação</span>
                  <span className="text-green-600">2FA Confirmada</span>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full border border-gray-200 text-gray-700 py-2.5 text-sm hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Nova Retirada
              </button>
            </div>
          )}
        </div>

        {/* Right: Queue */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Fila de Retirada</h3>
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5">
                {storeOrders.length} pendente{storeOrders.length !== 1 ? "s" : ""}
              </span>
            </div>
            {storeOrders.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhum pedido na fila</p>
              </div>
            ) : (
              <div className="space-y-3">
                {storeOrders.slice(0, 8).map((order) => (
                  <button
                    key={order.id}
                    onClick={() => {
                      setFoundOrder(order);
                      setStep("verificar");
                    }}
                    className="w-full flex items-start gap-3 p-3 border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{order.customer}</p>
                      <p className="text-xs text-gray-400">{order.id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{order.date}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-800">
                        R$ {order.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2FA info */}
          <div className="bg-[#1a1a1a] p-5">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="w-5 h-5 text-gray-400" />
              <span className="text-gray-200 text-sm">Segurança 2FA</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">
              Cada retirada exige validação de um código de 6 dígitos enviado ao cliente via SMS
              e WhatsApp. O código é válido por <strong className="text-gray-300">10 minutos</strong> e
              expira após uso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
