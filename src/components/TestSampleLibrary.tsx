import React from 'react';
import { 
  FileCheck2, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Layers,
  Sparkles
} from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDocDefinition } from '../lib/sampleDocuments.js';

interface TestSampleLibraryProps {
  onRunSample: (sample: SampleDocDefinition) => void;
}

export const TestSampleLibrary: React.FC<TestSampleLibraryProps> = ({
  onRunSample
}) => {
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50 flex flex-col gap-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
            Bibliothèque d'Échantillons & Scénarios de Test
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Testez instantanément le pipeline OCR, la détection de signature et les règles métier sur des cas types.
          </p>
        </div>
      </div>

      {/* GRILLE D'ÉCHANTILLONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAMPLE_DOCUMENTS.map((sample) => (
          <div
            key={sample.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-all group"
          >
            <div>
              {/* Badge & Titre */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    sample.expectedResult === 'VALIDE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : sample.expectedResult === 'VERIFICATION_REQUISE'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {sample.badge}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">
                    {sample.title}
                  </h3>
                </div>
              </div>

              {/* Description */}
              <div className="p-5 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {sample.description}
                </p>

                <div className="text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-slate-500 font-medium">
                  <span>Résultat attendu :</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {sample.expectedResult}
                  </span>
                </div>
              </div>
            </div>

            {/* Bouton de test */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => onRunSample(sample)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-blue-200 transition-colors cursor-pointer group-hover:scale-[1.02]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Lancer le Test & Contrôle IA
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
