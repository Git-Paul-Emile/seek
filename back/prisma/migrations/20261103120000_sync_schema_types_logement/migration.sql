-- AlterTable
ALTER TABLE "Champ" ADD COLUMN     "cleSysteme" TEXT;

-- AlterTable
ALTER TABLE "Favori" DROP COLUMN "actifSnapshot",
DROP COLUMN "prixSnapshot",
DROP COLUMN "statutSnapshot";

-- AlterTable
ALTER TABLE "LocataireVerification" DROP COLUMN "diditSessionId",
DROP COLUMN "diditStatus";

-- AlterTable
ALTER TABLE "VerificationDocuments" DROP COLUMN "diditSessionId",
DROP COLUMN "diditStatus";

-- CreateTable
CREATE TABLE "TypeLogementEquipement" (
    "typeLogementId" TEXT NOT NULL,
    "equipementId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TypeLogementMeuble" (
    "typeLogementId" TEXT NOT NULL,
    "meubleId" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "TypeLogementEquipement_typeLogementId_idx" ON "TypeLogementEquipement"("typeLogementId");

-- CreateIndex
CREATE UNIQUE INDEX "TypeLogementEquipement_typeLogementId_equipementId_key" ON "TypeLogementEquipement"("typeLogementId", "equipementId");

-- CreateIndex
CREATE INDEX "TypeLogementMeuble_typeLogementId_idx" ON "TypeLogementMeuble"("typeLogementId");

-- CreateIndex
CREATE UNIQUE INDEX "TypeLogementMeuble_typeLogementId_meubleId_key" ON "TypeLogementMeuble"("typeLogementId", "meubleId");

-- CreateIndex
CREATE UNIQUE INDEX "Champ_cleSysteme_key" ON "Champ"("cleSysteme");

-- AddForeignKey
ALTER TABLE "TypeLogementEquipement" ADD CONSTRAINT "TypeLogementEquipement_typeLogementId_fkey" FOREIGN KEY ("typeLogementId") REFERENCES "TypeLogement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeLogementEquipement" ADD CONSTRAINT "TypeLogementEquipement_equipementId_fkey" FOREIGN KEY ("equipementId") REFERENCES "Equipement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeLogementMeuble" ADD CONSTRAINT "TypeLogementMeuble_typeLogementId_fkey" FOREIGN KEY ("typeLogementId") REFERENCES "TypeLogement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeLogementMeuble" ADD CONSTRAINT "TypeLogementMeuble_meubleId_fkey" FOREIGN KEY ("meubleId") REFERENCES "Meuble"("id") ON DELETE CASCADE ON UPDATE CASCADE;

