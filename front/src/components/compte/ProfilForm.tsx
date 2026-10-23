import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateComptePublicApi, type ComptePublic } from "@/api/comptePublicAuth";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";

// Informations personnelles du compte visiteur. Le téléphone sert d'identifiant : non modifiable.

export function ProfilForm({ compte }: { compte: ComptePublic }) {
  const { setCompte } = useComptePublicAuth();
  const [prenom, setPrenom] = useState(compte.prenom);
  const [nom, setNom] = useState(compte.nom);
  const [email, setEmail] = useState(compte.email ?? "");
  const [erreurs, setErreurs] = useState<{ prenom?: string; nom?: string; envoi?: string }>({});

  useEffect(() => {
    setPrenom(compte.prenom);
    setNom(compte.nom);
    setEmail(compte.email ?? "");
  }, [compte]);

  const mutation = useMutation({
    mutationFn: () => updateComptePublicApi({ nom: nom.trim(), prenom: prenom.trim(), email: email.trim() || null }),
    onSuccess: (misAJour) => {
      setCompte(misAJour);
      toast("Profil enregistré.");
    },
    onError: () => setErreurs({ envoi: "Le profil n'a pas été enregistré. Vérifiez votre connexion, puis réessayez." }),
  });

  const enregistrer = (event: React.FormEvent) => {
    event.preventDefault();
    const suivantes = {
      prenom: prenom.trim() ? undefined : "Indiquez votre prénom.",
      nom: nom.trim() ? undefined : "Indiquez votre nom.",
    };
    setErreurs(suivantes);
    if (!suivantes.prenom && !suivantes.nom) mutation.mutate();
  };

  return (
    <form noValidate onSubmit={enregistrer} className="space-y-5">
      <h2 className="text-h3 font-bold text-encre">Informations personnelles</h2>
      <FormField label="Téléphone" help="Votre identifiant de connexion, il ne peut pas être changé.">
        <Input value={compte.telephone} readOnly disabled />
      </FormField>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Prénom" error={erreurs.prenom}>
          <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} autoComplete="given-name" />
        </FormField>
        <FormField label="Nom" error={erreurs.nom}>
          <Input value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="family-name" />
        </FormField>
      </div>
      <FormField label="E-mail" hint="(facultatif)">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </FormField>
      {erreurs.envoi && <FieldError id="profil-erreur">{erreurs.envoi}</FieldError>}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 aria-hidden className="animate-spin" />}
        {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
