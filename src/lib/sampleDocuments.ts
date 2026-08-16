import { DocumentType } from '../types.js';

export interface SampleDocDefinition {
  id: string;
  title: string;
  category: DocumentType;
  expectedResult: 'VALIDE' | 'NON_VALIDE' | 'VERIFICATION_REQUISE';
  description: string;
  badge: string;
  generateImage: () => string; // returns data:image/png;base64,...
}

function createA4Canvas(drawContent: (ctx: CanvasRenderingContext2D, width: number, height: number) => void): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1130;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background A4 papier légèrement texturé
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Bordure discrète
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  drawContent(ctx, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

export const SAMPLE_DOCUMENTS: SampleDocDefinition[] = [
  {
    id: 'sample-scolarite-conforme',
    title: 'Certificat de Scolarité — Conforme (2026-2027)',
    category: 'CERTIFICAT_SCOLARITE',
    expectedResult: 'VALIDE',
    badge: 'Conforme ✓',
    description: 'Élève CM2, année 2026-2027, tampon officiel et signature du directeur.',
    generateImage: () => {
      return createA4Canvas((ctx, w, h) => {
        // En-tête officiel République Française / Ministère
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('RÉPUBLIQUE FRANÇAISE', 60, 70);
        ctx.font = '12px sans-serif';
        ctx.fillText('MINISTÈRE DE L\'ÉDUCATION NATIONALE', 60, 90);
        ctx.fillText('Académie de Paris — Circonscription du 5ème', 60, 108);

        // Date en haut à droite
        ctx.textAlign = 'right';
        ctx.fillText('Fait à Paris, le 04/09/2026', w - 60, 70);

        // Ligne de séparation
        ctx.strokeStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.moveTo(60, 130);
        ctx.lineTo(w - 60, 130);
        ctx.stroke();

        // Titre Document
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.fillText('CERTIFICAT DE SCOLARITÉ', w / 2, 190);
        ctx.font = 'italic 14px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('Attestation d\'inscription pour l\'année scolaire en cours', w / 2, 215);

        // Corps du document
        ctx.textAlign = 'left';
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#1E293B';

        const lines = [
          'Le Directeur de l\'établissement soussigné certifie que :',
          '',
          'L\'élève : DUPONT Jean',
          'Né(e) le : 14/05/2015 à Paris (75)',
          '',
          'Est régulièrement inscrit(e) et fréquente assidûment les cours de :',
          'Classe : CM2 (Cours Moyen 2ème année)',
          'Année scolaire : 2026-2027',
          '',
          'Établissement : ÉCOLE ÉLÉMENTAIRE VICTOR HUGO',
          'Adresse : 12 rue des Écoles, 75005 Paris',
          '',
          'Ce certificat est délivré pour servir et valoir ce que de droit.'
        ];

        let y = 280;
        lines.forEach(line => {
          if (line.startsWith('L\'élève') || line.startsWith('Classe') || line.startsWith('Année') || line.startsWith('Établissement')) {
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = '#0F172A';
          } else {
            ctx.font = '15px sans-serif';
            ctx.fillStyle = '#334155';
          }
          ctx.fillText(line, 60, y);
          y += 26;
        });

        // Zone de signature et cachet
        ctx.strokeRect(w - 320, 780, 260, 150);
        ctx.fillStyle = '#64748B';
        ctx.font = '12px sans-serif';
        ctx.fillText('Cachet de l\'établissement et signature :', w - 310, 805);
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.fillText('Le Directeur : M. Philippe LAURENT', w - 310, 830);

        // Dessin de signature manuscrite
        ctx.strokeStyle = '#1E3A8A';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w - 260, 890);
        ctx.bezierCurveTo(w - 240, 850, w - 210, 920, w - 180, 870);
        ctx.bezierCurveTo(w - 150, 840, w - 120, 900, w - 90, 860);
        ctx.stroke();

        // Tampon rond bleu officiel
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w - 230, 880, 42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = 'bold 8px sans-serif';
        ctx.fillStyle = '#2563EB';
        ctx.textAlign = 'center';
        ctx.fillText('ACADÉMIE DE PARIS', w - 230, 875);
        ctx.fillText('ÉCOLE V. HUGO', w - 230, 890);
      });
    }
  },
  {
    id: 'sample-scolarite-mauvaise-annee',
    title: 'Certificat de Scolarité — Année Non Conforme (2023-2024)',
    category: 'CERTIFICAT_SCOLARITE',
    expectedResult: 'VERIFICATION_REQUISE',
    badge: 'Année 2023-2024 ⚠',
    description: 'Document officiel mais mentionnant l\'année 2023-2024 au lieu de 2026-2027.',
    generateImage: () => {
      return createA4Canvas((ctx, w, h) => {
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('LYCÉE HENRI IV — PARIS', 60, 70);
        ctx.font = '12px sans-serif';
        ctx.fillText('Secrétariat de scolarité', 60, 90);

        ctx.textAlign = 'right';
        ctx.fillText('Paris, le 15/10/2023', w - 60, 70);

        ctx.strokeStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.moveTo(60, 120);
        ctx.lineTo(w - 60, 120);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.fillText('CERTIFICAT DE SCOLARITÉ', w / 2, 180);

        ctx.textAlign = 'left';
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#334155';

        const lines = [
          'Le Proviseur certifie que :',
          '',
          'L\'élève : JEAN DUPONT',
          'Classe : CM2',
          'Année scolaire : 2023-2024',
          '',
          'Établissement : LYCÉE HENRI IV, PARIS'
        ];

        let y = 260;
        lines.forEach(line => {
          if (line.includes('2023-2024')) {
            ctx.fillStyle = '#B45309';
            ctx.font = 'bold 17px sans-serif';
          } else {
            ctx.fillStyle = '#1E293B';
            ctx.font = '15px sans-serif';
          }
          ctx.fillText(line, 60, y);
          y += 30;
        });

        // Signature présente
        ctx.strokeRect(w - 320, 750, 260, 140);
        ctx.fillStyle = '#64748B';
        ctx.font = '12px sans-serif';
        ctx.fillText('Signature du Proviseur :', w - 310, 775);

        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w - 250, 830);
        ctx.bezierCurveTo(w - 200, 800, w - 160, 870, w - 100, 820);
        ctx.stroke();
      });
    }
  },
  {
    id: 'sample-travail-complet',
    title: 'Certificat de Travail — Conforme 1er Trimestre',
    category: 'CERTIFICAT_TRAVAIL',
    expectedResult: 'VALIDE',
    badge: 'T1 Complet ✓',
    description: '3 mois présents (Janvier, Février, Mars), 455 heures de travail et signature employeur.',
    generateImage: () => {
      return createA4Canvas((ctx, w, h) => {
        ctx.fillStyle = '#047857';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('NEXUS LOGISTICS SAS', 60, 75);
        ctx.fillStyle = '#64748B';
        ctx.font = '12px sans-serif';
        ctx.fillText('RCS Paris B 892 411 902 — SIRET 89241190200018', 60, 95);

        ctx.textAlign = 'right';
        ctx.fillText('Date : 31/03/2026', w - 60, 75);

        ctx.textAlign = 'center';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.fillText('CERTIFICAT DE TRAVAIL TRIMESTRIEL', w / 2, 175);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('Attestation d\'activité et décompte des heures — 1er Trimestre 2026', w / 2, 200);

        ctx.textAlign = 'left';
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#1E293B';

        const lines = [
          'Nous soussignés, NEXUS LOGISTICS SAS, certifions par la présente que :',
          '',
          'Mme SOPHIE BERNARD',
          'Demeurant au : 45 avenue de la République, 75011 Paris',
          '',
          'A été régulièrement employée au sein de notre entreprise pour la période suivante :',
          'Mois travaillés : Janvier, Février, Mars (1er Trimestre 2026)',
          'Volume horaire effectif : 455 heures (151.67h / mois)',
          'Poste occupé : Coordinatrice Logistique',
          '',
          'En foi de quoi ce document est établi pour servir et valoir ce que de droit.'
        ];

        let y = 270;
        lines.forEach(line => {
          if (line.includes('Mois travaillés') || line.includes('Volume horaire') || line.includes('Mme SOPHIE')) {
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = '#0F172A';
          } else {
            ctx.font = '15px sans-serif';
            ctx.fillStyle = '#334155';
          }
          ctx.fillText(line, 60, y);
          y += 28;
        });

        // Signature Employeur
        ctx.strokeRect(w - 320, 780, 260, 150);
        ctx.fillStyle = '#475569';
        ctx.font = '13px sans-serif';
        ctx.fillText('Pour la direction des Ressources Humaines :', w - 310, 810);

        ctx.strokeStyle = '#1E3A8A';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(w - 270, 880);
        ctx.bezierCurveTo(w - 220, 830, w - 170, 920, w - 90, 870);
        ctx.stroke();

        // Tampon d'entreprise rectangulaire
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(w - 290, 840, 110, 60);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#047857';
        ctx.textAlign = 'center';
        ctx.fillText('NEXUS LOGISTICS', w - 235, 865);
        ctx.fillText('DIRECTION RH', w - 235, 880);
      });
    }
  },
  {
    id: 'sample-travail-incomplet',
    title: 'Certificat de Travail — Incomplet (Mois de Mars manquant)',
    category: 'CERTIFICAT_TRAVAIL',
    expectedResult: 'NON_VALIDE',
    badge: 'Mois Manquant ✕',
    description: 'Ne comporte que Janvier et Février pour le 1er trimestre. Rejet automatique.',
    generateImage: () => {
      return createA4Canvas((ctx, w, h) => {
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('TRANS-EUROPE LOGISTICS', 60, 75);

        ctx.textAlign = 'center';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('ATTESTATION DE TRAVAIL', w / 2, 175);

        ctx.textAlign = 'left';
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#334155';

        const lines = [
          'L\'entreprise atteste que M. ALEXANDRE VASSEUR a effectué les missions suivantes :',
          '',
          'Période couverte : Janvier, Février (Mois de Mars non renseigné)',
          'Heures travaillées : 302 heures',
          '',
          'Signature employeur apposée ci-dessous.'
        ];

        let y = 260;
        lines.forEach(line => {
          ctx.fillText(line, 60, y);
          y += 30;
        });

        // Signature présente
        ctx.strokeRect(w - 300, 700, 240, 120);
        ctx.strokeStyle = '#1E3A8A';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w - 240, 770);
        ctx.bezierCurveTo(w - 200, 720, w - 160, 800, w - 100, 760);
        ctx.stroke();
      });
    }
  },
  {
    id: 'sample-vie-charge-sans-signature',
    title: 'Certificat de Vie et de Charge — Signature Absente',
    category: 'CERTIFICAT_VIE_CHARGE',
    expectedResult: 'NON_VALIDE',
    badge: 'Sans Signature ✕',
    description: 'Comporte les informations des enfants mais la case signature est vierge.',
    generateImage: () => {
      return createA4Canvas((ctx, w, h) => {
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('MAIRIE DU 15ème ARRONDISSEMENT', 60, 70);
        ctx.font = '12px sans-serif';
        ctx.fillText('Service de l\'État Civil', 60, 90);

        ctx.textAlign = 'center';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText('CERTIFICAT DE VIE ET DE CHARGE', w / 2, 170);

        ctx.textAlign = 'left';
        ctx.font = '15px sans-serif';
        ctx.fillStyle = '#334155';

        const lines = [
          'Je soussigné(e) : NATHALIE MERCIER',
          'Demeurant à Paris, déclare sur l\'honneur avoir à ma charge les personnes suivantes :',
          '',
          '1. THÉO MERCIER — Né le 18/06/2012',
          '2. LÉA MERCIER — Née le 03/11/2015',
          '',
          'Fait à Paris, le 15/02/2026',
          '',
          'Cadre réservé à la signature du déclarant :'
        ];

        let y = 250;
        lines.forEach(line => {
          ctx.fillText(line, 60, y);
          y += 28;
        });

        // Encadré signature VIERGE (aucune trace manuscrite)
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(w - 320, 750, 260, 140);
        ctx.setLineDash([]);
        ctx.font = 'italic 12px sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.textAlign = 'center';
        ctx.fillText('[ EMPLACEMENT SIGNATURE VIERGE ]', w - 190, 825);
      });
    }
  },
  {
    id: 'sample-flou',
    title: 'Document Altéré — Photographie Floue',
    category: 'CERTIFICAT_SCOLARITE',
    expectedResult: 'NON_VALIDE',
    badge: 'Flou / Illisible ⚠',
    description: 'Document avec flou cinétique marqué déclenchant l\'alerte de reprise de photo.',
    generateImage: () => {
      return createA4Canvas((ctx, w, h) => {
        ctx.filter = 'blur(10px)';
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CERTIFICAT ILLISIBLE', w / 2, 200);
        ctx.font = '16px sans-serif';
        ctx.fillText('Texte non identifiable en raison d\'un flou important', w / 2, 260);
        ctx.filter = 'none';
      });
    }
  }
];
