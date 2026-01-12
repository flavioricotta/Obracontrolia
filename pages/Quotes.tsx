import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, ShoppingCart, MapPin, TrendingUp, ChevronRight, Store as StoreIcon, Phone } from 'lucide-react';
import { Card } from '../components/Card';
import { IconButton } from '../components/IconButton';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { api } from '../src/services/api';
import { supabase } from '../src/supabase';
import { Product, Store } from '../types';

// Haversine formula to calculate distance in km
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
   const R = 6371; // Earth radius in km
   const dLat = (lat2 - lat1) * Math.PI / 180;
   const dLon = (lon2 - lon1) * Math.PI / 180;
   const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const Quotes: React.FC = () => {
   const navigate = useNavigate();
   const [searchTerm, setSearchTerm] = useState('');
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
   const [allProducts, setAllProducts] = useState<Product[]>([]);
   const [stores, setStores] = useState<Record<string, Store>>({});
   const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

   useEffect(() => {
      // Get user location
      navigator.geolocation?.getCurrentPosition(
         (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
         () => { } // Silent fail if denied
      );

      // Load products and stores
      api.products.list().then(setAllProducts);
      supabase.from('stores').select('*').eq('is_active', true).then(({ data }) => {
         if (data) {
            const storeMap: Record<string, Store> = {};
            data.forEach(s => { storeMap[s.user_id] = s as unknown as Store; });
            setStores(storeMap);
         }
      });
   }, []);

   // Group products by name to show unique items in list
   const uniqueProducts = Array.from(new Set(allProducts?.map(p => p.name)))
      .map(name => allProducts?.find(p => p.name === name))
      .filter(Boolean) as Product[];

   const filteredProducts = uniqueProducts.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
   );

   const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

   const handleProductClick = (product: Product) => {
      setSelectedProduct(product);
   };

   const getStoreDistance = (store: Store): string => {
      if (!userLocation || !store.latitude || !store.longitude) return '—';
      const dist = calculateDistance(userLocation.lat, userLocation.lng, store.latitude, store.longitude);
      return dist.toFixed(1) + ' km';
   };

   // --- RENDER: DETAILS VIEW (OFFERS LIST) ---
   if (selectedProduct && allProducts) {
      // Find all offers for this product name
      const offers = allProducts
         .filter(p => p.name === selectedProduct.name)
         .sort((a, b) => a.price - b.price);

      const bestPrice = offers[0].price;

      return (
         <div className="p-4 mb-20 space-y-6">
            <header className="flex items-center space-x-3 pt-2">
               <IconButton
                  icon={ArrowLeft}
                  onClick={() => setSelectedProduct(null)}
                  className="-ml-2"
                  label="Voltar"
               />
               <div>
                  <h1 className="text-xl font-bold text-slate-800 leading-tight">Ofertas</h1>
                  <p className="text-xs text-slate-500">Comparativo em tempo real</p>
               </div>
            </header>

            {/* Selected Item Header */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Produto</span>
                  <h2 className="text-lg font-bold text-slate-800">{selectedProduct.name}</h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Unidade: {selectedProduct.unit}</span>
               </div>
               <div className="bg-blue-50 p-3 rounded-full">
                  <ShoppingCart size={24} className="text-blue-600" />
               </div>
            </div>

            <h3 className="font-bold text-slate-700">Lojas com este item</h3>

            <div className="space-y-3">
               {offers.map((offer, index) => {
                  const isCheapest = index === 0;
                  const diffPercent = ((offer.price - bestPrice) / bestPrice) * 100;
                  const store = stores[offer.storeId];
                  const storeName = store?.name || offer.storeId.replace('_', ' ');
                  const storePhone = store?.phone;
                  const distance = store ? getStoreDistance(store) : '—';

                  return (
                     <Card key={offer.id} className={`p-4 flex flex-col ${isCheapest ? 'border-green-500 border-2 shadow-md' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-slate-100 text-slate-600`}>
                                 <StoreIcon size={20} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-800 capitalize">{storeName}</h4>
                                 <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="flex items-center">
                                       <MapPin size={10} className="mr-1" />
                                       {distance}
                                    </span>
                                    {storePhone && (
                                       <a
                                          href={`https://wa.me/55${storePhone.replace(/\D/g, '')}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center text-green-600 hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                       >
                                          <Phone size={10} className="mr-1" />
                                          WhatsApp
                                       </a>
                                    )}
                                 </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className={`block text-xl font-bold ${isCheapest ? 'text-green-600' : 'text-slate-700'}`}>
                                 {formatCurrency(offer.price)}
                              </span>
                              {isCheapest ? (
                                 <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">
                                    MELHOR PREÇO
                                 </span>
                              ) : (
                                 <span className="text-[10px] font-medium text-red-400 flex items-center justify-end">
                                    <TrendingUp size={10} className="mr-1" />
                                    +{diffPercent.toFixed(1)}%
                                 </span>
                              )}
                           </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                           <span className="text-xs text-slate-400">
                              Atualizado: {new Date(offer.lastUpdated).toLocaleDateString()}
                           </span>
                           <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs font-bold text-primary flex items-center hover:underline px-2"
                              onClick={() => navigate(`/store/${offer.storeId}`)}
                           >
                              Ver loja <ChevronRight size={12} className="ml-1" />
                           </Button>
                        </div>
                     </Card>
                  );
               })}
            </div>
         </div>
      );
   }

   // --- RENDER: SEARCH VIEW ---
   return (
      <div className="p-4 mb-20 space-y-6">
         <header className="pt-2">
            <h1 className="text-2xl font-bold text-primary mb-1">Cotação de Materiais</h1>
            <p className="text-sm text-slate-500">Encontre o melhor preço na sua região</p>
         </header>

         {/* Search Bar */}
         <div className="relative">
            <input
               type="text"
               placeholder="O que você precisa comprar?"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 placeholder:text-slate-400"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
         </div>

         <div className="space-y-4">
            <h3 className="font-bold text-slate-700">Materiais Disponíveis</h3>

            {filteredProducts && filteredProducts.length > 0 ? (
               <div className="grid gap-3">
                  {filteredProducts.map((item) => (
                     <Card
                        key={item.id}
                        onClick={() => handleProductClick(item)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:scale-[0.99] transition-all"
                     >
                        <div className="flex items-center space-x-3">
                           <div className="bg-slate-100 p-2.5 rounded-lg text-slate-600">
                              <ShoppingCart size={20} />
                           </div>
                           <div>
                              <h4 className="font-medium text-slate-800">{item.name}</h4>
                              <span className="text-xs text-slate-400">A partir de {formatCurrency(item.price)}</span>
                           </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300" />
                     </Card>
                  ))}
               </div>
            ) : (
               <div className="text-center py-10">
                  <p className="text-slate-500">Nenhum material encontrado.</p>
                  <p className="text-xs text-slate-400 mt-2">Dica: Cadastre-se como Empresário para adicionar produtos aqui.</p>
               </div>
            )}
         </div>
      </div>
   );
};

export default Quotes;