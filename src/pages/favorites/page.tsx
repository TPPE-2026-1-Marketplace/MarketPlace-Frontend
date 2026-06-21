import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ui/ProductCard";
import { useProducts } from "@/hooks/useProducts";

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const { isAuthenticated } = useAuth();

  // Fetch all products so we can filter by favorite IDs
  const { products, isLoading } = useProducts({ page: 1, limit: 200 });

  const favoriteProducts = products.filter((product) =>
    favorites.includes(String(product.idProduto))
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8] font-sans">
        <div className="text-center">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-gray-700 mb-2 font-serif text-2xl">Você precisa estar logada</h2>
          <p className="text-gray-500 text-sm mb-4">Faça login para ver seus favoritos.</p>
          <Link
            to="/login"
            className="bt-principal px-6 py-2 text-sm inline-block"
          >
            Fazer Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Page header */}
      <div className="bg-[#1a1a1a] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-white mb-1 font-serif text-3xl">Meus Favoritos</h1>
          <p className="text-gray-400 text-sm font-sans">
            {favoriteProducts.length} vestido{favoriteProducts.length !== 1 ? "s" : ""} salvos
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 animate-pulse">
                <div className="aspect-[3/4] bg-gray-100" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 w-1/3" />
                  <div className="h-4 bg-gray-100 w-2/3" />
                  <div className="h-4 bg-gray-100 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-gray-700 font-serif text-2xl mb-2">Nenhum favorito ainda</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              Salve seus vestidos favoritos clicando no coração nos produtos e encontre-os facilmente aqui.
            </p>
            <Link
              to="/produtos"
              className="bt-principal inline-flex items-center gap-2 px-6 py-3 text-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              Explorar Vestidos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteProducts.map((product) => {
              const variant = product.variants[0];
              return (
                <ProductCard
                  key={product.idProduto}
                  id={product.idProduto}
                  titulo={product.titulo}
                  preco={variant?.precoVariante ?? product.precoBase}
                  imagem={variant?.images[0]?.url || "/hero-dress.png"}
                  categoria={product.categories[0]?.nome}
                  variant={variant}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
