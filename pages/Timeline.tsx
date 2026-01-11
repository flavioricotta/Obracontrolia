import React, { useState, useEffect } from 'react';
import { api } from '../src/services/api';
import { Card } from '../components/Card';
import { FilterChip } from '../components/FilterChip';
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImageIcon } from 'lucide-react';
import { Project, Category, Expense } from '../types';

const Timeline: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, c, e] = await Promise.all([
          api.projects.list(),
          api.categories.list(),
          api.expenses.list()
        ]);
        setProjects(p);
        setCategories(c);
        setAllExpenses(e);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, []);

  const [selectedProjectId, setSelectedProjectId] = useState<number | 'all'>('all');

  const getCategoryName = (id: number) => categories?.find(c => c.id === id)?.name || 'Outros';
  const getProjectName = (id: number) => projects?.find(p => p.id === id)?.name || 'Projeto';

  const filteredExpenses = allExpenses?.filter(e =>
    selectedProjectId === 'all' ? true : e.projectId === selectedProjectId
  );

  // Group by Week
  const groupedExpenses: Record<string, typeof filteredExpenses> = {};

  filteredExpenses?.forEach(exp => {
    const date = parseISO(exp.date);
    const start = startOfWeek(date, { locale: ptBR });
    const end = endOfWeek(date, { locale: ptBR });
    const weekLabel = `${format(start, 'dd/MM')} a ${format(end, 'dd/MM')}`;

    if (!groupedExpenses[weekLabel]) {
      groupedExpenses[weekLabel] = [];
    }
    groupedExpenses[weekLabel]?.push(exp);
  });

  return (
    <div className="p-4 mb-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-4">Linha do Tempo</h1>

        {/* Project Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <FilterChip
            label="Todos"
            isActive={selectedProjectId === 'all'}
            onClick={() => setSelectedProjectId('all')}
          />
          {projects?.map(p => (
            <FilterChip
              key={p.id}
              label={p.name}
              isActive={selectedProjectId === p.id}
              onClick={() => setSelectedProjectId(p.id!)}
            />
          ))}
        </div>
      </header>

      <div className="space-y-8 relative">
        {/* Vertical Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 z-0"></div>

        {Object.entries(groupedExpenses).map(([week, expenses]) => (
          <div key={week} className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-primary flex items-center justify-center text-xs font-bold text-primary mr-3">
                S
              </div>
              <h3 className="font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded">Semana: {week}</h3>
            </div>

            <div className="pl-11 space-y-3">
              {expenses?.map(expense => (
                <Card key={expense.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 mb-1">
                        {getProjectName(expense.projectId)}
                      </span>
                      <h4 className="font-medium text-slate-800">{getCategoryName(expense.categoryId)}</h4>
                      <p className="text-xs text-slate-500">{expense.description}</p>
                      <p className="text-xs text-slate-400 mt-1">{format(parseISO(expense.date), "dd 'de' MMM", { locale: ptBR })}</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-slate-800">
                        R$ {expense.amountPaid.toFixed(2)}
                      </span>
                      <span className={`text-[10px] uppercase font-bold ${expense.status === 'Pago' ? 'text-success' : 'text-warning'
                        }`}>
                        {expense.status}
                      </span>
                    </div>
                  </div>
                  {expense.receiptImages && expense.receiptImages.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {/* Display first image */}
                      <div className="h-16 w-16 rounded overflow-hidden border border-slate-200">
                        <img src={expense.receiptImages[0]} className="w-full h-full object-cover" alt="Nota" />
                      </div>
                      {/* Indicator if more images exist */}
                      {expense.receiptImages.length > 1 && (
                        <div className="h-16 w-16 rounded bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-500">
                          <ImageIcon size={16} />
                          <span className="text-xs font-bold">+{expense.receiptImages.length - 1}</span>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;