import { 
  DocumentType, 
  ExtractedField, 
  QualityMetrics, 
  RuleConfiguration, 
  RuleCriterion, 
  RuleStatus, 
  SignatureDetectionInfo, 
  ValidationStatus 
} from '../src/types.js';

export interface ValidationEvaluationResult {
  status: ValidationStatus;
  overallConfidence: number;
  primaryReason: string;
  reasons: string[];
  criteria: RuleCriterion[];
}

export const QUARTER_MONTHS: Record<string, { name: string; aliases: string[]; fullNames: string[] }> = {
  T1: {
    name: '1er trimestre (Janvier - Février - Mars)',
    aliases: ['janv', 'janvier', 'fev', 'fév', 'fevrier', 'février', 'mars'],
    fullNames: ['Janvier', 'Février', 'Mars']
  },
  T2: {
    name: '2e trimestre (Avril - Mai - Juin)',
    aliases: ['avr', 'avril', 'mai', 'juin'],
    fullNames: ['Avril', 'Mai', 'Juin']
  },
  T3: {
    name: '3e trimestre (Juillet - Août - Septembre)',
    aliases: ['juil', 'juillet', 'aout', 'août', 'sept', 'septembre'],
    fullNames: ['Juillet', 'Août', 'Septembre']
  },
  T4: {
    name: '4e trimestre (Octobre - Novembre - Décembre)',
    aliases: ['oct', 'octobre', 'nov', 'novembre', 'dec', 'déc', 'decembre', 'décembre'],
    fullNames: ['Octobre', 'Novembre', 'Décembre']
  }
};

export class RuleEngine {
  /**
   * Évalue un document extrait par l'IA par rapport aux règles de gestion paramétrées.
   */
  public static evaluate(
    documentType: DocumentType,
    typeConfidence: number,
    extractedFields: ExtractedField[],
    signature: SignatureDetectionInfo,
    quality: QualityMetrics,
    config: RuleConfiguration
  ): ValidationEvaluationResult {
    const criteria: RuleCriterion[] = [];
    const reasons: string[] = [];

    // 0. Vérification Qualité Initiale
    if (quality.isBlurry || quality.overallQuality === 'INSUFFISANTE') {
      criteria.push({
        id: 'CRIT_QUALITY',
        code: 'IMAGE_QUALITY',
        title: 'Qualité et netteté du document',
        status: 'FAIL',
        confidence: quality.sharpnessScore / 100,
        message: 'Document trop flou ou de qualité insuffisante pour une validation fiable.',
        mandatory: true
      });
      reasons.push('Document trop flou pour permettre une validation fiable.');
    } else {
      criteria.push({
        id: 'CRIT_QUALITY',
        code: 'IMAGE_QUALITY',
        title: 'Qualité et netteté du document',
        status: 'PASS',
        confidence: Math.min(1, Math.max(0.7, quality.sharpnessScore / 100)),
        message: 'Qualité d\'image conforme pour l\'analyse OCR et visuelle.',
        mandatory: true
      });
    }

    // 1. Contrôle du Type de Document
    if (documentType === 'INCONNU' || typeConfidence < 0.6) {
      criteria.push({
        id: 'CRIT_TYPE',
        code: 'DOC_TYPE_IDENTIFIED',
        title: 'Identification du type de document',
        status: 'FAIL',
        confidence: typeConfidence,
        message: 'Type de document non reconnu ou ambigu. Veuillez vérifier ou sélectionner manuellement.',
        mandatory: true
      });
      reasons.push('Le type de document n\'a pas pu être identifié avec certitude.');

      return this.synthesizeDecision(criteria, reasons, config);
    } else {
      criteria.push({
        id: 'CRIT_TYPE',
        code: 'DOC_TYPE_IDENTIFIED',
        title: 'Identification du type de document',
        status: 'PASS',
        confidence: typeConfidence,
        message: `Document identifié avec succès comme : ${this.getDocumentTypeLabel(documentType)}.`,
        mandatory: true
      });
    }

    // 2. Moteur spécifique selon le type
    if (documentType === 'CERTIFICAT_SCOLARITE') {
      this.evaluateSchoolCert(extractedFields, signature, config, criteria, reasons);
    } else if (documentType === 'CERTIFICAT_TRAVAIL') {
      this.evaluateWorkCert(extractedFields, signature, config, criteria, reasons);
    } else if (documentType === 'CERTIFICAT_VIE_CHARGE') {
      this.evaluateLifeCert(extractedFields, signature, config, criteria, reasons);
    }

    return this.synthesizeDecision(criteria, reasons, config);
  }

