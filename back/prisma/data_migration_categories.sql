-- ============================================================
-- DATA MIGRATION: categorie (string) -> categorieId (FK)
-- Preserves all 29 meubles and 49 equipements
-- ============================================================

-- Helper function for slugifying (inline via translate + regexp)
-- Steps: lowercase -> strip accents -> remove non-alphanumeric -> trim dashes

-- 1. Create CategorieMeuble table
CREATE TABLE IF NOT EXISTS "CategorieMeuble" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CategorieMeuble_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CategorieMeuble_nom_key"  ON "CategorieMeuble"("nom");
CREATE UNIQUE INDEX IF NOT EXISTS "CategorieMeuble_slug_key" ON "CategorieMeuble"("slug");
CREATE INDEX        IF NOT EXISTS "CategorieMeuble_slug_idx" ON "CategorieMeuble"("slug");

-- 2. Populate CategorieMeuble from existing Meuble.categorie distinct values
INSERT INTO "CategorieMeuble" ("id","nom","slug","actif","ordre","createdAt","updatedAt")
SELECT
    gen_random_uuid()::text,
    categorie,
    trim(both '-' from regexp_replace(
        translate(lower(categorie),
            'àâäæçéèêëîïôùûüÿœ',
            'aaaaceeeeiiouuuyo'
        ),
        '[^a-z0-9]+', '-', 'g'
    )),
    true,
    ROW_NUMBER() OVER (ORDER BY categorie),
    NOW(), NOW()
FROM (SELECT DISTINCT categorie FROM "Meuble" WHERE categorie IS NOT NULL AND categorie <> '') t
ON CONFLICT DO NOTHING;

-- 3. Create CategorieEquipement table
CREATE TABLE IF NOT EXISTS "CategorieEquipement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CategorieEquipement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CategorieEquipement_nom_key"  ON "CategorieEquipement"("nom");
CREATE UNIQUE INDEX IF NOT EXISTS "CategorieEquipement_slug_key" ON "CategorieEquipement"("slug");
CREATE INDEX        IF NOT EXISTS "CategorieEquipement_slug_idx" ON "CategorieEquipement"("slug");

-- 4. Populate CategorieEquipement from existing Equipement.categorie distinct values
INSERT INTO "CategorieEquipement" ("id","nom","slug","actif","ordre","createdAt","updatedAt")
SELECT
    gen_random_uuid()::text,
    categorie,
    trim(both '-' from regexp_replace(
        translate(lower(categorie),
            'àâäæçéèêëîïôùûüÿœ',
            'aaaaceeeeiiouuuyo'
        ),
        '[^a-z0-9]+', '-', 'g'
    )),
    true,
    ROW_NUMBER() OVER (ORDER BY categorie),
    NOW(), NOW()
FROM (SELECT DISTINCT categorie FROM "Equipement" WHERE categorie IS NOT NULL AND categorie <> '') t
ON CONFLICT DO NOTHING;

-- 5. Add categorieId (nullable) to Meuble and link to CategorieMeuble
ALTER TABLE "Meuble" ADD COLUMN IF NOT EXISTS "categorieId" TEXT;
UPDATE "Meuble" m SET "categorieId" = c."id"
FROM "CategorieMeuble" c WHERE m."categorie" = c."nom";
ALTER TABLE "Meuble" ALTER COLUMN "categorieId" SET NOT NULL;

-- 6. Add categorieId (nullable) to Equipement and link to CategorieEquipement
ALTER TABLE "Equipement" ADD COLUMN IF NOT EXISTS "categorieId" TEXT;
UPDATE "Equipement" e SET "categorieId" = c."id"
FROM "CategorieEquipement" c WHERE e."categorie" = c."nom";
ALTER TABLE "Equipement" ALTER COLUMN "categorieId" SET NOT NULL;

-- 7. Drop old indexes on categorie string
DROP INDEX IF EXISTS "Meuble_nom_categorie_key";
DROP INDEX IF EXISTS "Meuble_categorie_idx";
DROP INDEX IF EXISTS "Equipement_nom_categorie_key";
DROP INDEX IF EXISTS "Equipement_categorie_idx";

-- 8. Add FK constraints
ALTER TABLE "Meuble" ADD CONSTRAINT "Meuble_categorieId_fkey"
    FOREIGN KEY ("categorieId") REFERENCES "CategorieMeuble"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Equipement" ADD CONSTRAINT "Equipement_categorieId_fkey"
    FOREIGN KEY ("categorieId") REFERENCES "CategorieEquipement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Add new unique + index constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Meuble_nom_categorieId_key"    ON "Meuble"("nom","categorieId");
CREATE INDEX        IF NOT EXISTS "Meuble_categorieId_idx"         ON "Meuble"("categorieId");
CREATE UNIQUE INDEX IF NOT EXISTS "Equipement_nom_categorieId_key" ON "Equipement"("nom","categorieId");
CREATE INDEX        IF NOT EXISTS "Equipement_categorieId_idx"     ON "Equipement"("categorieId");

-- 10. Drop old categorie string columns
ALTER TABLE "Meuble"     DROP COLUMN IF EXISTS "categorie";
ALTER TABLE "Equipement" DROP COLUMN IF EXISTS "categorie";
