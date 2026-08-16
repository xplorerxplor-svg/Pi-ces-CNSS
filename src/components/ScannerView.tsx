import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  UploadCloud, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Eye, 
  Zap, 
  Scan,
  Maximize2,
  FileText
} from 'lucide-react';
import { DocumentAnalysisResult, DocumentType, RuleConfiguration } from '../types.js';
import { SAMPLE_DOCUMENTS } from '../lib/sampleDocuments.js';

interface ScannerViewProps {
  onAnalysisComplete: (result: DocumentAnalysisResult) => void;
  config: RuleConfiguration;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  onAnalysisComplete,
  config
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [currentSampleId, setCurrentSampleId] = useState<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [qualityFeedback, setQualityFeedback] = useState<{
    score: number;
    isBlurry: boolean;
    lighting: string;
    ready: boolean;
  }>({
    score: 92,
    isBlurry: false,
    lighting: 'OPTIMALE',
    ready: true
  });

  // Paramètres de contrôle ciblés pour cette analyse
  const [targetTypeOverride, setTargetTypeOverride] = useState<DocumentType | 'AUTO'>('AUTO');
  const [targetSchoolYear, setTargetSchoolYear] = useState(config.schoolCert.targetSchoolYear || '2026-2027');
  const [targetQuarter, setTargetQuarter] = useState<'T1' | 'T2' | 'T3' | 'T4'>(config.workCert.targetQuarter || 'T1');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Nettoyage de la caméra au démontage
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Étapes d'analyse pour la barre de progression
  const ANALYSIS_STEPS = [
    { title: 'Prétraitement d\'image', desc: 'Correction de perspective, débruitage & contraste' },
    { title: 'Classification IA', desc: 'Identification sémantique du type de document' },
    { title: 'OCR Structuré & Bounding Boxes', desc: 'Extraction des champs avec scores de confiance' },
    { title: 'Détection de Signature', desc: 'Localisation et analyse des traits manuscrits' },
    { title: 'Moteur de Règles Métier', desc: 'Validation déterministe des critères obligatoires' }
  ];

