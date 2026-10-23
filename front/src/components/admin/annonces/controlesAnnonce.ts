import { DESCRIPTION_MIN, PHOTOS_MIN } from "@/components/owner/annonce/etapes";

// Contrôles automatiques affichés dans le panneau de décision (charte, planche 41).
// Ils ne décident rien : ils signalent ce que le modérateur doit regarder. Seuils repris
// du formulaire d'annonce, pour que l'admin et le propriétaire suivent les mêmes règles.

export interface Controle {
  ok: boolean;
  libelle: string;
}

interface AnnonceControlee {
  photos: string[];
  description: string | null;
  prix: number | null;
  quartier: string | null;
  ville: string | null;
}

// Mobile sénégalais (70, 75, 76, 77, 78) ou fixe (33), avec ou sans indicatif et séparateurs.
const TELEPHONE = /(?:(?:\+|00)\s*221[\s.-]*)?(?:7[05678]|33)(?:[\s.-]*\d){7}/;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;

export const contientCoordonnees = (texte: string) => TELEPHONE.test(texte) || EMAIL.test(texte);

export function controlerAnnonce(annonce: AnnonceControlee): Controle[] {
  const description = annonce.description?.trim() ?? "";
  const nbPhotos = annonce.photos.length;
  return [
    nbPhotos >= PHOTOS_MIN
      ? { ok: true, libelle: `${nbPhotos} photos` }
      : { ok: false, libelle: `${nbPhotos} photo${nbPhotos > 1 ? "s" : ""} seulement, ${PHOTOS_MIN} minimum` },
    description.length >= DESCRIPTION_MIN
      ? { ok: true, libelle: "Description complète" }
      : { ok: false, libelle: `Description courte : ${description.length} caractères sur ${DESCRIPTION_MIN}` },
    contientCoordonnees(description)
      ? { ok: false, libelle: "Numéro de téléphone ou e-mail dans la description" }
      : { ok: true, libelle: "Aucune coordonnée dans la description" },
    annonce.prix ? { ok: true, libelle: "Prix renseigné" } : { ok: false, libelle: "Prix absent" },
    annonce.quartier && annonce.ville
      ? { ok: true, libelle: "Quartier et ville renseignés" }
      : { ok: false, libelle: "Localisation incomplète" },
  ];
}
