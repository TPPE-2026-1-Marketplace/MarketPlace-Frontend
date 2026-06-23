
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight, Info } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";

export default function CarrinhoPage() {
  const { cart, updateQuantity, removeItem, clear, applyCoupon } = useCart();
  const navigate = useNavigate();
  const [cep, setCep] = useState("");
  const [shippingMsg, setShippingMsg] = useState<string | null>(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleShipCalc = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      setShippingMsg("CEP inválido. Use 8 dígitos.");
      setShippingOptions([]);
      return;
    }

    setShippingLoading(true);
    setShippingMsg(null);
    setShippingOptions([]);

    try {
      const options = await api.post<any[]>("/shipping/calculate", {
        cep_destino: cleanCep,
        valor_declarado: cart.subtotal,
      });
      setShippingOptions(options);
      if (options.length === 0) {
        setShippingMsg("Não atendemos essa região no momento.");
      }
    } catch {
      setShippingMsg("Erro ao calcular frete. Tente novamente.");
    } finally {
      setShippingLoading(false);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setCouponLoading(true);
    setCouponMsg(null);
    try {
      const productIds = Array.from(new Set(cart.items.map(i => i.variant.produto.idProduto))).join(",");
      const res = await api.get<{ valid: boolean, reason?: string, tipoCupom?: string, valorDesconto?: number }>(`/coupons/validate/${couponInput.trim()}?productIds=${productIds}`);
      
      if (res.valid) {
        setCouponMsg({ text: "Cupom aplicado com sucesso!", error: false });
        if (res.tipoCupom === "porcentagem") {
          applyCoupon(couponInput.trim(), res.valorDesconto, 0);
        } else {
          applyCoupon(couponInput.trim(), 0, res.valorDesconto);
        }
      } else {
        const errorText = res.reason === "expired" ? "Cupom expirado." :
                          res.reason === "limit_reached" ? "Limite de uso atingido." :
                          res.reason === "ineligible_products" ? "Cupom não aplicável a estes produtos." : "Cupom inválido.";
        setCouponMsg({ text: errorText, error: true });
        applyCoupon(null, 0, 0);
      }
    } catch {
      setCouponMsg({ text: "Erro ao validar cupom.", error: true });
      applyCoupon(null, 0, 0);
    } finally {
      setCouponLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-gray-900 mb-2 font-serif text-2xl">Seu carrinho está vazio</h2>
          <p className="text-gray-500 text-sm mb-6 font-sans">
            Explore nossa coleção e encontre o vestido perfeito para você!
          </p>
          <Link
            to="/produtos"
            className="bt-principal inline-flex items-center gap-2 px-6 py-3 text-sm font-sans"
          >
            <ArrowLeft className="w-4 h-4" /> Continuar Comprando
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="bg-[#1a1a1a] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white font-serif text-3xl mb-1">Meu Carrinho</h1>
          <p className="text-gray-400 text-sm font-sans">
            {cart.items.length} item{cart.items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Items */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Link
                to="/produtos"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Continuar comprando
              </Link>
              <button
                onClick={clear}
                className="text-xs text-red-500 hover:underline"
              >
                Limpar carrinho
              </button>
            </div>

            {cart.items.map((item) => (
              <div
                key={item.variant.codigoSku}
                className="bg-white p-4 border border-gray-100 flex gap-4"
              >
                <Link to={`/produtos/${item.variant.produto.idProduto}`} className="shrink-0 relative w-20 h-24 sm:w-24 sm:h-32">
                  <img
                    src={item.variant.images?.[0]?.url || "/hero-dress.png"}
                    alt={item.variant.produto.titulo}
                    className="object-cover object-top"
                  />
                </Link>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex justify-between gap-2">
                    <div>
                      <Link
                        to={`/produtos/${item.variant.produto.idProduto}`}
                        className="text-gray-900 hover:text-gray-600 transition-colors line-clamp-1 text-sm font-medium"
                      >
                        {item.variant.produto.titulo}
                      </Link>
                      <div className="flex gap-3 mt-1 text-xs text-gray-500">
                        {item.variant.tamanho && (
                          <span>
                            Tam: <strong>{item.variant.tamanho}</strong>
                          </span>
                        )}
                        {item.variant.cor && (
                          <span>
                            Cor: <strong>{item.variant.cor}</strong>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.variant.codigoSku}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.variant.codigoSku)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0 h-fit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.variant.codigoSku, item.quantity - 1)
                        }
                        className="w-7 h-7 border border-gray-200 flex items-center justify-center hover:border-gray-500 transition-colors text-gray-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-gray-900 text-sm w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.variant.codigoSku, item.quantity + 1)
                        }
                        className="w-7 h-7 border border-gray-200 flex items-center justify-center hover:border-gray-500 transition-colors text-gray-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 text-sm font-medium">
                        {formatCurrency((item.variant.precoVariante ?? item.variant.produto.precoBase) * item.quantity)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-400">
                          {formatCurrency(item.variant.precoVariante ?? item.variant.produto.precoBase)} cada
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Shipping simulation */}
            <div className="bg-white p-4 border border-gray-100">
              <p className="text-sm text-gray-700 mb-3">Simular entrega</p>
              <form onSubmit={handleShipCalc} className="flex gap-2">
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => {
                    setCep(e.target.value);
                    setShippingMsg(null);
                  }}
                  placeholder="Digite seu CEP"
                  maxLength={9}
                  className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                />
                <button
                  type="submit"
                  className="bt-principal px-4 py-2 text-sm"
                >
                  Calcular
                </button>
              </form>
              {shippingLoading && (
                <p className="text-sm text-gray-500 mt-2">Calculando...</p>
              )}
              {shippingOptions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {shippingOptions.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-3 border border-gray-100 bg-gray-50"
                    >
                      <div>
                        <p className="text-sm text-gray-800">{opt.name}</p>
                        <p className="text-xs text-gray-500">
                          {opt.company?.name} · {opt.delivery_time} dia{opt.delivery_time !== 1 ? "s" : ""}
                          {opt.delivery_range && ` (${opt.delivery_range.min}-${opt.delivery_range.max} dias)`}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {opt.price === 0 ? "Grátis" : formatCurrency(opt.price)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {shippingMsg && !shippingLoading && shippingOptions.length === 0 && (
                <p className="text-sm text-gray-600 mt-2">{shippingMsg}</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white p-6 border border-gray-100 sticky top-24">
              
              {/* Cupom */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <p className="text-sm text-gray-700 mb-3 font-medium">Cupom de Desconto</p>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Código do cupom"
                    className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] uppercase"
                  />
                  <button type="submit" disabled={couponLoading} className="bt-principal px-4 py-2 text-sm disabled:opacity-50">
                    Aplicar
                  </button>
                </form>
                {couponMsg && (
                  <p className={`text-xs mt-2 ${couponMsg.error ? "text-red-600" : "text-green-600"}`}>
                    {couponMsg.text}
                  </p>
                )}
                {cart.cupom && !couponMsg && (
                  <p className="text-xs mt-2 text-green-600">Cupom {cart.cupom} aplicado.</p>
                )}
              </div>

              <h2 className="text-gray-900 mb-5 font-serif text-xl">Resumo do Pedido</h2>

              <div className="space-y-3 mb-5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({cart.items.length} ite{cart.items.length !== 1 ? "ns" : "m"})</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Frete</span>
                  <span>Calculado no checkout</span>
                </div>
                {cart.desconto > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(cart.desconto)}</span>
                  </div>
                )}
              </div>

              {/* Subtotal display with note */}
              <div className="border-t border-gray-100 pt-4 mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 text-sm font-medium">Subtotal</span>
                  <div className="text-right">
                    <p className="text-gray-900 font-semibold" style={{ fontSize: "1.2rem" }}>
                      {formatCurrency(cart.total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Important note */}
              <div className="flex items-start gap-2 bg-gray-50 border border-gray-100 p-3 mb-5 text-xs text-gray-500">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                <span>O valor final será calculado no checkout, incluindo frete e descontos aplicáveis.</span>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="bt-principal w-full py-3 flex items-center justify-center gap-2 text-sm tracking-wide"
              >
                Finalizar Compra <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-4 flex items-center justify-center gap-4">
                {["visa", "master", "pix"].map((p) => (
                  <span
                    key={p}
                    className="text-xs text-gray-400 uppercase tracking-wider"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