  private static evaluateSchoolCert(
    fields: ExtractedField[],
    signature: SignatureDetectionInfo,
    config: RuleConfiguration,
    criteria: RuleCriterion[],
    reasons: string[]
  ) {
    const studentName = fields.find(f => f.key === 'student_name');
    const studentClass = fields.find(f => f.key === 'class');
    const schoolYear = fields.find(f => f.key === 'school_year');
    const schoolName = fields.find(f => f.key === 'school_name');
    const targetYear = config.schoolCert.targetSchoolYear || '2026-2027';

    // Nom de l'élève
    if (config.schoolCert.requireStudentName) {
      if (!studentName || !studentName.value || studentName.confidence < 0.5) {
        criteria.push({
          id: 'CRIT_STUDENT_NAME',
          code: 'STUDENT_NAME',
          title: 'Nom et prénom de l\'élève',
          status: 'FAIL',
          confidence: studentName?.confidence || 0,
          message: 'Nom de l\'élève non identifié ou illisible.',
          mandatory: true,
          relatedField: 'student_name'
        });
        reasons.push('Le nom de l\'élève n\'a pas pu être identifié.');
      } else if (studentName.confidence < config.mediumConfidenceThreshold) {
        criteria.push({
          id: 'CRIT_STUDENT_NAME',
          code: 'STUDENT_NAME',
          title: 'Nom et prénom de l\'élève',
          status: 'UNCERTAIN',
          confidence: studentName.confidence,
          message: `Nom extrait avec incertitude (${studentName.value}). Vérification recommandée.`,
          mandatory: true,
          relatedField: 'student_name'
        });
      } else {
        criteria.push({
          id: 'CRIT_STUDENT_NAME',
          code: 'STUDENT_NAME',
          title: 'Nom et prénom de l\'élève',
          status: 'PASS',
          confidence: studentName.confidence,
          message: `Élève identifié(e) : ${studentName.value}.`,
          mandatory: true,
          relatedField: 'student_name'
        });
      }
    }

    // Classe
    if (config.schoolCert.requireClass) {
      if (!studentClass || !studentClass.value || studentClass.confidence < 0.5) {
        criteria.push({
          id: 'CRIT_CLASS',
          code: 'CLASS_NAME',
          title: 'Classe de scolarisation',
          status: 'FAIL',
          confidence: studentClass?.confidence || 0,
          message: 'Classe non détectée sur le document.',
          mandatory: true,
          relatedField: 'class'
        });
        reasons.push('La classe de l\'élève n\'a pas pu être identifiée.');
      } else if (studentClass.confidence < config.mediumConfidenceThreshold) {
        criteria.push({
          id: 'CRIT_CLASS',
          code: 'CLASS_NAME',
          title: 'Classe de scolarisation',
          status: 'UNCERTAIN',
          confidence: studentClass.confidence,
          message: `Classe extraite avec incertitude (${studentClass.value}).`,
          mandatory: true,
          relatedField: 'class'
        });
      } else {
        criteria.push({
          id: 'CRIT_CLASS',
          code: 'CLASS_NAME',
          title: 'Classe de scolarisation',
          status: 'PASS',
          confidence: studentClass.confidence,
          message: `Classe identifiée : ${studentClass.value}.`,
          mandatory: true,
          relatedField: 'class'
        });
      }
    }

    // Année scolaire (Contrôle strict avec l'année configurée)
    if (!schoolYear || !schoolYear.value) {
      criteria.push({
        id: 'CRIT_SCHOOL_YEAR',
        code: 'SCHOOL_YEAR_MATCH',
        title: `Année scolaire exigée (${targetYear})`,
        status: 'FAIL',
        confidence: 0,
        message: 'Année scolaire absente du document.',
        mandatory: true,
        relatedField: 'school_year'
      });
      reasons.push('L\'année scolaire est absente du document.');
    } else {
      const cleanedFound = schoolYear.value.replace(/\s+/g, '').replace(/[–—]/g, '-');
      const cleanedTarget = targetYear.replace(/\s+/g, '').replace(/[–—]/g, '-');
      const matches = cleanedFound.includes(cleanedTarget) || cleanedFound === cleanedTarget;

      if (!matches) {
        criteria.push({
          id: 'CRIT_SCHOOL_YEAR',
          code: 'SCHOOL_YEAR_MATCH',
          title: `Année scolaire exigée (${targetYear})`,
          status: 'FAIL',
          confidence: schoolYear.confidence,
          message: `Année scolaire non conforme : ${schoolYear.value} au lieu de l'année attendue (${targetYear}).`,
          mandatory: true,
          relatedField: 'school_year'
        });
        reasons.push(`L'année scolaire (${schoolYear.value}) ne correspond pas à l'année demandée (${targetYear}).`);
      } else if (schoolYear.confidence < config.mediumConfidenceThreshold) {
        criteria.push({
          id: 'CRIT_SCHOOL_YEAR',
          code: 'SCHOOL_YEAR_MATCH',
          title: `Année scolaire exigée (${targetYear})`,
          status: 'UNCERTAIN',
          confidence: schoolYear.confidence,
          message: `Année scolaire lue (${schoolYear.value}) avec un indice de confiance modéré.`,
          mandatory: true,
          relatedField: 'school_year'
        });
        reasons.push(`Indice de confiance faible sur l'année scolaire (${Math.round(schoolYear.confidence * 100)}%).`);
      } else {
        criteria.push({
          id: 'CRIT_SCHOOL_YEAR',
          code: 'SCHOOL_YEAR_MATCH',
          title: `Année scolaire exigée (${targetYear})`,
          status: 'PASS',
          confidence: schoolYear.confidence,
          message: `Année scolaire conforme (${schoolYear.value}).`,
          mandatory: true,
          relatedField: 'school_year'
        });
      }
    }

    // Établissement
    if (config.schoolCert.requireEstablishment && schoolName) {
      if (schoolName.value && schoolName.confidence >= config.mediumConfidenceThreshold) {
        criteria.push({
          id: 'CRIT_ESTABLISHMENT',
          code: 'ESTABLISHMENT_NAME',
          title: 'Nom de l\'établissement',
          status: 'PASS',
          confidence: schoolName.confidence,
          message: `Établissement : ${schoolName.value}.`,
          mandatory: false,
          relatedField: 'school_name'
        });
      } else {
        criteria.push({
          id: 'CRIT_ESTABLISHMENT',
          code: 'ESTABLISHMENT_NAME',
          title: 'Nom de l\'établissement',
          status: 'UNCERTAIN',
          confidence: schoolName?.confidence || 0.4,
          message: 'Établissement non formellement lisible.',
          mandatory: false,
          relatedField: 'school_name'
        });
      }
    }

    // Signature Direction
    if (config.schoolCert.requireDirectorSignature) {
      this.evaluateSignatureCriterion(signature, 'Directeur / Direction', criteria, reasons);
    }
  }

