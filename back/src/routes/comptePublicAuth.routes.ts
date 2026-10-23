import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as Ctrl from "../controllers/comptePublicAuth.controller.js";
import { authenticateComptePublic } from "../middlewares/comptePublicAuth.middleware.js";

const router = Router();

/** POST /api/public/auth/register */
router.post("/register", controllerWrapper(Ctrl.register));

/** POST /api/public/auth/login */
router.post("/login", controllerWrapper(Ctrl.login));

/** POST /api/public/auth/refresh */
router.post("/refresh", controllerWrapper(Ctrl.refresh));

/** POST /api/public/auth/logout */
router.post("/logout", controllerWrapper(Ctrl.logout));

/** GET /api/public/auth/me */
router.get("/me", authenticateComptePublic, controllerWrapper(Ctrl.me));

/** PUT /api/public/auth/profile */
router.put("/profile", authenticateComptePublic, controllerWrapper(Ctrl.updateProfile));

/** PUT /api/public/auth/change-password */
router.put("/change-password", authenticateComptePublic, controllerWrapper(Ctrl.changePassword));

/** DELETE /api/public/auth/account */
router.delete("/account", authenticateComptePublic, controllerWrapper(Ctrl.deleteAccount));

export default router;
