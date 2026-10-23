import { PrismaClient } from "../generated/prisma/client.js";

// Initialisation singleton de PrismaClient
const prismaClient = new PrismaClient();

const getDatabaseTarget = () => {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);
    return {
      host: parsed.hostname || "inconnu",
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//, "") || "inconnue",
    };
  } catch {
    return null;
  }
};

const logDatabaseHelp = (err: unknown) => {
  const errorCode =
    typeof err === "object" && err !== null && "errorCode" in err
      ? String((err as { errorCode?: string }).errorCode)
      : null;

  const target = getDatabaseTarget();

  if (errorCode === "P1001") {
    if (target) {
      console.error(
        `Cible DB: host=${target.host} port=${target.port} database=${target.database}`,
      );
    }

    console.error(
      "Verifiez que l'URL Neon est correcte et que le reseau autorise bien les connexions sortantes vers PostgreSQL (port 5432).",
    );
    console.error(
      "Si vous utilisez Neon, testez aussi l'URL 'pooled' du dashboard et ajoutez eventuellement '?sslmode=require&pgbouncer=true&connect_timeout=15'.",
    );
  }
};

export const connectToDatabase = async () => {
  try {
    await prismaClient.$connect();
    console.log("Connecte a la base de donnees principale");
  } catch (err) {
    console.error("Impossible de se connecter a la base de donnees", err);
    logDatabaseHelp(err);
    throw err;
  }
};

export const prisma = prismaClient;
