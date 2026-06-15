/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyModel = any;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight,
  Truck,
  RefreshCw,
  Shield,
  Minus,
  Plus,
  Check,
  Star,
  MapPin,
  Ruler,
  X,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { api } from "@/lib/api";
import ProductCard from "@/components/ui/ProductCard";

const SIZE_TABLE: [string, string, string, string, string][] = [
  ["38", "86", "68", "94", "148"],
  ["40", "90", "72", "98", "150"],
  ["42", "94", "76", "102", "152"],
  ["44", "98", "80", "106", "154"],
  ["46", "102", "84", "110", "156"],
  ["48", "106", "88", "114", "158"],
  ["50", "110", "92", "118", "160"],
  ["52", "114", "96", "122", "162"],
  ["54", "118", "100", "126", "164"],
  ["56", "122", "104", "130", "165"],
  ["58", "126", "108", "134", "166"],
];

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<AnyModel | null>(null);
  const [related, setRelated] = useState<AnyModel[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [tab, setTab] = useState<"descricao" | "tamanhos" | "info">("descricao");
  const [cep, setCep] = useState("");
  const [cepResult, setCepResult] = useState<null | "ok" | "erro">(null);
  const [showSizeModal, setShowSizeModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.get<AnyModel>(`/products/${Number(id)}`);
        setProduct(data);
        
        // Load related products
        if (data.categories && data.categories.length > 0) {
          const res = await api.get<AnyModel>("/products", { categoria: data.categories[0].nome, limit: 4 });
          setRelated(res.data.filter((p: any) => p.id_produto !== data.id_produto));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sans">
        <div className="text-center">
          <h2 className="text-gray-700 mb-4 font-serif text-2xl">AnyModel não encontrado</h2>
          <Link to="/produtos" className="text-[#1a1a1a] hover:underline text-sm">
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  // Extract unique colors and sizes from variants
  const colors = Array.from(new Set(product.variants?.map((v: any) => v.cor).filter(Boolean))) as string[];
  const sizes = Array.from(new Set(product.variants?.map((v: any) => v.tamanho).filter(Boolean))) as string[];
  
  const allImages = product.variants?.flatMap((v: any) => v.images?.map((img: any) => img.image.url) || []) || [];
  const gallery = allImages.length > 0 ? Array.from(new Set(allImages)) : ["/hero-dress.png"];

  // Default to first variant's price or base price
  const baseVariant = product.variants?.[0];
  const price = baseVariant?.preco_variante ?? product.preco_base;
  const originalPrice = product.preco_base > price ? product.preco_base : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : null;
  const stockEcommerce = baseVariant?.estoque_ecommerce ?? 0;
  const totalStock = (baseVariant?.estoque_ecommerce ?? 0) + (baseVariant?.estoque_fisico ?? 0);
  const isLowStock = totalStock > 0 && totalStock <= 3;
  
  const categoryName = product.categories?.[0]?.nome || "Vestido";
  const firstVariantSku = baseVariant?.id || `SKU-${product.id_produto}`;

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      alert("Por favor, selecione o tamanho e a cor antes de adicionar ao carrinho.");
      return;
    }
    
    // Find the variant
    const variant = product.variants?.find((v: any) => v.cor === selectedColor && v.tamanho === selectedSize);
    if (!variant) {
      alert("Variante não encontrada.");
      return;
    }

    addItem(variant?.id as any, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!selectedSize || !selectedColor) {
      alert("Por favor, selecione o tamanho e a cor antes de continuar.");
      return;
    }
    const variant = product.variants?.find((v: any) => v.cor === selectedColor && v.tamanho === selectedSize);
    if (!variant) return;

    addItem(variant?.id as any, quantity);
    navigate("/carrinho");
  };

  const handleShippingCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (cep.replace(/\D/g, "").length === 8) {
      const num = parseInt(cep.replace(/\D/g, "").slice(0, 2));
      setCepResult(num >= 70 && num <= 73 ? "ok" : "erro");
    }
  };

  const productSizeTable = SIZE_TABLE.filter(([size]) => sizes.includes(size));

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Link to="/" className="hover:text-gray-700 transition-colors">Início</Link>
            <span>/</span>
            <Link to="/produtos" className="hover:text-gray-700 transition-colors">Vestidos</Link>
            <span>/</span>
            <Link
              to={`/produtos?categoria=${categoryName}`}
              className="hover:text-gray-700 transition-colors capitalize"
            >
              {categoryName}
            </Link>
            <span>/</span>
            <span className="text-gray-600 truncate max-w-xs">{product.titulo}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 mt-4 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
          <div className="flex gap-3">
            <div className="hidden lg:flex flex-col gap-2 w-16 shrink-0">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-16 h-20 overflow-hidden border-2 transition-all shrink-0 ${
                    activeImage === idx
                      ? "border-[#1a1a1a]"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <img
                    src={img as string}
                    alt={`${product.titulo} ${idx + 1}`}
                    className="object-cover object-top"
                  />
                </button>
              ))}
            </div>

            <div className="flex-1 relative">
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                <img
                  src={gallery[activeImage] as string}
                  alt={product.titulo}
                  className="object-cover object-top"
                />
                {discount && (
                  <div className="absolute top-4 left-4 bg-[#1a1a1a] text-white px-3 py-1 text-xs tracking-wide">
                    -{discount}%
                  </div>
                )}
                {isLowStock && (
                  <div className="absolute top-4 right-12 bg-gray-700 text-white px-3 py-1 text-xs">
                    Últimas unidades
                  </div>
                )}
                <button className="absolute top-4 right-4 w-9 h-9 bg-white flex items-center justify-center hover:bg-gray-100 transition-colors border border-gray-100">
                  <Heart className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={() =>
                    setActiveImage((prev) =>
                      prev === 0 ? gallery.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() =>
                    setActiveImage((prev) =>
                      prev === gallery.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              <div className="lg:hidden flex gap-2 mt-3 overflow-x-auto pb-1">
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-14 shrink-0 overflow-hidden border-2 transition-all ${
                      activeImage === idx ? "border-[#1a1a1a]" : "border-gray-200"
                    }`}
                    style={{ height: "4.5rem" }}
                  >
                    <img
                      src={img as string}
                      alt={`${product.titulo} ${idx + 1}`}
                      className="object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:pt-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 uppercase tracking-widest">
                {categoryName}
              </span>
              <span className="text-gray-400 text-xs">{firstVariantSku}</span>
            </div>

            <h1
              className="text-gray-900 mb-3 font-serif"
              style={{ fontSize: "1.6rem", letterSpacing: "-0.02em", lineHeight: 1.2 }}
            >
              {product.titulo}
            </h1>

            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-3.5 h-3.5 -[#1a1a1a] text-[#1a1a1a]"
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">4.9 (24 avaliações)</span>
            </div>

            <div className="mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-baseline gap-3">
                <span
                  className="text-gray-900 font-medium"
                  style={{ fontSize: "1.75rem", letterSpacing: "-0.02em" }}
                >
                  R${" "}
                  {price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                {originalPrice && (
                  <span className="text-gray-400 line-through text-base">
                    R${" "}
                    {originalPrice.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                )}
                {discount && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5">
                    -{discount}%
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-xs mt-1.5">
                ou 12x de R${" "}
                {(price / 12).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}{" "}
                sem juros
              </p>
              <p className="text-green-700 text-xs mt-1">
                5% de desconto no PIX: R${" "}
                {(price * 0.95).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <label className="text-gray-700 text-sm">Cor:</label>
                {selectedColor && (
                  <span className="text-gray-500 text-sm">{selectedColor}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-1.5 border text-sm transition-colors ${
                      selectedColor === color
                        ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-500"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <label className="text-gray-700 text-sm">Tamanho:</label>
                  {selectedSize && (
                    <span className="text-gray-500 text-sm">{selectedSize}</span>
                  )}
                </div>
                <button
                  onClick={() => setShowSizeModal(true)}
                  className="flex items-center gap-1 text-xs text-gray-500 underline hover:text-gray-800 transition-colors"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Ver medidas
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-11 h-11 border text-sm transition-colors ${
                      selectedSize === size
                        ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-500"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-5">
              <label className="text-gray-700 text-sm mb-2.5 block">Quantidade:</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 border border-gray-200 flex items-center justify-center hover:border-gray-500 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-gray-900 w-6 text-center text-sm">
                  {quantity}
    </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(stockEcommerce, quantity + 1))
                  }
                  className="w-9 h-9 border border-gray-200 flex items-center justify-center hover:border-gray-500 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="text-gray-400 text-xs">
                  {stockEcommerce} disponível online
                </span>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-[#1a1a1a] text-white py-3.5 hover:bg-[#333333] transition-colors text-sm tracking-wide"
              >
                Comprar Agora
              </button>
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 border transition-colors text-sm tracking-wide ${
                  added
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-[#1a1a1a] text-[#1a1a1a] hover:bg-gray-50"
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" /> Adicionado!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" /> Adicionar ao Carrinho
                  </>
                )}
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 border border-gray-100">
              <p className="text-sm text-gray-700 mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                Simular Entrega
              </p>
              <form onSubmit={handleShippingCheck} className="flex gap-2">
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => {
                    setCep(e.target.value);
                    setCepResult(null);
                  }}
                  placeholder="Digite seu CEP"
                  maxLength={9}
                  className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] bg-white"
                />
                <button
                  type="submit"
                  className="bg-[#1a1a1a] text-white px-4 py-2 text-sm hover:bg-[#333333] transition-colors"
                >
                  OK
                </button>
              </form>
              {cepResult === "ok" && (
                <p className="text-green-700 text-xs mt-2 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Entregamos no seu endereço! Prazo: 3 a 7 dias úteis.
                </p>
              )}
              {cepResult === "erro" && (
                <p className="text-gray-500 text-xs mt-2">
                  CEP fora da área de entrega. Atendemos apenas o Distrito Federal.
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Truck className="w-4 h-4" />, label: "Entrega no DF" },
                { icon: <RefreshCw className="w-4 h-4" />, label: "Troca em 7 dias" },
                { icon: <Shield className="w-4 h-4" />, label: "Compra segura" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 text-center"
                >
                  <span className="text-gray-500">{item.icon}</span>
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 mb-12">
          <div className="flex gap-8 border-b border-gray-100 mb-6">
            {[
              { key: "descricao", label: "Descrição" },
              { key: "tamanhos", label: "Guia de Medidas" },
              { key: "info", label: "Informações" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as typeof tab)}
                className={`pb-3 text-sm transition-colors border-b-2 -mb-px ${
                  tab === t.key
                    ? "border-[#1a1a1a] text-[#1a1a1a]"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "descricao" && (
            <div>
              <p className="text-gray-600 leading-relaxed text-sm mb-6">
                {product.descricao}
              </p>
              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-gray-700 mb-3 font-serif">Avaliações (1)</h4>
                <div className="bg-gray-50 p-4">
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 -[#1a1a1a] text-[#1a1a1a]" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-2">
                    "Vestido simplesmente incrível! O caimento é perfeito, o tecido é de
                    altíssima qualidade e chegou muito bem embalado. Recebi muitos elogios
                    na festa. Com certeza comprarei novamente!"
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Camila R. — verificado</span>
                    <span className="text-xs text-gray-400">Março 2026</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "tamanhos" && (
            <div>
              <p className="text-gray-500 text-xs mb-4">
                Todas as medidas em centímetros (cm). Recomendamos medir o corpo e comparar
                com a tabela abaixo antes de realizar o pedido.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-600">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left py-2.5 px-3 text-gray-700">Tam.</th>
                      <th className="text-left py-2.5 px-3 text-gray-700">Busto (cm)</th>
                      <th className="text-left py-2.5 px-3 text-gray-700">Cintura (cm)</th>
                      <th className="text-left py-2.5 px-3 text-gray-700">Quadril (cm)</th>
                      <th className="text-left py-2.5 px-3 text-gray-700">Comprimento (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productSizeTable.map(([size, busto, cintura, quadril, comp]) => (
                      <tr
                        key={size}
                        className={`border-b border-gray-50 hover:bg-gray-50 ${
                          selectedSize === size ? "bg-gray-50 font-medium" : ""
                        }`}
                      >
                        <td className="py-2 px-3">{size}</td>
                        <td className="py-2 px-3">{busto}</td>
                        <td className="py-2 px-3">{cintura}</td>
                        <td className="py-2 px-3">{quadril}</td>
                        <td className="py-2 px-3">{comp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "info" && (
            <div className="space-y-2.5 text-sm text-gray-600">
              {[
                ["SKU", firstVariantSku],
                ["Categoria", categoryName.charAt(0).toUpperCase() + categoryName.slice(1)],
                ["Cores disponíveis", colors.join(", ") || "—"],
                ["Tamanhos disponíveis", sizes.join(", ") || "—"],
                ["Estoque online", `${stockEcommerce} unidades`],
                ["Área de entrega", "Distrito Federal"],
                ["Prazo de entrega", "3 a 7 dias úteis"],
                ["Troca / Devolução", "7 dias corridos (CDC)"],
              ].map(([key, value]) => (
                <div key={key as string} className="flex gap-3 py-1.5 border-b border-gray-50">
                  <span className="text-gray-400 w-44 shrink-0">{key as string}</span>
                  <span className="text-gray-700">{value as string}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="mb-12">
            <h2
              className="text-gray-900 mb-6 font-serif text-2xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Você também pode gostar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p) => {
                const variant = p.variants?.[0];
                return (
                  <ProductCard
                    key={p.id_produto}
                    id={p.id_produto}
                    titulo={p.titulo}
                    preco={variant?.preco_variante ?? p.preco_base}
                    imagem={variant?.images?.[0]?.image?.url || "/hero-dress.png"}
                    categoria={p.categories?.[0]?.nome}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showSizeModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setShowSizeModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between">
                <h3 className="text-gray-900 font-serif text-xl">Guia de Medidas</h3>
                <button
                  onClick={() => setShowSizeModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5">
                <p className="text-gray-500 text-xs mb-4">
                  Todas as medidas em centímetros (cm). Recomendamos medir o corpo e comparar
                  com a tabela abaixo antes de realizar o pedido.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-600">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-left py-2.5 px-3 text-gray-700">Tam.</th>
                        <th className="text-left py-2.5 px-3 text-gray-700">Busto (cm)</th>
                        <th className="text-left py-2.5 px-3 text-gray-700">Cintura (cm)</th>
                        <th className="text-left py-2.5 px-3 text-gray-700">Quadril (cm)</th>
                        <th className="text-left py-2.5 px-3 text-gray-700">Comprimento (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productSizeTable.map(([size, busto, cintura, quadril, comp]) => (
                        <tr
                          key={size}
                          className={`border-b border-gray-50 hover:bg-gray-50 ${
                            selectedSize === size ? "bg-gray-50 font-medium" : ""
                          }`}
                        >
                          <td className="py-2 px-3">{size}</td>
                          <td className="py-2 px-3">{busto}</td>
                          <td className="py-2 px-3">{cintura}</td>
                          <td className="py-2 px-3">{quadril}</td>
                          <td className="py-2 px-3">{comp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
