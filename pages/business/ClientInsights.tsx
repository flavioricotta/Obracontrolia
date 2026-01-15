import React, { useEffect, useState } from 'react';
import { User, MapPin, TrendingUp, Phone, Mail, Package, RefreshCw, MessageCircle, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { Button } from '../../components/Button';
import { api } from '../../src/services/api';
import { Project, Product } from '../../types';
import { supabase } from '../../src/supabase';

interface CartItem extends Product {
    quantity: number;
}

const ClientInsights: React.FC = () => {
    const [clients, setClients] = useState<Project[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Order Builder State
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Project | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

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

            // Disable strict filtering for demo/testing purposes so products always appear
            // if (user) {
            //    const myProducts = productsData.filter(p => p.storeId === user.id);
            //    setProducts(myProducts);
            // } else {
            setProducts(productsData);
            // }

            setClients(projectsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openOrderBuilder = (client: Project) => {
        setSelectedClient(client);
        setCart([]);
        setSearchTerm(''); // Reset search
        setIsOrderModalOpen(true);

        // Auto-add smart match product if available
        const stage = client.currentStage || 'Início';
        const matchingProduct = products.find(p => p.category === stage);
        if (matchingProduct) {
            addToCart(matchingProduct);
        }
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const getOpportunity = (stage?: string) => {
        if (!stage) return 'Oferecer projetos e consultoria inicial.';
        const matchingProduct = products.find(p => p.category === stage);
        if (matchingProduct) {
            return `Oportunidade: ${matchingProduct.name}`;
        }
        return 'Entrar em contato para entender a fase atual.';
    };

    const handleSendWhatsApp = () => {
        if (!selectedClient || cart.length === 0) return;

        const itemsList = cart.map(item => `- ${item.quantity}x ${item.name}`).join('\n');
        const total = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal);

        const message = `Olá ${selectedClient.name}! Preparei um orçamento especial para a fase de ${selectedClient.currentStage || 'obras'}:\n\n${itemsList}\n\n*Total: ${total}*\n\nPodemos fechar?`;

        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        setIsOrderModalOpen(false);
    };

    const handleGeneratePaymentLink = async () => {
        if (!selectedClient || cart.length === 0) return;

        try {
            const preference = await api.checkout.createPreference(
                cart.map(item => ({
                    title: item.name,
                    quantity: item.quantity,
                    unit_price: item.price
                })),
                {
                    name: selectedClient.name,
                    email: 'cliente@exemplo.com'
                }
            );

            if (preference && preference.init_point) {
                const total = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal);
                const message = `Link de Pagamento gerado!\nTotal: ${total}\n\n${preference.init_point}`;
                alert(message);
                window.open(preference.init_point, '_blank');
                setIsOrderModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao gerar link de pagamento.');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Carregando insights...</div>;
    }

    return (
        <div className="p-4 space-y-6 pb-24 relative">
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
                                onClick={() => openOrderBuilder(client)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none shadow-sm transition-colors py-3"
                            >
                                <ShoppingCart size={18} className="mr-2" />
                                Criar Pedido Personalizado
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* ORDER BUILDER MODAL */}
            {isOrderModalOpen && selectedClient && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full sm:max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Novo Pedido</h3>
                                <p className="text-xs text-slate-500">Cliente: {selectedClient.name}</p>
                            </div>
                            <button onClick={() => setIsOrderModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Product Selection */}
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 mb-2">Adicionar Produtos</h4>
                                <input
                                    type="text"
                                    placeholder="Buscar produto..."
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm mb-2"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <div className="h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                                    {filteredProducts.length === 0 ? (
                                        <div className="p-4 text-center text-slate-500 text-sm">
                                            Nenhum produto encontrado. Verifique o catálogo.
                                        </div>
                                    ) : (
                                        filteredProducts.map(product => (
                                            <div key={product.id} className="p-2 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{product.name}</p>
                                                    <p className="text-xs text-slate-500">R$ {product.price.toFixed(2)}</p>
                                                </div>
                                                <button
                                                    onClick={() => addToCart(product)}
                                                    className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 active:scale-95 transition-transform"
                                                    title="Adicionar ao carrinho"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Cart */}
                            <div>
                                <h4 className="font-bold text-sm text-slate-700 mb-2 flex justify-between">
                                    <span>Carrinho</span>
                                    <span className="text-blue-600">{cart.length} itens</span>
                                </h4>
                                {cart.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                        <ShoppingCart className="mx-auto text-slate-300 mb-2" size={24} />
                                        <p className="text-slate-400 text-sm">O carrinho está vazio</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {cart.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-800">{item.name}</p>
                                                    <p className="text-xs text-slate-500">R$ {item.price.toFixed(2)} un.</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-white rounded-md border border-slate-200">
                                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-500 hover:text-red-500">
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="text-xs font-bold px-2">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-500 hover:text-green-500">
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                                            <span className="font-bold text-slate-700">Total</span>
                                            <span className="font-bold text-lg text-blue-600">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3">
                            <Button
                                onClick={handleSendWhatsApp}
                                disabled={cart.length === 0}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none py-3"
                            >
                                <MessageCircle size={18} className="mr-2" />
                                WhatsApp
                            </Button>
                            <Button
                                onClick={handleGeneratePaymentLink}
                                disabled={cart.length === 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none py-3"
                            >
                                <ShoppingCart size={18} className="mr-2" />
                                Gerar Link
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientInsights;