  private static evaluateWorkCert(
    fields: ExtractedField[],
    signature: SignatureDetectionInfo,
    config: RuleConfiguration,
    criteria: RuleCriterion[],
    reasons: string[]
  ) {
    const employeeName = fields.find(f => f.key === 'employee_name');
    const employerName = fields.find(f => f.key === 'employer_name');
    const periodMonths = fields.find(f => f.key === 'period_months');
    const workHours = fields.find(f => f.key === 'work_hours');
    const targetQuarter = config.workCert.targetQuarter || 'T1';
    const quarterDef = QUARTER_MONTHS[targetQuarter] || QUARTER_MONTHS.T1;

    // Nom du salarié
    if (config.workCert.requireEmployeeName) {
      if (!employeeName || !employeeName.value || employeeName.confidence < 0.5) {
        criteria.push({
          id: 'CRIT_EMPLOYEE_NAME',
          code: 'EMPLOYEE_NAME',
          title: 'Nom et prénom du salarié / titulaire',
          status: 'FAIL',
          confidence: employeeName?.confidence || 0,
          message: 'Nom du salarié absent ou illisible.',
          mandatory: true,
          relatedField: 'employee_name'
        });
        reasons.push('Le nom du titulaire n\'a pas pu être identifié.');
      } else if (employeeName.confidence < config.mediumConfidenceThreshold) {
        criteria.push({
          id: 'CRIT_EMPLOYEE_NAME',
          code: 'EMPLOYEE_NAME',
          title: 'Nom et prénom du salarié / titulaire',
          status: 'UNCERTAIN',
          confidence: employeeName.confidence,
          message: `Salarié lu avec réserve : ${employeeName.value}.`,
          mandatory: true,
          relatedField: 'employee_name'
        });
      } else {
        criteria.push({
          id: 'CRIT_EMPLOYEE_NAME',
          code: 'EMPLOYEE_NAME',
          title: 'Nom et prénom du salarié / titulaire',
          status: 'PASS',
          confidence: employeeName.confidence,
          message: `Salarié identifié : ${employeeName.value}.`,
          mandatory: true,
          relatedField: 'employee_name'
        });
      }
    }

    // Nom de l'employeur
    if (config.workCert.requireEmployerName) {
      if (!employerName || !employerName.value || employerName.confidence < 0.5) {
        criteria.push({
          id: 'CRIT_EMPLOYER_NAME',
          code: 'EMPLOYER_NAME',
          title: 'Entreprise ou Employeur',
          status: 'FAIL',
          confidence: employerName?.confidence || 0,
          message: 'Nom de l\'entreprise/employeur non identifié.',
          mandatory: true,
          relatedField: 'employer_name'
        });
        reasons.push('Le nom de l\'employeur est manquant.');
      } else {
        criteria.push({
          id: 'CRIT_EMPLOYER_NAME',
          code: 'EMPLOYER_NAME',
          title: 'Entreprise ou Employeur',
          status: 'PASS',
          confidence: employerName.confidence,
          message: `Employeur : ${employerName.value}.`,
          mandatory: true,
          relatedField: 'employer_name'
        });
      }
    }

    // Détection des 3 mois du trimestre (avec détection automatique et signalement des mois manquants)
    if (config.workCert.requireAllQuarterMonths) {
      const rawText = (periodMonths?.value || '').toLowerCase();
      const detectedMonths: string[] = [];
      const missingMonths: string[] = [];

      for (const month of quarterDef.fullNames) {
        const normalized = month.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const found = rawText.includes(normalized) || rawText.includes(month.toLowerCase());
        if (found) {
          detectedMonths.push(month);
        } else {
          missingMonths.push(month);
        }
      }

      if (detectedMonths.length === 3) {
        criteria.push({
          id: 'CRIT_QUARTER_MONTHS',
          code: 'QUARTER_MONTHS_CHECK',
          title: `Période trimestrielle (${quarterDef.name})`,
          status: 'PASS',
          confidence: periodMonths?.confidence || 0.95,
          message: `Tous les mois du trimestre sont présents : ${detectedMonths.join(', ')}.`,
          mandatory: true,
          relatedField: 'period_months'
        });
      } else if (detectedMonths.length > 0) {
        criteria.push({
          id: 'CRIT_QUARTER_MONTHS',
          code: 'QUARTER_MONTHS_CHECK',
          title: `Période trimestrielle (${quarterDef.name})`,
          status: 'FAIL',
          confidence: periodMonths?.confidence || 0.7,
          message: `Période incomplète. Mois détectés : [${detectedMonths.join(', ')}]. Mois manquant(s) : [${missingMonths.join(', ')}].`,
          mandatory: true,
          relatedField: 'period_months'
        });
        reasons.push(`Le trimestre est incomplet : mois manquant(s) [${missingMonths.join(', ')}].`);
      } else {
        criteria.push({
          id: 'CRIT_QUARTER_MONTHS',
          code: 'QUARTER_MONTHS_CHECK',
          title: `Période trimestrielle (${quarterDef.name})`,
          status: 'FAIL',
          confidence: 0,
          message: `Aucun mois correspondant au ${quarterDef.name} n'a été détecté.`,
          mandatory: true,
          relatedField: 'period_months'
        });
        reasons.push(`Les mois du ${quarterDef.name} ne figurent pas sur le certificat.`);
      }
    }

    // Heures de travail
    if (config.workCert.requireWorkHours) {
      if (!workHours || !workHours.value || workHours.confidence < 0.5) {
        criteria.push({
          id: 'CRIT_WORK_HOURS',
          code: 'WORK_HOURS_PRESENT',
          title: 'Volume d\'heures travaillées',
          status: 'FAIL',
          confidence: workHours?.confidence || 0,
          message: 'Mention des heures de travail absente ou inexploitable.',
          mandatory: true,
          relatedField: 'work_hours'
        });
        reasons.push('Les heures de travail sont absentes ou non exploitables.');
      } else {
        criteria.push({
          id: 'CRIT_WORK_HOURS',
          code: 'WORK_HOURS_PRESENT',
          title: 'Volume d\'heures travaillées',
          status: 'PASS',
          confidence: workHours.confidence,
          message: `Volume d'heures détecté : ${workHours.value}.`,
          mandatory: true,
          relatedField: 'work_hours'
        });
      }
    }

    // Signature employeur
    if (config.workCert.requireEmployerSignature) {
      this.evaluateSignatureCriterion(signature, 'Employeur / Représentant', criteria, reasons);
    }
  }

