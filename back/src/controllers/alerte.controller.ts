import type { Response, Request } from "express";
import { PrismaClient } from "../generated/prisma/client.js";

const prisma = new PrismaClient();

const QUOTA_MAX = 2;
const ALERTE_SAFE_SELECT = {
  id: true,
  telephone: true,
  ville: true,
  quartier: true,
  typeLogement: true,
  typeTransaction: true,
  prixMin: true,
  prixMax: true,
  canalPrefere: true,
  statut: true,
  createdAt: true,
  updatedAt: true,
} as const;

const getSingleParam = (param: string | string[] | undefined): string | null => {
  if (typeof param === "string" && param.trim()) return param;
  return null;
};

const isMissingComptePublicIdColumn = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? error.code : undefined;
  const meta = "meta" in error ? error.meta : undefined;
  const column = meta && typeof meta === "object" && "column" in meta ? meta.column : undefined;
  return code === "P2022" && column === "Alerte.comptePublicId";
};

const getCompteTelephone = async (comptePublicId: string): Promise<string | null> => {
  const compte = await prisma.comptePublic.findUnique({
    where: { id: comptePublicId },
    select: { telephone: true },
  });

  return compte?.telephone?.replace(/\s/g, "") ?? null;
};

// ─── Créer une alerte (public, sans compte) ─────────────────────────────────

export const creerAlerte = async (req: Request, res: Response) => {
  try {
    const {
      telephone,
      typeLogement,
      typeTransaction,
      ville,
      quartier,
      prixMin,
      prixMax,
      canalPrefere,
    } = req.body;

    if (!telephone) {
      return res.status(400).json({
        success: false,
        message: "Le numéro de téléphone est obligatoire",
      });
    }

    const telephoneClean = telephone.replace(/\s/g, "");
    if (telephoneClean.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Le numéro de téléphone n'est pas valide",
      });
    }

    if (prixMin && prixMax) {
      const minVal = Number(prixMin);
      const maxVal = Number(prixMax);
      if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
        return res.status(400).json({
          success: false,
          message: "Le budget minimum ne peut pas être supérieur au budget maximum",
        });
      }
    }

    const alerteExistante = await prisma.alerte.findFirst({
      where: { telephone: telephoneClean, statut: "ACTIVE" },
      select: ALERTE_SAFE_SELECT,
    });

    let alerte;
    if (alerteExistante) {
      alerte = await prisma.alerte.update({
        where: { id: alerteExistante.id },
        select: ALERTE_SAFE_SELECT,
        data: {
          typeLogement,
          typeTransaction,
          ville,
          quartier,
          prixMin: prixMin ? Number(prixMin) : undefined,
          prixMax: prixMax ? Number(prixMax) : undefined,
          canalPrefere: canalPrefere ?? "SMS",
        },
      });
    } else {
      alerte = await prisma.alerte.create({
        select: ALERTE_SAFE_SELECT,
        data: {
          telephone: telephoneClean,
          typeLogement,
          typeTransaction,
          ville,
          quartier,
          prixMin: prixMin ? Number(prixMin) : undefined,
          prixMax: prixMax ? Number(prixMax) : undefined,
          canalPrefere: canalPrefere ?? "SMS",
          statut: "ACTIVE",
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: alerteExistante
        ? "Alerte mise à jour avec succès !"
        : "Alerte créée avec succès ! Vous recevrez nos nouvelles annonces.",
      data: { id: alerte.id, telephone: alerte.telephone, canalPrefere: alerte.canalPrefere },
    });
  } catch (error) {
    console.error("Erreur création alerte:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la création de l'alerte",
    });
  }
};

// ─── Lister les alertes (admin) ─────────────────────────────────────────────

export const getAlertes = async (_req: Request, res: Response) => {
  try {
    const alertes = await prisma.alerte.findMany({
      where: { statut: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: ALERTE_SAFE_SELECT,
    });

    return res.json({ success: true, data: alertes });
  } catch (error) {
    console.error("Erreur liste alertes:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la récupération des alertes",
    });
  }
};

// ─── Désactiver une alerte (public, par téléphone) ──────────────────────────

export const desactiverAlerte = async (req: Request, res: Response) => {
  try {
    const { telephone } = req.body;

    if (!telephone) {
      return res.status(400).json({
        success: false,
        message: "Le numéro de téléphone est obligatoire",
      });
    }

    const result = await prisma.alerte.updateMany({
      where: { telephone, statut: "ACTIVE" },
      data: { statut: "DESACTIVE" },
    });

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucune alerte active trouvée pour ce numéro",
      });
    }

    return res.json({ success: true, message: "Alerte désactivée avec succès" });
  } catch (error) {
    console.error("Erreur désactivation alerte:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la désactivation de l'alerte",
    });
  }
};

