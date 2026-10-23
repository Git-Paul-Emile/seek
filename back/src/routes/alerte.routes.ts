import { Router } from "express";
import {
  creerAlerte,
  getAlertes,
  desactiverAlerte,
  getMesAlertes,
  creerAlerteCompte,
  activerAlerteCompte,
  desactiverAlerteCompte,
  supprimerAlerteCompte,
} from "../controllers/alerte.controller.js";
import { authenticateComptePublic } from "../middlewares/comptePublicAuth.middleware.js";

const router = Router();

// ─── Routes publiques ────────────────────────────────────────────────────────
router.post("/", creerAlerte);
router.post("/desactiver", desactiverAlerte);

// ─── Routes admin ────────────────────────────────────────────────────────────
router.get("/", getAlertes);

// ─── Routes comptePublic authentifié ────────────────────────────────────────
router.get("/mes-alertes", authenticateComptePublic, getMesAlertes);
router.post("/compte", authenticateComptePublic, creerAlerteCompte);
router.patch("/:id/activer", authenticateComptePublic, activerAlerteCompte);
router.patch("/:id/desactiver", authenticateComptePublic, desactiverAlerteCompte);
router.delete("/:id", authenticateComptePublic, supprimerAlerteCompte);

export default router;
