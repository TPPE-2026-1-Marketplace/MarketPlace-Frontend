import { Loader2 } from "lucide-react";
import AdminField from "@/components/manager/AdminField";
import { adminButtonClassName, adminCardClassName, adminControlClassName, adminLabelClassName } from "@/components/manager/adminClasses";
import Button from "@/components/ui/Button";
import type { ApiProduct, POSSaleItem } from "@/data/pos-types";
import { cn, formatCurrency } from "@/lib/utils";

interface SaleCatalogProps {
  products: ApiProduct[];
  loading: boolean;
  error: string;
  search: string;
  onSearch: (value: string) => void;
  onReload: () => void;
  selectedProduct: ApiProduct | null;
  onSelectProduct: (product: ApiProduct) => void;
  variantSku: string;
  onVariantChange: (sku: string) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onAdd: () => void;
  items: POSSaleItem[];
  total: number;
  onRemove: (index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

const titleClassName = "text-xl font-semibold leading-7 text-[var(--foreground)]";
const bodyClassName = "text-sm leading-[22px] text-[var(--foreground)]";
const smallClassName = "text-xs leading-[18px] text-[var(--foreground-secondary)]";

/** Nova venda e carrinho nas versões desktop e mobile do PDV. */
export default function SaleCatalog(props: SaleCatalogProps) {
  const { products, selectedProduct, items } = props;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,860fr)_minmax(0,492fr)]">
      <section className="flex min-w-0 flex-col gap-4" aria-labelledby="pdv-products-title">
        <form className={cn(adminCardClassName, "flex flex-col items-start gap-3 p-4")} onSubmit={(event) => event.preventDefault()} role="search">
          <AdminField label="Buscar produto ou SKU" htmlFor="pdv-search" className="w-full">
            <input id="pdv-search" type="search" value={props.search} onChange={(event) => props.onSearch(event.target.value)} placeholder="Buscar por nome ou código SKU..." className={adminControlClassName} />
          </AdminField>
          <Button type="submit" variant="outline-neutral" size="sm" className={adminButtonClassName}>Buscar</Button>
        </form>
        <h2 id="pdv-products-title" className={titleClassName}>Produtos disponíveis</h2>
        {props.loading ? (
          <div className={cn(adminCardClassName, "flex items-center gap-3 p-6 text-sm text-[var(--foreground-muted)]")} role="status">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" /> Carregando produtos do sistema...
          </div>
        ) : props.error ? (
          <div className={cn(adminCardClassName, "flex flex-col items-start gap-4 p-6")} role="alert">
            <p className="text-sm text-[var(--color-error-text)]">{props.error}</p>
            <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={props.onReload}>Tentar novamente</Button>
          </div>
        ) : products.length === 0 ? (
          <div className={cn(adminCardClassName, "flex flex-col items-start gap-4 p-6")} role="status">
            <h3 className={titleClassName}>Nenhum produto encontrado</h3>
            <p className={smallClassName}>Altere a busca para tentar novamente.</p>
            <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={() => props.onSearch("")}>Limpar busca</Button>
          </div>
        ) : products.map((product) => (
          <article key={product.idProduto} className={cn(adminCardClassName, "flex min-w-0 flex-col items-start gap-2 p-4")}>
            <h3 className={cn(titleClassName, "break-words")}>{product.titulo}</h3>
            <p className={cn(adminLabelClassName, "text-[var(--foreground-muted)]")}>SKU base · {product.sku}</p>
            <p className={bodyClassName}>A partir de {formatCurrency(Number(product.precoBase))}</p>
            <Button variant="outline-neutral" size="sm" className={adminButtonClassName} aria-label={"Selecionar produto: " + product.titulo} onClick={() => props.onSelectProduct(product)}>Selecionar produto</Button>
          </article>
        ))}
        {selectedProduct && (
          <section className={cn(adminCardClassName, "flex flex-col items-start gap-4 p-6")} aria-labelledby="pdv-selected-title">
            <h3 id="pdv-selected-title" className={titleClassName}>{selectedProduct.titulo}</h3>
            <AdminField label="Variação *" htmlFor="pdv-variant" className="w-full">
              <select id="pdv-variant" value={props.variantSku} onChange={(event) => props.onVariantChange(event.target.value)} className={adminControlClassName}>
                <option value="">Selecione a variação</option>
                {selectedProduct.variants?.length ? selectedProduct.variants.map((variant) => (
                  <option key={variant.codigoSku} value={variant.codigoSku}>{variant.tamanho || "-"} / {variant.cor || "-"} · {variant.codigoSku}</option>
                )) : <option disabled>Nenhuma variação cadastrada</option>}
              </select>
            </AdminField>
            <AdminField label="Quantidade *" htmlFor="pdv-quantity" className="w-full">
              <input id="pdv-quantity" type="number" min="1" step="1" value={props.quantity} onChange={(event) => props.onQuantityChange(Math.max(1, Math.floor(Number(event.target.value)) || 1))} className={adminControlClassName} />
            </AdminField>
            <Button variant="action" size="sm" className={adminButtonClassName} onClick={props.onAdd}>Adicionar à venda</Button>
          </section>
        )}
      </section>
      <section className={cn(adminCardClassName, "flex min-w-0 flex-col items-start gap-4 p-6")} aria-labelledby="pdv-sale-title">
        <h2 id="pdv-sale-title" className={titleClassName}>Venda atual</h2>
        {items.length === 0 ? (
          <>
            <p className="text-sm leading-[22px] text-[var(--foreground-secondary)]">Nenhum item adicionado</p>
            <p className="text-xs leading-[18px] text-[var(--foreground-muted)]">Selecione um produto e a variação para começar.</p>
          </>
        ) : (
          <>
            {items.map((item, index) => (
              <article key={item.variantSku} className={cn(adminCardClassName, "flex w-full min-w-0 flex-col items-start gap-2 p-4")} aria-label={item.product.titulo}>
                <h3 className={cn(titleClassName, "break-words")}>{item.product.titulo}</h3>
                <p className={cn(smallClassName, "break-words")}>{item.color} / {item.size} · {item.variantSku}</p>
                <p className={bodyClassName}>{formatCurrency(Number(item.unitPrice))} / unidade</p>
                <div className="flex w-full items-start gap-2" role="group" aria-label={"Quantidade de " + item.product.titulo}>
                  <Button variant="outline-neutral" size="sm" className={cn(adminButtonClassName, "w-16 min-w-0")} aria-label={"Diminuir quantidade de " + item.product.titulo} onClick={() => props.onUpdateQuantity(index, item.quantity - 1)}>−</Button>
                  <span className="text-sm font-medium leading-5" aria-live="polite">{item.quantity}</span>
                  <Button variant="outline-neutral" size="sm" className={cn(adminButtonClassName, "w-16 min-w-0")} aria-label={"Aumentar quantidade de " + item.product.titulo} onClick={() => props.onUpdateQuantity(index, item.quantity + 1)}>+</Button>
                </div>
                <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={() => props.onRemove(index)}>Remover item</Button>
              </article>
            ))}
            <Button variant="outline-neutral" size="sm" className={adminButtonClassName} onClick={props.onClear}>Limpar tudo</Button>
          </>
        )}
        <p className="text-2xl font-semibold leading-8" aria-live="polite">Total · {formatCurrency(props.total)}</p>
        <Button variant="action" size="sm" className={cn(adminButtonClassName, "disabled:opacity-35")} disabled={items.length === 0} onClick={props.onCheckout}>Finalizar venda</Button>
      </section>
    </div>
  );
}
