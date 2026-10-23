import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import * as SignalementController from "../controllers/signalement.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { verifyAccessToken } from "../services/comptePublicAuth.service.js";

const router = Router();

// Middleware optionnel pour compte public
const optionalComptePublicAuth = (req: Request, res: Response, next: NextFunction) => {
  const cookieToken = req.cookies?.comptePublicAccessToken as string | undefined;
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;

  const token = cookieToken ?? headerToken;

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      // @ts-ignore
      req.user = { id: payload.sub, nom: payload.nom, prenom: payload.prenom };
    } catch (e) {
      // Ignorer l'erreur si le token est invalide, l'utilisateur est considéré comme non connecté
    }
  }
  next();
};

// ==========================================
// ROUTES PUBLIQUES
// ==========================================

router.post(
  "/",
  optionalComptePublicAuth,
  SignalementController.createSignalement
);

// ==========================================
// ROUTES ADMIN
// ==========================================

// Préfixe : /admin/signalements (configuré dans app.ts)

router.get(
  "/admin",
  authenticate,
  SignalementController.getSignalementsAdmin
);

router.get(
  "/admin/:id",
  authenticate,
  SignalementController.getSignalementByIdAdmin
);

router.post(
  "/admin/:id/valider",
  authenticate,
  SignalementController.validerSignalementAdmin
);

router.post(
  "/admin/:id/rejeter",
  authenticate,
  SignalementController.rejeterSignalementAdmin
);

export default router;