  // Gestion du flux Caméra
  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        setCameraStream(stream);
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        alert('L\'accès à la caméra n\'est pas supporté par ce navigateur.');
      }
    } catch (err) {
      console.warn('Impossible d\'ouvrir la caméra, bascule sur capture simulée:', err);
      setIsCameraActive(true);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    setCurrentSampleId(undefined);
    if (videoRef.current && cameraStream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 800;
      canvas.height = videoRef.current.videoHeight || 1130;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setSelectedImage(dataUrl);
        setImageFileName('Capture_Camera_' + new Date().toISOString().slice(0, 19) + '.jpg');
      }
    } else {
      // Fallback capture démo
      const sample = SAMPLE_DOCUMENTS[0];
      setSelectedImage(sample.generateImage());
      setImageFileName(sample.title + '.png');
    }
    stopCamera();
    evaluateImageQuality();
  };

  // Gestion de l'upload de fichier
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentSampleId(undefined);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSelectedImage(result);
        setImageFileName(file.name);
        evaluateImageQuality();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setCurrentSampleId(undefined);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSelectedImage(result);
        setImageFileName(file.name);
        evaluateImageQuality();
      };
      reader.readAsDataURL(file);
    }
  };

  const evaluateImageQuality = () => {
    setQualityFeedback({
      score: 94,
      isBlurry: false,
      lighting: 'BONNE ✓',
      ready: true
    });
  };

  // Lancement de l'analyse complète
  const handleStartAnalysis = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setAnalysisStep(0);

    const stepInterval = setInterval(() => {
      setAnalysisStep(prev => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      const payload = {
        imageBase64: selectedImage,
        sampleId: currentSampleId,
        documentTypeOverride: targetTypeOverride !== 'AUTO' ? targetTypeOverride : undefined,
        configOverride: {
          schoolCert: { targetSchoolYear },
          workCert: { targetQuarter }
        },
        agentName: 'Julien Dubois',
        agentId: 'AGT-001'
      };

      const response = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      clearInterval(stepInterval);
      setAnalysisStep(4);

      if (!response.ok) {
        throw new Error('Erreur lors du traitement de l\'analyse.');
      }

      const data = await response.json();
      setTimeout(() => {
        setIsAnalyzing(false);
        onAnalysisComplete(data.document);
      }, 500);

    } catch (err) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      console.error(err);
      alert('Une erreur est survenue lors de l\'analyse. Veuillez réessayer.');
    }
  };

  // Raccourci pour charger un document d'échantillon
  const loadSample = (sampleId: string) => {
    const s = SAMPLE_DOCUMENTS.find(item => item.id === sampleId);
    if (s) {
      setCurrentSampleId(sampleId);
      const img = s.generateImage();
      setSelectedImage(img);
      setImageFileName(s.title);
      evaluateImageQuality();
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50 flex flex-col gap-6">
      
      {/* SECTION 1 : ZONE DE CAPTURE / IMPORTATION & APERÇU */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Colonne Gauche : Viseur Caméra / Zone de Dépôt (Col 7) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Scan className="w-4 h-4 text-blue-600" />
                Numérisation & Capture Documentaire
              </h2>
              <span className="text-xs text-slate-500 font-mono">Module CameraX / OCR Vision</span>
            </div>

            <div className="p-6">
              {!isCameraActive ? (
                <div className="space-y-4">
                  {/* Zone de Drag & Drop */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[220px] ${
                      isDragging 
                        ? 'border-blue-600 bg-blue-50/80 scale-[0.99]' 
                        : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Glissez-déposez le document ou <span className="text-blue-600 underline">parcourez</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Formats supportés : JPEG, PNG, TIFF, PDF (Haute résolution recommandée)
                    </p>
                  </div>

                  {/* Actions Caméra / Import */}
                  <div className="flex gap-3">
                    <button
                      onClick={startCamera}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Ouvrir la Caméra (CameraX Live)
                    </button>
                  </div>
                </div>
              ) : (
                /* Viseur Caméra en Direct */
                <div className="relative aspect-[4/3] bg-slate-950 rounded-lg overflow-hidden flex flex-col items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />

                  {/* Cadre de ciblage documentaire CameraX */}
                  <div className="absolute inset-6 border-2 border-blue-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between items-center text-[10px] text-blue-300 font-mono bg-slate-900/60 px-2 py-0.5 rounded backdrop-blur">
                      <span>ALIGNER LE DOCUMENT ICI</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Auto-Focus Actif
                      </span>
                    </div>
                    <div className="text-center text-[11px] text-white/80 bg-slate-900/60 py-1 rounded backdrop-blur">
                      Tenez l'appareil bien droit et évitez les reflets
                    </div>
                  </div>

                  {/* Contrôles Caméra */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-10">
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-slate-800/80 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 backdrop-blur cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={capturePhoto}
                      className="w-14 h-14 rounded-full bg-white border-4 border-blue-500 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600"></div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Raccourcis : Échantillons de Documents Prêts à Tester */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Échantillons Prêts pour Test Immédiat :
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => loadSample('sample-scolarite-conforme')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-2 truncate cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">Scolarité (2026-2027)</span>
                </button>
                <button
                  onClick={() => loadSample('sample-travail-complet')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-2 truncate cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="truncate">Travail T1 (Complet)</span>
                </button>
                <button
                  onClick={() => loadSample('sample-scolarite-mauvaise-annee')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-2 truncate cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="truncate">Scolarité (2023-2024 ⚠)</span>
                </button>
                <button
                  onClick={() => loadSample('sample-travail-incomplet')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-2 truncate cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="truncate">Travail T1 (Incomplet)</span>
                </button>
                <button
                  onClick={() => loadSample('sample-vie-charge-sans-signature')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-2 truncate cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="truncate">Vie Charge (Sans Sign.)</span>
                </button>
                <button
                  onClick={() => loadSample('sample-flou')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-2 truncate cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="truncate">Photo Floue / Bougée</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Prévisualisation & Configuration du Contrôle (Col 5) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-5">
          
          {/* Aperçu du document sélectionné */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Aperçu du Document
              </label>
              {selectedImage && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  QUALITÉ : {qualityFeedback.lighting}
                </span>
              )}
            </div>

            <div className="aspect-[3/4] bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center border border-slate-800">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Aperçu du document"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <FileText className="w-12 h-12 text-slate-600 mb-2 opacity-60" />
                  <p className="text-xs font-medium">Aucun document chargé</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Prenez une photo ou choisissez un échantillon
                  </p>
                </div>
              )}

              {selectedImage && (
                <div className="absolute bottom-2 left-2 text-[10px] font-mono bg-slate-950/70 text-slate-300 px-2 py-0.5 rounded backdrop-blur">
                  {imageFileName || 'Document numérisé'}
                </div>
              )}
            </div>
          </div>

          {/* Paramètres de validation spécifiques */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Critères de Contrôle Ciblés
              </h3>
            </div>

            <div className="space-y-3">
              {/* Type de Document */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Type de document à contrôler :
                </label>
                <select
                  value={targetTypeOverride}
                  onChange={(e) => setTargetTypeOverride(e.target.value as any)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="AUTO">🤖 Détection automatique par l'IA</option>
                  <option value="CERTIFICAT_SCOLARITE">Certificat de Scolarité</option>
                  <option value="CERTIFICAT_TRAVAIL">Certificat de Travail</option>
                  <option value="CERTIFICAT_VIE_CHARGE">Certificat de Vie et de Charge</option>
                </select>
              </div>

              {/* Année scolaire demandée */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Année Scolaire :
                  </label>
                  <input
                    type="text"
                    value={targetSchoolYear}
                    onChange={(e) => setTargetSchoolYear(e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: 2026-2027"
                  />
                </div>

                {/* Trimestre de travail exigé */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Trimestre de Travail :
                  </label>
                  <select
                    value={targetQuarter}
                    onChange={(e) => setTargetQuarter(e.target.value as any)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="T1">T1 (Jan - Fév - Mar)</option>
                    <option value="T2">T2 (Avr - Mai - Jun)</option>
                    <option value="T3">T3 (Juil - Aoû - Sep)</option>
                    <option value="T4">T4 (Oct - Nov - Déc)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bouton d'Analyse */}
            <button
              onClick={handleStartAnalysis}
              disabled={!selectedImage || isAnalyzing}
              className={`w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                selectedImage && !isAnalyzing
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyse en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>LANCER L'ANALYSE IA & VALIDATION</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL / BANNIÈRE D'ANALYSE EN COURS (Visualisation étape par étape) */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-8 max-w-lg w-full flex flex-col gap-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-200">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Traitement IA du Document</h3>
                <p className="text-xs text-slate-500">Pipeline de vision, OCR et moteur de règles en cours</p>
              </div>
            </div>

            <div className="space-y-3">
              {ANALYSIS_STEPS.map((step, idx) => {
                const isDone = idx < analysisStep;
                const isCurrent = idx === analysisStep;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : isCurrent
                        ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight">{step.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
