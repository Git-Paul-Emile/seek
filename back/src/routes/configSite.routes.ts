import { Router } from "express";
import multer from "multer";
import * as configSiteController from "../controllers/configSite.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";

const router = Router();

// Multer dédié au logo filigrane : PNG uniquement, 2 Mo max
const uploadLogoMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new AppError("Le logo doit être au format PNG (fond transparent)", StatusCodes.UNPROCESSABLE_ENTITY));
    }
  },
}).single("logo");

const uploadLogoMiddleware = (req: any, res: any, next: any) => {
  uploadLogoMulter(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof AppError) return next(err);
    return next(new AppError("Erreur lors du traitement du logo", StatusCodes.INTERNAL_SERVER_ERROR));
  });
};

// Routes publiques
router.get("/", configSiteController.get);

// Routes admin
router.put("/", authenticate, configSiteController.update);
router.post("/logo", authenticate, uploadLogoMiddleware, configSiteController.uploadLogo);
router.delete("/logo", authenticate, configSiteController.deleteLogo);

export default router;
