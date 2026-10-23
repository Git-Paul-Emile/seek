import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import type { Bien } from "@/api/bien";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/FieldError";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Textarea } from "@/components/ui/textarea";
import { formatFcfa, libelleFrequence, NO_BREAK_SPACE } from "@/lib/fcfa";
import { referenceBien } from "@/lib/referenceBien";
import { Initiales } from "../table/Tableau";
import { controlerAnnonce } from "./controlesAnnonce";
import { STATUT_ANNONCE } from "./useModerationAnnonces";

// Panneau de décision (charte, planche 41) : l'annonce, son propriétaire, les contrôles
// automatiques, puis la note au propriétaire, obligatoire en cas de rejet.

const VERIFICATION_PROPRIETAIRE = {
  VERIFIED: { label: "Vérifié", tone: "positif" },
  PENDING: { label: "À vérifier", tone: "attente" },
  REJECTED: { label: "Refusé", tone: "alerte" },
  NOT_VERIFIED: { label: "Non vérifié", tone: "neutre" },
} as const;

interface PanneauDecisionProps {
  annonce: Bien;
  enCours: boolean;
  onDecider: (action: "APPROUVER" | "REJETER", note: string) => void;
}

function caracteristiques(annonce: Bien) {
  const frequence = libelleFrequence(annonce.frequencePaiement);
  const nbPhotos = annonce.photos.length;
  return [
    frequence ? `/ ${frequence}` : null,
    nbPhotos ? `${nbPhotos}${NO_BREAK_SPACE}photo${nbPhotos > 1 ? "s" : ""}` : null,
    annonce.nbChambres ? `${annonce.nbChambres}${NO_BREAK_SPACE}ch.` : null,
    annonce.surface ? `${annonce.surface}${NO_BREAK_SPACE}m²` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function PanneauDecision({ annonce, enCours, onDecider }: PanneauDecisionProps) {
  const [note, setNote] = useState(annonce.noteAdmin ?? "");
  const [erreur, setErreur] = useState<string>();
  const idNote = useId();
  const enAttente = annonce.statutAnnonce === "EN_ATTENTE";
  const statut = STATUT_ANNONCE[annonce.statutAnnonce];
  const proprietaire = annonce.proprietaire;
  const verification = proprietaire?.statutVerification ? VERIFICATION_PROPRIETAIRE[proprietaire.statutVerification] : null;
  const lieu = [annonce.quartier, annonce.ville].filter(Boolean).join(", ");

  const rejeter = () => {
    if (!note.trim()) {
      setErreur("Expliquez au propriétaire ce qu'il doit corriger avant de rejeter.");
      return;
    }
    setErreur(undefined);
    onDecider("REJETER", note);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <span className="font-mono text-ref text-texte2">SK-{referenceBien(annonce.id)}</span>
        <Link to={`/admin/annonces/${annonce.id}`} className="text-body-m font-semibold text-baobab hover:underline">
          Voir la fiche complète
        </Link>
      </div>

      <div className="aspect-[4/3] overflow-hidden rounded-card bg-surface">
        {annonce.photos[0] ? (
          <img src={annonce.photos[0]} alt="" className="size-full object-cover" />
        ) : (
          <PropertyIllustration kind={illustrationForType(annonce.typeLogement?.slug ?? annonce.typeLogement?.nom)} />
        )}
      </div>

      <div>
        <h2 className="font-display text-h3 font-bold text-encre">
          {annonce.titre || "Annonce sans titre"}
          {lieu ? `, ${lieu}` : ""}
        </h2>
        <p className="mt-1 text-body-m text-texte2">
          {annonce.prix ? <span className="text-price font-bold text-encre">{formatFcfa(annonce.prix)} </span> : null}
          {caracteristiques(annonce)}
        </p>
        {!enAttente && (
          <StatusBadge tone={statut.tone} className="mt-3">
            {statut.label}
          </StatusBadge>
        )}
      </div>

      {proprietaire && (
        <div className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-card bg-surface p-4">
          <Initiales prenom={proprietaire.prenom} nom={proprietaire.nom} />
          <div className="min-w-0">
            <p className="text-title font-semibold text-encre">
              {proprietaire.prenom} {proprietaire.nom}
            </p>
            <p className="text-body-m tabular-nums text-texte2">{proprietaire.telephone}</p>
            {verification && (
              <StatusBadge tone={verification.tone} size="sm" className="mt-2">
                {verification.label}
              </StatusBadge>
            )}
          </div>
        </div>
      )}

      <ul aria-label="Contrôles automatiques" className="space-y-2">
        {controlerAnnonce(annonce).map(({ ok, libelle }) => (
          <li key={libelle} className={ok ? "flex items-start gap-3 text-body-m text-encre" : "flex items-start gap-3 text-body-m font-semibold text-encre"}>
            {ok ? (
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-baobab" />
            ) : (
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 fill-soleil text-encre" />
            )}
            <span>
              <span className="sr-only">{ok ? "Conforme : " : "À vérifier : "}</span>
              {libelle}
            </span>
          </li>
        ))}
      </ul>

      {enAttente ? (
        <>
          <div>
            <label htmlFor={idNote} className="mb-2 block text-body-m font-semibold text-encre">
              Note au propriétaire
            </label>
            <Textarea
              id={idNote}
              value={note}
              aria-invalid={Boolean(erreur)}
              aria-describedby={`${idNote}-aide`}
              onChange={(event) => {
                setNote(event.target.value);
                setErreur(undefined);
              }}
            />
            {erreur ? (
              <FieldError id={`${idNote}-aide`}>{erreur}</FieldError>
            ) : (
              <p id={`${idNote}-aide`} className="mt-2 text-caption text-texte2">
                Obligatoire en cas de rejet. Le propriétaire la reçoit avec la décision.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={rejeter} disabled={enCours}>
              Rejeter
            </Button>
            <Button onClick={() => onDecider("APPROUVER", note)} disabled={enCours}>
              {enCours && <Loader2 aria-hidden className="animate-spin" />}
              Valider
            </Button>
          </div>
        </>
      ) : (
        annonce.noteAdmin && (
          <div className="rounded-card bg-surface p-4">
            <p className="text-body-m font-semibold text-encre">Note envoyée au propriétaire</p>
            <p className="mt-1 text-body-m text-texte2">{annonce.noteAdmin}</p>
          </div>
        )
      )}
    </div>
  );
}
