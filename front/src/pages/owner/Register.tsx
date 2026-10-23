import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { registerOwnerApi } from "@/api/ownerAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { FormField } from "@/components/ui/FormField";
import { FieldError } from "@/components/ui/FieldError";
import { ErreurServeur, OwnerAuthLayout } from "@/components/owner/OwnerAuthLayout";

const OWNER_PENDING_OTP_KEY = "ownerPendingOtp";

// ─── Schéma Zod (validation 100 % front, sans validation HTML) ───────────────

const schema = z.object({
  prenom: z
    .string()
    .min(2, "Le prénom est requis (2 caractères minimum)"),
  nom: z
    .string()
    .min(2, "Le nom est requis (2 caractères minimum)"),
  sexe: z.string(),
  telephone: z
    .string()
    .min(1, "Le numéro WhatsApp est requis")
    .regex(
      /^[+]?[\d\s\-()\d]{7,}$/,
      "Format invalide - ex : 77 000 00 00 ou +221 77 000 00 00"
    ),
  email: z.string().refine(
    (v) => v === "" || z.string().email().safeParse(v).success,
    "Format email invalide - ex : prenom@email.com"
  ),
  password: z
    .string()
    .min(8, "Le mot de passe est requis (8 caractères minimum)"),
  cgu: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les CGU pour continuer" }),
  }),
  confidentialite: z.literal(true, {
    errorMap: () => ({
      message: "Vous devez accepter la politique de confidentialité pour continuer",
    }),
  }),
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
  const message = err.response.data?.message as string | undefined;

  switch (status) {
    case 409:
      return message ?? "Un compte avec ces informations existe déjà.";
    case 400:
      return message ?? "Les informations saisies sont invalides.";
    case 429:
      return "Trop de tentatives. Veuillez patienter avant de réessayer.";
    case 500:
    case 502:
    case 503:
      return "Le serveur rencontre un problème. Veuillez réessayer dans quelques instants.";
    default:
      return message ?? "Une erreur est survenue. Veuillez réessayer.";
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OwnerRegister() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { sexe: "", email: "" },
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await registerOwnerApi({
        prenom: data.prenom,
        nom: data.nom,
        sexe: data.sexe,
        telephone: data.telephone,
        email: data.email,
        password: data.password,
      });
      sessionStorage.setItem(
        OWNER_PENDING_OTP_KEY,
        JSON.stringify({
          proprietaireId: res.data.data.id,
          prenom: res.data.data.prenom,
          telephone: res.data.data.telephone,
        })
      );
      navigate("/owner/verify-phone", { replace: true });
    } catch (err) {
      setServerError(resolveServerError(err));
    }
  };

  return (
    <OwnerAuthLayout
      titre="Créer un compte propriétaire"
      sousTitre="Publiez vos biens et suivez vos loyers. Un code de vérification vous sera envoyé par SMS."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Prénom" error={errors.prenom?.message}>
            <Input autoComplete="given-name" {...register("prenom")} />
          </FormField>
          <FormField label="Nom" error={errors.nom?.message}>
            <Input autoComplete="family-name" {...register("nom")} />
          </FormField>
        </div>
        <FormField label="Sexe" hint="(facultatif)">
          <NativeSelect {...register("sexe")}>
            <option value="">Non précisé</option>
            <option value="homme">Homme</option>
            <option value="femme">Femme</option>
          </NativeSelect>
        </FormField>
        <FormField label="Numéro WhatsApp" error={errors.telephone?.message} help="Le code de vérification est envoyé à ce numéro.">
          <Input type="tel" inputMode="tel" autoComplete="tel" placeholder="77 123 45 67" {...register("telephone")} />
        </FormField>
        <FormField label="Adresse e-mail" hint="(facultatif)" error={errors.email?.message}>
          <Input type="email" autoComplete="email" placeholder="prenom@exemple.com" {...register("email")} />
        </FormField>
        <FormField label="Mot de passe" error={errors.password?.message} help="8 caractères minimum.">
          <PasswordInput autoComplete="new-password" {...register("password")} />
        </FormField>

        <fieldset className="space-y-3">
          <legend className="sr-only">Conditions</legend>
          <label className="flex cursor-pointer items-start gap-3 text-body-m text-encre">
            <input type="checkbox" {...register("cgu")} className="mt-0.5 size-5 shrink-0 accent-baobab" />
            <span>
              J'accepte les{" "}
              <Link to="/cgu" target="_blank" className="font-semibold text-baobab underline underline-offset-4">
                conditions générales d'utilisation
              </Link>
            </span>
          </label>
          {errors.cgu?.message && <FieldError id="erreur-cgu">{errors.cgu.message}</FieldError>}
          <label className="flex cursor-pointer items-start gap-3 text-body-m text-encre">
            <input type="checkbox" {...register("confidentialite")} className="mt-0.5 size-5 shrink-0 accent-baobab" />
            <span>
              J'accepte la{" "}
              <Link to="/confidentialite" target="_blank" className="font-semibold text-baobab underline underline-offset-4">
                politique de confidentialité
              </Link>
            </span>
          </label>
          {errors.confidentialite?.message && <FieldError id="erreur-confidentialite">{errors.confidentialite.message}</FieldError>}
        </fieldset>

        <ErreurServeur message={serverError} />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Création du compte…" : "Créer mon compte"}
        </Button>
        <p className="text-center text-body-m text-texte2">
          Déjà inscrit ?{" "}
          <Link to="/owner/login" className="font-semibold text-baobab hover:underline">
            Se connecter
          </Link>
        </p>
      </form>
    </OwnerAuthLayout>
  );
}
