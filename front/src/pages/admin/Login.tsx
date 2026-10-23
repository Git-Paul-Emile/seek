import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/brand/Logo";
import { BadgeAdmin } from "@/components/admin/AdminSidebar";
import { ErreurServeur } from "@/components/owner/OwnerAuthLayout";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/button";

// ─── Validation Zod (100 % front, aucune validation HTML) ────────────────────

const loginSchema = z.object({
  email: z
    .string({ required_error: "Saisissez votre adresse e-mail." })
    .min(1, "Saisissez votre adresse e-mail.")
    .email("Saisissez une adresse e-mail complète, par exemple admin@seek.sn.")
    .trim(),
  password: z
    .string({ required_error: "Saisissez votre mot de passe." })
    .min(1, "Saisissez votre mot de passe."),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ─── Résolution des erreurs serveur ──────────────────────────────────────────

function resolveServerError(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return "Une erreur inattendue est survenue. Veuillez réessayer.";
  }

  // Pas de réponse reçue = problème réseau / serveur inaccessible
  if (!err.response) {
    return "Impossible de joindre le serveur. Vérifiez votre connexion.";
  }

  const status  = err.response.status;
  const message = err.response.data?.message as string | undefined;

  switch (status) {
    case 401:
      return "Email ou mot de passe incorrect.";
    case 429:
      return "Trop de tentatives. Veuillez patienter 15 minutes avant de réessayer.";
    case 400:
      return message ?? "Les informations saisies sont invalides.";
    case 403:
      return "Accès refusé. Ce compte n'a pas les droits d'administration.";
    case 500:
    case 502:
    case 503:
      return "Le serveur rencontre un problème. Veuillez réessayer dans quelques instants.";
    default:
      return message ?? "Une erreur est survenue. Veuillez réessayer.";
  }
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched", // valide au blur, pas à chaque frappe
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setServerError(resolveServerError(err));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-encre px-4">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between">
        <Link to="/" aria-label="Accueil Seek" className="flex items-center gap-2">
          <Logo variant="blanc" height={28} />
          <BadgeAdmin />
        </Link>
        <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 text-body-m font-semibold text-white/80 hover:text-white">
          <ArrowLeft aria-hidden className="size-4" />
          Retour au site
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-md rounded-sheet bg-white p-6 sm:p-8">
          <p className="text-overline font-semibold uppercase text-baobab">Administration</p>
          <h1 className="mt-2 font-display text-h2 font-bold text-encre">Connexion</h1>
          <p className="mt-1 text-body-l text-texte2">Accès réservé aux administrateurs de Seek.</p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
            <FormField label="Adresse e-mail" error={errors.email?.message}>
              <Input type="text" inputMode="email" autoComplete="email" placeholder="admin@seek.sn" {...register("email")} />
            </FormField>
            <FormField label="Mot de passe" error={errors.password?.message}>
              <PasswordInput autoComplete="current-password" {...register("password")} />
            </FormField>
            <ErreurServeur message={serverError} />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 aria-hidden className="animate-spin" />}
              {isSubmitting ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
