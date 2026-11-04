import { Queue } from "bullmq";
import { creerConnexionRedis } from "../config/redis.js";

/**
 * File « medias-bien » : envoi des photos (filigrane compris) et de la vidéo d'une annonce
 * vers le stockage, puis soumission éventuelle, après la réponse HTTP.
 *
 *  - 3 essais, délai doublé à chaque essai (5 s, 10 s) ;
 *  - un job en échec définitif est conservé 7 jours : c'est la file des échecs à examiner ;
 *  - chaque fichier porte une clé stable : rejouer un job écrase ses fichiers au lieu de
 *    les dupliquer (voir mediasBien.worker.ts).
 */

export const NOM_FILE_MEDIAS_BIEN = "medias-bien";

export interface FichierMedia {
  /** Chemin du fichier temporaire sur le disque du serveur. */
  chemin: string;
  /** Identifiant stable du fichier chez le fournisseur de stockage. */
  cle: string;
}

export interface TraitementMediasData {
  bienId: string;
  proprietaireId: string;
  photos: FichierMedia[];
  video: FichierMedia | null;
  /** Soumettre l'annonce à la modération une fois les médias enregistrés. */
  soumettre: boolean;
}

export type EtapeTraitement = "photos" | "video" | "soumission";

export interface ProgressionTraitement {
  etape: EtapeTraitement;
  faits: number;
  total: number;
}

export type EtatTraitement = "en_attente" | "en_cours" | "termine" | "echec";

/**
 * Préfixe des erreurs métier (champ manquant, annonce non soumettable...) : seules celles-ci
 * sont montrées au propriétaire ; une erreur technique reste un message générique.
 */
export const PREFIXE_ERREUR_METIER = "METIER:";
const ERREUR_GENERIQUE = "Les photos ou la vidéo n'ont pas pu être enregistrées après plusieurs essais.";

const messageEchec = (raison: string | undefined) =>
  raison?.startsWith(PREFIXE_ERREUR_METIER) ? raison.slice(PREFIXE_ERREUR_METIER.length) : ERREUR_GENERIQUE;

let file: Queue<TraitementMediasData> | null = null;

/** Création paresseuse : aucune connexion Redis tant qu'aucun média n'est envoyé. */
export const getFileMediasBien = (): Queue<TraitementMediasData> => {
  file ??= new Queue<TraitementMediasData>(NOM_FILE_MEDIAS_BIEN, {
    connection: creerConnexionRedis(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { age: 24 * 3600 },
      removeOnFail: { age: 7 * 24 * 3600 },
    },
  });
  return file;
};

export const planifierTraitementMedias = async (data: TraitementMediasData): Promise<string> => {
  const job = await getFileMediasBien().add("traiter", data);
  if (!job.id) throw new Error("Le traitement des médias n'a pas pu être planifié");
  return job.id;
};

const ETATS: Record<string, EtatTraitement> = {
  waiting: "en_attente",
  delayed: "en_attente",
  prioritized: "en_attente",
  "waiting-children": "en_attente",
  active: "en_cours",
  completed: "termine",
  failed: "echec",
};

/** État d'un traitement, ou null s'il n'existe pas ou n'appartient pas à ce propriétaire. */
export const lireEtatTraitement = async (traitementId: string, proprietaireId: string) => {
  const job = await getFileMediasBien().getJob(traitementId);
  if (!job || job.data.proprietaireId !== proprietaireId) return null;
  const etatBrut = await job.getState();
  const etat: EtatTraitement = ETATS[etatBrut] ?? "en_attente";
  const progression = typeof job.progress === "object" ? (job.progress as unknown as ProgressionTraitement) : null;
  return {
    id: traitementId,
    bienId: job.data.bienId,
    etat,
    progression,
    soumettre: job.data.soumettre,
    // Une nouvelle tentative est prévue : l'échec n'est pas encore définitif.
    nouvelleTentative: etat === "en_attente" && job.attemptsMade > 0,
    erreur: etat === "echec" ? messageEchec(job.failedReason) : null,
  };
};
