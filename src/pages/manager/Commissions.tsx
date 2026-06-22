import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Target,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  Edit2,
  Save,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

interface CommissionReport {
  total_vendas: number;
  comissao: number;
  meta_batida: boolean;
  pedidos: any[];
  meta_vendas: number;
  valor_bonus: number;
}

interface EmployeeData {
  cpf: string;
  name: string;
  email: string;
  taxa_comissao: number;
  meta_vendas: number | null;
  role: string;
  report?: CommissionReport;
}

export function Commissions() {
  const { isSuperAdmin } = useAuth();
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVals, setEditVals] = useState<{
    commissionRate: string;
    salesTarget: string;
    bonusEnabled: boolean;
    bonusAmount: string;
  }>({ commissionRate: "", salesTarget: "", bonusEnabled: true, bonusAmount: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ id: string; text: string } | null>(null);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/employees?limit=100');
      const allEmps = res.data.filter((u: any) => 
        u.ativo && (u.role_perfil === 'vendedor' || u.role_perfil === 'caixa')
      );

      const now = new Date();
      const mes = now.getMonth() + 1;
      const ano = now.getFullYear();

      const empsWithReports = await Promise.all(allEmps.map(async (emp: any) => {
        try {
          const reportRes = await api.get<CommissionReport>(`/employees/${emp.cpf}/commissions?mes=${mes}&ano=${ano}`);
          return {
            cpf: emp.cpf,
            name: emp.person.nome,
            email: emp.person.email,
            taxa_comissao: emp.taxa_comissao,
            meta_vendas: emp.meta_vendas,
            role: emp.role_perfil,
            report: reportRes,
          };
        } catch (err) {
          console.error("Failed to fetch report for", emp.cpf, err);
          return {
            cpf: emp.cpf,
            name: emp.person.nome,
            email: emp.person.email,
            taxa_comissao: emp.taxa_comissao,
            meta_vendas: emp.meta_vendas,
            role: emp.role_perfil,
          };
        }
      }));

      setEmployees(empsWithReports);
    } catch (err) {
      console.error("Failed to fetch commissions data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const startEdit = (emp: EmployeeData) => {
    setEditingId(emp.cpf);
    const taxaPct = emp.taxa_comissao * 100;
    const bonusVal = emp.report?.valor_bonus || 0;
    
    setEditVals({
      commissionRate: taxaPct.toString(),
      salesTarget: (emp.report?.meta_vendas || emp.meta_vendas || 0).toString(),
      bonusEnabled: bonusVal > 0,
      bonusAmount: bonusVal.toString(),
    });
  };

  const saveEdit = async (emp: EmployeeData) => {
    try {
      // Update employee base settings
      await api.patch(`/employees/${emp.cpf}`, {
        taxa_comissao: Number(editVals.commissionRate) / 100,
        meta_vendas: Number(editVals.salesTarget),
      });

      // Update or create SalesGoal
      const mes = new Date().getMonth() + 1;
      const ano = new Date().getFullYear();
      
      const salesGoalsRes = await api.get<any[]>(`/sales-goals?mes=${mes}&ano=${ano}`);
      const existingGoal = salesGoalsRes.find((g: any) => g.cpfFuncionario === emp.cpf);
      
      const goalPayload = {
        cpfFuncionario: emp.cpf,
        mes,
        ano,
        valorMeta: Number(editVals.salesTarget),
        valorBonus: editVals.bonusEnabled ? Number(editVals.bonusAmount) : 0,
      };

      if (existingGoal) {
        await api.patch(`/sales-goals/${existingGoal.idGoal}`, goalPayload);
      } else {
        await api.post(`/sales-goals`, goalPayload);
      }

      setSaveMsg({ id: emp.cpf, text: "Salvo!" });
      setTimeout(() => setSaveMsg(null), 2000);
      setEditingId(null);
      fetchCommissions(); // Refresh data
    } catch (err) {
      console.error("Failed to save", err);
      alert("Erro ao salvar as configurações de comissão");
    }
  };

  const cancelEdit = () => setEditingId(null);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando comissões...</div>;
  }

  // Aggregate totals
  const totalSalesAll = employees.reduce((sum, e) => sum + (e.report?.total_vendas || 0), 0);
  const totalCommissionAll = employees.reduce((sum, e) => sum + (e.report?.comissao || 0), 0);
  const totalBonusAll = employees
    .filter((e) => e.report?.meta_batida)
    .reduce((sum, e) => sum + (e.report?.valor_bonus || 0), 0);
  const employeesHitTarget = employees.filter((e) => e.report?.meta_batida).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-gray-900">Comissões e Metas</h2>
        <p className="text-gray-500 text-sm">Gerencie as comissões e bônus da equipe de vendas</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total em Vendas",
            value: `R$ ${totalSalesAll.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            icon: <DollarSign className="w-4 h-4" />,
            sub: "Vendas da equipe",
            color: "text-gray-700 bg-gray-100",
          },
          {
            label: "Total Comissões",
            value: `R$ ${totalCommissionAll.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            icon: <TrendingUp className="w-4 h-4" />,
            sub: "A pagar neste período",
            color: "text-gray-700 bg-gray-100",
          },
          {
            label: "Metas Atingidas",
            value: `${employeesHitTarget} / ${employees.length}`,
            icon: <Target className="w-4 h-4" />,
            sub: "Funcionários com meta",
            color: "text-green-700 bg-green-50",
          },
          {
            label: "Total Bônus",
            value: `R$ ${totalBonusAll.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            icon: <Award className="w-4 h-4" />,
            sub: "Bônus a pagar",
            color: "text-amber-700 bg-amber-50",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white border border-gray-100 p-5">
            <div className={`w-9 h-9 ${kpi.color} flex items-center justify-center mb-3`}>
              {kpi.icon}
            </div>
            <p className="text-gray-400 text-xs mb-1">{kpi.label}</p>
            <p className="text-gray-900 text-lg">{kpi.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {!isSuperAdmin && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-3 text-sm text-gray-500">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          Apenas o Super Admin pode alterar taxas de comissão e metas.
        </div>
      )}

      {/* Employee commission cards */}
      <div className="space-y-3">
        {employees.map((emp) => {
          const sales = emp.report?.pedidos || [];
          const totalSales = emp.report?.total_vendas || 0;
          const totalComm = emp.report?.comissao || 0;
          const target = emp.report?.meta_vendas || emp.meta_vendas || 0;
          const progress = target > 0 ? Math.min(100, (totalSales / target) * 100) : 0;
          const achieved = emp.report?.meta_batida || false;
          const bonusVal = emp.report?.valor_bonus || 0;
          const bonusActive = achieved && bonusVal > 0;
          const isEditing = editingId === emp.cpf;
          const isExpanded = expandedId === emp.cpf;

          return (
            <div key={emp.cpf} className="bg-white border border-gray-100">
              {/* Main row */}
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gray-200 flex items-center justify-center shrink-0 text-gray-600">
                    {emp.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-gray-900 text-sm">{emp.name}</p>
                        <p className="text-gray-400 text-xs">{emp.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {bonusActive && (
                          <span className="flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 border border-amber-200">
                            <Award className="w-3 h-3" /> Bônus ganho
                          </span>
                        )}
                        {achieved && !bonusActive && (
                          <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-0.5">
                            <Check className="w-3 h-3" /> Meta atingida
                          </span>
                        )}
                        {!achieved && (
                          <span className="text-xs text-gray-400">
                            {Math.round(progress)}% da meta
                          </span>
                        )}
                        {isSuperAdmin && (
                          <>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEdit(emp)}
                                  className="p-1.5 bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => startEdit(emp)}
                                className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : emp.cpf)}
                          className="p-1.5 bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                      {/* Commission rate */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Taxa de Comissão</p>
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type="number"
                              value={editVals.commissionRate}
                              onChange={(e) => setEditVals({ ...editVals, commissionRate: e.target.value })}
                              className="w-full border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:border-[#1a1a1a] pr-6"
                              min="0" max="100" step="0.5"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                          </div>
                        ) : (
                          <p className="text-gray-900 text-sm">{emp.taxa_comissao * 100}%</p>
                        )}
                      </div>

                      {/* Sales target */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Meta de Vendas</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editVals.salesTarget}
                            onChange={(e) => setEditVals({ ...editVals, salesTarget: e.target.value })}
                            className="w-full border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:border-[#1a1a1a]"
                            min="0" step="1000"
                          />
                        ) : (
                          <p className="text-gray-900 text-sm">R$ {target.toLocaleString("pt-BR")}</p>
                        )}
                      </div>

                      {/* Bonus */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Bônus por Meta</p>
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="number"
                              value={editVals.bonusAmount}
                              onChange={(e) => setEditVals({ ...editVals, bonusAmount: e.target.value })}
                              className="w-full border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:border-[#1a1a1a]"
                              min="0" step="50"
                            />
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editVals.bonusEnabled}
                                onChange={(e) => setEditVals({ ...editVals, bonusEnabled: e.target.checked })}
                                className="accent-[#1a1a1a] w-3 h-3"
                              />
                              <span className="text-xs text-gray-500">Ativo</span>
                            </label>
                          </div>
                        ) : (
                          <div>
                            <p className={`text-sm ${bonusVal > 0 ? "text-gray-900" : "text-gray-400"}`}>
                              R$ {bonusVal.toLocaleString("pt-BR")}
                            </p>
                            <span className={`text-xs ${bonusVal > 0 ? "text-green-600" : "text-gray-400"}`}>
                              {bonusVal > 0 ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Total earned */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Comissão Ganha</p>
                        <p className="text-gray-900 text-sm">
                          R$ {totalComm.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        {bonusActive && (
                          <p className="text-amber-600 text-xs">
                            + R$ {bonusVal.toLocaleString("pt-BR")} bônus
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Vendas: R$ {totalSales.toLocaleString("pt-BR")}</span>
                        <span>Meta: R$ {target.toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="bg-gray-100 h-1.5 w-full">
                        <div
                          className={`h-1.5 transition-all duration-500 ${achieved ? "bg-green-500" : "bg-[#1a1a1a]"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {saveMsg?.id === emp.cpf && (
                      <p className="text-green-600 text-xs mt-2">{saveMsg.text}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded sales history */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-5">
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">
                    Histórico de Vendas ({sales.length} registros)
                  </p>
                  {sales.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhuma venda registrada.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-100">
                            <th className="text-left py-2 pr-4">Data</th>
                            <th className="text-left py-2 pr-4">Pedido</th>
                            <th className="text-left py-2 pr-4 hidden sm:table-cell">Cliente</th>
                            <th className="text-left py-2 pr-4 hidden md:table-cell">Produto</th>
                            <th className="text-right py-2 pr-4">Valor</th>
                            <th className="text-right py-2">Comissão</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {sales.map((sale: any) => (
                            <tr key={sale.idPedido} className="hover:bg-gray-50">
                              <td className="py-2 pr-4 text-gray-500">
                                {new Date(sale.dataPedido).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="py-2 pr-4 text-gray-600 font-mono">{sale.idPedido}</td>
                              <td className="py-2 pr-4 text-gray-600 hidden sm:table-cell">{sale.cliente ? sale.cliente.person?.nome : 'Venda Avulsa'}</td>
                              <td className="py-2 pr-4 text-gray-600 hidden md:table-cell max-w-xs truncate">{sale.itens ? sale.itens.length + ' item(ns)' : '-'}</td>
                              <td className="py-2 pr-4 text-right text-gray-700">
                                R$ {Number(sale.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 text-right text-green-700">
                                R$ {(Number(sale.valorTotal) * emp.taxa_comissao).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-gray-200 bg-gray-50">
                            <td colSpan={4} className="py-2 pr-4 text-gray-600 text-xs">Total</td>
                            <td className="py-2 pr-4 text-right text-gray-800">
                              R$ {totalSales.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 text-right text-green-700">
                              R$ {(totalComm - (bonusActive ? bonusVal : 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {employees.length === 0 && (
          <div className="bg-white border border-gray-100 p-10 text-center text-gray-400 text-sm">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            Nenhum funcionário cadastrado. Adicione funcionários na aba Usuários.
          </div>
        )}
      </div>
    </div>
  );
}
