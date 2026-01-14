
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import ProjectList from './pages/ProjectList';
import ProjectDetails from './pages/ProjectDetails';
import ExpenseForm from './pages/ExpenseForm';
import Timeline from './pages/Timeline';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Quotes from './pages/Quotes';
import Calculator from './pages/Calculator';
import ProductCatalog from './pages/business/ProductCatalog';
import StoreProfile from './pages/business/StoreProfile';
import StoreDetails from './pages/StoreDetails';
import Stages from './pages/Stages';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<'client' | 'business'>('client');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const user = localStorage.getItem('obra_user');
    const type = localStorage.getItem('obra_user_type') as 'client' | 'business';

    if (user) {
      setIsAuthenticated(true);
      if (type) setUserType(type);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: string, type: 'client' | 'business') => {
    localStorage.setItem('obra_user', user);
    localStorage.setItem('obra_user_type', type);
    setUserType(type);
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('obra_user');
    localStorage.removeItem('obra_user_type');
    setIsAuthenticated(false);
    navigate('/');
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen pb-20 max-w-lg mx-auto bg-slate-50 shadow-2xl overflow-hidden relative">
      <div className="h-full overflow-y-auto no-scrollbar">
        <Routes>
          {/* Routes Shared or Specific based on Logic */}
          {userType === 'client' ? (
            <>
              <Route path="/" element={<ProjectList />} />
              <Route path="/project/:id" element={<ProjectDetails />} />
              <Route path="/project/new" element={<ProjectDetails isNew />} />
              <Route path="/add-expense" element={<ExpenseForm />} />
              <Route path="/edit-expense/:id" element={<ExpenseForm />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/quotes" element={<Quotes />} />
              <Route path="/store/:storeId" element={<StoreDetails />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/stages" element={<Stages />} />
            </>
          ) : (
            <>
              <Route path="/" element={<ProductCatalog />} />
              <Route path="/business/profile" element={<StoreProfile />} />
              <Route path="/business/catalog" element={<ProductCatalog />} />
              <Route path="/business/products/new" element={<ProductCatalog isAdding />} />
              <Route path="/business/orders" element={<div className="p-10 text-center text-slate-500">Módulo de Pedidos em Breve</div>} />
            </>
          )}

          <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
        </Routes>
      </div>
      <Navigation userType={userType} />
    </div>
  );
};

export default App;