import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Info } from 'lucide-react';

const STAGES = [
    { id: 1, title: 'Planejamento e Projetos', description: 'Definição arquitetônica e aprovação legal.' },
    { id: 2, title: 'Preparação do Terreno', description: 'Limpeza, terraplanagem e canteiro de obras.' },
    { id: 3, title: 'Fundação', description: 'Alicerce, sapatas e concretagem inicial.' },
    { id: 4, title: 'Estrutura', description: 'Pilares, vigas e lajes.' },
    { id: 5, title: 'Alvenaria e Fechamento', description: 'Levantamento de paredes e divisórias.' },
    { id: 6, title: 'Instalações', description: 'Elétrica, hidráulica e infraestrutura de ar.' },
    { id: 7, title: 'Acabamentos e Revestimentos', description: 'Pisos, azulejos, gesso e bancadas.' },
    { id: 8, title: 'Pintura e Entrega', description: 'Pintura final, limpeza e vistoria.' },
];

const Stages: React.FC = () => {
    const [completedStages, setCompletedStages] = useState<number[]>([]);
    const [notification, setNotification] = useState<string | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('obra_stages_completed');
        if (saved) {
            setCompletedStages(JSON.parse(saved));
        }
    }, []);

    const toggleStage = (id: number) => {
        let newCompleted;
        const isCompleting = !completedStages.includes(id);

        if (isCompleting) {
            newCompleted = [...completedStages, id];
            showNotification(`Etapa "${STAGES.find(s => s.id === id)?.title}" concluída! Insights enviados para parceiros.`);
        } else {
            newCompleted = completedStages.filter(s => s !== id);
        }

        setCompletedStages(newCompleted);
        localStorage.setItem('obra_stages_completed', JSON.stringify(newCompleted));
    };

    const showNotification = (msg: string) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const progress = Math.round((completedStages.length / STAGES.length) * 100);

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="pt-2">
                <h1 className="text-2xl font-bold text-primary">Etapas da Obra</h1>
                <p className="text-sm text-slate-500">Acompanhe o progresso da construção</p>
            </header>

            {/* Progress Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Progresso Geral</span>
                    <span className="text-sm font-bold text-primary">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* Stages List */}
            <div className="space-y-3">
                {STAGES.map((stage) => {
                    const isDone = completedStages.includes(stage.id);
                    return (
                        <div
                            key={stage.id}
                            onClick={() => toggleStage(stage.id)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${isDone
                                    ? 'bg-green-50 border-green-200 shadow-sm'
                                    : 'bg-white border-slate-100 hover:border-primary/50'
                                }`}
                        >
                            <div className={`p-2 rounded-full ${isDone ? 'text-green-600 bg-green-100' : 'text-slate-300 bg-slate-50'}`}>
                                {isDone ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                            </div>
                            <div className="flex-1">
                                <h3 className={`font-semibold ${isDone ? 'text-green-800' : 'text-slate-700'}`}>
                                    {stage.title}
                                </h3>
                                <p className="text-xs text-slate-500">{stage.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-20 left-4 right-4 bg-slate-800 text-white p-4 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
                    <Info size={24} className="text-blue-400" />
                    <p className="text-sm">{notification}</p>
                </div>
            )}

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                <p className="flex gap-2">
                    <Info size={20} className="shrink-0" />
                    <span>
                        <strong>Por que marcar as etapas?</strong><br />
                        Ao atualizar sua etapa, enviamos insights para parceiros que podem oferecer promoções exclusivas para o momento atual da sua obra.
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Stages;
