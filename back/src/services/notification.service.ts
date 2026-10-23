import { prisma } from "../config/database.js";
import { getFrontendBaseUrl } from "../config/external.js";
import { sendMail } from "../utils/mailer.js";
import { sendSms } from "./sms.service.js";
import { sendWhatsapp } from "./whatsapp.service.js";
import { enqueueNotif } from "./notifQueue.service.js";
import { emitNotification, emitBadgeUpdate } from "./socket.service.js";
import type { CanalNotification } from "../types/notificationChannels.types.js";

const FRONTEND_URL = getFrontendBaseUrl();

// ─── Types ────────────────────────────────────────────────────────────────────

export type TypeNotif =
  | "RAPPEL_LOYER"
  | "CONFIRMATION_PAIEMENT"
  | "ALERTE_RETARD"
  | "INITIATION_PAIEMENT"
  | "VERIFICATION_LOCATAIRE"
  | "PAIEMENT_LOCATAIRE"
  | "PREAVIS"
  | "RESILIATION"
  | "FIN_BAIL"
  | "CONTRAT"
  | "RESET_PASSWORD"
  | "ALERTE"
  | "INVITATION_BAIL"
  | "VERIFICATION_TELEPHONE"
  | "PAIEMENT_ESPECES_LOCATAIRE"
  | "CONFIRMATION_ESPECES_PROPRIETAIRE"
  | "ETAT_DES_LIEUX_DISPONIBLE"
  | "ETAT_DES_LIEUX_VALIDE"
  | "ETAT_DES_LIEUX_MODIFIE"
  | "ANNONCE_VALIDEE"
  | "ANNONCE_REJETEE";

export interface NotificationPayload {
  type: TypeNotif;
  target?: "owner" | "locataire";
  /** Numéro de téléphone (obligatoire, prioritaire) */
  telephone: string;
  /** Email (optionnel, envoyé en complément si fourni) */
  email?: string | null;
  sujet?: string;
  contenu: string;
  /** HTML pour l'email (si différent du contenu texte) */
  htmlEmail?: string;
  echeanceId?: string;
  bailId?: string;
  bienId?: string;
  proprietaireId?: string;
  locataireId?: string;
  noSmsEmail?: boolean;
  /** Envoyer uniquement par email (pas de SMS) */
  emailOnly?: boolean;
  /**
   * Si true, attend l'envoi réel (SMS/email/WhatsApp) avant de retourner, afin de
   * pouvoir remonter un échec à l'appelant (ex: action explicite "renvoyer le code").
   * Par défaut, l'envoi est fire-and-forget (mis en file) pour ne pas bloquer la réponse HTTP.
   */
  sync?: boolean;
}

// ─── Résolution des canaux préférés d'un propriétaire ─────────────────────────

const resolveCanauxProprietaire = async (
  proprietaireId: string | undefined
): Promise<CanalNotification[]> => {
  if (!proprietaireId) return ["SMS"];
  const proprietaire = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    select: { canauxNotification: true },
  });
  const canaux = proprietaire?.canauxNotification as CanalNotification[] | undefined;
  return canaux && canaux.length > 0 ? canaux : ["SMS"];
};

// ─── Envoi réel via les canaux choisis, en arrière-plan ────────────────────────

interface DispatchViaCanauxParams {
  notifId: string;
  canaux: CanalNotification[];
  telephone: string;
  email: string | null | undefined;
  contenu: string;
  sujet: string | undefined;
  htmlEmail: string | undefined;
}

