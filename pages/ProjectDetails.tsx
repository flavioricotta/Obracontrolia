import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { TabGroup } from '../components/TabGroup';
import { Project, PaymentStatus, Task, ExpenseType, Expense } from '../types';
import { ArrowLeft, Save, Trash2, Zap, Plus, Pencil, Download, FileSpreadsheet, DollarSign, CheckSquare, ListTodo, XCircle, Calculator as CalcIcon, HardHat, Package, User } from 'lucide-react';
import { generateProjectInsights } from '../services/geminiService';
import { format, parseISO } from 'date-fns';

interface Props {
  isNew?: boolean;
}

type Tab = 'expenses' | 'tasks';

const ProjectDetails: React.FC<Props> = ({ isNew = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(isNew);
  const [activeTab, setActiveTab] = useState<Tab>('expenses');
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Task State
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [formData, setFormData] = useState<Project>({
    name: '',
    address: '',
    startDate: new Date().toISOString().split('T')[0],
    budget: 0,
    sqMeters: 0,
    type: 'Residencial',
    notes: '',
    createdAt: new Date().toISOString()
  });

  const existingProject = useLiveQuery(() => id ? db.projects.get(Number(id)) : undefined, [id]);

  // Queries
  const projectExpenses = useLiveQuery(() =>
    id ? db.expenses.where('projectId').equals(Number(id)).reverse().sortBy('date') : undefined
    , [id]);

  const projectTasks = useLiveQuery(() =>
    id ? db.tasks.where('projectId').equals(Number(id)).reverse().sortBy('id') : undefined
    , [id]);

  const categories = useLiveQuery(() => db.categories.toArray());

  // Update form data when project loads
  if (existingProject && formData.name === '' && !isNew) {
    setFormData(existingProject);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const rawValue = value.replace(/\D/g, "");
    const numberValue = Number(rawValue) / 100;
    setFormData(prev => ({ ...prev, [name]: numberValue }));
  };

  const getFormattedValue = (value: number) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (isNew) {
        await db.projects.add(formData);
        navigate('/');
      } else {
        await db.projects.update(Number(id), formData);
        setIsEditing(false);
      }
    } catch (error) {
      alert('Erro ao salvar projeto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja apagar este projeto e TODOS os seus gastos? Essa ação não pode ser desfeita.')) {
      try {
        await db.transaction('rw', db.projects, db.expenses, db.tasks, async () => {
          await db.expenses.where('projectId').equals(Number(id)).delete();
          await db.tasks.where('projectId').equals(Number(id)).delete();
          await db.projects.delete(Number(id));
        });
        navigate('/', { replace: true });
      } catch (e) {
        console.error("Erro ao deletar projeto", e);
        alert("Erro ao excluir projeto.");
      }
    }
  };

  const handleDeleteExpense = async (expenseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apagar este gasto?')) {
      try {
        await db.expenses.delete(expenseId);
      } catch (error) {
        console.error("Erro ao deletar gasto:", error);
      }
    }
  };

  // --- Task Handlers ---
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !id) return;
    try {
      await db.tasks.add({
        projectId: Number(id),
        title: newTaskTitle,
        isDone: false,
        createdAt: new Date().toISOString()
      });
      setNewTaskTitle('');
    } catch (error) {
      console.error("Erro ao criar tarefa", error);
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      await db.tasks.update(task.id!, { isDone: !task.isDone });
    } catch (error) {
      console.error("Erro ao atualizar tarefa", error);
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      await db.tasks.delete(taskId);
    } catch (error) {
      console.error("Erro ao deletar tarefa", error);
    }
  };

  const handleAiAnalysis = async () => {
    if (!existingProject || !projectExpenses || !categories) return;
    setAnalyzing(true);
    const result = await generateProjectInsights(existingProject, projectExpenses, categories);
    setAiInsight(result);
    setAnalyzing(false);
  };

  const handleDownloadImage = (base64Data: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (!projectExpenses || !categories) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data;Categoria;Descricao;Fornecedor;Valor Pago;Status;Forma Pagamento\n";

    projectExpenses.forEach(exp => {
      const catName = categories.find(c => c.id === exp.categoryId)?.name || 'Outros';
      const row = [
        format(parseISO(exp.date), 'dd/MM/yyyy'),
        catName,
        `"${exp.description.replace(/"/g, '""')}"`,
        `"${exp.supplier.replace(/"/g, '""')}"`,
        exp.amountPaid.toFixed(2).replace('.', ','),
        exp.status,
        exp.paymentMethod
      ].join(";");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Contabilidade_${formData.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategory = (catId: number) => categories?.find(c => c.id === catId);
  const getCategoryName = (catId: number) => getCategory(catId)?.name || 'Outros';
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Separation Logic
  const laborExpenses = projectExpenses?.filter(e => {
    const cat = getCategory(e.categoryId);
    return cat?.type === ExpenseType.LABOR;
  }) || [];

  const otherExpenses = projectExpenses?.filter(e => {
    const cat = getCategory(e.categoryId);
    return cat?.type !== ExpenseType.LABOR;
  }) || [];

  const totalLabor = laborExpenses.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalOther = otherExpenses.reduce((acc, curr) => acc + curr.amountPaid, 0);

  // --- RENDER: EDIT FORM ---
  if (isEditing) {
    return (
      <div className="p-4 space-y-6 pb-24">
        <header className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-3">
            <IconButton
              icon={ArrowLeft}
              onClick={() => isNew ? navigate(-1) : setIsEditing(false)}
              className="-ml-2"
              label="Voltar"
            />
            <h1 className="text-xl font-bold text-slate-800">
              {isNew ? 'Novo Projeto' : 'Editar Projeto'}
            </h1>
          </div>
        </header>

        <div className="space-y-4 bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Projeto</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex: Casa da Praia"
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Rua das Flores, 123"
              className="w-full p-2 border border-slate-300 rounded-lg outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Orçamento (R$)</label>
              <input
                type="text"
                inputMode="numeric"
                name="budget"
                value={getFormattedValue(formData.budget)}
                onChange={handleCurrencyChange}
                placeholder="0,00"
                className="w-full p-2 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Área (m²)</label>
              <input
                type="text"
                inputMode="numeric"
                name="sqMeters"
                value={getFormattedValue(formData.sqMeters)}
                onChange={handleCurrencyChange}
                placeholder="0,00"
                className="w-full p-2 border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Início</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Previsão Fim</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate || ''}
                onChange={handleChange}
                className="w-full p-2 border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Obra</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none bg-white"
            >
              <option>Residencial</option>
              <option>Comercial</option>
              <option>Reforma</option>
              <option>Pequeno Reparo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border border-slate-300 rounded-lg outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button onClick={handleSave} disabled={loading} fullWidth>
            <Save size={18} className="mr-2" />
            {isNew ? 'Criar Projeto' : 'Salvar Alterações'}
          </Button>

          {!isNew && (
            <Button variant="danger" onClick={handleDelete} fullWidth>
              <Trash2 size={18} className="mr-2" />
              Excluir Projeto
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Helper to render expense list
  const renderExpenseList = (expenses: Expense[], emptyMsg: string) => (
    <div className="space-y-3">
      {expenses.length > 0 ? (
        expenses.map(expense => (
          <div
            key={expense.id}
            onClick={() => navigate(`/edit-expense/${expense.id}`)}
            className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.99] transition-transform cursor-pointer"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className={`p-2 rounded-lg flex-shrink-0 ${expense.status === PaymentStatus.PAID ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {getCategory(expense.categoryId)?.type === ExpenseType.LABOR ? <User size={18} /> : <Package size={18} />}
              </div>
              <div className="min-w-0">
                <h4 className="font-medium text-slate-800 text-sm truncate pr-2">{expense.description || getCategoryName(expense.categoryId)}</h4>
                <div className="flex text-xs text-slate-500 space-x-2">
                  <span>{format(parseISO(expense.date), 'dd/MM')}</span>
                  <span>•</span>
                  <span className="truncate">{getCategoryName(expense.categoryId)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 pl-2">
              <div className="text-right">
                <span className="block font-bold text-slate-800">{formatCurrency(expense.amountPaid)}</span>
                <div className="flex justify-end gap-1 mt-1">
                  {expense.receiptImages && expense.receiptImages.length > 0 && (
                    <div
                      className="text-[10px] text-blue-500 flex items-center bg-blue-50 px-2 py-0.5 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(expense.receiptImages![0], `comprovante_${expense.id}.jpg`);
                      }}
                    >
                      <Download size={10} className="mr-1" /> Foto
                    </div>
                  )}
                </div>
              </div>

              <IconButton
                icon={Trash2}
                variant="danger"
                onClick={(e) => handleDeleteExpense(expense.id!, e)}
                label="Excluir gasto"
              />
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6 bg-white border border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-400 text-sm">{emptyMsg}</p>
        </div>
      )}
    </div>
  );

  // --- RENDER: DASHBOARD VIEW (Default) ---
  const totalSpent = projectExpenses?.reduce((acc, curr) => acc + curr.amountPaid, 0) || 0;
  const progress = formData.budget > 0 ? (totalSpent / formData.budget) * 100 : 0;
  const tasksPending = projectTasks?.filter(t => !t.isDone).length || 0;

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          <IconButton
            icon={ArrowLeft}
            onClick={() => navigate('/')}
            className="-ml-2"
            label="Voltar"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800 leading-tight">{formData.name}</h1>
            <span className="text-xs text-slate-500">{formData.address}</span>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          <Pencil size={16} />
          <span>Editar</span>
        </button>
      </header>

      {/* Main Stats Card */}
      <div className="bg-primary rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-slate-400 text-xs mb-1">Total Gasto</p>
          <h2 className="text-3xl font-bold mb-4">{formatCurrency(totalSpent)}</h2>

          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Orçamento: {formatCurrency(formData.budget)}</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${progress > 100 ? 'bg-red-500' : 'bg-success'}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
          <DollarSign size={120} />
        </div>
      </div>

      {/* TABS CONTROLLER */}
      <TabGroup
        tabs={[
          { id: 'expenses', label: 'Gastos', icon: DollarSign },
          { id: 'tasks', label: 'Tarefas', icon: CheckSquare, badge: tasksPending },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as Tab)}
      />

      {/* TAB CONTENT: EXPENSES */}
      {activeTab === 'expenses' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Button
              fullWidth
              className="shadow-md py-3"
              onClick={() => navigate(`/add-expense?projectId=${id}`)}
            >
              <Plus size={20} className="mr-2" />
              Novo Gasto
            </Button>

            <Button
              variant="secondary"
              fullWidth
              className="shadow-sm py-3 border-slate-200"
              onClick={handleExportCSV}
            >
              <FileSpreadsheet size={20} className="mr-2 text-green-600" />
              Planilha
            </Button>
          </div>

          {/* Split Summary */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-blue-50 rounded text-blue-600"><Package size={12} /></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Materiais</span>
              </div>
              <span className="font-bold text-slate-800">{formatCurrency(totalOther)}</span>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 bg-orange-50 rounded text-orange-600"><HardHat size={12} /></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Mão de Obra</span>
              </div>
              <span className="font-bold text-slate-800">{formatCurrency(totalLabor)}</span>
            </div>
          </div>

          {/* List 1: Materials & Others */}
          <div>
            <h3 className="font-bold text-slate-700 mb-2 mt-2 flex items-center gap-2 text-sm">
              <Package size={16} className="text-blue-500" />
              Materiais e Insumos
            </h3>
            {renderExpenseList(otherExpenses, "Nenhum gasto com material registrado.")}
          </div>

          {/* List 2: Labor (M.O) */}
          <div>
            <h3 className="font-bold text-slate-700 mb-2 mt-4 flex items-center gap-2 text-sm border-t border-slate-200 pt-4">
              <HardHat size={16} className="text-orange-500" />
              Histórico de Mão de Obra (M.O.)
            </h3>
            {renderExpenseList(laborExpenses, "Nenhum pagamento de mão de obra registrado.")}
          </div>
        </>
      )}

      {/* TAB CONTENT: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Shortcut to Calculator */}
          <div
            onClick={() => navigate(`/calculator?projectId=${id}`)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white flex items-center justify-between shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <CalcIcon size={20} />
              </div>
              <div>
                <h4 className="font-bold text-sm">Calculadora de Materiais</h4>
                <p className="text-[10px] text-blue-100">Use a IA para criar sua lista de compras</p>
              </div>
            </div>
            <ArrowLeft className="rotate-180" size={18} />
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              placeholder="Adicionar nova tarefa..."
              className="flex-1 p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-accent"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <Button type="submit" className="px-4">
              <Plus size={24} />
            </Button>
          </form>

          <div className="space-y-2">
            {projectTasks && projectTasks.length > 0 ? (
              projectTasks.map(task => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl transition-all ${task.isDone ? 'opacity-60 bg-slate-50' : 'shadow-sm'}`}
                >
                  <div className="flex items-center flex-1 cursor-pointer" onClick={() => toggleTask(task)}>
                    <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-colors ${task.isDone ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                      {task.isDone && <CheckSquare size={14} className="text-white" />}
                    </div>
                    <span className={`text-sm ${task.isDone ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}`}>
                      {task.title}
                    </span>
                  </div>
                  <IconButton
                    icon={XCircle}
                    variant="danger"
                    onClick={() => deleteTask(task.id!)}
                    label="Excluir tarefa"
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <ListTodo className="mx-auto text-slate-300 mb-2" size={40} />
                <p className="text-slate-500">Nenhuma tarefa pendente.</p>
                <p className="text-xs text-slate-400">Use o checklist para organizar a obra.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Insights Section (Only visible on Expenses tab usually, but good to keep here) */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold flex items-center text-sm">
            <Zap size={16} className="text-yellow-400 mr-2" />
            Análise Inteligente
          </h3>
          <Button size="sm" variant="secondary" onClick={handleAiAnalysis} disabled={analyzing} className="text-xs py-1 px-2 h-auto">
            {analyzing ? '...' : 'Gerar'}
          </Button>
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          {aiInsight ? (
            <div dangerouslySetInnerHTML={{ __html: aiInsight.replace(/\n/g, '<br/>') }} />
          ) : (
            "Toque em 'Gerar' para receber dicas sobre esta obra."
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;