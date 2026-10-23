import { Router } from "express";
import { authenticateOwner } from "../middlewares/ownerAuth.middleware.js";
import { verificationService } from "../services/verification.service.js";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import { uploadImage } from "../services/cloudinary.service.js";
import { uploadImageMiddleware } from "../middlewares/upload.middleware.js";

const router = Router();

// ─── Routes propriétaire ─────────────────────────────────────────────────

// POST /api/owner/verification/upload - Upload une image de vérification vers Cloudinary
router.post(
  "/upload",
  authenticateOwner,
  uploadImageMiddleware,
  controllerWrapper(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Aucun fichier fourni",
      });
    }

    const result = await uploadImage(req.file.buffer, "seek/verifications", { maxDimension: 2000, quality: 88 });
    
    res.json({
      status: "success",
      data: {
        url: result.url,
        publicId: result.publicId,
      },
    });
  })
);

// ─── Routes propriétaire ─────────────────────────────────────────────────

// GET /api/owner/verification - Récupère le statut de vérification
router.get(
  "/",
  authenticateOwner,
  controllerWrapper(async (req, res) => {
    const proprietaireId = req.owner!.id;
    const status = await verificationService.getStatus(proprietaireId);
    res.json({ status: "success", data: status });
  })
);

// POST /api/owner/verification - Soumet une demande de vérification
router.post(
  "/",
  authenticateOwner,
  controllerWrapper(async (req, res) => {
    const proprietaireId = req.owner!.id;
    const { 
      typePiece, 
      pieceIdentiteRecto, 
      pieceIdentiteVerso, 
      selfie, 
      conditionsAcceptees 
    } = req.body;

    if (!typePiece) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez préciser le type de pièce d'identité",
      });
    }

    if (!pieceIdentiteRecto || !selfie || conditionsAcceptees === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Veuillez fournir tous les documents requis",
      });
    }

    if (!conditionsAcceptees) {
      return res.status(400).json({
        status: "error",
        message: "Vous devez accepter les conditions",
      });
    }

    // Pour CNI, le recto est obligatoire
    if (typePiece === "CNI" && !pieceIdentiteRecto) {
      return res.status(400).json({
        status: "error",
        message: "Le recto de la CNI est obligatoire",
      });
    }

    // Pour passeport, une seule page suffit
    if (typePiece === "PASSEPORT" && !pieceIdentiteRecto) {
      return res.status(400).json({
        status: "error",
        message: "La page d'identité du passeport est obligatoire",
      });
    }

    const status = await verificationService.submitVerification(proprietaireId, {
      typePiece,
      pieceIdentiteRecto,
      pieceIdentiteVerso,
      selfie,
      conditionsAcceptees,
    });

    res.json({
      status: "success",
      message: "Demande de vérification soumise avec succès",
      data: status,
    });
  })
);

// DELETE /api/owner/verification - Annule la demande de vérification
router.delete(
  "/",
  authenticateOwner,
  controllerWrapper(async (req, res) => {
    const proprietaireId = req.owner!.id;
    const status = await verificationService.cancel(proprietaireId);
    res.json({
      status: "success",
      message: "Demande de vérification annulée",
      data: status,
    });
  })
);

export default router;
