import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { loginLocataireApi } from "@/api/locataireAuth";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";
import { LocataireAuthLayout } from "@/components/locataire/LocataireAuthLayout";
import { ErreurServeur } from "@/components/owner/OwnerAuthLayout";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/button";

const schema = z.object({
  identifiant: z.string().min(1, "Saisissez votre numéro de téléphone ou votre adresse e-mail."),
  password: z.string().min(1, "Saisissez votre mot de passe."),
});

type FormData = z.infer<typeof schema>;

function resolveServerError(err: unknown): string {
  if (!axios.isAxiosError(err)) return "Une erreur inattendue est survenue. Réessayez.";
  if (!err.response) return "Impossible de joindre le serveur. Vérifiez votre connexion.";
  switch (err.response.status) {
    case 401:
      return "Identifiant ou mot de passe incorrect.";
    case 403:
      return (err.response.data?.message as string | undefined) ?? "Accès refusé.";
    case 429:
      return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
    case 500:
    case 502:
    case 503:
      return "Le serveur rencontre un problème. Réessayez dans quelques instants.";
    default:
      return (err.response.data?.message as string | undefined) ?? "Une erreur est survenue. Réessayez.";
  }
}

export default function LocataireLogin() {
  const navigate = useNavigate();
  const { setLocataire } = useLocataireAuth();
  const { refreshMe: refreshPublicAccount } = useComptePublicAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onTouched" });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const { locataire } = await loginLocataireApi({ identifiant: data.identifiant, password: data.password });
      setLocataire(locataire);
      await refreshPublicAccount();
      navigate("/locataire/dashboard", { replace: true });
    } catch (err) {
      setServerError(resolveServerError(err));
    }
  };

  return (
    <LocataireAuthLayout titre="Connexion" sousTitre="Retrouvez votre bail, vos loyers et vos quittances.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField label="Téléphone ou adresse e-mail" error={errors.identifiant?.message}>
          <Input type="text" inputMode="email" autoComplete="username" placeholder="77 123 45 67 ou prenom@exemple.com" {...register("identifiant")} />
        </FormField>
        <FormField label="Mot de passe" error={errors.password?.message}>
          <PasswordInput autoComplete="current-password" {...register("password")} />
        </FormField>
        <div className="text-right">
          <Link to="/locataire/forgot-password" className="text-body-m font-semibold text-baobab hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <ErreurServeur message={serverError} />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Connexion…" : "Se connecter"}
        </Button>
        <p className="text-center text-body-m text-texte2">
          Pas encore de compte ? Votre propriétaire vous envoie un lien d'activation.
        </p>
      </form>
    </LocataireAuthLayout>
  );
}
