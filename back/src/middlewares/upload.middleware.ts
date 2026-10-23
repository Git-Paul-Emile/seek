import multer, { MulterError } from "multer";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";

// ─── Constantes ───────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/jfif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

// ─── Instance Multer ──────────────────────────────────────────────────────────

const multerInstance = multer({
  storage: multer.memoryStorage(), // Stockage en RAM → buffer transmis à Cloudinary
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Message sentinelle récupéré dans le wrapper
      cb(new Error("TYPE_INVALIDE"));
    }
  },
}).single("image"); // Champ FormData attendu : "image"

// ─── Middleware exporté ───────────────────────────────────────────────────────

/**
 * Middleware d'upload d'image (optionnel).
 * - Champ FormData : "image"
 * - Types acceptés : JPEG, PNG, WEBP
 * - Taille maximale : 5 Mo
 * - Stockage en mémoire (req.file.buffer) puis upload vers Cloudinary
 * - Passe silencieusement si aucun fichier n'est envoyé (requêtes JSON)
 */
export const uploadImageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  multerInstance(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(
        new AppError(
          "Image trop volumineuse. Taille maximale autorisée : 5 Mo",
          StatusCodes.BAD_REQUEST
        )
      );
    }

    if (err instanceof Error && err.message === "TYPE_INVALIDE") {
      return next(
        new AppError(
          "Type de fichier non autorisé. Formats acceptés : JPEG, JFIF, PNG, WEBP, AVIF",
          StatusCodes.UNPROCESSABLE_ENTITY
        )
      );
    }

    return next(
      new AppError(
        "Erreur lors du traitement du fichier",
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  });
};
