import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import axios from "axios";
import { forgotPasswordApi } from "@/api/ownerAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/FormField";
import { ErreurServeur, OwnerAuthLayout } from "@/components/owner/OwnerAuthLayout";

// Demande de lien de réinitialisation du mot de passe propriétaire.

export default function ForgotPassword() {
  const [identifiant, setIdentifiant] = useState("");
  const [erreurChamp, setErreurChamp] = useState<string | undefined>();
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifiant.trim()) {
      setErreurChamp("Saisissez le téléphone ou l'adresse e-mail de votre compte.");
      return;
    }
    setErreurChamp(undefined);
    setErreur(null);
    setEnvoi(true);
    try {
      await forgotPasswordApi(identifiant.trim());
      setEnvoye(true);
    } catch (err) {
      setErreur(
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "La demande n'a pas abouti. Vérifiez votre connexion puis réessayez.",
      );
    } finally {
      setEnvoi(false);
    }
  };

  if (envoye) {
    return (
      <OwnerAuthLayout titre="Vérifiez vos messages" retour={{ to: "/owner/login", label: "Connexion" }}>
        <div className="flex items-start gap-3 rounded-card bg-baobab-100 p-5 text-encre">
          <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-baobab" />
          <p className="text-body-l">
            Si un compte correspond à <strong>{identifiant.trim()}</strong>, un lien de réinitialisation vient d'être envoyé.
            Il est valable pendant une durée limitée.
          </p>
        </div>
        <Button asChild className="mt-6 w-full">
          <Link to="/owner/login">Retour à la connexion</Link>
        </Button>
      </OwnerAuthLayout>
    );
  }

  return (
    <OwnerAuthLayout
      titre="Mot de passe oublié"
      sousTitre="Indiquez le téléphone ou l'e-mail de votre compte : nous vous envoyons un lien pour en choisir un nouveau."
      retour={{ to: "/owner/login", label: "Connexion" }}
    >
      <form onSubmit={envoyer} noValidate className="space-y-5">
        <FormField label="Téléphone ou adresse e-mail" error={erreurChamp}>
          <Input
            value={identifiant}
            autoComplete="username"
            placeholder="77 123 45 67 ou prenom@exemple.com"
            onChange={(e) => setIdentifiant(e.target.value)}
          />
        </FormField>
        <ErreurServeur message={erreur} />
        <Button type="submit" disabled={envoi} className="w-full">
          {envoi ? "Envoi…" : "Recevoir le lien"}
        </Button>
      </form>
    </OwnerAuthLayout>
  );
}
