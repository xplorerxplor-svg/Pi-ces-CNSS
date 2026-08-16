import React, { useState } from 'react';
import { 
  Smartphone, 
  Download, 
  QrCode, 
  Share2, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  FileCode, 
  Check, 
  Info,
  Layers
} from 'lucide-react';

interface AndroidExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidExportModal: React.FC<AndroidExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'capacitor' | 'apk'>('pwa');

  if (!isOpen) return null;

  // L'URL publique de prévisualisation directe ou l'URL actuelle
  const appUrl = window.location.origin;

  // Générateur de QR code SVG pur pour scanner directement avec l'appareil photo du smartphone
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(appUrl)}&margin=10`;

  const copyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Exporter & Tester sur Android</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-400/30">
                  Prêt pour Mobile
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Essayez l'application directement avec l'appareil photo de votre smartphone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xl font-bold cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <QrCode className="w-4 h-4" />
            1. Accès Immédiat & PWA (Recommandé)
          </button>

          <button
            onClick={() => setActiveTab('capacitor')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'capacitor'
                ? 'bg-white text-blue-600 border-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            2. Projet Android Studio (Capacitor)
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {activeTab === 'pwa' && (
            <div className="space-y-6">
              {/* Scan QR Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code d'accès mobile" 
                    className="w-44 h-44 rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[11px] font-medium text-slate-500 mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-500" /> Scannez avec votre smartphone
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    Comment installer en 30 secondes :
                  </h4>
                  <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed font-normal">
                    <li><strong className="text-slate-800">Scannez le QR code</strong> ou ouvrez l'URL dans Google Chrome sur Android.</li>
                    <li>Appuyez sur le menu Chrome (<strong className="text-slate-800">les 3 points ⋮</strong> en haut à droite).</li>
                    <li>Sélectionnez <strong className="text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-semibold">« Ajouter à l'écran d'accueil »</strong> ou <strong className="text-blue-700 font-semibold">« Installer l'application »</strong>.</li>
                    <li>L'application s'exécutera en plein écran avec accès direct au capteur photo arrière (CameraX).</li>
                  </ol>
                </div>
              </div>

              {/* URL Directe */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">URL directe de votre application :</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 select-all"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" /> Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copier le lien
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Vous pouvez encapsuler cette application dans un conteneur natif Android (.apk / .aab) grâce à <strong>Capacitor</strong> en quelques commandes.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Commandes pour générer le projet Android Studio :
                </h4>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-2 overflow-x-auto">
                  <div className="text-slate-400"># 1. Exporter les sources (Menu AI Studio &gt; Export ZIP)</div>
                  <div>npm install @capacitor/core @capacitor/cli @capacitor/android</div>
                  <div className="text-slate-400 mt-2"># 2. Initialiser le projet Android</div>
                  <div>npx cap init "DocCheck AI Pro" "com.doccheck.app" --web-dir dist</div>
                  <div>npm run build</div>
                  <div>npx cap add android</div>
                  <div className="text-slate-400 mt-2"># 3. Ouvrir dans Android Studio & compiler l'APK</div>
                  <div>npx cap open android</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                💡 <strong>Conseil :</strong> Dans Android Studio, cliquez sur <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> pour obtenir le fichier installable sur n'importe quel appareil Android.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Compatible avec tous les smartphones Android (Samsung, Xiaomi, Pixel, Huawei, etc.)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
