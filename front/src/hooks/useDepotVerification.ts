import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

// Dépôt des pièces de la vérification d'identité : choix de la pièce, photos, envoi.
// Commun au locataire (revu par son propriétaire) et au propriétaire (revu par Seek) :
// chaque espace fournit son envoi de photo, sa soumission et son message de réussite.

export type TypePieceVerification = "CNI" | "PASSEPORT";
export type DocumentVerification = "recto" | "verso" | "selfie";

const FORMATS_ACCEPTES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const TAILLE_MAX_MO = 5;
const TAILLE_MAX = TAILLE_MAX_MO * 1024 * 1024;
const HTTP_NON_AUTORISE = 401;
const HTTP_TROP_VOLUMINEUX = 413;

export interface Fichier {
  file: File;
  apercu: string;
}

type Erreurs = Partial<Record<DocumentVerification | "conditions", string>>;

export interface PiecesVerification {
  typePiece: TypePieceVerification;
  pieceIdentiteRecto: string;
  pieceIdentiteVerso?: string;
  selfie: string;
  conditionsAcceptees: boolean;
}

interface OptionsDepot {
  /** Envoie une photo et renvoie son URL. */
  televerser: (file: File) => Promise<string>;
  soumettre: (pieces: PiecesVerification) => Promise<unknown>;
  messageSucces: string;
}

export function useDepotVerification({ televerser, soumettre, messageSucces }: OptionsDepot) {
  const [typePiece, setTypePiece] = useState<TypePieceVerification>("CNI");
  const [fichiers, setFichiers] = useState<Partial<Record<DocumentVerification, Fichier>>>({});
  const [conditionsAcceptees, setConditionsAcceptees] = useState(false);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const versoRequis = typePiece === "CNI";

  // Libère les aperçus créés par URL.createObjectURL quand la page se ferme.
  const fichiersCourants = useRef(fichiers);
  fichiersCourants.current = fichiers;
  useEffect(
    () => () => Object.values(fichiersCourants.current).forEach((fichier) => fichier && URL.revokeObjectURL(fichier.apercu)),
    [],
  );

  const choisirFichier = (document: DocumentVerification, liste: FileList | null) => {
    const file = liste?.[0];
    if (!file) return;
    if (!FORMATS_ACCEPTES.includes(file.type)) {
      setErreurs((e) => ({ ...e, [document]: "Format non pris en charge : choisissez une photo JPG, PNG ou WebP." }));
      return;
    }
    if (file.size > TAILLE_MAX) {
      setErreurs((e) => ({ ...e, [document]: `La photo dépasse ${TAILLE_MAX_MO} Mo : choisissez une image plus légère.` }));
      return;
    }
    const precedent = fichiers[document];
    if (precedent) URL.revokeObjectURL(precedent.apercu);
    setFichiers((f) => ({ ...f, [document]: { file, apercu: URL.createObjectURL(file) } }));
    setErreurs((e) => ({ ...e, [document]: undefined }));
  };

  const retirerFichier = (document: DocumentVerification) => {
    const fichier = fichiers[document];
    if (fichier) URL.revokeObjectURL(fichier.apercu);
    setFichiers((f) => ({ ...f, [document]: undefined }));
  };

  const accepterConditions = (valeur: boolean) => {
    setConditionsAcceptees(valeur);
    setErreurs((e) => ({ ...e, conditions: undefined }));
  };

  const valider = () => {
    const nouvelles: Erreurs = {};
    if (!fichiers.recto) nouvelles.recto = "Ajoutez la photo de la face avant de la pièce.";
    if (versoRequis && !fichiers.verso) nouvelles.verso = "Ajoutez la photo du verso de la carte d'identité.";
    if (!fichiers.selfie) nouvelles.selfie = "Ajoutez un selfie où vous tenez la pièce.";
    if (!conditionsAcceptees) nouvelles.conditions = "Cochez la case pour accepter les conditions de vérification.";
    setErreurs(nouvelles);
    return Object.keys(nouvelles).length === 0;
  };

  const envoyer = async () => {
    if (!valider() || !fichiers.recto || !fichiers.selfie) return;
    setEnvoiEnCours(true);
    try {
      const recto = await televerser(fichiers.recto.file);
      const verso = versoRequis && fichiers.verso ? await televerser(fichiers.verso.file) : undefined;
      const selfie = await televerser(fichiers.selfie.file);
      await soumettre({ typePiece, pieceIdentiteRecto: recto, pieceIdentiteVerso: verso, selfie, conditionsAcceptees });
      toast.success(messageSucces);
      Object.values(fichiers).forEach((fichier) => fichier && URL.revokeObjectURL(fichier.apercu));
      setFichiers({});
      setConditionsAcceptees(false);
    } catch (error) {
      const statut = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (statut === HTTP_NON_AUTORISE) toast.error("Votre session a expiré. Reconnectez-vous puis réessayez.");
      else if (statut === HTTP_TROP_VOLUMINEUX) toast.error(`Une photo dépasse ${TAILLE_MAX_MO} Mo : choisissez une image plus légère.`);
      else toast.error("L'envoi des documents a échoué. Réessayez dans un instant.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return {
    typePiece,
    setTypePiece,
    versoRequis,
    fichiers,
    choisirFichier,
    retirerFichier,
    conditionsAcceptees,
    accepterConditions,
    erreurs,
    envoiEnCours,
    envoyer,
  };
}
