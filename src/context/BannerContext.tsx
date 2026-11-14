import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

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

const STORAGE_KEY = "dk_banners";

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

function isValidBanner(value: unknown): value is Banner {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Banner>;
  return (
    typeof item.id === "string" &&
    typeof item.image === "string" &&
    typeof item.title === "string" &&
    typeof item.active === "boolean" &&
    typeof item.order === "number"
  );
}

function normalizeBanners(list: Banner[]): Banner[] {
  return [...list]
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map((banner, index) => ({ ...banner, order: index + 1 }));
}

function loadBanners(): Banner[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.every(isValidBanner)) {
        return normalizeBanners(parsed);
      }
    }
  } catch {
    // Dados corrompidos no armazenamento — usa lista inicial padrão.
  }
  return INITIAL_BANNERS;
}

function saveBanners(list: Banner[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignora falhas de quota em armazenamento local.
  }
}

interface BannerContextType {
  banners: Banner[];
  activeBanners: Banner[];
  addBanner: (data: Omit<Banner, "id" | "order">) => void;
  updateBanner: (id: string, data: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  toggleActive: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  reorderBanners: (sourceId: string, targetId: string) => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<Banner[]>(loadBanners);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEY) {
        setBanners(loadBanners());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const sorted = [...banners].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const activeBanners = sorted.filter((b) => b.active);

  const commit = (updater: (prev: Banner[]) => Banner[]) => {
    setBanners((prev) => {
      const next = normalizeBanners(updater(prev));
      saveBanners(next);
      return next;
    });
  };

  const addBanner = (data: Omit<Banner, "id" | "order">) => {
    commit((prev) => {
      const maxOrder = prev.length > 0 ? Math.max(...prev.map((b) => b.order)) : 0;
      return [
        ...prev,
        { ...data, id: `b-${Date.now()}-${prev.length}`, order: maxOrder + 1 },
      ];
    });
  };

  const updateBanner = (id: string, data: Partial<Banner>) => {
    commit((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  };

  const deleteBanner = (id: string) => {
    commit((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleActive = (id: string) => {
    commit((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
  };

  const moveByOffset = (id: string, offset: -1 | 1) => {
    commit((prev) => {
      const ordered = [...prev].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
      const idx = ordered.findIndex((b) => b.id === id);
      const targetIdx = idx + offset;
      if (idx === -1 || targetIdx < 0 || targetIdx >= ordered.length) return ordered;
      const [item] = ordered.splice(idx, 1);
      ordered.splice(targetIdx, 0, item);
      return ordered.map((banner, index) => ({ ...banner, order: index + 1 }));
    });
  };

  const moveUp = (id: string) => moveByOffset(id, -1);

  const moveDown = (id: string) => moveByOffset(id, 1);

  const reorderBanners = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    commit((prev) => {
      const ordered = [...prev].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
      const fromIndex = ordered.findIndex((b) => b.id === sourceId);
      const toIndex = ordered.findIndex((b) => b.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return ordered;
      const [moved] = ordered.splice(fromIndex, 1);
      ordered.splice(toIndex, 0, moved);
      return ordered.map((banner, index) => ({ ...banner, order: index + 1 }));
    });
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
        reorderBanners,
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
