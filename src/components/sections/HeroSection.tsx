
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBanners } from "@/context/BannerContext";
import { categoryToPath } from "@/context/BannerContext";

const FALLBACK_SLIDES = [
  {
    id: "fallback-1",
    title: "Vestidos que contam histórias inesquecíveis",
    subtitle: "Do baile de debutante à festa mais especial — encontre o seu vestido dos sonhos.",
    image: "/hero-dress.png",
    tag: "DEBUTANTE & FESTA",
    primaryCta: "Festas",
    primaryCategory: "festa",
    secondaryCta: "Debutante",
    secondaryCategory: "debutante",
  }
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const { activeBanners } = useBanners();
  const slides = activeBanners.length > 0 ? activeBanners : FALLBACK_SLIDES;

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(interval);
  }, [slides.length]);

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
                  to={categoryToPath(slides[current].primaryCategory)}
                  className="bg-white text-[#1a1a1a] px-8 py-3.5 hover:bg-gray-100 transition-colors text-sm tracking-widest uppercase font-medium text-center"
                >
                  {slides[current].primaryCta}
                </Link>
              )}
              {slides[current].secondaryCta && (
                <Link
                  to={categoryToPath(slides[current].secondaryCategory)}
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
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>

      <div className="absolute top-6 right-6 text-white/60 text-xs tracking-widest z-10 font-sans">
        {String(current + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>
      
      {slides.length > 1 && (
        <>
          <button 
            onClick={() => setCurrent(prev => prev === 0 ? slides.length - 1 : prev - 1)}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 items-center justify-center transition-colors backdrop-blur-sm z-10"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={() => setCurrent(prev => prev === slides.length - 1 ? 0 : prev + 1)}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 items-center justify-center transition-colors backdrop-blur-sm z-10"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}
    </section>
  );
}
