import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import axios from "axios";
import { resetPasswordLocataireApi } from "@/api/locataireAuth";
import { LocataireAuthLayout } from "@/components/locataire/LocataireAuthLayout";
import { ErreurServeur } from "@/components/owner/OwnerAuthLayout";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/button";

const LONGUEUR_MIN = 6;
const RETOUR_CONNEXION = { to: "/locataire/login", label: "Connexion" };

export default function LocataireResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [erreurs, setErreurs] = useState<{ password?: string; confirm?: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : "Ce lien est incomplet. Demandez un nouveau lien de réinitialisation.");

  const validerPassword = () =>
    password.length < LONGUEUR_MIN ? `Le mot de passe doit contenir au moins ${LONGUEUR_MIN} caractères.` : undefined;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nouvellesErreurs = {
      password: validerPassword(),
      confirm: password !== confirm ? "Les deux mots de passe ne sont pas identiques." : undefined,
    };
    setErreurs(nouvellesErreurs);
    if (nouvellesErreurs.password || nouvellesErreurs.confirm || !token) return;
    setError(null);
    setLoading(true);
    try {
      await resetPasswordLocataireApi(token, password);
      setSuccess(true);
    } catch (err) {
      setError(
        axios.isAxiosError(err) && err.response?.data?.message
          ? (err.response.data.message as string)
          : "Une erreur est survenue. Le lien a peut-être expiré.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <LocataireAuthLayout titre="Mot de passe modifié" retour={RETOUR_CONNEXION}>
        <div className="flex items-start gap-3 rounded-card bg-baobab-100 p-5 text-body-l text-encre">
          <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-baobab" />
          <p>Votre nouveau mot de passe est enregistré. Vous pouvez vous connecter.</p>
        </div>
        <Button asChild className="mt-6 w-full">
          <Link to="/locataire/login">Se connecter</Link>
        </Button>
      </LocataireAuthLayout>
    );
  }

  return (
    <LocataireAuthLayout titre="Nouveau mot de passe" sousTitre="Choisissez le mot de passe de votre espace locataire." retour={RETOUR_CONNEXION}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField label="Nouveau mot de passe" help={`${LONGUEUR_MIN} caractères minimum`} error={erreurs.password}>
          <PasswordInput
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onBlur={() => setErreurs((e) => ({ ...e, password: validerPassword() }))}
          />
        </FormField>
        <FormField label="Confirmer le mot de passe" error={erreurs.confirm}>
          <PasswordInput autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        </FormField>
        <ErreurServeur message={error} />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
        </Button>
      </form>
    </LocataireAuthLayout>
  );
}
