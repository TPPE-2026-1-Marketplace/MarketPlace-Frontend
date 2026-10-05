import { Link } from "react-router-dom";
import type { CartItem } from "@/hooks/useCart";
import { formatCurrency } from "@/lib/utils";

interface CartLineItemProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

/** CartLineItem do Figma: 78×112 no mobile e 112×144 no desktop. */
export default function CartLineItem({ item, onIncrease, onDecrease, onRemove }: CartLineItemProps) {
  const { variant, quantity } = item;
  const title = variant.produto.titulo;
  const productUrl = `/produtos/${variant.produto.idProduto}`;

  return (
    <article className="flex gap-2.5 bg-[var(--background-card)] lg:gap-4" data-testid="cart-line-item">
      <Link to={productUrl} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <img
          src={variant.images?.[0]?.url || "/hero-dress.png"}
          alt=""
          className="h-28 w-[78px] rounded-[10px] object-cover object-top lg:h-36 lg:w-28"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="truncate text-sm leading-5 font-medium text-[var(--foreground)]">
          <Link to={productUrl} className="hover:underline">
            {title}
          </Link>
        </h3>
        {(variant.cor || variant.tamanho) && (
          <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">
            {variant.cor}
            {variant.cor && variant.tamanho && " • "}
            {variant.tamanho && (
              <>
                <span className="hidden lg:inline">Tam. </span>
                {variant.tamanho}
              </>
            )}
          </p>
        )}
        <p className="text-sm leading-5 font-medium text-[var(--foreground)]">
          {formatCurrency(variant.precoVariante ?? variant.produto.precoBase)}
        </p>

        <div className="flex h-10 items-center gap-2.5">
          <div
            role="group"
            aria-label={`Quantidade de ${title}`}
            className="flex h-[34px] w-[94px] items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background-card)] px-1 text-[var(--foreground)]"
          >
            <button
              type="button"
              onClick={onDecrease}
              aria-label={`Diminuir quantidade de ${title}`}
              className="flex h-full w-7 items-center justify-center rounded-[var(--radius-sm)] text-xl leading-7 font-semibold hover:bg-[var(--background-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            >
              −
            </button>
            <span className="text-xs leading-4 font-medium tracking-[0.5px]" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={onIncrease}
              aria-label={`Aumentar quantidade de ${title}`}
              className="flex h-full w-7 items-center justify-center rounded-[var(--radius-sm)] text-xl leading-7 font-semibold hover:bg-[var(--background-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="text-xs leading-[18px] text-[var(--color-error-text)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            Remover<span className="sr-only"> {title}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
