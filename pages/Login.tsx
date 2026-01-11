import React, { useState } from 'react';
import { Button } from '../components/Button';
import { TabGroup } from '../components/TabGroup';
import { Building2, Lock, User, ArrowRight, Briefcase, HardHat, Mail } from 'lucide-react';
import { supabase } from '../src/supabase';

interface LoginProps {
  onLogin: (user: string, type: 'client' | 'business') => void;
}

type UserType = 'client' | 'business';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<UserType>('client');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              user_type: userType,
            },
          },
        });

        if (error) throw error;

        setSuccessMessage('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar (se necessário) ou faça login.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Get user type from metadata if available, otherwise default to selected
          const type = data.user.user_metadata?.user_type || userType;
          onLogin(data.user.email?.split('@')[0] || 'Usuário', type);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isClient = userType === 'client';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-white transition-colors duration-500 bg-primary`}>
      <div className="w-full max-w-md space-y-6">

        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg transition-colors duration-300 ${isClient ? 'bg-accent shadow-accent/20' : 'bg-white shadow-slate-200'}`}>
            {isClient ? <Building2 size={40} className="text-white" /> : <Briefcase size={40} className="text-black" />}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            ObraControl <span className={isClient ? 'text-accent' : 'text-slate-400'}>{isClient ? 'AI' : 'Business'}</span>
          </h1>
          <p className="text-slate-400">
            {isClient
              ? 'Gerencie suas obras com inteligência.'
              : 'Aumente suas vendas. Atualize preços em tempo real.'}
          </p>
        </div>

        {/* Type Toggle */}
        <TabGroup
          tabs={[
            { id: 'client', label: 'Sou Cliente', icon: HardHat },
            { id: 'business', label: 'Sou Empresário', icon: Briefcase },
          ]}
          activeTab={userType}
          onChange={(id) => setUserType(id as UserType)}
          variant="dark"
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/50 p-8 rounded-2xl border border-slate-800">
          <div className="space-y-4">

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-sm text-center">
                {successMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                {isClient ? 'E-mail' : 'E-mail da Loja'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-600" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg leading-5 bg-primary text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm transition duration-150 ease-in-out"
                  placeholder={isClient ? "seu@email.com" : "contato@sualoja.com"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-600" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-lg leading-5 bg-primary text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent sm:text-sm transition duration-150 ease-in-out"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            variant="primary"
            disabled={loading}
            className="flex items-center justify-center font-bold text-lg h-12"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? 'Criar Conta' : 'Entrar'} <ArrowRight className="ml-2" />
              </>
            )}
          </Button>

          <div className="text-center text-sm text-slate-500 space-y-1">
            <p>
              {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccessMessage(null); }}
                className="ml-2 text-accent hover:underline font-bold focus:outline-none"
              >
                {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
              </button>
            </p>

            {!isSignUp && (
              <p>
                <a href="#" className="text-xs text-slate-400 hover:text-white transition-colors">
                  Esqueceu sua senha?
                </a>
              </p>
            )}
          </div>
        </form>

        <div className="text-center text-xs text-slate-600 mt-4 border-t border-slate-800 pt-4">
          <p>Versão 1.1.0 (Marketplace Beta)</p>
        </div>
      </div>
    </div>
  );
};

export default Login;