// ============================================================
// TYPES POUR LES CANAUX DE NOTIFICATION DU PROPRIÉTAIRE
// ============================================================

export type CanalNotification = "SMS" | "EMAIL" | "WHATSAPP";

export const CANAUX_DISPONIBLES: CanalNotification[] = ["SMS", "EMAIL", "WHATSAPP"];

export const CANAL_PAR_DEFAUT: CanalNotification = "SMS";

// Frais fixe unique pour débloquer la sélection de plusieurs canaux à la fois
export const FRAIS_CANAUX_SUPPLEMENTAIRES = 1000;

export function estCanalValide(canal: string): canal is CanalNotification {
  return (CANAUX_DISPONIBLES as string[]).includes(canal);
}
