import { readFile, rm } from "node:fs/promises";
import { UnrecoverableError, Worker, type Job } from "bullmq";
import { creerConnexionRedis } from "../config/redis.js";
import { AppError } from "../utils/AppError.js";
import * as CloudinaryService from "./cloudinary.service.js";
import { getLogoFiligraneBuffer } from "./configSite.service.js";
import * as BienService from "./bien.service.js";
import * as BienRepository from "../repositories/bien.repository.js";
import {
  NOM_FILE_MEDIAS_BIEN,
  PREFIXE_ERREUR_METIER,
  type ProgressionTraitement,
  type TraitementMediasData,
} from "./mediasBien.queue.js";

/**
 * Worker de la file « medias-bien ». Pour chaque job :
 *  1. envoie chaque photo (optimisée, avec filigrane), puis la vidéo, sous une clé stable ;
 *  2. ajoute les URL au bien (un rejeu remplace, ne duplique pas) ;
 *  3. soumet l'annonce si le propriétaire l'a demandé et qu'elle ne l'est pas déjà.
 * Les fichiers temporaires sont supprimés une fois le job terminé ou en échec définitif.
 */

const CONCURRENCE = 2;
const DOSSIER_PHOTOS = "seek/biens";
const DOSSIER_VIDEOS = "seek/biens/videos";

const STATUTS_DEJA_SOUMIS = new Set(["EN_ATTENTE", "PUBLIE"]);

const supprimerFichiers = async ({ photos, video }: TraitementMediasData) => {
  const chemins = [...photos, ...(video ? [video] : [])].map((f) => f.chemin);
  await Promise.all(chemins.map((chemin) => rm(chemin, { force: true })));
};

/** Une erreur métier (4xx) ne se corrige pas en réessayant : le job échoue sans nouvel essai. */
const commeErreurDefinitive = (erreur: unknown) =>
  erreur instanceof AppError && erreur.statusCode < 500
    ? new UnrecoverableError(`${PREFIXE_ERREUR_METIER}${erreur.message}`)
    : erreur;

const traiter = async (job: Job<TraitementMediasData>) => {
  const { bienId, proprietaireId, photos, video, soumettre } = job.data;
  const total = photos.length + (video ? 1 : 0) + (soumettre ? 1 : 0);
  let faits = 0;
  const avancer = (etape: ProgressionTraitement["etape"]) =>
    job.updateProgress({ etape, faits, total } satisfies ProgressionTraitement);

  try {
    const bien = await BienRepository.getBienById(bienId);
    if (!bien) throw new UnrecoverableError(`${PREFIXE_ERREUR_METIER}Le bien a été supprimé entre-temps.`);

    const logo = photos.length > 0 ? await getLogoFiligraneBuffer() : null;
    const photosEnvoyees: { cle: string; url: string }[] = [];
    await avancer("photos");
    for (const photo of photos) {
      const { url } = await CloudinaryService.uploadImage(await readFile(photo.chemin), DOSSIER_PHOTOS, undefined, logo, photo.cle);
      photosEnvoyees.push({ cle: photo.cle, url });
      faits += 1;
      await avancer("photos");
    }

    let videoEnvoyee: { cle: string; url: string } | null = null;
    if (video) {
      await avancer("video");
      const { url } = await CloudinaryService.uploadVideo(await readFile(video.chemin), DOSSIER_VIDEOS, video.cle);
      videoEnvoyee = { cle: video.cle, url };
      faits += 1;
      await avancer("video");
    }

    await BienService.ajouterMediasTraites(bienId, photosEnvoyees, videoEnvoyee);

    if (soumettre) {
      await avancer("soumission");
      const aJour = await BienRepository.getBienById(bienId);
      // Rejeu après une soumission réussie : ne pas soumettre deux fois.
      if (aJour && !STATUTS_DEJA_SOUMIS.has(aJour.statutAnnonce)) {
        await BienService.soumettreAnnonce(bienId, proprietaireId);
      }
      faits += 1;
      await avancer("soumission");
    }

    return { bienId };
  } catch (erreur) {
    throw commeErreurDefinitive(erreur);
  }
};

let worker: Worker<TraitementMediasData> | null = null;

export const demarrerWorkerMedias = () => {
  if (worker) return worker;
  worker = new Worker<TraitementMediasData>(NOM_FILE_MEDIAS_BIEN, traiter, {
    connection: creerConnexionRedis(),
    concurrency: CONCURRENCE,
  });

  worker.on("completed", (job) => {
    supprimerFichiers(job.data).catch(() => null);
  });

  worker.on("failed", (job, erreur) => {
    if (!job) return;
    const definitif = erreur instanceof UnrecoverableError || job.attemptsMade >= (job.opts.attempts ?? 1);
    if (!definitif) {
      console.warn(`[medias-bien] essai ${job.attemptsMade} échoué pour le bien ${job.data.bienId} : ${erreur.message}`);
      return;
    }
    // Échec définitif : le job reste dans la file des échecs (7 jours) pour examen.
    console.error(`[medias-bien] ÉCHEC DÉFINITIF du job ${job.id} (bien ${job.data.bienId}) : ${erreur.message}`);
    supprimerFichiers(job.data).catch(() => null);
  });

  worker.on("error", (erreur) => {
    console.error("[medias-bien] erreur du worker :", erreur.message);
  });

  console.log("📦 Worker de la file medias-bien démarré");
  return worker;
};

export const arreterWorkerMedias = async () => {
  await worker?.close();
  worker = null;
};
