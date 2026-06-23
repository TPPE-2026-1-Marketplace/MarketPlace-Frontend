import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  Check,
  Upload,
  X,
  Plus,
  ImagePlus,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Package,
  Globe,
  Store,
  Tag,
  Save,
  Crop,
  ChevronDown,
  Info,
  AlertCircle,
  RefreshCw,
  Layers,
  Send,
  Scissors,
  GripVertical,
} from "lucide-react";
import { Product } from "../../data/products";

// =====================
// Constants for Crop
// =====================
const CONTAINER_W = 370;
const CONTAINER_H = 420;
const CROP_W = 222; // 3:4 ratio
const CROP_H = 296;
const CROP_LEFT = Math.floor((CONTAINER_W - CROP_W) / 2); // 74
const CROP_TOP = Math.floor((CONTAINER_H - CROP_H) / 2); // 62

// =====================
// Types
// =====================
interface ColorVariant {
  id: string;
  name: string;
  hex: string;
  images: string[];
  coverIdx: number;
}

interface VariantRow {
  codigoSku: string;
  color: string;
  size: string;
  stockOnline: number;
  stockPhysical: number;
  price: number;
}

const normalizeSkuPart = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();

const createVariantSku = (baseSku: string, color: string, size: string) =>
  [baseSku, color, size].map(normalizeSkuPart).filter(Boolean).join("-");

