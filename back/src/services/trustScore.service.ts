import { prisma } from "../config/database.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrustScoreBreakdown {
  total: number;       // 0–100
  details: {
    base: number;
    identiteVerifiee: number;
    annoncesPubliees: number;
    anciennete: number;
    bailsActifs: number;
  };
  badges: ("identite_verifiee" | "anciennete_1an")[];
  nbAnnonces: number;
  nbBailsActifs: number;
  moisAnciennete: number;
}

// ─── Calcul ───────────────────────────────────────────────────────────────────

export const computeScoreForProprietaire = async (
  proprietaireId: string
): Promise<TrustScoreBreakdown> => {
  const proprietaire = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    select: {
      id: true,
      statutVerification: true,
      createdAt: true,
    },
  });

  if (!proprietaire) {
    return {
      total: 0,
      details: { base: 0, identiteVerifiee: 0, annoncesPubliees: 0, anciennete: 0, bailsActifs: 0 },
      badges: [],
      nbAnnonces: 0,
      nbBailsActifs: 0,
      moisAnciennete: 0,
    };
  }

  // ── Annonces publiées ─────────────────────────────────────────────────────
  const nbAnnonces = await prisma.bien.count({
    where: { proprietaireId, statutAnnonce: "PUBLIE", actif: true },
  });

  // ── Ancienneté en mois ────────────────────────────────────────────────────
  const now = new Date();
  const moisAnciennete = Math.floor(
    (now.getTime() - proprietaire.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // ── Bails actifs ──────────────────────────────────────────────────────────
  const nbBailsActifs = await prisma.bailLocation.count({
    where: {
      bien: { proprietaireId },
      statut: "ACTIF",
    },
  });

  // ── Calcul ────────────────────────────────────────────────────────────────
  const base = 15;
  const identiteVerifiee = proprietaire.statutVerification === "VERIFIED" ? 40 : 0;
  const annoncesPubliees = Math.min(nbAnnonces, 4) * 5; // max 20
  const anciennete = Math.min(moisAnciennete, 15);       // max 15
  const bailsActifs = Math.min(nbBailsActifs, 2) * 5;   // max 10

  const raw = base + identiteVerifiee + annoncesPubliees + anciennete + bailsActifs;
  const total = Math.min(100, Math.max(0, raw));

  // ── Badges ────────────────────────────────────────────────────────────────
  const badges: TrustScoreBreakdown["badges"] = [];
  if (proprietaire.statutVerification === "VERIFIED") badges.push("identite_verifiee");
  if (moisAnciennete >= 12) badges.push("anciennete_1an");

  return {
    total,
    details: {
      base,
      identiteVerifiee,
      annoncesPubliees,
      anciennete,
      bailsActifs,
    },
    badges,
    nbAnnonces,
    nbBailsActifs,
    moisAnciennete,
  };
};
