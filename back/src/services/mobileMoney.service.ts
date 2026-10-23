// ─── Service Mobile Money (STUB) ─────────────────────────────────────────────
//
// Ce service simule l'initiation et la vérification de paiements Mobile Money.
// Chaque fonction retourne un message d'instructions pour que l'utilisateur
// effectue le paiement manuellement.
// Quand les APIs seront disponibles, remplacer le contenu de chaque fonction.
//
// APIs à intégrer :
//   - Orange Money API (CI, SN, CM, BF, ML, GN) → https://developer.orange.com
//   - MTN Mobile Money API (CM, BJ, GN, CG)     → https://momodeveloper.mtn.com
//   - Wave API                                   → contact commercial Wave
//   - Airtel Money                               → https://developer.airtel.africa

import { prisma } from "../config/database.js";
import { emitTransactionStatus, emitBadgeUpdate } from "./socket.service.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InitierPaiementParams {
  provider: string;
  montant: number;
  telephonePayeur: string;
  telephoneBeneficiaire: string;
  reference: string;
  echeanceId: string;
  bailId: string;
  bienId: string;
  locataireId: string;
  proprietaireId: string;
}

export interface StatutPaiementMM {
  transactionId?: string;
  statut: "INITIE" | "EN_COURS" | "CONFIRME" | "ECHEC";
  message: string;
  stub: true;
}

// ─── Instructions par provider ────────────────────────────────────────────────

const INSTRUCTIONS_PAR_PROVIDER: Record<string, (p: InitierPaiementParams) => string> = {
  "Orange Money": (p) =>
    `Composez *144# sur votre téléphone Orange → Transfert d'argent → ` +
    `Numéro : ${p.telephoneBeneficiaire} → Montant : ${p.montant.toLocaleString("fr-FR")} FCFA → ` +
    `Référence : ${p.reference}. Transmettez la confirmation à votre propriétaire.`,

  "MTN Mobile Money": (p) =>
    `Composez *126# ou *133# → MoMo → Envoyer → ` +
    `Numéro : ${p.telephoneBeneficiaire} → Montant : ${p.montant.toLocaleString("fr-FR")} FCFA → ` +
    `Référence : ${p.reference}. Transmettez la confirmation à votre propriétaire.`,

  "Wave": (p) =>
    `Ouvrez l'application Wave → Envoyer → Numéro : ${p.telephoneBeneficiaire} → ` +
    `Montant : ${p.montant.toLocaleString("fr-FR")} FCFA → Note : ${p.reference}. ` +
    `Transmettez la capture d'écran à votre propriétaire.`,

  "Moov Money": (p) =>
    `Composez *555# → Transfert → Numéro : ${p.telephoneBeneficiaire} → ` +
    `Montant : ${p.montant.toLocaleString("fr-FR")} FCFA → Référence : ${p.reference}.`,

  "Free Money": (p) =>
    `Composez *555# (Free) → Envoi → Numéro : ${p.telephoneBeneficiaire} → ` +
    `Montant : ${p.montant.toLocaleString("fr-FR")} FCFA → Référence : ${p.reference}.`,

  "Airtel Money": (p) =>
    `Ouvrez l'application Airtel Money → Envoyer → ` +
    `Numéro : ${p.telephoneBeneficiaire} → Montant : ${p.montant.toLocaleString("fr-FR")} FCFA → ` +
    `Référence : ${p.reference}.`,

  "T-Money": (p) =>
    `Composez *145# (T-Money Togocel) → Transfert → Numéro : ${p.telephoneBeneficiaire} → ` +
    `Montant : ${p.montant.toLocaleString("fr-FR")} FCFA → Référence : ${p.reference}.`,

  "Flooz": (p) =>
    `Composez *155# (Flooz Moov Togo) → Transfert → Numéro : ${p.telephoneBeneficiaire} → ` +
    `Montant : ${p.montant.toLocaleString("fr-FR")} FCFA → Référence : ${p.reference}.`,
};

const getInstructions = (p: InitierPaiementParams): string => {
  const fn = INSTRUCTIONS_PAR_PROVIDER[p.provider];
  return fn
    ? fn(p)
    : `Effectuez un transfert de ${p.montant.toLocaleString("fr-FR")} FCFA ` +
      `au numéro ${p.telephoneBeneficiaire} via ${p.provider}. ` +
      `Mentionnez la référence ${p.reference} et transmettez la confirmation à votre propriétaire.`;
};

// ─── Initier un paiement (STUB) ───────────────────────────────────────────────

export const initierPaiementMobileMoney = async (
  params: InitierPaiementParams
): Promise<StatutPaiementMM & { instructions: string }> => {
  // TODO: Remplacer par l'appel API réel (OAuth2 + POST /transactions)
  const instructions = getInstructions(params);

  // Enregistrer la transaction dans l'historique
  const transaction = await prisma.transaction.create({
    data: {
      proprietaireId: params.proprietaireId,
      type: "PAIEMENT_LOYER",
      statut: "EN_ATTENTE",
      montant: params.montant,
      devise: "XOF",
      modePaiement: params.provider,
      provider: params.provider,
      reference: params.reference,
      bienId: params.bienId,
      bailId: params.bailId,
      echeanceId: params.echeanceId,
      locataireId: params.locataireId,
      dateEcheance: new Date(),
      instructions,
      metadata: {
        telephonePayeur: params.telephonePayeur,
        telephoneBeneficiaire: params.telephoneBeneficiaire,
      },
    },
  });

  // Push temps réel : transaction EN_ATTENTE visible dans le dashboard owner
  emitTransactionStatus({
    transactionId: transaction.id,
    proprietaireId: params.proprietaireId,
    statut: "EN_ATTENTE",
    montant: params.montant,
    type: "PAIEMENT_LOYER",
    bienId: params.bienId,
    updatedAt: new Date().toISOString(),
  });
  emitBadgeUpdate(params.proprietaireId).catch(() => null);

  // Notifier le propriétaire
  await prisma.notification.create({
    data: {
      type: "INITIATION_PAIEMENT",
      canal: "SMS",
      destinataire: params.telephonePayeur,
      sujet: `Initiation paiement ${params.provider}`,
      contenu: instructions,
      statut: "EN_ATTENTE",
      echeanceId: params.echeanceId,
      bailId: params.bailId,
      bienId: params.bienId,
      proprietaireId: params.proprietaireId,
      locataireId: params.locataireId,
      messageRetour: `[STUB] Intégration ${params.provider} non configurée - paiement manuel requis`,
    },
  });

  return {
    statut: "INITIE",
    stub: true,
    instructions,
    message:
      `Intégration ${params.provider} en cours de déploiement. ` +
      `Suivez les instructions ci-dessus pour effectuer le paiement manuellement.`,
  };
};

// ─── Vérifier le statut d'un paiement (STUB) ──────────────────────────────────

export const verifierStatutPaiement = async (
  _transactionId: string,
  _provider: string
): Promise<StatutPaiementMM> => {
  // TODO: Remplacer par GET /transactions/{id} de l'API du provider
  return {
    statut: "EN_COURS",
    stub: true,
    message:
      "Vérification automatique non disponible. " +
      "Contactez votre propriétaire pour confirmer la réception du paiement.",
  };
};
