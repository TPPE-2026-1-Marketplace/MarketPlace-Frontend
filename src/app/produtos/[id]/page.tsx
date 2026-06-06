"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ShoppingBag,
  Star,
  ChevronRight,
  Ruler,
  Package,
  CheckCircle2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { ProductService } from "@/services";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";
import type { Product, ProductVariant, CatalogImage } from "@/models";

interface PageParams {
  id: string;
}

function getFirstImageUrl(variant: ProductVariant | null | undefined): string {
  return variant?.images?.[0]?.image?.url ?? "/hero-dress.png";
}

function getAllImages(variant: ProductVariant | null | undefined): CatalogImage[] {
  return variant?.images ?? [];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { id } = use(params);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem } = useCart();

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await ProductService.getProductById(Number(id));
        setProduct(data);
        if (data.variants?.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      } catch {
        setError("Produto não encontrado.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem({
      product: {
        id_produto: product.id_produto,
        titulo: product.titulo,
        preco_base: product.preco_base,
      },
      variant: {
        codigo_sku: selectedVariant.codigo_sku,
        preco_variante: selectedVariant.preco_variante,
        cor: selectedVariant.cor,
        tamanho: selectedVariant.tamanho,
      },
      imageUrl: getFirstImageUrl(selectedVariant),
      quantity,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-12">
            <div className="w-full lg:w-1/2 aspect-[3/4] skeleton rounded-[var(--radius-xl)]" />
            <div className="flex-1 space-y-4 pt-4">
              <div className="h-4 skeleton w-24" />
              <div className="h-10 skeleton w-3/4" />
              <div className="h-8 skeleton w-32 mt-4" />
              <div className="h-24 skeleton w-full mt-6" />
              <div className="h-12 skeleton w-full mt-8" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white mb-3">
            {error ?? "Produto não encontrado"}
          </h1>
          <Link href="/produtos">
            <Button variant="outline">← Voltar à coleção</Button>
          </Link>
        </div>
      </div>
    );
  }

  const images = getAllImages(selectedVariant);
  const currentImageUrl =
    images[selectedImageIndex]?.image?.url ?? "/hero-dress.png";
  const preco = selectedVariant?.preco_variante ?? product.preco_base;
  const stock = selectedVariant?.stock;
  const inStock = stock ? stock.qtd_online > 0 : true;

  // Group variants by color
  const colors = Array.from(
    new Map(
      (product.variants ?? [])
        .filter((v) => v.cor)
        .map((v) => [v.cor, v])
    ).values()
  );

  // Get sizes for selected color
  const sizesForColor = (product.variants ?? []).filter(
    (v) => v.cor === selectedVariant?.cor && v.tamanho
  );

  return (
    <div className="min-h-screen py-12 animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--foreground-muted)] mb-8">
          <Link href="/" className="hover:text-white transition-colors">
            Início
          </Link>
          <ChevronRight size={14} />
          <Link href="/produtos" className="hover:text-white transition-colors">
            Coleção
          </Link>
          <ChevronRight size={14} />
          <span className="text-[var(--foreground-secondary)] line-clamp-1">
            {product.titulo}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Image Gallery */}
          <div className="w-full lg:w-1/2 flex flex-col sm:flex-row gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2 order-2 sm:order-1">
                {images.map((img, i) => (
                  <button
                    key={img.id_imagem}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded-[var(--radius-md)] overflow-hidden border-2 transition-all duration-[var(--transition-fast)] shrink-0 ${
                      i === selectedImageIndex
                        ? "border-[var(--color-brand)]"
                        : "border-[var(--border)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <Image
                      src={img.image.url}
                      alt={`Imagem ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="relative flex-1 aspect-[3/4] rounded-[var(--radius-xl)] overflow-hidden bg-[var(--background-card)] border border-[var(--border)] order-1 sm:order-2">
              <Image
                src={currentImageUrl}
                alt={product.titulo}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Navigation arrows for multiple images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((i) =>
                        i === 0 ? images.length - 1 : i - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all"
                    aria-label="Imagem anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImageIndex((i) =>
                        i === images.length - 1 ? 0 : i + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-all"
                    aria-label="Próxima imagem"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1">
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.categories?.map((cat) => (
                <Badge key={cat.id_categoria} variant="brand">
                  {cat.nome}
                </Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-light text-white leading-tight">
              {product.titulo}
            </h1>

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-semibold text-white">
                {formatCurrency(preco)}
              </span>
              <span className="text-sm text-[var(--foreground-muted)]">
                ou 12x de {formatCurrency(preco / 12)} sem juros
              </span>
            </div>

            {/* Stock status */}
            <div className="mt-3 flex items-center gap-2">
              {inStock ? (
                <>
                  <CheckCircle2 size={14} className="text-[var(--color-success)]" />
                  <span className="text-sm text-[var(--color-success)]">
                    Em estoque
                    {stock ? ` (${stock.qtd_online} disponíveis)` : ""}
                  </span>
                </>
              ) : (
                <>
                  <Package size={14} className="text-[var(--color-warning)]" />
                  <span className="text-sm text-[var(--color-warning)]">
                    Sob encomenda
                  </span>
                </>
              )}
            </div>

            <hr className="border-[var(--border)] my-6" />

            {/* Color selection */}
            {colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[var(--foreground-secondary)] mb-3">
                  Cor:{" "}
                  <span className="text-white font-semibold">
                    {selectedVariant?.cor}
                  </span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map((variant) => (
                    <button
                      key={variant.cor}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setSelectedImageIndex(0);
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-[var(--radius-full)] border transition-all duration-[var(--transition-fast)] ${
                        selectedVariant?.cor === variant.cor
                          ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                          : "bg-transparent border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)] hover:text-white"
                      }`}
                    >
                      {variant.cor}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selection */}
            {sizesForColor.length > 1 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[var(--foreground-secondary)]">
                    Tamanho:{" "}
                    <span className="text-white font-semibold">
                      {selectedVariant?.tamanho}
                    </span>
                  </h3>
                  <button className="flex items-center gap-1 text-xs text-[var(--color-brand-light)] hover:text-[var(--color-brand)] transition-colors">
                    <Ruler size={12} />
                    Guia de tamanhos
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map((variant) => (
                    <button
                      key={variant.codigo_sku}
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-12 h-12 text-sm font-medium rounded-[var(--radius-md)] border transition-all duration-[var(--transition-fast)] ${
                        selectedVariant?.codigo_sku === variant.codigo_sku
                          ? "bg-[var(--color-brand)] border-[var(--color-brand)] text-white"
                          : "bg-transparent border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-hover)] hover:text-white"
                      }`}
                    >
                      {variant.tamanho}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[var(--foreground-secondary)] mb-3">
                Quantidade
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border)] text-white hover:border-[var(--border-hover)] flex items-center justify-center transition-all"
                  aria-label="Diminuir quantidade"
                >
                  −
                </button>
                <span className="w-8 text-center text-white font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--border)] text-white hover:border-[var(--border-hover)] flex items-center justify-center transition-all"
                  aria-label="Aumentar quantidade"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <Button
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              disabled={!inStock}
            >
              {addedToCart ? (
                <>
                  <CheckCircle2 size={18} />
                  Adicionado ao carrinho!
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  Adicionar ao carrinho
                </>
              )}
            </Button>

            <Link href="/carrinho">
              <Button variant="outline" size="lg" fullWidth className="mt-3">
                Ver carrinho
              </Button>
            </Link>

            {/* Description */}
            {product.descricao && (
              <>
                <hr className="border-[var(--border)] my-6" />
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-[0.1em] mb-3">
                    Descrição
                  </h3>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                    {product.descricao}
                  </p>
                </div>
              </>
            )}

            {/* Product details */}
            {(product.material || product.composicao || product.silhueta) && (
              <>
                <hr className="border-[var(--border)] my-6" />
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-[0.1em] mb-4">
                    Detalhes do produto
                  </h3>
                  <dl className="space-y-3">
                    {product.material && (
                      <div className="flex justify-between text-sm">
                        <dt className="text-[var(--foreground-muted)]">Material</dt>
                        <dd className="text-[var(--foreground-secondary)]">
                          {product.material}
                        </dd>
                      </div>
                    )}
                    {product.composicao && (
                      <div className="flex justify-between text-sm">
                        <dt className="text-[var(--foreground-muted)]">Composição</dt>
                        <dd className="text-[var(--foreground-secondary)]">
                          {product.composicao}
                        </dd>
                      </div>
                    )}
                    {product.silhueta && (
                      <div className="flex justify-between text-sm">
                        <dt className="text-[var(--foreground-muted)]">Silhueta</dt>
                        <dd className="text-[var(--foreground-secondary)]">
                          {product.silhueta}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <dt className="text-[var(--foreground-muted)]">SKU</dt>
                      <dd className="text-[var(--foreground-subtle)] font-mono text-xs">
                        {selectedVariant?.codigo_sku ?? product.sku}
                      </dd>
                    </div>
                  </dl>
                </div>
              </>
            )}

            {/* Measurements */}
            {selectedVariant?.medidas &&
              Object.keys(selectedVariant.medidas).length > 0 && (
                <>
                  <hr className="border-[var(--border)] my-6" />
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-[0.1em] mb-4 flex items-center gap-2">
                      <Ruler size={14} />
                      Medidas (cm)
                    </h3>
                    <dl className="grid grid-cols-2 gap-3">
                      {Object.entries(selectedVariant.medidas)
                        .filter(([, v]) => v !== undefined)
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="p-3 rounded-[var(--radius-md)] bg-[var(--background-card)] border border-[var(--border)]"
                          >
                            <dt className="text-xs text-[var(--foreground-muted)] capitalize">
                              {key}
                            </dt>
                            <dd className="text-sm font-medium text-white mt-0.5">
                              {value} cm
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </div>
                </>
              )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <>
                <hr className="border-[var(--border)] my-6" />
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="default">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
