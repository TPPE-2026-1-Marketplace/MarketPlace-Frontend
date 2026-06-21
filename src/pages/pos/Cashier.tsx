import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Package,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  User,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePOS } from "../../context/POSContext";
import { ApiProduct, POSSaleItem } from "../../data/pos-types";
import { api } from "../../lib/api";

export function Cashier() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentSale, addItem, removeItem, updateQuantity, clearSale, completeSale } = usePOS();

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [selectedVariantSku, setSelectedVariantSku] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [sellerCode, setSellerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("card");
  
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchProducts();
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<{ data: ApiProduct[] }>("/products?limit=100");
      setProducts(response.data);
    } catch (err: any) {
      setError("Erro ao carregar produtos. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const subtotal = currentSale.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = subtotal;

  const handleAddToSale = () => {
    if (!selectedProduct || !selectedVariantSku) {
      setMessage({ type: "error", text: "Selecione o produto e a variação." });
      return;
    }

    const variant = selectedProduct.variants.find((v) => v.codigoSku === selectedVariantSku);
    if (!variant) {
      setMessage({ type: "error", text: "Variação não encontrada." });
      return;
    }

    const item: POSSaleItem = {
      product: selectedProduct,
      variantSku: variant.codigoSku,
      size: variant.tamanho || "Padrão",
      color: variant.cor || "Padrão",
      quantity,
      unitPrice: variant.precoVariante ?? selectedProduct.precoBase,
    };

    addItem(item);
    setMessage({ type: "success", text: "Produto adicionado à venda!" });
    setSelectedProduct(null);
    setSelectedVariantSku("");
    setQuantity(1);
    setSearch("");

    setTimeout(() => setMessage(null), 2000);
  };

  const handleFinalizeSale = () => {
    if (currentSale.length === 0) {
      setMessage({ type: "error", text: "Adicione produtos à venda." });
      return;
    }
    // Auto-fill seller if it's an employee
    if (user?.role === "employee" || user?.role === "manager") {
      setSellerCode(user.id);
    }
    setShowCheckout(true);
  };

  const handleCompleteSale = async () => {
    // Se o usuário logado for vendedor ou gerente, força o uso do seu próprio CPF do JWT
    const finalSellerId = (user?.role === "employee" || user?.role === "manager") ? user.id : sellerCode;

    if (!finalSellerId.trim()) {
      setMessage({ type: "error", text: "Informe o código do vendedor (CPF)." });
      return;
    }

    setIsCompleting(true);
    const result = await completeSale(
      paymentMethod,
      finalSellerId,
      finalSellerId, // sellerName is not validated by backend
      customerName || undefined,
      customerPhone || undefined,
      customerEmail || undefined
    );
    setIsCompleting(false);

    if (result.success) {
      setMessage({ type: "success", text: `Venda #${result.saleId} finalizada com sucesso!` });
      setShowCheckout(false);
      setSellerCode("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: "error", text: result.message || "Erro ao finalizar venda." });
    }
  };

  const handleCancelCheckout = () => {
    setShowCheckout(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/selecionar-modulo")}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-gray-900 text-xl">PDV - Ponto de Venda</h1>
              <p className="text-gray-500 text-xs">
                {user.name} • {user.role === "manager" ? "Gerente" : user.role === "superadmin" ? "Admin" : "Vendedor"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-400">Total da Venda</p>
              <p className="text-gray-900 text-xl">
                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {message && (
        <div className="mx-6 mt-4">
          <div
            className={`flex items-center gap-2 p-3 text-sm border ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {message.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0" />
            )}
            {message.text}
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou código SKU..."
                className="w-full border border-gray-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
          </div>

          <div className="bg-white border border-gray-100 p-4 max-h-[400px] overflow-y-auto">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
              Produtos Disponíveis ({filteredProducts.length})
            </p>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Carregando produtos do sistema...</p>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8 text-sm">
                {error}
                <br />
                <button onClick={fetchProducts} className="mt-2 text-[#1a1a1a] underline">Tentar novamente</button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">
                    Nenhum produto encontrado.
                  </p>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.idProduto}
                      onClick={() => {
                        setSelectedProduct(product);
                        setSelectedVariantSku("");
                        setQuantity(1);
                      }}
                      className={`w-full flex items-center gap-3 p-3 border transition-all text-left ${
                        selectedProduct?.idProduto === product.idProduto
                          ? "border-[#1a1a1a] bg-gray-50"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-12 h-16 bg-gray-100 shrink-0 flex items-center justify-center text-gray-400">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm truncate">{product.titulo}</p>
                        <p className="text-gray-400 text-xs">{product.sku}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-gray-900 text-sm">
                            R$ {Number(product.precoBase).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="bg-white border border-gray-100 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
                Configurar Produto
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Variação (Tamanho / Cor) *</label>
                  <select
                    value={selectedVariantSku}
                    onChange={(e) => setSelectedVariantSku(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  >
                    <option value="">Selecione a variação</option>
                    {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                      selectedProduct.variants.map((variant) => (
                        <option key={variant.codigoSku} value={variant.codigoSku}>
                          {variant.tamanho || "-"} / {variant.cor || "-"} (R$ {Number(variant.precoVariante || selectedProduct.precoBase).toFixed(2)})
                        </option>
                      ))
                    ) : (
                      <option disabled>Nenhuma variação cadastrada</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
              </div>
              <button
                onClick={handleAddToSale}
                className="w-full mt-3 bg-[#1a1a1a] text-white py-2.5 hover:bg-[#333333] transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Adicionar à Venda
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Itens da Venda ({currentSale.length})
              </p>
              {currentSale.length > 0 && (
                <button
                  onClick={clearSale}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Limpar tudo
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {currentSale.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum item adicionado</p>
                </div>
              ) : (
                currentSale.map((item, idx) => (
                  <div key={idx} className="border border-gray-100 p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-xs truncate">{item.product.titulo}</p>
                        <p className="text-gray-400 text-xs">
                          {item.size} • {item.color}
                        </p>
                        <p className="text-gray-700 text-sm mt-0.5">
                          R$ {Number(item.unitPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(idx, item.quantity - 1)}
                          className="w-6 h-6 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm text-gray-900 w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, item.quantity + 1)}
                          className="w-6 h-6 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-gray-900">
                        R${" "}
                        {(Number(item.unitPrice) * item.quantity).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {currentSale.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">
                    R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900 text-xl">
                    R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  onClick={handleFinalizeSale}
                  className="w-full bg-[#1a1a1a] text-white py-3 hover:bg-[#333333] transition-colors text-sm"
                >
                  Finalizar Venda
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-gray-900">Finalizar Venda</h3>
              <button onClick={handleCancelCheckout} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">
                  CPF do Vendedor *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={user?.role === "employee" || user?.role === "manager" ? user.id : sellerCode}
                    onChange={(e) => setSellerCode(e.target.value)}
                    placeholder="Somente os 11 dígitos"
                    maxLength={11}
                    disabled={user?.role === "employee" || user?.role === "manager"}
                    className="w-full border border-gray-200 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
                  Dados do Cliente (Opcional)
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nome completo (ignorado na API temporariamente)"
                      className="w-full border border-gray-200 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
                  Forma de Pagamento *
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center justify-center gap-2 p-3 border transition-all ${
                      paymentMethod === "card"
                        ? "border-[#1a1a1a] bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-sm">Cartão</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("pix")}
                    className={`flex items-center justify-center gap-2 p-3 border transition-all ${
                      paymentMethod === "pix"
                        ? "border-[#1a1a1a] bg-gray-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-sm">PIX</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Total da Venda</span>
                  <span className="text-gray-900 text-xl">
                    R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                disabled={isCompleting}
                onClick={handleCancelCheckout}
                className="flex-1 border border-gray-200 text-gray-600 py-2 hover:border-gray-400 transition-colors text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                disabled={isCompleting}
                onClick={handleCompleteSale}
                className="flex-1 bg-[#1a1a1a] text-white py-2 hover:bg-[#333333] transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Venda"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
