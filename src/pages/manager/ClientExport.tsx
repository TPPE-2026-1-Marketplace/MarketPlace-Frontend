import React, { useState } from "react";
import {
  Download,
  Filter,
  Calendar,
  DollarSign,
  MapPin,
  User,
  CheckCircle,
  TrendingUp,
  FileText,
} from "lucide-react";
import { MOCK_ORDERS } from "../../data/products";

interface ExportFilter {
  startDate: string;
  endDate: string;
  productId: string;
  couponCode: string;
  minSpent: string;
  city: string;
  state: string;
  recurrentOnly: boolean;
}

interface ExportHistory {
  id: string;
  date: string;
  format: string;
  filters: string;
  count: number;
}

export function ClientExport() {
  const [filters, setFilters] = useState<ExportFilter>({
    startDate: "",
    endDate: "",
    productId: "",
    couponCode: "",
    minSpent: "",
    city: "",
    state: "",
    recurrentOnly: false,
  });

  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([
    {
      id: "exp-001",
      date: new Date().toISOString().split("T")[0],
      format: "Facebook Ads",
      filters: "Clientes últimos 30 dias",
      count: 234,
    },
    {
      id: "exp-002",
      date: "2024-11-15",
      format: "Google Ads",
      filters: "Gasto mínimo R$ 500",
      count: 89,
    },
  ]);

  const [showSuccess, setShowSuccess] = useState(false);

  // Get unique customers from orders
  const uniqueCustomers = Array.from(
    new Map(
      MOCK_ORDERS.map((order) => [
        order.email,
        {
          name: order.customer,
          email: order.email,
          phone: order.phone,
          totalSpent: MOCK_ORDERS.filter((o) => o.email === order.email).reduce(
            (sum, o) => sum + o.total,
            0
          ),
          orderCount: MOCK_ORDERS.filter((o) => o.email === order.email).length,
          lastPurchase: order.date,
        },
      ])
    ).values()
  );

  const handleExport = (format: "facebook" | "google" | "csv") => {
    const formatLabels = {
      facebook: "Facebook Ads",
      google: "Google Ads",
      csv: "CSV Padrão",
    };

    const activeFilters = [];
    if (filters.startDate) activeFilters.push(`De ${filters.startDate}`);
    if (filters.endDate) activeFilters.push(`Até ${filters.endDate}`);
    if (filters.minSpent) activeFilters.push(`Min. R$ ${filters.minSpent}`);
    if (filters.city) activeFilters.push(`Cidade: ${filters.city}`);
    if (filters.state) activeFilters.push(`Estado: ${filters.state}`);
    if (filters.recurrentOnly) activeFilters.push("Apenas recorrentes");

    const newExport: ExportHistory = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      format: formatLabels[format],
      filters: activeFilters.length > 0 ? activeFilters.join(", ") : "Sem filtros",
      count: uniqueCustomers.length,
    };

    setExportHistory([newExport, ...exportHistory]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Simulate download
    const data = uniqueCustomers.map((c) => ({
      nome: c.name,
      email: c.email,
      telefone: c.phone,
      total_gasto: c.totalSpent,
      total_pedidos: c.orderCount,
      ultima_compra: c.lastPurchase,
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes_${format}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-gray-900">Exportar Base de Clientes</h2>
        <p className="text-gray-500 text-sm">
          Exporte clientes para campanhas de tráfego pago
        </p>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 p-4 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Exportação realizada com sucesso! O arquivo foi baixado.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Total de Clientes",
            value: uniqueCustomers.length,
            icon: <User className="w-4 h-4" />,
            color: "text-blue-700 bg-blue-50",
          },
          {
            label: "Clientes Recorrentes",
            value: uniqueCustomers.filter((c) => c.orderCount > 1).length,
            icon: <TrendingUp className="w-4 h-4" />,
            color: "text-green-700 bg-green-50",
          },
          {
            label: "Ticket Médio",
            value: `R$ ${(
              uniqueCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / uniqueCustomers.length
            ).toFixed(2)}`,
            icon: <DollarSign className="w-4 h-4" />,
            color: "text-purple-700 bg-purple-50",
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

      {/* Filters */}
      <div className="bg-white border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-gray-900">Filtros de Exportação</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Data Início</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full border border-gray-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Data Fim</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full border border-gray-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Gasto Mínimo</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                step="0.01"
                value={filters.minSpent}
                onChange={(e) => setFilters({ ...filters, minSpent: e.target.value })}
                placeholder="0.00"
                className="w-full border border-gray-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Cidade</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="Ex: Brasília"
                className="w-full border border-gray-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Estado</label>
            <input
              type="text"
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              placeholder="Ex: DF"
              maxLength={2}
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a] uppercase"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filters.recurrentOnly}
                onChange={(e) => setFilters({ ...filters, recurrentOnly: e.target.checked })}
                className="accent-[#1a1a1a]"
              />
              <span className="text-gray-700">Apenas recorrentes</span>
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() =>
              setFilters({
                startDate: "",
                endDate: "",
                productId: "",
                couponCode: "",
                minSpent: "",
                city: "",
                state: "",
                recurrentOnly: false,
              })
            }
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="bg-white border border-gray-100 p-5">
        <h3 className="text-gray-900 mb-4">Formato de Exportação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleExport("facebook")}
            className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 hover:border-[#1a1a1a] transition-all text-center group"
          >
            <div className="w-12 h-12 bg-blue-600 flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform">
              f
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">Facebook Ads</p>
              <p className="text-xs text-gray-500">
                Formato otimizado para audiências personalizadas
              </p>
            </div>
            <Download className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => handleExport("google")}
            className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 hover:border-[#1a1a1a] transition-all text-center group"
          >
            <div className="w-12 h-12 bg-red-600 flex items-center justify-center text-white text-xl font-bold group-hover:scale-110 transition-transform">
              G
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">Google Ads</p>
              <p className="text-xs text-gray-500">
                Formato para listas de clientes Google
              </p>
            </div>
            <Download className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => handleExport("csv")}
            className="flex flex-col items-center gap-3 p-5 border-2 border-gray-200 hover:border-[#1a1a1a] transition-all text-center group"
          >
            <div className="w-12 h-12 bg-gray-600 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-1">CSV Padrão</p>
              <p className="text-xs text-gray-500">
                Arquivo CSV genérico para importação
              </p>
            </div>
            <Download className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white border border-gray-100 p-5">
        <h3 className="text-gray-900 mb-4">Histórico de Exportações</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs">
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Formato</th>
                <th className="text-left px-4 py-3">Filtros Aplicados</th>
                <th className="text-center px-4 py-3">Clientes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {exportHistory.map((exp) => (
                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{exp.date}</td>
                  <td className="px-4 py-3">
                    <span className="bg-gray-100 text-gray-900 text-xs px-2 py-1">
                      {exp.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{exp.filters}</td>
                  <td className="px-4 py-3 text-center text-gray-900">{exp.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
