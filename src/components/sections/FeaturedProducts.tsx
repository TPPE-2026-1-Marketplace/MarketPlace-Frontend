/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyModel = any;

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ui/ProductCard";
import { api } from "@/lib/api";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<AnyModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        setLoading(true);
        // Using getProducts instead of getFeaturedProducts for now as it may not exist
        const response = await api.get("/products", { page: 1, limit: 4 });
        setProducts((response as any).data || []);
      } catch (error) {
        console.error("Erro ao carregar destaques:", error);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-gray-900 font-serif text-2xl" style={{ letterSpacing: "-0.02em" }}>
            Destaques
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Curadoria das peças mais amadas da nossa coleção
          </p>
        </div>
        <Link
          to="/produtos"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
        >
          Ver todos <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[3/4] bg-gray-100 animate-pulse border border-gray-200"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id_produto}
              id={product.id_produto}
              titulo={product.titulo}
              preco={product.preco_base}
              imagem={product.variants?.[0]?.images?.[0]?.image?.url || "/hero-dress.png"}
              categoria={product.categories?.[0]?.nome}
            />
          ))}
        </div>
      )}
    </section>
  );
}
