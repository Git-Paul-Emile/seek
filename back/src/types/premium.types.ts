// ============================================================
// TYPES POUR LES FORMULES PREMIUM ET LE PAIEMENT
// ============================================================

export interface FormulePremium {
  id: string;
  nom: string;
  dureeJours: number;
  prix: number;
  accroche: string;
  description: string;
  idealPour: string[];
  populer: boolean; // Pour afficher un badge "Recommandée"
}

// Liste des formules premium disponibles
export const FORMULES_PREMIUM: FormulePremium[] = [
  {
    id: "boost_express",
    nom: "BOOST EXPRESS",
    dureeJours: 3,
    prix: 2000,
    accroche: "Donnez un coup d'accélérateur rapide à votre annonce !",
    description: "Idéal si vous venez de publier votre bien et souhaitez générer rapidement des vues et des contacts.",
    idealPour: ["Tester la demande", "Relancer une annonce récente", "Créer un pic de visibilité"],
    populer: false,
  },
  {
    id: "visibilite_plus",
    nom: "VISIBILITÉ PLUS",
    dureeJours: 7,
    prix: 4500,
    accroche: "Soyez parmi les premières annonces vues cette semaine !",
    description: "Votre bien apparaît en priorité pendant 7 jours pour maximiser vos chances de location ou de vente.",
    idealPour: ["Biens en zone concurrentielle", "Location rapide", "Annonce stratégique"],
    populer: false,
  },
  {
    id: "max_performance",
    nom: "MAX PERFORMANCE",
    dureeJours: 15,
    prix: 8000,
    accroche: "Doublez vos chances de trouver un locataire ou acheteur !",
    description: "Exposition prolongée + meilleure visibilité sur la plateforme.",
    idealPour: ["Exposition longue", "Meilleur positionnement", "Plus de contacts"],
    populer: true,
  },
  {
    id: "domination_totale",
    nom: "DOMINATION TOTALE",
    dureeJours: 30,
    prix: 14000,
    accroche: "Dominez les résultats de recherche pendant 1 mois !",
    description: "Votre annonce reste en haut des résultats pendant 30 jours complets.",
    idealPour: ["Exposition maximale", "Présence continue", "Absence de concurrence"],
    populer: false,
  },
];

// Modes de paiement disponibles (simulation)
export enum ModePaiement {
  ORANGE_MONEY = "ORANGE_MONEY",
  WAVE = "WAVE",
}

// Liste des moyens de paiement disponibles
export const MOYENS_PAIEMENT = [
  {
    id: ModePaiement.ORANGE_MONEY,
    nom: "Orange Money",
    logo: "/images/orange-money.png", // À remplacer par le vrai logo
    description: "Payez via votre compte Orange Money",
    couleur: "orange",
  },
  {
    id: ModePaiement.WAVE,
    nom: "Wave",
    logo: "/images/wave.png", // À remplacer par le vrai logo
    description: "Payez via votre compte Wave",
    couleur: "bleu",
  },
];

// Type pour la création d'une promotion avec paiement
export interface CreatePromotionPremiumInput {
  bienId: string;
  formuleId: string;
  modePaiement: ModePaiement;
}

// Type pour la réponse du paiement simulé
export interface PaiementSimuleResult {
  success: boolean;
  transactionId: string;
  montant: number;
  modePaiement: ModePaiement;
  formule: FormulePremium;
  datePaiement: Date;
  message: string;
}

// Type pour la réponse de l'activation de promotion
export interface ActivationPromotionResult {
  success: boolean;
  message: string;
  data: {
    bienId: string;
    titre?: string;
    estMisEnAvant: boolean;
    dateDebutPromotion: Date | null;
    dateFinPromotion: Date | null;
    positionRotation?: number;
  };
}
