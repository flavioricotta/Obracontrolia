import React, { useState, useEffect } from 'react';
import { api } from '../../src/services/api';
import { Product } from '../../types';
import { Search, Plus, Edit2, Check, X, Tag, Package, Trash2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { FilterChip } from '../../components/FilterChip';
import { useNavigate } from 'react-router-dom';

interface Props {
    isAdding?: boolean;
}

const ProductCatalog: React.FC<Props> = ({ isAdding = false }) => {
    const navigate = useNavigate();
    const currentUser = localStorage.getItem('obra_user') || 'loja_exemplo';

    // States
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [tempPrice, setTempPrice] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState(isAdding);

    // New Product State
    const [newProduct, setNewProduct] = useState<Partial<Product>>({
        name: '',
        price: 0,
        unit: 'un',
        category: 'Geral',
        storeId: currentUser
    });

    const [myProducts, setMyProducts] = useState<Product[]>([]);

    useEffect(() => {
        loadProducts();
    }, [currentUser]);

    const loadProducts = async () => {
        try {
            const all = await api.products.list();
            // Client side filter for storeId (simulated auth/store)
            const mine = all.filter(p => p.storeId === currentUser);
            setMyProducts(mine.reverse());
        } catch (error) {
            console.error(error);
        }
    };

    const filteredProducts = myProducts?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const startEdit = (product: Product) => {
        setEditingId(product.id!);
        setTempPrice(product.price.toFixed(2));
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTempPrice('');
    };

    const savePrice = async (id: number) => {
        const numericPrice = parseFloat(tempPrice.replace(',', '.'));
        if (isNaN(numericPrice)) return;

        try {
            await api.products.update(id, {
                price: numericPrice
                // lastUpdated is auto in Supabase or we would send it
            });
            setEditingId(null);
            loadProducts();
        } catch (error) {
            alert('Erro ao atualizar');
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProduct.name || !newProduct.price) return;

        try {
            await api.products.create({
                ...newProduct as any, // Cast because we initialized with partial
                storeId: currentUser
            });

            setShowAddModal(false);
            setNewProduct({ name: '', price: 0, unit: 'un', category: 'Geral', storeId: currentUser });
            if (isAdding) navigate('/');
            loadProducts();
        } catch (error) {
            alert('Erro ao criar produto');
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Remover este produto do catálogo?')) {
            await api.products.delete(id);
            loadProducts();
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="p-4 mb-20 space-y-6">
            <header className="pt-2 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Meu Catálogo</h1>
                    <p className="text-sm text-slate-500">Gerencie seus produtos e preços</p>
                </div>
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700">
                    {currentUser.charAt(0).toUpperCase()}
                </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-black text-white p-4 rounded-xl shadow-lg">
                    <span className="text-xs text-slate-400">Total Produtos</span>
                    <h3 className="text-2xl font-bold">{myProducts?.length || 0}</h3>
                </div>
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                    <span className="text-xs text-slate-500">Atualizados Hoje</span>
                    <h3 className="text-2xl font-bold text-slate-800">
                        {myProducts?.filter(p => new Date(p.lastUpdated).toDateString() === new Date().toDateString()).length || 0}
                    </h3>
                </div>
            </div>

            {/* Search & Actions */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
                <IconButton
                    icon={Plus}
                    variant="primary"
                    size="lg"
                    onClick={() => setShowAddModal(true)}
                    label="Adicionar produto"
                    className="bg-black text-white shadow-lg"
                />
            </div>

            {/* Product List */}
            <div className="space-y-3">
                {filteredProducts?.map(product => (
                    <div key={product.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{product.name}</h4>
                            <div className="flex gap-2 text-xs text-slate-500 mt-1">
                                <span className="bg-slate-100 px-2 py-0.5 rounded">{product.category}</span>
                                <span>•</span>
                                <span>{product.unit}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {editingId === product.id ? (
                                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200 animate-fade-in">
                                    <span className="text-xs font-bold text-slate-400 ml-2">R$</span>
                                    <input
                                        autoFocus
                                        type="number"
                                        value={tempPrice}
                                        onChange={(e) => setTempPrice(e.target.value)}
                                        className="w-20 bg-transparent font-bold text-lg outline-none"
                                    />
                                    <IconButton
                                        icon={Check}
                                        variant="success"
                                        onClick={() => savePrice(product.id!)}
                                        label="Salvar"
                                    />
                                    <IconButton
                                        icon={X}
                                        variant="danger"
                                        onClick={cancelEdit}
                                        label="Cancelar"
                                    />
                                </div>
                            ) : (
                                <div className="text-right cursor-pointer group" onClick={() => startEdit(product)}>
                                    <span className="block text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                        {formatCurrency(product.price)}
                                    </span>
                                    <span className="text-[10px] text-green-600 flex items-center justify-end gap-1">
                                        <Edit2 size={10} /> Editar
                                    </span>
                                </div>
                            )}

                            {editingId !== product.id && (
                                <IconButton
                                    icon={Trash2}
                                    variant="danger"
                                    onClick={() => handleDelete(product.id!)}
                                    label="Excluir produto"
                                />
                            )}
                        </div>
                    </div>
                ))}
                {filteredProducts?.length === 0 && (
                    <div className="text-center py-10 text-slate-400">
                        <Package size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Nenhum produto encontrado</p>
                    </div>
                )}
            </div>

            {/* Add Product Modal (Simple overlay) */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Novo Produto</h3>
                            <IconButton
                                icon={X}
                                onClick={() => { setShowAddModal(false); if (isAdding) navigate('/'); }}
                                label="Fechar"
                                className="bg-slate-100"
                            />
                        </div>

                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nome do Produto</label>
                                <input
                                    required
                                    className="w-full p-3 border border-slate-300 rounded-xl"
                                    placeholder="Ex: Cimento CP II"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Preço (R$)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        className="w-full p-3 border border-slate-300 rounded-xl font-bold"
                                        placeholder="0.00"
                                        value={newProduct.price || ''}
                                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Unidade</label>
                                    <select
                                        className="w-full p-3 border border-slate-300 rounded-xl bg-white"
                                        value={newProduct.unit}
                                        onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                    >
                                        <option value="un">Unidade</option>
                                        <option value="kg">Kg</option>
                                        <option value="saco">Saco</option>
                                        <option value="m">Metro</option>
                                        <option value="m²">m²</option>
                                        <option value="m³">m³</option>
                                        <option value="lata">Lata</option>
                                        <option value="litro">Litro</option>
                                        <option value="milheiro">Milheiro</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Categoria</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                    {['Geral', 'Estrutura', 'Acabamento', 'Elétrica', 'Hidráulica', 'Pintura'].map(cat => (
                                        <FilterChip
                                            key={cat}
                                            label={cat}
                                            isActive={newProduct.category === cat}
                                            onClick={() => setNewProduct({ ...newProduct, category: cat })}
                                            variant="dark"
                                        />
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" fullWidth className="bg-black text-white hover:bg-gray-900 mt-2">
                                Adicionar ao Catálogo
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCatalog;