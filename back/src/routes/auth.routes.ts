import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as AuthController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { loginSchema, changePasswordSchema } from "../validators/auth.validator.js";
import { limiteurAuth, limiteurRefresh } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

/**
 * POST /api/auth/login
 * Rate limit : 10 tentatives / 15 min
 */
router.post(
  "/login",
  limiteurAuth,
  validate(loginSchema),
  controllerWrapper(AuthController.login)
);

/**
 * POST /api/auth/refresh
 * Rate limit : 30 requêtes / heure
 * Le cookie refreshToken n'est envoyé que sur ce path exact
 */
router.post(
  "/refresh",
  limiteurRefresh,
  controllerWrapper(AuthController.refresh)
);

/**
 * POST /api/auth/logout
 * Protégé : nécessite un access token valide
 */
router.post(
  "/logout",
  controllerWrapper(AuthController.logout)
);

/**
 * GET /api/auth/me
 * Protégé : retourne les infos de l'admin connecté
 */
router.get(
  "/me",
  authenticate,
  controllerWrapper(AuthController.me)
);

/**
 * PUT /api/auth/profile
 * Protégé : mise à jour du profil admin
 */
router.put(
  "/profile",
  authenticate,
  controllerWrapper(AuthController.updateProfile)
);

/**
 * PUT /api/auth/change-password
 * Protégé : changement de mot de passe avec vérification de l'ancien mot de passe
 */
router.put(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  controllerWrapper(AuthController.changePassword)
);

export default router;
