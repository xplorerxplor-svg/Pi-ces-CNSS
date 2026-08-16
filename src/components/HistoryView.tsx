import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Download, 
  ArrowRight, 
  Trash2,
  Calendar,
  User,
  Eye
} from 'lucide-react';
import { DocumentAnalysisResult, ValidationStatus, DocumentType } from '../types.js';

interface HistoryViewProps {
  onSelectDocument: (doc: DocumentAnalysisResult) => void;
  onRefreshStats?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onSelectDocument,
  onRefreshStats
}) => {
  const [documents, setDocuments] = useState<DocumentAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(`Confirmer la suppression du document ${id} ?`)) {
      try {
        await fetch(`/api/documents/${id}`, { method: 'DELETE' });
        setDocuments(prev => prev.filter(d => d.id !== id));
        onRefreshStats?.();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredDocs = documents.filter(doc => {
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && doc.documentType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = doc.id.toLowerCase().includes(q);
      const matchType = doc.documentTypeLabel.toLowerCase().includes(q);
      const matchReason = doc.primaryReason.toLowerCase().includes(q);
      const matchAgent = doc.agentName.toLowerCase().includes(q);
      const matchField = doc.extractedFields.some(f => f.value.toLowerCase().includes(q));
      return matchId || matchType || matchReason || matchAgent || matchField;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Type Document', 'Statut', 'Confiance', 'Motif / Justification', 'Agent'];
    const rows = filteredDocs.map(d => [
      d.id,
      new Date(d.createdAt).toLocaleString('fr-FR'),
      d.documentTypeLabel,
      d.status,
      `${Math.round(d.overallConfidence * 100)}%`,
      `"${d.primaryReason.replace(/"/g, '""')}"`,
      d.agentName
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Historique_Controle_DocCheck_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50 flex flex-col gap-6">
      
      {/* HEADER & FILTRES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Historique des Contrôles & Dossiers
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consultez les analyses d'IA, les scores de confiance et l'historique d'arbitrage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter CSV
          </button>
          <button
            onClick={fetchDocuments}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-200 transition-colors"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* BARRE DE RECHERCHE ET FILTRES */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        
        {/* Recherche texte */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par n° de dossier, nom de l'élève, entreprise, motif..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Filtre Statut */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="VALIDE">✓ Validés uniquement</option>
            <option value="VERIFICATION_REQUISE">⚠ Vérification humaine requise</option>
            <option value="NON_VALIDE">✕ Rejetés / Non conformes</option>
          </select>
        </div>

        {/* Filtre Type Document */}
        <div className="sm:col-span-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tous les types</option>
            <option value="CERTIFICAT_SCOLARITE">Certificat de Scolarité</option>
            <option value="CERTIFICAT_TRAVAIL">Certificat de Travail</option>
            <option value="CERTIFICAT_VIE_CHARGE">Certificat de Vie et Charge</option>
          </select>
        </div>

      </div>

      {/* TABLEAU DES DOCUMENTS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Chargement de l'historique...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Aucun document ne correspond à vos critères de recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">ID & Date</th>
                  <th className="py-3.5 px-4">Type Document</th>
                  <th className="py-3.5 px-4">Titulaire / Extrait</th>
                  <th className="py-3.5 px-4">Statut Décision</th>
                  <th className="py-3.5 px-4">Score IA</th>
                  <th className="py-3.5 px-4">Agent</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map(doc => {
                  const mainPersonField = doc.extractedFields.find(f => 
                    f.key === 'student_name' || f.key === 'employee_name' || f.key === 'guardian_name'
                  );

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => onSelectDocument(doc)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* ID & Date */}
                      <td className="py-3.5 px-6">
                        <div className="font-mono font-bold text-slate-900">{doc.id}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR')} {new Date(doc.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Type Document */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">
                          {doc.documentTypeLabel}
                        </span>
                      </td>

                      {/* Titulaire */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {mainPersonField?.value || 'Non renseigné'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">
                          {doc.primaryReason}
                        </div>
                      </td>

                      {/* Statut Décision */}
                      <td className="py-3.5 px-4">
                        {doc.status === 'VALIDE' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            Validé
                          </span>
                        )}
                        {doc.status === 'VERIFICATION_REQUISE' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3" />
                            À vérifier
                          </span>
                        )}
                        {doc.status === 'NON_VALIDE' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            <XCircle className="w-3 h-3" />
                            Non validé
                          </span>
                        )}
                      </td>

                      {/* Score IA */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                          doc.overallConfidence >= 0.88 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : doc.overallConfidence >= 0.70 
                            ? 'bg-amber-100 text-amber-800 border-amber-200' 
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          {Math.round(doc.overallConfidence * 100)}%
                        </span>
                      </td>

                      {/* Agent */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{doc.agentName}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDocument(doc);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-md transition-colors"
                            title="Inspecter le dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, doc.id)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
