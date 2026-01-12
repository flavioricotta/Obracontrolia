import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Database, Shield, User, Download, LogOut, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../src/services/api';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface SettingsProps {
  onLogout?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onLogout }) => {
  const currentUser = localStorage.getItem('obra_user') || 'Usuário Local';
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState('');

  const handleBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress('Coletando dados...');

    try {
      const zip = new JSZip();

      // 1. Get all projects
      setBackupProgress('Buscando projetos...');
      const projects = await api.projects.list();

      // 2. Get all expenses for each project
      setBackupProgress('Buscando gastos...');
      const allExpenses: any[] = [];
      for (const project of projects) {
        const expenses = await api.expenses.list(project.id);
        allExpenses.push(...expenses.map(e => ({ ...e, projectName: project.name })));
      }

      // 3. Create backup data object
      const backupData = {
        exportDate: new Date().toISOString(),
        user: currentUser,
        projects,
        expenses: allExpenses,
        totalProjects: projects.length,
        totalExpenses: allExpenses.length
      };

      // 4. Add JSON file to ZIP
      zip.file('backup_dados.json', JSON.stringify(backupData, null, 2));

      // 5. Download receipt images
      const imagesFolder = zip.folder('comprovantes');
      const imageUrls = allExpenses
        .flatMap(e => e.receiptImages || [])
        .filter(url => url && url.startsWith('http'));

      setBackupProgress(`Baixando ${imageUrls.length} imagens...`);

      let downloadedCount = 0;
      for (const url of imageUrls) {
        try {
          const response = await fetch(url);
          const blob = await response.blob();
          const fileName = url.split('/').pop() || `image_${downloadedCount}.webp`;
          imagesFolder?.file(fileName, blob);
          downloadedCount++;
          setBackupProgress(`Baixando imagens: ${downloadedCount}/${imageUrls.length}`);
        } catch (err) {
          console.warn('Failed to download image:', url);
        }
      }

      // 6. Generate ZIP and download
      setBackupProgress('Gerando arquivo ZIP...');
      const content = await zip.generateAsync({ type: 'blob' });

      const date = new Date().toISOString().split('T')[0];
      saveAs(content, `ObraControl_Backup_${date}.zip`);

      setBackupProgress('Backup concluído!');
      setTimeout(() => {
        setIsBackingUp(false);
        setBackupProgress('');
      }, 2000);

    } catch (error) {
      console.error('Backup error:', error);
      alert('Erro ao criar backup. Tente novamente.');
      setIsBackingUp(false);
      setBackupProgress('');
    }
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
          Baixe um arquivo ZIP com todos os seus projetos, gastos e comprovantes. Você pode salvar no Google Drive, WhatsApp, ou onde preferir.
        </p>

        <Button
          variant="secondary"
          fullWidth
          onClick={handleBackup}
          disabled={isBackingUp}
        >
          {isBackingUp ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              {backupProgress}
            </>
          ) : backupProgress === 'Backup concluído!' ? (
            <>
              <CheckCircle size={18} className="mr-2 text-green-500" />
              Backup concluído!
            </>
          ) : (
            <>
              <Download size={18} className="mr-2" />
              Fazer Backup Completo (ZIP)
            </>
          )}
        </Button>
      </section>

      <div className="text-center text-xs text-slate-400 pt-8">
        <p>ObraControl AI v1.0.0</p>
        <p>Feito com React, Tailwind e Supabase</p>
      </div>
    </div>
  );
};

export default Settings;