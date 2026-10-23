import { io, type Socket } from "socket.io-client";

// URL du serveur — même base que l'API REST
const SOCKET_URL = (() => {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  return apiUrl ?? "http://localhost:8000";
})();

// ─── Types d'événements (miroir du backend WebSocketEvents) ──────────────────

export const SOCKET_EVENTS = {
  NOTIFICATION_NEW:          "notification:new",
  BADGE_UPDATE:              "badge:update",
  TRANSACTION_STATUS:        "transaction:status",
  PAYMENT_CONFIRMED:         "payment:confirmed",
  PAYMENT_FAILED:            "payment:failed",
  STATS_UPDATE:              "stats:update",
  NEW_PROPERTY_ALERT:        "property:new",
  VERIFICATION_SUBMITTED:    "verification:submitted",
  VERIFICATION_COUNT_UPDATE: "verification:count",

  // Bail & Bien
  BAIL_UPDATED:        "bail:updated",
  BIEN_UPDATED:        "bien:updated",

  // Signalements
  SIGNALEMENT_NEW:     "signalement:new",
  SIGNALEMENT_UPDATED: "signalement:updated",

  // Retour Client
  FEEDBACK_SUBMITTED:   "feedback:submitted",
  TEMOIGNAGE_SUBMITTED: "temoignage:submitted",
} as const;

// ─── Payloads ─────────────────────────────────────────────────────────────────

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

export interface VerificationCountPayload {
  count: number;
}

export interface BailUpdatedPayload {
  proprietaireId: string;
  bienId: string;
}

export interface SignalementPayload {
  bienId: string;
}

export interface PropertyAlertPayload {
  alerteId: string;
  telephone: string;
  bienId: string;
  titre: string;
  typeTransaction: string;
  prix: number;
  localisation: string;
}

// ─── Type helpers ─────────────────────────────────────────────────────────────

type EventMap = {
  [SOCKET_EVENTS.NOTIFICATION_NEW]: NotificationPayload;
  [SOCKET_EVENTS.BADGE_UPDATE]: BadgeUpdatePayload;
  [SOCKET_EVENTS.TRANSACTION_STATUS]: TransactionStatusPayload;
  [SOCKET_EVENTS.PAYMENT_CONFIRMED]: TransactionStatusPayload;
  [SOCKET_EVENTS.PAYMENT_FAILED]: TransactionStatusPayload;
  [SOCKET_EVENTS.STATS_UPDATE]: Record<string, unknown>;
  [SOCKET_EVENTS.NEW_PROPERTY_ALERT]: PropertyAlertPayload;
  [SOCKET_EVENTS.VERIFICATION_SUBMITTED]: Record<string, unknown>;
  [SOCKET_EVENTS.VERIFICATION_COUNT_UPDATE]: VerificationCountPayload;
  [SOCKET_EVENTS.BAIL_UPDATED]: BailUpdatedPayload;
  [SOCKET_EVENTS.BIEN_UPDATED]: BailUpdatedPayload;
  [SOCKET_EVENTS.SIGNALEMENT_NEW]: SignalementPayload;
  [SOCKET_EVENTS.SIGNALEMENT_UPDATED]: SignalementPayload;
  [SOCKET_EVENTS.FEEDBACK_SUBMITTED]: Record<string, unknown>;
  [SOCKET_EVENTS.TEMOIGNAGE_SUBMITTED]: Record<string, unknown>;
};

type Unsubscribe = () => void;

// ─── Classe SocketService ─────────────────────────────────────────────────────

class SocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, Set<(data: unknown) => void>>();
  private rooms = new Set<string>();

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      this.restoreRooms();
      this.notify("_connected", true);
    });
    this.socket.on("disconnect", () => this.notify("_connected", false));

    // Mapper tous les événements métier
    (Object.values(SOCKET_EVENTS) as string[]).forEach((event) => {
      this.socket!.on(event, (data: unknown) => this.notify(event, data));
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.rooms.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ─── Rejoindre les rooms ───────────────────────────────────────────────────

  joinOwner(proprietaireId: string): void {
    this.joinRoom(`owner:${proprietaireId}`, "join:owner", proprietaireId);
  }

  leaveOwner(proprietaireId: string): void {
    this.leaveRoom(`owner:${proprietaireId}`, "leave:owner", proprietaireId);
  }

  joinLocataire(locataireId: string): void {
    this.joinRoom(`locataire:${locataireId}`, "join:locataire", locataireId);
  }

  leaveLocataire(locataireId: string): void {
    this.leaveRoom(`locataire:${locataireId}`, "leave:locataire", locataireId);
  }

  joinAdmin(): void {
    this.joinRoom("admin", "join:admin");
  }

  leaveAdmin(): void {
    this.leaveRoom("admin", "leave:admin");
  }

  joinAlerts(telephone: string): void {
    this.joinRoom(`alerts:${telephone}`, "join:alerts", telephone);
  }

  leaveAlerts(telephone: string): void {
    this.leaveRoom(`alerts:${telephone}`, "leave:alerts", telephone);
  }

  // ─── Abonnements typés ────────────────────────────────────────────────────

  on<E extends keyof EventMap>(event: E, cb: (data: EventMap[E]) => void): Unsubscribe {
    return this.addListener(event as string, cb as (data: unknown) => void);
  }

  onConnected(cb: (connected: boolean) => void): Unsubscribe {
    return this.addListener("_connected", cb as (data: unknown) => void);
  }

  // ─── Privé ────────────────────────────────────────────────────────────────

  private addListener(event: string, cb: (data: unknown) => void): Unsubscribe {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)?.delete(cb);
  }

  private notify(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  private joinRoom(room: string, event: string, value?: string): void {
    this.rooms.add(room);
    if (this.socket?.connected) this.socket.emit(event, value);
  }

  private leaveRoom(room: string, event: string, value?: string): void {
    this.rooms.delete(room);
    if (this.socket?.connected) this.socket.emit(event, value);
  }

  private restoreRooms(): void {
    if (!this.socket?.connected) return;

    for (const room of this.rooms) {
      if (room === "admin") {
        this.socket.emit("join:admin");
      } else if (room.startsWith("owner:")) {
        this.socket.emit("join:owner", room.slice("owner:".length));
      } else if (room.startsWith("locataire:")) {
        this.socket.emit("join:locataire", room.slice("locataire:".length));
      } else if (room.startsWith("alerts:")) {
        this.socket.emit("join:alerts", room.slice("alerts:".length));
      }
    }
  }
}

// Singleton partagé dans toute l'app
export const socketService = new SocketService();
