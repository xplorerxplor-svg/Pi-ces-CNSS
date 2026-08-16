import { 
  AuditLogEntry, 
  DashboardStats, 
  DocumentAnalysisResult, 
  RuleConfiguration, 
  UserProfile 
} from '../src/types.js';

export class AppStorage {
  private static documents: DocumentAnalysisResult[] = [];
  private static auditLogs: AuditLogEntry[] = [];
  private static config: RuleConfiguration = {
    id: 'DEFAULT_CONFIG',
    highConfidenceThreshold: 0.90,
    mediumConfidenceThreshold: 0.70,
    autoPurgeImagesDays: 30,
    schoolCert: {
      targetSchoolYear: '2026-2027',
      requireDirectorSignature: true,
      requireClass: true,
      requireEstablishment: true,
      requireStudentName: true
    },
    workCert: {
      targetQuarter: 'T1',
      targetYear: '2026',
      requireAllQuarterMonths: true,
      requireWorkHours: true,
      requireEmployerSignature: true,
      requireEmployeeName: true,
      requireEmployerName: true
    },
    lifeCert: {
      requireGuardianName: true,
      requireDependents: true,
      requireDocumentDate: true,
      requireSignature: true
    }
  };

  private static isInitialized = false;

  public static initializeSeedData() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Certificat de scolarité valide
    this.documents.push({
      id: 'DOC-2026-8841',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      documentType: 'CERTIFICAT_SCOLARITE',
      documentTypeLabel: 'Certificat de Scolarité',
      typeConfidence: 0.98,
      status: 'VALIDE',
      overallConfidence: 0.96,
      primaryReason: 'Toutes les informations obligatoires et l\'année scolaire (2026-2027) sont conformes.',
      reasons: [],
      extractedFields: [
        {
          key: 'student_name',
          label: "Nom de l'élève",
          value: 'CLARA LECLERC',
          confidence: 0.98,
          boundingBox: { x: 14, y: 32, width: 45, height: 5, label: 'Élève', type: 'field' },
          status: 'valid'
        },
        {
          key: 'class',
          label: 'Classe',
          value: '6ème B',
          confidence: 0.96,
          boundingBox: { x: 14, y: 40, width: 25, height: 5, label: 'Classe', type: 'field' },
          status: 'valid'
        },
        {
          key: 'school_year',
          label: 'Année scolaire',
          value: '2026-2027',
          confidence: 0.97,
          boundingBox: { x: 14, y: 48, width: 32, height: 5, label: 'Année', type: 'field' },
          status: 'valid'
        },
        {
          key: 'school_name',
          label: 'Établissement',
          value: 'COLLÈGE CONDORCET, PARIS',
          confidence: 0.95,
          boundingBox: { x: 14, y: 22, width: 60, height: 6, label: 'Établissement', type: 'field' },
          status: 'valid'
        },
        {
          key: 'director_name',
          label: 'Directeur',
          value: 'MME. ÉLODIE ROUSSEAU',
          confidence: 0.92,
          boundingBox: { x: 55, y: 72, width: 38, height: 5, label: 'Directeur', type: 'field' },
          status: 'valid'
        }
      ],
      criteria: [
        {
          id: 'CRIT_QUALITY',
          code: 'IMAGE_QUALITY',
          title: 'Qualité et netteté du document',
          status: 'PASS',
          confidence: 0.95,
          message: 'Qualité d\'image optimale.',
          mandatory: true
        },
        {
          id: 'CRIT_STUDENT_NAME',
          code: 'STUDENT_NAME',
          title: 'Nom et prénom de l\'élève',
          status: 'PASS',
          confidence: 0.98,
          message: 'Élève identifié(e) : CLARA LECLERC.',
          mandatory: true
        },
        {
          id: 'CRIT_CLASS',
          code: 'CLASS_NAME',
          title: 'Classe de scolarisation',
          status: 'PASS',
          confidence: 0.96,
          message: 'Classe identifiée : 6ème B.',
          mandatory: true
        },
        {
          id: 'CRIT_SCHOOL_YEAR',
          code: 'SCHOOL_YEAR_MATCH',
          title: 'Année scolaire exigée (2026-2027)',
          status: 'PASS',
          confidence: 0.97,
          message: 'Année scolaire conforme (2026-2027).',
          mandatory: true
        },
        {
          id: 'CRIT_SIGNATURE',
          code: 'SIGNATURE_PRESENCE',
          title: 'Signature requise (Direction)',
          status: 'PASS',
          confidence: 0.94,
          message: 'Signature manuscrite détectée dans la zone prévue.',
          mandatory: true
        }
      ],
      signature: {
        detected: true,
        confidence: 0.94,
        boundingBox: { x: 58, y: 78, width: 30, height: 14, label: 'Signature Direction', type: 'signature' },
        handwrittenCharacteristics: true,
        expectedZoneMatched: true,
        disclaimer: 'Signature détectée — authenticité non vérifiable automatiquement sans référentiel biométrique.'
      },
      quality: {
        sharpnessScore: 94,
        isBlurry: false,
        lightingQuality: 'BONNE',
        orientationCorrect: true,
        framingScore: 96,
        overallQuality: 'BONNE',
        warnings: []
      },
      imageThumbnail: '',
      agentId: 'AGT-001',
      agentName: 'Julien Dubois'
    });

