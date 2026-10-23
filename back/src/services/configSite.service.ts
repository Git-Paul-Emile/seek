import { prisma } from "../config/database.js";

// Type pour les horaires du service client
export type ServiceHoursDay = {
  day: string;
  isOpen: boolean;
  open: string;
  close: string;
};

export const getConfigSite = async () => {
  const config = await prisma.configSite.findUnique({
    where: { id: "config_site" },
  });

  return config;
};

export const updateConfigSite = async (data: {
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  serviceClientHours?: ServiceHoursDay[];
}) => {
  // Ensure config exists first
  const config = await getConfigSite();
  if (!config) {
    throw new Error("Configuration introuvable, veuillez exécuter le seeder.");
  }

  const updated = await prisma.configSite.update({
    where: { id: "config_site" },
    data,
  });

  return updated;
};

export const updateLogoFiligrane = async (logoUrl: string | null) => {
  await prisma.configSite.upsert({
    where: { id: "config_site" },
    update: { logoFiligrane: logoUrl },
    create: {
      id: "config_site",
      logoFiligrane: logoUrl,
    },
  });
};

/**
 * Récupère le buffer du logo filigrane depuis son URL Cloudinary.
 * Retourne null si aucun logo n'est configuré ou si le téléchargement échoue.
 * Utilisé pour appliquer le filigrane avant l'upload des photos de biens.
 */
export const getLogoFiligraneBuffer = async (): Promise<Buffer | null> => {
  try {
    const config = await getConfigSite();
    if (!config?.logoFiligrane) return null;

    const response = await fetch(config.logoFiligrane);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};
