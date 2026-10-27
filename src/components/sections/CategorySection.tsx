import React from "react";
import { Link } from "react-router-dom";

const categories = [
  { id: "debutante", label: "Debutante", image: "/cat-debutante.png" },
  { id: "formatura", label: "Formatura", image: "/cat-formatura.png" },
  { id: "casamento", label: "Casamento", image: "/cat-casamento.png" },
  { id: "festa", label: "Festa", image: "/cat-festa.png" },
];

export default function CategorySection() {
  return (
    <section className="bg-[var(--background-card)] px-4 py-16 sm:px-6 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="font-serif text-[2rem] leading-[1.2] text-[var(--foreground)] sm:text-[2.5rem]">
          Encontre o vestido para o seu momento
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground-secondary)]">Categorias por ocasião</p>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/produtos?categoria=${cat.id}`}
              className="group block overflow-hidden rounded-[var(--radius-lg)] bg-[var(--background-card)] border border-[var(--border)]"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col gap-1 p-4">
                <p className="text-xl font-semibold text-[var(--foreground)]">{cat.label}</p>
                <p className="text-xs text-[var(--foreground-secondary)]">Explorar vestidos →</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