  private static evaluateLifeCert(
    fields: ExtractedField[],
    signature: SignatureDetectionInfo,
    config: RuleConfiguration,
    criteria: RuleCriterion[],
    reasons: string[]
  ) {
    const guardianName = fields.find(f => f.key === 'guardian_name');
    const dependents = fields.find(f => f.key === 'dependents_list');
    const docDate = fields.find(f => f.key === 'document_date');

    // Nom parent/tuteur
    if (config.lifeCert.requireGuardianName) {
      if (!guardianName || !guardianName.value || guardianName.confidence < 0.5) {
        criteria.push({
          id: 'CRIT_GUARDIAN_NAME',
          code: 'GUARDIAN_NAME',
          title: 'Nom et prénom du parent / tuteur',
          status: 'FAIL',
          confidence: guardianName?.confidence || 0,
          message: 'Nom du parent ou tuteur non identifiable.',
          mandatory: true,
          relatedField: 'guardian_name'
        });
        reasons.push('Le nom du parent/tuteur n\'a pas pu être identifié.');
      } else if (guardianName.confidence < config.mediumConfidenceThreshold) {
        criteria.push({
          id: 'CRIT_GUARDIAN_NAME',
          code: 'GUARDIAN_NAME',
          title: 'Nom et prénom du parent / tuteur',
          status: 'UNCERTAIN',
          confidence: guardianName.confidence,
          message: `Nom du parent/tuteur identifié avec doute (${guardianName.value}).`,
          mandatory: true,
          relatedField: 'guardian_name'
        });
      } else {
        criteria.push({
          id: 'CRIT_GUARDIAN_NAME',
          code: 'GUARDIAN_NAME',
          title: 'Nom et prénom du parent / tuteur',
          status: 'PASS',
          confidence: guardianName.confidence,
          message: `Parent / tuteur identifié : ${guardianName.value}.`,
          mandatory: true,
          relatedField: 'guardian_name'
        });
      }
    }

    // Enfants ou personnes à charge
    if (config.lifeCert.requireDependents) {
      if (!dependents || !dependents.value || dependents.confidence < 0.4) {
        criteria.push({
          id: 'CRIT_DEPENDENTS',
          code: 'DEPENDENTS_LIST',
          title: 'Personnes / Enfants à charge',
          status: 'FAIL',
          confidence: dependents?.confidence || 0,
          message: 'Aucun enfant ou personne à charge lisiblement identifié(e).',
          mandatory: true,
          relatedField: 'dependents_list'
        });
        reasons.push('Les enfants / personnes à charge n\'ont pas pu être identifiés.');
      } else {
        criteria.push({
          id: 'CRIT_DEPENDENTS',
          code: 'DEPENDENTS_LIST',
          title: 'Personnes / Enfants à charge',
          status: 'PASS',
          confidence: dependents.confidence,
          message: `Personnes à charge recensées : ${dependents.value}.`,
          mandatory: true,
          relatedField: 'dependents_list'
        });
      }
    }

    // Date du document
    if (config.lifeCert.requireDocumentDate && docDate) {
      if (docDate.value && docDate.confidence >= 0.5) {
        criteria.push({
          id: 'CRIT_DOC_DATE',
          code: 'DOCUMENT_DATE',
          title: 'Date d\'établissement du document',
          status: 'PASS',
          confidence: docDate.confidence,
          message: `Date du certificat : ${docDate.value}.`,
          mandatory: false,
          relatedField: 'document_date'
        });
      }
    }

    // Signature requise
    if (config.lifeCert.requireSignature) {
      this.evaluateSignatureCriterion(signature, 'Déclarant / Autorité', criteria, reasons);
    }
  }

