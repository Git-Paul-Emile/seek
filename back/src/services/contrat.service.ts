import { StatusCodes } from "http-status-codes";
import { getFrontendBaseUrl } from "../config/external.js";
import { AppError } from "../utils/AppError.js";
import { prisma } from "../config/database.js";
import * as ContratRepo from "../repositories/contrat.repository.js";
import { sendMail } from "../utils/mailer.js";
import { envoyerNotification } from "./notification.service.js";
import * as LocataireService from "./locataire.service.js";
import * as BailService from "./bail.service.js";

// ─── Substitution de variables ────────────────────────────────────────────────

const formatDate = (d: Date | null | undefined) => {
  if (!d) return "";
  return new Intl.DateTimeFormat("fr-SN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d));
};

const formatMontant = (n: number | null | undefined) => {
  if (n == null) return "";
  return new Intl.NumberFormat("fr-SN").format(n) + " FCFA";
};

const formatDuree = (debut: Date, fin: Date | null | undefined): string => {
  if (!fin) return "indéterminée";
  const d = new Date(debut);
  const f = new Date(fin);
  const totalMonths =
    (f.getFullYear() - d.getFullYear()) * 12 + (f.getMonth() - d.getMonth());
  if (totalMonths <= 0) return "";
  if (totalMonths < 12) return `${totalMonths} mois`;
  const years = Math.floor(totalMonths / 12);
  const rem = totalMonths % 12;
  if (rem === 0) return `${years} an${years > 1 ? "s" : ""}`;
  return `${years} an${years > 1 ? "s" : ""} et ${rem} mois`;
};

interface ContratData {
  bail: {
    typeBail?: string | null;
    dateDebutBail: Date;
    dateFinBail?: Date | null;
    montantLoyer: number;
    montantCaution?: number | null;
    frequencePaiement?: string | null;
    jourLimitePaiement?: number | null;
  };
  locataire: {
    nom: string;
    prenom: string;
    situationProfessionnelle?: string | null;
  };
  proprietaire: {
    nom: string;
    prenom: string;
  };
  bien: {
    titre?: string | null;
    region?: string | null;
    ville?: string | null;
    quartier?: string | null;
    adresse?: string | null;
  };
}

export const substituerVariables = (contenu: string, data: ContratData): string => {
  const { bail, locataire, proprietaire, bien } = data;
  const adresseBien = [bien.adresse, bien.quartier, bien.ville].filter(Boolean).join(", ") || "";

  const vars: Record<string, string> = {
    nom_bailleur:          proprietaire.nom,
    prenom_bailleur:       proprietaire.prenom,
    nom_locataire:         locataire.nom,
    prenom_locataire:      locataire.prenom,
    profession_locataire:    locataire.situationProfessionnelle || "",
    adresse_bien:            adresseBien,
    ville:                   bien.region || bien.ville || "",
    region:                  bien.region || bien.ville || "",
    quartier:                bien.quartier || "",
    loyer:                   formatMontant(bail.montantLoyer),
    caution:                 formatMontant(bail.montantCaution),
    date_debut:              formatDate(bail.dateDebutBail),
    date_fin:                formatDate(bail.dateFinBail),
    duree:                   formatDuree(bail.dateDebutBail, bail.dateFinBail),
    type_bail:               bail.typeBail || "",
    frequence_paiement:      bail.frequencePaiement || "mensuel",
    jour_limite_paiement:    bail.jourLimitePaiement != null ? `le ${bail.jourLimitePaiement} de chaque mois` : "",
    date_signature:          formatDate(new Date()),
  };

  return contenu.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const assertBienOwner = async (bienId: string, proprietaireId: string) => {
  const bien = await prisma.bien.findUnique({
    where: { id: bienId },
    select: { proprietaireId: true, titre: true, region: true, ville: true, quartier: true, adresse: true },
  });
  if (!bien) throw new AppError("Bien introuvable", StatusCodes.NOT_FOUND);
  if (bien.proprietaireId !== proprietaireId)
    throw new AppError("Accès refusé", StatusCodes.FORBIDDEN);
  return bien;
};

const getBailWithRelations = async (bailId: string, bienId: string) => {
  const bail = await prisma.bailLocation.findUnique({
    where: { id: bailId },
    select: {
      bienId: true,
      typeBail: true,
      dateDebutBail: true,
      dateFinBail: true,
      montantLoyer: true,
      montantCaution: true,
      frequencePaiement: true,
      jourLimitePaiement: true,
      locataire: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          statut: true,
          situationProfessionnelle: true,
        },
      },
    },
  });
  if (!bail) throw new AppError("Bail introuvable", StatusCodes.NOT_FOUND);
  if (bail.bienId !== bienId)
    throw new AppError("Bail non associé à ce bien", StatusCodes.BAD_REQUEST);
  return bail;
};