    // 2. Certificat de scolarité avec année scolaire antérieure (Vérification requise / Rejet)
    this.documents.push({
      id: 'DOC-2026-8842',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      documentType: 'CERTIFICAT_SCOLARITE',
      documentTypeLabel: 'Certificat de Scolarité',
      typeConfidence: 0.95,
      status: 'VERIFICATION_REQUISE',
      overallConfidence: 0.76,
      primaryReason: 'Indice de confiance faible sur l\'année scolaire (2023-2024 au lieu de 2026-2027).',
      reasons: ['Indice de confiance faible sur l\'année scolaire.', 'L\'année scolaire (2023-2024) ne correspond pas à l\'année de contrôle (2026-2027).'],
      extractedFields: [
        {
          key: 'student_name',
          label: "Nom de l'élève",
          value: 'JEAN DUPONT',
          confidence: 0.98,
          boundingBox: { x: 14, y: 32, width: 45, height: 5, label: 'Élève', type: 'field' },
          status: 'valid'
        },
        {
          key: 'class',
          label: 'Classe',
          value: 'CM2',
          confidence: 0.92,
          boundingBox: { x: 14, y: 40, width: 25, height: 5, label: 'Classe', type: 'field' },
          status: 'valid'
        },
        {
          key: 'school_year',
          label: 'Année scolaire',
          value: '2023-2024',
          confidence: 0.62,
          boundingBox: { x: 14, y: 48, width: 32, height: 5, label: 'Année', type: 'warning' },
          status: 'warning'
        },
        {
          key: 'school_name',
          label: 'Établissement',
          value: 'LYCÉE HENRI IV, PARIS',
          confidence: 0.94,
          boundingBox: { x: 14, y: 22, width: 60, height: 6, label: 'Établissement', type: 'field' },
          status: 'valid'
        }
      ],
      criteria: [
        {
          id: 'CRIT_QUALITY',
          code: 'IMAGE_QUALITY',
          title: 'Qualité et netteté du document',
          status: 'PASS',
          confidence: 0.92,
          message: 'Qualité d\'image conforme.',
          mandatory: true
        },
        {
          id: 'CRIT_STUDENT_NAME',
          code: 'STUDENT_NAME',
          title: 'Nom et prénom de l\'élève',
          status: 'PASS',
          confidence: 0.98,
          message: 'Élève identifié(e) : JEAN DUPONT.',
          mandatory: true
        },
        {
          id: 'CRIT_SCHOOL_YEAR',
          code: 'SCHOOL_YEAR_MATCH',
          title: 'Année scolaire exigée (2026-2027)',
          status: 'UNCERTAIN',
          confidence: 0.62,
          message: 'Année scolaire extraite (2023-2024) différente de 2026-2027.',
          mandatory: true
        },
        {
          id: 'CRIT_SIGNATURE',
          code: 'SIGNATURE_PRESENCE',
          title: 'Signature requise (Direction)',
          status: 'PASS',
          confidence: 0.94,
          message: 'Signature manuscrite détectée.',
          mandatory: true
        }
      ],
      signature: {
        detected: true,
        confidence: 0.94,
        boundingBox: { x: 60, y: 79, width: 28, height: 13, label: 'Signature Directeur', type: 'signature' },
        handwrittenCharacteristics: true,
        expectedZoneMatched: true,
        disclaimer: 'Signature détectée — authenticité non vérifiable automatiquement.'
      },
      quality: {
        sharpnessScore: 92,
        isBlurry: false,
        lightingQuality: 'BONNE',
        orientationCorrect: true,
        framingScore: 90,
        overallQuality: 'BONNE',
        warnings: []
      },
      imageThumbnail: '',
      agentId: 'AGT-001',
      agentName: 'Julien Dubois'
    });

