import sharp from "sharp";

export interface OptimizeOptions {
  /** Largeur/hauteur max (maintient le ratio). Défaut : 1920 */
  maxDimension?: number;
  /** Qualité WebP 0–100. Défaut : 82 */
  quality?: number;
}

/**
 * Compresse, redimensionne et convertit un buffer image en WebP.
 * - Redimensionne si l'image dépasse maxDimension (conserve le ratio)
 * - Supprime les métadonnées EXIF (vie privée + taille)
 * - Retourne toujours un buffer WebP
 */
export const optimizeImage = async (
  buffer: Buffer,
  options: OptimizeOptions = {}
): Promise<Buffer> => {
  const { maxDimension = 1920, quality = 82 } = options;

  return sharp(buffer)
    .rotate()                          // Corrige l'orientation EXIF automatiquement
    .resize(maxDimension, maxDimension, {
      fit: "inside",                   // Conserve le ratio, ne dépasse jamais les dims
      withoutEnlargement: true,        // Ne grossit jamais une petite image
    })
    .withMetadata({ orientation: undefined }) // Supprime les métadonnées sauf orientation corrigée
    .webp({ quality })
    .toBuffer();
};
