import React, { useState, useRef } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Package,
  Globe,
  Store,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  Star,
  GripVertical,
  Upload,
} from "lucide-react";
import { Product, PRODUCTS } from "../../data/products";
import { AddProduct } from "./AddProduct";
import { api } from "@/lib/api";

type StockType = "all" | "ecommerce" | "physical";
type FilterCategory = "all" | Product["category"];

// Image Gallery Manager Component
interface ImageManagerProps {
  images: string[];
  onChange: (images: string[]) => void;
  coverIndex: number;
  onCoverChange: (index: number) => void;
}

function ImageManager({ images, onChange, coverIndex, onCoverChange }: ImageManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        onChange([...images, url]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addUrl = () => {
    if (urlInput.trim()) {
      onChange([...images, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const removeImage = (idx: number) => {
    const newImages = images.filter((_, i) => i !== idx);
    onChange(newImages);
    if (coverIndex === idx) onCoverChange(0);
    else if (coverIndex > idx) onCoverChange(coverIndex - 1);
  };

  const moveImage = (fromIdx: number, toIdx: number) => {
    const arr = [...images];
    const [item] = arr.splice(fromIdx, 1);
    arr.splice(toIdx, 0, item);
    onChange(arr);
    // adjust cover index
    if (coverIndex === fromIdx) onCoverChange(toIdx);
    else if (fromIdx < coverIndex && toIdx >= coverIndex) onCoverChange(coverIndex - 1);
    else if (fromIdx > coverIndex && toIdx <= coverIndex) onCoverChange(coverIndex + 1);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggingIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggingIdx !== null && draggingIdx !== idx) {
      moveImage(draggingIdx, idx);
    }
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggingIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="URL da imagem..."
          className="flex-1 border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-[#1a1a1a]"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
        />
        <button
          type="button"
          onClick={addUrl}
          className="px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-xs"
        >
          Adicionar URL
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 bg-[#1a1a1a] text-white hover:bg-[#333333] transition-colors text-xs flex items-center gap-1"
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {images.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <ImagePlus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Clique para adicionar imagens ou arraste acima</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              className={`relative group border-2 transition-all cursor-move ${coverIndex === idx ? "border-[#1a1a1a]" : "border-gray-200"
                } ${dragOverIdx === idx && draggingIdx !== idx ? "border-gray-500 scale-105" : ""}`}
            >
              <div className="aspect-[3/4] overflow-hidden bg-gray-50">
                <img
                  src={img}
                  alt={`Imagem ${idx + 1}`}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {/* Cover badge */}
              {coverIndex === idx && (
                <div className="absolute top-1 left-1 bg-[#1a1a1a] text-white text-xs px-1.5 py-0.5 flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" /> Capa
                </div>
              )}
              {/* Drag handle */}
              <div className="absolute bottom-1 left-1 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 drop-shadow" />
              </div>
              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {coverIndex !== idx && (
                  <button
                    type="button"
                    onClick={() => onCoverChange(idx)}
                    className="bg-white text-gray-800 text-xs px-2 py-0.5 hover:bg-gray-100 transition-colors"
                  >
                    Definir capa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => idx > 0 && moveImage(idx, idx - 1)}
                  disabled={idx === 0}
                  className="bg-white/80 text-gray-700 p-1 disabled:opacity-30 hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="bg-red-100 text-red-600 p-1 hover:bg-red-200 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => idx < images.length - 1 && moveImage(idx, idx + 1)}
                  disabled={idx === images.length - 1}
                  className="bg-white/80 text-gray-700 p-1 disabled:opacity-30 hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {/* Index */}
              <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs w-5 h-5 flex items-center justify-center">
                {idx + 1}
              </div>
            </div>
          ))}
          {/* Add more button */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors aspect-[3/4]"
          >
            <div className="text-center">
              <Plus className="w-5 h-5 text-gray-400 mx-auto" />
              <p className="text-xs text-gray-400 mt-1">Adicionar</p>
            </div>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400">
        Arraste para reordenar. Clique em "Definir capa" para escolher a foto principal.
      </p>
    </div>
  );
}

interface InventoryProps {
  readOnly?: boolean;
}

export function Inventory({ readOnly = false }: InventoryProps) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Product>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [stockView, setStockView] = useState<StockType>("all");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [coverIndex, setCoverIndex] = useState(0);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    sku: "",
    description: "",
    price: 0,
    category: "festa",
    stockEcommerce: 0,
    stockPhysical: 0,
    sizes: ["34", "36", "38", "40", "42"],
    colors: [],
    images: [],
    featured: false,
  });
  const [colorInput, setColorInput] = useState("");

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValues({ ...product });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = () => {
    setProducts((prev) =>
      prev.map((p) => (p.id === editingId ? { ...p, ...editValues } : p))
    );
    setEditingId(null);
    setEditValues({});
  };

  const deleteProduct = (id: string) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.sku || !newProduct.price) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    // Ensure cover image is first
    const images = [...(newProduct.images || [])];
    if (images.length > 1 && coverIndex > 0) {
      const [cover] = images.splice(coverIndex, 1);
      images.unshift(cover);
    }

    const product: Product = {
      id: Date.now().toString(),
      sku: newProduct.sku!,
      name: newProduct.name!,
      description: newProduct.description || "",
      price: Number(newProduct.price),
      originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
      category: (newProduct.category as Product["category"]) || "festa",
      images: images.length > 0 ? images : [PRODUCTS[0].images[0]],
      sizes: newProduct.sizes || ["38", "40"],
      colors: newProduct.colors || [],
      stockEcommerce: Number(newProduct.stockEcommerce) || 0,
      stockPhysical: Number(newProduct.stockPhysical) || 0,
      featured: newProduct.featured || false,
      brand: newProduct.brand || "DK Fashion",
    };
    setProducts((prev) => [...prev, product]);
    setShowAddModal(false);
    setCoverIndex(0);
    setNewProduct({
      name: "", sku: "", description: "", price: 0, category: "festa",
      stockEcommerce: 0, stockPhysical: 0,
      sizes: ["34", "36", "38", "40", "42"], colors: [],
      images: [], featured: false,
    });
    setColorInput("");
  };

  const StockBadge = ({ value, type }: { value: number; type: "ecommerce" | "physical" }) => {
    const isLow = value <= 3;
    const isMid = value > 3 && value <= 8;
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className={`text-xs px-2 py-0.5 ${isLow ? "bg-red-100 text-red-700" :
            isMid ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
          }`}>
          {value}
        </span>
        <span className="text-xs text-gray-400">
          {type === "ecommerce" ? "Online" : "Loja"}
        </span>
      </div>
    );
  };

  const categories = ["all", "debutante", "formatura", "casamento", "festa"];
  const catLabels: Record<string, string> = {
    all: "Todas", debutante: "Debutante", formatura: "Formatura",
    casamento: "Casamento", festa: "Festa",
  };

  // Early return for AddProduct wizard
  if (showAddProduct) {
    return (
      <AddProduct
        onBack={() => setShowAddProduct(false)}
        onSave={async (product) => {
          try {
            const created = await api.post<any>("/products", {
              titulo: product.name || product.title,
              preco_base: product.price || 0,
              descricao: product.description,
              categoria: product.category,
              imagem_url: product.images?.[0] || null,
            });
            setProducts((prev) => [...prev, { ...product, id: String(created.id_produto ?? created.id) } as Product]);
          } catch (err) {
            console.error("Erro ao salvar produto:", err);
            // Fallback: salva localmente mesmo se a API falhar
            setProducts((prev) => [...prev, product as Product]);
          }
          setShowAddProduct(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Controle de Estoque{readOnly && " (Visualização)"}</h2>
          <p className="text-gray-500 text-sm">
            {products.length} produtos cadastrados
            {readOnly && <span className="ml-2 text-amber-600">• Acesso somente leitura</span>}
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowAddProduct(true)}
            className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2.5 hover:bg-[#333333] transition-colors text-sm"
          >
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        )}
      </div>

      {/* Stock summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Geral", value: products.reduce((s, p) => s + p.stockEcommerce + p.stockPhysical, 0), icon: <Package className="w-4 h-4" />, color: "text-gray-700 bg-gray-100" },
          { label: "E-commerce", value: products.reduce((s, p) => s + p.stockEcommerce, 0), icon: <Globe className="w-4 h-4" />, color: "text-gray-700 bg-gray-100" },
          { label: "Loja Física", value: products.reduce((s, p) => s + p.stockPhysical, 0), icon: <Store className="w-4 h-4" />, color: "text-gray-700 bg-gray-100" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${stat.color} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className="text-gray-900 text-lg">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou SKU..."
              className="w-full border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "ecommerce", "physical"] as StockType[]).map((v) => (
              <button
                key={v}
                onClick={() => setStockView(v)}
                className={`flex items-center gap-1 px-3 py-2 border text-xs transition-colors ${stockView === v ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
              >
                {v === "all" ? <><Package className="w-3 h-3" /> Todos</> :
                  v === "ecommerce" ? <><Globe className="w-3 h-3" /> Online</> :
                    <><Store className="w-3 h-3" /> Loja</>}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat as FilterCategory)}
              className={`px-3 py-1 text-xs transition-colors border ${filterCategory === cat
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
            >
              {catLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs">
                <th className="text-left px-4 py-3">Produto</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">SKU</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Categoria</th>
                <th className="text-right px-4 py-3">Preço</th>
                {(stockView === "all" || stockView === "ecommerce") && (
                  <th className="text-center px-4 py-3">Online</th>
                )}
                {(stockView === "all" || stockView === "physical") && (
                  <th className="text-center px-4 py-3">Loja</th>
                )}
                <th className="text-center px-4 py-3">Total</th>
                {!readOnly && <th className="text-center px-4 py-3">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product) => {
                const isEditing = editingId === product.id;
                const totalStock = product.stockEcommerce + product.stockPhysical;
                const isLow = totalStock <= 5;
                return (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${isLow ? "bg-red-50/20" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-10 h-12 object-cover object-top shrink-0"
                        />
                        <div className="min-w-0">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValues.name || ""}
                              onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                              className="border border-gray-300 px-2 py-1 text-sm w-full focus:outline-none focus:border-[#1a1a1a]"
                            />
                          ) : (
                            <p className="text-gray-900 truncate max-w-36">{product.name}</p>
                          )}
                          {isLow && !isEditing && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 mt-0.5">
                              <AlertTriangle className="w-3 h-3" /> Estoque baixo
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-400 text-xs">{product.sku}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 capitalize">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.price || ""}
                          onChange={(e) => setEditValues({ ...editValues, price: Number(e.target.value) })}
                          className="border border-gray-300 px-2 py-1 text-sm w-24 text-right focus:outline-none focus:border-[#1a1a1a]"
                        />
                      ) : (
                        <span className="text-gray-700">
                          R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                    {(stockView === "all" || stockView === "ecommerce") && (
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.stockEcommerce ?? ""}
                            onChange={(e) => setEditValues({ ...editValues, stockEcommerce: Number(e.target.value) })}
                            className="border border-gray-300 px-2 py-1 text-sm w-16 text-center focus:outline-none focus:border-[#1a1a1a]"
                          />
                        ) : (
                          <StockBadge value={product.stockEcommerce} type="ecommerce" />
                        )}
                      </td>
                    )}
                    {(stockView === "all" || stockView === "physical") && (
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.stockPhysical ?? ""}
                            onChange={(e) => setEditValues({ ...editValues, stockPhysical: Number(e.target.value) })}
                            className="border border-gray-300 px-2 py-1 text-sm w-16 text-center focus:outline-none focus:border-[#1a1a1a]"
                          />
                        ) : (
                          <StockBadge value={product.stockPhysical} type="physical" />
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm ${totalStock <= 3 ? "text-red-600" : totalStock <= 8 ? "text-amber-600" : "text-green-700"}`}>
                        {isEditing
                          ? (Number(editValues.stockEcommerce || 0) + Number(editValues.stockPhysical || 0))
                          : totalStock}
                      </span>
                    </td>
                    {!readOnly && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                title="Salvar"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(product)}
                                className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteProduct(product.id)}
                                className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-10 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl mb-10">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-gray-900">Novo Produto</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Images section */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Imagens do Produto</p>
                <ImageManager
                  images={newProduct.images || []}
                  onChange={(images) => setNewProduct({ ...newProduct, images })}
                  coverIndex={coverIndex}
                  onCoverChange={setCoverIndex}
                />
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Informações do Produto</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Nome do Produto *</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                      placeholder="Ex: Vestido Rosa Encanto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">SKU *</label>
                    <input
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                      placeholder="DK-009"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as Product["category"] })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                    >
                      <option value="debutante">Debutante</option>
                      <option value="formatura">Formatura</option>
                      <option value="casamento">Casamento</option>
                      <option value="festa">Festa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Preço *</label>
                    <input
                      type="number"
                      value={newProduct.price || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Preço Original</label>
                    <input
                      type="number"
                      value={newProduct.originalPrice || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Estoque Online</label>
                    <input
                      type="number"
                      value={newProduct.stockEcommerce || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, stockEcommerce: Number(e.target.value) })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Estoque Loja Física</label>
                    <input
                      type="number"
                      value={newProduct.stockPhysical || ""}
                      onChange={(e) => setNewProduct({ ...newProduct, stockPhysical: Number(e.target.value) })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Descrição</label>
                    <textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] resize-none"
                      rows={2}
                      placeholder="Descrição do produto..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Cores (Enter para adicionar)</label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {(newProduct.colors || []).map((c) => (
                        <span key={c} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1">
                          {c}
                          <button onClick={() => setNewProduct({ ...newProduct, colors: (newProduct.colors || []).filter(x => x !== c) })}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && colorInput.trim()) {
                          e.preventDefault();
                          setNewProduct({ ...newProduct, colors: [...(newProduct.colors || []), colorInput.trim()] });
                          setColorInput("");
                        }
                      }}
                      className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                      placeholder="Ex: Rosa (Enter para adicionar)"
                    />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={newProduct.featured}
                      onChange={(e) => setNewProduct({ ...newProduct, featured: e.target.checked })}
                      className="accent-[#1a1a1a]"
                    />
                    <label htmlFor="featured" className="text-sm text-gray-600">
                      Produto em destaque
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 hover:border-gray-400 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={addProduct}
                className="flex-1 bg-[#1a1a1a] text-white py-2 hover:bg-[#333333] transition-colors text-sm"
              >
                Adicionar Produto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}