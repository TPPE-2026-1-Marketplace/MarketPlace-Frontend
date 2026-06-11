"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    title: "Vestidos que contam histórias inesquecíveis",
    subtitle: "Do baile de debutante à festa mais especial — encontre o seu vestido dos sonhos.",
    image: "/hero-dress.png",
    tag: "DEBUTANTE & FESTA",
    primaryCta: "Festas",
    primaryCategory: "/produtos?categoria=festa",
    secondaryCta: "Debutante",
    secondaryCategory: "/produtos?categoria=debutante",
  }
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const slides = SLIDES;

  // Render a nice hero layout based on the image provided
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "clamp(480px, 88vh, 820px)" }}
      aria-label="Banner principal"
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          <img
            src={s.image}
            alt={s.title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-[#0a0a0a]/40 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="absolute inset-0 flex items-center" style={{ zIndex: 5 }}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="max-w-xl">
            {slides[current].tag && (
              <p className="text-gray-300 text-xs tracking-[0.35em] uppercase mb-4 font-sans">
                {slides[current].tag}
              </p>
            )}
            <h1
              className="text-white mb-5 font-serif"
              style={{
                fontSize: "clamp(2rem, 5vw, 4rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              {slides[current].title}
            </h1>
            {slides[current].subtitle && (
              <p className="text-gray-300 text-sm sm:text-base mb-8 leading-relaxed max-w-md font-sans">
                {slides[current].subtitle}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              {slides[current].primaryCta && (
                <Link
                  href={slides[current].primaryCategory}
                  className="bg-white text-[#1a1a1a] px-8 py-3.5 hover:bg-gray-100 transition-colors text-sm tracking-widest uppercase font-medium text-center"
                >
                  {slides[current].primaryCta}
                </Link>
              )}
              {slides[current].secondaryCta && (
                <Link
                  href={slides[current].secondaryCategory}
                  className="border border-white/40 bg-black/20 backdrop-blur-sm text-white px-8 py-3.5 hover:border-white hover:bg-white/10 transition-colors text-sm tracking-widest uppercase font-medium text-center"
                >
                  {slides[current].secondaryCta}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Slide dots at bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 items-center z-10">
        <button className="h-1 rounded-full transition-all duration-300 w-8 bg-white"></button>
        <button className="h-1 rounded-full transition-all duration-300 w-2 bg-white/40 hover:bg-white/70"></button>
        <button className="h-1 rounded-full transition-all duration-300 w-2 bg-white/40 hover:bg-white/70"></button>
      </div>

      <div className="absolute top-6 right-6 text-white/60 text-xs tracking-widest z-10 font-sans">
        01 / 03
      </div>
      
      {/* Mock arrows for visual match */}
      <button className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 items-center justify-center transition-colors backdrop-blur-sm z-10">
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 items-center justify-center transition-colors backdrop-blur-sm z-10">
        <ChevronRight className="w-5 h-5 text-white" />
      </button>
    </section>
  );
}
