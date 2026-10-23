-- AlterTable : coordonnées du chef-lieu de la commune (WGS 84, degrés décimaux).
-- Colonnes nullables : migration non destructive, aucune valeur par défaut trompeuse
-- pour les villes qui n'auraient pas encore de point connu.
ALTER TABLE "Ville" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
