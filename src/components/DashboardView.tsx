import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  FileCheck, 
  Layers, 
  Calendar,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { DashboardStats } from '../types.js';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-slate-400 text-sm">
        Chargement des métriques...
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50 flex flex-col gap-6">
      
      {/* HEADER DASHBOARD */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Tableau de Bord & Indicateurs de Performance
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Suivi consolidé de l'activité de validation documentaire et de la précision OCR / IA.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          Période : Mois en cours (Août 2026)
        </div>
      </div>

      {/* KPI METRIC CARDS (4 Blocs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Documents */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Total Contrôlés
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{stats.totalDocuments}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>Dossiers traités</span>
            </div>
          </div>
        </div>

        {/* Taux de Conformité */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Taux de Validation
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600">{stats.validationRate}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats.validatedCount} documents conformes
            </div>
          </div>
        </div>

        {/* Vérification Humaine */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vérification Humaine
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600">{stats.humanCheckCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Doutes sur signature / année
            </div>
          </div>
        </div>

        {/* Rejets / Non Conformes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Rejets / Anomalies
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-rose-600">{stats.rejectedCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Critères obligatoires non remplis
            </div>
          </div>
        </div>

      </div>

      {/* SECTION GRAPHIQUES & RÉPARTITIONS */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Répartition par Catégorie de Document */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Répartition par Type de Document
            </h3>
            <span className="text-xs text-slate-400 font-mono">Volume global</span>
          </div>

          <div className="space-y-4 my-auto">
            {/* Certificat Scolarité */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Certificat de Scolarité</span>
                <span>{stats.byType.scolarite} doc(s)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full" 
                  style={{ width: `${stats.totalDocuments > 0 ? (stats.byType.scolarite / stats.totalDocuments) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Certificat Travail */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Certificat de Travail Trimestriel</span>
                <span>{stats.byType.travail} doc(s)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full rounded-full" 
                  style={{ width: `${stats.totalDocuments > 0 ? (stats.byType.travail / stats.totalDocuments) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Certificat Vie et Charge */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Certificat de Vie et de Charge</span>
                <span>{stats.byType.vieCharge} doc(s)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full" 
                  style={{ width: `${stats.totalDocuments > 0 ? (stats.byType.vieCharge / stats.totalDocuments) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Motifs Fréquents de Non-Conformité */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              Causes Fréquentes de Non-Conformité
            </h3>
            <span className="text-xs text-slate-400 font-mono">Alertes IA</span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Année scolaire antérieure ou incohérente
              </div>
              <span className="text-xs font-mono font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded">
                1 anomalie
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Mois manquant dans le trimestre de travail
              </div>
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                1 anomalie
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Signature absente ou non identifiée
              </div>
              <span className="text-xs font-mono font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                1 anomalie
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
