import cron from "node-cron";
import { prisma } from "../config/database.js";
import { envoyerRappelLoyer, envoyerNotification } from "./notification.service.js";
import { emitBailUpdated } from "./socket.service.js";

export const initCronJobs = () => {
  // Planification quotidienne à 08:00
  cron.schedule("0 8 * * *", async () => {
    try {
      console.log("[CRON] Début de la vérification des rappels de loyers...");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Récupérer toutes les échéances impayées
      const echeances = await prisma.echeancierLoyer.findMany({
        where: {
          statut: { in: ["EN_ATTENTE", "EN_RETARD"] },
        },
        include: {
          bail: {
            include: {
              locataire: true,
              bien: true,
            },
          },
        },
      });

      let nbRappels = 0;

      for (const echeance of echeances) {
        if (!echeance.bail.locataire.telephone) continue;

        const dateEcheance = new Date(echeance.dateEcheance);
        dateEcheance.setHours(0, 0, 0, 0);

        const diffTime = dateEcheance.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let shouldSend = false;

        // Condition 1: 1 semaine (7 jours) avant l'échéance
        if (diffDays === 7) {
          shouldSend = true;
        }

        // Condition 2: le jour même de l'échéance
        if (diffDays === 0) {
          shouldSend = true;
        }

        // Condition 3: Le premier jour du mois de l'échéance
        if (
          today.getDate() === 1 &&
          today.getMonth() === dateEcheance.getMonth() &&
          today.getFullYear() === dateEcheance.getFullYear()
        ) {
          // Eviter un envoi en double si le 1er du mois correspond déjà à J-7 ou Jour J
          if (diffDays !== 7 && diffDays !== 0) {
            shouldSend = true;
          }
        }

        if (shouldSend) {
          await envoyerRappelLoyer({
            locataireTelephone: echeance.bail.locataire.telephone,
            locataireEmail: echeance.bail.locataire.email,
            locataireNom: `${echeance.bail.locataire.prenom} ${echeance.bail.locataire.nom}`,
            montant: echeance.montant,
            dateEcheance: echeance.dateEcheance.toISOString(),
            bienTitre: echeance.bail.bien.titre,
            echeanceId: echeance.id,
            bailId: echeance.bailId,
            bienId: echeance.bienId,
            proprietaireId: echeance.proprietaireId,
            locataireId: echeance.locataireId,
          });
          nbRappels++;
          console.log(`[CRON] Rappel envoyé pour l'échéance ${echeance.id}`);
        }
      }

      console.log(`[CRON] Fin de la vérification. ${nbRappels} rappel(s) envoyé(s).`);
    } catch (err) {
      console.error("[CRON] Erreur lors de l'exécution des rappels de loyers:", err);
    }
  });

  // Auto-archivage quotidien à 01:00 — Bails TERMINE/RESILIE depuis plus de 30 jours
  cron.schedule("0 1 * * *", async () => {
    try {
      console.log("[CRON] Archivage automatique des anciens bails...");
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const bails = await prisma.bailLocation.findMany({
        where: {
          statut: { in: ["TERMINE", "RESILIE"] },
          updatedAt: { lte: cutoff },
        },
        select: { id: true, locataireId: true, proprietaireId: true, bienId: true },
      });

      for (const bail of bails) {
        await prisma.bailLocation.update({
          where: { id: bail.id },
          data: { statut: "ARCHIVE" },
        });
        await prisma.locataire.update({
          where: { id: bail.locataireId },
          data: { statut: "ANCIEN" },
        });
        emitBailUpdated(bail.proprietaireId, bail.bienId);
      }

      console.log(`[CRON] Archivage : ${bails.length} bail(s) archivé(s).`);
    } catch (err) {
      console.error("[CRON] Erreur archivage bails :", err);
    }
  });

  // Auto-terminaison quotidienne à 01:00 — Bails ACTIF/EN_PREAVIS dont dateFin est dépassée
  cron.schedule("5 1 * * *", async () => {
    try {
      console.log("[CRON] Terminaison automatique des bails expirés...");
      const now = new Date();

      const bails = await prisma.bailLocation.findMany({
        where: {
          statut: { in: ["ACTIF", "EN_PREAVIS"] },
          dateFinBail: { lte: now },
        },
        select: { id: true, proprietaireId: true, bienId: true },
      });

      if (bails.length === 0) {
        console.log("[CRON] Aucun bail expiré à terminer.");
        return;
      }

      // Récupérer l'ID du statut "libre"
      const statutLibre = await prisma.statutBien.findFirst({ where: { slug: "libre" } });
      if (!statutLibre) {
        console.error("[CRON] Statut 'libre' introuvable — terminaison annulée.");
        return;
      }

      for (const bail of bails) {
        await prisma.bailLocation.update({
          where: { id: bail.id },
          data: { statut: "TERMINE" },
        });
        await prisma.bien.update({
          where: { id: bail.bienId },
          data: { statutBienId: statutLibre.id },
        });
        emitBailUpdated(bail.proprietaireId, bail.bienId);
      }

      console.log(`[CRON] Terminaison : ${bails.length} bail(s) terminé(s).`);
    } catch (err) {
      console.error("[CRON] Erreur terminaison bails :", err);
    }
  });

  // Notification fin de mise en avant J-1 (09:30) — in-app + email uniquement
  cron.schedule("30 9 * * *", async () => {
    try {
      console.log("[CRON] Vérification des mises en avant expirant demain...");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const start = new Date(tomorrow);
      start.setHours(0, 0, 0, 0);
      const end = new Date(tomorrow);
      end.setHours(23, 59, 59, 999);

      const biens = await prisma.bien.findMany({
        where: {
          estMisEnAvant: true,
          dateFinPromotion: { gte: start, lte: end },
          statutAnnonce: "PUBLIE",
          actif: true,
        },
        include: {
          proprietaire: {
            select: { id: true, prenom: true, telephone: true, email: true },
          },
        },
      });

      for (const bien of biens) {
        const owner = bien.proprietaire;
        if (!owner?.telephone) continue;

        const titre = bien.titre ?? "votre annonce";
        const contenu = `Bonjour ${owner.prenom},\n\nVotre mise en avant pour l'annonce "${titre}" expire demain. Rendez-vous sur votre espace pour la renouveler et continuer à booster votre visibilité.\n\n— SEEK Immobilier`;

        await envoyerNotification({
          type: "ALERTE",
          target: "owner",
          telephone: owner.telephone,
          email: owner.email,
          sujet: "Votre mise en avant expire demain",
          contenu,
          bienId: bien.id,
          proprietaireId: owner.id,
          emailOnly: true,
        });

        console.log(`[CRON] Notif fin mise en avant envoyée pour bien ${bien.id}`);
      }

      console.log(`[CRON] Fin mises en avant : ${biens.length} notif(s) envoyée(s).`);
    } catch (err) {
      console.error("[CRON] Erreur notif fin mise en avant :", err);
    }
  });

  // Purge quotidienne à 03:00 — VueBien (>90j) et Notification (>180j)
  cron.schedule("0 3 * * *", async () => {
    try {
      const cutoffVues = new Date();
      cutoffVues.setDate(cutoffVues.getDate() - 90);

      const cutoffNotifs = new Date();
      cutoffNotifs.setDate(cutoffNotifs.getDate() - 180);

      const [deletedVues, deletedNotifs] = await Promise.all([
        prisma.vueBien.deleteMany({ where: { createdAt: { lt: cutoffVues } } }),
        prisma.notification.deleteMany({ where: { createdAt: { lt: cutoffNotifs } } }),
      ]);

      console.log(`[CRON] Purge : ${deletedVues.count} vues (>90j), ${deletedNotifs.count} notifications (>180j) supprimées.`);
    } catch (err) {
      console.error("[CRON] Erreur lors de la purge :", err);
    }
  });
};
