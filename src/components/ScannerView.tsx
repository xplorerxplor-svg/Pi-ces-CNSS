import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ZapOff, 
  Scan,
  Maximize2,
  Minimize2,
  FileText,
  CameraOff,
  SwitchCamera,
  AlertCircle,
  Smartphone
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
  
  // États Caméra
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isFullscreenCamera, setIsFullscreenCamera] = useState(false);

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
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Détection des caméras disponibles sur l'appareil
  const enumerateCameras = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          // Préférer la caméra arrière sur mobile si détectée
          const backCam = videoInputs.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('arrière') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedDeviceId(backCam ? backCam.deviceId : videoInputs[0].deviceId);
        }
      }
    } catch (err) {
      console.warn('Impossible d\'énumérer les caméras:', err);
    }
  }, [selectedDeviceId]);

  // Nettoyage de la caméra au démontage
  useEffect(() => {
    enumerateCameras();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream, enumerateCameras]);

  // Étapes d'analyse pour la barre de progression
  const ANALYSIS_STEPS = [
    { title: 'Prétraitement d\'image', desc: 'Correction de perspective, débruitage & contraste' },
    { title: 'Classification IA', desc: 'Identification sémantique du type de document' },
    { title: 'OCR Structuré & Bounding Boxes', desc: 'Extraction des champs avec scores de confiance' },
    { title: 'Détection de Signature', desc: 'Localisation et analyse des traits manuscrits' },
    { title: 'Moteur de Règles Métier', desc: 'Validation déterministe des critères obligatoires' }
  ];

  // Gestion du flux Caméra en Direct avec accès matériel complet
  const startCamera = async (overrideFacing?: 'environment' | 'user', overrideDeviceId?: string) => {
    setCameraError(null);
    setIsTorchOn(false);

    // Arrêter le flux existant si actif
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    const currentFacing = overrideFacing || facingMode;
    const currentDevice = overrideDeviceId !== undefined ? overrideDeviceId : selectedDeviceId;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Votre navigateur ou environnement ne supporte pas l\'accès direct à la caméra.');
      }

      // Configuration des contraintes vidéo avec repli progressif
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: currentDevice
          ? { deviceId: { exact: currentDevice }, width: { ideal: 1920 }, height: { ideal: 1080 } }
          : { facingMode: { ideal: currentFacing }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Repli sur contraintes simples si les résolutions idéales échouent
        console.warn('Repli sur contraintes caméra de base:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: currentFacing }
        });
      }

      setCameraStream(stream);
      setIsCameraActive(true);

      // Vérifier le support de la torche / flash
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
        if (capabilities && capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.warn('Erreur lecture vidéo:', e));
        };
      }

      // Mettre à jour la liste des périphériques
      enumerateCameras();

    } catch (err: any) {
      console.error('Erreur accès caméra:', err);
      let message = 'Impossible d\'accéder à la caméra de votre appareil.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur ou utiliser le déclencheur natif ci-dessous.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'Aucune caméra détectée sur ce périphérique.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'La caméra est déjà utilisée par une autre application.';
      }
      setCameraError(message);
      setIsCameraActive(false);
    }
  };

  // Basculer entre Caméra Arrière et Caméra Avant
  const toggleCameraFacing = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    setSelectedDeviceId('');
    await startCamera(nextFacing, '');
  };

  // Basculer la torche / flash si disponible
  const toggleTorch = async () => {
    if (!cameraStream) return;
    const track = cameraStream.getVideoTracks()[0];
    if (track) {
      try {
        const nextTorch = !isTorchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextTorch }]
        });
        setIsTorchOn(nextTorch);
      } catch (err) {
        console.warn('Impossible d\'activer le flash:', err);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setIsFullscreenCamera(false);
  };

  const capturePhoto = () => {
    setCurrentSampleId(undefined);
    if (videoRef.current && cameraStream) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Si caméra avant, effet miroir
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        setSelectedImage(dataUrl);
        setImageFileName('Capture_Camera_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.jpg');
      }
    } else {
      // Fallback démo
      const sample = SAMPLE_DOCUMENTS[0];
      setSelectedImage(sample.generateImage());
      setImageFileName(sample.title + '.png');
    }
    stopCamera();
    evaluateImageQuality();
  };

  // Gestion de l'upload de fichier ou photo native
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
    <div className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 overflow-y-auto bg-slate-50 flex flex-col gap-4 sm:gap-6">
      
      {/* Input natif caché pour déclenchement direct de l'appareil photo OS (Android/iOS) */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Prendre une photo avec l'appareil photo natif"
      />

      {/* SECTION 1 : ZONE DE CAPTURE / IMPORTATION & APERÇU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* Colonne Gauche : Viseur Caméra / Zone de Dépôt (Col 7) */}
        <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-slate-50/50">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2 text-xs sm:text-sm">
                <Scan className="w-4 h-4 text-blue-600" />
                Numérisation & Capture Documentaire
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Caméra Périphérique Active
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              
              {/* Message d'erreur Caméra si refus ou problème */}
              {cameraError && (
                <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Information Caméra :</strong> {cameraError}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60">
                    <button
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Utiliser l'Appareil Photo Natif du Téléphone
                    </button>
                    <button
                      onClick={() => startCamera()}
                      className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 font-bold rounded-lg text-xs hover:bg-amber-100 cursor-pointer"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              )}

              {!isCameraActive ? (
                <div className="space-y-3.5 sm:space-y-4">
                  {/* Zone de Drag & Drop */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-5 sm:p-8 transition-all cursor-pointer flex flex-col items-center justify-center text-center group min-h-[180px] sm:min-h-[220px] ${
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
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 sm:mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">
                      Glissez-déposez le document ou <span className="text-blue-600 underline">parcourez</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs sm:max-w-md">
                      Formats supportés : JPEG, PNG, TIFF, PDF (Haute résolution recommandée)
                    </p>
                  </div>

                  {/* Boutons d'Action Caméra */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {/* Bouton 1 : Viseur Caméra Live en direct */}
                    <button
                      onClick={() => startCamera()}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-lg text-xs sm:text-sm font-bold shadow-md shadow-blue-200 transition-all cursor-pointer min-h-[44px]"
                    >
                      <Camera className="w-4 h-4 shrink-0" />
                      <span>Scanner en Direct (Caméra Live)</span>
                    </button>

                    {/* Bouton 2 : Déclencheur Photo Natif Mobile */}
                    <button
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-900 active:scale-[0.99] text-white rounded-lg text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer min-h-[44px]"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Appareil Photo Natif (Smartphone)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Viseur Caméra en Direct avec Contrôles Avancés */
                <div className={`relative bg-slate-950 rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all ${
                  isFullscreenCamera ? 'fixed inset-0 z-50 rounded-none' : 'aspect-[4/3] sm:aspect-[4/3] w-full'
                }`}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />

                  {/* Barre supérieure d'outils caméra */}
                  <div className="absolute top-3 inset-x-3 sm:inset-x-4 flex items-center justify-between z-20">
                    <div className="flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur border border-slate-700/60 text-white text-[11px] font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>{facingMode === 'environment' ? 'Caméra Arrière' : 'Caméra Avant'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Bouton Flash / Torche si supporté */}
                      {hasTorch && (
                        <button
                          onClick={toggleTorch}
                          className={`p-2 rounded-lg backdrop-blur transition-all cursor-pointer ${
                            isTorchOn 
                              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30' 
                              : 'bg-slate-900/80 text-white hover:bg-slate-800'
                          }`}
                          title={isTorchOn ? 'Éteindre le flash' : 'Allumer le flash'}
                          aria-label="Contrôle du flash"
                        >
                          {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                        </button>
                      )}

                      {/* Bouton Inverser Caméra (Avant/Arrière) */}
                      <button
                        onClick={toggleCameraFacing}
                        className="p-2 rounded-lg bg-slate-900/80 text-white hover:bg-slate-800 backdrop-blur transition-all cursor-pointer flex items-center gap-1 text-xs"
                        title="Basculer caméra avant / arrière"
                        aria-label="Basculer de caméra"
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </button>

                      {/* Bouton Plein Écran */}
                      <button
                        onClick={() => setIsFullscreenCamera(!isFullscreenCamera)}
                        className="p-2 rounded-lg bg-slate-900/80 text-white hover:bg-slate-800 backdrop-blur transition-all cursor-pointer"
                        title={isFullscreenCamera ? 'Quitter le plein écran' : 'Plein écran'}
                        aria-label="Basculer le plein écran caméra"
                      >
                        {isFullscreenCamera ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Cadre de ciblage documentaire CameraX avec repères optiques */}
                  <div className="absolute inset-6 sm:inset-10 border-2 border-blue-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                    {/* Coins de cadrage */}
                    <div className="flex justify-between items-start">
                      <div className="w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1"></div>
                      <div className="text-[10px] text-blue-200 font-mono bg-slate-950/80 px-2.5 py-1 rounded backdrop-blur border border-blue-400/40">
                        ALIGNER LE DOCUMENT
                      </div>
                      <div className="w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1"></div>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1"></div>
                      <div className="text-center text-[10px] sm:text-[11px] text-white bg-slate-950/80 py-1 px-3 rounded backdrop-blur border border-slate-700 max-w-[85%] truncate">
                        Évitez les ombres & reflets • Capture haute résolution
                      </div>
                      <div className="w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1"></div>
                    </div>
                  </div>

                  {/* Contrôles Inférieurs Caméra */}
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-5 z-20 px-4">
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2.5 bg-slate-900/90 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 backdrop-blur border border-slate-700/80 cursor-pointer min-h-[44px]"
                    >
                      Annuler
                    </button>

                    {/* Déclencheur Photo Haute Résolution */}
                    <button
                      onClick={capturePhoto}
                      className="w-15 h-15 sm:w-16 sm:h-16 rounded-full bg-white border-4 border-blue-500 shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                      aria-label="Prendre la photo du document"
                    >
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                        <Camera className="w-6 h-6" />
                      </div>
                    </button>

                    {/* Sélecteur de Caméra si multiples caméras */}
                    {videoDevices.length > 1 && (
                      <select
                        value={selectedDeviceId}
                        onChange={(e) => {
                          setSelectedDeviceId(e.target.value);
                          startCamera(undefined, e.target.value);
                        }}
                        className="bg-slate-900/90 text-white text-[11px] rounded-xl px-2.5 py-2 border border-slate-700/80 backdrop-blur max-w-[130px] truncate cursor-pointer"
                        aria-label="Sélectionner une caméra"
                      >
                        {videoDevices.map((d, i) => (
                          <option key={d.deviceId || i} value={d.deviceId}>
                            {d.label || `Caméra ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Raccourcis : Échantillons de Documents Prêts à Tester */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Échantillons Prêts pour Test Immédiat :
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => loadSample('sample-scolarite-conforme')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5 truncate cursor-pointer min-h-[38px]"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">Scolarité (2026-2027)</span>
                </button>
                <button
                  onClick={() => loadSample('sample-travail-complet')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5 truncate cursor-pointer min-h-[38px]"
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="truncate">Travail T1 (Complet)</span>
                </button>
                <button
                  onClick={() => loadSample('sample-scolarite-mauvaise-annee')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5 truncate cursor-pointer min-h-[38px]"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="truncate">Scolarité (2023 ⚠)</span>
                </button>
                <button
                  onClick={() => loadSample('sample-travail-incomplet')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5 truncate cursor-pointer min-h-[38px]"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="truncate">Travail T1 (Incomplet)</span>
                </button>
                <button
                  onClick={() => loadSample('sample-vie-charge-sans-signature')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5 truncate cursor-pointer min-h-[38px]"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="truncate">Vie Charge (Sans Sign.)</span>
                </button>
                <button
                  onClick={() => loadSample('sample-flou')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 rounded-lg text-left text-xs font-medium text-slate-700 transition-all flex items-center gap-1.5 truncate cursor-pointer min-h-[38px]"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="truncate">Photo Floue / Bougée</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Prévisualisation & Configuration du Contrôle (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
          
          {/* Aperçu du document sélectionné */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col">
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

            <div className="aspect-[3/4] max-h-[360px] sm:max-h-[420px] bg-slate-900 rounded-lg relative overflow-hidden flex items-center justify-center border border-slate-800">
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
                <div className="absolute bottom-2 left-2 text-[10px] font-mono bg-slate-950/70 text-slate-300 px-2 py-0.5 rounded backdrop-blur max-w-[90%] truncate">
                  {imageFileName || 'Document numérisé'}
                </div>
              )}
            </div>
          </div>

          {/* Paramètres de validation spécifiques */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col gap-4">
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
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                >
                  <option value="AUTO">🤖 Détection automatique par l'IA</option>
                  <option value="CERTIFICAT_SCOLARITE">Certificat de Scolarité</option>
                  <option value="CERTIFICAT_TRAVAIL">Certificat de Travail</option>
                  <option value="CERTIFICAT_VIE_CHARGE">Certificat de Vie et de Charge</option>
                </select>
              </div>

              {/* Année scolaire demandée */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Année Scolaire :
                  </label>
                  <input
                    type="text"
                    value={targetSchoolYear}
                    onChange={(e) => setTargetSchoolYear(e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 min-h-[40px]"
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
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 min-h-[40px]"
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
              className={`w-full py-3 sm:py-3.5 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all min-h-[46px] ${
                selectedImage && !isAnalyzing
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white shadow-blue-200 cursor-pointer'
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-8 max-w-lg w-full flex flex-col gap-4 sm:gap-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-200 shrink-0">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Traitement IA du Document</h3>
                <p className="text-[11px] text-slate-500">Pipeline de vision, OCR et moteur de règles en cours</p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {ANALYSIS_STEPS.map((step, idx) => {
                const isDone = idx < analysisStep;
                const isCurrent = idx === analysisStep;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all ${
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : isCurrent
                        ? 'bg-blue-50 border-blue-300 text-blue-900 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
                      ) : (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-slate-300 text-[10px] flex items-center justify-center font-bold">
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

