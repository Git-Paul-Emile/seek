import { Router } from "express";
import { controllerWrapper } from "../utils/ControllerWrapper.js";
import * as LocataireAuthController from "../controllers/locataireAuth.controller.js";
import * as BailInvitationController from "../controllers/bailInvitation.controller.js";
import { authenticateLocataire } from "../middlewares/locataireAuth.middleware.js";
import { uploadImageMiddleware } from "../middlewares/upload.middleware.js";
import { uploadImage } from "../services/cloudinary.service.js";

const router = Router();

router.post("/activer", controllerWrapper(LocataireAuthController.activer));
router.post("/forgot-password", controllerWrapper(LocataireAuthController.forgotPassword));
router.post("/reset-password", controllerWrapper(LocataireAuthController.resetPassword));
router.post("/login", controllerWrapper(LocataireAuthController.login));
router.post("/refresh", controllerWrapper(LocataireAuthController.refreshToken));
router.post("/logout", controllerWrapper(LocataireAuthController.logout));

router.get("/me", authenticateLocataire, controllerWrapper(LocataireAuthController.me));
router.put("/profil", authenticateLocataire, controllerWrapper(LocataireAuthController.updateProfil));

router.get("/echeancier", authenticateLocataire, controllerWrapper(LocataireAuthController.getEcheancier));
router.get("/contrat", authenticateLocataire, controllerWrapper(LocataireAuthController.getContrat));
router.post("/paiement/payer", authenticateLocataire, controllerWrapper(LocataireAuthController.payerEcheances));
router.post("/paiement/initier", authenticateLocataire, controllerWrapper(LocataireAuthController.initierPaiement));
router.patch("/paiement/:echeanceId/confirmer-especes", authenticateLocataire, controllerWrapper(LocataireAuthController.confirmerPaiementEspeces));
router.get("/quittances", authenticateLocataire, controllerWrapper(LocataireAuthController.getQuittances));

router.get("/verification", authenticateLocataire, controllerWrapper(LocataireAuthController.getVerification));
router.post("/verification", authenticateLocataire, controllerWrapper(LocataireAuthController.submitVerification));
router.delete("/verification", authenticateLocataire, controllerWrapper(LocataireAuthController.cancelVerification));

router.get("/proprietaire", authenticateLocataire, controllerWrapper(LocataireAuthController.getProprietaire));
router.get("/historique", authenticateLocataire, controllerWrapper(LocataireAuthController.getHistoriqueLogement));
router.get("/documents", authenticateLocataire, controllerWrapper(LocataireAuthController.getDocumentsBien));

router.patch("/bail/preavis", authenticateLocataire, controllerWrapper(LocataireAuthController.mettreEnPreavisLocataire));
router.patch("/bail/resilier", authenticateLocataire, controllerWrapper(LocataireAuthController.resilierBailLocataire));

router.get("/messages-bail", authenticateLocataire, controllerWrapper(LocataireAuthController.getMessagesBailLocataire));
router.post("/messages-bail/lus", authenticateLocataire, controllerWrapper(LocataireAuthController.marquerMessagesLusLocataire));
router.get("/edl-manquant", authenticateLocataire, controllerWrapper(LocataireAuthController.getAlerteEdlManquant));
router.post("/edl-manquant/demande", authenticateLocataire, controllerWrapper(LocataireAuthController.demanderEtatDesLieux));

router.delete("/compte", authenticateLocataire, controllerWrapper(LocataireAuthController.supprimerCompte));

/** GET /api/locataire/auth/invitations - Liste des invitations en attente */
router.get("/invitations", authenticateLocataire, controllerWrapper(BailInvitationController.getInvitations));

/** POST /api/locataire/auth/invitations/:token/accepter */
router.post("/invitations/:token/accepter", authenticateLocataire, controllerWrapper(BailInvitationController.accepterInvitation));

/** POST /api/locataire/auth/invitations/:token/refuser */
router.post("/invitations/:token/refuser", authenticateLocataire, controllerWrapper(BailInvitationController.refuserInvitation));

router.post(
  "/verification/upload",
  authenticateLocataire,
  uploadImageMiddleware,
  controllerWrapper(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ status: "error", message: "Aucun fichier fourni" });
    }

    const result = await uploadImage(req.file.buffer, "seek/verifications/locataires");
    res.json({ status: "success", data: result });
  })
);

export default router;
