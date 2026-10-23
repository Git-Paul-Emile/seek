import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { verificationService } from "../services/verification.service.js";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import { AppError } from "../utils/AppError.js";

const router = Router();

// Helper pour valider l'ID
const getIdParam = (params: { id?: string | string[] }): string => {
  const id = params.id;
  if (!id || Array.isArray(id)) {
    throw new AppError("ID invalide", 400);
  }
  return id;
};

// ─── Routes admin pour la vérification ─────────────────────────────────────

// GET /api/admin/verifications/count - Nombre de demandes en attente (DOIT être AVANT les routes paramétrées)
router.get(
  "/verifications/count",
  authenticate,
  controllerWrapper(async (req, res) => {
    const verifications = await verificationService.getPendingVerifications();
    res.json({ status: "success", data: { count: verifications.length } });
  })
);

// GET /api/admin/verifications - Liste des demandes en attente
router.get(
  "/verifications",
  authenticate,
  controllerWrapper(async (req, res) => {
    const verifications = await verificationService.getPendingVerifications();
    res.json({ status: "success", data: verifications });
  })
);

// GET /api/admin/verifications/:id - Détails d'une demande
router.get(
  "/verifications/:id",
  authenticate,
  controllerWrapper(async (req, res) => {
    const id = getIdParam(req.params);
    const verification = await verificationService.getStatus(id);
    res.json({ status: "success", data: verification });
  })
);

// POST /api/admin/verifications/:id/approve - Approuve une demande
router.post(
  "/verifications/:id/approve",
  authenticate,
  controllerWrapper(async (req, res) => {
    const id = getIdParam(req.params);
    const adminId = req.admin!.id;
    const status = await verificationService.approve(id, adminId);
    res.json({
      status: "success",
      message: "Vérification approuvée",
      data: status,
    });
  })
);

// POST /api/admin/verifications/:id/reject - Rejette une demande
router.post(
  "/verifications/:id/reject",
  authenticate,
  controllerWrapper(async (req, res) => {
    const id = getIdParam(req.params);
    const adminId = req.admin!.id;
    const { motif } = req.body;

    if (!motif) {
      return res.status(400).json({
        status: "error",
        message: "Le motif de rejet est obligatoire",
      });
    }

    const status = await verificationService.reject(id, adminId, motif);
    res.json({
      status: "success",
      message: "Vérification rejetée",
      data: status,
    });
  })
);

export default router;
