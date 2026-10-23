import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { getAllowedFrontendOrigins } from "../config/external.js";

let io: SocketIOServer | null = null;

// Types d'événements WebSocket
export enum WebSocketEvents {
  // Notifications
  NOTIFICATION_NEW = "notification:new",
  BADGE_UPDATE = "badge:update",
  
  // Transactions
  TRANSACTION_STATUS = "transaction:status",
  PAYMENT_CONFIRMED = "payment:confirmed",
  PAYMENT_FAILED = "payment:failed",
  
  // Stats
  STATS_UPDATE = "stats:update",
  
  // Alertes nouveaux biens
  NEW_PROPERTY_ALERT = "property:new",
  
  // Vérifications d'identité
  VERIFICATION_SUBMITTED = "verification:submitted",
  VERIFICATION_COUNT_UPDATE = "verification:count",

  // Bail & Bien
  BAIL_UPDATED = "bail:updated",
  BIEN_UPDATED = "bien:updated",

  // Signalements
  SIGNALEMENT_NEW = "signalement:new",
  SIGNALEMENT_UPDATED = "signalement:updated",

  // Retour client
  FEEDBACK_SUBMITTED = "feedback:submitted",
  TEMOIGNAGE_SUBMITTED = "temoignage:submitted",
}

// Types de données pour les événements
export interface NotificationPayload {
  id: string;
  proprietaireId?: string;
  locataireId?: string;
  type: string;
  titre: string;
  message: string;
  bailId?: string;
  bienId?: string;
  createdAt: string;
}

export interface BadgeUpdatePayload {
  proprietaireId: string;
  notificationsCount: number;
  transactionsPending: number;
  total: number;
}

export interface TransactionStatusPayload {
  transactionId: string;
  proprietaireId: string;
  statut: "EN_ATTENTE" | "CONFIRME" | "ECHEC" | "ANNULE" | "REMBOURSE";
  montant: number;
  type: string;
  bienId?: string;
  updatedAt: string;
}

export interface StatsUpdatePayload {
  proprietaireId?: string; // undefined pour les stats globales admin
  nouveauxBiens: number;
  nouvellesInscriptions: number;
  transactionsDuJour: number;
}

export interface PropertyAlertPayload {
  alerteId: string;
  telephone: string;
  bienId: string;
  titre: string;
  typeLogement: string;
  typeTransaction: string;
  prix: number;
  localisation: string;
}

export interface VerificationSubmittedPayload {
  proprietaireId: string;
  prenom: string;
  nom: string;
  telephone: string;
  typePiece: string;
  createdAt: string;
}

export interface VerificationCountPayload {
  count: number;
}

/**
 * Initialise le serveur WebSocket
 */
export const initializeWebSocket = (httpServer: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        ...getAllowedFrontendOrigins(),
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Gestion des connexions
  io.on("connection", (socket) => {
    console.log(`✅ Client connecté: ${socket.id}`);

    // Room pour les propriétaires (identifiés par leur ID)
    socket.on("join:owner", (proprietaireId: string) => {
      socket.join(`owner:${proprietaireId}`);
      console.log(`👤 Propriétaire ${proprietaireId} a rejoint la room`);
    });

    socket.on("leave:owner", (proprietaireId: string) => {
      socket.leave(`owner:${proprietaireId}`);
      console.log(`👤 Propriétaire ${proprietaireId} a quitté la room`);
    });

    // Room pour les locataires
    socket.on("join:locataire", (locataireId: string) => {
      socket.join(`locataire:${locataireId}`);
      console.log(`🏠 Locataire ${locataireId} a rejoint la room`);
    });

    socket.on("leave:locataire", (locataireId: string) => {
      socket.leave(`locataire:${locataireId}`);
      console.log(`🏠 Locataire ${locataireId} a quitté la room`);
    });

    // Room pour les admins
    socket.on("join:admin", () => {
      socket.join("admin");
      console.log(`⚡ Admin ${socket.id} a rejoint la room admin`);
    });

    socket.on("leave:admin", () => {
      socket.leave("admin");
      console.log(`⚡ Admin ${socket.id} a quitté la room admin`);
    });

    // Room pour les alertes (par téléphone utilisateur)
    socket.on("join:alerts", (telephone: string) => {
      socket.join(`alerts:${telephone}`);
      console.log(`🔔 Utilisateur ${telephone} a rejoint les alertes`);
    });

    socket.on("leave:alerts", (telephone: string) => {
      socket.leave(`alerts:${telephone}`);
      console.log(`🔕 Utilisateur ${telephone} a quitté les alertes`);
    });

    // Déconnexion
    socket.on("disconnect", () => {
      console.log(`❌ Client déconnecté: ${socket.id}`);
    });
  });

  console.log("🔌 Serveur WebSocket initialisé");
  return io;
};

