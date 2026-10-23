import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { deleteComptePublicApi } from "@/api/comptePublicAuth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";

// Suppression définitive du compte visiteur : confirmation dans une fenêtre, mot de passe exigé.

export function SuppressionCompte() {
  const { logout } = useComptePublicAuth();
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState<string>();

  const mutation = useMutation({
    mutationFn: () => deleteComptePublicApi(motDePasse),
    onSuccess: async () => {
      toast("Votre compte a été supprimé.");
      await logout();
      navigate("/");
    },
    onError: () => setErreur("Le mot de passe est incorrect, ou la connexion a échoué. Réessayez."),
  });

  return (
    <section className="space-y-4">
      <h2 className="text-h3 font-bold text-encre">Supprimer mon compte</h2>
      <p className="text-body-l text-texte2">
        Vos favoris et vos alertes SMS seront effacés. Cette action ne peut pas être annulée.
      </p>
      <Button variant="outline" onClick={() => setOuvert(true)}>
        Supprimer mon compte
      </Button>

      <SheetDialog
        open={ouvert}
        onOpenChange={setOuvert}
        title="Supprimer définitivement votre compte ?"
        description="Vos favoris et vos alertes seront effacés. Saisissez votre mot de passe pour confirmer."
      >
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (!motDePasse) {
              setErreur("Saisissez votre mot de passe pour confirmer.");
              return;
            }
            mutation.mutate();
          }}
          className="space-y-5"
        >
          <p className="flex items-start gap-3 rounded-card border-2 border-encre p-4 text-body-m font-semibold text-encre">
            <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 fill-soleil" />
            Cette action est définitive.
          </p>
          <FormField label="Mot de passe" error={erreur}>
            <PasswordInput value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoComplete="current-password" />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={() => setOuvert(false)}>
              Garder mon compte
            </Button>
            <Button type="submit" variant="encre" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 aria-hidden className="animate-spin" />}
              {mutation.isPending ? "Suppression…" : "Supprimer"}
            </Button>
          </div>
        </form>
      </SheetDialog>
    </section>
  );
}
