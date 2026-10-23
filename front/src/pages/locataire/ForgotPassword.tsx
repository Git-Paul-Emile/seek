import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import axios from "axios";
import { forgotPasswordLocataireApi } from "@/api/locataireAuth";
import { LocataireAuthLayout } from "@/components/locataire/LocataireAuthLayout";
import { ErreurServeur } from "@/components/owner/OwnerAuthLayout";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const RETOUR_CONNEXION = { to: "/locataire/login", label: "Connexion" };

export default function LocataireForgotPassword() {
  const [identifiant, setIdentifiant] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [erreurChamp, setErreurChamp] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!identifiant.trim()) {
      setErreurChamp("Saisissez votre numéro de téléphone ou votre adresse e-mail.");
      return;
    }
    setErreurChamp(undefined);
    setError(null);
    setLoading(true);
    try {
      await forgotPasswordLocataireApi(identifiant.trim());
      setSent(true);
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.message
          ? (err.response.data.message as string)
          : "Une erreur est survenue. Réessayez.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <LocataireAuthLayout titre="Vérifiez vos e-mails" retour={RETOUR_CONNEXION}>
        <div className="flex items-start gap-3 rounded-card bg-baobab-100 p-5 text-body-l text-encre">
          <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-baobab" />
          <p>Si ce compte existe et possède une adresse e-mail, un lien de réinitialisation vient d'y être envoyé.</p>
        </div>
        <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/locataire/login">Retour à la connexion</Link>
        </Button>
      </LocataireAuthLayout>
    );
  }

  return (
    <LocataireAuthLayout
      titre="Mot de passe oublié"
      sousTitre="Indiquez votre téléphone ou votre e-mail : nous vous envoyons un lien pour choisir un nouveau mot de passe."
      retour={RETOUR_CONNEXION}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField label="Téléphone ou adresse e-mail" error={erreurChamp}>
          <Input
            type="text"
            inputMode="email"
            autoComplete="username"
            value={identifiant}
            onChange={(event) => setIdentifiant(event.target.value)}
            placeholder="77 123 45 67 ou prenom@exemple.com"
          />
        </FormField>
        <ErreurServeur message={error} />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Envoi…" : "Recevoir le lien"}
        </Button>
      </form>
    </LocataireAuthLayout>
  );
}
