import { describe, expect, it } from "vitest";
import { genererPdfEtatDesLieux } from "./etatDesLieuxPdf.service.js";

type EtatDesLieuxComplet = Parameters<typeof genererPdfEtatDesLieux>[0];

const maintenant = new Date("2026-11-03T10:30:00Z");

// Seuls les champs lus par le générateur sont renseignés : le reste du modèle Prisma est sans effet.
const etatDesLieux = {
  id: "edl-essai",
  type: "ENTREE",
  dateRealisation: maintenant,
  nbCles: 3,
  bien: { titre: "Appartement F3", adresse: null, quartier: "Ouakam", ville: "Dakar" },
  proprietaire: { prenom: "Aminata", nom: "Diop" },
  locataire: { prenom: "Ibrahima", nom: "Fall" },
  pieces: [
    {
      nom: "Salon",
      elements: [
        { nom: "Murs", etat: "BON", commentaire: "Peinture récente", photos: ["a.jpg"], estConteste: false, motifContestation: null, statutContestation: null },
        { nom: "Sol", etat: "USAGE", commentaire: null, photos: [], estConteste: true, motifContestation: "Rayures", statutContestation: "RESERVE" },
      ],
    },
  ],
} as unknown as EtatDesLieuxComplet;

describe("PDF de l'état des lieux signé", () => {
  it("produit un document PDF non vide", async () => {
    const pdf = await genererPdfEtatDesLieux(etatDesLieux, maintenant);
    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
