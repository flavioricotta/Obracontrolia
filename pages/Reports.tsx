import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Building2, PieChart as PieIcon, Calculator as CalcIcon } from 'lucide-react';
import Calculator from './Calculator';
import { TabGroup } from '../components/TabGroup';
import { Card } from '../components/Card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

type TabType = 'analytics' | 'calculator';

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>('all');

  const projects = useLiveQuery(() => db.projects.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const expenses = useLiveQuery(() => db.expenses.toArray());

  if (!expenses || !categories || !projects) return <div>Carregando...</div>;

  const filteredExpenses = expenses.filter(e =>
    selectedProjectId === 'all' ? true : e.projectId === selectedProjectId
  );

  // Stats
  const totalSpent = filteredExpenses.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalBudget = projects
    .filter(p => selectedProjectId === 'all' || p.id === selectedProjectId)
    .reduce((acc, curr) => acc + curr.budget, 0);

  // Pie Chart Data (By Category)
  const categoryData = categories.map(cat => {
    const value = filteredExpenses
      .filter(e => e.categoryId === cat.id)
      .reduce((acc, curr) => acc + curr.amountPaid, 0);
    return { name: cat.name, value };
  }).filter(d => d.value > 0);

  // Bar Chart Data (By Supplier/Store - Top 5)
  const supplierMap: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    const name = e.supplier || 'Outros';
    supplierMap[name] = (supplierMap[name] || 0) + e.amountPaid;
  });
  const supplierData = Object.entries(supplierMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="p-4 mb-20">
      <h1 className="text-2xl font-bold text-primary mb-4">Orçamento</h1>

      {/* Tabs */}
      <TabGroup
        tabs={[
          { id: 'analytics', label: 'Análises', icon: PieIcon },
          { id: 'calculator', label: 'Calculadora IA', icon: CalcIcon },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as TabType)}
      />
      <div className="mb-6" />

      {activeTab === 'calculator' ? (
        <div className="animate-fade-in">
          <Calculator isEmbedded={true} />
        </div>
      ) : (
        <div className="animate-fade-in space-y-6">
          {/* Project Selector */}
          <select
            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">Todas as Obras</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-xs text-slate-500 mb-1">Total Gasto</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(totalSpent)}</p>
            </Card>
            <Card>
              <p className="text-xs text-slate-500 mb-1">Orçamento Total</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(totalBudget)}</p>
            </Card>
          </div>

          <div>
            <div className="mb-2 bg-slate-100 rounded-full h-4 w-full overflow-hidden">
              <div
                className={`h-full ${totalSpent > totalBudget ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min((totalSpent / (totalBudget || 1)) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-right text-slate-500">
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% do orçamento utilizado
            </p>
          </div>

          {/* Charts */}
          {totalSpent > 0 ? (
            <>
              <Card>
                <h3 className="font-bold text-slate-700 mb-4">Gastos por Categoria</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {categoryData.map((d, i) => (
                    <div key={d.name} className="flex items-center text-xs">
                      <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="truncate">{d.name}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <h3 className="font-bold text-slate-700 mb-4">Maiores Fornecedores</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={supplierData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          ) : (
            <div className="text-center py-10">
              <Building2 className="mx-auto text-slate-300 mb-2" size={40} />
              <p className="text-slate-500">Sem dados suficientes para gráficos.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;