import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Banner {
  id: string;
  image: string;
  tag: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  primaryCategory: string;
  secondaryCta: string;
  secondaryCategory: string;
  active: boolean;
  order: number;
}

/** Converts a category key to a route path — reuses existing URL convention */
export function categoryToPath(cat: string): string {
  if (cat === "all") return "/produtos";
  if (["midi", "longo", "longuete"].includes(cat)) return `/produtos?tipo=${cat}`;
  return `/produtos?categoria=${cat}`;
}

export const CATEGORY_OPTIONS = [
  { value: "all", label: "Todos os Vestidos" },
  { value: "festa", label: "Festa" },
  { value: "formatura", label: "Formatura" },
  { value: "casamento", label: "Casamento" },
  { value: "debutante", label: "Debutante" },
  { value: "midi", label: "Midi" },
  { value: "longo", label: "Longo" },
  { value: "longuete", label: "Longuete" },
];

const INITIAL_BANNERS: Banner[] = [
  {
    id: "b-001",
    image:
      "https://images.unsplash.com/photo-1746207068013-7bc3da9231ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBldmVuaW5nJTIwZ293biUyMGZhc2hpb24lMjBlZGl0b3JpYWwlMjBjYW1wYWlnbnxlbnwxfHx8fDE3NzYxODc0OTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tag: "Nova Coleção 2026",
    title: "Elegância que transforma cada momento",
    subtitle:
      "Vestidos exclusivos para debutantes, formaturas e festas especiais no Distrito Federal.",
    primaryCta: "Ver Coleção",
    primaryCategory: "all",
    secondaryCta: "Debutante",
    secondaryCategory: "debutante",
    active: true,
    order: 1,
  },
  {
    id: "b-002",
    image:
      "https://images.unsplash.com/photo-1763950744089-451fa39fa5fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJlc3MlMjBnYWxhJTIwZmFzaGlvbiUyMHNob3clMjBtb2RlbCUyMHJ1bndheXxlbnwxfHx8fDE3NzYxODc0OTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tag: "Formatura 2026",
    title: "Sua conquista merece o vestido perfeito",
    subtitle: "Coleção exclusiva para formaturas com cortes e tecidos de alta costura.",
    primaryCta: "Formatura",
    primaryCategory: "formatura",
    secondaryCta: "Ver Todos",
    secondaryCategory: "all",
    active: true,
    order: 2,
  },
  {
    id: "b-003",
    image:
      "https://images.unsplash.com/photo-1763625645366-b12410f63f6a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9tJTIwZGVidXRhbnRlJTIwYmFsbCUyMGdvd24lMjBwcmluY2VzcyUyMGRyZXNzfGVufDF8fHx8MTc3NjE4NzQ5OXww&ixlib=rb-4.1.0&q=80&w=1080",
    tag: "Debutante & Festa",
    title: "Vestidos que contam histórias inesquecíveis",
    subtitle:
      "Do baile de debutante à festa mais especial — encontre o seu vestido dos sonhos.",
    primaryCta: "Festas",
    primaryCategory: "festa",
    secondaryCta: "Debutante",
    secondaryCategory: "debutante",
    active: true,
    order: 3,
  },
];

interface BannerContextType {
  banners: Banner[];
  activeBanners: Banner[];
  addBanner: (data: Omit<Banner, "id" | "order">) => void;
  updateBanner: (id: string, data: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  toggleActive: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);

  const sorted = [...banners].sort((a, b) => a.order - b.order);
  const activeBanners = sorted.filter((b) => b.active);

  const addBanner = (data: Omit<Banner, "id" | "order">) => {
    const maxOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.order)) : 0;
    setBanners((prev) => [
      ...prev,
      { ...data, id: `b-${Date.now()}`, order: maxOrder + 1 },
    ]);
  };

  const updateBanner = (id: string, data: Partial<Banner>) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  };

  const deleteBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleActive = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const moveUp = (id: string) => {
    const s = [...banners].sort((a, b) => a.order - b.order);
    const idx = s.findIndex((b) => b.id === id);
    if (idx <= 0) return;
    const prev = s[idx - 1];
    const curr = s[idx];
    setBanners((all) =>
      all.map((b) => {
        if (b.id === curr.id) return { ...b, order: prev.order };
        if (b.id === prev.id) return { ...b, order: curr.order };
        return b;
      })
    );
  };

  const moveDown = (id: string) => {
    const s = [...banners].sort((a, b) => a.order - b.order);
    const idx = s.findIndex((b) => b.id === id);
    if (idx >= s.length - 1) return;
    const next = s[idx + 1];
    const curr = s[idx];
    setBanners((all) =>
      all.map((b) => {
        if (b.id === curr.id) return { ...b, order: next.order };
        if (b.id === next.id) return { ...b, order: curr.order };
        return b;
      })
    );
  };

  return (
    <BannerContext.Provider
      value={{
        banners: sorted,
        activeBanners,
        addBanner,
        updateBanner,
        deleteBanner,
        toggleActive,
        moveUp,
        moveDown,
      }}
    >
      {children}
    </BannerContext.Provider>
  );
}

export function useBanners() {
  const ctx = useContext(BannerContext);
  if (!ctx) throw new Error("useBanners must be used within BannerProvider");
  return ctx;
}
