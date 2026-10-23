import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { FormField } from "@/components/ui/FormField";
import { ErreurServeur, OwnerAuthLayout } from "@/components/owner/OwnerAuthLayout";

const OWNER_PENDING_OTP_KEY = "ownerPendingOtp";

// ─── Schéma Zod ───────────────────────────────────────────────────────────────

const schema = z.object({
  identifiant: z
    .string()
    .min(1, "Saisissez votre téléphone ou votre adresse e-mail."),
  password: z
    .string()
    .min(1, "Saisissez votre mot de passe."),
});

type FormData = z.infer<typeof schema>;

// ─── Résolution des erreurs serveur ──────────────────────────────────────────

function resolveServerError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  }
  if (!err.response) {
    return "Impossible de joindre le serveur. Vérifiez votre connexion.";
  }
  const status = err.response.status;
  switch (status) {
    case 401:
      return "Identifiant ou mot de passe incorrect.";
    case 429:
      return "Trop de tentatives. Veuillez patienter avant de réessayer.";
    case 500:
    case 502:
    case 503:
      return "Le serveur rencontre un problème. Veuillez réessayer dans quelques instants.";
    default:
      return (err.response.data?.message as string | undefined) ?? "Une erreur est survenue. Veuillez réessayer.";
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OwnerLogin() {
  const navigate = useNavigate();
  const { login } = useOwnerAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const owner = await login(data.identifiant, data.password);
      if (!owner.telephoneVerifie) {
        sessionStorage.setItem(
          OWNER_PENDING_OTP_KEY,
          JSON.stringify({
            proprietaireId: owner.id,
            prenom: owner.prenom,
            telephone: owner.telephone,
          })
        );
        navigate("/owner/verify-phone", { replace: true });
        return;
      }
      navigate("/owner/dashboard", { replace: true });
    } catch (err) {
      setServerError(resolveServerError(err));
    }
  };

  return (
    <OwnerAuthLayout titre="Connexion" sousTitre="Retrouvez vos biens, vos locataires et vos loyers.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField label="Téléphone ou adresse e-mail" error={errors.identifiant?.message}>
          <Input type="text" inputMode="email" autoComplete="username" placeholder="77 123 45 67 ou prenom@exemple.com" {...register("identifiant")} />
        </FormField>
        <FormField label="Mot de passe" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...register("password")} />
        </FormField>
        <div className="text-right">
          <Link to="/owner/forgot-password" className="text-body-m font-semibold text-baobab hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <ErreurServeur message={serverError} />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </Button>
        <p className="text-center text-body-m text-texte2">
          Pas encore de compte ?{" "}
          <Link to="/owner/register" className="font-semibold text-baobab hover:underline">
            Créer un compte propriétaire
          </Link>
        </p>
      </form>
    </OwnerAuthLayout>
  );
}
