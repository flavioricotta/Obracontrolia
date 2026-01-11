import React, { useState } from 'react';
import { ArrowLeft, Calculator as CalcIcon, Sparkles, Check, ShoppingBag, Send } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { IconButton } from '../components/IconButton';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { calculateMaterials, MaterialItem } from '../services/geminiService';

interface CalculatorProps {
    isEmbedded?: boolean;
}

const Calculator: React.FC<CalculatorProps> = ({ isEmbedded = false }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preSelectedProjectId = searchParams.get('projectId');

    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<MaterialItem[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<number>(Number(preSelectedProjectId) || 0);

    const projects = useLiveQuery(() => db.projects.toArray());

    // Set default project if available and not set
    if (projects && projects.length > 0 && selectedProjectId === 0) {
        if (preSelectedProjectId) setSelectedProjectId(Number(preSelectedProjectId));
        else setSelectedProjectId(projects[0].id!);
    }

    const handleCalculate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setLoading(true);
        setResults([]);
        try {
            const items = await calculateMaterials(prompt);
            setResults(items);
        } catch (error) {
            alert("Erro ao calcular materiais. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddTasks = async () => {
        if (selectedProjectId === 0) {
            alert("Selecione um projeto para salvar a lista.");
            return;
        }

        try {
            const tasksToAdd = results.map(item => ({
                projectId: selectedProjectId,
                title: `Comprar: ${item.quantity} de ${item.name}`,
                isDone: false,
                createdAt: new Date().toISOString()
            }));

            await db.tasks.bulkAdd(tasksToAdd);
            alert(`${results.length} itens adicionados à lista de tarefas!`);
            navigate(`/project/${selectedProjectId}`);
        } catch (error) {
            console.error(error);
            alert("Erro ao salvar tarefas.");
        }
    };

    return (
        <div className={`${isEmbedded ? '' : 'p-4 mb-20 space-y-6'}`}>
            {/* Only show header if NOT embedded */}
            {!isEmbedded && (
                <header className="flex items-center space-x-3 pt-2">
                    <IconButton
                        icon={ArrowLeft}
                        onClick={() => navigate(-1)}
                        className="-ml-2"
                        label="Voltar"
                    />
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 leading-tight">Calculadora IA</h1>
                        <p className="text-xs text-slate-500">Estime materiais automaticamente</p>
                    </div>
                </header>
            )}

            <div className={`bg-primary rounded-2xl p-6 text-white shadow-lg relative overflow-hidden ${isEmbedded ? 'mt-0' : ''}`}>
                <div className="relative z-10">
                    <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="text-accent" size={20} />
                        O que vamos construir?
                    </h2>
                    <p className="text-sm text-slate-300 mb-4">
                        Descreva o trabalho e a IA calculará a lista de materiais para você.
                    </p>

                    <form onSubmit={handleCalculate} className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: Construir um muro de 10 metros de comprimento por 2 metros de altura com reboco."
                            className="w-full p-4 pr-12 rounded-xl bg-slate-800 border-none text-white placeholder-slate-500 focus:ring-2 focus:ring-accent outline-none resize-none h-32 text-sm"
                        />
                        <IconButton
                            icon={loading ? () => <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : Send}
                            variant="primary"
                            type="submit"
                            disabled={loading || !prompt}
                            label="Calcular"
                            className="absolute bottom-3 right-3"
                        />
                    </form>
                </div>

                {/* Background decoration */}
                <CalcIcon className="absolute -right-6 -bottom-6 text-white opacity-5 w-40 h-40 transform rotate-12" />
            </div>

            {/* Results Section */}
            {results.length > 0 && (
                <div className="space-y-4 animate-fade-in mt-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Lista Sugerida</h3>
                        <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                            Margem de segurança: +10%
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {results.map((item, idx) => (
                            <div key={idx} className="p-4 border-b border-slate-100 last:border-0 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                        <ShoppingBag size={14} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                        <p className="text-xs text-slate-500">{item.quantity}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400 block">Est. Unit.</span>
                                    <span className="text-sm font-medium text-slate-700">R$ {item.estimatedPrice}</span>
                                </div>
                            </div>
                        ))}

                        <div className="bg-slate-50 p-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Salvar lista em:</label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                                className="w-full p-2 mb-3 border border-slate-300 rounded-lg text-sm bg-white"
                            >
                                <option value={0} disabled>Selecione um projeto</option>
                                {projects?.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <Button fullWidth onClick={handleAddTasks}>
                                <Check size={18} className="mr-2" />
                                Adicionar ao Checklist
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calculator;