async function dispatchViaCanaux(params: DispatchViaCanauxParams): Promise<boolean> {
  const { notifId, canaux, telephone, email, contenu, sujet, htmlEmail } = params;

  const retours: string[] = [];
  let success = false;

  if (canaux.includes("SMS")) {
    const smsResult = await sendSms(telephone, contenu);
    retours.push(`SMS: ${smsResult.messageRetour}`);
    success = success || smsResult.success;
  }

  if (canaux.includes("EMAIL") && email) {
    try {
      await sendMail({
        to: email,
        subject: sujet ?? "Notification SEEK Immobilier",
        html: htmlEmail ?? `<p>${contenu.replace(/\n/g, "<br>")}</p>`,
        text: contenu,
      });
      retours.push("Email: EMAIL_OK");
      success = true;
    } catch (err) {
      retours.push(`Email: EMAIL_ERR: ${err instanceof Error ? err.message : String(err)}`);
      console.error("[Notif] Erreur envoi email :", err);
    }
  }

  if (canaux.includes("WHATSAPP")) {
    const waResult = await sendWhatsapp(telephone, contenu);
    retours.push(`WhatsApp: ${waResult.messageRetour}`);
    success = success || waResult.success;
  }

  await prisma.notification.update({
    where: { id: notifId },
    data: {
      statut:       success ? "ENVOYE" : "ECHEC",
      messageRetour: retours.join(" | "),
      envoyeAt:      success ? new Date() : null,
    },
  });

  return success;
}

// ─── Créer + envoyer une notification ─────────────────────────────────────────

export const envoyerNotification = async (payload: NotificationPayload) => {
  // Déterminer les canaux effectifs : email forcé, préférences du propriétaire, ou défaut historique
  let canaux: CanalNotification[];
  if (payload.emailOnly) {
    canaux = ["EMAIL"];
  } else if (payload.target === "owner" && payload.proprietaireId) {
    canaux = await resolveCanauxProprietaire(payload.proprietaireId);
  } else {
    canaux = payload.email ? ["SMS", "EMAIL"] : ["SMS"];
  }

  // Enregistrer en base (statut EN_ATTENTE)
  const notification = await prisma.notification.create({
    data: {
      type:          payload.type as any,
      canal:         canaux.join("_"),
      destinataire:  payload.telephone,
      sujet:         payload.sujet,
      contenu:       payload.contenu,
      statut:        "EN_ATTENTE",
      echeanceId:    payload.echeanceId,
      bailId:        payload.bailId,
      bienId:        payload.bienId,
      proprietaireId: payload.proprietaireId,
      locataireId:   payload.locataireId,
    },
  });

  // Envoi : en arrière-plan (non-bloquant) par défaut, ou attendu si payload.sync
  let sent: boolean | undefined;
  if (!payload.noSmsEmail) {
    const task = () =>
      dispatchViaCanaux({
        notifId: notification.id,
        canaux,
        telephone: payload.telephone,
        email: payload.email,
        contenu: payload.contenu,
        sujet: payload.sujet,
        htmlEmail: payload.htmlEmail,
      });
    if (payload.sync) {
      sent = await task();
    } else {
      enqueueNotif(task);
    }
  }

  // Push temps réel si le destinataire est un propriétaire connecté
  if (payload.target === "owner" && payload.proprietaireId) {
    emitNotification({
      id: notification.id,
      proprietaireId: payload.proprietaireId,
      type: payload.type,
      titre: payload.sujet ?? payload.type,
      message: payload.contenu,
      bailId: payload.bailId,
      bienId: payload.bienId,
      createdAt: notification.createdAt.toISOString(),
    });
    emitBadgeUpdate(payload.proprietaireId).catch(() => null);
  }

  if (payload.target === "locataire" && payload.locataireId) {
    emitNotification({
      id: notification.id,
      locataireId: payload.locataireId,
      type: payload.type,
      titre: payload.sujet ?? payload.type,
      message: payload.contenu,
      bailId: payload.bailId,
      bienId: payload.bienId,
      createdAt: notification.createdAt.toISOString(),
    });
  }

  return { ...notification, sent };
};

// ─── Rappel loyer à venir / en retard ────────────────────────────────────────

