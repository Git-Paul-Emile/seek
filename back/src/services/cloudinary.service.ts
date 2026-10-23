import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";
import cloudinary from "../config/cloudinary.js";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";
import { optimizeImage, type OptimizeOptions } from "../utils/optimizeImage.js";
import { applyWatermark } from "../utils/watermark.js";

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
}

/**
 * Optimise (compression + resize + WebP) puis upload vers Cloudinary.
 * @param buffer  - Buffer brut fourni par Multer (memoryStorage)
 * @param folder  - Dossier Cloudinary cible (ex: "seek/biens")
 * @param options - Paramètres d'optimisation optionnels (maxDimension, quality)
 */
export const uploadImage = async (
  buffer: Buffer,
  folder: string,
  options?: OptimizeOptions,
  watermarkLogoBuffer?: Buffer | null
): Promise<CloudinaryUploadResult> => {
  let optimized = await optimizeImage(buffer, options);

  if (watermarkLogoBuffer) {
    optimized = await applyWatermark(optimized, watermarkLogoBuffer);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", format: "webp" },
      (
        error: UploadApiErrorResponse | undefined,
        result: UploadApiResponse | undefined
      ) => {
        if (error || !result) {
          return reject(
            new AppError(
              "Échec de l'upload vers Cloudinary",
              StatusCodes.INTERNAL_SERVER_ERROR
            )
          );
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(optimized);
  });
};

/**
 * Upload une vidéo vers Cloudinary (resource_type: video).
 */
export const uploadVideo = (
  buffer: Buffer,
  folder: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "video" },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(new AppError("Échec de l'upload vidéo vers Cloudinary", StatusCodes.INTERNAL_SERVER_ERROR));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Upload un fichier quelconque (PDF, image) vers Cloudinary (resource_type: auto)
 */
export const uploadFile = (
  buffer: Buffer,
  folder: string,
  filename?: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto", use_filename: true, public_id: filename },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          return reject(new AppError("Échec de l'upload vers Cloudinary", StatusCodes.INTERNAL_SERVER_ERROR));
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

/**
 * Supprime une image Cloudinary à partir de son public ID.
 * Ne lance pas d'erreur si la suppression échoue (image déjà absente).
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

/**
 * Extrait le public ID Cloudinary depuis une URL sécurisée.
 * Ex: "https://res.cloudinary.com/cloud/image/upload/v123/seek/types-logement/abc.jpg"
 *  → "seek/types-logement/abc"
 */
export const extractPublicId = (url: string): string | null => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match?.[1] ?? null;
};

/**
 * Supprime en masse des ressources Cloudinary à partir d'une liste d'URLs.
 * Les URLs nulles/undefined et les échecs individuels sont ignorés silencieusement.
 */
export const deleteUrls = async (urls: (string | null | undefined)[]): Promise<void> => {
  const tasks = urls
    .filter((u): u is string => !!u)
    .map((url) => {
      const publicId = extractPublicId(url);
      return publicId ? deleteImage(publicId) : Promise.resolve();
    });
  await Promise.allSettled(tasks);
};
