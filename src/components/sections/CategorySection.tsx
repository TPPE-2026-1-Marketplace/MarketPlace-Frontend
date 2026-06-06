import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const categories = [
  {
    name: "Debutante",
    slug: "debutante",
    image: "/cat-debutante.png",
    description: "Vestidos dos sonhos para os 15 anos",
    color: "#e88bbd",
  },
  {
    name: "Formatura",
    slug: "formatura",
    image: "/cat-formatura.png",
    description: "Elegância para a sua grande conquista",
    color: "#6b8acd",
  },
  {
    name: "Casamento",
    slug: "casamento",
    image: "/cat-casamento.png",
    description: "Madrinhas e convidadas deslumbrantes",
    color: "#d4b896",
  },
  {
    name: "Festa",
    slug: "festa",
    image: "/cat-festa.png",
    description: "Para brilhar em qualquer ocasião",
    color: "#e06060",
  },
];

export default function CategorySection() {
  return (
    <section className="py-20 sm:py-28 bg-[var(--background-secondary)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-[var(--color-brand)]">
            Explore
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-white mt-2">
            Encontre por{" "}
            <span className="font-semibold text-gradient">Categoria</span>
          </h2>
          <p className="text-[var(--foreground-muted)] mt-3 max-w-md mx-auto">
            Cada ocasião merece um vestido especial. Explore nossas coleções
            cuidadosamente selecionadas.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, index) => (
            <Link
              key={cat.slug}
              href={`/produtos?categoria=${cat.slug}`}
              className="group block animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative overflow-hidden rounded-[var(--radius-lg)] aspect-[3/4] cursor-pointer">
                {/* Image */}
                <Image
                  src={cat.image}
                  alt={`Categoria ${cat.name}`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />

                {/* Overlay */}
                <div
                  className="absolute inset-0 transition-all duration-[var(--transition-base)]"
                  style={{
                    background: `linear-gradient(to top, ${cat.color}cc 0%, ${cat.color}33 40%, transparent 100%)`,
                  }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-[var(--transition-base)]" />

                {/* Content */}
                <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col">
                  <h3 className="text-xl font-semibold text-white tracking-wide">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-white/70 mt-1">
                    {cat.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-white/80 group-hover:text-white transition-colors">
                    <span className="tracking-wider uppercase">Explorar</span>
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
