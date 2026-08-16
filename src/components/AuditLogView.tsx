import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Clock, 
  FileText, 
  User, 
  Lock,
  Calendar
} from 'lucide-react';
import { AuditLogEntry } from '../types.js';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.agentName.toLowerCase().includes(q) ||
      (log.documentId && log.documentId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50 flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-600" />
            Journal d'Audit Légal & Traçabilité RGPD
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique certifié et immuable de l'ensemble des opérations, analyses IA et arbitrages humains.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-bold">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          Chiffrement SQLCipher / TLS 1.3
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par action, nom d'opérateur, n° de document..."
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* LISTE DES LOGS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium">
            Chargement du journal d'audit...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Aucun log d'audit répertorié.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Date & Heure</th>
                  <th className="py-3 px-4">Opérateur / Agent</th>
                  <th className="py-3 px-4">Action Enregistrée</th>
                  <th className="py-3 px-4">Dossier Lié</th>
                  <th className="py-3 px-6">Détails de l'Événement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-6 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-800">
                      {log.agentName} ({log.agentId})
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-blue-600 font-bold">
                      {log.documentId || '—'}
                    </td>
                    <td className="py-3 px-6 text-slate-600 truncate max-w-xs font-sans">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