/**
 * Récupère l'instance du serveur WebSocket
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("WebSocket non initialisé. Appelez initializeWebSocket d'abord.");
  }
  return io;
};

// ============= ÉMETTEURS D'ÉVÉNEMENTS =============

/**
 * Émet une nouvelle notification à un propriétaire
 */
export const emitNotification = (payload: NotificationPayload): void => {
  if (!io) return;
  if (payload.proprietaireId) {
    io.to(`owner:${payload.proprietaireId}`).emit(WebSocketEvents.NOTIFICATION_NEW, payload);
    emitBadgeUpdate(payload.proprietaireId);
  }
  if (payload.locataireId) {
    io.to(`locataire:${payload.locataireId}`).emit(WebSocketEvents.NOTIFICATION_NEW, payload);
  }
};

/**
 * Met à jour les badges d'un propriétaire
 */
export const emitBadgeUpdate = async (proprietaireId: string): Promise<void> => {
  if (!io) return;
  
  // Import dynamique pour éviter les dépendances circulaires
  const { prisma } = await import("../config/database.js");
  
  // Compter les notifications non lues du propriétaire
  const notificationsCount = await prisma.notification.count({
    where: {
      proprietaireId,
    },
  });

  // Compter les transactions en attente
  const transactionsPending = await prisma.transaction.count({
    where: {
      proprietaireId,
      statut: "EN_ATTENTE",
    },
  });

  const payload: BadgeUpdatePayload = {
    proprietaireId,
    notificationsCount,
    transactionsPending,
    total: notificationsCount + transactionsPending,
  };

  io.to(`owner:${proprietaireId}`).emit(WebSocketEvents.BADGE_UPDATE, payload);
};

/**
 * Émet une mise à jour de statut de transaction
 */
export const emitTransactionStatus = (payload: TransactionStatusPayload): void => {
  if (!io) return;
  io.to(`owner:${payload.proprietaireId}`).emit(WebSocketEvents.TRANSACTION_STATUS, payload);
  
  if (payload.statut === "CONFIRME") {
    io.to(`owner:${payload.proprietaireId}`).emit(WebSocketEvents.PAYMENT_CONFIRMED, payload);
  } else if (payload.statut === "ECHEC") {
    io.to(`owner:${payload.proprietaireId}`).emit(WebSocketEvents.PAYMENT_FAILED, payload);
  }
};

/**
 * Émet une mise à jour des statistiques (pour les admins)
 */
export const emitStatsUpdate = (payload: StatsUpdatePayload): void => {
  if (!io) return;
  io.to("admin").emit(WebSocketEvents.STATS_UPDATE, payload);
};

/**
 * Requête les 3 compteurs "du jour" et les émet aux admins connectés
 */
export const fetchAndEmitStatsGlobales = async (): Promise<void> => {
  if (!io) return;

  const { prisma } = await import("../config/database.js");
  const debutJour = new Date();
  debutJour.setHours(0, 0, 0, 0);

  const [nouveauxBiens, nouvellesInscriptions, transactionsDuJour] = await Promise.all([
    prisma.bien.count({ where: { createdAt: { gte: debutJour } } }),
    prisma.proprietaire.count({ where: { createdAt: { gte: debutJour } } }),
    prisma.transaction.count({ where: { statut: "CONFIRME", dateConfirmation: { gte: debutJour } } }),
  ]);

  emitStatsUpdate({ nouveauxBiens, nouvellesInscriptions, transactionsDuJour });
};

/**
 * Émet une alerte de nouveau bien aux utilisateurs concernés
 */
