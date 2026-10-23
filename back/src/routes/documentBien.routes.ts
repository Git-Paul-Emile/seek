import { Router } from "express";
import multer from "multer";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as DocumentBienController from "../controllers/documentBien.controller.js";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";

const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Monté sous /api/biens/:bienId/documents
const router = Router({ mergeParams: true });

// GET /api/biens/:bienId/documents
router.get("/", authenticateOwner, controllerWrapper(DocumentBienController.listDocuments));

// POST /api/biens/:bienId/documents - upload fichier
router.post("/", authenticateOwner, docUpload.single("fichier"), controllerWrapper(DocumentBienController.uploadDocument));

// DELETE /api/biens/:bienId/documents/:docId
router.delete("/:docId", authenticateOwner, controllerWrapper(DocumentBienController.deleteDocument));

export default router;
