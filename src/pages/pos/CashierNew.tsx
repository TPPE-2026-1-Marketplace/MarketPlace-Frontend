import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
  Store,
  Globe,
  X,
  LayoutDashboard,
  ShoppingBag,
  AlertTriangle,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePOS } from "../../context/POSContext";
import { PRODUCTS } from "../../data/products";
import { Product } from "../../data/products";
import { POSSaleItem, generateProductVariations } from "../../data/pos-types";
const logoImage = "/dk-logo.png";

export function CashierNew() {
  const navigate = useNavigate();
  const { user, users, logout } = useAuth();
  const { currentSale, addItem, removeItem, updateQuantity, clearSale, completeSale } = usePOS();

  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sellerCode, setSellerCode] = useState("");
  const [validatedSeller, setValidatedSeller] = useState<{ id: string; name: string } | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("card");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState("");
  const [moduleSwitcherOpen, setModuleSwitcherOpen] = useState(false);
  const [showCustomProductModal, setShowCustomProductModal] = useState(false);
  const [customProduct, setCustomProduct] = useState({
    name: "",
    price: "",
    quantity: 1,
    obs: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Validate seller code in real-time
  useEffect(() => {
    if (sellerCode.trim().length >= 2) {
      const seller = users.find(
        (u) =>
          (u.id === sellerCode || u.email.split("@")[0].toLowerCase() === sellerCode.toLowerCase()) &&
          (u.role === "employee" || u.role === "manager" || u.role === "superadmin")
      );
      setValidatedSeller(seller ? { id: seller.id, name: seller.name } : null);
    } else {
      setValidatedSeller(null);
    }
  }, [sellerCode, users]);

  const filteredProducts = PRODUCTS.filter(
    (p) =>
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.colors.some((c) => c.toLowerCase().includes(search.toLowerCase())) ||
      p.sizes.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const subtotal = currentSale.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = subtotal;

  const handleAddToSale = () => {
    if (!selectedProduct) {
      setMessage({ type: "error", text: "Selecione um produto." });
      return;
    }
    if (!selectedSize || !selectedColor) {
      setMessage({ type: "error", text: "Selecione tamanho e cor." });
      return;
    }

    const variations = generateProductVariations(selectedProduct);
    const variation = variations.find((v) => v.size === selectedSize && v.color === selectedColor);

    if (!variation || variation.stockPhysical < quantity) {
      setMessage({ type: "error", text: "Estoque insuficiente para esta variação." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const item: POSSaleItem = {
      product: selectedProduct,
      size: selectedSize,
      color: selectedColor,
      quantity,
      unitPrice: selectedProduct.price,
    };

    addItem(item);
    setMessage({ type: "success", text: `${selectedProduct.name} adicionado!` });
    setSelectedProduct(null);
    setSelectedSize("");
    setSelectedColor("");
    setQuantity(1);

    setTimeout(() => setMessage(null), 2000);
  };

  const handleFinalizeSale = () => {
    if (currentSale.length === 0) {
      setMessage({ type: "error", text: "Adicione produtos à venda." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (!validatedSeller) {
      setMessage({ type: "error", text: "Informe um código de vendedor válido." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const result = completeSale(
      paymentMethod,
      validatedSeller.id,
      validatedSeller.name,
      customerName || undefined,
      customerPhone || undefined,
      customerEmail || undefined
    );

    if (result.success) {
      setCompletedSaleId(result.saleId || "");
      setShowSuccessModal(true);
      setSellerCode("");
      setValidatedSeller(null);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
    } else {
      setMessage({ type: "error", text: "Erro ao finalizar venda." });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleClearSale = () => {
    if (confirm("Deseja realmente cancelar a venda atual?")) {
      clearSale();
      setMessage({ type: "success", text: "Venda cancelada." });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleStartNewSale = () => {
    setShowSuccessModal(false);
    setCompletedSaleId("");
  };

  const handleAddCustomProduct = () => {
    if (!customProduct.name.trim() || !customProduct.price) {
      setMessage({ type: "error", text: "Preencha nome e valor do produto." });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const customItem: POSSaleItem = {
      product: {
        id: `custom-${Date.now()}`,
        sku: "AVULSO",
        name: customProduct.name,
        description: customProduct.obs || "Produto avulso",
        price: parseFloat(customProduct.price),
        category: "festa",
        images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"],
        sizes: ["Único"],
        colors: ["Padrão"],
        stockEcommerce: 0,
        stockPhysical: 1,
        featured: false,
      },
      size: "Único",
      color: "Padrão",
      quantity: customProduct.quantity,
      unitPrice: parseFloat(customProduct.price),
    };

    addItem(customItem);
    setMessage({ type: "success", text: "Produto avulso adicionado!" });
    setShowCustomProductModal(false);
    setCustomProduct({ name: "", price: "", quantity: 1, obs: "" });
    setTimeout(() => setMessage(null), 2000);
  };

  const selectedVariation =
    selectedProduct && selectedSize && selectedColor
      ? generateProductVariations(selectedProduct).find(
          (v) => v.size === selectedSize && v.color === selectedColor
        )
      : null;

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-[#1a1a1a] text-white px-6 py-4 flex items-center justify-between shrink-0 z-30 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="h-8 w-20 overflow-hidden">
            <img src={logoImage} alt="DK Fashion" className="h-full w-full object-contain brightness-0 invert" />
          </div>
          <div className="h-6 w-px bg-white/20"></div>
          <div>
            <h1 className="text-white text-lg">PDV - Ponto de Venda</h1>
            <p className="text-gray-400 text-xs">{user.name} • Loja Física</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Module Switcher */}
          <div className="relative">
            <button
              onClick={() => setModuleSwitcherOpen(!moduleSwitcherOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors border border-white/20"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Módulos</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {moduleSwitcherOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setModuleSwitcherOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-lg py-1 w-56 z-50">
                  <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">Navegação</p>
                  </div>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Loja Online
                  </button>
                  {(user.role === "manager" || user.role === "superadmin") && (
                    <button
                      onClick={() => navigate("/gerente")}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Painel Gerencial
                    </button>
                  )}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Message bar */}
      {message && (
        <div
          className={`px-6 py-3 flex items-center gap-2 text-sm shrink-0 ${
            message.type === "error" ? "bg-red-50 text-red-700 border-b border-red-200" : "bg-green-50 text-green-700 border-b border-green-200"
          }`}
        >
          {message.type === "error" ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* Main 3-column layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT COLUMN: Product catalog */}
        <div className="w-full lg:w-2/5 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden">
          {/* Search */}
          <div className="p-4 bg-white border-b border-gray-200 shrink-0 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome, SKU, código, cor ou tamanho..."
                className="w-full border-2 border-gray-300 pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
              />
            </div>
            <button
              onClick={() => setShowCustomProductModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-dashed border-gray-300 text-gray-600 py-2.5 hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Adicionar Produto Avulso
            </button>
          </div>

          {/* Product list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum produto encontrado</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                const isLowStock = product.stockPhysical <= 3;

                return (
                  <div key={product.id} className="bg-white border-2 border-gray-200 hover:border-gray-400 transition-all">
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setSelectedSize("");
                        setSelectedColor("");
                        setQuantity(1);
                      }}
                      className={`w-full p-4 text-left transition-all ${
                        isSelected ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-16 h-20 object-cover object-top shrink-0 border border-gray-100"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 text-sm mb-1 line-clamp-2">{product.name}</p>
                          <p className="text-gray-400 text-xs mb-2">{product.sku}</p>
                          <p className="text-gray-900 mb-2">
                            R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className={`flex items-center gap-1 ${isLowStock ? "text-red-600" : "text-gray-600"}`}>
                              <Store className="w-3.5 h-3.5" /> {product.stockPhysical}
                              {isLowStock && <AlertTriangle className="w-3 h-3 ml-0.5" />}
                            </span>
                            <span className="flex items-center gap-1 text-gray-400">
                              <Globe className="w-3.5 h-3.5" /> {product.stockEcommerce}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Variation selector - shown when product is selected */}
                    {isSelected && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Selecionar Variação</p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1.5">Tamanho *</label>
                            <select
                              value={selectedSize}
                              onChange={(e) => setSelectedSize(e.target.value)}
                              className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
                            >
                              <option value="">Escolher</option>
                              {product.sizes.map((size) => (
                                <option key={size} value={size}>
                                  {size}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1.5">Cor *</label>
                            <select
                              value={selectedColor}
                              onChange={(e) => setSelectedColor(e.target.value)}
                              className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
                            >
                              <option value="">Escolher</option>
                              {product.colors && product.colors.length > 0 ? (
                                product.colors.map((color) => (
                                  <option key={color} value={color}>
                                    {color}
                                  </option>
                                ))
                              ) : (
                                <option value="Padrão">Padrão</option>
                              )}
                            </select>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs text-gray-600 mb-1.5">Quantidade</label>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="w-full border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:border-[#1a1a1a]"
                          />
                        </div>

                        {selectedVariation && (
                          <div className="mb-3 p-2 bg-white border border-gray-200 text-xs">
                            <p className="text-gray-500 mb-1">Estoque desta variação:</p>
                            <div className="flex gap-3">
                              <span className={`${selectedVariation.stockPhysical <= 2 ? "text-red-600" : "text-gray-700"}`}>
                                <Store className="w-3 h-3 inline mr-1" />
                                Loja: {selectedVariation.stockPhysical}
                              </span>
                              <span className="text-gray-500">
                                <Globe className="w-3 h-3 inline mr-1" />
                                Online: {selectedVariation.stockOnline}
                              </span>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleAddToSale}
                          disabled={!selectedSize || !selectedColor}
                          className="w-full bg-[#1a1a1a] text-white py-2.5 hover:bg-[#333333] transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" /> Adicionar à Venda
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CENTER COLUMN: Current sale items */}
        <div className="hidden lg:flex w-2/5 border-r border-gray-200 flex-col bg-white overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Venda Atual ({currentSale.length} {currentSale.length === 1 ? "item" : "itens"})
              </h2>
              {currentSale.length > 0 && (
                <button onClick={handleClearSale} className="text-xs text-red-500 hover:text-red-700 transition-colors">
                  Cancelar venda
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {currentSale.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Nenhum item adicionado</p>
                <p className="text-xs mt-1">Selecione produtos à esquerda</p>
              </div>
            ) : (
              currentSale.map((item, idx) => (
                <div key={idx} className="border border-gray-200 bg-white">
                  <div className="p-3">
                    <div className="flex items-start gap-3 mb-2">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-16 object-cover object-top shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 text-sm mb-0.5 line-clamp-1">{item.product.name}</p>
                        <p className="text-gray-400 text-xs mb-1">{item.product.sku}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span>Tam. {item.size}</span>
                          <span>•</span>
                          <span>{item.color}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(idx, item.quantity - 1)}
                          className="w-7 h-7 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm text-gray-900 w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(idx, item.quantity + 1)}
                          className="w-7 h-7 border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          R$ {item.unitPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} × {item.quantity}
                        </p>
                        <p className="text-gray-900">
                          R$ {(item.unitPrice * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sale summary */}
          {currentSale.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
              <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({currentSale.reduce((s, i) => s + i.quantity, 0)} itens)</span>
                  <span>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-gray-900 pt-2 border-t border-gray-200">
                  <span className="text-base">Total</span>
                  <span className="text-2xl">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Checkout panel */}
        <div className="w-full lg:w-1/5 flex flex-col bg-white overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-[#1a1a1a] shrink-0">
            <h2 className="text-white text-sm uppercase tracking-widest">Finalizar Venda</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Seller code */}
            <div>
              <label className="block text-xs text-gray-600 mb-1.5 uppercase tracking-widest">
                Código do Vendedor *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={sellerCode}
                  onChange={(e) => setSellerCode(e.target.value)}
                  placeholder="ID ou usuário"
                  className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>
              {sellerCode.trim() && (
                <div className={`mt-1.5 text-xs flex items-center gap-1.5 ${validatedSeller ? "text-green-600" : "text-red-600"}`}>
                  {validatedSeller ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Vendedor: {validatedSeller.name}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      Código inválido
                    </>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Ex: u-003 ou ana.vendas</p>
            </div>

            {/* Customer data */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Cliente (Opcional)</p>
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Telefone"
                    className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="E-mail"
                    className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Forma de Pagamento *</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-col items-center gap-2 p-3 border-2 transition-all ${
                    paymentMethod === "card"
                      ? "border-[#1a1a1a] bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Cartão</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("pix")}
                  className={`flex flex-col items-center gap-2 p-3 border-2 transition-all ${
                    paymentMethod === "pix"
                      ? "border-[#1a1a1a] bg-gray-50"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span className="text-xs">PIX</span>
                </button>
              </div>
            </div>
          </div>

          {/* Finalize button - sticky at bottom */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 mt-auto">
            <div className="mb-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Total a Pagar</p>
              <p className="text-2xl text-gray-900">
                R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <button
              onClick={handleFinalizeSale}
              disabled={currentSale.length === 0 || !validatedSeller}
              className="w-full bg-[#1a1a1a] text-white py-3 hover:bg-[#333333] transition-colors text-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>

      {/* Custom Product Modal */}
      {showCustomProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-gray-900 text-lg">Adicionar Produto Avulso</h3>
              <button
                onClick={() => {
                  setShowCustomProductModal(false);
                  setCustomProduct({ name: "", price: "", quantity: 1, obs: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Nome do Vestido *</label>
                <input
                  type="text"
                  value={customProduct.name}
                  onChange={(e) => setCustomProduct({ ...customProduct, name: e.target.value })}
                  placeholder="Ex: Vestido Rosa Longo"
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Valor *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={customProduct.price}
                    onChange={(e) => setCustomProduct({ ...customProduct, price: e.target.value })}
                    placeholder="0,00"
                    className="w-full border border-gray-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={customProduct.quantity}
                  onChange={(e) => setCustomProduct({ ...customProduct, quantity: Number(e.target.value) })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">Observação (opcional)</label>
                <textarea
                  value={customProduct.obs}
                  onChange={(e) => setCustomProduct({ ...customProduct, obs: e.target.value })}
                  placeholder="Ex: Produto da loja física, sem cadastro"
                  rows={2}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Este produto não está cadastrado no sistema e será registrado apenas nesta venda.
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowCustomProductModal(false);
                  setCustomProduct({ name: "", price: "", quantity: 1, obs: "" });
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCustomProduct}
                className="flex-1 bg-[#1a1a1a] text-white py-2.5 hover:bg-[#333333] transition-colors text-sm"
              >
                Adicionar à Venda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-gray-900 text-xl mb-2">Venda Finalizada!</h3>
              <p className="text-gray-600 text-sm mb-4">A venda foi registrada com sucesso</p>

              <div className="bg-gray-50 border border-gray-200 p-4 text-left space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">ID da Venda:</span>
                  <span className="text-gray-900 font-mono text-xs">{completedSaleId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vendedor:</span>
                  <span className="text-gray-900">{validatedSeller?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total:</span>
                  <span className="text-gray-900 text-base">
                    R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pagamento:</span>
                  <span className="text-gray-900">{paymentMethod === "pix" ? "PIX" : "Cartão"}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-6">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Estoque atualizado automaticamente
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleStartNewSale}
                  className="bg-[#1a1a1a] text-white py-2.5 hover:bg-[#333333] transition-colors text-sm"
                >
                  Nova Venda
                </button>
                <button
                  onClick={() => navigate("/gerente")}
                  className="border border-gray-200 text-gray-700 py-2.5 hover:bg-gray-50 transition-colors text-sm"
                >
                  Ver no Painel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
