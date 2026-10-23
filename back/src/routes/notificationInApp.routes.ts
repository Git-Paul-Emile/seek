import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as NotifController from "../controllers/notificationInApp.controller.js";
import * as NotificationPreferencesController from "../controllers/notificationPreferences.controller.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";
import { authenticateLocataire } from "../middlewares/locataireAuth.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

// ─── Owner notifications ──────────────────────────────────────────────────────
export const ownerNotifRouter = Router();

ownerNotifRouter.get("/", authenticateOwner, controllerWrapper(NotifController.getOwnerNotifications));
ownerNotifRouter.patch("/mark-all-read", authenticateOwner, controllerWrapper(NotifController.markOwnerNotificationsRead));
ownerNotifRouter.patch("/:id/read", authenticateOwner, controllerWrapper(NotifController.markOwnerOneNotificationRead));

// ─── Préférences de canaux de notification (SMS / Email / WhatsApp) ──────────
ownerNotifRouter.get("/canaux", authenticateOwner, controllerWrapper(NotificationPreferencesController.getCanaux));
ownerNotifRouter.put("/canaux", authenticateOwner, controllerWrapper(NotificationPreferencesController.updateCanaux));

// ─── Locataire notifications ──────────────────────────────────────────────────
export const locataireNotifRouter = Router();

locataireNotifRouter.get("/", authenticateLocataire, controllerWrapper(NotifController.getLocataireNotifications));
locataireNotifRouter.patch("/mark-all-read", authenticateLocataire, controllerWrapper(NotifController.markLocataireNotificationsRead));
locataireNotifRouter.patch("/:id/read", authenticateLocataire, controllerWrapper(NotifController.markLocataireOneNotificationRead));

// ─── Admin notifications ──────────────────────────────────────────────────────
export const adminNotifRouter = Router();

adminNotifRouter.get("/", authenticate, controllerWrapper(NotifController.getAdminNotifications));