const createLocalId = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`;

interface FormData {
  title: string;
  description: string;
  sku: string;
  catL1: string;
  catL2: string;
  catL3: string;
  attrs: Record<string, string>;
  tags: string[];
  colors: ColorVariant[];
  sizes: string[];
  basePrice: number;
  featured: boolean;
}

// =====================
// Category Data
// =====================
const CAT_TREE: Record<string, Record<string, string[]>> = {
  Vestuário: {
    Vestidos: [
      "Debutante",
      "Formatura",
      "Casamento",
      "Festa",
      "Coquetel",
      "Gala",
    ],
    "Roupas Casuais": ["Blusas", "Calças", "Saias", "Macacões"],
    "Lingerie e Pijamas": ["Lingerie", "Pijamas", "Roupão"],
  },
  Acessórios: {
    Bolsas: ["Clutch", "Bolsa de Festa", "Mini Bag", "Pochete"],
    Bijuterias: ["Colares", "Brincos", "Pulseiras", "Tiaras", "Broches"],
    Calçados: ["Saltos", "Sandálias", "Plataformas", "Mules", "Sapatilhas"],
  },
  Figurino: {
    Temáticos: ["Princesas", "Fantasia", "Histórico", "Carnaval"],
    "Trajes Profissionais": ["Escola", "Trabalho", "Teatro"],
  },
};

const CAT_ATTRS: Record<string, { label: string; options: string[] }[]> = {
  default: [
    {
      label: "Material",
      options: [
        "Tule", "Seda", "Organza", "Renda", "Cetim", "Crepe", "Veludo", "Chiffon", "Paetê",
        "Couro Sintético", "Couro Natural", "Tecido", "Sintético", "Misto", "Metal"
      ],
    },
    {
      label: "Composição",
      options: [
        "100% Poliéster", "50% Poliéster / 50% Elastano", "100% Seda Natural", "Misto Sintético",
        "88% Nylon / 12% Elastano", "100% Algodão"
      ],
    },
    {
      label: "Silhueta",
      options: ["Princesa", "Sereia", "A-Line", "Reto", "Evasê", "Tubo", "Mullet"],
    },
    {
      label: "Qual Medida",
      options: ["Mini", "Midi", "Longo", "Maxi", "Pequeno", "Médio", "Grande", "Único"],
    },
  ],
};

const PRESET_COLORS = [
  { name: "Preto", hex: "#1a1a1a" },
  { name: "Branco", hex: "#f5f5f0" },
  { name: "Rosa Bebê", hex: "#f9a8d4" },
  { name: "Vinho", hex: "#881337" },
  { name: "Azul Marinho", hex: "#1e3a5f" },
  { name: "Verde Esmeralda", hex: "#065f46" },
  { name: "Champagne", hex: "#e8d5a3" },
  { name: "Lilás", hex: "#c084fc" },
  { name: "Vermelho", hex: "#dc2626" },
  { name: "Dourado", hex: "#d4a017" },
  { name: "Cinza Chumbo", hex: "#6b7280" },
  { name: "Nude", hex: "#d4b896" },
  { name: "Azul Royal", hex: "#1d4ed8" },
  { name: "Coral", hex: "#f97316" },
];

const STANDARD_SIZES = [
  "PP", "P", "M", "G", "GG", "XGG",
  "34", "36", "38", "40", "42", "44", "46", "48",
  "U",
];

const STEPS = [
  { id: 1, label: "Informação Básica", desc: "Título, descrição e SKU" },
  { id: 2, label: "Atributos de Categoria", desc: "Categorização e atributos" },
  { id: 3, label: "Especificações de Venda", desc: "Variantes, preço e imagens" },
  { id: 4, label: "Gestão de Estoque", desc: "Estoque online e físico" },
];

// =====================
// Crop Modal
// =====================
function CropModal({
  imageSrc,
  onApply,
  onClose,
}: {
  imageSrc: string;
  onApply: (dataUrl: string) => void;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: CROP_LEFT, y: CROP_TOP });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 });
  const [naturalSize, setNaturalSize] = useState({ w: 300, h: 400 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgElRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgElRef.current = img;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      setNaturalSize({ w: nw, h: nh });
      const minZ = Math.max(CROP_W / nw, CROP_H / nh);
      const sw = nw * minZ;
      const sh = nh * minZ;
      setZoom(minZ);
      setOffset({
        x: CROP_LEFT + (CROP_W - sw) / 2,
        y: CROP_TOP + (CROP_H - sh) / 2,
      });
      setImgLoaded(true);
    };
    img.onerror = () => {
      setNaturalSize({ w: 300, h: 400 });
      const minZ = Math.max(CROP_W / 300, CROP_H / 400);
      setZoom(minZ);
      setOffset({ x: CROP_LEFT, y: CROP_TOP });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const scaledW = naturalSize.w * zoom;
  const scaledH = naturalSize.h * zoom;
  const minZoom = Math.max(CROP_W / naturalSize.w, CROP_H / naturalSize.h);

  const clamp = useCallback(
    (ox: number, oy: number, sw: number, sh: number) => ({
      x: Math.min(CROP_LEFT, Math.max(CROP_LEFT + CROP_W - sw, ox)),
      y: Math.min(CROP_TOP, Math.max(CROP_TOP + CROP_H - sh, oy)),
    }),
    []
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y });
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y });
  };

  const handleMouseMove = useCallback(
    (e: globalThis.MouseEvent) => {
      if (!isDragging) return;
      const clamped = clamp(
        dragStart.ox + e.clientX - dragStart.x,
        dragStart.oy + e.clientY - dragStart.y,
        scaledW,
        scaledH
      );
      setOffset(clamped);
    },
    [isDragging, dragStart, scaledW, scaledH, clamp]
  );

  const handleTouchMove = useCallback(
    (e: globalThis.TouchEvent) => {
      if (!isDragging) return;
      const t = e.touches[0];
      const clamped = clamp(
        dragStart.ox + t.clientX - dragStart.x,
        dragStart.oy + t.clientY - dragStart.y,
        scaledW,
        scaledH
      );
      setOffset(clamped);
    },
    [isDragging, dragStart, scaledW, scaledH, clamp]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  const applyZoom = (newZ: number) => {
    const clamped = Math.min(minZoom * 4, Math.max(minZoom, newZ));
    const sw = naturalSize.w * clamped;
    const sh = naturalSize.h * clamped;
    const cx = CROP_LEFT + CROP_W / 2;
    const cy = CROP_TOP + CROP_H / 2;
    const relX = scaledW > 0 ? (cx - offset.x) / scaledW : 0.5;
    const relY = scaledH > 0 ? (cy - offset.y) / scaledH : 0.5;
    setZoom(clamped);
    setOffset(clamp(cx - relX * sw, cy - relY * sh, sw, sh));
  };

  const applyCrop = () => {
    const img = imgElRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = CROP_W * 2;
    canvas.height = CROP_H * 2;
    const ctx = canvas.getContext("2d")!;
    if (img && img.complete) {
      const srcX = (CROP_LEFT - offset.x) / zoom;
      const srcY = (CROP_TOP - offset.y) / zoom;
      const srcW = CROP_W / zoom;
      const srcH = CROP_H / zoom;
      try {
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
        onApply(canvas.toDataURL("image/jpeg", 0.9));
      } catch {
        onApply(imageSrc);
      }
    } else {
      onApply(imageSrc);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div className="bg-white w-full max-w-[450px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#0e7490]/10 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-[#0e7490]" />
            </div>
            <div>
              <p className="text-gray-900 text-sm">Recortar Imagem</p>
              <p className="text-gray-400 text-xs mt-0.5">
                Proporção obrigatória 3:4 · Arraste para reposicionar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="flex flex-col items-center p-4 bg-gray-900/5 gap-3">
          <div
            className={`relative overflow-hidden bg-gray-900 select-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{ width: CONTAINER_W, height: CONTAINER_H }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {imgLoaded && (
              <img
                src={imageSrc}
                alt="recorte"
                draggable={false}
                style={{
                  position: "absolute",
                  left: offset.x,
                  top: offset.y,
                  width: scaledW,
                  height: scaledH,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              />
            )}
            {/* Overlay mask with crop window */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: CROP_LEFT,
                top: CROP_TOP,
                width: CROP_W,
                height: CROP_H,
                boxShadow: `0 0 0 ${CONTAINER_W + CONTAINER_H}px rgba(0,0,0,0.62)`,
                border: "2px solid rgba(255,255,255,0.95)",
                zIndex: 10,
              }}
            >
              {/* Rule of thirds grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/25" />
                ))}
              </div>
              {/* Corner brackets */}
              <div className="absolute -top-px -left-px w-4 h-4 border-l-2 border-t-2 border-white" />
              <div className="absolute -top-px -right-px w-4 h-4 border-r-2 border-t-2 border-white" />
              <div className="absolute -bottom-px -left-px w-4 h-4 border-l-2 border-b-2 border-white" />
              <div className="absolute -bottom-px -right-px w-4 h-4 border-r-2 border-b-2 border-white" />
            </div>
            {/* Aspect ratio badge */}
            <div className="absolute bottom-2 right-2 z-20 bg-black/65 text-white text-xs px-2 py-0.5 pointer-events-none tracking-widest">
              3 : 4
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-3 w-full px-1">
            <button
              onClick={() => applyZoom(zoom - minZoom * 0.1)}
              className="text-gray-500 hover:text-gray-800 transition-colors shrink-0"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <input
              type="range"
              min={minZoom}
              max={minZoom * 4}
              step={minZoom * 0.01}
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              className="flex-1 accent-[#0e7490]"
            />
            <button
              onClick={() => applyZoom(zoom + minZoom * 0.1)}
              className="text-gray-500 hover:text-gray-800 transition-colors shrink-0"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400 w-10 text-right shrink-0 font-mono">
              {Math.round((zoom / minZoom) * 100)}%
            </span>
          </div>
        </div>

        {/* Warning */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border-t border-amber-100">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <p className="text-amber-700 text-xs">
            Imagens fora do padrão 3:4 afetam a exibição do produto na vitrine e no marketplace.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={applyCrop}
            className="px-5 py-2 bg-[#0e7490] text-white text-sm hover:bg-[#0a5c72] transition-colors flex items-center gap-2"
          >
            <Check className="w-3.5 h-3.5" />
            Aplicar Corte
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================
// Image thumbnail grid per color
// =====================
function ColorImageGrid({
  color,
  onUpload,
  onRemove,
  onSetCover,
  onCrop,
  fileInputRef,
}: {
  color: ColorVariant;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (idx: number) => void;
  onSetCover: (idx: number) => void;
  onCrop: (src: string) => void;
  fileInputRef: (el: HTMLInputElement | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => inputRef.current?.click();

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData("text/plain", idx.toString());
  };

  return (
    <div className="space-y-2">
      <input
        ref={(el) => {
          inputRef.current = el;
          fileInputRef(el);
        }}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onUpload}
      />
      {color.images.length === 0 ? (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-gray-200 p-5 text-center cursor-pointer hover:border-[#0e7490]/40 hover:bg-[#0e7490]/5 transition-all"
        >
          <ImagePlus className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
          <p className="text-xs text-gray-400">Clique para adicionar fotos</p>
          <p className="text-xs text-gray-300 mt-0.5">
            A ferramenta de recorte 3:4 será aberta automaticamente
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5">
          {color.images.map((img, imgIdx) => (
            <div
              key={imgIdx}
              draggable
              onDragStart={(e) => handleDragStart(e, imgIdx)}
              className={`relative group border-2 transition-all cursor-move ${
                color.coverIdx === imgIdx
                  ? "border-[#1a1a1a]"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <div className="aspect-[3/4] overflow-hidden bg-gray-50">
                <img
                  src={img}
                  alt={`${color.name} ${imgIdx + 1}`}
                  className="w-full h-full object-cover object-top"
                  draggable={false}
                />
              </div>
              {color.coverIdx === imgIdx && (
                <div className="absolute top-0.5 left-0.5 bg-black text-white text-xs px-1 py-0.5 flex items-center gap-0.5">
                  <Star className="w-2 h-2" />
                  <span style={{ fontSize: "9px" }}>Capa</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {color.coverIdx !== imgIdx && (
                  <button
                    onClick={() => onSetCover(imgIdx)}
                    className="bg-white text-gray-800 text-xs px-1.5 py-0.5 hover:bg-gray-100 transition-colors"
                    style={{ fontSize: "9px" }}
                  >
                    Capa
                  </button>
                )}
                <button
                  onClick={() => onRemove(imgIdx)}
                  className="bg-red-100 text-red-600 p-0.5 hover:bg-red-200 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="absolute bottom-0.5 right-0.5 bg-black/50 text-white flex items-center justify-center"
                style={{ width: 14, height: 14, fontSize: "9px" }}>
                {imgIdx + 1}
              </div>
            </div>
          ))}
          {/* Add more */}
          <div
            onClick={handleClick}
            className="border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors aspect-[3/4]"
          >
            <Plus className="w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>
      )}
      {color.images.length > 0 && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <GripVertical className="w-3 h-3" />
          Passe o mouse para definir capa ou remover. Primeira imagem é a capa padrão.
        </p>
      )}
    </div>
  );
}

// =====================
// Main AddProduct Component
// =====================
export function AddProduct({
  onBack,
  onSave,
}: {
  onBack: () => void;
  onSave: (product: Partial<Product>, payload?: { form: any, variants: any[] }) => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    sku: "",
    catL1: "",
    catL2: "",
    catL3: "",
    attrs: {},
    tags: [],
    colors: [],
    sizes: [],
    basePrice: 0,
    featured: false,
  });
  const [tagInput, setTagInput] = useState("");
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [cropModal, setCropModal] = useState<{
    colorId: string;
    src: string;
  } | null>(null);
  const [addColorMode, setAddColorMode] = useState(false);
  const [newColor, setNewColor] = useState({ name: "", hex: "#1a1a1a" });
  const [globalApply, setGlobalApply] = useState({
    price: "",
    online: "",
    physical: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedDraft, setSavedDraft] = useState(false);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Category derived data
  const l1Options = Object.keys(CAT_TREE);
  const l2Options = form.catL1 ? Object.keys(CAT_TREE[form.catL1] || {}) : [];
  const l3Options =
    form.catL1 && form.catL2 ? CAT_TREE[form.catL1]?.[form.catL2] || [] : [];
  const currentAttrs = form.catL2
    ? CAT_ATTRS[form.catL2] || CAT_ATTRS["default"]
    : CAT_ATTRS["default"];

  // Generate variant rows for step 4
  const generateVariants = () => {
    const colorNames =
      form.colors.length > 0 ? form.colors.map((c) => c.name) : ["Padrão"];
    const sizeNames = form.sizes.length > 0 ? form.sizes : ["Único"];
    const rows: VariantRow[] = [];
    for (const size of sizeNames) {
      for (const color of colorNames) {
        const existing = variants.find(
          (v) => v.color === color && v.size === size
        );
        rows.push(
          existing || {
            codigoSku: createVariantSku(form.sku, color, size),
            color,
            size,
            stockOnline: 0,
            stockPhysical: 0,
            price: form.basePrice || 0,
          }
        );
      }
    }
    setVariants(rows);
  };

  const updateVariant = (codigoSku: string, field: keyof VariantRow, value: number) => {
    setVariants((prev) =>
      prev.map((v) => (v.codigoSku === codigoSku ? { ...v, [field]: value } : v))
    );
  };

  const applyToAll = (
    field: "stockOnline" | "stockPhysical" | "price",
    value: string
  ) => {
    const num = Number(value);
    if (isNaN(num)) return;
    setVariants((prev) => prev.map((v) => ({ ...v, [field]: num })));
  };

  // Image upload → opens crop modal
  const handleImageUpload = (
    colorId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const file = files[0]; // Process one at a time
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setCropModal({ colorId, src });
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  };

  const addCroppedImage = (colorId: string, dataUrl: string) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.map((c) =>
        c.id === colorId ? { ...c, images: [...c.images, dataUrl] } : c
      ),
    }));
    setCropModal(null);
  };

  const removeColorImage = (colorId: string, imgIdx: number) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.map((c) => {
        if (c.id !== colorId) return c;
        const images = c.images.filter((_, i) => i !== imgIdx);
        const coverIdx = c.coverIdx >= images.length ? 0 : c.coverIdx;
        return { ...c, images, coverIdx };
      }),
    }));
  };

  const setCoverIdx = (colorId: string, idx: number) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.map((c) =>
        c.id === colorId ? { ...c, coverIdx: idx } : c
      ),
    }));
  };

  const addColor = () => {
    const name = newColor.name.trim();
    if (!name) {
      setErrors((prev) => ({ ...prev, color: "Informe um nome para a cor." }));
      return;
    }
    const normalizedName = name.toLocaleLowerCase("pt-BR");
    if (form.colors.some((color) => color.name.toLocaleLowerCase("pt-BR") === normalizedName)) {
      setErrors((prev) => ({ ...prev, color: "Esta cor já foi adicionada." }));
      return;
    }
    const color: ColorVariant = {
      id: createLocalId("color"),
      name,
      hex: newColor.hex,
      images: [],
      coverIdx: 0,
    };
    setForm((prev) => ({ ...prev, colors: [...prev.colors, color] }));
    setErrors((prev) => ({ ...prev, color: "" }));
    setNewColor({ name: "", hex: "#1a1a1a" });
    setAddColorMode(false);
  };

  const removeColor = (colorId: string) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c.id !== colorId),
    }));
  };

  const toggleSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, t] }));
    }
    setTagInput("");
  };

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.title.trim()) errs.title = "O título do produto é obrigatório";
      if (!form.sku.trim()) errs.sku = "O SKU é obrigatório";
    }
    if (s === 2) {
      if (!form.catL1) errs.catL1 = "Selecione o departamento";
      if (!form.catL2) errs.catL2 = "Selecione a categoria";
    }
    if (s === 3) {
      if (!form.basePrice || form.basePrice <= 0)
        errs.basePrice = "Defina o preço de venda";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goToStep = (s: number) => {
    if (s > step && !validateStep(step)) return;
    if (s === 4) generateVariants();
    setStep(s);
    window.scrollTo(0, 0);
  };

  const handleNext = () => {
    if (step < 4) goToStep(step + 1);
  };

  const handleSaveDraft = () => {
    setSavedDraft(true);
    setTimeout(() => setSavedDraft(false), 2500);
  };

  const handlePost = () => {
    const totalOnline = variants.reduce((s, v) => s + v.stockOnline, 0);
    const totalPhysical = variants.reduce((s, v) => s + v.stockPhysical, 0);
    const allImages = form.colors.flatMap((c) => {
      const imgs = [...c.images];
      // Move cover to front
      if (c.coverIdx > 0 && imgs.length > c.coverIdx) {
        const [cover] = imgs.splice(c.coverIdx, 1);
        imgs.unshift(cover);
      }
      return imgs;
    });

    const product: Partial<Product> = {
      id: createLocalId("product"),
      sku: form.sku,
      name: form.title,
      description: form.description,
      price: form.basePrice,
      category: (
        (form.catL3 || form.catL2 || "festa")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .split(" ")[0] as Product["category"]
      ) || "festa",
      images:
        allImages.length > 0
          ? allImages
          : ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400"],
      sizes: form.sizes,
      colors: form.colors.map((c) => c.name),
      stockEcommerce: totalOnline,
      stockPhysical: totalPhysical,
      featured: form.featured,
      tags: form.tags,
    };
    onSave(product, { form, variants });
  };

  const stepDone = (s: number): boolean => {
    if (s === 1) return !!form.title.trim() && !!form.sku.trim();
    if (s === 2) return !!form.catL1 && !!form.catL2;
    if (s === 3) return form.basePrice > 0;
    if (s === 4)
      return variants.some((v) => v.stockOnline + v.stockPhysical > 0);
    return false;
  };

  const totalOnline = variants.reduce((s, v) => s + v.stockOnline, 0);
  const totalPhysical = variants.reduce((s, v) => s + v.stockPhysical, 0);
  const totalStock = totalOnline + totalPhysical;

  return (
    <div className="flex flex-col min-h-full">
      {/* Crop Modal */}
      {cropModal && (
        <CropModal
          imageSrc={cropModal.src}
          onApply={(dataUrl) => addCroppedImage(cropModal.colorId, dataUrl)}
          onClose={() => setCropModal(null)}
        />
      )}

      <div className="flex flex-1 min-h-0">
        {/* ── Left: Publication Assistant Stepper ── */}
        <aside className="w-56 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col">
          {/* Back */}
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Estoque
            </button>
          </div>

          {/* Steps */}
          <div className="p-4 flex-1">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
              Assistente de Publicação
            </p>
            <div className="space-y-px">
              {STEPS.map((s) => {
                const isCurrent = step === s.id;
                const isDone = stepDone(s.id) && s.id < step;
                const isAccessible = s.id <= step;
                return (
                  <button
                    key={s.id}
                    onClick={() => isAccessible && goToStep(s.id)}
                    disabled={!isAccessible}
                    className={`w-full text-left px-3 py-3 transition-all ${
                      isCurrent
                        ? "bg-black text-white"
                        : isDone
                        ? "bg-green-50 text-gray-700 hover:bg-green-100 cursor-pointer"
                        : isAccessible
                        ? "text-gray-500 hover:bg-gray-50 cursor-pointer"
                        : "text-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-5 h-5 flex items-center justify-center shrink-0 mt-0.5 ${
                          isCurrent
                            ? "bg-white/20"
                            : isDone
                            ? "bg-green-500"
                            : "border border-current"
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-3 h-3 text-white" />
                        ) : (
                          <span className="text-xs">{s.id}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs leading-tight">{s.label}</p>
                        {isCurrent && (
                          <p className="text-xs opacity-50 mt-0.5 leading-tight">
                            {s.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress bar */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span>Progresso</span>
              <span>{Math.round(((step - 1) / 3) * 100)}%</span>
            </div>
            <div className="h-1 bg-gray-100">
              <div
                className="h-full bg-[#0e7490] transition-all duration-500"
                style={{ width: `${Math.round(((step - 1) / 3) * 100)}%` }}
              />
            </div>
          </div>
        </aside>

        {/* ── Right: Step Content ── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#f8f8f8] overflow-hidden">
          <div className="flex-1 p-6 overflow-auto">
            {/* ── STEP 1: Informação Básica ── */}
            {step === 1 && (
              <div className="max-w-2xl space-y-5">
                <div>
                  <h2 className="text-gray-900">Informação Básica</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Preencha as informações essenciais do produto com precisão.
                  </p>
                </div>

                <div className="bg-white border border-gray-100 p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">
                      Detalhes do Produto
                    </p>
                    <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1">
                      <AlertCircle className="w-3 h-3" />
                      Campos obrigatórios
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-500">
                        Título do Produto{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`text-xs ${
                          form.title.length > 900
                            ? "text-red-500"
                            : "text-gray-400"
                        }`}
                      >
                        {form.title.length}/1000
                      </span>
                    </div>
                    <input
                      type="text"
                      value={form.title}
                      maxLength={1000}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, title: e.target.value }));
                        setErrors((p) => ({ ...p, title: "" }));
                      }}
                      placeholder="Ex: Vestido de Festa Longo Tule Debutante com Brilhos Coleção 2026"
                      className={`w-full border px-3 py-2.5 text-sm focus:outline-none transition-colors ${
                        errors.title
                          ? "border-red-400 focus:border-red-500 bg-red-50/30"
                          : "border-gray-200 focus:border-gray-900"
                      }`}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.title}
                      </p>
                    )}
                    <p className="text-gray-400 text-xs mt-1.5">
                      Inclua tipo, ocasião, material e cor para melhor visibilidade nas buscas.
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Descrição do Produto
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      rows={5}
                      placeholder="Descreva os detalhes: tecido, modelagem, ocasião ideal, composição, instruções de lavagem, ajuste..."
                      className="w-full border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-gray-900 resize-none"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Descrições detalhadas reduzem devoluções e aumentam conversão.
                    </p>
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      SKU de Referência <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => {
                        setForm((p) => ({ ...p, sku: e.target.value }));
                        setErrors((p) => ({ ...p, sku: "" }));
                      }}
                      placeholder="Ex: DK-009"
                      className={`w-full border px-3 py-2.5 text-sm focus:outline-none transition-colors ${
                        errors.sku
                          ? "border-red-400 focus:border-red-500 bg-red-50/30"
                          : "border-gray-200 focus:border-gray-900"
                      }`}
                    />
                    {errors.sku && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> {errors.sku}
                      </p>
                    )}
                  </div>

                  {/* Featured toggle */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div>
                      <p className="text-sm text-gray-700">Produto em Destaque</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Exibir na vitrine principal da loja
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setForm((p) => ({ ...p, featured: !p.featured }))
                      }
                      className={`relative w-11 h-6 transition-colors duration-200 ${
                        form.featured ? "bg-black" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] w-[18px] h-[18px] bg-white transition-transform duration-200 ${
                          form.featured ? "translate-x-[23px]" : "translate-x-[3px]"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Tip */}
                <div className="bg-blue-50 border border-blue-100 p-4 flex gap-3">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-800 text-sm">Dica de Preenchimento</p>
                    <p className="text-blue-600 text-xs mt-1">
                      Títulos com mais de 40 caracteres e palavras-chave relevantes
                      tendem a ter melhor performance. Evite CAPS LOCK excessivo e
                      caracteres especiais desnecessários.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Atributos de Categoria ── */}
            {step === 2 && (
              <div className="max-w-2xl space-y-5">
                <div>
                  <h2 className="text-gray-900">Atributos de Categoria</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Categorize corretamente para garantir visibilidade e evitar penalidades.
                  </p>
                </div>

                {/* Category Cascade */}
                <div className="bg-white border border-gray-100 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">
                      Árvore de Categorias
                    </p>
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Penalidade por categoria incorreta
                    </span>
                  </div>

                  {/* Breadcrumb */}
                  {form.catL1 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2">
                      <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{form.catL1}</span>
                      {form.catL2 && (
                        <>
                          <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                          <span>{form.catL2}</span>
                        </>
                      )}
                      {form.catL3 && (
                        <>
                          <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                          <span className="text-gray-900">{form.catL3}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    {/* L1 */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Departamento <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={form.catL1}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              catL1: e.target.value,
                              catL2: "",
                              catL3: "",
                              attrs: {},
                            }))
                          }
                          className={`w-full border px-3 py-2.5 text-sm appearance-none focus:outline-none transition-colors ${
                            errors.catL1
                              ? "border-red-400 bg-red-50/30"
                              : "border-gray-200 focus:border-gray-900"
                          }`}
                        >
                          <option value="">Selecionar</option>
                          {l1Options.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.catL1 && (
                        <p className="text-red-500 text-xs mt-1">{errors.catL1}</p>
                      )}
                    </div>

                    {/* L2 */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Categoria <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={form.catL2}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              catL2: e.target.value,
                              catL3: "",
                              attrs: {},
                            }))
                          }
                          disabled={!form.catL1}
                          className={`w-full border px-3 py-2.5 text-sm appearance-none focus:outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400 ${
                            errors.catL2
                              ? "border-red-400 bg-red-50/30"
                              : "border-gray-200 focus:border-gray-900"
                          }`}
                        >
                          <option value="">Selecionar</option>
                          {l2Options.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {errors.catL2 && (
                        <p className="text-red-500 text-xs mt-1">{errors.catL2}</p>
                      )}
                    </div>

                    {/* L3 */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Tipo
                      </label>
                      <div className="relative">
                        <select
                          value={form.catL3}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, catL3: e.target.value }))
                          }
                          disabled={!form.catL2 || l3Options.length === 0}
                          className="w-full border border-gray-200 px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">Selecionar</option>
                          {l3Options.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    A seleção em cascata (Departamento → Categoria → Tipo) garante a
                    correta indexação do produto.
                  </p>
                </div>

                {/* Dynamic Attributes */}
                {form.catL2 && (
                  <div className="bg-white border border-gray-100 p-5 space-y-4">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">
                      Atributos de {form.catL2}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {currentAttrs.map((attr) => (
                        <div key={attr.label}>
                          <label className="block text-xs text-gray-500 mb-1">
                            {attr.label}
                          </label>
                          <div className="relative">
                            <select
                              value={form.attrs[attr.label] || ""}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  attrs: {
                                    ...p.attrs,
                                    [attr.label]: e.target.value,
                                  },
                                }))
                              }
                              className="w-full border border-gray-200 px-3 py-2.5 text-sm appearance-none focus:outline-none focus:border-gray-900"
                            >
                              <option value="">Selecionar {attr.label}</option>
                              {attr.options.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Os atributos são dinâmicos e mudam conforme a categoria selecionada.
                    </p>
                  </div>
                )}

                {/* Tags */}
                <div className="bg-white border border-gray-100 p-5 space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    Tags e Palavras-chave
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      placeholder="Digite uma tag e pressione Enter ou vírgula..."
                      className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                    />
                    <button
                      onClick={() => addTag(tagInput)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.tags.map((tag) => (
                        <span
                          key={tag}
                          className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-2.5 py-1"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                          <button
                            onClick={() =>
                              setForm((p) => ({
                                ...p,
                                tags: p.tags.filter((t) => t !== tag),
                              }))
                            }
                          >
                            <X className="w-3 h-3 hover:text-red-500 transition-colors" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Sugestões:{" "}
                    {["longo", "midi", "longuete", "festa", "tule", "brilhos", "formatura"]
                      .filter((s) => !form.tags.includes(s))
                      .slice(0, 5)
                      .map((tag, i) => (
                        <button
                          key={tag}
                          onClick={() => addTag(tag)}
                          className="text-gray-600 hover:text-gray-900 hover:underline underline-offset-2"
                        >
                          {i > 0 && ", "}
                          {tag}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Especificações de Venda ── */}
            {step === 3 && (
              <div className="max-w-3xl space-y-5">
                <div>
                  <h2 className="text-gray-900">Especificações de Venda</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Configure preço, variantes, tamanhos e faça upload das fotos de cada cor.
                  </p>
                </div>

                {/* Pricing */}
                <div className="bg-white border border-gray-100 p-5 space-y-4">
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    Precificação Base
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Preço de Venda <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          R$
                        </span>
                        <input
                          type="number"
                          value={form.basePrice || ""}
                          onChange={(e) => {
                            setForm((p) => ({
                              ...p,
                              basePrice: Number(e.target.value),
                            }));
                            setErrors((p) => ({ ...p, basePrice: "" }));
                          }}
                          className={`w-full border pl-9 pr-3 py-2.5 text-sm focus:outline-none transition-colors ${
                            errors.basePrice
                              ? "border-red-400 bg-red-50/30"
                              : "border-gray-200 focus:border-gray-900"
                          }`}
                          placeholder="0,00"
                          min={0}
                          step={0.01}
                        />
                      </div>
                      {errors.color && (
                        <p className="text-xs text-red-600" role="alert">
                          {errors.color}
                        </p>
                      )}
                      {errors.basePrice && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.basePrice}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sizes */}
                <div className="bg-white border border-gray-100 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">
                      Tamanhos Disponíveis
                    </p>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5">
                      {form.sizes.length} selecionado(s)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {STANDARD_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`h-9 px-3 border text-xs transition-all ${
                          form.sizes.includes(size)
                            ? "bg-black text-white border-[#1a1a1a]"
                            : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {form.sizes.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Selecionados:</span>
                      <span className="text-gray-700">{form.sizes.join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Colors + Images */}
                <div className="bg-white border border-gray-100 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">
                      Cores e Fotos das Variantes
                    </p>
                    <button
                      onClick={() => setAddColorMode(true)}
                      className="flex items-center gap-1.5 text-xs border border-gray-200 px-3 py-1.5 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Cor
                    </button>
                  </div>

                  {/* Add color form */}
                  {addColorMode && (
                    <div className="border border-gray-200 p-4 bg-gray-50 space-y-3">
                      <p className="text-xs text-gray-500">Configurar Nova Cor</p>
                      <div className="flex gap-3 items-center">
                        <div className="relative">
                          <input
                            type="color"
                            value={newColor.hex}
                            onChange={(e) =>
                              setNewColor((p) => ({ ...p, hex: e.target.value }))
                            }
                            className="w-10 h-10 border border-gray-200 cursor-pointer p-0.5"
                          />
                        </div>
                        <input
                          type="text"
                          value={newColor.name}
                          onChange={(e) =>
                            setNewColor((p) => ({ ...p, name: e.target.value }))
                          }
                          placeholder="Nome da cor (Ex: Rosa Nude)"
                          className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                          onKeyDown={(e) => e.key === "Enter" && addColor()}
                        />
                      </div>
                      {/* Preset colors */}
                      <div>
                        <p className="text-xs text-gray-400 mb-2">
                          Cores predefinidas:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_COLORS.map((pc) => (
                            <button
                              key={pc.hex}
                              onClick={() =>
                                setNewColor({ name: pc.name, hex: pc.hex })
                              }
                              title={pc.name}
                              className={`w-6 h-6 border-2 transition-all ${
                                newColor.hex === pc.hex
                                  ? "border-gray-900 scale-110"
                                  : "border-transparent hover:border-gray-400"
                              }`}
                              style={{ backgroundColor: pc.hex }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={addColor}
                          className="px-3 py-1.5 bg-black text-white text-xs hover:bg-[#333] transition-colors"
                        >
                          Confirmar Cor
                        </button>
                        <button
                          onClick={() => setAddColorMode(false)}
                          className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-800"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {form.colors.length === 0 && !addColorMode && (
                    <div className="border-2 border-dashed border-gray-200 p-8 text-center">
                      <ImagePlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Nenhuma cor adicionada</p>
                      <p className="text-xs text-gray-300 mt-1">
                        Adicione cores para fazer upload das fotos de cada variação.
                        Sem cores, o produto terá apenas uma variação padrão.
                      </p>
                    </div>
                  )}

                  {/* Color rows */}
                  <div className="space-y-5">
                    {form.colors.map((color) => (
                      <div
                        key={color.id}
                        className="border border-gray-100 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-5 h-5 border border-gray-200 shrink-0"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-sm text-gray-800">
                              {color.name}
                            </span>
                            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5">
                              {color.images.length} foto(s)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                fileInputRefs.current[color.id]?.click()
                              }
                              className="flex items-center gap-1.5 text-xs border border-gray-200 px-2.5 py-1.5 text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
                            >
                              <Upload className="w-3 h-3" />
                              Upload
                            </button>
                            <button
                              onClick={() => removeColor(color.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <ColorImageGrid
                          color={color}
                          onUpload={(e) => handleImageUpload(color.id, e)}
                          onRemove={(idx) => removeColorImage(color.id, idx)}
                          onSetCover={(idx) => setCoverIdx(color.id, idx)}
                          onCrop={(src) =>
                            setCropModal({ colorId: color.id, src })
                          }
                          fileInputRef={(el) => {
                            fileInputRefs.current[color.id] = el;
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crop tool info */}
                <div className="bg-[#0e7490]/5 border border-[#0e7490]/20 p-4 flex gap-3">
                  <Crop className="w-4 h-4 text-[#0e7490] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[#0e7490] text-sm">
                      Ferramenta de Recorte Automático
                    </p>
                    <p className="text-[#0e7490]/70 text-xs mt-1">
                      Ao fazer upload de qualquer imagem, a ferramenta de recorte
                      será aberta automaticamente. Use o controle de zoom e arraste
                      a imagem para ajustar a composição antes de aplicar o recorte
                      3:4.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: Gestão de Estoque ── */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-gray-900">Gestão de Estoque</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Configure o estoque online e físico para cada variante. O total é
                    calculado automaticamente.
                  </p>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "Total Online",
                      value: totalOnline,
                      icon: <Globe className="w-4 h-4" />,
                      color: "text-gray-700 bg-gray-100",
                    },
                    {
                      label: "Total Loja Física",
                      value: totalPhysical,
                      icon: <Store className="w-4 h-4" />,
                      color: "text-gray-700 bg-gray-100",
                    },
                    {
                      label: "Estoque Total",
                      value: totalStock,
                      icon: <Package className="w-4 h-4" />,
                      color:
                        totalStock === 0
                          ? "text-red-600 bg-red-50"
                          : totalStock <= 10
                          ? "text-amber-700 bg-amber-50"
                          : "text-green-700 bg-green-50",
                    },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      className="bg-white border border-gray-100 p-4 flex items-center gap-3"
                    >
                      <div
                        className={`w-9 h-9 flex items-center justify-center shrink-0 ${kpi.color}`}
                      >
                        {kpi.icon}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{kpi.label}</p>
                        <p className="text-gray-900 text-lg">{kpi.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Apply to all */}
                <div className="bg-white border border-gray-100 p-5">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
                    Aplicar a Todas as Variantes
                  </p>
                  <div className="flex flex-wrap gap-4 items-end">
                    {/* Online */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Qtd. Online
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={globalApply.online}
                          onChange={(e) =>
                            setGlobalApply((p) => ({
                              ...p,
                              online: e.target.value,
                            }))
                          }
                          className="w-20 border border-gray-200 px-2 py-2 text-sm text-center focus:outline-none focus:border-gray-900"
                          min={0}
                          placeholder="0"
                        />
                        <button
                          onClick={() =>
                            applyToAll("stockOnline", globalApply.online)
                          }
                          className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                    {/* Physical */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Qtd. Loja Física
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={globalApply.physical}
                          onChange={(e) =>
                            setGlobalApply((p) => ({
                              ...p,
                              physical: e.target.value,
                            }))
                          }
                          className="w-20 border border-gray-200 px-2 py-2 text-sm text-center focus:outline-none focus:border-gray-900"
                          min={0}
                          placeholder="0"
                        />
                        <button
                          onClick={() =>
                            applyToAll("stockPhysical", globalApply.physical)
                          }
                          className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                    {/* Price */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Preço Unitário
                      </label>
                      <div className="flex gap-1">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                            R$
                          </span>
                          <input
                            type="number"
                            value={globalApply.price}
                            onChange={(e) =>
                              setGlobalApply((p) => ({
                                ...p,
                                price: e.target.value,
                              }))
                            }
                            className="w-28 border border-gray-200 pl-7 pr-2 py-2 text-sm focus:outline-none focus:border-gray-900"
                            min={0}
                            step={0.01}
                            placeholder="0,00"
                          />
                        </div>
                        <button
                          onClick={() =>
                            applyToAll("price", globalApply.price)
                          }
                          className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variant Table */}
                {variants.length === 0 ? (
                  <div className="bg-white border border-gray-100 p-10 text-center">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      Nenhuma variante configurada
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Volte ao passo anterior e adicione cores e/ou tamanhos para
                      gerar a tabela de estoque.
                    </p>
                    <button
                      onClick={() => setStep(3)}
                      className="mt-4 px-4 py-2 border border-gray-200 text-gray-600 text-sm hover:border-gray-400 transition-colors"
                    >
                      Voltar e Configurar Variantes
                    </button>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left px-5 py-3 text-xs text-gray-500 bg-gray-50">
                              Variante
                            </th>
                            <th className="text-center px-4 py-3 text-xs text-gray-500 bg-gray-50">
                              <div className="flex items-center justify-center gap-1">
                                <Globe className="w-3.5 h-3.5 text-gray-400" />
                                Qtd. Online
                              </div>
                            </th>
                            <th className="text-center px-4 py-3 text-xs text-gray-500 bg-gray-50">
                              <div className="flex items-center justify-center gap-1">
                                <Store className="w-3.5 h-3.5 text-gray-400" />
                                Qtd. Loja Física
                              </div>
                            </th>
                            <th className="text-center px-4 py-3 text-xs text-gray-500 bg-gray-100/80">
                              <div className="flex items-center justify-center gap-1">
                                <Package className="w-3.5 h-3.5 text-gray-400" />
                                Total
                              </div>
                            </th>
                            <th className="text-right px-5 py-3 text-xs text-gray-500 bg-gray-50">
                              Preço de Venda
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {variants.map((v) => {
                            const total = v.stockOnline + v.stockPhysical;
                            const colorObj = form.colors.find(
                              (c) => c.name === v.color
                            );
                            return (
                              <tr
                                key={v.codigoSku}
                                className="hover:bg-gray-50/60 transition-colors"
                              >
                                {/* Variant label */}
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2.5">
                                    {colorObj && (
                                      <div
                                        className="w-4 h-4 border border-gray-200 shrink-0"
                                        style={{ backgroundColor: colorObj.hex }}
                                      />
                                    )}
                                    <div>
                                      <span className="text-gray-800">{v.size}</span>
                                      {v.color !== "Padrão" && (
                                        <span className="text-gray-400 text-xs ml-2">
                                          · {v.color}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                {/* Online stock */}
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="number"
                                    value={v.stockOnline}
                                    onChange={(e) =>
                                      updateVariant(
                                        v.codigoSku,
                                        "stockOnline",
                                        Math.max(0, Number(e.target.value))
                                      )
                                    }
                                    min={0}
                                    className="w-20 border border-gray-200 px-2 py-1.5 text-sm text-center focus:outline-none focus:border-gray-900 mx-auto block"
                                  />
                                </td>
                                {/* Physical stock */}
                                <td className="px-4 py-3 text-center">
                                  <input
                                    type="number"
                                    value={v.stockPhysical}
                                    onChange={(e) =>
                                      updateVariant(
                                        v.codigoSku,
                                        "stockPhysical",
                                        Math.max(0, Number(e.target.value))
                                      )
                                    }
                                    min={0}
                                    className="w-20 border border-gray-200 px-2 py-1.5 text-sm text-center focus:outline-none focus:border-gray-900 mx-auto block"
                                  />
                                </td>
                                {/* Total - read only */}
                                <td className="px-4 py-3 text-center bg-gray-50">
                                  <span
                                    className={`text-sm font-mono font-medium ${
                                      total === 0
                                        ? "text-red-500"
                                        : total <= 5
                                        ? "text-amber-600"
                                        : "text-green-700"
                                    }`}
                                  >
                                    {total}
                                  </span>
                                  {total === 0 && (
                                    <p className="text-xs text-red-400 mt-0.5">
                                      Sem estoque
                                    </p>
                                  )}
                                </td>
                                {/* Price */}
                                <td className="px-5 py-3">
                                  <div className="relative flex justify-end">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                                      R$
                                    </span>
                                    <input
                                      type="number"
                                      value={v.price}
                                      onChange={(e) =>
                                        updateVariant(
                                          v.codigoSku,
                                          "price",
                                          Number(e.target.value)
                                        )
                                      }
                                      min={0}
                                      step={0.01}
                                      className="w-28 border border-gray-200 pl-7 pr-2 py-1.5 text-sm text-right focus:outline-none focus:border-gray-900"
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Footer totals */}
                        <tfoot>
                          <tr className="border-t-2 border-gray-200 bg-gray-50">
                            <td className="px-5 py-3 text-xs text-gray-500">
                              {variants.length} variante(s)
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-gray-600">
                              {totalOnline} unid.
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-gray-600">
                              {totalPhysical} unid.
                            </td>
                            <td className="px-4 py-3 text-center bg-gray-100">
                              <span className="text-sm text-gray-900">
                                {totalStock}
                              </span>
                            </td>
                            <td className="px-5 py-3" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sync info */}
                <div className="bg-white border border-gray-100 p-4 flex gap-3">
                  <RefreshCw className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-700 text-sm">Sincronização de Estoque</p>
                    <p className="text-gray-400 text-xs mt-1">
                      O campo "Total" é calculado automaticamente (Online + Loja
                      Física) e atualiza em tempo real conforme os valores são
                      alterados. O estoque online reflete a disponibilidade no
                      e-commerce, enquanto o estoque da loja física é gerenciado
                      de forma independente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Bottom Action Bar ── */}
          <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between sticky bottom-0 z-10 shrink-0">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 text-sm hover:border-gray-400 hover:text-gray-900 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </button>
              )}
              <button
                onClick={handleSaveDraft}
                className={`flex items-center gap-2 px-4 py-2 border text-sm transition-colors ${
                  savedDraft
                    ? "border-green-300 text-green-600 bg-green-50"
                    : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {savedDraft ? (
                  <>
                    <Check className="w-4 h-4" />
                    Rascunho Salvo
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Rascunho
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">
                Passo {step} de {STEPS.length}
              </span>
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
                >
                  Avançar
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handlePost}
                  className="flex items-center gap-2 px-6 py-2 bg-[#0e7490] text-white text-sm hover:bg-[#0a5c72] transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Postar Produto
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
