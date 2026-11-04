import { Redis } from "ioredis";

// Connexions Redis des files d'attente BullMQ. REDIS_URL accepte redis:// ou rediss:// (TLS,
// par exemple chez Upstash). En développement, le Redis local sur le port par défaut.
// En ESM, BullMQ exige un client déjà construit : une connexion par file et par worker.
const REDIS_URL_PAR_DEFAUT = "redis://127.0.0.1:6379";

export const creerConnexionRedis = (): Redis =>
  new Redis(process.env.REDIS_URL?.trim() || REDIS_URL_PAR_DEFAUT, {
    // Exigé par BullMQ pour les workers : une commande bloquante ne doit pas échouer en boucle.
    maxRetriesPerRequest: null,
  });