  private static evaluateSignatureCriterion(
    signature: SignatureDetectionInfo,
    authorityTitle: string,
    criteria: RuleCriterion[],
    reasons: string[]
  ) {
    if (!signature.detected) {
      criteria.push({
        id: 'CRIT_SIGNATURE',
        code: 'SIGNATURE_PRESENCE',
        title: `Signature requise (${authorityTitle})`,
        status: 'FAIL',
        confidence: signature.confidence,
        message: 'Signature absente ou non détectée à l\'emplacement attendu.',
        mandatory: true
      });
      reasons.push('Signature absente ou non détectée.');
    } else if (signature.confidence < 0.75 || !signature.handwrittenCharacteristics) {
      criteria.push({
        id: 'CRIT_SIGNATURE',
        code: 'SIGNATURE_PRESENCE',
        title: `Signature requise (${authorityTitle})`,
        status: 'UNCERTAIN',
        confidence: signature.confidence,
        message: 'Traces manuscrites détectées mais contraste ou netteté insuffisants.',
        mandatory: true
      });
      reasons.push('Présence de la signature ambiguë ou à confirmer manuellement.');
    } else {
      criteria.push({
        id: 'CRIT_SIGNATURE',
        code: 'SIGNATURE_PRESENCE',
        title: `Signature requise (${authorityTitle})`,
        status: 'PASS',
        confidence: signature.confidence,
        message: 'Signature manuscrite détectée dans la zone prévue.',
        mandatory: true
      });
    }
  }

