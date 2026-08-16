export type DocumentType = 
  | 'CERTIFICAT_VIE_CHARGE'
  | 'CERTIFICAT_SCOLARITE'
  | 'CERTIFICAT_TRAVAIL'
  | 'INCONNU';

export type ValidationStatus = 
  | 'VALIDE'
  | 'NON_VALIDE'
  | 'VERIFICATION_REQUISE';

export type RuleStatus = 'PASS' | 'FAIL' | 'UNCERTAIN';

export type ManualDecisionType = 'CONFIRMED_VALID' | 'OVERRIDDEN_REJECTED' | 'RESUBMIT_REQUESTED';

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  label?: string;
  type?: 'field' | 'signature' | 'stamp' | 'warning';
}

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number; // 0 to 1
  boundingBox?: BoundingBox;
  status: 'valid' | 'invalid' | 'warning' | 'missing';
  expectedValue?: string;
  note?: string;
}

export interface RuleCriterion {
  id: string;
  code: string;
  title: string;
  status: RuleStatus;
  confidence: number;
  message: string;
  mandatory: boolean;
  relatedField?: string;
}

export interface SignatureDetectionInfo {
  detected: boolean;
  confidence: number;
  boundingBox?: BoundingBox;
  handwrittenCharacteristics: boolean;
  expectedZoneMatched: boolean;
  disclaimer: string; // e.g. "Signature détectée — authenticité non vérifiable automatiquement sans référentiel biométrique."
}

export interface QualityMetrics {
  sharpnessScore: number; // 0-100 (Laplacian variance proxy)
  isBlurry: boolean;
  lightingQuality: 'BONNE' | 'MOYENNE' | 'FAIBLE';
  orientationCorrect: boolean;
  framingScore: number; // 0-100
  overallQuality: 'BONNE' | 'ACCEPTABLE' | 'INSUFFISANTE';
  warnings: string[];
}

export interface DocumentAnalysisResult {
  id: string;
  createdAt: string;
  documentType: DocumentType;
  documentTypeLabel: string;
  typeConfidence: number;
  status: ValidationStatus;
  overallConfidence: number;
  primaryReason: string;
  reasons: string[];
  extractedFields: ExtractedField[];
  criteria: RuleCriterion[];
  signature: SignatureDetectionInfo;
  quality: QualityMetrics;
  imageThumbnail: string; // base64 or url
  isOfflineSynced?: boolean;
  agentId: string;
  agentName: string;
  manualDecision?: {
    type: ManualDecisionType;
    comment: string;
    decidedBy: string;
    decidedAt: string;
    editedFields?: Record<string, string>;
  };
}

export interface RuleConfiguration {
  id: string;
  // Paramètres généraux
  highConfidenceThreshold: number; // default 0.90 -> Auto validation
  mediumConfidenceThreshold: number; // default 0.70 -> Human check required
  autoPurgeImagesDays: number;
  
  // Paramètres Certificat de Scolarité
  schoolCert: {
    targetSchoolYear: string; // ex: "2026-2027"
    requireDirectorSignature: boolean;
    requireClass: boolean;
    requireEstablishment: boolean;
    requireStudentName: boolean;
  };
  
  // Paramètres Certificat de Travail
  workCert: {
    targetQuarter: 'T1' | 'T2' | 'T3' | 'T4';
    targetYear: string; // ex: "2026"
    requireAllQuarterMonths: boolean;
    requireWorkHours: boolean;
    requireEmployerSignature: boolean;
    requireEmployeeName: boolean;
    requireEmployerName: boolean;
  };

  // Paramètres Certificat de Vie et Charge
  lifeCert: {
    requireGuardianName: boolean;
    requireDependents: boolean;
    requireDocumentDate: boolean;
    requireSignature: boolean;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  action: string;
  documentId?: string;
  documentType?: string;
  details?: Record<string, any>;
}

export interface DashboardStats {
  totalDocuments: number;
  validatedCount: number;
  rejectedCount: number;
  humanCheckCount: number;
  validationRate: number;
  averageConfidence: number;
  byType: {
    scolarite: number;
    travail: number;
    vieCharge: number;
    inconnu: number;
  };
  recentRejections: {
    reason: string;
    count: number;
  }[];
  trendDays: {
    date: string;
    validated: number;
    rejected: number;
    humanCheck: number;
  }[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'AGENT' | 'ADMIN';
  initials: string;
}
