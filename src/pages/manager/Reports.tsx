import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Globe, Store } from "lucide-react";
import { PRODUCTS, MOCK_ORDERS } from "../../data/products";

const COLORS = ["#1a1a1a", "#555555", "#888888", "#bbbbbb", "#dddddd"];

const monthlyData = [
  { mes: "Out", online: 8500, loja: 4200, pedidos: 12 },
  { mes: "Nov", online: 12000, loja: 6800, pedidos: 18 },
  { mes: "Dez", online: 18500, loja: 9200, pedidos: 27 },
  { mes: "Jan", online: 11200, loja: 5600, pedidos: 16 },
  { mes: "Fev", online: 14800, loja: 7100, pedidos: 21 },
  { mes: "Mar", online: 16200, loja: 8400, pedidos: 24 },
];

const categoryData = [
  { name: "Debutante", value: 35 },
  { name: "Formatura", value: 28 },
  { name: "Casamento", value: 22 },
  { name: "Festa", value: 15 },
];

const topProducts = PRODUCTS.map((p) => ({
  name: p.name.replace("Vestido ", ""),
  vendas: Math.floor(Math.random() * 15 + 3),
  receita: Math.floor(p.price * (Math.random() * 10 + 3)),
})).sort((a, b) => b.vendas - a.vendas);

export function Reports() {
  const [period, setPeriod] = useState<"mes" | "trimestre" | "ano">("mes");

  const totalOnline = monthlyData.reduce((s, d) => s + d.online, 0);
  const totalLoja = monthlyData.reduce((s, d) => s + d.loja, 0);
  const total = totalOnline + totalLoja;
  const totalOrders = monthlyData.reduce((s, d) => s + d.pedidos, 0);
  const avgTicket = total / totalOrders;

  const kpis = [
    {
      label: "Receita Total",
      value: `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      sub: "+18% vs período anterior",
      trend: "up",
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-gray-700 bg-gray-100",
    },
    {
      label: "Pedidos",
      value: totalOrders,
      sub: "+12% vs período anterior",
      trend: "up",
      icon: <ShoppingBag className="w-5 h-5" />,
      color: "text-gray-700 bg-gray-100",
    },
    {
      label: "Ticket Médio",
      value: `R$ ${avgTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      sub: "+5% vs período anterior",
      trend: "up",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-gray-700 bg-gray-100",
    },
    {
      label: "Online vs Loja",
      value: `${Math.round((totalOnline / total) * 100)}% / ${Math.round((totalLoja / total) * 100)}%`,
      sub: "E-commerce em crescimento",
      trend: "up",
      icon: <Globe className="w-5 h-5" />,
      color: "text-gray-700 bg-gray-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-gray-900">Relatórios e Análises</h2>
          <p className="text-gray-500 text-sm">Visão geral do desempenho da DK Festas</p>
        </div>
        <div className="flex gap-2">
          {(["mes", "trimestre", "ano"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs transition-colors border ${
                period === p ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {p === "mes" ? "Mês" : p === "trimestre" ? "Trimestre" : "Ano"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white p-5 border border-gray-100">
            <div className={`w-9 h-9 ${kpi.color} flex items-center justify-center mb-3`}>
              {kpi.icon}
            </div>
            <p className="text-gray-500 text-xs mb-1">{kpi.label}</p>
            <p className="text-gray-900 text-lg mb-1">{kpi.value}</p>
            <div className={`flex items-center gap-1 text-xs ${kpi.trend === "up" ? "text-green-600" : "text-red-500"}`}>
              {kpi.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white p-5 border border-gray-100">
          <h3 className="text-gray-900 mb-1">Receita por Canal</h3>
          <p className="text-gray-400 text-xs mb-4">Online vs Loja Física (últimos 6 meses)</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a1a1a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1a1a1a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLoja" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#888888" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#888888" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, ""]}
                contentStyle={{ borderRadius: 12, border: "1px solid #f0f0f0", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="online" name="Online" stroke="#1a1a1a" fill="url(#colorOnline)" strokeWidth={2} />
              <Area type="monotone" dataKey="loja" name="Loja Física" stroke="#888888" fill="url(#colorLoja)" strokeWidth={2} />
              <Legend iconType="circle" iconSize={8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category distribution */}
        <div className="bg-white p-5 border border-gray-100">
          <h3 className="text-gray-900 mb-1">Por Categoria</h3>
          <p className="text-gray-400 text-xs mb-4">Distribuição de vendas</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, ""]}
                contentStyle={{ borderRadius: 12, border: "1px solid #f0f0f0", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-gray-600">{cat.name}</span>
                </div>
                <span className="text-gray-700">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders chart */}
        <div className="bg-white p-5 border border-gray-100">
          <h3 className="text-gray-900 mb-1">Pedidos Mensais</h3>
          <p className="text-gray-400 text-xs mb-4">Número de pedidos por mês</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #f0f0f0", fontSize: 12 }}
              />
              <Bar dataKey="pedidos" name="Pedidos" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div className="bg-white p-5 border border-gray-100">
          <h3 className="text-gray-900 mb-4">Produtos Mais Vendidos</h3>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((product, i) => (
              <div key={product.name} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  i === 0 ? "bg-[#1a1a1a] text-white" :
                  i === 1 ? "bg-gray-500 text-white" :
                  i === 2 ? "bg-gray-400 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-[#1a1a1a] h-1.5 rounded-full"
                        style={{ width: `${(product.vendas / topProducts[0].vendas) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{product.vendas} un</span>
                  </div>
                </div>
                <span className="text-xs text-green-600 shrink-0">
                  R$ {product.receita.toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel comparison */}
      <div className="bg-white p-5 border border-gray-100">
        <h3 className="text-gray-900 mb-4">Comparativo: E-commerce vs Loja Física</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              label: "E-commerce",
              icon: <Globe className="w-5 h-5" />,
              revenue: totalOnline,
              orders: monthlyData.reduce((s, d) => s + Math.round(d.pedidos * 0.65), 0),
              avg: totalOnline / monthlyData.reduce((s, d) => s + Math.round(d.pedidos * 0.65), 0),
              pct: Math.round((totalOnline / total) * 100),
              color: "#1a1a1a",
              bg: "bg-gray-100",
            },
            {
              label: "Loja Física",
              icon: <Store className="w-5 h-5" />,
              revenue: totalLoja,
              orders: monthlyData.reduce((s, d) => s + Math.round(d.pedidos * 0.35), 0),
              avg: totalLoja / monthlyData.reduce((s, d) => s + Math.round(d.pedidos * 0.35), 0),
              pct: Math.round((totalLoja / total) * 100),
              color: "#555555",
              bg: "bg-gray-50",
            },
          ].map((channel) => (
            <div key={channel.label} className={`${channel.bg} border border-gray-100 p-5`}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center" style={{ color: channel.color }}>
                  {channel.icon}
                </div>
                <div>
                  <p className="text-gray-900 text-sm">{channel.label}</p>
                  <p className="text-gray-500 text-xs">{channel.pct}% do total</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Receita</span>
                  <span className="text-gray-800">
                    R$ {channel.revenue.toLocaleString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pedidos</span>
                  <span className="text-gray-800">{channel.orders}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Ticket Médio</span>
                  <span className="text-gray-800">
                    R$ {channel.avg.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="bg-white/60 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${channel.pct}%`, backgroundColor: channel.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}