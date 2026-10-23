import jsPDF from "jspdf";
import JSZip from "jszip";
import { PDF_COULEURS } from "@/lib/pdfCharte";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuittanceData {
  numero: string;
  dateGeneration: string;
  dateEcheance: string;
  datePaiement: string;
  modePaiement?: string;
  reference?: string;
  note?: string;
  montantLoyer: number;
  statut: string;
  bienTitre?: string;
  bienAdresse?: string;
  bienVille?: string;
  bienPays?: string;
  proprietaireNom: string;
  proprietaireTelephone?: string;
  locataireNom: string;
  locataireTelephone?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";

function drawRoundedCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number
) {
  doc.setFillColor(...PDF_COULEURS.surface);
  doc.roundedRect(x, y, w, h, 3, 3, "F");
}

// ─── Génération PDF ───────────────────────────────────────────────────────────

function buildQuittancePDF(data: QuittanceData): jsPDF {
  const doc = new jsPDF({ format: "a4", unit: "mm" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Palette
  // Accents et bandeaux en Baobab, texte en encre (charte Seek).
  const GOLD  = PDF_COULEURS.baobab;
  const NAVY  = PDF_COULEURS.encre;
  const GRAY  = PDF_COULEURS.texte2;
  const WHITE = PDF_COULEURS.blanc;

  // ── Header gold bar ──────────────────────────────────────────────────────
  doc.setFillColor(...GOLD);
  doc.rect(0, 0, W, 40, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("QUITTANCE DE LOYER", W / 2, 16, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Réf. ${data.numero}  •  Émise le ${data.dateGeneration}`, W / 2, 24, { align: "center" });

  // ── App branding ─────────────────────────────────────────────────────────
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

  // ── Propriétaire / Locataire ──────────────────────────────────────────────
  const colW = (W - 35) / 2;

  // Propriétaire card
  drawRoundedCard(doc, 15, y, colW, 30);
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
    doc.text(`Tél : ${data.proprietaireTelephone}`, 20, y + 20);
  }

  // Locataire card
  const locX = 15 + colW + 5;
  drawRoundedCard(doc, locX, y, colW, 30);
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
    doc.text(`Tél : ${data.locataireTelephone}`, locX + 5, y + 20);
  }

  y += 38;

  // ── Bien immobilier ───────────────────────────────────────────────────────
  drawRoundedCard(doc, 15, y, W - 30, 24);
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("BIEN IMMOBILIER", 20, y + 7);

  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.bienTitre || "Logement", 20, y + 14);

  const adresseParts = [data.bienAdresse, data.bienVille, data.bienPays].filter(Boolean);
  if (adresseParts.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(adresseParts.join(", "), 20, y + 20);
  }

  y += 32;

  // ── Détails du paiement ───────────────────────────────────────────────────
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("DÉTAILS DU PAIEMENT", 15, y);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(15, y + 2, W - 15, y + 2);
  y += 9;

  const periode = new Date(data.dateEcheance).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const detailRows: [string, string][] = [
    ["Période de location", periode],
    ["Date de paiement", new Date(data.datePaiement).toLocaleDateString("fr-FR")],
    ...(data.modePaiement ? [["Mode de paiement", data.modePaiement] as [string, string]] : []),
    ...(data.reference ? [["Référence / N° transaction", data.reference] as [string, string]] : []),
  ];

  for (const [label, value] of detailRows) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(label + " :", 15, y);
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.text(value, 90, y);
    y += 7;
  }

  y += 4;

  // ── Montants ──────────────────────────────────────────────────────────────
  const rowsH = 8 + 10;
  drawRoundedCard(doc, 15, y, W - 30, rowsH + 6);

  let my = y + 8;

  const drawAmount = (label: string, amount: number, bold = false) => {
    doc.setTextColor(bold ? NAVY[0] : GRAY[0], bold ? NAVY[1] : GRAY[1], bold ? NAVY[2] : GRAY[2]);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9);
    doc.text(label, 22, my);
    doc.text(fmt(amount), W - 18, my, { align: "right" });
    my += 7;
  };

  drawAmount("Loyer mensuel", data.montantLoyer);

  // Separator before total
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.3);
  doc.line(22, my - 3, W - 18, my - 3);
  my += 1;

  drawAmount("TOTAL PAYÉ", data.montantLoyer, true);

  y = my + 8;

  // ── Note ─────────────────────────────────────────────────────────────────
  if (data.note) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    const noteText = doc.splitTextToSize(`Note : ${data.note}`, W - 30);
    doc.text(noteText, 15, y);
    y += noteText.length * 5 + 4;
  }

  // ── Signature zone ────────────────────────────────────────────────────────
  if (y < H - 55) {
    const sigY = Math.max(y + 10, H - 60);
    doc.setTextColor(...GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Signature du bailleur :", 15, sigY);
    doc.setDrawColor(...PDF_COULEURS.filet);
    doc.setLineWidth(0.3);
    doc.line(15, sigY + 15, 80, sigY + 15);
    doc.text("Signature du preneur :", W / 2 + 5, sigY);
    doc.line(W / 2 + 5, sigY + 15, W - 15, sigY + 15);
  }

  // ── Footer gold bar ───────────────────────────────────────────────────────
  doc.setFillColor(...GOLD);
  doc.rect(0, H - 18, W, 18, "F");

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "Ce document constitue une quittance de loyer valide. Conservez-le pour vos archives.",
    W / 2,
    H - 10,
    { align: "center" }
  );
  doc.text("SEEK Immobilier - Plateforme de gestion locative", W / 2, H - 5, {
    align: "center",
  });

  return doc;
}

export function generateQuittancePDF(data: QuittanceData) {
  const doc = buildQuittancePDF(data);
  const moisAnnee = new Date(data.dateEcheance)
    .toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" })
    .replace("/", "-");
  doc.save(`quittance-${moisAnnee}-${data.numero}.pdf`);
}

/** Génère le PDF d'une quittance et retourne un Blob (sans déclencher le téléchargement) */
export function generateQuittancePDFBlob(data: QuittanceData): Blob {
  const doc = buildQuittancePDF(data);
  return doc.output("blob");
}

/** Ouvre la quittance dans un nouvel onglet (sans téléchargement) */
export function openQuittancePDF(data: QuittanceData): void {
  const doc = buildQuittancePDF(data);
  const url = doc.output("bloburl") as unknown as string;
  window.open(url, "_blank");
}

/** Télécharge toutes les quittances fournies dans un fichier ZIP */
export async function downloadAllQuittancesZip(
  quittances: QuittanceData[],
  zipName = "quittances.zip"
): Promise<void> {
  const zip = new JSZip();
  for (const data of quittances) {
    const blob = generateQuittancePDFBlob(data);
    const moisAnnee = new Date(data.dateEcheance)
      .toLocaleDateString("fr-FR", { month: "2-digit", year: "numeric" })
      .replace("/", "-");
    zip.file(`quittance-${moisAnnee}-${data.numero}.pdf`, blob);
  }
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(url);
}
