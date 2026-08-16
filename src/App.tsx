import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar.js';
import { Header, USERS_LIST } from './components/Header.js';
import { ScannerView } from './components/ScannerView.js';
import { AnalysisResultView } from './components/AnalysisResultView.js';
import { ManualValidationModal } from './components/ManualValidationModal.js';
import { AndroidExportModal } from './components/AndroidExportModal.js';
import { HistoryView } from './components/HistoryView.js';
import { DashboardView } from './components/DashboardView.js';
import { RulesConfigView } from './components/RulesConfigView.js';
import { TestSampleLibrary } from './components/TestSampleLibrary.js';
import { AuditLogView } from './components/AuditLogView.js';
import { Scan, History, BarChart3, Sliders, Layers } from 'lucide-react';
import { DocumentAnalysisResult, ManualDecisionType, RuleConfiguration, UserProfile } from './types.js';
import { SampleDocDefinition } from './lib/sampleDocuments.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [currentResult, setCurrentResult] = useState<DocumentAnalysisResult | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(USERS_LIST[0]);
  const [pendingHumanCheckCount, setPendingHumanCheckCount] = useState(1);
  const [config, setConfig] = useState<RuleConfiguration>({
    id: 'DEFAULT_CONFIG',
    highConfidenceThreshold: 0.90,
    mediumConfidenceThreshold: 0.70,
    autoPurgeImagesDays: 30,
    schoolCert: {
      targetSchoolYear: '2026-2027',
      requireDirectorSignature: true,
      requireClass: true,
      requireEstablishment: true,
      requireStudentName: true
    },
    workCert: {
      targetQuarter: 'T1',
      targetYear: '2026',
      requireAllQuarterMonths: true,
      requireWorkHours: true,
      requireEmployerSignature: true,
      requireEmployeeName: true,
      requireEmployerName: true
    },
    lifeCert: {
      requireGuardianName: true,
      requireDependents: true,
      requireDocumentDate: true,
      requireSignature: true
    }
  });

  // Chargement des règles au démarrage
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/rules');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Erreur chargement configuration:', err);
    }
  };

  const updateHumanCheckBadge = async () => {
    try {
      const res = await fetch('/api/documents?status=VERIFICATION_REQUISE');
      if (res.ok) {
        const docs = await res.json();
        setPendingHumanCheckCount(docs.length);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConfig();
    updateHumanCheckBadge();
  }, []);

  // Gestion de la fin d'analyse
  const handleAnalysisComplete = (result: DocumentAnalysisResult) => {
    setCurrentResult(result);
    updateHumanCheckBadge();
  };

  // Lancement direct depuis la bibliothèque d'échantillons
  const handleRunSample = async (sample: SampleDocDefinition) => {
    const base64 = sample.generateImage();
    try {
      const res = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          sampleId: sample.id,
          documentTypeOverride: sample.category,
          configOverride: config,
          agentName: currentUser.name,
          agentId: currentUser.id
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentResult(data.document);
        setActiveTab('scanner');
        updateHumanCheckBadge();
      }
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'exécution de l\'échantillon.');
    }
  };

  // Arbitrage manuel de l'agent
  const handleConfirmManualDecision = async (decision: {
    type: ManualDecisionType;
    comment: string;
    decidedBy: string;
    editedFields: Record<string, string>;
  }) => {
    if (!currentResult) return;

    const res = await fetch(`/api/documents/${currentResult.id}/manual-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(decision)
    });

    if (res.ok) {
      const data = await res.json();
      setCurrentResult(data.document);
      updateHumanCheckBadge();
    } else {
      throw new Error('Erreur lors de l\'enregistrement de l\'arbitrage.');
    }
  };

  // Mise à jour des règles métier
  const handleUpdateConfig = async (newConfig: RuleConfiguration) => {
    const res = await fetch('/api/rules', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });

    if (res.ok) {
      const data = await res.json();
      setConfig(data.config);
    } else {
      throw new Error('Erreur mise à jour configuration.');
    }
  };

  const getPageTitle = () => {
    if (activeTab === 'scanner') {
      return currentResult ? 'Rapport de Contrôle Documentaire' : 'Analyse Documentaire IA';
    }
    if (activeTab === 'history') return 'Historique des Dossiers & Décisions';
    if (activeTab === 'dashboard') return 'Tableau de Bord & Statistiques';
    if (activeTab === 'rules') return 'Paramétrage des Règles Métier';
    if (activeTab === 'samples') return 'Bibliothèque de Tests & Échantillons';
    if (activeTab === 'audit') return 'Journal d\'Audit & Conformité RGPD';
    return 'DocCheck AI Pro';
  };

  return (
    <div className="flex h-[100dvh] w-screen bg-slate-50 font-sans overflow-hidden text-slate-900">
      
      {/* Sidebar Navigation (Desktop permanent & Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        pendingHumanCheckCount={pendingHumanCheckCount}
        onOpenAndroidExport={() => setIsAndroidModalOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Zone Principale */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Header Applicatif */}
        <Header
          title={getPageTitle()}
          currentUser={currentUser}
          onSwitchUser={(user) => setCurrentUser(user)}
          onOpenAndroidExport={() => setIsAndroidModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isOnline={true}
        />

        {/* Corps de l'onglet actif */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative pb-14 lg:pb-0">
          
          {activeTab === 'scanner' && (
            currentResult ? (
              <AnalysisResultView
                document={currentResult}
                onRetake={() => setCurrentResult(null)}
                onOpenManualValidation={() => setIsManualModalOpen(true)}
              />
            ) : (
              <ScannerView
                onAnalysisComplete={handleAnalysisComplete}
                config={config}
              />
            )
          )}

          {activeTab === 'history' && (
            <HistoryView
              onSelectDocument={(doc) => {
                setCurrentResult(doc);
                setActiveTab('scanner');
              }}
              onRefreshStats={updateHumanCheckBadge}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView />
          )}

          {activeTab === 'rules' && (
            <RulesConfigView
              config={config}
              onUpdateConfig={handleUpdateConfig}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'samples' && (
            <TestSampleLibrary
              onRunSample={handleRunSample}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView />
          )}

        </main>

        {/* Barre de navigation basse pour Smartphones / Tablettes */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-[#0F172A] border-t border-slate-800 flex items-center justify-around px-2 z-30 select-none shadow-lg">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'scanner' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scan className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors relative cursor-pointer ${
              activeTab === 'history' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Dossiers</span>
            {pendingHumanCheckCount > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'samples' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Échantillons</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Stats</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Menu</span>
          </button>
        </div>

      </div>

      {/* Modal d'arbitrage manuel */}
      {isManualModalOpen && currentResult && (
        <ManualValidationModal
          document={currentResult}
          currentUser={currentUser}
          onClose={() => setIsManualModalOpen(false)}
          onConfirm={handleConfirmManualDecision}
        />
      )}

      {/* Modal d'exportation & test Android */}
      <AndroidExportModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

    </div>
  );
}