/** Cherche le modèle le mieux adapté au type de bail :
 *  1. correspondance exacte sur typeBail
 *  2. modèle générique (typeBail = null)
 */
const findModele = async (typeBail?: string | null) => {
  if (typeBail) {
    const exact = await prisma.modeleContrat.findFirst({
      where: { typeBail, actif: true },
      orderBy: [{ ordre: "asc" }],
    });
    if (exact) return exact;
  }
  // Fallback: modèle générique
  const generic = await prisma.modeleContrat.findFirst({
    where: { typeBail: null, actif: true },
    orderBy: [{ ordre: "asc" }],
  });
  return generic;
};

// ─── Service functions ────────────────────────────────────────────────────────

export const getContrat = async (bienId: string, bailId: string, proprietaireId: string) => {
  await assertBienOwner(bienId, proprietaireId);
  await getBailWithRelations(bailId, bienId);
  return ContratRepo.findByBailId(bailId);
};

/** Génère automatiquement un contrat en sélectionnant le modèle selon le type de bail */
export const genererContrat = async (
  bienId: string,
  bailId: string,
  proprietaireId: string
) => {
  const bien = await assertBienOwner(bienId, proprietaireId);
  const bail = await getBailWithRelations(bailId, bienId);

  // Un contrat actif ne peut pas être regénéré
  const existing = await ContratRepo.findByBailId(bailId);
  if (existing && existing.statut === "ACTIF")
    throw new AppError("Ce bail a déjà un contrat actif.", StatusCodes.CONFLICT);

  // Supprimer l'éventuel brouillon
  if (existing && existing.statut === "BROUILLON") {
    await ContratRepo.remove(existing.id);
  }

  const modele = await findModele(bail.typeBail);
  if (!modele)
    throw new AppError(
      "Aucun modèle de contrat disponible. Contactez l'administrateur.",
      StatusCodes.NOT_FOUND
    );

  const proprietaire = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    select: { nom: true, prenom: true },
  });
  if (!proprietaire) throw new AppError("Propriétaire introuvable", StatusCodes.NOT_FOUND);

  const contenu = substituerVariables(modele.contenu, {
    bail: {
      typeBail:             bail.typeBail,
      dateDebutBail:        bail.dateDebutBail,
      dateFinBail:          bail.dateFinBail,
      montantLoyer:         bail.montantLoyer,
      montantCaution:       bail.montantCaution,
      frequencePaiement:    bail.frequencePaiement,
      jourLimitePaiement:   bail.jourLimitePaiement,
    },
    locataire: bail.locataire,
    proprietaire,
    bien,
  });

  return ContratRepo.create({
    bailId,
    modeleId: modele.id,
    titre: modele.titre,
    contenu,
  });

  // Marquer le bien comme réservé pendant la négociation du contrat
  const statutReserveId = await prisma.statutBien.findUnique({
    where: { slug: "reserve" },
    select: { id: true },
  });
  if (statutReserveId) {
    await prisma.bien.update({
      where: { id: bienId },
      data: { statutBienId: statutReserveId!.id },
    });
  }
};

export const updateContrat = async (
  bienId: string,
  bailId: string,
  contratId: string,
  proprietaireId: string,
  contenu: string
) => {
  await assertBienOwner(bienId, proprietaireId);
  const contrat = await ContratRepo.findByBailId(bailId);
  if (!contrat || contrat.id !== contratId)
    throw new AppError("Contrat introuvable", StatusCodes.NOT_FOUND);
  if (contrat.statut === "ACTIF")
    throw new AppError("Un contrat actif ne peut plus être modifié", StatusCodes.BAD_REQUEST);
  return ContratRepo.update(contratId, { contenu });
};

export const activerContrat = async (
  bienId: string,
  bailId: string,
  contratId: string,
  proprietaireId: string
) => {
  await assertBienOwner(bienId, proprietaireId);
  const contrat = await ContratRepo.findByBailId(bailId);
  if (!contrat || contrat.id !== contratId)
    throw new AppError("Contrat introuvable", StatusCodes.NOT_FOUND);
  if (contrat.statut === "ACTIF")
    throw new AppError("Le contrat est déjà actif", StatusCodes.BAD_REQUEST);
  
  // Activer le contrat
  const contratActif = await ContratRepo.updateStatut(contratId, "ACTIF");

  // Activer le bail et effectuer les actions associées
  await BailService.activerBail(bienId, bailId, proprietaireId);
  
  // Récupérer le lien d'activation du locataire
  const bail = await getBailWithRelations(bailId, bienId);
  let lienActivation = null;
  
  if (bail.locataire && bail.locataire.statut !== "ACTIF") {
    try {
      const lienData = await LocataireService.getLien(bail.locataire.id, proprietaireId);
      lienActivation = lienData.lien;
    } catch (error) {
      console.warn("[activerContrat] Impossible de générer le lien d'activation:", (error as Error).message);
    }
  }
  
  return {
    contrat: contratActif,
    lienActivation,
  };
};

