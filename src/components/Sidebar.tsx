import React from 'react';
import { 
  Camera, 
  History, 
  Sliders, 
  BarChart3, 
  FileText, 
  ShieldCheck, 
  CheckCircle2,
  FileCheck2
} from 'lucide-react';

export type ActiveTab = 
  | 'scanner' 
  | 'history' 
  | 'dashboard' 
  | 'rules' 
  | 'samples' 
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingHumanCheckCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingHumanCheckCount
}) => {
  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800 select-none shrink-0 h-full">
      {/* Brand Header */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xl shadow-sm">
          D
        </div>
        <div className="flex flex-col">
          <span className="text-white font-semibold tracking-tight uppercase text-sm flex items-center gap-1.5">
            DocCheck AI <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded border border-blue-400/30">PRO</span>
          </span>
          <span className="text-[11px] text-slate-400 font-normal">Contrôle Documentaire IA</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Contrôle & Analyse
        </div>

        <button
          onClick={() => setActiveTab('scanner')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-left text-sm font-medium ${
            activeTab === 'scanner'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <Camera className="w-4 h-4 text-blue-400" />
            <span>Scanner / Importer</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors text-left text-sm font-medium ${
            activeTab === 'history'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <History className="w-4 h-4 text-slate-400" />
            <span>Historique & Décisions</span>
          </div>
          {pendingHumanCheckCount > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">
              {pendingHumanCheckCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('samples')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left text-sm font-medium ${
            activeTab === 'samples'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-emerald-400" />
          <span>Échantillons de Test</span>
        </button>

        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2">
          Administration & Système
        </div>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left text-sm font-medium ${
            activeTab === 'dashboard'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Tableau de Bord</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left text-sm font-medium ${
            activeTab === 'rules'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Paramétrage des Règles</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left text-sm font-medium ${
            activeTab === 'audit'
              ? 'bg-blue-600/15 text-blue-400 border border-blue-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Journal d'Audit (RGPD)</span>
        </button>
      </nav>

      {/* Server Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-[#0B1120]">
        <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              Serveur IA Actif
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
              ONLINE
            </span>
          </div>
          <div className="text-[11px] text-slate-300 font-mono flex items-center justify-between">
            <span>v2.4.0-STABLE</span>
            <span className="text-[10px] text-slate-500">Moteur Déterministe</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
