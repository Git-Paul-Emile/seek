/**
 * File d'attente simple en mémoire pour les notifications (SMS + email).
 *
 * Chaque tâche est exécutée en arrière-plan via setImmediate / process.nextTick
 * afin de ne pas bloquer la réponse HTTP.
 *
 * Usage :
 *   import { enqueueNotif } from "./notifQueue.service.js";
 *   enqueueNotif(async () => { await sendSms(phone, msg); });
 */

type NotifTask = () => Promise<unknown>;

const queue: NotifTask[] = [];
let processing = false;

async function drainQueue(): Promise<void> {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const task = queue.shift()!;
    try {
      await task();
    } catch (err) {
      console.error("[NotifQueue] Erreur lors de l'exécution d'une tâche :", err);
    }
  }

  processing = false;
}

/**
 * Ajoute une tâche à la file et démarre le traitement en arrière-plan
 * (non-bloquant pour l'appelant).
 */
export const enqueueNotif = (task: NotifTask): void => {
  queue.push(task);
  // setImmediate différera le traitement après l'achèvement du cycle d'événements courant
  setImmediate(() => {
    drainQueue().catch((err) =>
      console.error("[NotifQueue] Erreur drain :", err)
    );
  });
};
