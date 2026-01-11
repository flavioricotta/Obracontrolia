import React, { useEffect, useState } from 'react';
import { api } from '../src/services/api';
import { Project, Expense } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Building2, ChevronRight, TrendingUp, Calculator, Search, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpentAll, setTotalSpentAll] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, expensesData] = await Promise.all([
        api.projects.list(),
        api.expenses.list()
      ]);
      setProjects(projectsData);
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expenses) {
      setTotalSpentAll(expenses.reduce((acc, curr) => acc + curr.amountPaid, 0));
    }
  }, [expenses]);

  const getProjectSpent = (projectId: number) => {
    if (!expenses) return 0;
    return expenses
      .filter(e => e.projectId === projectId)
      .reduce((acc, curr) => acc + curr.amountPaid, 0);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">Carregando projetos...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-primary">Meus Projetos</h1>
        <p className="text-sm text-slate-500">Controle total das suas obras</p>
      </header>

      {/* Global Summary Card */}
      <div className="bg-gradient-to-r from-primary to-slate-800 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center space-x-2 mb-2">
          <TrendingUp size={20} className="text-success" />
          <span className="text-slate-300 text-sm font-medium">Gasto Total Acumulado</span>
        </div>
        <h2 className="text-3xl font-bold">{formatCurrency(totalSpentAll)}</h2>
        <p className="text-xs text-slate-400 mt-1">Soma de todas as obras ativas</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div
          onClick={() => navigate('/calculator')}
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform hover:shadow-md"
        >
          <div className="bg-indigo-50 p-3 rounded-full mb-2 text-indigo-600">
            <Calculator size={24} />
          </div>
          <span className="text-xs font-bold text-slate-700">Calculadora IA</span>
          <span className="text-[10px] text-slate-400 mt-1">Estimar Materiais</span>
        </div>
        <div
          onClick={() => navigate('/quotes')}
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform hover:shadow-md"
        >
          <div className="bg-orange-50 p-3 rounded-full mb-2 text-orange-600">
            <Search size={24} />
          </div>
          <span className="text-xs font-bold text-slate-700">Cotações</span>
          <span className="text-[10px] text-slate-400 mt-1">Comparar Preços</span>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-semibold text-slate-700">Obras em Andamento</h3>

        {!projects || projects.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg border border-dashed border-slate-300">
            <Building2 size={48} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500">Nenhum projeto cadastrado.</p>
            <p className="text-xs text-slate-400 mt-1">Toque no botão + abaixo para começar</p>
          </div>
        ) : (
          projects.map(project => {
            const spent = getProjectSpent(project.id!);
            const progress = Math.min((spent / project.budget) * 100, 100);

            return (
              <Card key={project.id} onClick={() => navigate(`/project/${project.id}`)} className="cursor-pointer active:scale-95 transition-transform hover:shadow-md border-l-4 border-l-accent">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-lg text-slate-800">{project.name}</h4>
                    <p className="text-xs text-slate-500">{project.address}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-400" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Orçamento:</span>
                    <span className="font-medium">{formatCurrency(project.budget)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Gasto:</span>
                    <span className={`font-medium ${progress > 90 ? 'text-danger' : 'text-slate-700'}`}>
                      {formatCurrency(spent)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2.5 mt-2">
                    <div
                      className={`h-2.5 rounded-full ${progress > 100 ? 'bg-danger' : 'bg-success'}`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {progress.toFixed(1)}% utilizado
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProjectList;