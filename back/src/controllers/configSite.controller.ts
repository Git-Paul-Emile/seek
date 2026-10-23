import type { Request, Response } from "express";
import * as configSiteService from "../services/configSite.service.js";
import * as CloudinaryService from "../services/cloudinary.service.js";
import { extractPublicId, deleteImage } from "../services/cloudinary.service.js";

// Type pour les horaires d'un jour
type ServiceHoursDay = {
  day: string;
  isOpen: boolean;
  open: string;
  close: string;
};

export const get = async (req: Request, res: Response) => {
  try {
    const config = await configSiteService.getConfigSite();
    res.json(config);
  } catch (error) {
    console.error("Erreur récupération config site:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { contactEmail, contactPhone, contactAddress, serviceClientHours } = req.body;

    const config = await configSiteService.updateConfigSite({
      contactEmail,
      contactPhone,
      contactAddress,
      serviceClientHours: serviceClientHours as ServiceHoursDay[],
    });

    res.json(config);
  } catch (error) {
    console.error("Erreur mise à jour config site:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Aucun fichier fourni" });
      return;
    }

    // Supprimer l'ancien logo si présent
    const current = await configSiteService.getConfigSite();
    if (current?.logoFiligrane) {
      const oldPublicId = extractPublicId(current.logoFiligrane);
      if (oldPublicId) await deleteImage(oldPublicId).catch(() => null);
    }

    // Upload du nouveau logo (sans filigrane, sans optimisation WebP pour conserver la transparence PNG)
    const result = await CloudinaryService.uploadFile(req.file.buffer, "seek/config", "logo-filigrane");
    await configSiteService.updateLogoFiligrane(result.url);

    const config = await configSiteService.getConfigSite();
    res.json(config);
  } catch (error) {
    console.error("Erreur upload logo filigrane:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const deleteLogo = async (req: Request, res: Response) => {
  try {
    const current = await configSiteService.getConfigSite();
    if (current?.logoFiligrane) {
      const publicId = extractPublicId(current.logoFiligrane);
      if (publicId) await deleteImage(publicId).catch(() => null);
    }

    await configSiteService.updateLogoFiligrane(null);
    const config = await configSiteService.getConfigSite();
    res.json(config);
  } catch (error) {
    console.error("Erreur suppression logo filigrane:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
