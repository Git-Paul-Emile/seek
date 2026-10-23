// Les 8 étapes du formulaire d'annonce (charte, planches 26 et 33).

export const ETAPES = [
  { id: "type", label: "Type", titre: "Type de bien" },
  { id: "localisation", label: "Localisation", titre: "Localisation" },
  { id: "caracteristiques", label: "Caractéristiques", titre: "Caractéristiques" },
  { id: "equipements", label: "Équipements", titre: "Équipements" },
  { id: "meubles", label: "Meubles", titre: "Meubles" },
  { id: "photos", label: "Photos", titre: "Photos" },
  { id: "prix", label: "Prix", titre: "Prix et disponibilité" },
  { id: "recapitulatif", label: "Récapitulatif", titre: "Récapitulatif" },
] as const;

export type EtapeId = (typeof ETAPES)[number]["id"];

/** Étapes contrôlées avant l'envoi : les autres n'ont aucun champ obligatoire. */
export const ETAPES_VALIDEES: EtapeId[] = ["type", "localisation", "caracteristiques", "photos", "prix", "recapitulatif"];

export const FREQUENCES = [
  { value: "journalier", label: "Par jour" },
  { value: "hebdomadaire", label: "Par semaine" },
  { value: "mensuel", label: "Par mois" },
  { value: "trimestriel", label: "Par trimestre" },
  { value: "semestriel", label: "Par semestre" },
  { value: "annuel", label: "Par an" },
  { value: "unique", label: "Paiement unique (vente)" },
];

export const PHOTOS_MIN = 3;
export const PHOTOS_MAX = 10;
export const PHOTO_TAILLE_MAX = 5 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif", "image/jfif", "image/pjpeg"];
export const VIDEO_TAILLE_MAX = 100 * 1024 * 1024;
export const VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/avi", "video/x-msvideo", "video/webm", "video/x-matroska"];
export const DESCRIPTION_MIN = 200;
export const DESCRIPTION_MAX = 1500;
