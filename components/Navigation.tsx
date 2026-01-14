import React from 'react';
import { Home, PlusCircle, Calendar, Settings, PieChart, Store, List, UserCircle, CheckSquare } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationProps {
  userType?: 'client' | 'business';
}

export const Navigation: React.FC<NavigationProps> = ({ userType = 'client' }) => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (p: string) => {
    // Simple logic to highlight active tab
    if (p === '/' && path === '/') return true;
    if (p !== '/' && path.startsWith(p)) return true;
    return false;
  };

  const clientNavItems = [
    { icon: Home, label: 'Projetos', path: '/' },
    { icon: PieChart, label: 'Orçamento', path: '/reports' },
    { icon: PlusCircle, label: 'Obra', path: '/project/new', highlight: true },
    { icon: Calendar, label: 'Tempo', path: '/timeline' },
    { icon: CheckSquare, label: 'Etapas', path: '/stages' },
  ];

  const businessNavItems = [
    { icon: Store, label: 'Catálogo', path: '/' }, // Catalog is home for business
    { icon: List, label: 'Pedidos', path: '/business/orders' }, // Future placeholder
    { icon: PlusCircle, label: 'Produto', path: '/business/products/new', highlight: true },
    { icon: UserCircle, label: 'Perfil', path: '/settings' },
  ];

  const navItems = userType === 'business' ? businessNavItems : clientNavItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom pb-1 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive(item.path)
              ? (userType === 'business' ? 'text-black' : 'text-accent')
              : 'text-slate-400'
              }`}
          >
            {item.highlight ? (
              <div className={`${userType === 'business' ? 'bg-black' : 'bg-primary'} rounded-full p-2.5 -mt-6 shadow-lg border-4 border-slate-50`}>
                <item.icon size={24} className="text-white" />
              </div>
            ) : (
              <item.icon size={22} />
            )}
            <span className={`text-[10px] font-medium ${item.highlight ? 'mt-1' : ''}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};