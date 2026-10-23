import { useId } from "react";
import { CreditCard, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import type { StatutVerificationLocataire } from "@/api/locataire";
import { useCancelLocataireVerification, useSubmitLocataireVerification } from "@/hooks/useLocataireVerification";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/FieldError";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { TuileDocument } from "@/components/ui/TuileDocument";
import { cn } from "@/lib/utils";
import { uploadLocataireVerificationImageApi } from "@/api/locataireAuth";
import { useDepotVerification, type DocumentVerification, type TypePieceVerification } from "@/hooks/useDepotVerification";

// Vérification d'identité du locataire : revue par son propriétaire (pas par Seek).

const STATUTS: Record<StatutVerificationLocataire, { label: string; tone: StatusTone; texte: string }> = {
  NOT_VERIFIED: {
    label: "Non vérifiée",
    tone: "neutre",
    texte: "Envoyez une photo de votre pièce et un selfie : votre propriétaire les vérifie avant de confirmer votre dossier.",
  },
  PENDING: { label: "En attente", tone: "attente", texte: "Votre propriétaire examine vos documents. Vous serez notifié de sa décision." },
  VERIFIED: { label: "Vérifiée", tone: "positif", texte: "Votre identité a été vérifiée par votre propriétaire." },
  REJECTED: { label: "Refusée", tone: "alerte", texte: "Vos documents n'ont pas été acceptés. Corrigez-les et renvoyez-les." },
};

const PIECES: { value: TypePieceVerification; label: string }[] = [
  { value: "CNI", label: "Carte d'identité" },
  { value: "PASSEPORT", label: "Passeport" },
];

function FormulaireDepot() {
  const soumettre = useSubmitLocataireVerification();
  const depot = useDepotVerification({
    televerser: uploadLocataireVerificationImageApi,
    soumettre: (pieces) => soumettre.mutateAsync(pieces),
    messageSucces: "Documents envoyés. Votre propriétaire va les vérifier.",
  });
  const idErreurConditions = useId();
  const tuile = (document: DocumentVerification) => ({
    fichier: depot.fichiers[document],
    erreur: depot.erreurs[document],
    onChoisir: (liste: FileList | null) => depot.choisirFichier(document, liste),
    onRetirer: () => depot.retirerFichier(document),
  });

  return (
    <div className="mt-6 space-y-5 border-t border-filet pt-6">
      <fieldset>
        <legend className="mb-3 text-body-m font-semibold text-encre">Pièce d'identité</legend>
        <div className="grid grid-cols-2 gap-3">
          {PIECES.map(({ value, label }) => {
            const choisi = depot.typePiece === value;
            return (
              <label
                key={value}
                className={cn(
                  "flex min-h-12 cursor-pointer items-center gap-3 rounded-control border px-3",
                  choisi ? "border-2 border-baobab bg-baobab-100 px-[11px] text-baobab" : "border-filet text-encre",
                )}
              >
                <input
                  type="radio"
                  name="type-piece"
                  checked={choisi}
                  onChange={() => depot.setTypePiece(value)}
                  className="size-5 accent-baobab"
                />
                <CreditCard aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />
                <span className="text-body-m font-semibold">{label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <TuileDocument libelle={depot.versoRequis ? "Recto de la carte" : "Page d'identité du passeport"} {...tuile("recto")} />
        {depot.versoRequis && <TuileDocument libelle="Verso de la carte" {...tuile("verso")} />}
        <TuileDocument libelle="Selfie avec la pièce" selfie {...tuile("selfie")} />
      </div>
      <div>
        <label className="flex cursor-pointer items-start gap-3 text-body-m text-encre">
          <input
            type="checkbox"
            checked={depot.conditionsAcceptees}
            onChange={(event) => depot.accepterConditions(event.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-baobab"
          />
          J'accepte que mon propriétaire consulte ces documents pour vérifier mon identité.
        </label>
        {depot.erreurs.conditions && <FieldError id={idErreurConditions}>{depot.erreurs.conditions}</FieldError>}
      </div>
      <Button className="w-full" onClick={depot.envoyer} disabled={depot.envoiEnCours}>
        {depot.envoiEnCours ? <Loader2 aria-hidden className="animate-spin" /> : <Upload aria-hidden />}
        {depot.envoiEnCours ? "Envoi des documents…" : "Envoyer pour vérification"}
      </Button>
    </div>
  );
}

interface VerificationIdentiteProps {
  statut: StatutVerificationLocataire;
  motifRejet?: string | null;
}

export function VerificationIdentite({ statut, motifRejet }: VerificationIdentiteProps) {
  const annuler = useCancelLocataireVerification();
  const { label, tone, texte } = STATUTS[statut];
  const peutDeposer = statut === "NOT_VERIFIED" || statut === "REJECTED";

  const annulerDemande = () =>
    annuler.mutate(undefined, {
      onSuccess: () => toast.success("Demande annulée. Vous pouvez modifier vos informations."),
      onError: () => toast.error("La demande n'a pas pu être annulée. Réessayez."),
    });

  return (
    <section aria-labelledby="titre-verification" className="rounded-card bg-white p-5 lg:p-6">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <h2 id="titre-verification" className="font-display text-h3 font-bold text-encre">
          Vérification d'identité
        </h2>
        <StatusBadge tone={tone}>{label}</StatusBadge>
      </div>
      <p className="mt-3 text-body-m text-texte2">{texte}</p>
      {statut === "REJECTED" && motifRejet && (
        <p className="mt-4 rounded-control bg-soleil-100 p-4 text-body-m text-encre">
          <span className="font-semibold">Motif : </span>
          {motifRejet}
        </p>
      )}
      {statut === "PENDING" && (
        <Button variant="outline" className="mt-4 w-full" onClick={annulerDemande} disabled={annuler.isPending}>
          {annuler.isPending && <Loader2 aria-hidden className="animate-spin" />}
          Annuler la demande
        </Button>
      )}
      {peutDeposer && <FormulaireDepot />}
    </section>
  );
}
