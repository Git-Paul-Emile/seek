import multer, { MulterError } from "multer";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";

// ─── Constantes ───────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/jfif",
  "image/pjpeg",
];
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/avi",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska",
];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;       // 5 Mo (photos)
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 Mo (vidéo)
const MAX_FILES = 10;

// ─── Instance Multer photos seules ────────────────────────────────────────────

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("TYPE_INVALIDE"));
    }
  },
}).array("photos", MAX_FILES);

// ─── Instance Multer photos + vidéo ──────────────────────────────────────────

const multerMedias = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_SIZE_BYTES, files: MAX_FILES + 1 },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === "video") {
      if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("VIDEO_TYPE_INVALIDE"));
      }
    } else {
      if (file.size > MAX_SIZE_BYTES) {
        cb(new Error("PHOTO_TROP_GRANDE"));
      } else if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("TYPE_INVALIDE"));
      }
    }
  },
}).fields([
  { name: "photos", maxCount: MAX_FILES },
  { name: "video",  maxCount: 1 },
]);

// ─── Middleware exporté ───────────────────────────────────────────────────────

export const uploadPhotosMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  multerInstance(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(
          new AppError(
            "Photo trop volumineuse. Taille maximale : 5 Mo par photo",
            StatusCodes.BAD_REQUEST
          )
        );
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return next(
          new AppError(
            "Nombre de photos dépassé. Maximum : 10 photos",
            StatusCodes.BAD_REQUEST
          )
        );
      }
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
        "Erreur lors du traitement des photos",
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  });
};

// ─── Middleware médias (photos + vidéo) ───────────────────────────────────────

export const uploadMediasMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  multerMedias(req, res, (err: unknown) => {
    if (!err) return next();

    if (err instanceof MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("Fichier trop volumineux (max 100 Mo pour la vidéo, 5 Mo par photo)", StatusCodes.BAD_REQUEST));
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return next(new AppError("Nombre de fichiers dépassé", StatusCodes.BAD_REQUEST));
      }
    }

    if (err instanceof Error) {
      if (err.message === "VIDEO_TYPE_INVALIDE") {
        return next(new AppError("Format vidéo non autorisé. Formats acceptés : MP4, MOV, AVI, WEBM", StatusCodes.UNPROCESSABLE_ENTITY));
      }
      if (err.message === "TYPE_INVALIDE") {
        return next(new AppError("Type de fichier non autorisé. Formats photos acceptés : JPEG, PNG, WEBP, AVIF", StatusCodes.UNPROCESSABLE_ENTITY));
      }
    }

    return next(new AppError("Erreur lors du traitement des fichiers", StatusCodes.INTERNAL_SERVER_ERROR));
  });
};
