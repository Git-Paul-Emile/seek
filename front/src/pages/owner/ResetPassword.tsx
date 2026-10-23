import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { resetPasswordApi } from "@/api/ownerAuth";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { FormField } from "@/components/ui/FormField";
import { ErreurServeur, OwnerAuthLayout } from "@/components/owner/OwnerAuthLayout";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!token) {
      setError("Lien invalide. Demandez un nouveau lien de réinitialisation.");
      return;
    }
    setLoading(true);
    try {
      await resetPasswordApi(token, password);
      setSuccess(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Une erreur est survenue. Le lien est peut-être expiré.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <OwnerAuthLayout titre="Mot de passe modifié" retour={{ to: "/owner/login", label: "Connexion" }}>
        <p className="rounded-card bg-baobab-100 p-5 text-body-l text-encre">
          Votre nouveau mot de passe est enregistré. Connectez-vous avec celui-ci.
        </p>
        <Button className="mt-6 w-full" onClick={() => navigate("/owner/login")}>
          Se connecter
        </Button>
      </OwnerAuthLayout>
    );
  }

  return (
    <OwnerAuthLayout titre="Nouveau mot de passe" sousTitre="Choisissez un mot de passe d'au moins 8 caractères." retour={{ to: "/owner/forgot-password", label: "Nouveau lien" }}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField label="Nouveau mot de passe">
          <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormField>
        <FormField label="Confirmer le mot de passe">
          <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </FormField>
        <ErreurServeur message={error || null} />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
        </Button>
      </form>
    </OwnerAuthLayout>
  );
}
