import React from "react";
import { ShoppingCart, Check, Star, Minus, Plus, Ruler, AlertCircle } from "lucide-react";
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
  averageRating?: number;
  totalReviews?: number;
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
  averageRating = 0,
  totalReviews = 0,
  className,
}: ProductPurchaseInfoProps) {
  const hasVariants = colors.length > 0 || sizes.length > 0;
  const isOutOfStock = hasVariants ? stockEcommerce <= 0 : false;
  const installmentValue = price / 6;

  return (
    <div className={cn("flex flex-col lg:pt-1", className)}>
      {/* Categoria e SKU (Figma: Typography/Label/Uppercase) */}
      <div className="flex items-center gap-2 mb-2">
        <span className="uppercase text-xs font-sans font-medium tracking-[0.1667em] text-[var(--color-brand)]">
          {categoryName || "DK Fashion"}
        </span>
        {sku && <span className="text-[var(--foreground-subtle)] text-xs font-mono">· {sku}</span>}
      </div>

      {/* Título do Produto (Figma: Typography/Heading/H1 32px desktop / 24px mobile) */}
      <h1 className="text-2xl lg:text-[32px] lg:leading-[38px] font-serif font-normal text-[var(--foreground)] mb-2">
        {title}
      </h1>

      {/* Avaliação em estrelas dinâmica */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-0.5 text-[var(--action-primary)]">
          {[1, 2, 3, 4, 5].map((s) => {
            const isFilled = s <= Math.round(averageRating);
            return (
              <Star
                key={s}
                className={cn(
                  "size-3.5",
                  isFilled
                    ? "fill-[var(--action-primary)] text-[var(--action-primary)]"
                    : "text-[var(--border-control)]",
                )}
              />
            );
          })}
        </div>
        <span className="text-xs font-sans text-[var(--foreground-secondary)]">
          {totalReviews > 0 ? (
            <>
              {averageRating.toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{" "}
              · {totalReviews} {totalReviews === 1 ? "avaliação" : "avaliações"}
            </>
          ) : (
            "Sem avaliações ainda"
          )}
        </span>
      </div>

      {/* Preço e Parcelamento (Figma: Typography/Commerce/Price Large — Inter Medium 28px) */}
      <div className="mb-6 pb-6 border-b border-[var(--border)]">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl lg:text-[28px] lg:leading-[34px] font-sans font-medium text-[var(--foreground)]">
            R${" "}
            {price.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}
          </span>
          {originalPrice && (
            <span className="text-[var(--foreground-muted)] line-through text-sm font-sans">
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
        <p className="text-xs font-sans text-[var(--foreground-secondary)] mt-1.5">
          6x de R${" "}
          {installmentValue.toLocaleString("pt-BR", {
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

      {/* Seletor de Tamanhos e Links de Apoio */}
      <div className="mb-6">
        <SizeSelector
          sizes={sizes}
          selectedSize={selectedSize}
          onSelectSize={onSelectSize}
          onOpenSizeGuide={onOpenSizeGuide}
          error={sizeError}
        />

        {/* Links de Apoio ao Tamanho (Figma Node 443:486: Encontre seu tamanho e Tabela de medidas) */}
        <div className="flex items-center gap-4 mt-2.5 text-xs font-sans">
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="text-[var(--color-brand)] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Ruler className="size-3.5" />
            Encontre seu tamanho
          </button>
          <span className="text-[var(--border)]">|</span>
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:underline cursor-pointer"
          >
            Tabela de medidas
          </button>
        </div>
      </div>

      {/* Quantidade e Estoque (Figma: Typography/UI/Title nos botões) */}
      <div className="mb-6">
        <span className="text-[var(--foreground-secondary)] text-sm mb-2.5 block font-medium font-sans">
          Quantidade:
        </span>
        <div className="flex items-center gap-3" role="group" aria-label="Controle de quantidade">
          <div className="flex items-center border border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--background-card)] overflow-hidden">
            <button
              type="button"
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className="size-10 flex items-center justify-center hover:bg-[var(--background-secondary)] text-[var(--foreground)] transition-colors cursor-pointer text-lg font-semibold"
              disabled={quantity <= 1 || isOutOfStock}
              aria-label="Diminuir quantidade"
            >
              −
            </button>
            <span className="w-12 text-center text-sm font-semibold font-sans text-[var(--foreground)]">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(Math.min(stockEcommerce || 99, quantity + 1))}
              className="size-10 flex items-center justify-center hover:bg-[var(--background-secondary)] text-[var(--foreground)] transition-colors cursor-pointer text-lg font-semibold"
              disabled={quantity >= stockEcommerce || isOutOfStock}
              aria-label="Aumentar quantidade"
            >
              +
            </button>
          </div>

          <span className="text-xs font-sans text-[var(--foreground-muted)]">
            {isOutOfStock ? (
              <span className="text-[var(--color-error)] font-medium inline-flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                {stockEcommerce} disponível online
              </span>
            ) : (
              `${stockEcommerce} disponível online`
            )}
          </span>
        </div>
      </div>

      {/* Botões de Ação de Compra */}
      <div className="flex flex-col gap-3 mb-6">
        <Button
          type="button"
          onClick={onBuyNow}
          disabled={isOutOfStock}
          variant="action"
          size="lg"
          fullWidth
          className="h-12 text-base font-medium rounded-[var(--radius-md)] tracking-wide shadow-sm"
        >
          Comprar Agora
        </Button>

        <Button
          type="button"
          onClick={onAddToCart}
          disabled={isOutOfStock}
          variant="outline"
          size="lg"
          fullWidth
          data-testid="add-to-cart"
          className={cn(
            "h-12 text-base font-medium rounded-[var(--radius-md)] tracking-wide transition-all border-[var(--border-control)]",
            added && "bg-[var(--color-success)] text-white hover:bg-[var(--color-success)] border-transparent",
          )}
        >
          {added ? (
            <span className="inline-flex items-center gap-2">
              <Check className="size-5" />
              Adicionado!
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <ShoppingCart className="size-5" />
              Adicionar ao carrinho
            </span>
          )}
        </Button>
      </div>

      {/* Calculadora de Frete e Informações de Entrega (Figma Node 417:323) */}
      <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 space-y-3">
        <ShippingCalculator />

        {/* Avisos informativos do Figma */}
        <div className="pt-2 border-t border-[var(--border)] space-y-1.5 text-xs font-sans text-[var(--foreground-secondary)]">
          <p>Prefere retirar? Escolha a retirada na loja no checkout.</p>
          <p className="text-[var(--foreground-muted)]">Compra segura · Consulte as condições de troca</p>
        </div>
      </div>
    </div>
  );
}