export const envoyerRappelLoyer = async (params: {
  locataireTelephone: string;
  locataireEmail?: string | null;
  locataireNom: string;
  montant: number;
  dateEcheance: string;
  bienTitre?: string | null;
  echeanceId: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const contenu =
    `Bonjour ${params.locataireNom}, votre loyer de ${params.montant.toLocaleString("fr-FR")} FCFA` +
    ` est dû le ${new Date(params.dateEcheance).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    `. Merci de procéder au paiement. - SEEK Immobilier`;

  return envoyerNotification({
    type: "RAPPEL_LOYER",
    target: "locataire",
    telephone: params.locataireTelephone,
    email: params.locataireEmail,
    sujet: "Rappel de loyer",
    contenu,
    echeanceId: params.echeanceId,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Confirmation de paiement ─────────────────────────────────────────────────

export const envoyerConfirmationPaiement = async (params: {
  locataireTelephone: string;
  locataireEmail?: string | null;
  locataireNom: string;
  montant: number;
  datePaiement: string;
  reference?: string | null;
  bienTitre?: string | null;
  echeanceId: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const contenu =
    `Bonjour ${params.locataireNom}, votre paiement de ${params.montant.toLocaleString("fr-FR")} FCFA` +
    ` du ${new Date(params.datePaiement).toLocaleDateString("fr-FR")} a bien été enregistré` +
    (params.reference ? ` (réf: ${params.reference})` : "") +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    `. Merci. - SEEK Immobilier`;

  return envoyerNotification({
    type: "CONFIRMATION_PAIEMENT",
    target: "locataire",
    telephone: params.locataireTelephone,
    email: params.locataireEmail,
    sujet: "Confirmation de paiement",
    contenu,
    echeanceId: params.echeanceId,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

export const envoyerConfirmationPaiementProprietaire = async (params: {
  locataireTelephone: string;
  locataireEmail?: string | null;
  proprietaireLabel?: string | null;
  montant: number;
  datePaiement: string;
  modePaiement?: string | null;
  bienTitre?: string | null;
  echeanceId: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const proprietaireLabel = params.proprietaireLabel?.trim() || "Votre propriétaire";
  const montantStr = params.montant.toLocaleString("fr-FR");
  const dateStr = new Date(params.datePaiement).toLocaleDateString("fr-FR");
  const mode = (params.modePaiement ?? "").trim().toLowerCase();
  const isEspeces = mode === "espèces" || mode === "especes";

  return envoyerNotification({
    type: "CONFIRMATION_PAIEMENT",
    target: "locataire",
    telephone: params.locataireTelephone,
    email: params.locataireEmail,
    sujet: isEspeces
      ? "Paiement en espèces confirmé par votre propriétaire"
      : "Paiement confirmé par votre propriétaire",
    contenu:
      `${proprietaireLabel} a confirmé votre paiement ${isEspeces ? "en espèces " : ""}` +
      `de ${montantStr} FCFA du ${dateStr}` +
      (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
      `. Le paiement est maintenant validé. - SEEK Immobilier`,
    echeanceId: params.echeanceId,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Alerte retard ────────────────────────────────────────────────────────────

export const envoyerAlerteRetard = async (params: {
  locataireTelephone: string;
  locataireEmail?: string | null;
  locataireNom: string;
  montant: number;
  dateEcheance: string;
  joursRetard: number;
  bienTitre?: string | null;
  echeanceId: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const contenu =
    `Bonjour ${params.locataireNom}, votre loyer de ${params.montant.toLocaleString("fr-FR")} FCFA` +
    ` est en retard de ${params.joursRetard} jour(s)` +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    `. Veuillez régulariser au plus vite. - SEEK Immobilier`;

  return envoyerNotification({
    type: "ALERTE_RETARD",
    target: "locataire",
    telephone: params.locataireTelephone,
    email: params.locataireEmail,
    sujet: "Loyer en retard",
    contenu,
    echeanceId: params.echeanceId,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Initiation de paiement (côté locataire) ─────────────────────────────────

export const envoyerInitiationPaiement = async (params: {
  proprietaireTelephone: string;
  proprietaireEmail?: string | null;
  locataireNom: string;
  montant: number;
  dateEcheance: string;
  provider: string;
  bienTitre?: string | null;
  echeanceId: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const contenu =
    `Votre locataire ${params.locataireNom} indique avoir initié le paiement de ` +
    `${params.montant.toLocaleString("fr-FR")} FCFA via ${params.provider}` +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    `. Veuillez confirmer la réception. - SEEK Immobilier`;

  return envoyerNotification({
    type: "INITIATION_PAIEMENT",
    target: "owner",
    telephone: params.proprietaireTelephone,
    email: params.proprietaireEmail,
    sujet: "Initiation de paiement locataire",
    contenu,
    echeanceId: params.echeanceId,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
    noSmsEmail: true,
  });
};

// ─── Paiement enregistré par le locataire (notifier le propriétaire) ──────────

export const envoyerPaiementLocataire = async (params: {
  proprietaireTelephone: string;
  proprietaireEmail?: string | null;
  locataireNom: string;
  montant: number;
  datePaiement: string;
  reference?: string | null;
  bienTitre?: string | null;
  nombreMois?: number;
  echeanceId?: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const montantStr = params.montant.toLocaleString("fr-FR");
  const dateStr    = new Date(params.datePaiement).toLocaleDateString("fr-FR");
  const nbMois     = params.nombreMois && params.nombreMois > 1 ? ` (${params.nombreMois} mois)` : "";

  const lienConfirmation = `${FRONTEND_URL}/owner/biens/${params.bienId}/paiements`;
  const contenu =
    `Votre locataire ${params.locataireNom} a enregistré un paiement de loyer de ` +
    `${montantStr} FCFA${nbMois} le ${dateStr}` +
    (params.reference ? ` (réf: ${params.reference})` : "") +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    `. Confirmez la réception ici : ${lienConfirmation} - SEEK Immobilier`;

  return envoyerNotification({
    type: "PAIEMENT_LOCATAIRE",
    target: "owner",
    telephone: params.proprietaireTelephone,
    email: params.proprietaireEmail,
    sujet: "Paiement de loyer enregistré par votre locataire",
    contenu,
    echeanceId: params.echeanceId,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Paiement espèces enregistré par le propriétaire (notifier le locataire) ──

export const envoyerPaiementEspecesLocataire = async (params: {
  locataireTelephone: string;
  locataireEmail?: string | null;
  locataireNom: string;
  montant: number;
  datePaiement: string;
  bienTitre?: string | null;
  nombreMois?: number;
  echeanceId: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const lienConfirmation = `${FRONTEND_URL}/locataire/paiements`;
  const nbMois = params.nombreMois && params.nombreMois > 1 ? ` (${params.nombreMois} mois)` : "";
  const contenu =
     `Bonjour ${params.locataireNom}, votre propriétaire a enregistré un paiement en espèces` +
     ` de ${params.montant.toLocaleString("fr-FR")} FCFA${nbMois}` +
     ` en date du ${new Date(params.datePaiement).toLocaleDateString("fr-FR")}` +
     (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
     `. Confirmez ce paiement ici : ${lienConfirmation} - SEEK Immobilier`;

  return envoyerNotification({
    type: "PAIEMENT_ESPECES_LOCATAIRE",
    target: "locataire",
    telephone: params.locataireTelephone,
    email: params.locataireEmail,
    sujet: "Paiement en espèces à confirmer",
    contenu,
    echeanceId: params.echeanceId,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Confirmation espèces par le locataire (notifier le propriétaire) ─────────

export const envoyerConfirmationEspecesProprietaire = async (params: {
  proprietaireTelephone: string;
  proprietaireEmail?: string | null;
  locataireNom: string;
  montant: number;
  datePaiement: string;
  bienTitre?: string | null;
  echeanceId: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const contenu =
    `Votre locataire ${params.locataireNom} a confirmé son paiement en espèces` +
    ` de ${params.montant.toLocaleString("fr-FR")} FCFA` +
    ` du ${new Date(params.datePaiement).toLocaleDateString("fr-FR")}` +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    `. Le paiement est maintenant validé. - SEEK Immobilier`;

  return envoyerNotification({
    type: "CONFIRMATION_ESPECES_PROPRIETAIRE",
    target: "owner",
    telephone: params.proprietaireTelephone,
    email: params.proprietaireEmail,
    sujet: "Paiement en espèces confirmé par votre locataire",
    contenu,
    echeanceId: params.echeanceId,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Préavis (locataire notifié) ───────────────────────────────────────────────

export const envoyerPreavisLocataire = async (params: {
  locataireTelephone: string;
  locataireEmail?: string | null;
  locataireNom: string;
  bienTitre?: string | null;
  dateFinBail: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const fin = new Date(params.dateFinBail).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const contenu =
    `Bonjour ${params.locataireNom}, votre bailleur a déclenché un préavis` +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    `. Date de fin de bail fixée au ${fin}. - SEEK Immobilier`;

  return envoyerNotification({
    type: "PREAVIS",
    target: "locataire",
    telephone: params.locataireTelephone,
    email: params.locataireEmail,
    sujet: "Préavis de fin de bail",
    contenu,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Préavis (propriétaire notifié — locataire donne le préavis) ───────────────

export const envoyerPreavisProprietaire = async (params: {
  proprietaireTelephone: string;
  proprietaireEmail?: string | null;
  locataireNom: string;
  bienTitre?: string | null;
  dateFinBail: string;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const fin = new Date(params.dateFinBail).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const contenu =
    `Votre locataire ${params.locataireNom} a donné son préavis` +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    `. Date de fin de bail fixée au ${fin}. - SEEK Immobilier`;

  return envoyerNotification({
    type: "PREAVIS",
    target: "owner",
    telephone: params.proprietaireTelephone,
    email: params.proprietaireEmail,
    sujet: "Préavis donné par votre locataire",
    contenu,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Résiliation (locataire notifié) ──────────────────────────────────────────

export const envoyerResiliationLocataire = async (params: {
  locataireTelephone: string;
  locataireEmail?: string | null;
  locataireNom: string;
  bienTitre?: string | null;
  motif?: string | null;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const contenu =
    `Bonjour ${params.locataireNom}, votre bailleur a résilié votre bail` +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    (params.motif ? `. Motif : ${params.motif}` : "") +
    `. - SEEK Immobilier`;

  return envoyerNotification({
    type: "RESILIATION",
    target: "locataire",
    telephone: params.locataireTelephone,
    email: params.locataireEmail,
    sujet: "Résiliation de votre bail",
    contenu,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Résiliation par locataire (propriétaire notifié) ─────────────────────────

export const envoyerResiliationProprietaire = async (params: {
  proprietaireTelephone: string;
  proprietaireEmail?: string | null;
  locataireNom: string;
  bienTitre?: string | null;
  motif?: string | null;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const contenu =
    `Votre locataire ${params.locataireNom} a résilié le bail` +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    (params.motif ? `. Motif : ${params.motif}` : "") +
    `. - SEEK Immobilier`;

  return envoyerNotification({
    type: "RESILIATION",
    target: "owner",
    telephone: params.proprietaireTelephone,
    email: params.proprietaireEmail,
    sujet: "Résiliation par votre locataire",
    contenu,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Fin de bail (locataire notifié) ──────────────────────────────────────────

export const envoyerFinBailLocataire = async (params: {
  locataireTelephone: string;
  locataireEmail?: string | null;
  locataireNom: string;
  bienTitre?: string | null;
  bailId: string;
  bienId: string;
  proprietaireId: string;
  locataireId: string;
}) => {
  const contenu =
    `Bonjour ${params.locataireNom}, votre bail a été clôturé par votre bailleur` +
    (params.bienTitre ? ` pour ${params.bienTitre}` : "") +
    `. Merci pour votre séjour. - SEEK Immobilier`;

  return envoyerNotification({
    type: "FIN_BAIL",
    target: "locataire",
    telephone: params.locataireTelephone,
    email: params.locataireEmail,
    sujet: "Fin de votre bail",
    contenu,
    bailId: params.bailId,
    bienId: params.bienId,
    proprietaireId: params.proprietaireId,
    locataireId: params.locataireId,
  });
};

// ─── Lien d'activation du compte locataire ────────────────────────────────────

export const envoyerLienActivationLocataire = async (params: {
  locataireTelephone: string;
  locataireNom: string;
  lien: string;
}) => {
  const contenu =
     `Bonjour ${params.locataireNom}, votre propriétaire vous invite à activer votre compte locataire SEEK. ` +
     `Cliquez sur ce lien : ${params.lien} (valable 72h). - SEEK Immobilier`;

  return envoyerNotification({
    type: "VERIFICATION_LOCATAIRE",
    telephone: params.locataireTelephone,
    sujet: "Activation de votre compte locataire",
    contenu,
  });
};

// ─── Reset password (SMS + email) ─────────────────────────────────────────────

export const envoyerResetPasswordProprietaire = async (params: {
  telephone: string;
  email?: string | null;
  prenom: string;
  lien: string;
  proprietaireId: string;
}) => {
  const contenu =
    `Bonjour ${params.prenom}, réinitialisez votre mot de passe SEEK : ${params.lien} (valable 1h). ` +
    `Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.`;

  const htmlEmail = `
    <p>Bonjour ${params.prenom},</p>
    <p>Une demande de réinitialisation de mot de passe a été effectuée pour votre compte SEEK Immobilier.</p>
    <p><a href="${params.lien}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">Réinitialiser mon mot de passe</a></p>
    <p>Ou copiez ce lien : ${params.lien}</p>
    <p><small>Ce lien expire dans 1 heure.</small></p>
    <p><small>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</small></p>
  `;

  return envoyerNotification({
    type: "RESET_PASSWORD",
    telephone: params.telephone,
    email: params.email,
    sujet: "Réinitialisation de votre mot de passe SEEK",
    contenu,
    htmlEmail,
    proprietaireId: params.proprietaireId,
  });
};

// ─── OTP vérification téléphone (propriétaire inscription) ───────────────────

export const envoyerOtpTelephone = async (params: {
  telephone: string;
  prenom: string;
  otp: string;
  proprietaireId: string;
  /** Attendre l'envoi réel du SMS pour pouvoir signaler un échec à l'appelant (ex: renvoi explicite) */
  sync?: boolean;
}) => {
  const contenu =
    `Bonjour ${params.prenom}, votre code de vérification SEEK est : ${params.otp}. ` +
    `Valable ${process.env.OTP_EXPIRES_IN_MINUTES ?? "10"} minutes. Ne partagez jamais ce code.`;

  return envoyerNotification({
    type: "VERIFICATION_TELEPHONE",
    telephone: params.telephone,
    sujet: "Code de vérification SEEK",
    contenu,
    proprietaireId: params.proprietaireId,
    sync: params.sync,
  });
};

// ─── Lister les notifications ─────────────────────────────────────────────────

export const getNotificationsBail = async (bailId: string) =>
  prisma.notification.findMany({
    where: { bailId },
    orderBy: { createdAt: "desc" },
  });

export const getNotificationsEcheance = async (echeanceId: string) =>
  prisma.notification.findMany({
    where: { echeanceId },
    orderBy: { createdAt: "desc" },
  });
