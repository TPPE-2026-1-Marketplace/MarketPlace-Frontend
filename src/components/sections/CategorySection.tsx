"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

const categories = [
  {
    id: "debutante",
    label: "Debutante",
    sub: "Sua noite mágica",
    image: "/cat-debutante.png",
  },
  {
    id: "formatura",
    label: "Formatura",
    sub: "Celebre sua conquista",
    image: "/cat-formatura.png",
  },
  {
    id: "casamento",
    label: "Casamento",
    sub: "Elegância e sofisticação",
    image: "/cat-casamento.png",
  },
  {
    id: "festa",
    label: "Festa",
    sub: "Brilhe em qualquer ocasião",
    image: "/cat-festa.png",
  },
];

export default function CategorySection() {
  return (
    <>
      {/* DF delivery strip */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span>Entregamos em todo o Distrito Federal</span>
        </div>
      </div>

      {/* Categories */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-gray-900 font-serif text-2xl" style={{ letterSpacing: "-0.02em" }}>
                Nossas Coleções
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Encontre o vestido perfeito para cada ocasião
              </p>
            </div>
            <Link
              href="/produtos"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/produtos?categoria=${cat.id}`}
                className="group relative overflow-hidden aspect-[3/4] block bg-gray-100"
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white text-sm tracking-wide font-serif">{cat.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{cat.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
