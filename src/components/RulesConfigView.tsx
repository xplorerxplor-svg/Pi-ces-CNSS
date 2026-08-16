import React, { useState } from 'react';
import { 
  Sliders, 
  Save, 
  CheckCircle2, 
  GraduationCap, 
  Briefcase, 
  Users, 
  Shield, 
  Clock,
  Sparkles
} from 'lucide-react';
import { RuleConfiguration, UserProfile } from '../types.js';

interface RulesConfigViewProps {
  config: RuleConfiguration;
  onUpdateConfig: (newConfig: RuleConfiguration) => Promise<void>;
  currentUser: UserProfile;
}

export const RulesConfigView: React.FC<RulesConfigViewProps> = ({
  config: initialConfig,
  onUpdateConfig,
  currentUser
}) => {
  const [formData, setFormData] = useState<RuleConfiguration>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Seuls les utilisateurs ayant le rôle ADMINISTRATEUR peuvent modifier les règles métier.');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateConfig(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde de la configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50 flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-500" />
            Paramétrage Dynamique des Règles Métier
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajustez les critères d'évaluation, les années scolaires et les seuils d'acceptation sans recompiler l'application.
          </p>
        </div>

        {!isAdmin && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Mode Consultation (Connectez-vous en Admin pour éditer)
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Règles métier mises à jour avec succès et synchronisées sur l'ensemble des postes agents.
        </div>
      )}

      {/* FORMULAIRE DES RÈGLES */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* 1. RÈGLES CERTIFICAT DE SCOLARITÉ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Type 1 — Certificat de Scolarité
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Année Scolaire de Référence à Contrôler :
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.schoolCert.targetSchoolYear}
                  onChange={(e) => setFormData({
                    ...formData,
                    schoolCert: { ...formData.schoolCert, targetSchoolYear: e.target.value }
                  })}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: 2026-2027"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  L'IA compare strictement cette valeur avec l'année inscrite sur le document.
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={formData.schoolCert.requireDirectorSignature}
                    onChange={(e) => setFormData({
                      ...formData,
                      schoolCert: { ...formData.schoolCert, requireDirectorSignature: e.target.checked }
                    })}
                    className="rounded text-blue-600"
                  />
                  <span>Signature ou cachet de la direction obligatoire</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={formData.schoolCert.requireClass}
                    onChange={(e) => setFormData({
                      ...formData,
                      schoolCert: { ...formData.schoolCert, requireClass: e.target.checked }
                    })}
                    className="rounded text-blue-600"
                  />
                  <span>Mention de la classe obligatoire</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RÈGLES CERTIFICAT DE TRAVAIL */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Type 2 — Certificat de Travail Trimestriel
            </h3>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Trimestre Cible à Contrôler :
                </label>
                <select
                  disabled={!isAdmin}
                  value={formData.workCert.targetQuarter}
                  onChange={(e) => setFormData({
                    ...formData,
                    workCert: { ...formData.workCert, targetQuarter: e.target.value as any }
                  })}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="T1">1er trimestre (Janvier - Février - Mars)</option>
                  <option value="T2">2e trimestre (Avril - Mai - Juin)</option>
                  <option value="T3">3e trimestre (Juillet - Août - Septembre)</option>
                  <option value="T4">4e trimestre (Octobre - Novembre - Décembre)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Détection automatique des mois présents et alerte si un mois manque.
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={formData.workCert.requireAllQuarterMonths}
                    onChange={(e) => setFormData({
                      ...formData,
                      workCert: { ...formData.workCert, requireAllQuarterMonths: e.target.checked }
                    })}
                    className="rounded text-emerald-600"
                  />
                  <span>Exiger les 3 mois complets du trimestre</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={formData.workCert.requireWorkHours}
                    onChange={(e) => setFormData({
                      ...formData,
                      workCert: { ...formData.workCert, requireWorkHours: e.target.checked }
                    })}
                    className="rounded text-emerald-600"
                  />
                  <span>Mention explicite des heures travaillées obligatoire</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={formData.workCert.requireEmployerSignature}
                    onChange={(e) => setFormData({
                      ...formData,
                      workCert: { ...formData.workCert, requireEmployerSignature: e.target.checked }
                    })}
                    className="rounded text-emerald-600"
                  />
                  <span>Signature de l'employeur / DRH requise</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 3. RÈGLES CERTIFICAT DE VIE ET DE CHARGE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Type 3 — Certificat de Vie et de Charge
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={formData.lifeCert.requireGuardianName}
                  onChange={(e) => setFormData({
                    ...formData,
                    lifeCert: { ...formData.lifeCert, requireGuardianName: e.target.checked }
                  })}
                  className="rounded text-indigo-600"
                />
                <span>Nom du parent ou tuteur obligatoire</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={formData.lifeCert.requireDependents}
                  onChange={(e) => setFormData({
                    ...formData,
                    lifeCert: { ...formData.lifeCert, requireDependents: e.target.checked }
                  })}
                  className="rounded text-indigo-600"
                />
                <span>Recensement des enfants / personnes à charge obligatoire</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={formData.lifeCert.requireSignature}
                  onChange={(e) => setFormData({
                    ...formData,
                    lifeCert: { ...formData.lifeCert, requireSignature: e.target.checked }
                  })}
                  className="rounded text-indigo-600"
                />
                <span>Signature manuscrite obligatoire</span>
              </label>
            </div>
          </div>
        </div>

        {/* 4. SEUILS DE CONFIANCE & SÉCURITÉ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Seuils de Décision Automatique & Confidentialité
            </h3>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Seuil Haute Confiance (Validation Auto) :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1.0"
                  disabled={!isAdmin}
                  value={formData.highConfidenceThreshold}
                  onChange={(e) => setFormData({
                    ...formData,
                    highConfidenceThreshold: parseFloat(e.target.value) || 0.90
                  })}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
                <span className="text-xs font-bold text-slate-500 font-mono">
                  {Math.round(formData.highConfidenceThreshold * 100)}%
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Seuil Moyen (Vérification Humaine) :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.4"
                  max="0.89"
                  disabled={!isAdmin}
                  value={formData.mediumConfidenceThreshold}
                  onChange={(e) => setFormData({
                    ...formData,
                    mediumConfidenceThreshold: parseFloat(e.target.value) || 0.70
                  })}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
                <span className="text-xs font-bold text-slate-500 font-mono">
                  {Math.round(formData.mediumConfidenceThreshold * 100)}%
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Purge Automatique des Images (RGPD) :
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  disabled={!isAdmin}
                  value={formData.autoPurgeImagesDays}
                  onChange={(e) => setFormData({
                    ...formData,
                    autoPurgeImagesDays: parseInt(e.target.value, 10) || 30
                  })}
                  className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
                <span className="text-xs text-slate-500 shrink-0">jours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-200 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Enregistrement des règles...' : 'Enregistrer les Règles Métier'}
            </button>
          </div>
        )}

      </form>

    </div>
  );
};
