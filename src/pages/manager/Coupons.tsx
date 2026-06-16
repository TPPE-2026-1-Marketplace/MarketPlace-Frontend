import React, { useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Tag,
  CheckCircle,
  XCircle,
  Percent,
} from "lucide-react";
import { MOCK_COUPONS, Coupon } from "../../data/coupons";
import { PRODUCTS } from "../../data/products";

export function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>(MOCK_COUPONS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    campaignName: "",
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    partner: "",
    active: true,
  });

  const filtered = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.campaignName.toLowerCase().includes(search.toLowerCase()) ||
      c.partner.toLowerCase().includes(search.toLowerCase())
  );

  const activeCoupons = coupons.filter((c) => c.active).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usageCount, 0);
  const averageDiscount =
    coupons.length > 0
      ? coupons.reduce((sum, c) => sum + c.discountValue, 0) / coupons.length
      : 0;

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        campaignName: coupon.campaignName,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue.toString(),
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        usageLimit: coupon.usageLimit.toString(),
        partner: coupon.partner,
        active: coupon.active,
      });
      setSelectedProducts(coupon.applicableProducts);
    } else {
      setEditingCoupon(null);
      setFormData({
        campaignName: "",
        code: "",
        discountType: "percentage",
        discountValue: "",
        startDate: "",
        endDate: "",
        usageLimit: "",
        partner: "",
        active: true,
      });
      setSelectedProducts([]);
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.campaignName || !formData.code || !formData.discountValue) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const couponData: Coupon = {
      id: editingCoupon?.id || `c-${Date.now()}`,
      campaignName: formData.campaignName,
      code: formData.code.toUpperCase(),
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      startDate: formData.startDate,
      endDate: formData.endDate,
      usageLimit: parseInt(formData.usageLimit) || 0,
      usageCount: editingCoupon?.usageCount || 0,
      partner: formData.partner,
      active: formData.active,
      applicableProducts: selectedProducts,
      createdAt: editingCoupon?.createdAt || new Date().toISOString().split("T")[0],
    };

    if (editingCoupon) {
      setCoupons(coupons.map((c) => (c.id === editingCoupon.id ? couponData : c)));
    } else {
      setCoupons([couponData, ...coupons]);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este cupom?")) {
      setCoupons(coupons.filter((c) => c.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setCoupons(coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Cupons e Campanhas</h2>
          <p className="text-gray-500 text-sm">{coupons.length} cupons cadastrados</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2.5 hover:bg-[#333333] transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Novo Cupom
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Cupons Ativos",
            value: activeCoupons,
            icon: <Tag className="w-4 h-4" />,
            color: "text-green-700 bg-green-50",
          },
          {
            label: "Total de Usos",
            value: totalUsage,
            icon: <Users className="w-4 h-4" />,
            color: "text-blue-700 bg-blue-50",
          },
          {
            label: "Desconto Médio",
            value: `${averageDiscount.toFixed(0)}%`,
            icon: <Percent className="w-4 h-4" />,
            color: "text-purple-700 bg-purple-50",
          },
          {
            label: "Total Cupons",
            value: coupons.length,
            icon: <TrendingUp className="w-4 h-4" />,
            color: "text-gray-700 bg-gray-100",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-100 p-4">
            <div className={`w-9 h-9 ${stat.color} flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
            <p className="text-gray-900 text-lg">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, campanha ou parceiro..."
            className="w-full border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs">
                <th className="text-left px-4 py-3">Campanha</th>
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-center px-4 py-3">Desconto</th>
                <th className="text-center px-4 py-3">Validade</th>
                <th className="text-center px-4 py-3">Usos</th>
                <th className="text-left px-4 py-3">Parceiro</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((coupon) => {
                const usagePercent = (coupon.usageCount / coupon.usageLimit) * 100;
                return (
                  <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-gray-900 text-sm">{coupon.campaignName}</p>
                      {coupon.applicableProducts.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {coupon.applicableProducts.length} produto(s)
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-gray-100 text-gray-900 text-xs px-2 py-1 font-mono">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-gray-900">
                        {coupon.discountType === "percentage"
                          ? `${coupon.discountValue}%`
                          : `R$ ${coupon.discountValue.toFixed(2)}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {coupon.startDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {coupon.endDate}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="space-y-1">
                        <p className="text-gray-900 text-sm">
                          {coupon.usageCount} / {coupon.usageLimit}
                        </p>
                        <div className="w-full bg-gray-200 h-1.5">
                          <div
                            className={`h-1.5 ${
                              usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-amber-500" : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 text-xs">{coupon.partner}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(coupon.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs ${
                          coupon.active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        } transition-colors`}
                      >
                        {coupon.active ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inativo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenModal(coupon)}
                          className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-10 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl mb-10">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-gray-900">{editingCoupon ? "Editar Cupom" : "Novo Cupom"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Nome da Campanha *</label>
                  <input
                    type="text"
                    value={formData.campaignName}
                    onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                    placeholder="Ex: Black Friday 2024"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Código do Cupom *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: BLACK2024"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Parceiro Responsável</label>
                  <input
                    type="text"
                    value={formData.partner}
                    onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                    placeholder="Ex: @influencer"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tipo de Desconto *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as "percentage" | "fixed" })}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Valor do Desconto *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.discountType === "percentage" ? "0-100" : "0.00"}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Limite de Uso</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    placeholder="0 = ilimitado"
                    className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
                  />
                </div>

                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="accent-[#1a1a1a]"
                  />
                  <label htmlFor="active" className="text-sm text-gray-600">
                    Cupom ativo
                  </label>
                </div>
              </div>

              {/* Product Selection */}
              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">
                  Produtos Aplicáveis (deixe vazio para todos)
                </p>
                <div className="max-h-40 overflow-y-auto border border-gray-200 p-3 space-y-2">
                  {PRODUCTS.map((product) => (
                    <label key={product.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="accent-[#1a1a1a]"
                      />
                      <span className="text-gray-700">{product.name}</span>
                      <span className="text-gray-400 text-xs">({product.sku})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 hover:border-gray-400 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-[#1a1a1a] text-white py-2 hover:bg-[#333333] transition-colors text-sm"
              >
                {editingCoupon ? "Salvar Alterações" : "Criar Cupom"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