    // 3. Certificat de travail avec mois manquant dans le 1er trimestre
    this.documents.push({
      id: 'DOC-2026-8843',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      documentType: 'CERTIFICAT_TRAVAIL',
      documentTypeLabel: 'Certificat de Travail',
      typeConfidence: 0.97,
      status: 'NON_VALIDE',
      overallConfidence: 0.68,
      primaryReason: 'Le trimestre est incomplet : mois manquant(s) [Mars].',
      reasons: ['Le trimestre est incomplet : mois manquant(s) [Mars].'],
      extractedFields: [
        {
          key: 'employee_name',
          label: 'Nom du salarié',
          value: 'ALEXANDRE VASSEUR',
          confidence: 0.96,
          boundingBox: { x: 14, y: 28, width: 48, height: 6, label: 'Salarié', type: 'field' },
          status: 'valid'
        },
        {
          key: 'employer_name',
          label: 'Entreprise',
          value: 'TRANS-EUROPE LOGISTICS',
          confidence: 0.95,
          boundingBox: { x: 14, y: 20, width: 55, height: 6, label: 'Employeur', type: 'field' },
          status: 'valid'
        },
        {
          key: 'period_months',
          label: 'Mois déclarés',
          value: 'Janvier, Février',
          confidence: 0.88,
          boundingBox: { x: 14, y: 40, width: 50, height: 6, label: 'Période', type: 'warning' },
          status: 'invalid'
        },
        {
          key: 'work_hours',
          label: 'Heures travaillées',
          value: '302 heures',
          confidence: 0.91,
          boundingBox: { x: 14, y: 50, width: 40, height: 5, label: 'Heures', type: 'field' },
          status: 'valid'
        }
      ],
      criteria: [
        {
          id: 'CRIT_EMPLOYEE_NAME',
          code: 'EMPLOYEE_NAME',
          title: 'Nom et prénom du salarié',
          status: 'PASS',
          confidence: 0.96,
          message: 'Salarié identifié : ALEXANDRE VASSEUR.',
          mandatory: true
        },
        {
          id: 'CRIT_QUARTER_MONTHS',
          code: 'QUARTER_MONTHS_CHECK',
          title: 'Période trimestrielle (1er trimestre)',
          status: 'FAIL',
          confidence: 0.70,
          message: 'Période incomplète. Mois détectés : [Janvier, Février]. Mois manquant : [Mars].',
          mandatory: true
        },
        {
          id: 'CRIT_SIGNATURE',
          code: 'SIGNATURE_PRESENCE',
          title: 'Signature requise (Employeur)',
          status: 'PASS',
          confidence: 0.92,
          message: 'Signature employeur détectée.',
          mandatory: true
        }
      ],
      signature: {
        detected: true,
        confidence: 0.92,
        boundingBox: { x: 55, y: 78, width: 32, height: 14, label: 'Signature Employeur', type: 'signature' },
        handwrittenCharacteristics: true,
        expectedZoneMatched: true,
        disclaimer: 'Signature détectée — authenticité non vérifiable automatiquement.'
      },
      quality: {
        sharpnessScore: 91,
        isBlurry: false,
        lightingQuality: 'BONNE',
        orientationCorrect: true,
        framingScore: 93,
        overallQuality: 'BONNE',
        warnings: []
      },
      imageThumbnail: '',
      agentId: 'AGT-002',
      agentName: 'Sarah Belkacem'
    });

    // 4. Certificat de vie et de charge sans signature
    this.documents.push({
      id: 'DOC-2026-8844',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      documentType: 'CERTIFICAT_VIE_CHARGE',
      documentTypeLabel: 'Certificat de Vie et de Charge',
      typeConfidence: 0.94,
      status: 'NON_VALIDE',
      overallConfidence: 0.65,
      primaryReason: 'Signature absente ou non détectée à l\'emplacement attendu.',
      reasons: ['Signature absente ou non détectée.'],
      extractedFields: [
        {
          key: 'guardian_name',
          label: 'Nom du déclarant',
          value: 'NATHALIE MERCIER',
          confidence: 0.97,
          boundingBox: { x: 14, y: 28, width: 45, height: 6, label: 'Tuteur', type: 'field' },
          status: 'valid'
        },
        {
          key: 'dependents_list',
          label: 'Personnes à charge',
          value: 'THÉO MERCIER (14 ans), LÉA MERCIER (11 ans)',
          confidence: 0.94,
          boundingBox: { x: 14, y: 40, width: 70, height: 10, label: 'Personnes à charge', type: 'field' },
          status: 'valid'
        }
      ],
      criteria: [
        {
          id: 'CRIT_GUARDIAN_NAME',
          code: 'GUARDIAN_NAME',
          title: 'Nom et prénom du parent / tuteur',
          status: 'PASS',
          confidence: 0.97,
          message: 'Parent identifié : NATHALIE MERCIER.',
          mandatory: true
        },
        {
          id: 'CRIT_DEPENDENTS',
          code: 'DEPENDENTS_LIST',
          title: 'Personnes / Enfants à charge',
          status: 'PASS',
          confidence: 0.94,
          message: '2 personnes à charge répertoriées.',
          mandatory: true
        },
        {
          id: 'CRIT_SIGNATURE',
          code: 'SIGNATURE_PRESENCE',
          title: 'Signature requise',
          status: 'FAIL',
          confidence: 0.05,
          message: 'Aucun trait manuscrit dans la boîte de signature.',
          mandatory: true
        }
      ],
      signature: {
        detected: false,
        confidence: 0.05,
        handwrittenCharacteristics: false,
        expectedZoneMatched: false,
        disclaimer: 'Signature absente.'
      },
      quality: {
        sharpnessScore: 88,
        isBlurry: false,
        lightingQuality: 'BONNE',
        orientationCorrect: true,
        framingScore: 88,
        overallQuality: 'BONNE',
        warnings: []
      },
      imageThumbnail: '',
      agentId: 'AGT-001',
      agentName: 'Julien Dubois'
    });

