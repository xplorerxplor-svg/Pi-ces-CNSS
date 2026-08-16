import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  MessageSquare, 
  Edit3, 
  ShieldAlert,
  UserCheck
} from 'lucide-react';
import { DocumentAnalysisResult, ManualDecisionType, UserProfile } from '../types.js';

interface ManualValidationModalProps {
  document: DocumentAnalysisResult;
  currentUser: UserProfile;
  onClose: () => void;
  onConfirm: (decision: {
    type: ManualDecisionType;
    comment: string;
    decidedBy: string;
    editedFields: Record<string, string>;
  }) => Promise<void>;
}

export const ManualValidationModal: React.FC<ManualValidationModalProps> = ({
  document: doc,
  currentUser,
  onClose,
  onConfirm
}) => {
  const [decisionType, setDecisionType] = useState<ManualDecisionType>(
    doc.status === 'VALIDE' ? 'CONFIRMED_VALID' : 'OVERRIDDEN_REJECTED'
  );
  const [comment, setComment] = useState<string>('');
  const [editedFields, setEditedFields] = useState<Record<string, string>>(
    doc.extractedFields.reduce((acc, f) => ({ ...acc, [f.key]: f.value }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (key: string, value: string) => {
    setEditedFields(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && decisionType !== 'CONFIRMED_VALID') {
      alert('Veuillez renseigner un commentaire explicatif pour motiver votre décision.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        type: decisionType,
        comment: comment.trim() || 'Validation manuelle confirmée conforme par l\'opérateur.',
        decidedBy: currentUser.name,
        editedFields
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'enregistrement de l\'arbitrage.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Arbitrage & Décision de l'Agent
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">Dossier {doc.id} — {doc.documentTypeLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Choix de la décision */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Verdict de l'Agent Opérateur
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Option Valider */}
              <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${
                decisionType === 'CONFIRMED_VALID'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Valider
                  </span>
                  <input
                    type="radio"
                    name="decisionType"
                    checked={decisionType === 'CONFIRMED_VALID'}
                    onChange={() => setDecisionType('CONFIRMED_VALID')}
                    className="text-emerald-600"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  Document conforme après revue humaine
                </span>
              </label>

              {/* Option Rejeter */}
              <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${
                decisionType === 'OVERRIDDEN_REJECTED'
                  ? 'border-rose-500 bg-rose-50/50 text-rose-900 ring-2 ring-rose-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Rejeter
                  </span>
                  <input
                    type="radio"
                    name="decisionType"
                    checked={decisionType === 'OVERRIDDEN_REJECTED'}
                    onChange={() => setDecisionType('OVERRIDDEN_REJECTED')}
                    className="text-rose-600"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  Refus pour non-conformité avérée
                </span>
              </label>

              {/* Option Demander nouveau document */}
              <label className={`flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all ${
                decisionType === 'RESUBMIT_REQUESTED'
                  ? 'border-amber-500 bg-amber-50/50 text-amber-900 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <RefreshCw className="w-4 h-4 text-amber-600" />
                    Re-capture
                  </span>
                  <input
                    type="radio"
                    name="decisionType"
                    checked={decisionType === 'RESUBMIT_REQUESTED'}
                    onChange={() => setDecisionType('RESUBMIT_REQUESTED')}
                    className="text-amber-600"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1">
                  Demander un nouveau cliché plus net
                </span>
              </label>

            </div>
          </div>

          {/* Rectification manuelle des champs OCR mal reconnus */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                Rectification manuelle des champs extraits
              </label>
              <span className="text-[10px] text-slate-400">Corrigez si nécessaire</span>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
              {doc.extractedFields.map(field => (
                <div key={field.key} className="grid grid-cols-12 gap-2 items-center text-xs">
                  <label className="col-span-4 font-semibold text-slate-600 truncate" title={field.label}>
                    {field.label} :
                  </label>
                  <input
                    type="text"
                    value={editedFields[field.key] ?? field.value}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="col-span-8 px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Commentaire obligatoire ou motivé */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              Motif & Justification de la décision
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Indiquez les raisons de votre décision ou les anomalies constatées..."
              rows={3}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          {/* Footer Modal */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              Opérateur : <span className="font-semibold text-slate-700">{currentUser.name}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-200 transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Confirmer la Décision'
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
