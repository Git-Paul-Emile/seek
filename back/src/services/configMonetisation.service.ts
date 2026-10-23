import { prisma } from "../config/database.js";

const CONFIG_ID = "config";

export const getConfig = async () => {
  let config = await prisma.configMonetisation.findUnique({ where: { id: CONFIG_ID } });
  if (!config) {
    config = await prisma.configMonetisation.create({
      data: { id: CONFIG_ID },
    });
  }
  return config;
};

export const updateConfig = async (data: {
  miseEnAvantActive?: boolean;
  commissionActive?: boolean;
  tauxCommission?: number;
}) => {
  return prisma.configMonetisation.upsert({
    where: { id: CONFIG_ID },
    create: { id: CONFIG_ID, ...data },
    update: data,
  });
};
