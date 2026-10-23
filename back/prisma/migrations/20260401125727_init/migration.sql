-- CreateEnum
CREATE TYPE "StatutAnnonce" AS ENUM ('BROUILLON', 'EN_ATTENTE', 'PUBLIE', 'REJETE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutLocataire" AS ENUM ('INVITE', 'ACTIF', 'INACTIF', 'ANCIEN');

-- CreateEnum
CREATE TYPE "StatutBail" AS ENUM ('EN_ATTENTE', 'ACTIF', 'EN_PREAVIS', 'EN_RENOUVELLEMENT', 'TERMINE', 'RESILIE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "TypePieceIdentite" AS ENUM ('CNI', 'PASSEPORT', 'CARTE_CONSULAIRE', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutVerificationLocataire" AS ENUM ('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('A_VENIR', 'EN_ATTENTE', 'EN_RETARD', 'EN_ATTENTE_CONFIRMATION', 'PAYE', 'ANNULE');

-- CreateEnum
CREATE TYPE "StatutNotification" AS ENUM ('EN_ATTENTE', 'ENVOYE', 'ECHEC');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('RAPPEL_LOYER', 'CONFIRMATION_PAIEMENT', 'ALERTE_RETARD', 'INITIATION_PAIEMENT', 'VERIFICATION_LOCATAIRE', 'PAIEMENT_LOCATAIRE', 'PREAVIS', 'RESILIATION', 'FIN_BAIL', 'CONTRAT', 'RESET_PASSWORD', 'ALERTE', 'VERIFICATION_TELEPHONE', 'PAIEMENT_ESPECES_LOCATAIRE', 'CONFIRMATION_ESPECES_PROPRIETAIRE', 'ETAT_DES_LIEUX_DISPONIBLE', 'ETAT_DES_LIEUX_VALIDE', 'ETAT_DES_LIEUX_MODIFIE');

-- CreateEnum
CREATE TYPE "StatutDepot" AS ENUM ('RECU', 'RESTITUE', 'PARTIELLEMENT_RESTITUE', 'RETENU');

-- CreateEnum
CREATE TYPE "StatutContrat" AS ENUM ('BROUILLON', 'ACTIF', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "StatutVerification" AS ENUM ('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "StatutAlerte" AS ENUM ('ACTIVE', 'DESACTIVE');

-- CreateEnum
CREATE TYPE "TypePaiement" AS ENUM ('PAIEMENT_LOYER', 'PAIEMENT_PREMIUM', 'PAIEMENT_PROMOTION', 'REMBOURSEMENT', 'RESTITUTION_CAUTION', 'COMMISSION_LOYER', 'MISE_EN_AVANT');

-- CreateEnum
CREATE TYPE "StatutTransaction" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'ECHEC', 'ANNULE', 'REMBOURSE');

-- CreateEnum
CREATE TYPE "StatutPromotion" AS ENUM ('EN_ATTENTE', 'ACTIVE', 'TERMINEE', 'ARRETEE', 'EXPIREE');

-- CreateEnum
CREATE TYPE "StatutBailInvitation" AS ENUM ('PENDING', 'ACCEPTEE', 'REFUSEE', 'EXPIREE');

-- CreateEnum
CREATE TYPE "MotifSignalement" AS ENUM ('ARNAQUE', 'INAPPROPRIE', 'INDISPONIBLE', 'FAUSSES_INFOS', 'DOUBLON', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutSignalement" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REJETE');

-- CreateEnum
CREATE TYPE "TypeEtatDesLieux" AS ENUM ('ENTREE', 'SORTIE');

-- CreateEnum
CREATE TYPE "StatutEtatDesLieux" AS ENUM ('BROUILLON', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'CONTESTE', 'EN_LITIGE');

-- CreateEnum
CREATE TYPE "StatutContestationElement" AS ENUM ('EN_ATTENTE', 'RECTIFIE', 'RESERVE', 'REFUSE');

-- CreateEnum
CREATE TYPE "EtatElement" AS ENUM ('NEUF', 'BON', 'USAGE', 'MAUVAIS', 'DEGRADE');

-- CreateTable
CREATE TABLE "Pays" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ville" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "paysId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ville_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quartier" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "villeId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quartier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeLogement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeLogement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeTransaction" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutBien" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatutBien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorieMeuble" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorieMeuble_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorieEquipement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorieEquipement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meuble" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meuble_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categorieId" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormulePremium" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dureeJours" INTEGER NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "accroche" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "idealPour" TEXT[],
    "populer" BOOLEAN NOT NULL DEFAULT false,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormulePremium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bien" (
    "id" TEXT NOT NULL,
    "titre" TEXT,
    "description" TEXT,
    "typeLogementId" TEXT,
    "typeTransactionId" TEXT,
    "statutBienId" TEXT,
    "proprietaireId" TEXT NOT NULL,
    "pays" TEXT,
    "region" TEXT,
    "ville" TEXT,
    "quartier" TEXT,
    "quartierId" TEXT,
    "adresse" TEXT,
    "pointRepere" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "surface" DOUBLE PRECISION,
    "surfaceParcelle" DOUBLE PRECISION,
    "nbChambres" INTEGER,
    "nbSdb" INTEGER,
    "nbSalons" INTEGER,
    "nbCuisines" INTEGER,
    "etage" INTEGER,
    "nbEtages" INTEGER,
    "nbAppartements" INTEGER,
    "nbPieces" INTEGER,
    "nbWc" INTEGER,
    "typeTerrain" TEXT,
    "cloture" BOOLEAN NOT NULL DEFAULT false,
    "typeBureau" TEXT,
    "rideauMetallique" BOOLEAN NOT NULL DEFAULT false,
    "meuble" BOOLEAN NOT NULL DEFAULT false,
    "fumeurs" BOOLEAN NOT NULL DEFAULT false,
    "animaux" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "ascenseur" BOOLEAN NOT NULL DEFAULT false,
    "prix" DOUBLE PRECISION,
    "prixAncien" DOUBLE PRECISION,
    "dateDerniereModificationPrix" TIMESTAMP(3),
    "frequencePaiement" TEXT,
    "chargesIncluses" BOOLEAN NOT NULL DEFAULT false,
    "caution" INTEGER,
    "disponibleLe" TIMESTAMP(3),
    "photos" TEXT[],
    "nbVues" INTEGER NOT NULL DEFAULT 0,
    "nbFavoris" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "statutAnnonce" "StatutAnnonce" NOT NULL DEFAULT 'BROUILLON',
    "noteAdmin" TEXT,
    "estPremium" BOOLEAN NOT NULL DEFAULT false,
    "estMisEnAvant" BOOLEAN NOT NULL DEFAULT false,
    "dateDebutPromotion" TIMESTAMP(3),
    "dateFinPromotion" TIMESTAMP(3),
    "positionRotation" INTEGER NOT NULL DEFAULT 0,
    "dernierAffichage" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComptePublic" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComptePublic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComptePublicRefreshToken" (
    "id" TEXT NOT NULL,
    "comptePublicId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComptePublicRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favori" (
    "id" TEXT NOT NULL,
    "comptePublicId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "prixSnapshot" DOUBLE PRECISION,
    "statutSnapshot" TEXT,
    "actifSnapshot" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Favori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VueBien" (
    "id" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VueBien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BienEquipement" (
    "bienId" TEXT NOT NULL,
    "equipementId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "BienMeuble" (
    "bienId" TEXT NOT NULL,
    "meubleId" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "DocumentBien" (
    "id" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "taille" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentBien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Etablissement" (
    "id" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nom" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Etablissement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locataire" (
    "id" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "nbOccupants" INTEGER NOT NULL DEFAULT 1,
    "presenceEnfants" BOOLEAN NOT NULL DEFAULT false,
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "nationalite" TEXT,
    "sexe" TEXT,
    "numPieceIdentite" TEXT,
    "typePiece" "TypePieceIdentite",
    "dateDelivrance" TIMESTAMP(3),
    "dateExpirationPiece" TIMESTAMP(3),
    "autoriteDelivrance" TEXT,
    "situationProfessionnelle" TEXT,
    "activationToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "statut" "StatutLocataire" NOT NULL DEFAULT 'INVITE',
    "password" TEXT,
    "estSuspendu" BOOLEAN NOT NULL DEFAULT false,
    "motifSuspension" TEXT,
    "dateSuspension" TIMESTAMP(3),
    "suspenduPar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Locataire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocataireVerification" (
    "id" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "typePiece" TEXT NOT NULL DEFAULT 'CNI',
    "pieceIdentiteRecto" TEXT,
    "pieceIdentiteVerso" TEXT,
    "selfie" TEXT,
    "statut" "StatutVerificationLocataire" NOT NULL DEFAULT 'NOT_VERIFIED',
    "conditionsAcceptees" BOOLEAN NOT NULL DEFAULT false,
    "motifRejet" TEXT,
    "traitePar" TEXT,
    "dateTraitement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocataireVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BailLocation" (
    "id" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "typeBail" TEXT,
    "dateDebutBail" TIMESTAMP(3) NOT NULL,
    "dateFinBail" TIMESTAMP(3),
    "renouvellement" BOOLEAN NOT NULL DEFAULT false,
    "montantLoyer" DOUBLE PRECISION NOT NULL,
    "montantCaution" DOUBLE PRECISION,
    "cautionVersee" BOOLEAN NOT NULL DEFAULT false,
    "jourLimitePaiement" INTEGER,
    "delaiGrace" INTEGER NOT NULL DEFAULT 5,
    "frequencePaiement" TEXT,
    "statut" "StatutBail" NOT NULL DEFAULT 'EN_ATTENTE',
    "motifResiliation" TEXT,
    "initiePar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BailLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcheancierLoyer" (
    "id" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'A_VENIR',
    "datePaiement" TIMESTAMP(3),
    "modePaiement" TEXT,
    "reference" TEXT,
    "note" TEXT,
    "sourceEnregistrement" TEXT,
    "commissionTaux" DOUBLE PRECISION,
    "commissionMontant" DOUBLE PRECISION,
    "montantNet" DOUBLE PRECISION,
    "confirmeParProprietaire" BOOLEAN NOT NULL DEFAULT false,
    "dateConfirmation" TIMESTAMP(3),
    "confirmeParLocataire" BOOLEAN NOT NULL DEFAULT false,
    "dateConfirmationLocataire" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EcheancierLoyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quittance" (
    "id" TEXT NOT NULL,
    "echeanceId" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dateGeneration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quittance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "canal" TEXT NOT NULL DEFAULT 'SMS',
    "destinataire" TEXT NOT NULL,
    "sujet" TEXT,
    "contenu" TEXT NOT NULL,
    "statut" "StatutNotification" NOT NULL DEFAULT 'EN_ATTENTE',
    "messageRetour" TEXT,
    "echeanceId" TEXT,
    "bailId" TEXT,
    "bienId" TEXT,
    "proprietaireId" TEXT,
    "locataireId" TEXT,
    "envoyeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepotCaution" (
    "id" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "statut" "StatutDepot" NOT NULL DEFAULT 'RECU',
    "dateReception" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateRestitution" TIMESTAMP(3),
    "montantRestitue" DOUBLE PRECISION,
    "motifRetenue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepotCaution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeleContrat" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "typeBail" TEXT,
    "contenu" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModeleContrat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrat" (
    "id" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "modeleId" TEXT,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "statut" "StatutContrat" NOT NULL DEFAULT 'BROUILLON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocataireRefreshToken" (
    "id" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocataireRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocatairePasswordResetToken" (
    "id" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocatairePasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocuments" (
    "id" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "typePiece" TEXT NOT NULL DEFAULT 'CNI',
    "pieceIdentiteRecto" TEXT,
    "pieceIdentiteVerso" TEXT,
    "selfie" TEXT,
    "conditionsAcceptees" BOOLEAN NOT NULL DEFAULT false,
    "motifRejet" TEXT,
    "traitePar" TEXT,
    "dateTraitement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationDocuments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proprietaire" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "sexe" TEXT,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "statutVerification" "StatutVerification" NOT NULL DEFAULT 'NOT_VERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "telephoneVerifie" BOOLEAN NOT NULL DEFAULT false,
    "telephoneOtp" TEXT,
    "telephoneOtpExpiresAt" TIMESTAMP(3),
    "estSuspendu" BOOLEAN NOT NULL DEFAULT false,
    "motifSuspension" TEXT,
    "dateSuspension" TIMESTAMP(3),
    "suspenduPar" TEXT,
    "nbAvertissements" INTEGER NOT NULL DEFAULT 0,
    "nbSignalementsValides" INTEGER NOT NULL DEFAULT 0,
    "estRestreint" BOOLEAN NOT NULL DEFAULT false,
    "dateFinRestriction" TIMESTAMP(3),
    "dateFinSuspension" TIMESTAMP(3),
    "estBanni" BOOLEAN NOT NULL DEFAULT false,
    "dateBannissement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proprietaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageInterne" (
    "id" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "bailId" TEXT,
    "bienId" TEXT,
    "titre" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageInterne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageInterneLocataire" (
    "id" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "bailId" TEXT,
    "bienId" TEXT,
    "titre" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageInterneLocataire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProprietaireRefreshToken" (
    "id" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProprietaireRefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerte" (
    "id" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "ville" TEXT,
    "quartier" TEXT,
    "typeLogement" TEXT,
    "typeTransaction" TEXT,
    "prixMin" INTEGER,
    "prixMax" INTEGER,
    "canalPrefere" TEXT NOT NULL DEFAULT 'SMS',
    "statut" "StatutAlerte" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alerte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "type" "TypePaiement" NOT NULL,
    "statut" "StatutTransaction" NOT NULL DEFAULT 'EN_ATTENTE',
    "montant" DOUBLE PRECISION NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "modePaiement" TEXT NOT NULL,
    "provider" TEXT,
    "reference" TEXT,
    "transactionId" TEXT,
    "dateInitiation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateConfirmation" TIMESTAMP(3),
    "dateEcheance" TIMESTAMP(3),
    "bienId" TEXT,
    "bailId" TEXT,
    "echeanceId" TEXT,
    "locataireId" TEXT,
    "note" TEXT,
    "instructions" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Temoignage" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "temoignage" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Temoignage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionHistory" (
    "id" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "transactionId" TEXT,
    "formuleId" TEXT NOT NULL,
    "formuleNom" TEXT NOT NULL,
    "dureeJours" INTEGER NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "dateFinReelle" TIMESTAMP(3),
    "modePaiement" TEXT,
    "reference" TEXT,
    "note" TEXT,
    "confirmeParAdmin" BOOLEAN NOT NULL DEFAULT false,
    "dateConfirmation" TIMESTAMP(3),
    "statut" "StatutPromotion" NOT NULL DEFAULT 'ACTIVE',
    "motifArret" TEXT,
    "joursRestants" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigMonetisation" (
    "id" TEXT NOT NULL DEFAULT 'config',
    "miseEnAvantActive" BOOLEAN NOT NULL DEFAULT false,
    "commissionActive" BOOLEAN NOT NULL DEFAULT false,
    "tauxCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigMonetisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigSite" (
    "id" TEXT NOT NULL DEFAULT 'config_site',
    "contactEmail" TEXT NOT NULL DEFAULT 'contact@seek.sn',
    "contactPhone" TEXT NOT NULL DEFAULT '+221 77 000 00 00',
    "contactAddress" TEXT NOT NULL DEFAULT 'Dakar, Sénégal',
    "serviceClientHours" JSONB NOT NULL DEFAULT '[{"day":"lundi","isOpen":true,"open":"08:00","close":"18:00"},{"day":"mardi","isOpen":true,"open":"08:00","close":"18:00"},{"day":"mercredi","isOpen":true,"open":"08:00","close":"18:00"},{"day":"jeudi","isOpen":true,"open":"08:00","close":"18:00"},{"day":"vendredi","isOpen":true,"open":"08:00","close":"18:00"},{"day":"samedi","isOpen":true,"open":"09:00","close":"18:00"},{"day":"dimanche","isOpen":false,"open":"09:00","close":"13:00"}]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BailInvitation" (
    "id" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "typeBail" TEXT,
    "dateDebutBail" TIMESTAMP(3) NOT NULL,
    "dateFinBail" TIMESTAMP(3),
    "montantLoyer" DOUBLE PRECISION NOT NULL,
    "montantCaution" DOUBLE PRECISION,
    "cautionVersee" BOOLEAN NOT NULL DEFAULT false,
    "jourLimitePaiement" INTEGER,
    "renouvellement" BOOLEAN NOT NULL DEFAULT true,
    "frequencePaiement" TEXT,
    "token" TEXT NOT NULL,
    "statut" "StatutBailInvitation" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BailInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signalement" (
    "id" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "comptePublicId" TEXT,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "motif" "MotifSignalement" NOT NULL,
    "commentaire" TEXT,
    "statut" "StatutSignalement" NOT NULL DEFAULT 'EN_ATTENTE',
    "traitePar" TEXT,
    "dateTraitement" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signalement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EtatDesLieux" (
    "id" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "proprietaireId" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "type" "TypeEtatDesLieux" NOT NULL,
    "statut" "StatutEtatDesLieux" NOT NULL DEFAULT 'BROUILLON',
    "dateRealisation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateValidation" TIMESTAMP(3),
    "documentPdf" TEXT,
    "nbCles" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EtatDesLieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceEtatDesLieux" (
    "id" TEXT NOT NULL,
    "etatDesLieuxId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PieceEtatDesLieux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElementEtatDesLieux" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "etat" "EtatElement" NOT NULL,
    "commentaire" TEXT,
    "photos" TEXT[],
    "estConteste" BOOLEAN NOT NULL DEFAULT false,
    "motifContestation" TEXT,
    "photoContestation" TEXT,
    "statutContestation" "StatutContestationElement",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElementEtatDesLieux_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pays_nom_key" ON "Pays"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Pays_code_key" ON "Pays"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Ville_nom_paysId_key" ON "Ville"("nom", "paysId");

-- CreateIndex
CREATE INDEX "Quartier_villeId_idx" ON "Quartier"("villeId");

-- CreateIndex
CREATE UNIQUE INDEX "Quartier_nom_villeId_key" ON "Quartier"("nom", "villeId");

-- CreateIndex
CREATE UNIQUE INDEX "TypeLogement_nom_key" ON "TypeLogement"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "TypeLogement_slug_key" ON "TypeLogement"("slug");

-- CreateIndex
CREATE INDEX "TypeLogement_slug_idx" ON "TypeLogement"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TypeTransaction_nom_key" ON "TypeTransaction"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "TypeTransaction_slug_key" ON "TypeTransaction"("slug");

-- CreateIndex
CREATE INDEX "TypeTransaction_slug_idx" ON "TypeTransaction"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "StatutBien_nom_key" ON "StatutBien"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "StatutBien_slug_key" ON "StatutBien"("slug");

-- CreateIndex
CREATE INDEX "StatutBien_slug_idx" ON "StatutBien"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategorieMeuble_nom_key" ON "CategorieMeuble"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "CategorieMeuble_slug_key" ON "CategorieMeuble"("slug");

-- CreateIndex
CREATE INDEX "CategorieMeuble_slug_idx" ON "CategorieMeuble"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategorieEquipement_nom_key" ON "CategorieEquipement"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "CategorieEquipement_slug_key" ON "CategorieEquipement"("slug");

-- CreateIndex
CREATE INDEX "CategorieEquipement_slug_idx" ON "CategorieEquipement"("slug");

-- CreateIndex
CREATE INDEX "Meuble_categorieId_idx" ON "Meuble"("categorieId");

-- CreateIndex
CREATE UNIQUE INDEX "Meuble_nom_categorieId_key" ON "Meuble"("nom", "categorieId");

-- CreateIndex
CREATE INDEX "Equipement_categorieId_idx" ON "Equipement"("categorieId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipement_nom_categorieId_key" ON "Equipement"("nom", "categorieId");

-- CreateIndex
CREATE UNIQUE INDEX "FormulePremium_code_key" ON "FormulePremium"("code");

-- CreateIndex
CREATE INDEX "Bien_proprietaireId_idx" ON "Bien"("proprietaireId");

-- CreateIndex
CREATE INDEX "Bien_typeLogementId_idx" ON "Bien"("typeLogementId");

-- CreateIndex
CREATE INDEX "Bien_typeTransactionId_idx" ON "Bien"("typeTransactionId");

-- CreateIndex
CREATE INDEX "Bien_statutBienId_idx" ON "Bien"("statutBienId");

-- CreateIndex
CREATE INDEX "Bien_statutAnnonce_idx" ON "Bien"("statutAnnonce");

-- CreateIndex
CREATE INDEX "Bien_actif_idx" ON "Bien"("actif");

-- CreateIndex
CREATE INDEX "Bien_createdAt_idx" ON "Bien"("createdAt");

-- CreateIndex
CREATE INDEX "Bien_statutAnnonce_actif_idx" ON "Bien"("statutAnnonce", "actif");

-- CreateIndex
CREATE INDEX "Bien_statutAnnonce_createdAt_idx" ON "Bien"("statutAnnonce", "createdAt");

-- CreateIndex
CREATE INDEX "Bien_statutAnnonce_ville_idx" ON "Bien"("statutAnnonce", "ville");

-- CreateIndex
CREATE INDEX "Bien_statutAnnonce_typeLogementId_idx" ON "Bien"("statutAnnonce", "typeLogementId");

-- CreateIndex
CREATE INDEX "Bien_statutAnnonce_typeTransactionId_idx" ON "Bien"("statutAnnonce", "typeTransactionId");

-- CreateIndex
CREATE INDEX "Bien_statutAnnonce_prix_idx" ON "Bien"("statutAnnonce", "prix");

-- CreateIndex
CREATE INDEX "Bien_ville_quartier_idx" ON "Bien"("ville", "quartier");

-- CreateIndex
CREATE INDEX "Bien_latitude_longitude_idx" ON "Bien"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "ComptePublic_telephone_key" ON "ComptePublic"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "ComptePublic_email_key" ON "ComptePublic"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ComptePublicRefreshToken_tokenHash_key" ON "ComptePublicRefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ComptePublicRefreshToken_comptePublicId_idx" ON "ComptePublicRefreshToken"("comptePublicId");

-- CreateIndex
CREATE INDEX "ComptePublicRefreshToken_tokenHash_idx" ON "ComptePublicRefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "Favori_comptePublicId_idx" ON "Favori"("comptePublicId");

-- CreateIndex
CREATE UNIQUE INDEX "Favori_comptePublicId_bienId_key" ON "Favori"("comptePublicId", "bienId");

-- CreateIndex
CREATE INDEX "VueBien_bienId_idx" ON "VueBien"("bienId");

-- CreateIndex
CREATE INDEX "VueBien_bienId_createdAt_idx" ON "VueBien"("bienId", "createdAt");

-- CreateIndex
CREATE INDEX "VueBien_ipAddress_bienId_idx" ON "VueBien"("ipAddress", "bienId");

-- CreateIndex
CREATE UNIQUE INDEX "BienEquipement_bienId_equipementId_key" ON "BienEquipement"("bienId", "equipementId");

-- CreateIndex
CREATE UNIQUE INDEX "BienMeuble_bienId_meubleId_key" ON "BienMeuble"("bienId", "meubleId");

-- CreateIndex
CREATE INDEX "DocumentBien_bienId_idx" ON "DocumentBien"("bienId");

-- CreateIndex
CREATE INDEX "DocumentBien_proprietaireId_idx" ON "DocumentBien"("proprietaireId");

-- CreateIndex
CREATE INDEX "Etablissement_bienId_idx" ON "Etablissement"("bienId");

-- CreateIndex
CREATE INDEX "Etablissement_type_idx" ON "Etablissement"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Locataire_activationToken_key" ON "Locataire"("activationToken");

-- CreateIndex
CREATE INDEX "Locataire_proprietaireId_idx" ON "Locataire"("proprietaireId");

-- CreateIndex
CREATE INDEX "Locataire_activationToken_idx" ON "Locataire"("activationToken");

-- CreateIndex
CREATE UNIQUE INDEX "LocataireVerification_locataireId_key" ON "LocataireVerification"("locataireId");

-- CreateIndex
CREATE INDEX "BailLocation_bienId_idx" ON "BailLocation"("bienId");

-- CreateIndex
CREATE INDEX "BailLocation_locataireId_idx" ON "BailLocation"("locataireId");

-- CreateIndex
CREATE INDEX "BailLocation_proprietaireId_idx" ON "BailLocation"("proprietaireId");

-- CreateIndex
CREATE INDEX "BailLocation_statut_idx" ON "BailLocation"("statut");

-- CreateIndex
CREATE INDEX "EcheancierLoyer_bailId_idx" ON "EcheancierLoyer"("bailId");

-- CreateIndex
CREATE INDEX "EcheancierLoyer_bienId_idx" ON "EcheancierLoyer"("bienId");

-- CreateIndex
CREATE INDEX "EcheancierLoyer_statut_idx" ON "EcheancierLoyer"("statut");

-- CreateIndex
CREATE INDEX "EcheancierLoyer_dateEcheance_idx" ON "EcheancierLoyer"("dateEcheance");

-- CreateIndex
CREATE UNIQUE INDEX "Quittance_echeanceId_key" ON "Quittance"("echeanceId");

-- CreateIndex
CREATE INDEX "Quittance_bailId_idx" ON "Quittance"("bailId");

-- CreateIndex
CREATE INDEX "Quittance_bienId_idx" ON "Quittance"("bienId");

-- CreateIndex
CREATE INDEX "Quittance_locataireId_idx" ON "Quittance"("locataireId");

-- CreateIndex
CREATE INDEX "Notification_bailId_idx" ON "Notification"("bailId");

-- CreateIndex
CREATE INDEX "Notification_echeanceId_idx" ON "Notification"("echeanceId");

-- CreateIndex
CREATE INDEX "Notification_locataireId_idx" ON "Notification"("locataireId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_statut_idx" ON "Notification"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "DepotCaution_bailId_key" ON "DepotCaution"("bailId");

-- CreateIndex
CREATE INDEX "DepotCaution_bailId_idx" ON "DepotCaution"("bailId");

-- CreateIndex
CREATE INDEX "DepotCaution_bienId_idx" ON "DepotCaution"("bienId");

-- CreateIndex
CREATE UNIQUE INDEX "Contrat_bailId_key" ON "Contrat"("bailId");

-- CreateIndex
CREATE INDEX "Contrat_bailId_idx" ON "Contrat"("bailId");

-- CreateIndex
CREATE INDEX "Contrat_modeleId_idx" ON "Contrat"("modeleId");

-- CreateIndex
CREATE UNIQUE INDEX "LocataireRefreshToken_tokenHash_key" ON "LocataireRefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "LocataireRefreshToken_locataireId_idx" ON "LocataireRefreshToken"("locataireId");

-- CreateIndex
CREATE INDEX "LocataireRefreshToken_tokenHash_idx" ON "LocataireRefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "LocatairePasswordResetToken_tokenHash_key" ON "LocatairePasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "LocatairePasswordResetToken_locataireId_idx" ON "LocatairePasswordResetToken"("locataireId");

-- CreateIndex
CREATE INDEX "LocatairePasswordResetToken_tokenHash_idx" ON "LocatairePasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationDocuments_proprietaireId_key" ON "VerificationDocuments"("proprietaireId");

-- CreateIndex
CREATE UNIQUE INDEX "Proprietaire_telephone_key" ON "Proprietaire"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "Proprietaire_email_key" ON "Proprietaire"("email");

-- CreateIndex
CREATE INDEX "MessageInterne_proprietaireId_idx" ON "MessageInterne"("proprietaireId");

-- CreateIndex
CREATE INDEX "MessageInterne_createdAt_idx" ON "MessageInterne"("createdAt");

-- CreateIndex
CREATE INDEX "MessageInterneLocataire_locataireId_idx" ON "MessageInterneLocataire"("locataireId");

-- CreateIndex
CREATE INDEX "MessageInterneLocataire_createdAt_idx" ON "MessageInterneLocataire"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProprietaireRefreshToken_tokenHash_key" ON "ProprietaireRefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ProprietaireRefreshToken_proprietaireId_idx" ON "ProprietaireRefreshToken"("proprietaireId");

-- CreateIndex
CREATE INDEX "ProprietaireRefreshToken_tokenHash_idx" ON "ProprietaireRefreshToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_proprietaireId_idx" ON "PasswordResetToken"("proprietaireId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_tokenHash_idx" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_adminId_idx" ON "RefreshToken"("adminId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "Alerte_telephone_idx" ON "Alerte"("telephone");

-- CreateIndex
CREATE INDEX "Alerte_statut_idx" ON "Alerte"("statut");

-- CreateIndex
CREATE INDEX "Transaction_proprietaireId_idx" ON "Transaction"("proprietaireId");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_statut_idx" ON "Transaction"("statut");

-- CreateIndex
CREATE INDEX "Transaction_bienId_idx" ON "Transaction"("bienId");

-- CreateIndex
CREATE INDEX "Transaction_bailId_idx" ON "Transaction"("bailId");

-- CreateIndex
CREATE INDEX "Transaction_dateInitiation_idx" ON "Transaction"("dateInitiation");

-- CreateIndex
CREATE INDEX "Transaction_transactionId_idx" ON "Transaction"("transactionId");

-- CreateIndex
CREATE INDEX "Temoignage_actif_idx" ON "Temoignage"("actif");

-- CreateIndex
CREATE INDEX "PromotionHistory_bienId_idx" ON "PromotionHistory"("bienId");

-- CreateIndex
CREATE INDEX "PromotionHistory_proprietaireId_idx" ON "PromotionHistory"("proprietaireId");

-- CreateIndex
CREATE INDEX "PromotionHistory_statut_idx" ON "PromotionHistory"("statut");

-- CreateIndex
CREATE INDEX "PromotionHistory_dateDebut_idx" ON "PromotionHistory"("dateDebut");

-- CreateIndex
CREATE UNIQUE INDEX "BailInvitation_token_key" ON "BailInvitation"("token");

-- CreateIndex
CREATE INDEX "BailInvitation_locataireId_idx" ON "BailInvitation"("locataireId");

-- CreateIndex
CREATE INDEX "BailInvitation_proprietaireId_idx" ON "BailInvitation"("proprietaireId");

-- CreateIndex
CREATE INDEX "BailInvitation_token_idx" ON "BailInvitation"("token");

-- CreateIndex
CREATE INDEX "BailInvitation_statut_idx" ON "BailInvitation"("statut");

-- CreateIndex
CREATE INDEX "Signalement_bienId_idx" ON "Signalement"("bienId");

-- CreateIndex
CREATE INDEX "Signalement_comptePublicId_idx" ON "Signalement"("comptePublicId");

-- CreateIndex
CREATE INDEX "Signalement_statut_idx" ON "Signalement"("statut");

-- CreateIndex
CREATE INDEX "Signalement_telephone_idx" ON "Signalement"("telephone");

-- CreateIndex
CREATE INDEX "EtatDesLieux_bienId_idx" ON "EtatDesLieux"("bienId");

-- CreateIndex
CREATE INDEX "EtatDesLieux_proprietaireId_idx" ON "EtatDesLieux"("proprietaireId");

-- CreateIndex
CREATE INDEX "EtatDesLieux_locataireId_idx" ON "EtatDesLieux"("locataireId");

-- CreateIndex
CREATE INDEX "EtatDesLieux_statut_idx" ON "EtatDesLieux"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "EtatDesLieux_bailId_type_key" ON "EtatDesLieux"("bailId", "type");

-- CreateIndex
CREATE INDEX "PieceEtatDesLieux_etatDesLieuxId_idx" ON "PieceEtatDesLieux"("etatDesLieuxId");

-- CreateIndex
CREATE INDEX "ElementEtatDesLieux_pieceId_idx" ON "ElementEtatDesLieux"("pieceId");

-- AddForeignKey
ALTER TABLE "Ville" ADD CONSTRAINT "Ville_paysId_fkey" FOREIGN KEY ("paysId") REFERENCES "Pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quartier" ADD CONSTRAINT "Quartier_villeId_fkey" FOREIGN KEY ("villeId") REFERENCES "Ville"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meuble" ADD CONSTRAINT "Meuble_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "CategorieMeuble"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipement" ADD CONSTRAINT "Equipement_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "CategorieEquipement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_typeLogementId_fkey" FOREIGN KEY ("typeLogementId") REFERENCES "TypeLogement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_typeTransactionId_fkey" FOREIGN KEY ("typeTransactionId") REFERENCES "TypeTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_statutBienId_fkey" FOREIGN KEY ("statutBienId") REFERENCES "StatutBien"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bien" ADD CONSTRAINT "Bien_quartierId_fkey" FOREIGN KEY ("quartierId") REFERENCES "Quartier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComptePublicRefreshToken" ADD CONSTRAINT "ComptePublicRefreshToken_comptePublicId_fkey" FOREIGN KEY ("comptePublicId") REFERENCES "ComptePublic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_comptePublicId_fkey" FOREIGN KEY ("comptePublicId") REFERENCES "ComptePublic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VueBien" ADD CONSTRAINT "VueBien_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BienEquipement" ADD CONSTRAINT "BienEquipement_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BienEquipement" ADD CONSTRAINT "BienEquipement_equipementId_fkey" FOREIGN KEY ("equipementId") REFERENCES "Equipement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BienMeuble" ADD CONSTRAINT "BienMeuble_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BienMeuble" ADD CONSTRAINT "BienMeuble_meubleId_fkey" FOREIGN KEY ("meubleId") REFERENCES "Meuble"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentBien" ADD CONSTRAINT "DocumentBien_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentBien" ADD CONSTRAINT "DocumentBien_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Etablissement" ADD CONSTRAINT "Etablissement_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Locataire" ADD CONSTRAINT "Locataire_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocataireVerification" ADD CONSTRAINT "LocataireVerification_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BailLocation" ADD CONSTRAINT "BailLocation_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BailLocation" ADD CONSTRAINT "BailLocation_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BailLocation" ADD CONSTRAINT "BailLocation_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcheancierLoyer" ADD CONSTRAINT "EcheancierLoyer_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "BailLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quittance" ADD CONSTRAINT "Quittance_echeanceId_fkey" FOREIGN KEY ("echeanceId") REFERENCES "EcheancierLoyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepotCaution" ADD CONSTRAINT "DepotCaution_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "BailLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "BailLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrat" ADD CONSTRAINT "Contrat_modeleId_fkey" FOREIGN KEY ("modeleId") REFERENCES "ModeleContrat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocataireRefreshToken" ADD CONSTRAINT "LocataireRefreshToken_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocatairePasswordResetToken" ADD CONSTRAINT "LocatairePasswordResetToken_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocuments" ADD CONSTRAINT "VerificationDocuments_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageInterne" ADD CONSTRAINT "MessageInterne_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageInterneLocataire" ADD CONSTRAINT "MessageInterneLocataire_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProprietaireRefreshToken" ADD CONSTRAINT "ProprietaireRefreshToken_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "BailLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_echeanceId_fkey" FOREIGN KEY ("echeanceId") REFERENCES "EcheancierLoyer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionHistory" ADD CONSTRAINT "PromotionHistory_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionHistory" ADD CONSTRAINT "PromotionHistory_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BailInvitation" ADD CONSTRAINT "BailInvitation_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BailInvitation" ADD CONSTRAINT "BailInvitation_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BailInvitation" ADD CONSTRAINT "BailInvitation_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_comptePublicId_fkey" FOREIGN KEY ("comptePublicId") REFERENCES "ComptePublic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDesLieux" ADD CONSTRAINT "EtatDesLieux_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "BailLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDesLieux" ADD CONSTRAINT "EtatDesLieux_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDesLieux" ADD CONSTRAINT "EtatDesLieux_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EtatDesLieux" ADD CONSTRAINT "EtatDesLieux_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PieceEtatDesLieux" ADD CONSTRAINT "PieceEtatDesLieux_etatDesLieuxId_fkey" FOREIGN KEY ("etatDesLieuxId") REFERENCES "EtatDesLieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElementEtatDesLieux" ADD CONSTRAINT "ElementEtatDesLieux_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "PieceEtatDesLieux"("id") ON DELETE CASCADE ON UPDATE CASCADE;
