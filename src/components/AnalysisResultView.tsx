import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RotateCcw, 
  UserCheck, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Download, 
  Clock, 
  Info,
  PenTool,
  Check,
  X,
  HelpCircle
} from 'lucide-react';
import { DocumentAnalysisResult, ExtractedField } from '../types.js';

interface AnalysisResultViewProps {
  document: DocumentAnalysisResult;
  onRetake: () => void;
  onOpenManualValidation: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  document: doc,
  onRetake,
  onOpenManualValidation
}) => {
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [activeHoverField, setActiveHoverField] = useState<string | null>(null);

  // Détermination du style de statut
  const getStatusBadge = () => {
    switch (doc.status) {
      case 'VALIDE':
        return (
          <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>DOCUMENT CONFORME / VALIDÉ</span>
          </div>
        );
      case 'VERIFICATION_REQUISE':
        return (
          <div className="flex items-center gap-1.5 text-amber-600 text-sm font-bold bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>VÉRIFICATION HUMAINE REQUISE</span>
          </div>
        );
      case 'NON_VALIDE':
        return (
          <div className="flex items-center gap-1.5 text-rose-600 text-sm font-bold bg-rose-50 px-3 py-1 rounded-md border border-rose-200">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>DOCUMENT NON CONFORME / REJETÉ</span>
          </div>
        );
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.88) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (conf >= 0.70) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  const exportReportJSON = () => {
    const jsonStr = JSON.stringify(doc, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `Rapport_Analyse_${doc.id}.json`;
    a.click();
  };

  return (
    <div className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto bg-slate-50 flex flex-col gap-4 sm:gap-6">
      
      {/* HEADER RAPPORT & ACTIONS SUPÉRIEURES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onRetake}
            className="p-2.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition-colors shadow-xs cursor-pointer"
            title="Revenir au scanner"
            aria-label="Revenir"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Numéro de Dossier : {doc.id}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Résultat du Contrôle Automatique IA
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={exportReportJSON}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
          <button
            onClick={onOpenManualValidation}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-lg text-xs font-bold shadow-md shadow-blue-200 transition-all cursor-pointer min-h-[40px]"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Arbitrage Manuel</span>
          </button>
        </div>
      </div>

      {/* DÉCISION MANUELLE EXISTANTE (SI ARBITRÉ) */}
      {doc.manualDecision && (
        <div className="p-3.5 sm:p-4 bg-purple-50 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              OK
            </div>
            <div>
              <div className="text-xs font-bold text-purple-900 uppercase">
                Décision Manuelle de l'Agent ({doc.manualDecision.type})
              </div>
              <div className="text-xs sm:text-sm text-purple-800 mt-0.5">
                "{doc.manualDecision.comment}" — Validé par <span className="font-semibold">{doc.manualDecision.decidedBy}</span>
              </div>
            </div>
          </div>
          <span className="text-[11px] text-purple-600 font-mono self-end sm:self-auto">
            {new Date(doc.manualDecision.decidedAt).toLocaleTimeString('fr-FR')}
          </span>
        </div>
      )}

      {/* SECTION PRINCIPALE : 2 COLONNES (8 + 4 sur grand écran, empilées sur mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* COLONNE GAUCHE (Col 8) : RAPPORT D'EXTRACTION & MOTEUR DE RÈGLES */}
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            
            {/* Titre carte */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-xs sm:text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                Rapport d'Extraction IA & Données Structurées
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {new Date(doc.createdAt).toLocaleTimeString('fr-FR')}
              </span>
            </div>

            {/* Corps carte : Champs extraits */}
            <div className="p-4 sm:p-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 sm:gap-y-4">
                
                {/* Type de Document */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Type de Document Détecté
                  </label>
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center justify-between bg-slate-50 p-2 sm:p-2.5 rounded border border-slate-100">
                    <span className="truncate mr-2">{doc.documentTypeLabel}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono font-bold shrink-0">
                      {Math.round(doc.typeConfidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Statut de Validation */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Verdict du Moteur de Règles
                  </label>
                  <div>{getStatusBadge()}</div>
                </div>

                {/* Séparateur */}
                <div className="col-span-1 sm:col-span-2 h-px bg-slate-100 my-1"></div>

                {/* Champs extraits dynamiques */}
                {doc.extractedFields.map(field => (
                  <div 
                    key={field.key} 
                    className={`flex flex-col gap-1 transition-all rounded p-1 ${
                      activeHoverField === field.key ? 'bg-blue-50/80 ring-1 ring-blue-300' : ''
                    }`}
                    onMouseEnter={() => setActiveHoverField(field.key)}
                    onMouseLeave={() => setActiveHoverField(null)}
                  >
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                      <span className="truncate">{field.label}</span>
                      {field.note && (
                        <span className="text-[9px] text-purple-600 font-semibold lowercase shrink-0">
                          ({field.note})
                        </span>
                      )}
                    </label>
                    <div className={`flex items-center justify-between text-xs sm:text-sm p-2 sm:p-2.5 rounded border ${
                      field.status === 'invalid'
                        ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                        : field.status === 'warning'
                        ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-100 text-slate-900'
                    }`}>
                      <span className="font-semibold truncate mr-2">{field.value || 'Non renseigné'}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold font-mono shrink-0 border ${getConfidenceColor(field.confidence)}`}>
                        {Math.round(field.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}

                {/* Signature détectée */}
                <div className="col-span-1 sm:col-span-2 flex flex-col gap-1 mt-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Détection de Signature Manuscrite
                  </label>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border gap-1.5 ${
                    doc.signature.detected 
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                      : 'bg-rose-50/50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                      <PenTool className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>
                        {doc.signature.detected ? 'SIGNATURE DÉTECTÉE ✓' : 'SIGNATURE ABSENTE ✕'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 italic sm:text-right">
                      {doc.signature.disclaimer}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* MOTEUR DE RÈGLES : CRITÈRES MÉTIER */}
            <div className="p-4 sm:p-6 bg-slate-50/70 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Détail des Critères Métier Déterministes</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {doc.criteria.length} contrôles exécutés
                </span>
              </div>

              <div className="space-y-2">
                {doc.criteria.map(crit => (
                  <div
                    key={crit.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5 shrink-0">
                        {crit.status === 'PASS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : crit.status === 'FAIL' ? (
                          <XCircle className="w-4 h-4 text-rose-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                          <span>{crit.title}</span>
                          {crit.mandatory && (
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-normal">
                              Obligatoire
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 break-words">{crit.message}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0 font-mono ${
                      crit.status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800'
                        : crit.status === 'FAIL'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {crit.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pied de carte : Motif & Actions */}
            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="text-xs sm:text-sm text-slate-600">
                <span className="font-bold text-slate-800">Synthèse décisionnelle : </span>
                <span>{doc.primaryReason}</span>
              </div>
              <div className="flex gap-2.5 shrink-0">
                <button
                  onClick={onRetake}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer min-h-[40px]"
                >
                  REPRENDRE PHOTO
                </button>
                <button
                  onClick={onOpenManualValidation}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors cursor-pointer min-h-[40px]"
                >
                  VALIDATION MANUELLE
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* COLONNE DROITE (Col 4) : APERÇU DOCUMENT AVEC OVERLAYS + SCORES */}
        <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
          
          {/* Carte Aperçu & Bounding Boxes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Aperçu Document & Zones OCR
              </label>
              <button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                {showBoundingBoxes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {showBoundingBoxes ? 'Masquer boîtes' : 'Afficher boîtes'}
              </button>
            </div>

            <div className="aspect-[3/4] max-h-[380px] sm:max-h-[440px] bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center border border-slate-800 select-none">
              {doc.imageThumbnail ? (
                <div className="relative w-full h-full">
                  <img
                    src={doc.imageThumbnail}
                    alt="Document analysé"
                    className="w-full h-full object-contain"
                  />

                  {/* Boîtes englobantes interactives sur l'image */}
                  {showBoundingBoxes && (
                    <div className="absolute inset-0 pointer-events-none">
                      {doc.extractedFields.map((field) => {
                        if (!field.boundingBox) return null;
                        const isHovered = activeHoverField === field.key;
                        const box = field.boundingBox;

                        return (
                          <div
                            key={field.key}
                            style={{
                              left: `${box.x}%`,
                              top: `${box.y}%`,
                              width: `${box.width}%`,
                              height: `${box.height}%`
                            }}
                            className={`absolute border-2 rounded transition-all pointer-events-auto cursor-pointer ${
                              isHovered
                                ? 'border-blue-500 bg-blue-500/25 ring-2 ring-blue-300'
                                : field.status === 'invalid'
                                ? 'border-rose-500 bg-rose-500/10'
                                : field.status === 'warning'
                                ? 'border-amber-500 bg-amber-500/10'
                                : 'border-emerald-500 bg-emerald-500/10'
                            }`}
                            onMouseEnter={() => setActiveHoverField(field.key)}
                            onMouseLeave={() => setActiveHoverField(null)}
                            title={`${field.label}: ${field.value} (${Math.round(field.confidence * 100)}%)`}
                          >
                            <span className="absolute -top-4 left-0 text-[8px] font-bold bg-slate-900/90 text-white px-1 rounded shadow truncate max-w-[120px]">
                              {box.label || field.label}
                            </span>
                          </div>
                        );
                      })}

                      {/* Boîte englobante de la Signature */}
                      {doc.signature.boundingBox && (
                        <div
                          style={{
                            left: `${doc.signature.boundingBox.x}%`,
                            top: `${doc.signature.boundingBox.y}%`,
                            width: `${doc.signature.boundingBox.width}%`,
                            height: `${doc.signature.boundingBox.height}%`
                          }}
                          className="absolute border-2 border-dashed border-purple-500 bg-purple-500/15 rounded pointer-events-auto"
                          title="Zone de Signature identifiée"
                        >
                          <span className="absolute -top-4 right-0 text-[8px] font-bold bg-purple-900 text-purple-200 px-1 rounded shadow">
                            Signature
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-xs">Aperçu non disponible</div>
              )}

              {/* Badges de contrôle sur l'image */}
              <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                QUALITÉ : {doc.quality.overallQuality}
              </div>
              <div className="absolute bottom-2.5 left-2.5 text-white text-[9px] font-mono bg-slate-900/80 px-2 py-0.5 rounded">
                PROCESSED AT {new Date(doc.createdAt).toLocaleTimeString('fr-FR')}
              </div>
            </div>
          </div>

          {/* Jauges de confiance & Intégrité */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col gap-3.5 sm:gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase">
                Score de Confiance Global
              </span>
              <span className={`text-base sm:text-lg font-black ${
                doc.overallConfidence >= 0.88 ? 'text-emerald-600' : doc.overallConfidence >= 0.70 ? 'text-amber-500' : 'text-rose-600'
              }`}>
                {Math.round(doc.overallConfidence * 100)}%
              </span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  doc.overallConfidence >= 0.88 ? 'bg-emerald-500' : doc.overallConfidence >= 0.70 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${doc.overallConfidence * 100}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="p-2.5 sm:p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Lisibilité OCR</div>
                <div className="text-base sm:text-lg font-bold text-slate-700">
                  {doc.quality.sharpnessScore}%
                </div>
              </div>
              <div className="p-2.5 sm:p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Cadrage</div>
                <div className="text-base sm:text-lg font-bold text-slate-700">
                  {doc.quality.framingScore}%
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
              <span className="font-semibold text-slate-700">Traçabilité : </span>
              Analysé par <span className="font-medium text-slate-800">{doc.agentName}</span> ({doc.agentId}). Toutes les actions sont archivées dans le journal d'audit conforme RGPD.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
