-- CreateEnum
CREATE TYPE "TypeChamp" AS ENUM ('TEXTE', 'NOMBRE', 'SURFACE', 'PRIX', 'BOOLEEN', 'SELECT', 'DATE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TypeNotification" ADD VALUE 'ANNONCE_VALIDEE';
ALTER TYPE "TypeNotification" ADD VALUE 'ANNONCE_REJETEE';

-- AlterEnum
ALTER TYPE "TypePaiement" ADD VALUE 'PAIEMENT_CANAUX_NOTIFICATION';

-- AlterTable
ALTER TABLE "Alerte" ADD COLUMN     "comptePublicId" TEXT;

-- AlterTable
ALTER TABLE "BailInvitation" ALTER COLUMN "montantLoyer" SET DATA TYPE INTEGER,
ALTER COLUMN "montantCaution" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "BailLocation" ALTER COLUMN "montantLoyer" SET DATA TYPE INTEGER,
ALTER COLUMN "montantCaution" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "Bien" ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "ComptePublic" ADD COLUMN     "locataireId" TEXT,
ADD COLUMN     "proprietaireId" TEXT;

-- AlterTable
ALTER TABLE "ConfigSite" ADD COLUMN     "logoFiligrane" TEXT;

-- AlterTable
ALTER TABLE "DepotCaution" ALTER COLUMN "montant" SET DATA TYPE INTEGER,
ALTER COLUMN "montantRestitue" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "EcheancierLoyer" ALTER COLUMN "montant" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "LocataireVerification" ADD COLUMN     "diditSessionId" TEXT,
ADD COLUMN     "diditStatus" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "lu" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Proprietaire" ADD COLUMN     "canauxNotification" TEXT[] DEFAULT ARRAY['SMS']::TEXT[],
ADD COLUMN     "canauxNotificationPayes" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Temoignage" ADD COLUMN     "profession" TEXT,
ALTER COLUMN "actif" SET DEFAULT false;

-- AlterTable
ALTER TABLE "VerificationDocuments" ADD COLUMN     "diditSessionId" TEXT,
ADD COLUMN     "diditStatus" TEXT;

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "experience" INTEGER,
    "facilite" INTEGER,
    "apprecie" TEXT,
    "frustration" TEXT,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageLegale" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "publie" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageLegale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorieChamp" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategorieChamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Champ" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeChamp" NOT NULL,
    "unite" TEXT,
    "options" TEXT[],
    "categorieId" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Champ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeLogementChamp" (
    "typeLogementId" TEXT NOT NULL,
    "champId" TEXT NOT NULL,
    "obligatoire" BOOLEAN NOT NULL DEFAULT false,
    "ordre" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "BienChampValeur" (
    "id" TEXT NOT NULL,
    "bienId" TEXT NOT NULL,
    "champId" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,

    CONSTRAINT "BienChampValeur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageLegale_slug_key" ON "PageLegale"("slug");

-- CreateIndex
CREATE INDEX "PageLegale_slug_idx" ON "PageLegale"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CategorieChamp_nom_key" ON "CategorieChamp"("nom");

-- CreateIndex
CREATE INDEX "Champ_categorieId_idx" ON "Champ"("categorieId");

-- CreateIndex
CREATE UNIQUE INDEX "Champ_nom_categorieId_key" ON "Champ"("nom", "categorieId");

-- CreateIndex
CREATE INDEX "TypeLogementChamp_typeLogementId_idx" ON "TypeLogementChamp"("typeLogementId");

-- CreateIndex
CREATE UNIQUE INDEX "TypeLogementChamp_typeLogementId_champId_key" ON "TypeLogementChamp"("typeLogementId", "champId");

-- CreateIndex
CREATE INDEX "BienChampValeur_bienId_idx" ON "BienChampValeur"("bienId");

-- CreateIndex
CREATE UNIQUE INDEX "BienChampValeur_bienId_champId_key" ON "BienChampValeur"("bienId", "champId");

-- CreateIndex
CREATE INDEX "Alerte_comptePublicId_idx" ON "Alerte"("comptePublicId");

-- CreateIndex
CREATE UNIQUE INDEX "ComptePublic_locataireId_key" ON "ComptePublic"("locataireId");

-- CreateIndex
CREATE UNIQUE INDEX "ComptePublic_proprietaireId_key" ON "ComptePublic"("proprietaireId");

-- CreateIndex
CREATE INDEX "Notification_proprietaireId_idx" ON "Notification"("proprietaireId");

-- CreateIndex
CREATE INDEX "Notification_lu_idx" ON "Notification"("lu");

-- AddForeignKey
ALTER TABLE "ComptePublic" ADD CONSTRAINT "ComptePublic_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComptePublic" ADD CONSTRAINT "ComptePublic_proprietaireId_fkey" FOREIGN KEY ("proprietaireId") REFERENCES "Proprietaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerte" ADD CONSTRAINT "Alerte_comptePublicId_fkey" FOREIGN KEY ("comptePublicId") REFERENCES "ComptePublic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Champ" ADD CONSTRAINT "Champ_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "CategorieChamp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeLogementChamp" ADD CONSTRAINT "TypeLogementChamp_typeLogementId_fkey" FOREIGN KEY ("typeLogementId") REFERENCES "TypeLogement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeLogementChamp" ADD CONSTRAINT "TypeLogementChamp_champId_fkey" FOREIGN KEY ("champId") REFERENCES "Champ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BienChampValeur" ADD CONSTRAINT "BienChampValeur_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BienChampValeur" ADD CONSTRAINT "BienChampValeur_champId_fkey" FOREIGN KEY ("champId") REFERENCES "Champ"("id") ON DELETE CASCADE ON UPDATE CASCADE;

