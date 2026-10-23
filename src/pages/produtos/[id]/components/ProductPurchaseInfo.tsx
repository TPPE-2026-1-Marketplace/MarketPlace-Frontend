import React from "react";
import { ShoppingCart, Check, Star, Minus, Plus, Truck, RefreshCw, Shield, AlertCircle } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ColorSelector from "@/components/ui/ColorSelector";
import SizeSelector from "@/components/ui/SizeSelector";
import ShippingCalculator from "@/components/ui/ShippingCalculator";
import { cn } from "@/lib/utils";

interface ProductPurchaseInfoProps {
  title: string;
  categoryName: string;
  sku: string;
  price: number;
  originalPrice: number | null;
  discount: number | null;
  colors: string[];
  selectedColor: string;
  onSelectColor: (color: string) => void;
  sizes: string[];
  selectedSize: string;
  onSelectSize: (size: string) => void;
  onOpenSizeGuide: () => void;
  sizeError?: string | null;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  stockEcommerce: number;
  added: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  className?: string;
}

export function ProductPurchaseInfo({
  title,
  categoryName,
  sku,
  price,
  originalPrice,
  discount,
  colors,
  selectedColor,
  onSelectColor,
  sizes,
  selectedSize,
  onSelectSize,
  onOpenSizeGuide,
  sizeError,
  quantity,
  onQuantityChange,
  stockEcommerce,
  added,
  onAddToCart,
  onBuyNow,
  className,
}: ProductPurchaseInfoProps) {
  const isOutOfStock = stockEcommerce <= 0;

  return (
    <div className={cn("flex flex-col lg:pt-2", className)}>
      {/* Categoria e SKU */}
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="brand" className="uppercase tracking-widest text-[11px] font-semibold">
          {categoryName}
        </Badge>
        <span className="text-[var(--foreground-muted)] text-xs font-mono">{sku}</span>
      </div>

      {/* Título do Produto */}
      <h1
        className="text-[var(--foreground)] mb-3 font-serif font-normal"
        style={{ fontSize: "1.75rem", letterSpacing: "-0.02em", lineHeight: 1.2 }}
      >
        {title}
      </h1>

      {/* Avaliação em estrelas */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-0.5 text-[var(--action-primary)]">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="size-3.5 fill-[var(--action-primary)] text-[var(--action-primary)]" />
          ))}
        </div>
        <span className="text-xs text-[var(--foreground-muted)]">4.9 (24 avaliações)</span>
      </div>

      {/* Preço e Parcelamento */}
      <div className="mb-6 pb-6 border-b border-[var(--border)]">
        <div className="flex items-baseline gap-3">
          <span
            className="text-[var(--foreground)] font-serif font-medium"
            style={{ fontSize: "1.85rem", letterSpacing: "-0.02em" }}
          >
            R${" "}
            {price.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </span>
          {originalPrice && (
            <span className="text-[var(--foreground-muted)] line-through text-base">
              R${" "}
              {originalPrice.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
          )}
          {discount && (
            <Badge variant="default" className="text-xs font-semibold px-2 py-0.5 rounded-[var(--radius-sm)]">
              -{discount}%
            </Badge>
          )}
        </div>
        <p className="text-[var(--foreground-muted)] text-xs mt-1.5">
          ou 12x de R${" "}
          {(price / 12).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}{" "}
          sem juros
        </p>
      </div>

      {/* Seletor de Cores */}
      <ColorSelector
        colors={colors}
        selectedColor={selectedColor}
        onSelectColor={onSelectColor}
      />

      {/* Seletor de Tamanhos */}
      <SizeSelector
        sizes={sizes}
        selectedSize={selectedSize}
        onSelectSize={onSelectSize}
        onOpenSizeGuide={onOpenSizeGuide}
        error={sizeError}
      />

      {/* Quantidade e Estoque */}
      <div className="mb-6">
        <label className="text-[var(--foreground-secondary)] text-sm mb-2.5 block font-medium">Quantidade:</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="size-9 border border-[var(--border)] rounded-[var(--radius-sm)] flex items-center justify-center hover:border-[var(--border-control)] transition-colors text-[var(--foreground)] bg-[var(--background-card)] cursor-pointer"
            aria-label="Diminuir quantidade"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="text-[var(--foreground)] w-6 text-center text-sm font-semibold">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(stockEcommerce, quantity + 1))}
            className="size-9 border border-[var(--border)] rounded-[var(--radius-sm)] flex items-center justify-center hover:border-[var(--border-control)] transition-colors text-[var(--foreground)] bg-[var(--background-card)] cursor-pointer"
            aria-label="Aumentar quantidade"
          >
            <Plus className="size-3.5" />
          </button>
          <span className="text-[var(--foreground-muted)] text-xs">
            {stockEcommerce} disponível online
          </span>
        </div>
      </div>

      {/* Botões de Ação de Compra */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button
          type="button"
          onClick={onBuyNow}
          variant="action"
          size="touch"
          className="flex-1 font-medium tracking-wide text-sm"
        >
          Comprar Agora
        </Button>

        <Button
          type="button"
          onClick={onAddToCart}
          data-testid="add-to-cart"
          variant={added ? "primary" : "outline-neutral"}
          size="touch"
          className={cn(
            "flex-1 font-medium tracking-wide text-sm flex items-center justify-center gap-2",
            added && "bg-[var(--color-success)] text-white hover:bg-[var(--color-success)] border-[var(--color-success)]",
          )}
        >
          {added ? (
            <>
              <Check className="size-4" />
              Adicionado!
            </>
          ) : (
            <>
              <ShoppingCart className="size-4" />
              Adicionar ao Carrinho
            </>
          )}
        </Button>
      </div>

      {isOutOfStock && stockEcommerce === 0 && (
        <div className="mb-6 p-3 rounded-[var(--radius-md)] bg-[var(--background-secondary)] border border-[var(--border)] flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
          <AlertCircle className="size-4 text-[var(--color-warning)] shrink-0" />
          <span>Este produto está temporariamente sem estoque online para a combinação selecionada.</span>
        </div>
      )}

      {/* Calculadora de Frete */}
      <ShippingCalculator />

      {/* Benefícios / Confiança */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)]">
        {[
          { icon: <Truck className="size-4" />, label: "Entrega no DF" },
          { icon: <RefreshCw className="size-4" />, label: "Troca em 7 dias" },
          { icon: <Shield className="size-4" />, label: "Compra segura" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center gap-1.5 p-3 bg-[var(--background-secondary)] rounded-[var(--radius-sm)] text-center border border-[var(--border)]/50"
          >
            <span className="text-[var(--foreground-secondary)]">{item.icon}</span>
            <span className="text-xs font-medium text-[var(--foreground-secondary)]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
