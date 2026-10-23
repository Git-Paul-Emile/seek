import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSignalement, type MotifSignalement } from "@/api/signalement";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { Textarea } from "@/components/ui/textarea";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";
import { cn } from "@/lib/utils";

// Signalement d'une annonce : motif en cartes à choix unique (comme « Comment avez-vous payé ? »),
// coordonnées seulement si le visiteur n'a pas de compte. L'équipe examine chaque signalement.

const MOTIFS: { value: MotifSignalement; label: string; detail: string }[] = [
  { value: "ARNAQUE", label: "Arnaque ou fraude", detail: "Paiement demandé avant visite, faux propriétaire" },
  { value: "FAUSSES_INFOS", label: "Informations fausses", detail: "Prix, photos ou surface trompeurs" },
  { value: "INDISPONIBLE", label: "Bien plus disponible", detail: "Déjà loué ou vendu" },
  { value: "DOUBLON", label: "Annonce en double", detail: "Le même bien publié plusieurs fois" },
  { value: "INAPPROPRIE", label: "Contenu inapproprié", detail: "Texte ou image choquant" },
  { value: "AUTRE", label: "Autre raison", detail: "Précisez dans le message" },
];

interface SignalementModalProps {
  bien: { id: string; titre?: string | null };
  onClose: () => void;
}

export default function SignalementModal({ bien, onClose }: SignalementModalProps) {
  const { compte } = useComptePublicAuth();
  const [motif, setMotif] = useState<MotifSignalement>("ARNAQUE");
  const [commentaire, setCommentaire] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [erreurs, setErreurs] = useState<{ nom?: string; telephone?: string; envoi?: string }>({});

  useEffect(() => {
    if (!compte) return;
    setNom(`${compte.prenom} ${compte.nom}`);
    setTelephone(compte.telephone ?? "");
  }, [compte]);

  const mutation = useMutation({
    mutationFn: () => createSignalement({ bienId: bien.id, motif, commentaire, nom, telephone }),
    onSuccess: () => {
      toast("Merci. Notre équipe va examiner cette annonce.");
      onClose();
    },
    onError: () => setErreurs({ envoi: "Le signalement n'a pas été envoyé. Vérifiez votre connexion, puis réessayez." }),
  });

  const envoyer = (event: React.FormEvent) => {
    event.preventDefault();
    const suivantes = {
      nom: nom.trim() ? undefined : "Indiquez votre nom.",
      telephone: telephone.trim() ? undefined : "Indiquez un numéro où l'équipe peut vous joindre.",
    };
    setErreurs(suivantes);
    if (suivantes.nom || suivantes.telephone) return;
    mutation.mutate();
  };

  return (
    <SheetDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Signaler l'annonce"
      description={`${bien.titre ?? "Cette annonce"}. Votre signalement est examiné par notre équipe.`}
    >
      <form noValidate onSubmit={envoyer} className="space-y-5">
        <fieldset>
          <legend className="mb-3 text-body-m font-semibold text-encre">Que se passe-t-il ?</legend>
          <div className="space-y-2">
            {MOTIFS.map((option) => {
              const choisi = motif === option.value;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors duration-hover",
                    choisi ? "border-2 border-baobab bg-baobab-100 p-[15px]" : "border-filet hover:bg-surface",
                  )}
                >
                  <input
                    type="radio"
                    name="motif"
                    value={option.value}
                    checked={choisi}
                    onChange={() => setMotif(option.value)}
                    className="mt-1 size-5 shrink-0 accent-baobab"
                  />
                  <span>
                    <span className={cn("block text-body-l font-semibold", choisi ? "text-baobab" : "text-encre")}>{option.label}</span>
                    <span className="block text-body-m text-texte2">{option.detail}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {!compte && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Votre nom" error={erreurs.nom}>
              <Input value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" />
            </FormField>
            <FormField label="Votre téléphone" error={erreurs.telephone}>
              <Input type="tel" inputMode="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} autoComplete="tel" />
            </FormField>
          </div>
        )}

        <FormField label="Message" hint="(facultatif)">
          <Textarea value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
        </FormField>

        {erreurs.envoi && <FieldError id="signalement-erreur">{erreurs.envoi}</FieldError>}

        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Annuler
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 aria-hidden className="animate-spin" />}
            {mutation.isPending ? "Envoi en cours…" : "Envoyer"}
          </Button>
        </div>
      </form>
    </SheetDialog>
  );
}
