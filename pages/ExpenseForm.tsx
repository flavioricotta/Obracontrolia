import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { api } from '../src/services/api';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { Expense, PaymentStatus } from '../types';
import { ArrowLeft, Camera, X, Plus, Trash2, ScanLine, Loader2, Sparkles, Download } from 'lucide-react';
import { analyzeReceipt } from '../services/geminiService';
import { supabase } from '../src/supabase';
import { compressImage } from '../src/utils/imageCompression';

// Helper to upload file to Supabase Storage
const uploadToSupabase = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(filePath, file);

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from('receipts').getPublicUrl(filePath);
  return data.publicUrl;
};

const ExpenseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get ID for editing
  const [searchParams] = useSearchParams();
  const preSelectedProjectId = searchParams.get('projectId');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const [projects, setProjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Query existing expense if in edit mode
  const [existingExpense, setExistingExpense] = useState<Expense | null>(null);

  const [formData, setFormData] = useState<Expense>({
    projectId: preSelectedProjectId ? Number(preSelectedProjectId) : 0,
    date: new Date().toISOString().split('T')[0],
    categoryId: 0,
    subCategory: '',
    description: '',
    amountExpected: 0,
    amountPaid: 0,
    supplier: '',
    responsible: 'Eu',
    paymentMethod: 'Pix',
    status: PaymentStatus.PAID,
    createdAt: new Date().toISOString(),
    receiptImages: []
  });

  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Load config data (projects, categories)
  useEffect(() => {
    loadConfig();
  }, []);

  // Load existing expense if editing
  useEffect(() => {
    if (id) {
      api.expenses.list(undefined).then(all => {
        // In a real optimized app we would have a specific get expense endpoint or filter, 
        // but api.expenses.list currently returns user expenses. 
        // Or better, add get to api.expenses.
        // For now, let's just find it in the list or assume we need to implement get.
        // Actually, let's assume we can fetch all and find, or assume list takes projectId option. 
        // We'll trust we can find it if we implement specific get or just filter client side for now, 
        // but for performance locally filtering is fine for small scale.
        // Ideally we add get(id) to api.expenses.
        const found = all.find(e => e.id === Number(id));
        if (found) setExistingExpense(found);
      });
    }
  }, [id]);

  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const [projs, cats] = await Promise.all([
        api.projects.list(),
        api.categories.list()
      ]);
      setProjects(projs);
      setCategories(cats);
    } catch (error) {
      console.error("Error loading config", error);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    if (existingExpense) {
      setFormData(existingExpense);
      setPreviewImages(existingExpense.receiptImages || []);
    } else {
      // Defaults only if not editing
      if (projects && projects.length > 0 && formData.projectId === 0 && !preSelectedProjectId) {
        setFormData(prev => ({ ...prev, projectId: projects[0].id! }));
      }
      if (categories && categories.length > 0 && formData.categoryId === 0) {
        setFormData(prev => ({ ...prev, categoryId: categories[0].id! }));
      }
    }
  }, [existingExpense, projects, categories, preSelectedProjectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Id') ? Number(value) : value
    }));
  };

  // Special handler for Currency masking (Money format)
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 1. Remove everything that is not a digit
    const rawValue = value.replace(/\D/g, "");

    // 2. Convert to number (cents)
    const numberValue = Number(rawValue) / 100;

    setFormData(prev => ({
      ...prev,
      [name]: numberValue
    }));
  };

  // Helper to display the value formatted inside the input
  const getFormattedValue = (value: number) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };



  // ... inside component

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      const newFiles = Array.from(files);

      // Optimistically show local preview immediately using object URL (faster than base64)
      const localPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviewImages(prev => [...prev, ...localPreviews]);

      // Compress and upload in background
      try {
        for (const file of newFiles) {
          // Compress to WebP format (60-80% size reduction)
          const compressedFile = await compressImage(file);
          const publicUrl = await uploadToSupabase(compressedFile);
          newImages.push(publicUrl);
        }

        setFormData(prev => ({
          ...prev,
          receiptImages: [...(prev.receiptImages || []), ...newImages]
        }));
      } catch (error) {
        console.error("Upload failed", error);
        alert("Erro ao fazer upload da imagem. Tente novamente.");
      }
    }
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !categories) return;

    setIsScanning(true);

    try {
      // 1. Convert to Base64 ONLY for Gemini Analysis (AI needs the raw bytes/base64)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        try {
          // 2. Analyze with Gemini
          const result = await analyzeReceipt(base64, categories);

          // 3. Upload original file to Storage for persistence
          const publicUrl = await uploadToSupabase(file);

          if (result) {
            const matchedCategory = categories.find(c => c.name === result.categoryName);

            setFormData(prev => ({
              ...prev,
              amountPaid: result.amount,
              date: result.date || prev.date,
              supplier: result.supplier,
              description: result.description,
              categoryId: matchedCategory ? matchedCategory.id! : prev.categoryId,
              receiptImages: [...(prev.receiptImages || []), publicUrl] // Save URL to form
            }));

            setPreviewImages(prev => [...prev, publicUrl]);
          }
        } catch (error: any) {
          alert(error.message || "Não foi possível ler a nota fiscal.");
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);

    } catch (error) {
      console.error(error);
      setIsScanning(false);
    }
  };

  const removeImage = (index: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      receiptImages: prev.receiptImages?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amountPaid <= 0 && formData.amountExpected <= 0) {
      alert("Informe o valor do gasto.");
      return;
    }

    try {
      if (id) {
        await api.expenses.update(Number(id), formData);
      } else {
        await api.expenses.create(formData);
      }

      // Navigate back to project list
      if (formData.projectId) {
        navigate(`/project/${formData.projectId}`, { replace: true });
      } else {
        navigate(-1);
      }
    } catch (err) {
      alert("Erro ao salvar gasto");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    // Prevent any form submission or event bubbling issues
    e.preventDefault();
    e.stopPropagation();

    if (!id) return;

    if (window.confirm('Confirma a exclusão deste gasto?')) {
      try {
        const expenseId = Number(id);
        const targetProjectId = formData.projectId || existingExpense?.projectId;

        await api.expenses.delete(expenseId);

        // Redirect explicitly to project page
        if (targetProjectId) {
          navigate(`/project/${targetProjectId}`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error("Erro ao deletar:", error);
        alert("Erro ao tentar excluir.");
      }
    }
  };

  return (
    <div className="p-4 mb-10">
      <header className="flex items-center justify-between mb-6 z-10 relative">
        <div className="flex items-center space-x-3">
          <IconButton
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
            className="-ml-2"
            label="Voltar"
          />
          <h1 className="text-xl font-bold text-slate-800">{id ? 'Editar Gasto' : 'Registrar Gasto'}</h1>
        </div>

        {/* Header Delete Button - Backup icon */}
        {id && (
          <IconButton
            icon={Trash2}
            variant="danger"
            size="lg"
            onClick={handleDelete}
            label="Apagar gasto"
          />
        )}
      </header>

      {/* AI Scan Button - Only for NEW expenses */}
      {!id && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => scanInputRef.current?.click()}
            disabled={isScanning}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-blue-200 flex items-center justify-between group active:scale-[0.98] transition-all disabled:opacity-70"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                {isScanning ? <Loader2 className="animate-spin" size={24} /> : <ScanLine size={24} />}
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                  {isScanning ? 'Lendo Nota...' : 'Escanear Nota'}
                  {!isScanning && <Sparkles size={14} className="text-yellow-300" />}
                </h3>
                <p className="text-xs text-blue-100">{isScanning ? 'Aguarde um momento' : 'Preenchimento automático com IA'}</p>
              </div>
            </div>
            <Camera className="text-white/50 group-hover:text-white transition-colors" />
          </button>
          <input
            type="file"
            ref={scanInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleScanReceipt}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Project Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Projeto</label>
          <select
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            disabled={!!preSelectedProjectId}
            className={`w-full p-3 border border-slate-300 rounded-xl ${!!preSelectedProjectId ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}
          >
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Amount & Date Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Valor Pago (R$)</label>
            <input
              type="text"
              inputMode="numeric"
              name="amountPaid"
              value={getFormattedValue(formData.amountPaid)}
              onChange={handleCurrencyChange}
              placeholder="0,00"
              className="w-full p-3 border border-slate-300 rounded-xl font-bold text-lg text-slate-800 placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Data</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-3 border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        {/* Category & Sub */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Categoria</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-sm"
            >
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Detalhe (Opcional)</label>
            <input
              name="subCategory"
              value={formData.subCategory}
              onChange={handleChange}
              placeholder="Ex: Fios, Cimento"
              className="w-full p-3 border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Descrição</label>
          <input
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="O que foi comprado?"
            className="w-full p-3 border border-slate-300 rounded-xl"
          />
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Forma Pagto</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl"
            >
              <option>Pix</option>
              <option>Dinheiro</option>
              <option>Cartão Crédito</option>
              <option>Cartão Débito</option>
              <option>Boleto</option>
              <option>Transferência</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl"
            >
              {Object.values(PaymentStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fornecedor */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Fornecedor / Loja</label>
          <input
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            placeholder="Nome da loja"
            className="w-full p-3 border border-slate-300 rounded-xl"
          />
        </div>

        {/* Photo Attachment */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Comprovantes / Fotos da Obra</label>

          <div className="grid grid-cols-3 gap-2">
            {previewImages.map((img, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-500 transition-colors z-10"
                >
                  <X size={14} />
                </button>

                {/* Download Button */}
                <a
                  href={img}
                  download={`comprovante_${Date.now()}.jpg`}
                  className="absolute bottom-1 right-1 bg-black/60 text-white p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={14} />
                </a>
              </div>
            ))}

            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 cursor-pointer active:bg-slate-100 text-slate-400 hover:text-primary hover:border-primary transition-colors"
            >
              <Plus size={24} className="mb-1" />
              <span className="text-[10px] uppercase font-bold">Adicionar</span>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        <div className="pt-4 space-y-4">
          <Button type="submit" fullWidth size="lg">{id ? 'Salvar Alterações' : 'Salvar Gasto'}</Button>

          {id && (
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={handleDelete}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 border border-transparent"
            >
              <Trash2 size={18} className="mr-2" />
              Excluir este gasto
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;