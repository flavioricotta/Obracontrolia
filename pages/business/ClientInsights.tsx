import React, { useEffect, useState } from 'react';
import { User, MapPin, TrendingUp, Phone, Mail, Package, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '../../components/Button';
import { api } from '../../src/services/api';
import { Project, Product } from '../../types';
import { supabase } from '../../src/supabase';

const ClientInsights: React.FC = () => {
    const [clients, setClients] = useState<Project[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [projectsData, productsData] = await Promise.all([
                api.projects.list(),
                api.products.list()
            ]);

            setProducts(productsData);
            setClients(projectsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOpportunity = (stage?: string) => {
        if (!stage) return 'Oferecer projetos e consultoria inicial.';

        // Smart Matching
        const matchingProduct = products.find(p => p.category === stage);

        if (matchingProduct) {
            return `Oportunidade: ${matchingProduct.name}`;
        }

        const lower = stage.toLowerCase();
        if (lower.includes('fundação')) return 'Ofertar Cimento, Aço, Brita e Areia.';
        if (lower.includes('estrutura')) return 'Ofertar Concreto, Lajes e Ferragens.';
        if (lower.includes('alvenaria')) return 'Ofertar Blocos, Cimento e Argamassa.';
        if (lower.includes('instalações')) return 'Ofertar Tubos, Fios, Cabos e Quadros.';
        if (lower.includes('acabamento')) return 'Ofertar Pisos, Revestimentos, Louças e Metais.';
        if (lower.includes('pintura')) return 'Ofertar Tintas, Lixas, Rolos e Massas.';

        return 'Entrar em contato para entender a fase atual.';
    };

    const sendWhatsAppOffer = (client: Project) => {
        const stage = client.currentStage || 'Início';
        const matchingProduct = products.find(p => p.category === stage);
        const productText = matchingProduct
            ? `${matchingProduct.name} por ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(matchingProduct.price)}`
            : 'nossos produtos';

        const message = `Olá ${client.name}, vi que sua obra está na etapa de ${stage}. Temos uma oferta especial de ${productText} para você!`;
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
    };

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Carregando insights...</div>;
    }

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="pt-2 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Insights de Clientes</h1>
                    <p className="text-sm text-slate-500">Oportunidades de venda baseadas no progresso das obras</p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-slate-100 rounded-full"
                    title="Atualizar lista"
                >
                    <RefreshCw size={20} />
                </button>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-600 text-white p-4 rounded-xl shadow-lg">
                    <span className="text-xs text-blue-200">Clientes Ativos</span>
                    <h3 className="text-2xl font-bold">{clients.length}</h3>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <span className="text-xs text-slate-500">Oportunidades Hoje</span>
                    <h3 className="text-2xl font-bold text-green-600">{clients.length}</h3>
                </div>
            </div>

            <div className="space-y-4">
                {clients.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-xl border-slate-300">
                        <Package className="mx-auto text-slate-300 mb-2" size={48} />
                        <p className="text-slate-500">Nenhum cliente com obra ativa encontrado.</p>
                    </div>
                ) : (
                    clients.map(client => (
                        <div key={client.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{client.name}</h3>
                                        <p className="text-xs text-slate-500">Orçamento: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.budget)}</p>
                                    </div>
                                </div>
                                <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                                    {client.currentStage || 'Início'}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                <MapPin size={14} />
                                <span>{client.address}</span>
                            </div>

                            <div className="bg-green-50 border border-green-100 p-3 rounded-lg mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp size={16} className="text-green-600" />
                                    <span className="text-xs font-bold text-green-700">Sugestão da IA</span>
                                </div>
                                <p className="text-sm text-slate-700 font-medium">{getOpportunity(client.currentStage)}</p>
                            </div>

                            <Button
                                onClick={() => sendWhatsAppOffer(client)}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none shadow-sm transition-colors py-3"
                            >
                                <MessageCircle size={18} className="mr-2" />
                                Sugerir via WhatsApp
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ClientInsights;
