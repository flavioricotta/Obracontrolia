import React from 'react';
import { Button } from '../components/Button';
import { Database, Shield, User, Download, LogOut } from 'lucide-react';

interface SettingsProps {
  onLogout?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const currentUser = localStorage.getItem('obra_user') || 'Usuário Local';

  const handleExport = async () => {
    alert("Os dados agora são salvos na nuvem automaticamente.");
  };

  return (
    <div className="p-4 mb-20 space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Ajustes</h1>
      </header>

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center">
          <div className="bg-slate-100 p-2 rounded-full mr-3">
            <User className="text-slate-500" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-slate-800">Conta</h3>
            <p className="text-sm font-bold text-slate-600">{currentUser}</p>
          </div>
        </div>

        <div className="p-4">
          <Button variant="ghost" fullWidth onClick={onLogout} className="text-red-500 hover:bg-red-50 hover:text-red-600 justify-start px-0">
            <LogOut size={18} className="mr-2" />
            Sair da conta
          </Button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center">
          <Database className="mr-2" size={18} /> Dados & Backup
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Seus dados estão salvos apenas neste dispositivo (Navegador). Faça backups regularmente.
        </p>
        <Button variant="secondary" fullWidth onClick={handleExport}>
          <Download size={18} className="mr-2" />
          Exportar Dados (JSON)
        </Button>
      </section>

      <div className="text-center text-xs text-slate-400 pt-8">
        <p>ObraControl AI v1.0.0</p>
        <p>Feito com React, Tailwind e Dexie.js</p>
      </div>
    </div>
  );
};

export default Settings;