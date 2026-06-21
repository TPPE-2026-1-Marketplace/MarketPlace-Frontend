import React, { useState } from "react";
import { Search, ShoppingBag, CreditCard, QrCode, User, Calendar, DollarSign } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import { useAuth } from "../../context/AuthContext";

export function POSSales() {
  const { sales } = usePOS();
  const { users } = useAuth();
  const [search, setSearch] = useState("");
  const [filterSeller, setFilterSeller] = useState("all");

  const filtered = sales.filter((sale) => {
    const matchSearch =
      sale.id.toLowerCase().includes(search.toLowerCase()) ||
      sale.sellerName.toLowerCase().includes(search.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchSeller = filterSeller === "all" || sale.sellerId === filterSeller;
    return matchSearch && matchSeller;
  });

  const totalSales = filtered.reduce((sum, sale) => sum + sale.total, 0);
  const employees = users.filter((u) => u.role === "employee" || u.role === "manager" || u.role === "superadmin");

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Vendas Presenciais (PDV)</h2>
          <p className="text-gray-500 text-sm">{sales.length} vendas registradas</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400">Total em Vendas</p>
            <p className="text-gray-900 text-xl">
              R$ {totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total de Vendas</p>
              <p className="text-gray-900 text-lg">{sales.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Receita Total</p>
              <p className="text-gray-900 text-lg">
                R$ {sales.reduce((s, sale) => s + sale.total, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Ticket Médio</p>
              <p className="text-gray-900 text-lg">
                R${" "}
                {sales.length > 0
                  ? (sales.reduce((s, sale) => s + sale.total, 0) / sales.length).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })
                  : "0,00"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ID, vendedor ou cliente..."
              className="w-full border border-gray-200 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
            />
          </div>
          <select
            value={filterSeller}
            onChange={(e) => setFilterSeller(e.target.value)}
            className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#1a1a1a]"
          >
            <option value="all">Todos os vendedores</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs">
                <th className="text-left px-4 py-3">ID da Venda</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Vendedor</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-center px-4 py-3">Itens</th>
                <th className="text-center px-4 py-3">Pagamento</th>
                <th className="text-right px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-gray-900 font-mono text-xs">{sale.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">{sale.date}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-700 text-xs">{sale.sellerName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 text-xs">
                        {sale.customerName || <span className="text-gray-400 italic">Não informado</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5">
                        {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {sale.paymentMethod === "pix" ? (
                          <>
                            <QrCode className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs text-gray-600">PIX</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-xs text-gray-600">Cartão</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-900">
                        R$ {sale.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="bg-white border border-gray-100 p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Mostrando {filtered.length} de {sales.length} vendas
            </p>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total Filtrado</p>
              <p className="text-gray-900">
                R$ {totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
