import React, { useState, useEffect } from 'react';
import { Search, ArrowLeft, ShoppingCart, MapPin, TrendingUp, ChevronRight, Store as StoreIcon, Phone, Plus, Minus, X, CreditCard } from 'lucide-react';
import { Card } from '../components/Card';
import { IconButton } from '../components/IconButton';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { api } from '../src/services/api';
import { supabase } from '../src/supabase';
import { Product, Store, Project } from '../types';

interface CartItem extends Product {
   quantity: number;
}

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

   // Client & Smart Suggestion State
   const [myProjects, setMyProjects] = useState<Project[]>([]);
   const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

   // Cart State
   const [cart, setCart] = useState<CartItem[]>([]);
   const [isCartOpen, setIsCartOpen] = useState(false);

   useEffect(() => {
      // Get user location
      navigator.geolocation?.getCurrentPosition(
         (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
         () => { } // Silent fail if denied
      );

      loadData();
   }, []);

   const loadData = async () => {
      const [productsData, projectsData] = await Promise.all([
         api.products.list(),
         api.projects.list()
      ]);
      setAllProducts(productsData);
      setMyProjects(projectsData);

      // Load Stores
      const { data: storesData } = await supabase.from('stores').select('*').eq('is_active', true);
      if (storesData) {
         const storeMap: Record<string, Store> = {};
         storesData.forEach(s => { storeMap[s.user_id] = s as unknown as Store; });
         setStores(storeMap);
      }

      // Determine Smart Suggestions based on active project stage
      const activeProject = projectsData.find(p => p.status !== 'completed'); // Simplified active check
      if (activeProject && activeProject.currentStage) {
         const suggestions = productsData.filter(p => p.category === activeProject.currentStage);
         setSuggestedProducts(suggestions.slice(0, 3)); // Top 3
      }
   };

   // Cart Logic
   const addToCart = (product: Product) => {
      setCart(prev => {
         const existing = prev.find(item => item.id === product.id);
         if (existing) {
            return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
         }
         return [...prev, { ...product, quantity: 1 }];
      });
      setIsCartOpen(true);
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
   const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

   const handleCheckout = async () => {
      try {
         const preference = await api.checkout.createPreference(
            cart.map(item => ({
               title: item.name,
               quantity: item.quantity,
               unit_price: item.price
            })),
            {
               name: 'Cliente App',
               email: 'cliente@exemplo.com'
            }
         );

         if (preference && preference.init_point) {
            window.open(preference.init_point, '_blank');
         } else {
            alert('Erro ao iniciar pagamento.');
         }
      } catch (error) {
         console.error(error);
         alert('Erro ao conectar com pagamento.');
      }
   };

   // Group products by name to show unique items in list
   const uniqueProducts = Array.from(new Set(allProducts?.map(p => p.name)))
      .map(name => allProducts?.find(p => p.name === name))
      .filter(Boolean) as Product[];

   const filteredProducts = uniqueProducts.filter(m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase())
   );

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

               {/* Cart Indicator */}
               {cart.length > 0 && (
                  <button
                     onClick={() => setIsCartOpen(true)}
                     className="ml-auto bg-blue-600 text-white p-2 rounded-full relative"
                  >
                     <ShoppingCart size={20} />
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{cart.length}</span>
                  </button>
               )}
            </header>

            {/* Selected Item Header */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
               <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Produto</span>
                  <h2 className="text-lg font-bold text-slate-800">{selectedProduct.name}</h2>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Unidade: {selectedProduct.unit}</span>
               </div>
            </div>

            <h3 className="font-bold text-slate-700">Lojas com este item</h3>

            <div className="space-y-3">
               {offers.map((offer, index) => {
                  const isCheapest = index === 0;
                  const store = stores[offer.storeId];
                  const storeName = store?.name || offer.storeId.replace('_', ' ');
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
                                 </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className={`block text-xl font-bold ${isCheapest ? 'text-green-600' : 'text-slate-700'}`}>
                                 {formatCurrency(offer.price)}
                              </span>
                              {isCheapest && (
                                 <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full">
                                    MELHOR PREÇO
                                 </span>
                              )}
                           </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                           <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs font-bold text-primary"
                              onClick={() => navigate(`/store/${offer.storeId}`)}
                           >
                              Ver loja
                           </Button>
                           <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              onClick={() => addToCart(offer)}
                           >
                              <Plus size={14} className="mr-1" /> Adicionar
                           </Button>
                        </div>
                     </Card>
                  );
               })}
            </div>

            {/* Cart Modal */}
            {isCartOpen && (
               <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
                  <div className="bg-white w-full sm:max-w-lg h-[80vh] sm:h-auto rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
                     <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                           <ShoppingCart size={20} /> Carrinho
                        </h3>
                        <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                           <X size={20} />
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                           <div className="text-center py-10 text-slate-400">
                              <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
                              <p>Seu carrinho está vazio.</p>
                           </div>
                        ) : (
                           cart.map(item => (
                              <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                 <div>
                                    <p className="font-bold text-slate-800">{item.name}</p>
                                    <p className="text-xs text-slate-500">{formatCurrency(item.price)} un.</p>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                                       <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-slate-500"><Minus size={14} /></button>
                                       <span className="text-xs font-bold px-1">{item.quantity}</span>
                                       <button onClick={() => updateQuantity(item.id, 1)} className="p-2 text-slate-500"><Plus size={14} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-400"><X size={16} /></button>
                                 </div>
                              </div>
                           ))
                        )}
                     </div>

                     <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <div className="flex justify-between items-center mb-4">
                           <span className="font-medium text-slate-600">Total</span>
                           <span className="text-xl font-bold text-blue-600">{formatCurrency(cartTotal)}</span>
                        </div>
                        <Button
                           onClick={handleCheckout}
                           disabled={cart.length === 0}
                           className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                        >
                           <CreditCard size={18} className="mr-2" />
                           Finalizar Compra
                        </Button>
                     </div>
                  </div>
               </div>
            )}
         </div>
      );
   }

   // --- RENDER: SEARCH VIEW ---
   return (
      <div className="p-4 mb-20 space-y-6">
         <header className="pt-2 flex justify-between items-start">
            <div>
               <h1 className="text-2xl font-bold text-primary mb-1">Cotação de Materiais</h1>
               <p className="text-sm text-slate-500">Encontre o melhor preço na sua região</p>
            </div>
            {cart.length > 0 && (
               <button
                  onClick={() => setIsCartOpen(true)}
                  className="bg-blue-600 text-white p-2.5 rounded-full relative shadow-md"
               >
                  <ShoppingCart size={22} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">{cart.length}</span>
               </button>
            )}
         </header>

         {/* Smart Suggestions */}
         {suggestedProducts.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
               <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="text-blue-600" size={20} />
                  <h3 className="font-bold text-blue-800">Sugerido para sua obra</h3>
               </div>
               <div className="flex gap-3 overflow-x-auto pb-2">
                  {suggestedProducts.map(p => (
                     <div key={p.id} onClick={() => handleProductClick(p)} className="min-w-[140px] bg-white p-3 rounded-lg border border-blue-200 shadow-sm cursor-pointer hover:shadow-md transition-all">
                        <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 mb-2">{formatCurrency(p.price)}</p>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{p.category}</span>
                     </div>
                  ))}
               </div>
            </div>
         )}

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

         {/* Shared Cart Modal Logic for Main View */}
         {isCartOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
               <div className="bg-white w-full sm:max-w-lg h-[80vh] sm:h-auto rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                     <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <ShoppingCart size={20} /> Carrinho
                     </h3>
                     <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {cart.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                           <ShoppingCart size={48} className="mx-auto mb-2 opacity-20" />
                           <p>Seu carrinho está vazio.</p>
                        </div>
                     ) : (
                        cart.map(item => (
                           <div key={item.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                              <div>
                                 <p className="font-bold text-slate-800">{item.name}</p>
                                 <p className="text-xs text-slate-500">{formatCurrency(item.price)} un.</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <div className="flex items-center bg-white border border-slate-200 rounded-lg">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-slate-500"><Minus size={14} /></button>
                                    <span className="text-xs font-bold px-1">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 text-slate-500"><Plus size={14} /></button>
                                 </div>
                                 <button onClick={() => removeFromCart(item.id)} className="text-red-400"><X size={16} /></button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>

                  <div className="p-4 border-t border-slate-100 bg-slate-50">
                     <div className="flex justify-between items-center mb-4">
                        <span className="font-medium text-slate-600">Total</span>
                        <span className="text-xl font-bold text-blue-600">{formatCurrency(cartTotal)}</span>
                     </div>
                     <Button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                     >
                        <CreditCard size={18} className="mr-2" />
                        Finalizar Compra
                     </Button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default Quotes;