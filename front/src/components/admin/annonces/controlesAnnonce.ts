import { Banknote, Camera, FileText, MapPin, PhoneOff, type LucideIcon } from "lucide-react";
import { DESCRIPTION_MIN, PHOTOS_MIN } from "@/components/owner/annonce/etapes";

// Contrôles automatiques affichés dans le panneau de décision (charte, planche 41).
// Ils ne décident rien : ils signalent ce que le modérateur doit regarder. Seuils repris
// du formulaire d'annonce, pour que l'admin et le propriétaire suivent les mêmes règles.

export interface Controle {
  ok: boolean;
  libelle: string;
  /** Icône du sujet contrôlé, affichée quand le contrôle passe (le triangle sinon). */
  icone: LucideIcon;
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
      ? { ok: true, icone: Camera, libelle: `${nbPhotos} photos` }
      : { ok: false, icone: Camera, libelle: `${nbPhotos} photo${nbPhotos > 1 ? "s" : ""} seulement, ${PHOTOS_MIN} minimum` },
    description.length >= DESCRIPTION_MIN
      ? { ok: true, icone: FileText, libelle: "Description complète" }
      : { ok: false, icone: FileText, libelle: `Description courte : ${description.length} caractères sur ${DESCRIPTION_MIN}` },
    contientCoordonnees(description)
      ? { ok: false, icone: PhoneOff, libelle: "Numéro de téléphone ou e-mail dans la description" }
      : { ok: true, icone: PhoneOff, libelle: "Aucune coordonnée dans la description" },
    annonce.prix
      ? { ok: true, icone: Banknote, libelle: "Prix renseigné" }
      : { ok: false, icone: Banknote, libelle: "Prix absent" },
    annonce.quartier && annonce.ville
      ? { ok: true, icone: MapPin, libelle: "Quartier et ville renseignés" }
      : { ok: false, icone: MapPin, libelle: "Localisation incomplète" },
  ];
}
