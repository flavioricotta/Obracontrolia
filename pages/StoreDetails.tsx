import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, Clock, Truck, CreditCard, Instagram, Facebook, Package } from 'lucide-react';
import { IconButton } from '../components/IconButton';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { supabase } from '../src/supabase';
import { api } from '../src/services/api';
import { Store, Product } from '../types';

const StoreDetails: React.FC = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const navigate = useNavigate();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (storeId) {
            loadStoreData();
        }
    }, [storeId]);

    const loadStoreData = async () => {
        setLoading(true);
        try {
            // Load store info
            const { data: storeData } = await supabase
                .from('stores')
                .select('*')
                .eq('user_id', storeId)
                .single();

            if (storeData) {
                setStore(storeData as unknown as Store);
            }

            // Load store products
            const allProducts = await api.products.list();
            const storeProducts = allProducts.filter(p => p.storeId === storeId);
            setProducts(storeProducts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!store) {
        return (
            <div className="p-4 text-center">
                <p className="text-slate-500">Loja não encontrada</p>
                <Button onClick={() => navigate(-1)} className="mt-4">Voltar</Button>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 space-y-6">
            {/* Header */}
            <header className="flex items-center gap-3">
                <IconButton icon={ArrowLeft} onClick={() => navigate(-1)} label="Voltar" />
                <div>
                    <h1 className="text-xl font-bold text-slate-800">{store.name}</h1>
                    <p className="text-xs text-slate-500">{store.city}{store.state ? `, ${store.state}` : ''}</p>
                </div>
            </header>

            {/* Store Info Card */}
            <Card className="p-5 space-y-4">
                {/* Description */}
                {store.description && (
                    <div>
                        <p className="text-slate-600 text-sm">{store.description}</p>
                    </div>
                )}

                {/* Address */}
                <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-slate-400 mt-0.5" />
                    <div>
                        <p className="text-sm text-slate-700">{store.address}</p>
                        <p className="text-xs text-slate-500">{store.city}{store.state ? `, ${store.state}` : ''} {store.zipCode ? `- ${store.zipCode}` : ''}</p>
                    </div>
                </div>

                {/* Phone */}
                <div className="flex items-center gap-3">
                    <Phone size={18} className="text-slate-400" />
                    <a
                        href={`https://wa.me/55${store.phone?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:underline font-medium"
                    >
                        {store.phone} (WhatsApp)
                    </a>
                </div>

                {/* Opening Hours */}
                {store.openingHours && (
                    <div className="flex items-center gap-3">
                        <Clock size={18} className="text-slate-400" />
                        <p className="text-sm text-slate-700">{store.openingHours}</p>
                    </div>
                )}

                {/* Delivery Options */}
                {store.deliveryOptions && store.deliveryOptions.length > 0 && (
                    <div className="flex items-start gap-3">
                        <Truck size={18} className="text-slate-400 mt-0.5" />
                        <div className="flex flex-wrap gap-1.5">
                            {store.deliveryOptions.map(opt => (
                                <span key={opt} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                    {opt}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Methods */}
                {store.paymentMethods && store.paymentMethods.length > 0 && (
                    <div className="flex items-start gap-3">
                        <CreditCard size={18} className="text-slate-400 mt-0.5" />
                        <div className="flex flex-wrap gap-1.5">
                            {store.paymentMethods.map(pay => (
                                <span key={pay} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    {pay}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Social Media */}
                {(store.instagram || store.facebook) && (
                    <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                        {store.instagram && (
                            <a
                                href={`https://instagram.com/${store.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-pink-600 hover:underline text-sm"
                            >
                                <Instagram size={16} /> {store.instagram}
                            </a>
                        )}
                        {store.facebook && (
                            <a
                                href={store.facebook.startsWith('http') ? store.facebook : `https://facebook.com/${store.facebook}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                            >
                                <Facebook size={16} /> Facebook
                            </a>
                        )}
                    </div>
                )}
            </Card>

            {/* Products Section */}
            <div>
                <h2 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Package size={18} /> Produtos da Loja ({products.length})
                </h2>

                {products.length === 0 ? (
                    <p className="text-slate-400 text-center py-6">Nenhum produto cadastrado</p>
                ) : (
                    <div className="space-y-2">
                        {products.map(product => (
                            <Card key={product.id} className="p-3 flex justify-between items-center">
                                <div>
                                    <h4 className="font-medium text-slate-800">{product.name}</h4>
                                    <span className="text-xs text-slate-400">{product.category} • {product.unit}</span>
                                </div>
                                <span className="font-bold text-slate-800">{formatCurrency(product.price)}</span>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreDetails;
