-- Le compte "restreint" (3 avertissements) et "banni" (5 avertissements) n'ont jamais
-- été implémentés côté application : ces colonnes n'étaient jamais écrites, seulement
-- lues, et restaient donc toujours à leur valeur par défaut (false / 0 / null).
-- Seule la suspension existe réellement comme mécanisme de modération.

-- AlterTable
ALTER TABLE "Proprietaire" DROP COLUMN "nbAvertissements",
DROP COLUMN "estRestreint",
DROP COLUMN "dateFinRestriction",
DROP COLUMN "estBanni",
DROP COLUMN "dateBannissement";
