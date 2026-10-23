import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createTemoignage } from "@/api/temoignage";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/FieldError";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Dépôt d'un témoignage : publié seulement après validation par l'équipe (modération admin).

const LONGUEUR_MIN = 20;

interface Erreurs {
  nom?: string;
  temoignage?: string;
}

export function TemoignageDialog() {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [profession, setProfession] = useState("");
  const [temoignage, setTemoignage] = useState("");
  const [erreurs, setErreurs] = useState<Erreurs>({});

  const mutation = useMutation({
    mutationFn: createTemoignage,
    onSuccess: () => {
      toast("Merci. Votre témoignage sera publié après validation par notre équipe.");
      setNom("");
      setProfession("");
      setTemoignage("");
      setOpen(false);
    },
    onError: () => {
      toast("Votre témoignage n'a pas été envoyé. Vérifiez votre connexion, puis réessayez.");
    },
  });

  const valider = (): Erreurs => ({
    nom: nom.trim() ? undefined : "Indiquez votre nom, il s'affichera sous votre témoignage.",
    temoignage:
      temoignage.trim().length >= LONGUEUR_MIN
        ? undefined
        : `Racontez votre expérience en ${LONGUEUR_MIN} caractères au moins.`,
  });

  const envoyer = (event: React.FormEvent) => {
    event.preventDefault();
    const resultat = valider();
    setErreurs(resultat);
    if (resultat.nom || resultat.temoignage) return;
    mutation.mutate({
      nom: nom.trim(),
      profession: profession.trim() || undefined,
      temoignage: temoignage.trim(),
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="link">Partager votre expérience</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-encre/50" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[61] max-h-[90dvh] overflow-y-auto rounded-t-sheet bg-white p-6 shadow-float focus:outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-sheet">
          <div className="grid grid-cols-[1fr_auto] items-start gap-4">
            <Dialog.Title className="text-h3 font-bold text-encre">Partager votre expérience</Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fermer"
                className="-m-2 flex size-12 items-center justify-center rounded-control hover:bg-surface"
              >
                <X aria-hidden className="size-5" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-body-m text-texte2">
            Il sera publié sur l'accueil après validation par notre équipe.
          </Dialog.Description>
          <form onSubmit={envoyer} noValidate className="mt-6 space-y-5">
            <div>
              <label htmlFor="temoignage-nom" className="mb-2 block text-body-m font-semibold text-encre">
                Votre nom
              </label>
              <Input
                id="temoignage-nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                onBlur={() => setErreurs((prev) => ({ ...prev, nom: valider().nom }))}
                aria-invalid={Boolean(erreurs.nom)}
                aria-describedby={erreurs.nom ? "temoignage-nom-erreur" : undefined}
                autoComplete="name"
              />
              {erreurs.nom && <FieldError id="temoignage-nom-erreur">{erreurs.nom}</FieldError>}
            </div>
            <div>
              <label htmlFor="temoignage-profession" className="mb-2 block text-body-m font-semibold text-encre">
                Profession et ville <span className="font-normal text-texte2">(facultatif)</span>
              </label>
              <Input id="temoignage-profession" value={profession} onChange={(e) => setProfession(e.target.value)} />
            </div>
            <div>
              <label htmlFor="temoignage-texte" className="mb-2 block text-body-m font-semibold text-encre">
                Votre témoignage
              </label>
              <Textarea
                id="temoignage-texte"
                value={temoignage}
                onChange={(e) => setTemoignage(e.target.value)}
                onBlur={() => setErreurs((prev) => ({ ...prev, temoignage: valider().temoignage }))}
                aria-invalid={Boolean(erreurs.temoignage)}
                aria-describedby={erreurs.temoignage ? "temoignage-texte-erreur" : undefined}
              />
              {erreurs.temoignage && <FieldError id="temoignage-texte-erreur">{erreurs.temoignage}</FieldError>}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 aria-hidden className="animate-spin" />}
              {mutation.isPending ? "Envoi en cours…" : "Envoyer mon témoignage"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