export const emitPropertyAlert = async (bienId: string): Promise<void> => {
  if (!io) return;
  
  const { prisma } = await import("../config/database.js");

  const normalize = (value?: string | null): string | null => {
    if (!value) return null;
    const normalized = value.trim().toLocaleLowerCase();
    return normalized.length > 0 ? normalized : null;
  };
  
  // Récupérer les alertes actives
  const alerts = await prisma.alerte.findMany({
    where: {
      statut: "ACTIVE",
    },
  });

  // Récupérer les infos du bien
  const bien = await prisma.bien.findUnique({
    where: { id: bienId },
    select: {
      titre: true,
      typeLogement: {
        select: { nom: true }
      },
      typeTransaction: {
        select: { nom: true }
      },
      prix: true,
      ville: true,
      quartier: true,
    },
  });

  if (!bien) return;

  // Envoyer à chaque utilisateur concerné
  for (const alert of alerts) {
    // Vérifier si le bien correspond aux critères de l'alerte
    const correspond = (
      (!normalize(alert.typeLogement) || normalize(alert.typeLogement) === normalize(bien.typeLogement?.nom)) &&
      (!normalize(alert.typeTransaction) || normalize(alert.typeTransaction) === normalize(bien.typeTransaction?.nom)) &&
      (!normalize(alert.ville) || normalize(alert.ville) === normalize(bien.ville)) &&
      (!normalize(alert.quartier) || normalize(alert.quartier) === normalize(bien.quartier)) &&
      (!alert.prixMin || (bien.prix && bien.prix >= alert.prixMin)) &&
      (!alert.prixMax || (bien.prix && bien.prix <= alert.prixMax))
    );

    if (correspond) {
      const payload: PropertyAlertPayload = {
        alerteId: alert.id,
        telephone: alert.telephone,
        bienId,
        titre: bien.titre || "",
        typeLogement: bien.typeLogement?.nom || "",
        typeTransaction: bien.typeTransaction?.nom || "",
        prix: bien.prix || 0,
        localisation: `${bien.ville || ""}, ${bien.quartier || ""}`,
      };
      
      io.to(`alerts:${alert.telephone}`).emit(WebSocketEvents.NEW_PROPERTY_ALERT, payload);
    }
  }
};

/**
 * Émet une mise à jour de bail (créer, terminer, résilier, archiver, paiement)
 */
export const emitBailUpdated = (proprietaireId: string, bienId: string): void => {
  if (!io) return;
  io.to(`owner:${proprietaireId}`).emit(WebSocketEvents.BAIL_UPDATED, { proprietaireId, bienId });
};

/**
 * Émet une mise à jour d'un bien (statut changé)
 */
export const emitBienUpdated = (proprietaireId: string, bienId: string): void => {
  if (!io) return;
  io.to(`owner:${proprietaireId}`).emit(WebSocketEvents.BIEN_UPDATED, { proprietaireId, bienId });
  io.to("admin").emit(WebSocketEvents.BIEN_UPDATED, { proprietaireId, bienId });
};

/**
 * Émet un nouveau signalement aux admins
 */
export const emitSignalementNew = (bienId: string): void => {
  if (!io) return;
  io.to("admin").emit(WebSocketEvents.SIGNALEMENT_NEW, { bienId });
};

/**
 * Émet une mise à jour de signalement (validé ou rejeté) aux admins et au propriétaire
 */
export const emitSignalementUpdated = (bienId: string, proprietaireId?: string): void => {
  if (!io) return;
  io.to("admin").emit(WebSocketEvents.SIGNALEMENT_UPDATED, { bienId });
  if (proprietaireId) {
    io.to(`owner:${proprietaireId}`).emit(WebSocketEvents.SIGNALEMENT_UPDATED, { bienId });
  }
};

/**
 * Émet une notification de nouvelle vérification aux administrateurs
 */
export const emitVerificationSubmitted = async (proprietaireId: string): Promise<void> => {
  if (!io) return;
  
  const { prisma } = await import("../config/database.js");
  
  // Récupérer les infos du propriétaire
  const proprietaire = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    include: { verification: true },
  });

  if (!proprietaire) return;

  // Compter le nombre de vérifications en attente
  const pendingCount = await prisma.proprietaire.count({
    where: { statutVerification: "PENDING" },
  });

  const payload: VerificationSubmittedPayload = {
    proprietaireId: proprietaire.id,
    prenom: proprietaire.prenom,
    nom: proprietaire.nom,
    telephone: proprietaire.telephone,
    typePiece: proprietaire.verification?.typePiece || "CNI",
    createdAt: new Date().toISOString(),
  };

  // Émettre aux admins
  io.to("admin").emit(WebSocketEvents.VERIFICATION_SUBMITTED, payload);
  
  // Mettre à jour le compteur
  io.to("admin").emit(WebSocketEvents.VERIFICATION_COUNT_UPDATE, { count: pendingCount });
};

/**
 * Émet une notification d'un nouveau feedback reçu aux administrateurs
 */
export const emitFeedbackSubmitted = (): void => {
  if (!io) return;
  io.to("admin").emit(WebSocketEvents.FEEDBACK_SUBMITTED, {});
};

/**
 * Émet une notification d'un nouveau témoignage reçu aux administrateurs
 */
export const emitTemoignageSubmitted = (): void => {
  if (!io) return;
  io.to("admin").emit(WebSocketEvents.TEMOIGNAGE_SUBMITTED, {});
};