  /**
   * Synthétise la décision finale en combinant les statuts des règles et les seuils de confiance.
   */
  private static synthesizeDecision(
    criteria: RuleCriterion[],
    reasons: string[],
    config: RuleConfiguration
  ): ValidationEvaluationResult {
    const mandatoryCriteria = criteria.filter(c => c.mandatory);
    const hasFailMandatory = mandatoryCriteria.some(c => c.status === 'FAIL');
    const hasUncertainMandatory = mandatoryCriteria.some(c => c.status === 'UNCERTAIN');

    // Calcul de la confiance globale pondérée
    const totalConfidence = criteria.reduce((acc, c) => acc + c.confidence, 0);
    const overallConfidence = criteria.length > 0 ? totalConfidence / criteria.length : 0.5;

    let status: ValidationStatus;
    let primaryReason = '';

    if (hasFailMandatory) {
      status = 'NON_VALIDE';
      primaryReason = reasons[0] || 'Critères obligatoires non satisfaits.';
    } else if (hasUncertainMandatory || overallConfidence < config.highConfidenceThreshold) {
      status = 'VERIFICATION_REQUISE';
      if (reasons.length > 0) {
        primaryReason = reasons[0];
      } else if (overallConfidence < config.highConfidenceThreshold) {
        primaryReason = `Indice de confiance global modéré (${Math.round(overallConfidence * 100)}%). Contrôle humain recommandé.`;
      } else {
        primaryReason = 'Vérification humaine requise sur certains champs.';
      }
    } else {
      status = 'VALIDE';
      primaryReason = 'Toutes les informations obligatoires et critères métier sont conformes.';
    }

    return {
      status,
      overallConfidence: Number(overallConfidence.toFixed(2)),
      primaryReason,
      reasons,
      criteria
    };
  }

  public static getDocumentTypeLabel(type: DocumentType): string {
    switch (type) {
      case 'CERTIFICAT_SCOLARITE':
        return 'Certificat de Scolarité';
      case 'CERTIFICAT_TRAVAIL':
        return 'Certificat de Travail';
      case 'CERTIFICAT_VIE_CHARGE':
        return 'Certificat de Vie et de Charge';
      default:
        return 'Document Inconnu / Non reconnu';
    }
  }
}
