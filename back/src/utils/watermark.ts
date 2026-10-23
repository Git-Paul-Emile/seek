import sharp from "sharp";

export interface WatermarkOptions {
  /** Ratio largeur filigrane / largeur image (0–1). Défaut : 0.28 */
  sizeRatio?: number;
  /** Opacité 0–1. Défaut : 0.30 */
  opacity?: number;
  /** Position du filigrane. Défaut : "center" */
  gravity?:
    | "center"
    | "north"
    | "south"
    | "east"
    | "west"
    | "northeast"
    | "northwest"
    | "southeast"
    | "southwest";
}

/**
 * Applique un filigrane PNG (logo avec fond transparent) sur un buffer image.
 *
 * - Redimensionne le logo à ~28 % de la largeur de l'image (configurable)
 * - Opacité 30 % par défaut (discret mais présent sur l'image)
 * - Centré par défaut (difficile à recadrer)
 * - Retourne un buffer au même format que l'entrée (WebP après optimisation)
 */
export const applyWatermark = async (
  imageBuffer: Buffer,
  logoBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> => {
  const { sizeRatio = 0.36, opacity = 0.45, gravity = "center" } = options;

  // Dimensions de l'image optimisée
  const { width: imgWidth = 1920 } = await sharp(imageBuffer).metadata();
  const logoTargetWidth = Math.max(80, Math.round(imgWidth * sizeRatio));

  // 1. Redimensionner le logo et extraire les pixels bruts (RGBA)
  const { data, info } = await sharp(logoBuffer)
    .resize(logoTargetWidth, undefined, { fit: "inside", withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // 2. Réduire le canal alpha pour appliquer l'opacité souhaitée
  for (let i = 3; i < data.length; i += channels) {
    const currentAlpha = data[i] ?? 0;
    data[i] = Math.round(currentAlpha * opacity);
  }

  // 3. Reconstruire le PNG avec l'opacité modifiée
  const logoWithOpacity = await sharp(Buffer.from(data), {
    raw: { width, height, channels },
  })
    .png()
    .toBuffer();

  // 4. Composer le filigrane sur l'image principale
  return sharp(imageBuffer)
    .composite([{ input: logoWithOpacity, gravity }])
    .toBuffer();
};