// ─── Mes alertes (comptePublic authentifié) ──────────────────────────────────

export const getMesAlertes = async (req: Request, res: Response) => {
  try {
    const comptePublicId = req.comptePublic!.id;

    const alertes = await prisma.alerte.findMany({
      where: { comptePublicId },
      orderBy: { createdAt: "desc" },
      select: ALERTE_SAFE_SELECT,
    });

    return res.json({ success: true, data: alertes });
  } catch (error) {
    if (isMissingComptePublicIdColumn(error)) {
      const telephone = await getCompteTelephone(req.comptePublic!.id);
      if (!telephone) {
        return res.status(404).json({ success: false, message: "Compte public introuvable" });
      }

      const alertes = await prisma.alerte.findMany({
        where: { telephone },
        orderBy: { createdAt: "desc" },
        select: ALERTE_SAFE_SELECT,
      });

      return res.json({ success: true, data: alertes });
    }

    console.error("Erreur liste mes alertes:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue",
    });
  }
};

// ─── Créer une alerte (comptePublic authentifié, quota 2) ────────────────────

export const creerAlerteCompte = async (req: Request, res: Response) => {
  try {
    const comptePublicId = req.comptePublic!.id;
    const { typeLogement, typeTransaction, ville, quartier, prixMin, prixMax, canalPrefere } =
      req.body;

    if (prixMin && prixMax) {
      const minVal = Number(prixMin);
      const maxVal = Number(prixMax);
      if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
        return res.status(400).json({
          success: false,
          message: "Le budget minimum ne peut pas être supérieur au budget maximum",
        });
      }
    }

    const telephone = await getCompteTelephone(comptePublicId);
    if (!telephone) {
      return res.status(404).json({
        success: false,
        message: "Compte public introuvable",
      });
    }

    const data = {
      comptePublicId,
      telephone,
      typeLogement: typeLogement || null,
      typeTransaction: typeTransaction || null,
      ville: ville || null,
      quartier: quartier || null,
      prixMin: prixMin ? Number(prixMin) : null,
      prixMax: prixMax ? Number(prixMax) : null,
      canalPrefere: canalPrefere ?? "SMS",
      statut: "ACTIVE" as const,
    };

    let alerteExistante;
    let count = 0;

    try {
      // Réutilise une alerte existante liée au compte ou au téléphone avant d'en créer une nouvelle.
      alerteExistante = await prisma.alerte.findFirst({
        where: {
          OR: [{ comptePublicId }, { telephone }],
        },
        orderBy: { createdAt: "desc" },
        select: ALERTE_SAFE_SELECT,
      });

      count = await prisma.alerte.count({ where: { comptePublicId } });
    } catch (error) {
      if (!isMissingComptePublicIdColumn(error)) {
        throw error;
      }

      alerteExistante = await prisma.alerte.findFirst({
        where: { telephone },
        orderBy: { createdAt: "desc" },
        select: ALERTE_SAFE_SELECT,
      });

      count = await prisma.alerte.count({ where: { telephone } });
    }

    let alerte;
    if (alerteExistante) {
      try {
        alerte = await prisma.alerte.update({
          where: { id: alerteExistante.id },
          select: ALERTE_SAFE_SELECT,
          data,
        });
      } catch (error) {
        if (!isMissingComptePublicIdColumn(error)) {
          throw error;
        }

        const { comptePublicId: _ignored, ...legacyData } = data;
        alerte = await prisma.alerte.update({
          where: { id: alerteExistante.id },
          select: ALERTE_SAFE_SELECT,
          data: legacyData,
        });
      }
    } else {
      if (count >= QUOTA_MAX) {
        return res.status(403).json({
          success: false,
          message: `Vous avez atteint le quota maximum de ${QUOTA_MAX} alertes. Supprimez une alerte existante pour en créer une nouvelle.`,
        });
      }

      try {
        alerte = await prisma.alerte.create({
          data,
          select: ALERTE_SAFE_SELECT,
        });
      } catch (error) {
        if (!isMissingComptePublicIdColumn(error)) {
          throw error;
        }

        const { comptePublicId: _ignored, ...legacyData } = data;
        alerte = await prisma.alerte.create({
          data: legacyData,
          select: ALERTE_SAFE_SELECT,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: alerteExistante
        ? "Alerte mise à jour avec succès !"
        : "Alerte créée avec succès ! Vous recevrez les nouvelles annonces correspondantes.",
      data: alerte,
    });
  } catch (error) {
    console.error("Erreur création alerte compte:", error);
    return res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la création de l'alerte",
    });
  }
};

