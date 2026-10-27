import React from "react";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button-variants";
import EmptyState from "@/components/ui/EmptyState";
import ProductCard from "@/components/ui/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";
import { getDisplayVariant } from "@/lib/catalog";

export default function FeaturedProducts() {
  const { products, isLoading, error } = useProducts({ page: 1, limit: 4 });

  return (
    <section className="bg-[var(--background-card)] px-4 py-16 sm:px-6 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-serif text-[2rem] leading-[1.2] text-[var(--foreground)] sm:text-[2.5rem]">
          Uma seleção para o seu momento
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
          Salve seus favoritos e escolha tamanho e cor na página do produto.
        </p>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)]">
                <Skeleton className="aspect-[3/4] rounded-none" />
                <div className="space-y-2 p-3">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error || products.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<ShoppingBag className="size-7" />}
              title={error ? "Não foi possível carregar os destaques" : "Nenhum vestido em destaque"}
              body={error ? "Tente novamente em instantes." : "Volte em breve para ver as novidades."}
            />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {products.map((product) => {
                const variant = getDisplayVariant(product);
                return (
                  <ProductCard
                    key={product.idProduto}
                    id={product.idProduto}
                    titulo={product.titulo}
                    preco={variant?.precoVariante ?? product.precoBase}
                    imagem={variant?.images[0]?.url || "/hero-dress.png"}
                    categoria={product.categories[0]?.nome}
                    variant={variant}
                    nota={product.mediaAvaliacao}
                    totalAvaliacoes={product.totalAvaliacoes}
                  />
                );
              })}
            </div>
            <Link
              to="/produtos"
              className={buttonClassName({ variant: "outline-neutral", size: "touch", className: "mt-6" })}
            >
              Ver todos os vestidos
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
