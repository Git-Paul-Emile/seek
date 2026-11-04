import "dotenv/config"; // Doit etre le 1er import - charge .env avant tous les autres modules
import { createServer } from "http";
import { connectToDatabase } from "./config/database.js";
import { initializeWebSocket } from "./services/socket.service.js";
import { initCronJobs } from "./services/cron.service.js";
import { arreterWorkerMedias, demarrerWorkerMedias } from "./services/mediasBien.worker.js";
import app from "./config/app.js";

// Lancement
const initializeApp = async () => {
  try {
    const PORT = process.env.PORT || 8000;

    await connectToDatabase();

    // Creer le serveur HTTP pour Express
    const httpServer = createServer(app);

    // Initialiser WebSocket (Socket.IO)
    initializeWebSocket(httpServer);

    // Initialiser les taches CRON
    initCronJobs();

    // Worker de la file BullMQ « medias-bien » (photos et vidéos des annonces)
    demarrerWorkerMedias();

    // Arrêt propre : le job en cours se termine avant la fermeture du worker
    const arreter = async () => {
      await arreterWorkerMedias();
      process.exit(0);
    };
    process.once("SIGTERM", arreter);
    process.once("SIGINT", arreter);

    // Demarrer le serveur
    httpServer.listen(PORT, () => {
      console.log(`Serveur demarre sur http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Erreur DB :", err);
    process.exit(1);
  }
};

initializeApp();
