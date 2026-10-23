import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePasswordApi } from "@/api/comptePublicAuth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";

const MOT_DE_PASSE_MIN = 6;

type Erreurs = Partial<Record<"actuel" | "nouveau" | "confirmation", string>>;

export function MotDePasseForm() {
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreurs, setErreurs] = useState<Erreurs>({});

  const mutation = useMutation({
    mutationFn: () => changePasswordApi({ currentPassword: actuel, newPassword: nouveau }),
    onSuccess: () => {
      toast("Mot de passe modifié.");
      setActuel("");
      setNouveau("");
      setConfirmation("");
    },
    onError: () => setErreurs({ actuel: "Le mot de passe actuel est incorrect, ou la connexion a échoué. Réessayez." }),
  });

  const enregistrer = (event: React.FormEvent) => {
    event.preventDefault();
    const suivantes: Erreurs = {
      actuel: actuel ? undefined : "Indiquez votre mot de passe actuel.",
      nouveau: nouveau.length >= MOT_DE_PASSE_MIN ? undefined : `Choisissez ${MOT_DE_PASSE_MIN} caractères au moins.`,
      confirmation: confirmation === nouveau ? undefined : "Les deux nouveaux mots de passe ne sont pas identiques.",
    };
    setErreurs(suivantes);
    if (!suivantes.actuel && !suivantes.nouveau && !suivantes.confirmation) mutation.mutate();
  };

  return (
    <form noValidate onSubmit={enregistrer} className="space-y-5">
      <h2 className="text-h3 font-bold text-encre">Changer de mot de passe</h2>
      <FormField label="Mot de passe actuel" error={erreurs.actuel}>
        <PasswordInput value={actuel} onChange={(e) => setActuel(e.target.value)} autoComplete="current-password" />
      </FormField>
      <FormField label="Nouveau mot de passe" help="6 caractères au moins." error={erreurs.nouveau}>
        <PasswordInput value={nouveau} onChange={(e) => setNouveau(e.target.value)} autoComplete="new-password" />
      </FormField>
      <FormField label="Confirmez le nouveau mot de passe" error={erreurs.confirmation}>
        <PasswordInput value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" />
      </FormField>
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 aria-hidden className="animate-spin" />}
        {mutation.isPending ? "Enregistrement…" : "Changer le mot de passe"}
      </Button>
    </form>
  );
}
