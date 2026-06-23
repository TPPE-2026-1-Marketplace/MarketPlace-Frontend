import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, CreditCard, QrCode, User, Calendar, DollarSign } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import { api } from "../../lib/api";
import { fetchManagementOrders, type ApiOrder } from "../../lib/management";

export interface ApiEmployee {
  cpf: string;
  ativo: boolean;
  role_perfil: string;
  codigo_funcionario: string | null;
  person: {
    cpf: string;
    nome: string;
  };
}

export function POSSales() {
  const [search, setSearch] = useState("");
  const [filterSeller, setFilterSeller] = useState("all");
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [posSales, setPosSales] = useState<ApiOrder[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const resEmp = await api.get<{ data: ApiEmployee[] }>("/employees?limit=100");
        setEmployees(resEmp.data);
        
        const resOrders = await fetchManagementOrders();
        // Filtra apenas vendas de loja física
        const inStore = resOrders.data.filter(o => o.tipoRetirada === "loja");
        setPosSales(inStore);
      } catch (err) {
        console.error("Erro ao carregar dados", err);
      }
    }
    loadData();
  }, []);

  const getSellerName = (sellerId: string) => {
    const emp = employees.find((e) => e.cpf === sellerId || e.codigo_funcionario === sellerId);
    return emp?.person?.nome || sellerId;
  };

  const filtered = posSales.filter((sale) => {
    const sellerId = sale.idFuncionario || "";
    const sellerName = getSellerName(sellerId) || "";
    const saleIdStr = String(sale.idPedido || "");
    const customerNameStr = sale.clienteNomeAvulso || sale.user?.nome || sale.clienteCpfAvulso || sale.idUsuario || "";
    
    const matchSearch =
      saleIdStr.toLowerCase().includes(search.toLowerCase()) ||
      sellerName.toLowerCase().includes(search.toLowerCase()) ||
      customerNameStr.toLowerCase().includes(search.toLowerCase());
      
    // Verifica se filterSeller bate com CPF ou com codigo_funcionario do vendedor
    const matchSeller = filterSeller === "all" || sellerId === filterSeller || 
      (employees.find(e => e.cpf === filterSeller)?.codigo_funcionario === sellerId);
      
    return matchSearch && matchSeller;
  });

  const totalSales = filtered.reduce((sum, sale) => sum + Number(sale.valorTotal), 0);
  const activeSellers = employees.filter(
    (e) => e.role_perfil === "vendedor"
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Vendas Presenciais (PDV)</h2>
          <p className="text-gray-500 text-sm">{posSales.length} vendas registradas</p>
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
              <p className="text-gray-900 text-lg">{posSales.length}</p>
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
                R$ {posSales.reduce((s, sale) => s + Number(sale.valorTotal), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
                {posSales.length > 0
                  ? (posSales.reduce((s, sale) => s + Number(sale.valorTotal), 0) / posSales.length).toLocaleString("pt-BR", {
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
            {activeSellers.map((emp) => (
              <option key={emp.cpf} value={emp.cpf}>
                {emp.person?.nome} {emp.codigo_funcionario ? `(${emp.codigo_funcionario})` : ""}
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
                  <tr key={sale.idPedido} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-gray-900 font-mono text-xs">{sale.idPedido}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">{new Date(sale.dataPedido).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-700 text-xs">{getSellerName(sale.idFuncionario || "")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 text-xs">
                        {sale.clienteNomeAvulso || sale.user?.nome || sale.clienteCpfAvulso || sale.idUsuario || <span className="text-gray-400 italic">Não informado</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5">
                        {sale.items.reduce((sum, item) => sum + item.quantidade, 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs text-gray-600">Cartão</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-900">
                        R$ {Number(sale.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
              Mostrando {filtered.length} de {posSales.length} vendas
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
