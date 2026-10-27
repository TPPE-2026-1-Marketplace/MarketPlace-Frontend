import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, X, AlertCircle } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import ProductFilters, { ALL_COLORS } from "@/components/ui/ProductFilters";
import Pagination from "@/components/ui/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts, type ProductFilters as ApiFilters, type Product } from "@/hooks/useProducts";
import { getDisplayVariant } from "@/lib/catalog";
import { CATEGORIAS, TIPOS as TIPOS_CATALOGO } from "@/lib/categories";
import { cn } from "@/lib/utils";

const CATEGORIES = [{ value: "all", label: "Todas" }, ...CATEGORIAS];
const TIPOS = [{ value: "all", label: "Todos" }, ...TIPOS_CATALOGO];

const SORT_OPTIONS = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco", label: "Menor Preço" },
  { value: "maior-preco", label: "Maior Preço" },
  { value: "novidade", label: "Novidade" },
];

const ITEMS_PER_PAGE = 9;

function ProdutosContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filtros locais da interface
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sort, setSort] = useState("relevancia");
  const [currentPage, setCurrentPage] = useState(1);

  const category = searchParams.get("categoria") || "all";
  const search = searchParams.get("busca") || "";
  const selectedTipo = searchParams.get("tipo") || "all";

  // Resetar página quando a busca ou categoria mudar sem efeito em cascata
  const [prevFilterKey, setPrevFilterKey] = useState(`${category}:${search}`);
  const currentFilterKey = `${category}:${search}`;
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey);
    setCurrentPage(1);
  }

  const setSelectedTipo = (tipo: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tipo === "all") next.delete("tipo");
      else next.set("tipo", tipo);
      return next;
    });
  };

  const setCategoryParam = (cat: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (cat === "all") next.delete("categoria");
      else next.set("categoria", cat);
      return next;
    });
  };

  // Filtros enviados para o hook de API (derivados reativamente)
  const apiFilters = useMemo<ApiFilters>(
    () => ({
      busca: search || undefined,
      categoria: category !== "all" ? category : undefined,
      page: 1,
      limit: 50,
    }),
    [search, category],
  );

  const { products, isLoading, error, refetch } = useProducts(apiFilters);

  // Cores dinâmicas extraídas dos produtos cadastrados
  const availableColors = useMemo(() => {
    const colorMap = new Map<string, string>();

    products.forEach((p: Product) => {
      p.variants?.forEach((v) => {
        if (v.cor && v.cor.trim()) {
          const raw = v.cor.trim();
          const key = raw.toLowerCase();
          if (!colorMap.has(key)) {
            const formatted = raw
              .split(/\s+/)
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(" ");
            colorMap.set(key, formatted);
          }
        }
      });
    });

    if (colorMap.size === 0) {
      return ALL_COLORS;
    }

    return Array.from(colorMap.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products]);

  const productPrice = (p: Product) => getDisplayVariant(p)?.precoVariante ?? p.precoBase;

  // Filtragem e ordenação no cliente
  const filteredProducts = useMemo(() => {
    let list = products.filter((p: Product) => {
      const price = productPrice(p);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (
        selectedSizes.length > 0 &&
        !p.variants?.some((v) => v.tamanho && selectedSizes.includes(v.tamanho))
      ) {
        return false;
      }
      if (selectedColors.length > 0) {
        const selectedLowers = selectedColors.map((c) => c.trim().toLowerCase());
        const matchesColor = p.variants?.some(
          (v) => v.cor && selectedLowers.includes(v.cor.trim().toLowerCase()),
        );
        if (!matchesColor) return false;
      }
      if (selectedTipo !== "all") {
        const lowerTipo = selectedTipo.toLowerCase();
        const matchesTipo =
          p.tipo?.toLowerCase() === lowerTipo ||
          p.tags?.some((t) => t.trim().toLowerCase() === lowerTipo) ||
          (lowerTipo === "midi" &&
            (p.qualMedida?.toLowerCase() === "midi" ||
              p.qualMedida?.toLowerCase() === "médio" ||
              p.qualMedida?.toLowerCase() === "medio")) ||
          (lowerTipo === "longo" &&
            (p.qualMedida?.toLowerCase() === "longo" ||
              p.qualMedida?.toLowerCase() === "maxi")) ||
          (lowerTipo === "longuete" && p.qualMedida?.toLowerCase() === "longuete");
        if (!matchesTipo) return false;
      }
      return true;
    });

    if (sort === "menor-preco") {
      list = [...list].sort((a, b) => productPrice(a) - productPrice(b));
    } else if (sort === "maior-preco") {
      list = [...list].sort((a, b) => productPrice(b) - productPrice(a));
    } else if (sort === "novidade") {
      list = [...list].sort((a, b) => b.idProduto - a.idProduto);
    }

    return list;
  }, [products, priceRange, selectedSizes, selectedColors, selectedTipo, sort]);

  // Paginação dos produtos filtrados
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
    setCurrentPage(1);
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) => {
      const lower = color.trim().toLowerCase();
      const exists = prev.some((c) => c.trim().toLowerCase() === lower);
      return exists
        ? prev.filter((c) => c.trim().toLowerCase() !== lower)
        : [...prev, color];
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setPriceRange([0, 5000]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSort("relevancia");
    setCurrentPage(1);
    setFiltersOpen(false);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("tipo");
      next.delete("categoria");
      next.delete("busca");
      return next;
    });
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Page Header (Design System DK Fashion) */}
      <div className="bg-[var(--foreground)] text-[var(--color-white)] py-10 lg:py-12 border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-normal text-[var(--color-white)] tracking-tight mb-2">
            {pageTitle}
          </h1>
          <p className="text-sm font-sans text-neutral-300">
            {filteredProducts.length} vestido{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
        {/* Category Tabs Rápidas */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map((cat) => {
            const nextParams = new URLSearchParams(searchParams);
            if (cat.value === "all") nextParams.delete("categoria");
            else nextParams.set("categoria", cat.value);
            const query = nextParams.toString();
            const targetUrl = query ? `/produtos?${query}` : "/produtos";

            return (
              <Link
                key={cat.value}
                to={targetUrl}
                className={cn(
                  "px-4 py-2 text-sm font-sans font-medium rounded-[var(--radius-full)] border transition-all duration-[var(--transition-fast)] cursor-pointer select-none",
                  category === cat.value
                    ? "bg-[var(--action-primary)] text-[var(--color-white)] border-[var(--action-primary)] shadow-xs"
                    : "bg-[var(--background-card)] text-[var(--foreground-secondary)] border-[var(--border)] hover:border-[var(--border-control)] hover:text-[var(--foreground)]",
                )}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        <div className="flex gap-8">
          {/* Sidebar Desktop com ProductFilters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <ProductFilters
                tipo={selectedTipo}
                onSelectTipo={setSelectedTipo}
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                selectedSizes={selectedSizes}
                onToggleSize={toggleSize}
                selectedColors={selectedColors}
                onToggleColor={toggleColor}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                colors={availableColors}
              />
            </div>
          </aside>

          {/* Drawer / Sheet Mobile de Filtros */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetContent
              side="left"
              className="w-[85vw] max-w-sm p-0 flex flex-col bg-[var(--background-card)] border-r border-[var(--border)]"
            >
              <SheetHeader className="p-4 sm:p-5 border-b border-[var(--border)] flex flex-row items-center justify-between">
                <SheetTitle className="text-base font-semibold font-serif text-[var(--foreground)] flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-[var(--color-brand)]" />
                  Filtros
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                <ProductFilters
                  tipo={selectedTipo}
                  onSelectTipo={setSelectedTipo}
                  priceRange={priceRange}
                  onPriceRangeChange={setPriceRange}
                  selectedSizes={selectedSizes}
                  onToggleSize={toggleSize}
                  selectedColors={selectedColors}
                  onToggleColor={toggleColor}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={clearFilters}
                  colors={availableColors}
                  isMobile
                />
              </div>
              <SheetFooter className="p-4 border-t border-[var(--border)] flex flex-row gap-3 bg-[var(--background-secondary)]/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="flex-1 h-11 border-[var(--border-control)]"
                >
                  Limpar
                </Button>
                <Button
                  type="button"
                  variant="action"
                  onClick={() => setFiltersOpen(false)}
                  className="flex-1 h-11"
                >
                  Aplicar filtros
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Área Principal de Produtos */}
          <div className="flex-1 min-w-0">
            {/* Toolbar Superior */}
            <div className="flex items-center justify-between mb-5 gap-4 bg-[var(--background-card)] p-3 sm:p-4 rounded-[var(--radius-lg)] border border-[var(--border)]">
              {/* Botão Mobile para Abrir Sheet de Filtros */}
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-medium text-[var(--foreground-secondary)] border border-[var(--border)] px-3.5 py-2 rounded-[var(--radius-md)] hover:border-[var(--border-control)] hover:text-[var(--foreground)] transition-colors cursor-pointer bg-[var(--background-card)]"
              >
                <SlidersHorizontal className="size-4" />
                <span>Filtros</span>
                {hasActiveFilters && (
                  <span className="bg-[var(--action-primary)] text-[var(--color-white)] text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    !
                  </span>
                )}
              </button>

              <div className="text-xs sm:text-sm text-[var(--foreground-muted)] hidden sm:block">
                Mostrando {paginatedProducts.length} de {filteredProducts.length} itens
              </div>

              {/* Seletor de Ordenação */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-[var(--foreground-muted)] hidden md:block">
                  Ordenar por:
                </span>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger
                    className="w-[160px] sm:w-[180px] h-9 text-xs sm:text-sm bg-[var(--background-card)] border-[var(--border)] text-[var(--foreground)] focus-visible:ring-1"
                    aria-label="Ordenar produtos"
                  >
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--background-card)] border-[var(--border)]">
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chips de Filtros Ativos */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-[var(--radius-md)] bg-[var(--background-secondary)]/40 border border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mr-1">
                  Ativos:
                </span>

                {search && (
                  <Badge
                    variant="default"
                    className="normal-case tracking-normal gap-1.5 py-1 bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)]"
                  >
                    Busca: "{search}"
                    <button
                      type="button"
                      onClick={() => {
                        setSearchParams((prev) => {
                          const next = new URLSearchParams(prev);
                          next.delete("busca");
                          return next;
                        });
                      }}
                      className="hover:text-[var(--color-error)] cursor-pointer"
                      aria-label="Remover busca"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}

                {category !== "all" && (
                  <Badge
                    variant="default"
                    className="normal-case tracking-normal gap-1.5 py-1 bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)]"
                  >
                    Categoria: {CATEGORIES.find((c) => c.value === category)?.label || category}
                    <button
                      type="button"
                      onClick={() => setCategoryParam("all")}
                      className="hover:text-[var(--color-error)] cursor-pointer"
                      aria-label="Remover filtro de categoria"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}

                {selectedTipo !== "all" && (
                  <Badge
                    variant="default"
                    className="normal-case tracking-normal gap-1.5 py-1 bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)]"
                  >
                    Comprimento: {TIPOS.find((t) => t.value === selectedTipo)?.label || selectedTipo}
                    <button
                      type="button"
                      onClick={() => setSelectedTipo("all")}
                      className="hover:text-[var(--color-error)] cursor-pointer"
                      aria-label="Remover filtro de comprimento"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}

                {(priceRange[0] > 0 || priceRange[1] < 5000) && (
                  <Badge
                    variant="default"
                    className="normal-case tracking-normal gap-1.5 py-1 bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)]"
                  >
                    {priceRange[0] > 0 && priceRange[1] < 5000
                      ? `Preço: R$ ${priceRange[0].toLocaleString("pt-BR")} - R$ ${priceRange[1].toLocaleString("pt-BR")}`
                      : priceRange[0] > 0
                      ? `Preço: A partir de R$ ${priceRange[0].toLocaleString("pt-BR")}`
                      : `Preço: Até R$ ${priceRange[1].toLocaleString("pt-BR")}`}
                    <button
                      type="button"
                      onClick={() => setPriceRange([0, 5000])}
                      className="hover:text-[var(--color-error)] cursor-pointer"
                      aria-label="Remover filtro de preço"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                )}

                {selectedSizes.map((size) => (
                  <Badge
                    key={`chip-size-${size}`}
                    variant="default"
                    className="normal-case tracking-normal gap-1.5 py-1 bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)]"
                  >
                    Tam: {size}
                    <button
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="hover:text-[var(--color-error)] cursor-pointer"
                      aria-label={`Remover tamanho ${size}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}

                {selectedColors.map((color) => (
                  <Badge
                    key={`chip-color-${color}`}
                    variant="default"
                    className="normal-case tracking-normal gap-1.5 py-1 bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)]"
                  >
                    Cor: {color}
                    <button
                      type="button"
                      onClick={() => toggleColor(color)}
                      className="hover:text-[var(--color-error)] cursor-pointer"
                      aria-label={`Remover cor ${color}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-[var(--color-brand)] hover:underline font-medium ml-auto cursor-pointer"
                >
                  Limpar todos
                </button>
              </div>
            )}

            {/* Estado: Carregando (Skeleton da Grade) */}
            {isLoading ? (
              <div
                data-testid="products-skeleton"
                className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton
                    key={i}
                    className="aspect-[3/4] w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-neutral-200"
                  />
                ))}
              </div>
            ) : error ? (
              /* Estado: Erro na API */
              <div className="py-16">
                <EmptyState
                  icon={<AlertCircle className="size-8 text-[var(--color-error)]" />}
                  title="Erro ao carregar vestidos"
                  body={error || "Não foi possível carregar os produtos. Tente novamente."}
                  action={
                    <Button variant="action" size="md" onClick={() => refetch()}>
                      Tentar novamente
                    </Button>
                  }
                />
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Estado: Vazio (Nenhum produto encontrado) */
              <div className="py-16">
                <EmptyState
                  icon={<SlidersHorizontal className="size-8 text-[var(--color-brand)]" />}
                  title="Nenhum vestido encontrado"
                  body="Tente ajustar os filtros ou buscar por outros termos."
                  action={
                    <Button variant="action" size="md" onClick={clearFilters}>
                      Limpar Filtros
                    </Button>
                  }
                />
              </div>
            ) : (
              /* Grade de Produtos */
              <div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {paginatedProducts.map((product: Product) => {
                    const firstVariant = getDisplayVariant(product);
                    return (
                      <ProductCard
                        key={product.idProduto}
                        id={product.idProduto}
                        titulo={product.titulo}
                        preco={firstVariant?.precoVariante ?? product.precoBase}
                        imagem={firstVariant?.images[0]?.url || "/hero-dress.png"}
                        categoria={product.categories?.[0]?.nome}
                        nota={product.mediaAvaliacao}
                        totalAvaliacoes={product.totalAvaliacoes}
                        variant={firstVariant}
                      />
                    );
                  })}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
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
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="size-8 rounded-full border-2 border-[var(--border)] border-t-[var(--action-primary)] animate-spin" />
        </div>
      }
    >
      <ProdutosContent />
    </Suspense>
  );
}