    // Seed audit logs
    this.auditLogs.push(
      {
        id: 'LOG-001',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        agentId: 'AGT-001',
        agentName: 'Julien Dubois',
        action: 'ANALYSE_AUTOMATIQUE',
        documentId: 'DOC-2026-8841',
        documentType: 'CERTIFICAT_SCOLARITE',
        details: { result: 'VALIDE', score: 0.96 }
      },
      {
        id: 'LOG-002',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        agentId: 'AGT-001',
        agentName: 'Julien Dubois',
        action: 'ANALYSE_AUTOMATIQUE',
        documentId: 'DOC-2026-8842',
        documentType: 'CERTIFICAT_SCOLARITE',
        details: { result: 'VERIFICATION_REQUISE', score: 0.76, motif: 'Année scolaire suspecte' }
      },
      {
        id: 'LOG-003',
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
        agentId: 'AGT-002',
        agentName: 'Sarah Belkacem',
        action: 'ANALYSE_AUTOMATIQUE',
        documentId: 'DOC-2026-8843',
        documentType: 'CERTIFICAT_TRAVAIL',
        details: { result: 'NON_VALIDE', score: 0.68, motif: 'Mois manquant [Mars]' }
      }
    );
  }

  public static getDocuments(filter?: { status?: string; type?: string; query?: string }): DocumentAnalysisResult[] {
    this.initializeSeedData();
    let list = [...this.documents];

    if (filter?.status) {
      list = list.filter(d => d.status === filter.status);
    }
    if (filter?.type) {
      list = list.filter(d => d.documentType === filter.type);
    }
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      list = list.filter(d => 
        d.id.toLowerCase().includes(q) ||
        d.documentTypeLabel.toLowerCase().includes(q) ||
        d.primaryReason.toLowerCase().includes(q) ||
        d.agentName.toLowerCase().includes(q) ||
        d.extractedFields.some(f => f.value.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static getDocumentById(id: string): DocumentAnalysisResult | undefined {
    this.initializeSeedData();
    return this.documents.find(d => d.id === id);
  }

  public static saveDocument(doc: DocumentAnalysisResult): DocumentAnalysisResult {
    this.initializeSeedData();
    const index = this.documents.findIndex(d => d.id === doc.id);
    if (index >= 0) {
      this.documents[index] = doc;
    } else {
      this.documents.unshift(doc);
    }

    this.addAuditLog({
      agentId: doc.agentId,
      agentName: doc.agentName,
      action: 'NOUVELLE_ANALYSE_DOCUMENT',
      documentId: doc.id,
      documentType: doc.documentType,
      details: {
        status: doc.status,
        confidence: doc.overallConfidence,
        reasons: doc.reasons
      }
    });

    return doc;
  }

  public static recordManualDecision(
    id: string,
    decision: {
      type: 'CONFIRMED_VALID' | 'OVERRIDDEN_REJECTED' | 'RESUBMIT_REQUESTED';
      comment: string;
      decidedBy: string;
      editedFields?: Record<string, string>;
    }
  ): DocumentAnalysisResult | null {
    this.initializeSeedData();
    const doc = this.documents.find(d => d.id === id);
    if (!doc) return null;

    doc.manualDecision = {
      ...decision,
      decidedAt: new Date().toISOString()
    };

    // Mettre à jour le statut global selon l'arbitrage
    if (decision.type === 'CONFIRMED_VALID') {
      doc.status = 'VALIDE';
      doc.primaryReason = `Validé manuellement par ${decision.decidedBy} : ${decision.comment || 'Conforme après vérification'}`;
    } else if (decision.type === 'OVERRIDDEN_REJECTED') {
      doc.status = 'NON_VALIDE';
      doc.primaryReason = `Rejeté manuellement par ${decision.decidedBy} : ${decision.comment}`;
    } else if (decision.type === 'RESUBMIT_REQUESTED') {
      doc.status = 'NON_VALIDE';
      doc.primaryReason = `Nouvelle photo demandée par ${decision.decidedBy} : ${decision.comment}`;
    }

    // Appliquer les corrections de champs si renseignées
    if (decision.editedFields) {
      for (const [key, val] of Object.entries(decision.editedFields)) {
        const f = doc.extractedFields.find(field => field.key === key);
        if (f) {
          f.value = val;
          f.confidence = 1.0;
          f.status = 'valid';
          f.note = 'Corrigé manuellement par l\'agent';
        }
      }
    }

    this.addAuditLog({
      agentId: 'CURRENT_AGENT',
      agentName: decision.decidedBy,
      action: 'ARBITRAGE_MANUEL',
      documentId: doc.id,
      documentType: doc.documentType,
      details: {
        decisionType: decision.type,
        comment: decision.comment,
        newStatus: doc.status
      }
    });

    return doc;
  }

  public static deleteDocument(id: string): boolean {
    this.initializeSeedData();
    const initialLen = this.documents.length;
    this.documents = this.documents.filter(d => d.id !== id);
    return this.documents.length < initialLen;
  }

  public static getConfig(): RuleConfiguration {
    return { ...this.config };
  }

  public static updateConfig(newConfig: Partial<RuleConfiguration>): RuleConfiguration {
    this.config = {
      ...this.config,
      ...newConfig,
      schoolCert: { ...this.config.schoolCert, ...(newConfig.schoolCert || {}) },
      workCert: { ...this.config.workCert, ...(newConfig.workCert || {}) },
      lifeCert: { ...this.config.lifeCert, ...(newConfig.lifeCert || {}) }
    };

    this.addAuditLog({
      agentId: 'ADMIN',
      agentName: 'Administrateur Système',
      action: 'MISE_A_JOUR_REGLES_METIER',
      details: { newConfig: this.config }
    });

    return this.getConfig();
  }

  public static getDashboardStats(): DashboardStats {
    this.initializeSeedData();
    const total = this.documents.length;
    const validated = this.documents.filter(d => d.status === 'VALIDE').length;
    const rejected = this.documents.filter(d => d.status === 'NON_VALIDE').length;
    const humanCheck = this.documents.filter(d => d.status === 'VERIFICATION_REQUISE').length;
    
    const avgConf = total > 0 
      ? this.documents.reduce((acc, d) => acc + d.overallConfidence, 0) / total 
      : 0;

    return {
      totalDocuments: total,
      validatedCount: validated,
      rejectedCount: rejected,
      humanCheckCount: humanCheck,
      validationRate: total > 0 ? Math.round((validated / total) * 100) : 0,
      averageConfidence: Number(avgConf.toFixed(2)),
      byType: {
        scolarite: this.documents.filter(d => d.documentType === 'CERTIFICAT_SCOLARITE').length,
        travail: this.documents.filter(d => d.documentType === 'CERTIFICAT_TRAVAIL').length,
        vieCharge: this.documents.filter(d => d.documentType === 'CERTIFICAT_VIE_CHARGE').length,
        inconnu: this.documents.filter(d => d.documentType === 'INCONNU').length
      },
      recentRejections: [
        { reason: 'Année scolaire non conforme', count: 1 },
        { reason: 'Trimestre incomplet (mois manquant)', count: 1 },
        { reason: 'Signature manquante', count: 1 }
      ],
      trendDays: [
        { date: '12/08', validated: 4, rejected: 1, humanCheck: 1 },
        { date: '13/08', validated: 6, rejected: 0, humanCheck: 2 },
        { date: '14/08', validated: 8, rejected: 2, humanCheck: 1 },
        { date: '15/08', validated: 5, rejected: 1, humanCheck: 0 },
        { date: '16/08', validated: validated, rejected: rejected, humanCheck: humanCheck }
      ]
    };
  }

  public static getAuditLogs(): AuditLogEntry[] {
    this.initializeSeedData();
    return [...this.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public static addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    this.auditLogs.unshift({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry
    });
  }
}
