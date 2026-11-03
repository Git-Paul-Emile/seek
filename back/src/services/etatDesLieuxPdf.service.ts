import PDFDocument from "pdfkit";
import type * as EtatDesLieuxRepo from "../repositories/etat-des-lieux.repository.js";

// Document signé d'un état des lieux, produit par le serveur au moment de la signature
// du locataire, à partir des données enregistrées : le document ne peut pas être fabriqué
// ou retouché côté navigateur.

type EtatDesLieuxComplet = NonNullable<Awaited<ReturnType<typeof EtatDesLieuxRepo.findById>>>;

const ETATS: Record<string, string> = {
  NEUF: "Neuf",
  BON: "Bon état",
  USAGE: "Usagé",
  MAUVAIS: "Mauvais état",
  DEGRADE: "Dégradé",
};

const MENTIONS: Record<string, string> = {
  RECTIFIE: "Rectifié par le propriétaire après contestation",
  RESERVE: "Réserve notée par le propriétaire",
  REFUSE: "Contestation refusée par le propriétaire",
  EN_ATTENTE: "Contestation en attente",
};

const BAOBAB = "#0A5C43";
const ENCRE = "#0C1F18";
const TEXTE2 = "#4B5B55";
const MARGE = 50;

const dateLongue = (date: Date) =>
  date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Dakar" });

const heure = (date: Date) =>
  date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Dakar" });

const nomComplet = (personne: { prenom?: string | null; nom?: string | null } | null) =>
  [personne?.prenom, personne?.nom].filter(Boolean).join(" ") || "Non renseigné";

/** Produit le PDF de l'état des lieux signé par le locataire à la date `signeLe`. */
export const genererPdfEtatDesLieux = (edl: EtatDesLieuxComplet, signeLe: Date): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGE, info: { Title: `État des lieux ${edl.id}` } });
    const morceaux: Buffer[] = [];
    doc.on("data", (morceau: Buffer) => morceaux.push(morceau));
    doc.on("end", () => resolve(Buffer.concat(morceaux)));
    doc.on("error", reject);

    const type = edl.type === "ENTREE" ? "d'entrée" : "de sortie";
    const adresse = [edl.bien?.adresse, edl.bien?.quartier, edl.bien?.ville].filter(Boolean).join(", ");

    doc.fillColor(BAOBAB).font("Helvetica-Bold").fontSize(20).text(`État des lieux ${type}`);
    doc.moveDown(0.3).fillColor(TEXTE2).font("Helvetica").fontSize(10).text(`Référence ${edl.id}`);
    doc.moveDown();

    doc.fillColor(ENCRE).font("Helvetica-Bold").fontSize(12).text(edl.bien?.titre || "Logement");
    if (adresse) doc.font("Helvetica").fontSize(11).text(adresse);
    doc.moveDown(0.5).font("Helvetica").fontSize(11);
    doc.text(`Propriétaire : ${nomComplet(edl.proprietaire)}`);
    doc.text(`Locataire : ${nomComplet(edl.locataire)}`);
    doc.text(`Réalisé le ${dateLongue(edl.dateRealisation)}`);
    if (edl.nbCles !== null) doc.text(`Clés remises : ${edl.nbCles}`);
    doc.moveDown();

    for (const piece of edl.pieces) {
      doc.fillColor(BAOBAB).font("Helvetica-Bold").fontSize(13).text(piece.nom);
      doc.moveDown(0.2);
      for (const element of piece.elements) {
        doc.fillColor(ENCRE).font("Helvetica-Bold").fontSize(11).text(`${element.nom} : ${ETATS[element.etat] ?? element.etat}`);
        doc.font("Helvetica").fontSize(10).fillColor(TEXTE2);
        if (element.commentaire) doc.text(element.commentaire);
        if (element.photos.length > 0) doc.text(`${element.photos.length} photo${element.photos.length > 1 ? "s" : ""} jointe${element.photos.length > 1 ? "s" : ""} au dossier`);
        if (element.estConteste && element.motifContestation) doc.text(`Contestation du locataire : ${element.motifContestation}`);
        const mention = element.statutContestation ? MENTIONS[element.statutContestation] : undefined;
        if (mention) doc.text(mention);
        doc.moveDown(0.4);
      }
      doc.moveDown(0.4);
    }

    doc.moveDown();
    doc.fillColor(ENCRE).font("Helvetica-Bold").fontSize(11).text("Signature");
    doc
      .font("Helvetica")
      .fontSize(10)
      .text(
        `Signé électroniquement par ${nomComplet(edl.locataire)}, depuis son espace locataire Seek, le ${dateLongue(signeLe)} à ${heure(signeLe)} (heure de Dakar).`,
      );
    doc.end();
  });
