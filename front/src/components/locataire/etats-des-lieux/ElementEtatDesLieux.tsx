import { useId, useState } from "react";
import { Loader2, MessageSquareWarning, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { uploadEtatLieuxImageLocataire, type ElementEtatDesLieux as Element, type EtatElement } from "@/api/etatDesLieux.api";
import type { ContestationElement } from "@/hooks/useEtatsDesLieuxLocataire";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Un élément d'une pièce (mur, sol, prise…) avec son état, ses photos et, si besoin,
// la contestation du locataire : un motif et une photo de contre-preuve, tous deux obligatoires.

const ETATS: Record<EtatElement, { label: string; tone: StatusTone }> = {
  NEUF: { label: "Neuf", tone: "positif" },
  BON: { label: "Bon état", tone: "positif" },
  USAGE: { label: "Usagé", tone: "neutre" },
  MAUVAIS: { label: "Mauvais état", tone: "attente" },
  DEGRADE: { label: "Dégradé", tone: "alerte" },
};

const MENTIONS_PROPRIETAIRE: Partial<Record<NonNullable<Element["statutContestation"]>, string>> = {
  RECTIFIE: "Rectifié par le propriétaire",
  RESERVE: "Réserve notée par le propriétaire",
  REFUSE: "Contestation refusée",
};

function FormulaireContestation({ onAjouter, onAnnuler }: { onAjouter: (motif: string, photo: string) => void; onAnnuler: () => void }) {
  const [motif, setMotif] = useState("");
  const [photo, setPhoto] = useState("");
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const [erreurs, setErreurs] = useState<{ motif?: string; photo?: string }>({});
  const idErreurPhoto = useId();

  const choisirPhoto = async (fichier?: File) => {
    if (!fichier) return;
    setEnvoiPhoto(true);
    try {
      setPhoto(await uploadEtatLieuxImageLocataire(fichier));
      setErreurs((e) => ({ ...e, photo: undefined }));
    } catch {
      toast.error("La photo n'a pas pu être envoyée. Réessayez.");
    } finally {
      setEnvoiPhoto(false);
    }
  };

  const ajouter = () => {
    const nouvelles = {
      motif: motif.trim() ? undefined : "Décrivez ce qui ne correspond pas.",
      photo: photo ? undefined : "Ajoutez une photo qui montre l'état réel.",
    };
    setErreurs(nouvelles);
    if (!nouvelles.motif && !nouvelles.photo) onAjouter(motif.trim(), photo);
  };

  return (
    <div className="mt-4 space-y-4 rounded-control bg-soleil-100 p-4">
      <FormField label="Motif du désaccord" error={erreurs.motif}>
        <Textarea value={motif} onChange={(event) => setMotif(event.target.value)} placeholder="Une tache d'humidité est visible au bas du mur." />
      </FormField>
      <div>
        <p className="mb-2 text-body-m font-semibold text-encre">Photo de contre-preuve</p>
        <div className="flex items-center gap-3">
          <label
            className={cn(
              "flex h-24 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed bg-white text-body-m font-medium text-baobab",
              erreurs.photo ? "border-encre" : "border-bord-champ",
            )}
          >
            {envoiPhoto ? <Loader2 aria-hidden className="size-5 animate-spin" /> : <Upload aria-hidden className="size-5" />}
            {envoiPhoto ? "Envoi de la photo…" : "Choisir une photo"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={envoiPhoto}
              aria-describedby={erreurs.photo ? idErreurPhoto : undefined}
              onChange={(event) => choisirPhoto(event.target.files?.[0])}
            />
          </label>
          {photo && <img src={photo} alt="Photo de contre-preuve" className="size-24 rounded-control object-cover" />}
        </div>
        {erreurs.photo && <FieldError id={idErreurPhoto}>{erreurs.photo}</FieldError>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={onAnnuler}>
          Annuler
        </Button>
        <Button variant="encre" onClick={ajouter} disabled={envoiPhoto}>
          Ajouter la contestation
        </Button>
      </div>
    </div>
  );
}

interface ElementEtatDesLieuxProps {
  element: Element;
  peutContester: boolean;
  contestationLocale?: ContestationElement;
  onContester: (contestation: ContestationElement) => void;
  onRetirer: () => void;
}

export function ElementEtatDesLieux({ element, peutContester, contestationLocale, onContester, onRetirer }: ElementEtatDesLieuxProps) {
  const [formulaire, setFormulaire] = useState(false);
  const etat = ETATS[element.etat] ?? { label: element.etat, tone: "neutre" as const };
  const mention = element.statutContestation ? MENTIONS_PROPRIETAIRE[element.statutContestation] : undefined;
  const conteste = element.estConteste || contestationLocale;

  return (
    <li className={cn("py-4", conteste && "-mx-4 bg-soleil-100/50 px-4 lg:-mx-6 lg:px-6")}>
      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="text-title font-semibold text-encre">{element.nom}</p>
          {mention && <p className="mt-1 text-body-m font-semibold text-encre">{mention}</p>}
        </div>
        <StatusBadge tone={etat.tone} size="sm">
          {etat.label}
        </StatusBadge>
      </div>
      {element.commentaire && <p className="mt-2 text-body-m text-texte2">{element.commentaire}</p>}
      {element.photos && element.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {element.photos.map((photo) => (
            <img key={photo} src={photo} alt={`Photo : ${element.nom}`} className="size-20 rounded-control object-cover" crossOrigin="anonymous" />
          ))}
        </div>
      )}
      {element.estConteste && (
        <div className="mt-3 rounded-control bg-soleil-100 p-3 text-body-m text-encre">
          <p className="font-semibold">Votre contestation</p>
          <p className="mt-1">{element.motifContestation}</p>
          {element.photoContestation && (
            <img src={element.photoContestation} alt="Photo de contre-preuve" className="mt-2 size-20 rounded-control object-cover" crossOrigin="anonymous" />
          )}
        </div>
      )}
      {contestationLocale && (
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 rounded-control bg-soleil-100 p-3 text-body-m text-encre">
          <div>
            <p className="font-semibold">Contestation à envoyer</p>
            <p className="mt-1">{contestationLocale.motifContestation}</p>
            <img src={contestationLocale.photoContestation} alt="Photo de contre-preuve" className="mt-2 size-20 rounded-control object-cover" />
          </div>
          <button
            type="button"
            onClick={onRetirer}
            aria-label={`Retirer la contestation : ${element.nom}`}
            className="flex size-10 items-center justify-center rounded-control hover:bg-soleil/40"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
      )}
      {peutContester && !conteste && !formulaire && element.id && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setFormulaire(true)}>
          <MessageSquareWarning aria-hidden />
          Contester
        </Button>
      )}
      {formulaire && element.id && (
        <FormulaireContestation
          onAnnuler={() => setFormulaire(false)}
          onAjouter={(motifContestation, photoContestation) => {
            onContester({ elementId: element.id as string, motifContestation, photoContestation });
            setFormulaire(false);
          }}
        />
      )}
    </li>
  );
}