/** Active le contrat ET notifie le locataire (email / whatsapp / sms).
 *  L'envoi est best-effort : un échec de notification ne bloque pas l'activation. */
export const envoyerContrat = async (
  bienId: string,
  bailId: string,
  contratId: string,
  proprietaireId: string
) => {
  await assertBienOwner(bienId, proprietaireId);
  const contrat = await ContratRepo.findByBailId(bailId);
  if (!contrat || contrat.id !== contratId)
    throw new AppError("Contrat introuvable", StatusCodes.NOT_FOUND);

  // Activer si ce n'est pas déjà fait
  if (contrat.statut !== "ACTIF") {
    await ContratRepo.updateStatut(contratId, "ACTIF");
  }

  // Activer le bail et effectuer les actions associées (statut bien → Loué, échéancier, etc.)
  await BailService.activerBail(bienId, bailId, proprietaireId);

  const bail = await getBailWithRelations(bailId, bienId);
  
  // Récupérer le lien d'activation du locataire
  let lienActivation = null;
  if (bail.locataire && bail.locataire.statut !== "ACTIF") {
    try {
      const lienData = await LocataireService.getLien(bail.locataire.id, proprietaireId);
      lienActivation = lienData.lien;
    } catch (error) {
      console.warn("[envoyerContrat] Impossible de générer le lien d'activation:", (error as Error).message);
    }
  }

  // Envoi email best-effort (ne bloque pas si pas d'email ou si SMTP non configuré)
  if (bail.locataire.email) {
    try {
      const proprietaire = await prisma.proprietaire.findUnique({
        where: { id: proprietaireId },
        select: { nom: true, prenom: true },
      });

      const dashboardLink = `${getFrontendBaseUrl()}/locataire/dashboard`;
      await sendMail({
        to: bail.locataire.email,
        subject: `Votre contrat de bail - ${contrat.titre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
            <div style="background:#0C1A35; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color:#D4A843; margin:0; font-size:24px;">Seek Immobilier</h1>
              <p style="color:#fff; margin:8px 0 0; font-size:14px;">Votre contrat de bail est prêt</p>
            </div>
            <div style="border:1px solid #e5e7eb; border-top:none; padding:24px; border-radius:0 0 8px 8px;">
              <p>Bonjour <strong>${bail.locataire.prenom} ${bail.locataire.nom}</strong>,</p>
              <p>
               ${proprietaire ? `${proprietaire.prenom} ${proprietaire.nom}` : "Votre propriétaire"}
                vous a transmis votre contrat de bail. Veuillez en prendre connaissance ci-dessous.
              </p>
              <p>
                <a href="${dashboardLink}" style="background:#D4A843;color:#0C1A35;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">
                  Ouvrir mon espace locataire
                </a>
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
              ${contrat.contenu}
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
              <p style="color:#6b7280; font-size:12px;">
                Ce contrat a été généré via la plateforme Seek Immobilier.
                Conservez ce document pour vos archives.
              </p>
            </div>
          </div>
        `,
        text: `Bonjour ${bail.locataire.prenom} ${bail.locataire.nom},\n\nVotre contrat de bail "${contrat.titre}" vous a été envoyé par votre propriétaire.`,
      });
    } catch (err) {
      console.warn("[envoyerContrat] Échec de l'envoi email :", (err as Error).message);
    }
  }

  // Envoi SMS (best-effort — l'email riche est déjà envoyé par sendMail ci-dessus)
  try {
    const dashboardLink = `${getFrontendBaseUrl()}/locataire/dashboard`;
    const contenuSms =
      `Bonjour ${bail.locataire.prenom} ${bail.locataire.nom}, votre contrat de bail "${contrat.titre}" vous a été transmis par votre propriétaire. Consultez-le ici : ${dashboardLink} - SEEK Immobilier`;
    await envoyerNotification({
      type: "CONTRAT",
      target: "locataire",
      telephone: bail.locataire.telephone,
      email: bail.locataire.email,
      sujet: "Contrat de bail disponible",
      contenu: contenuSms,
      bailId,
      bienId,
      proprietaireId,
      locataireId: bail.locataire.id,
    });
  } catch (err) {
    console.warn("[envoyerContrat] Échec de l'envoi SMS :", (err as Error).message);
  }

  return { sent: true, email: bail.locataire.email ?? null, lienActivation };
};
