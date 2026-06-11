"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import type { ProductFilters as ProductFiltersType } from "@/models";

const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "debutante", label: "Debutante" },
  { value: "formatura", label: "Formatura" },
  { value: "casamento", label: "Casamento" },
  { value: "festa", label: "Festa" },
];

const TIPOS = [
  { value: "all", label: "Todos" },
  { value: "midi", label: "Midi" },
  { value: "longo", label: "Longo" },
  { value: "longuete", label: "Longuete" },
];

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco", label: "Menor Preço" },
  { value: "maior-preco", label: "Maior Preço" },
  { value: "novidade", label: "Novidade" },
];

const ALL_SIZES = ["38", "40", "42", "44", "46", "48", "50", "52", "54", "56", "58"];

const ALL_COLORS = [
  "Rosa", "Branco", "Azul Safira", "Vermelho", "Dourado", "Lilás",
  "Verde Esmeralda", "Preto", "Champagne", "Nude", "Bordô", "Lavanda",
];

function ProdutosContent() {
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Local state for UI
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedTipo, setSelectedTipo] = useState("all");
  const [sort, setSort] = useState("relevancia");

  const category = searchParams.get("categoria") || "all";
  const search = searchParams.get("busca") || "";

  // Hook state
  const [apiFilters, setApiFilters] = useState<ProductFiltersType>({
    categoria: category !== "all" ? category : undefined,
    busca: search || undefined,
    page: 1,
    limit: 20,
  });

  const { products, isLoading, meta } = useProducts(apiFilters);

  useEffect(() => {
    setApiFilters(prev => ({
      ...prev,
      categoria: category !== "all" ? category : undefined,
      busca: search || undefined,
      page: 1,
    }));
  }, [category, search]);

  const toggleSize = (size: string) =>
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );

  const toggleColor = (color: string) =>
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );

  const clearFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedTipo("all");
    setSort("relevancia");
  };

  const hasActiveFilters =
    category !== "all" ||
    selectedTipo !== "all" ||
    search !== "" ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 5000;

  const pageTitle = search
    ? `Busca: "${search}"`
    : category !== "all"
    ? CATEGORIES.find((c) => c.value === category)?.label || "Vestidos"
    : "Todos os Vestidos";

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Page header */}
      <div className="bg-[#1a1a1a] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white mb-1 font-serif text-3xl">{pageTitle}</h1>
          <p className="text-gray-400 text-sm font-sans">
            {meta ? meta.total : products.length} vestido{products.length !== 1 ? "s" : ""} encontrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
        {/* Category tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={cat.value === "all" ? "/produtos" : `/produtos?categoria=${cat.value}`}
              className={`px-4 py-2 text-sm transition-colors border ${
                category === cat.value
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className={`${filtersOpen ? "block" : "hidden"} lg:block w-full lg:w-60 shrink-0`}>
            <div className="bg-white p-5 border border-gray-100 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-gray-900 font-medium">Filtros</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>

              {/* Tipo (comprimento) */}
              <div className="mb-6">
                <h4 className="text-gray-700 mb-3 text-sm">Comprimento</h4>
                <div className="space-y-2">
                  {TIPOS.map((t) => (
                    <label key={t.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo"
                        checked={selectedTipo === t.value}
                        onChange={() => setSelectedTipo(t.value)}
                        className="accent-[#1a1a1a]"
                      />
                      <span className="text-sm text-gray-600">{t.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="mb-6">
                <h4 className="text-gray-700 mb-3 text-sm">Preço</h4>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={5000}
                    step={50}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full accent-[#1a1a1a]"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>R$ {priceRange[0].toLocaleString("pt-BR")}</span>
                    <span>R$ {priceRange[1].toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              </div>

              {/* Sizes */}
              <div className="mb-6">
                <h4 className="text-gray-700 mb-3 text-sm">Tamanho</h4>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`w-10 h-9 border text-xs transition-colors ${
                        selectedSizes.includes(size)
                          ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                          : "border-gray-200 text-gray-600 hover:border-gray-500"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div>
                <h4 className="text-gray-700 mb-3 text-sm">Cor</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {ALL_COLORS.map((color) => (
                    <label key={color} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(color)}
                        onChange={() => toggleColor(color)}
                        className="accent-[#1a1a1a]"
                      />
                      <span className="text-sm text-gray-600">{color}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Products grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5 gap-4">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="lg:hidden flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-4 py-2 hover:border-gray-400 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros{" "}
                {hasActiveFilters && (
                  <span className="bg-[#1a1a1a] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500 hidden sm:block">Ordenar:</span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 px-4 py-2 pr-8 text-sm text-gray-600 focus:outline-none focus:border-[#1a1a1a] cursor-pointer"
                  >
                    {SORT_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                 {[1, 2, 3, 4, 5, 6].map(i => (
                   <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse border border-gray-200"></div>
                 ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100">
                <div className="w-16 h-16 bg-gray-50 flex items-center justify-center mx-auto mb-4 rounded-full">
                  <SlidersHorizontal className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-gray-900 mb-2 font-medium">Nenhum vestido encontrado</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Tente ajustar os filtros ou buscar por outros termos.
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-[#1a1a1a] text-white px-6 py-2 hover:bg-[#333333] transition-colors text-sm"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product) => {
                  const firstVariant = product.variants?.[0];
                  return (
                    <ProductCard
                      key={product.id_produto}
                      id={product.id_produto}
                      titulo={product.titulo}
                      preco={firstVariant?.preco_variante ?? product.preco_base}
                      imagem={firstVariant?.images?.[0]?.image?.url || "/hero-dress.png"}
                      categoria={product.categories?.[0]?.nome}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProdutosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
        </div>
      }
    >
      <ProdutosContent />
    </Suspense>
  );
}
