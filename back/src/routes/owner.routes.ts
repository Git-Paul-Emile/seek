import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as OwnerController from "../controllers/owner.controller.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerOwnerSchema, loginOwnerSchema } from "../validators/owner.validator.js";

const router = Router();

/** POST /api/owner/auth/register */
router.post(
  "/register",
  validate(registerOwnerSchema),
  controllerWrapper(OwnerController.register)
);

/** POST /api/owner/auth/login */
router.post(
  "/login",
  validate(loginOwnerSchema),
  controllerWrapper(OwnerController.login)
);

/** POST /api/owner/auth/refresh */
router.post("/refresh", controllerWrapper(OwnerController.refresh));

/** POST /api/owner/auth/forgot-password */
router.post("/forgot-password", controllerWrapper(OwnerController.forgotPassword));

/** POST /api/owner/auth/reset-password */
router.post("/reset-password", controllerWrapper(OwnerController.resetPassword));

/** POST /api/owner/auth/verifier-telephone - protégé */
router.post(
  "/verifier-telephone",
  authenticateOwner,
  controllerWrapper(OwnerController.verifierTelephone)
);

/** POST /api/owner/auth/verifier-telephone-public - public (pour vérification après inscription) */
router.post(
  "/verifier-telephone-public",
  controllerWrapper(OwnerController.verifierTelephonePublic)
);

/** POST /api/owner/auth/renvoyer-otp-public - public (pour renvoyer OTP après inscription) */
router.post(
  "/renvoyer-otp-public",
  controllerWrapper(OwnerController.renvoyerOtpPublic)
);

/** POST /api/owner/auth/renvoyer-otp - protégé */
router.post(
  "/renvoyer-otp",
  authenticateOwner,
  controllerWrapper(OwnerController.renvoyerOtp)
);

/** POST /api/owner/auth/logout */
router.post(
  "/logout",
  controllerWrapper(OwnerController.logout)
);

/** GET /api/owner/auth/me - protégé */
router.get(
  "/me",
  authenticateOwner,
  controllerWrapper(OwnerController.me)
);

/** PUT /api/owner/profile - protégé */
router.put(
  "/profile",
  authenticateOwner,
  controllerWrapper(OwnerController.updateProfile)
);

/** DELETE /api/owner/profile - protégé */
router.delete(
  "/profile",
  authenticateOwner,
  controllerWrapper(OwnerController.deleteProfile)
);

/** GET /api/owner/messages-bail - messages bail non lus */
router.get(
  "/messages-bail",
  authenticateOwner,
  controllerWrapper(OwnerController.getMessagesInternes)
);

/** POST /api/owner/messages-bail/lus - marquer tous comme lus */
router.post(
  "/messages-bail/lus",
  authenticateOwner,
  controllerWrapper(OwnerController.marquerMessagesLus)
);

router.get(
  "/edl-manquants",
  authenticateOwner,
  controllerWrapper(OwnerController.getBiensSansEdl)
);

export default router;
