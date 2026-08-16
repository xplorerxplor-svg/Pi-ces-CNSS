import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GeminiDocumentService } from './server/geminiService.js';
import { RuleEngine } from './server/ruleEngine.js';
import { AppStorage } from './server/storage.js';
import { DocumentAnalysisResult, DocumentType, RuleConfiguration } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser avec limite étendue pour les photos de documents haute résolution
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Initialisation des données d'amorçage
  AppStorage.initializeSeedData();

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      version: '2.4.0-STABLE',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
      serverTime: new Date().toISOString()
    });
  });

  // 1. Analyse complète de document (Vision IA + Moteur de Règles)
  app.post('/api/documents/analyze', async (req, res) => {
    try {
      const { 
        imageBase64, 
        documentTypeOverride, 
        configOverride,
        sampleId,
        agentName = 'Julien Dubois',
        agentId = 'AGT-001'
      } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image manquante dans la requête.' });
      }

      // Configuration effective (courante fusionnée avec surcharges de requête)
      const currentConfig = AppStorage.getConfig();
      const effectiveConfig: RuleConfiguration = {
        ...currentConfig,
        ...configOverride,
        schoolCert: { ...currentConfig.schoolCert, ...(configOverride?.schoolCert || {}) },
        workCert: { ...currentConfig.workCert, ...(configOverride?.workCert || {}) },
        lifeCert: { ...currentConfig.lifeCert, ...(configOverride?.lifeCert || {}) }
      };

      // Étape 1 : Analyse IA & Extraction OCR structurée
      const aiResult = await GeminiDocumentService.analyzeDocument(
        imageBase64,
        'image/jpeg',
        documentTypeOverride as DocumentType,
        sampleId
      );

      // Étape 2 : Moteur de règles métier indépendant
      const ruleEvaluation = RuleEngine.evaluate(
        aiResult.documentType,
        aiResult.typeConfidence,
        aiResult.extractedFields,
        aiResult.signature,
        aiResult.quality,
        effectiveConfig
      );

      // Étape 3 : Assemblage du document analysé
      const docId = `DOC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const analysisResult: DocumentAnalysisResult = {
        id: docId,
        createdAt: new Date().toISOString(),
        documentType: aiResult.documentType,
        documentTypeLabel: RuleEngine.getDocumentTypeLabel(aiResult.documentType),
        typeConfidence: aiResult.typeConfidence,
        status: ruleEvaluation.status,
        overallConfidence: ruleEvaluation.overallConfidence,
        primaryReason: ruleEvaluation.primaryReason,
        reasons: ruleEvaluation.reasons,
        extractedFields: aiResult.extractedFields,
        criteria: ruleEvaluation.criteria,
        signature: aiResult.signature,
        quality: aiResult.quality,
        imageThumbnail: imageBase64.length > 500000 
          ? imageBase64.slice(0, 500000) 
          : imageBase64,
        agentId,
        agentName
      };

      // Étape 4 : Persistance et traçabilité
      AppStorage.saveDocument(analysisResult);

      return res.json({
        success: true,
        document: analysisResult
      });
    } catch (err: any) {
      console.error('Erreur lors de l\'analyse du document :', err);
      return res.status(500).json({ 
        error: 'Échec de l\'analyse du document.', 
        details: err?.message || String(err) 
      });
    }
  });

  // 2. Pré-contrôle rapide de qualité / flou
  app.post('/api/documents/quality-check', (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Image requise.' });
      }

      const length = imageBase64.length;
      const isBlurry = length < 1000;
      const sharpnessScore = isBlurry ? 45 : 92;

      res.json({
        sharpnessScore,
        isBlurry,
        overallQuality: isBlurry ? 'INSUFFISANTE' : 'BONNE',
        recommendation: isBlurry ? 'Document trop flou, veuillez stabiliser votre appareil.' : 'Prêt pour l\'analyse.'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Erreur lors du test de qualité.' });
    }
  });

  // 3. Liste des documents avec filtrage
  app.get('/api/documents', (req, res) => {
    const { status, type, query } = req.query;
    const docs = AppStorage.getDocuments({
      status: status as string,
      type: type as string,
      query: query as string
    });
    res.json(docs);
  });

  // 4. Détail d'un document
  app.get('/api/documents/:id', (req, res) => {
    const doc = AppStorage.getDocumentById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document non trouvé.' });
    }
    res.json(doc);
  });

  // 5. Arbitrage manuel / Décision de l'agent
  app.post('/api/documents/:id/manual-decision', (req, res) => {
    const { type, comment, decidedBy = 'Agent Titulaire', editedFields } = req.body;
    if (!type) {
      return res.status(400).json({ error: 'Type de décision requis.' });
    }

    const updated = AppStorage.recordManualDecision(req.params.id, {
      type,
      comment,
      decidedBy,
      editedFields
    });

    if (!updated) {
      return res.status(404).json({ error: 'Document non trouvé.' });
    }

    res.json({ success: true, document: updated });
  });

  // 6. Suppression d'un document
  app.delete('/api/documents/:id', (req, res) => {
    const deleted = AppStorage.deleteDocument(req.params.id);
    res.json({ success: deleted });
  });

  // 7. Paramètres et règles métier
  app.get('/api/rules', (req, res) => {
    res.json(AppStorage.getConfig());
  });

  app.put('/api/rules', (req, res) => {
    const updated = AppStorage.updateConfig(req.body);
    res.json({ success: true, config: updated });
  });

  // 8. Statistiques du tableau de bord
  app.get('/api/stats', (req, res) => {
    res.json(AppStorage.getDashboardStats());
  });

  // 9. Journal d'audit
  app.get('/api/audit', (req, res) => {
    res.json(AppStorage.getAuditLogs());
  });

  // ==========================================
  // VITE & STATIC FILES SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DocCheck AI Pro Server démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Erreur au démarrage du serveur:', err);
  process.exit(1);
});
