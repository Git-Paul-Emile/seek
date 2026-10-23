import jsPDF from "jspdf";
import { PDF_COULEURS } from "@/lib/pdfCharte";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecuAbonnementData {
  type: "abonnement";
  proprietaireNom: string;
  proprietaireTelephone?: string;
  proprietaireEmail?: string;
  planNom: string;
  montant: number;
  modePaiement: string;
  reference: string;
  dateDebut: string;
  dateFin: string;
  createdAt: string;
}

export interface RecuMiseEnAvantData {
  type: "mise-en-avant";
  proprietaireNom: string;
  proprietaireTelephone?: string;
  proprietaireEmail?: string;
  formuleNom: string;
  bienTitre?: string;
  bienVille?: string;
  dureeJours: number;
  montant: number;
  modePaiement: string;
  reference: string;
  dateDebut: string;
  dateFin: string;
  createdAt: string;
}

export type RecuData = RecuAbonnementData | RecuMiseEnAvantData;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";
const fmtDate = (d: string) => {
  try {
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

// ─── Génération PDF ───────────────────────────────────────────────────────────

export const generateRecu = (data: RecuData) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;

  // Header band
  doc.setFillColor(...PDF_COULEURS.baobab);
  doc.rect(0, 0, W, 40, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...PDF_COULEURS.soleil);
  doc.text("SEEK", 15, 20);

  doc.setFontSize(10);
  doc.setTextColor(...PDF_COULEURS.blanc);
  doc.text("Gestion Immobilière", 15, 28);

  doc.setFontSize(16);
  doc.setTextColor(...PDF_COULEURS.blanc);
  doc.setFont("helvetica", "bold");
  doc.text("REÇU DE PAIEMENT", W - 15, 22, { align: "right" });

  const label = data.type === "abonnement" ? "ABONNEMENT" : "MISE EN AVANT";
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COULEURS.soleil);
  doc.text(label, W - 15, 30, { align: "right" });

  // Date & Référence
  let y = 52;
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COULEURS.texte2);
  doc.setFont("helvetica", "normal");
  doc.text(`Date d'émission : ${fmtDate(data.createdAt)}`, 15, y);
  doc.text(`Référence paiement : ${data.reference}`, W - 15, y, { align: "right" });

  // Divider
  y += 6;
  doc.setDrawColor(...PDF_COULEURS.filet);
  doc.setLineWidth(0.4);
  doc.line(15, y, W - 15, y);

  // Propriétaire section
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COULEURS.texte2);
  doc.setFont("helvetica", "bold");
  doc.text("PROPRIÉTAIRE", 15, y);

  y += 6;
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COULEURS.encre);
  doc.text(data.proprietaireNom, 15, y);

  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COULEURS.texte2);
  doc.setFont("helvetica", "normal");
  if (data.proprietaireTelephone) doc.text(data.proprietaireTelephone, 15, y);
  if (data.proprietaireEmail) {
    y += 4;
    doc.text(data.proprietaireEmail, 15, y);
  }

  // Details card
  y += 14;
  doc.setFillColor(...PDF_COULEURS.surface);
  doc.setDrawColor(...PDF_COULEURS.filet);
  doc.roundedRect(15, y, W - 30, data.type === "abonnement" ? 58 : 68, 4, 4, "FD");

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COULEURS.texte2);

  const rows: [string, string][] = [];

  if (data.type === "abonnement") {
    rows.push(["Plan d'abonnement", data.planNom]);
    rows.push(["Période", `${fmtDate(data.dateDebut)} → ${fmtDate(data.dateFin)}`]);
    rows.push(["Durée", "30 jours"]);
    rows.push(["Mode de paiement", data.modePaiement]);
    rows.push(["Montant", fmt(data.montant)]);
  } else {
    rows.push(["Formule", data.formuleNom]);
    if (data.bienTitre) rows.push(["Annonce", data.bienTitre + (data.bienVille ? ` – ${data.bienVille}` : "")]);
    rows.push(["Durée mise en avant", `${data.dureeJours} jours`]);
    rows.push(["Période", `${fmtDate(data.dateDebut)} → ${fmtDate(data.dateFin)}`]);
    rows.push(["Mode de paiement", data.modePaiement]);
    rows.push(["Montant", fmt(data.montant)]);
  }

  rows.forEach(([key, val], i) => {
    const rowY = y + i * 9;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...PDF_COULEURS.texte2);
    doc.text(key, 25, rowY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...PDF_COULEURS.encre);
    doc.text(val, W - 25, rowY, { align: "right" });
  });

  // Total box
  y += rows.length * 9 + 14;
  doc.setFillColor(...PDF_COULEURS.baobab);
  doc.roundedRect(15, y, W - 30, 20, 4, 4, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COULEURS.blanc);
  doc.text("MONTANT TOTAL PAYÉ", 25, y + 8);

  doc.setFontSize(14);
  doc.setTextColor(...PDF_COULEURS.soleil);
  doc.text(fmt(data.montant), W - 25, y + 9, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(...PDF_COULEURS.blanc);
  doc.setFont("helvetica", "normal");
  doc.text("Statut : CONFIRMÉ", 25, y + 15);

  // Footer
  y = 270;
  doc.setDrawColor(...PDF_COULEURS.filet);
  doc.setLineWidth(0.3);
  doc.line(15, y, W - 15, y);

  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COULEURS.bordChamp);
  doc.setFont("helvetica", "normal");
  doc.text("Ce reçu est généré automatiquement par la plateforme Seek.", W / 2, y, { align: "center" });
  doc.text("Conservez ce document comme preuve de paiement.", W / 2, y + 4, { align: "center" });

  // Save
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename =
    data.type === "abonnement"
      ? `recu-abonnement-${dateStr}.pdf`
      : `recu-mise-en-avant-${dateStr}.pdf`;

  doc.save(filename);
};
