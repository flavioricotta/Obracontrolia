import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store as StoreIcon, MapPin, Phone, Building2, Save, Loader2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { supabase } from '../../src/supabase';
import { Store } from '../../types';

const StoreProfile: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    const [formData, setFormData] = useState<Partial<Store>>({
        name: '',
        cnpj: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        latitude: undefined,
        longitude: undefined,
    });

    useEffect(() => {
        loadExistingStore();
    }, []);

    const loadExistingStore = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const { data: store } = await supabase
                .from('stores')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (store) {
                setFormData({
                    name: store.name || '',
                    cnpj: store.cnpj || '',
                    phone: store.phone || '',
                    email: store.email || '',
                    address: store.address || '',
                    city: store.city || '',
                    state: store.state || '',
                    zipCode: store.zip_code || '',
                    latitude: store.latitude,
                    longitude: store.longitude,
                });
            }
        } catch (error) {
            // No store yet, that's fine
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalização não suportada pelo navegador');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }));
                setGettingLocation(false);
            },
            (error) => {
                alert('Não foi possível obter a localização. Verifique as permissões.');
                setGettingLocation(false);
            }
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.phone || !formData.address || !formData.city) {
            alert('Preencha os campos obrigatórios: Nome, Telefone, Endereço e Cidade.');
            return;
        }

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const storeData = {
                user_id: user.id,
                name: formData.name,
                cnpj: formData.cnpj || null,
                phone: formData.phone,
                email: formData.email || null,
                address: formData.address,
                city: formData.city,
                state: formData.state || null,
                zip_code: formData.zipCode || null,
                latitude: formData.latitude || null,
                longitude: formData.longitude || null,
                is_active: true,
            };

            const { error } = await supabase
                .from('stores')
                .upsert(storeData, { onConflict: 'user_id' });

            if (error) throw error;

            navigate('/business/catalog');
        } catch (error: any) {
            console.error(error);
            alert('Erro ao salvar: ' + (error.message || 'Tente novamente'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="p-4 pb-24">
            <header className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg">
                        <StoreIcon className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Perfil da Loja</h1>
                        <p className="text-sm text-slate-500">Complete os dados para aparecer no marketplace</p>
                    </div>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Store Name */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Nome da Loja *
                    </label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ex: Depósito Silva"
                        className="w-full p-3 border border-slate-300 rounded-xl"
                        required
                    />
                </div>

                {/* CNPJ */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        CNPJ
                    </label>
                    <input
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleChange}
                        placeholder="00.000.000/0000-00"
                        className="w-full p-3 border border-slate-300 rounded-xl"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Telefone / WhatsApp *
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="(11) 99999-9999"
                            className="w-full p-3 pl-10 border border-slate-300 rounded-xl"
                            required
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        E-mail
                    </label>
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contato@loja.com"
                        className="w-full p-3 border border-slate-300 rounded-xl"
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Endereço Completo *
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Rua, Número, Bairro"
                            className="w-full p-3 pl-10 border border-slate-300 rounded-xl"
                            required
                        />
                    </div>
                </div>

                {/* City & State */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Cidade *
                        </label>
                        <input
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="São Paulo"
                            className="w-full p-3 border border-slate-300 rounded-xl"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Estado
                        </label>
                        <input
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="SP"
                            className="w-full p-3 border border-slate-300 rounded-xl"
                        />
                    </div>
                </div>

                {/* CEP */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        CEP
                    </label>
                    <input
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="00000-000"
                        className="w-full p-3 border border-slate-300 rounded-xl"
                    />
                </div>

                {/* Location Button */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-700">Localização GPS</p>
                            {formData.latitude && formData.longitude ? (
                                <p className="text-xs text-emerald-600">
                                    ✓ Capturada ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                                </p>
                            ) : (
                                <p className="text-xs text-slate-500">Permite calcular distância para clientes</p>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleGetLocation}
                            disabled={gettingLocation}
                        >
                            {gettingLocation ? (
                                <Loader2 className="animate-spin mr-2" size={16} />
                            ) : (
                                <MapPin size={16} className="mr-2" />
                            )}
                            {formData.latitude ? 'Atualizar' : 'Capturar'}
                        </Button>
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-4">
                    <Button type="submit" fullWidth size="lg" disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={18} />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={18} className="mr-2" />
                                Salvar Perfil da Loja
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default StoreProfile;