// ─── Activer une alerte (comptePublic authentifié) ───────────────────────────

export const activerAlerteCompte = async (req: Request, res: Response) => {
  try {
    const comptePublicId = req.comptePublic!.id;
    const id = getSingleParam(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, message: "Identifiant d'alerte invalide" });
    }

    let alerte;
    try {
      alerte = await prisma.alerte.findFirst({
        where: { id, comptePublicId },
        select: ALERTE_SAFE_SELECT,
      });
    } catch (error) {
      if (!isMissingComptePublicIdColumn(error)) throw error;

      const telephone = await getCompteTelephone(comptePublicId);
      if (!telephone) {
        return res.status(404).json({ success: false, message: "Compte public introuvable" });
      }

      alerte = await prisma.alerte.findFirst({
        where: { id, telephone },
        select: ALERTE_SAFE_SELECT,
      });
    }

    if (!alerte) {
      return res.status(404).json({ success: false, message: "Alerte introuvable" });
    }

    const updated = await prisma.alerte.update({
      where: { id },
      data: { statut: "ACTIVE" },
      select: ALERTE_SAFE_SELECT,
    });

    return res.json({ success: true, message: "Alerte activée", data: updated });
  } catch (error) {
    console.error("Erreur activation alerte:", error);
    return res.status(500).json({ success: false, message: "Une erreur est survenue" });
  }
};

// ─── Désactiver une alerte (comptePublic authentifié) ────────────────────────

export const desactiverAlerteCompte = async (req: Request, res: Response) => {
  try {
    const comptePublicId = req.comptePublic!.id;
    const id = getSingleParam(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, message: "Identifiant d'alerte invalide" });
    }

    let alerte;
    try {
      alerte = await prisma.alerte.findFirst({
        where: { id, comptePublicId },
        select: ALERTE_SAFE_SELECT,
      });
    } catch (error) {
      if (!isMissingComptePublicIdColumn(error)) throw error;

      const telephone = await getCompteTelephone(comptePublicId);
      if (!telephone) {
        return res.status(404).json({ success: false, message: "Compte public introuvable" });
      }

      alerte = await prisma.alerte.findFirst({
        where: { id, telephone },
        select: ALERTE_SAFE_SELECT,
      });
    }

    if (!alerte) {
      return res.status(404).json({ success: false, message: "Alerte introuvable" });
    }

    const updated = await prisma.alerte.update({
      where: { id },
      data: { statut: "DESACTIVE" },
      select: ALERTE_SAFE_SELECT,
    });

    return res.json({ success: true, message: "Alerte désactivée", data: updated });
  } catch (error) {
    console.error("Erreur désactivation alerte compte:", error);
    return res.status(500).json({ success: false, message: "Une erreur est survenue" });
  }
};

// ─── Supprimer une alerte (comptePublic authentifié) ─────────────────────────

export const supprimerAlerteCompte = async (req: Request, res: Response) => {
  try {
    const comptePublicId = req.comptePublic!.id;
    const id = getSingleParam(req.params.id);

    if (!id) {
      return res.status(400).json({ success: false, message: "Identifiant d'alerte invalide" });
    }

    let alerte;
    try {
      alerte = await prisma.alerte.findFirst({
        where: { id, comptePublicId },
        select: ALERTE_SAFE_SELECT,
      });
    } catch (error) {
      if (!isMissingComptePublicIdColumn(error)) throw error;

      const telephone = await getCompteTelephone(comptePublicId);
      if (!telephone) {
        return res.status(404).json({ success: false, message: "Compte public introuvable" });
      }

      alerte = await prisma.alerte.findFirst({
        where: { id, telephone },
        select: ALERTE_SAFE_SELECT,
      });
    }

    if (!alerte) {
      return res.status(404).json({ success: false, message: "Alerte introuvable" });
    }

    await prisma.alerte.delete({ where: { id } });

    return res.json({ success: true, message: "Alerte supprimée" });
  } catch (error) {
    console.error("Erreur suppression alerte:", error);
    return res.status(500).json({ success: false, message: "Une erreur est survenue" });
  }
};
