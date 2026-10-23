import jsPDF from "jspdf";
import { PDF_COULEURS } from "@/lib/pdfCharte";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RelanceData {
  numero: string;
  dateGeneration: string;
  dateEcheance: string;
  joursRetard: number;
  montant: number;
  bienTitre?: string;
  bienAdresse?: string;
  bienVille?: string;
  bienPays?: string;
  proprietaireNom: string;
  proprietaireTelephone?: string;
  locataireNom: string;
  locataireTelephone?: string;
}

// ─── Génération PDF ───────────────────────────────────────────────────────────

export function generateRelancePDF(data: RelanceData) {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Pas de rouge : l'alerte est en Soleil, le texte en encre (charte Seek).
  const RED  = PDF_COULEURS.soleil;
  const NAVY = PDF_COULEURS.encre;
  const GRAY = PDF_COULEURS.texte2;
  const WHITE = PDF_COULEURS.blanc;
  const GOLD  = PDF_COULEURS.baobab;

  // ── Bandeau d'alerte ─────────────────────────────────────────────────────────
  doc.setFillColor(...RED);
  doc.rect(0, 0, W, 40, "F");

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("LETTRE DE RELANCE", W / 2, 15, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Réf. ${data.numero}  •  Émise le ${data.dateGeneration}`, W / 2, 23, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(
    `RETARD : ${data.joursRetard} JOUR${data.joursRetard > 1 ? "S" : ""}`,
    W / 2, 32, { align: "center" }
  );

  // ── Branding ──────────────────────────────────────────────────────────────
  let y = 50;
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SEEK Immobilier", 15, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("Plateforme de gestion locative", 15, y + 5);
  y += 16;

  // ── Parties ───────────────────────────────────────────────────────────────
  const colW = (W - 35) / 2;

  // Propriétaire
  doc.setFillColor(...PDF_COULEURS.surface);
  doc.roundedRect(15, y, colW, 30, 3, 3, "F");
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("PROPRIÉTAIRE / BAILLEUR", 20, y + 7);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.proprietaireNom, 20, y + 14);
  if (data.proprietaireTelephone) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`Tél : ${data.proprietaireTelephone}`, 20, y + 21);
  }

  // Locataire
  const locX = 15 + colW + 5;
  doc.setFillColor(...PDF_COULEURS.surface);
  doc.roundedRect(locX, y, colW, 30, 3, 3, "F");
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("LOCATAIRE / PRENEUR", locX + 5, y + 7);
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.locataireNom, locX + 5, y + 14);
  if (data.locataireTelephone) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`Tél : ${data.locataireTelephone}`, locX + 5, y + 21);
  }

  y += 38;

  // ── Bien ──────────────────────────────────────────────────────────────────
  if (data.bienTitre) {
    doc.setFillColor(...PDF_COULEURS.surface);
    doc.roundedRect(15, y, W - 30, 24, 3, 3, "F");
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("BIEN IMMOBILIER", 20, y + 7);
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(data.bienTitre, 20, y + 14);
    const adresse = [data.bienAdresse, data.bienVille, data.bienPays].filter(Boolean).join(", ");
    if (adresse) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text(adresse, 20, y + 20);
    }
    y += 32;
  }

  // ── Encadré retard ────────────────────────────────────────────────────────
  doc.setFillColor(...PDF_COULEURS.soleil100);
  doc.roundedRect(15, y, W - 30, 28, 3, 3, "F");
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.5);
  doc.roundedRect(15, y, W - 30, 28, 3, 3, "S");

  const periode = new Date(data.dateEcheance).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("PAIEMENT EN RETARD", 22, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text(`Période : ${periode}`, 22, y + 18);

  doc.setFont("helvetica", "bold");
  doc.text(
    `Retard : ${data.joursRetard} j.  |  Montant dû : ${data.montant.toLocaleString("fr-FR")} FCFA`,
    22, y + 25
  );

  y += 36;

  // ── Séparateur ────────────────────────────────────────────────────────────
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(15, y, W - 15, y);
  y += 10;

  // ── Corps de la lettre ────────────────────────────────────────────────────
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);

  const dateEchStr = new Date(data.dateEcheance).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const body = [
    `Madame, Monsieur ${data.locataireNom},`,
    "",
    `Nous vous rappelons que votre loyer pour la période de ${periode}`,
    `était dû le ${dateEchStr} et demeure à ce jour impayé.`,
    "",
    `  • Montant dû : ${data.montant.toLocaleString("fr-FR")} FCFA`,
    `  • Jours de retard : ${data.joursRetard} jour${data.joursRetard > 1 ? "s" : ""}`,
    "",
    "Nous vous prions de bien vouloir régulariser cette situation dans",
    "les meilleurs délais afin d'éviter tout contentieux.",
    "",
    "Pour toute question, votre bailleur reste joignable au",
    `${data.proprietaireTelephone ?? "numéro indiqué sur votre contrat"}.`,
    "",
    "En cas de difficultés passagères, n'hésitez pas à nous contacter",
    "afin de convenir d'un arrangement amiable.",
    "",
    "Dans l'attente de votre règlement,",
    "Veuillez agréer nos meilleures salutations.",
  ];

  for (const line of body) {
    if (y > H - 40) break;
    doc.text(line, 15, y);
    y += 6;
  }

  // ── Signature ─────────────────────────────────────────────────────────────
  y += 4;
  if (y < H - 35) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(data.proprietaireNom, 15, y);
    if (data.proprietaireTelephone) {
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY);
      doc.text(`Tél : ${data.proprietaireTelephone}`, 15, y);
    }
  }

  // ── Footer doré ───────────────────────────────────────────────────────────
  doc.setFillColor(...GOLD);
  doc.rect(0, H - 18, W, 18, "F");
  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "Ce document est une mise en demeure amiable de paiement de loyer.",
    W / 2, H - 10, { align: "center" }
  );
  doc.text("SEEK Immobilier - Plateforme de gestion locative", W / 2, H - 5, { align: "center" });

  // ── Save ──────────────────────────────────────────────────────────────────
  const moisAnnee = new Date(data.dateEcheance)
    .toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" })
    .replace("/", "-");
  doc.save(`relance-${moisAnnee}-${data.numero}.pdf`);
}
