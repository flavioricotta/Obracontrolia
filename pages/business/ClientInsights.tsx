import React from 'react';
import { User, MapPin, Briefcase, TrendingUp, Phone, Mail } from 'lucide-react';
import { Button } from '../../components/Button';

// Mock Data for Clients
const CLIENTS = [
    {
        id: 1,
        name: 'João Silva',
        project: 'Casa Silva',
        address: 'Rua das Flores, 123 - Centro',
        stage: 'Fundação',
        stageId: 3,
        phone: '(11) 99999-1111',
        email: 'joao.silva@email.com',
        budget: 150000,
        opportunity: 'Ofertar Cimento e Aço (Alta demanda na fase de Fundação)'
    },
    {
        id: 2,
        name: 'Maria Oliveira',
        project: 'Reforma Apartamento 504',
        address: 'Av. Paulista, 1000 - Bela Vista',
        stage: 'Acabamentos e Revestimentos',
        stageId: 7,
        phone: '(11) 98888-2222',
        email: 'maria.oli@email.com',
        budget: 85000,
        opportunity: 'Ofertar Porcelanatos, Tintas e Metais (Fase de acabamento)'
    },
    {
        id: 3,
        name: 'Carlos Santos',
        project: 'Edícula Jardim',
        address: 'Rua do Bosque, 45 - Vila Nova',
        stage: 'Alvenaria e Fechamento',
        stageId: 5,
        phone: '(11) 97777-3333',
        email: 'carlos.santos@email.com',
        budget: 45000,
        opportunity: 'Ofertar Blocos, Argamassa e Portas (Fase de fechamento)'
    },
    {
        id: 4,
        name: 'Ana Costa',
        project: 'Consultório Odontológico',
        address: 'Rua Saúde, 88 - Medical Center',
        stage: 'Instalações',
        stageId: 6,
        phone: '(11) 96666-4444',
        email: 'ana.costa@email.com',
        budget: 120000,
        opportunity: 'Ofertar Fios, Cabos, Tubos e Conexões (Fase de instalações)'
    }
];

const ClientInsights: React.FC = () => {
    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="pt-2">
                <h1 className="text-2xl font-bold text-slate-900">Insights de Clientes</h1>
                <p className="text-sm text-slate-500">Oportunidades de venda baseadas no progresso das obras</p>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
                    <span className="text-xs text-blue-200">Clientes Ativos</span>
                    <h3 className="text-2xl font-bold">{CLIENTS.length}</h3>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <span className="text-xs text-slate-500">Oportunidades Hoje</span>
                    <h3 className="text-2xl font-bold text-green-600">{CLIENTS.length}</h3>
                </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800 mt-4">Lista de Oportunidades</h2>

            <div className="space-y-4">
                {CLIENTS.map(client => (
                    <div key={client.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{client.name}</h3>
                                    <p className="text-xs text-slate-500">{client.project}</p>
                                </div>
                            </div>
                            <div className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                {client.stage}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                            <MapPin size={14} />
                            <span>{client.address}</span>
                        </div>

                        {/* AI Insight Box */}
                        <div className="bg-green-50 border border-green-100 p-3 rounded-lg mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp size={16} className="text-green-600" />
                                <span className="text-xs font-bold text-green-700">Sugestão da IA</span>
                            </div>
                            <p className="text-sm text-slate-700">{client.opportunity}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="secondary" size="sm" className="w-full">
                                <Phone size={16} className="mr-2" />
                                Ligar
                            </Button>
                            <Button variant="secondary" size="sm" className="w-full">
                                <Mail size={16} className="mr-2" />
                                Email
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientInsights;
