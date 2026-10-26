import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { buttonClassName } from "@/components/ui/button-variants";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/ui/EmptyState";
import { useFavorites } from "@/context/FavoritesContext";
import { useProducts } from "@/hooks/useProducts";
import { getDisplayVariant } from "@/lib/catalog";
import { formatCurrency } from "@/lib/utils";

export default function MeusFavoritos() {
  const { favorites } = useFavorites();
  const { products } = useProducts({ page: 1, limit: 200 });
  const favProducts = products.filter((product) => favorites.includes(String(product.idProduto)));

  return (
    <Card className="gap-5 rounded-none border-[var(--border)] p-6">
      <h2 className="font-serif text-xl text-gray-900">Meus Favoritos</h2>

      {favProducts.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-7" />}
          title="Nenhum favorito ainda"
          body="Salve seus vestidos favoritos para não perder!"
          action={
            <Link
              to="/produtos"
              className={buttonClassName({ variant: "outline-neutral", size: "sm" })}
            >
              Explorar vestidos
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {favProducts.map((product) => {
            const variant = getDisplayVariant(product);
            const price = variant?.precoVariante ?? product.precoBase;
            const image = variant?.images[0]?.url ?? "/hero-dress.png";
            const nome = product.titulo;
            const cat = product.categories[0]?.nome ?? "Vestido";
            const id = product.idProduto;
            return (
              <Link
                key={id}
                to={`/produtos/${id}`}
                className="group flex gap-4 border border-gray-100 p-3 transition-colors hover:border-gray-300"
              >
                <div className="h-28 w-20 shrink-0 overflow-hidden bg-gray-50">
                  {image && <img src={image} alt={nome} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs tracking-widest text-gray-400 uppercase">{cat}</p>
                  <h4 className="truncate text-sm text-gray-900 transition-colors group-hover:text-gray-600">
                    {nome}
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">{formatCurrency(price)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
