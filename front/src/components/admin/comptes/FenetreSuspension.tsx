import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { MOTIFS_SUSPENSION_LOCATAIRE, MOTIFS_SUSPENSION_PROPRIETAIRE } from "./motifsSuspension";

// Suspension d'un compte (Suspensions, Utilisateurs) : ce que la suspension change, puis le
// motif, obligatoire, choisi dans la liste ou écrit à la main.

const AUTRE_MOTIF = "autre";

interface FenetreSuspensionProps {
  nom: string;
  proprietaire: boolean;
  enCours: boolean;
  onConfirmer: (motif: string) => void;
  onClose: () => void;
}

export function FenetreSuspension({ nom, proprietaire, enCours, onConfirmer, onClose }: FenetreSuspensionProps) {
  const [motif, setMotif] = useState("");
  const [motifLibre, setMotifLibre] = useState("");
  const [erreur, setErreur] = useState<string>();
  const idErreur = useId();
  const motifs = proprietaire ? MOTIFS_SUSPENSION_PROPRIETAIRE : MOTIFS_SUSPENSION_LOCATAIRE;

  const confirmer = () => {
    const choisi = motif === AUTRE_MOTIF ? motifLibre.trim() : motif;
    if (!choisi) {
      setErreur("Choisissez le motif de la suspension.");
      return;
    }
    setErreur(undefined);
    onConfirmer(choisi);
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && !enCours && onClose()} title={`Suspendre ${nom} ?`}>
      <p className="text-body-l text-texte2">
        {proprietaire ? "Le propriétaire ne pourra plus se connecter et ses annonces seront masquées." : "Le locataire ne pourra plus se connecter."}
      </p>
      <fieldset className="mt-5">
        <legend className="mb-3 text-body-m font-semibold text-encre">Motif</legend>
        <div className="flex flex-wrap gap-2">
          {[...motifs, AUTRE_MOTIF].map((valeur) => (
            <Chip
              key={valeur}
              size="sm"
              selected={motif === valeur}
              onClick={() => {
                setMotif(valeur);
                setErreur(undefined);
              }}
            >
              {valeur === AUTRE_MOTIF ? "Autre motif" : valeur}
            </Chip>
          ))}
        </div>
        {motif === AUTRE_MOTIF && (
          <div className="mt-4">
            <FormField label="Précisez le motif">
              <Input value={motifLibre} onChange={(event) => setMotifLibre(event.target.value)} />
            </FormField>
          </div>
        )}
        {erreur && <FieldError id={idErreur}>{erreur}</FieldError>}
      </fieldset>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={onClose} disabled={enCours}>
          Annuler
        </Button>
        <Button variant="encre" onClick={confirmer} disabled={enCours}>
          {enCours && <Loader2 aria-hidden className="animate-spin" />}
          Suspendre
        </Button>
      </div>
    </SheetDialog>
  );
}
