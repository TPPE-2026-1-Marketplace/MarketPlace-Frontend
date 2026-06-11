"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Shield, RefreshCw } from "lucide-react";

export default function PromoSection() {
  return (
    <>
      {/* Editorial banner */}
      <section className="my-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-[#1a1a1a] p-10 md:p-16">
          <div className="relative z-10 max-w-lg">
            <p className="text-gray-500 text-xs tracking-[0.3em] uppercase mb-3 font-sans">
              Nova Temporada
            </p>
            <h2
              className="text-white mb-3 font-serif text-3xl sm:text-4xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Coleção Formatura 2026
            </h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed font-sans">
              Vestidos desenhados para marcar o início de uma nova fase. Elegância,
              confiança e sofisticação em cada detalhe.
            </p>
            <Link
              href="/produtos?categoria=formatura"
              className="inline-flex items-center gap-2 bg-white text-[#1a1a1a] px-8 py-3 hover:bg-gray-100 transition-colors text-sm tracking-wide font-medium"
            >
              Explorar Coleção <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust features */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: <MapPin className="w-5 h-5" />,
              title: "Entrega no DF",
              desc: "Enviamos para todo o Distrito Federal",
            },
            {
              icon: <Shield className="w-5 h-5" />,
              title: "Compra Segura",
              desc: "Dados protegidos e transações seguras",
            },
            {
              icon: <RefreshCw className="w-5 h-5" />,
              title: "Troca em 7 dias",
              desc: "Conforme o Código de Defesa do Consumidor",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center text-center p-6 bg-white border border-gray-100"
            >
              <div className="w-11 h-11 bg-gray-100 flex items-center justify-center text-gray-600 mb-4 rounded-full">
                {f.icon}
              </div>
              <h4 className="text-gray-900 mb-1 font-serif text-lg">{f.title}</h4>
              <p className="text-gray-500 text-xs font-sans">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
