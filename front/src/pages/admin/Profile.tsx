import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { updateProfileApi, meApi, changePasswordApi } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { BlocChargement, EnTeteAdmin, SectionAdmin } from "@/components/admin/table/Tableau";
import { messageErreurApi } from "@/lib/erreurApi";

// Compte de l'administrateur : adresse e-mail, puis mot de passe. Deux sections de la même
// page plutôt que deux onglets, chacune avec son bouton d'enregistrement.

const LONGUEUR_MIN = 8;
const FORCE_MOT_DE_PASSE = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const DELAI_DECONNEXION_MS = 2000;

interface ErreursMotDePasse {
  actuel?: string;
  nouveau?: string;
  confirmation?: string;
}

function SectionEmail({ emailActuel }: { emailActuel: string }) {
  const [email, setEmail] = useState(emailActuel);
  const [erreur, setErreur] = useState<string>();
  const [enCours, setEnCours] = useState(false);

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    const valeur = email.trim();
    if (!valeur) {
      setErreur("Indiquez votre adresse e-mail.");
      return;
    }
    if (valeur === emailActuel) {
      setErreur("C'est déjà votre adresse actuelle.");
      return;
    }
    setErreur(undefined);
    setEnCours(true);
    try {
      await updateProfileApi({ email: valeur });
      toast.success("Adresse e-mail enregistrée");
    } catch (error) {
      toast.error(messageErreurApi(error, "L'adresse n'a pas pu être enregistrée. Réessayez."));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <SectionAdmin titre="Adresse e-mail" description="Elle sert à vous connecter à l'administration.">
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <FormField label="Adresse e-mail" error={erreur}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErreur(undefined);
            }}
          />
        </FormField>
        <div className="grid sm:justify-end">
          <Button type="submit" disabled={enCours}>
            {enCours && <Loader2 aria-hidden className="animate-spin" />}
            Enregistrer l'adresse
          </Button>
        </div>
      </form>
    </SectionAdmin>
  );
}

function SectionMotDePasse() {
  const { logout } = useAuth();
  const [actuel, setActuel] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreurs, setErreurs] = useState<ErreursMotDePasse>({});
  const [enCours, setEnCours] = useState(false);

  const verifier = (): ErreursMotDePasse => ({
    actuel: actuel ? undefined : "Indiquez votre mot de passe actuel.",
    nouveau:
      nouveau.length < LONGUEUR_MIN
        ? `Le nouveau mot de passe compte au moins ${LONGUEUR_MIN} caractères.`
        : !FORCE_MOT_DE_PASSE.test(nouveau)
          ? "Ajoutez au moins une minuscule, une majuscule et un chiffre."
          : nouveau === actuel
            ? "Choisissez un mot de passe différent de l'actuel."
            : undefined,
    confirmation: confirmation === nouveau ? undefined : "Les deux mots de passe ne sont pas identiques.",
  });

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    const nouvelles = verifier();
    setErreurs(nouvelles);
    if (Object.values(nouvelles).some(Boolean)) return;
    setEnCours(true);
    try {
      await changePasswordApi({ currentPassword: actuel, newPassword: nouveau, confirmPassword: confirmation });
      toast.success("Mot de passe modifié. Reconnectez-vous avec le nouveau.");
      setActuel("");
      setNouveau("");
      setConfirmation("");
      setTimeout(logout, DELAI_DECONNEXION_MS);
    } catch (error) {
      toast.error(messageErreurApi(error, "Le mot de passe n'a pas pu être modifié. Vérifiez le mot de passe actuel."));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <SectionAdmin titre="Mot de passe" description="Après le changement, vous serez déconnecté pour vous reconnecter avec le nouveau.">
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <FormField label="Mot de passe actuel" error={erreurs.actuel}>
          <PasswordInput autoComplete="current-password" value={actuel} onChange={(event) => setActuel(event.target.value)} />
        </FormField>
        <FormField label="Nouveau mot de passe" help={`Au moins ${LONGUEUR_MIN} caractères, dont une majuscule, une minuscule et un chiffre.`} error={erreurs.nouveau}>
          <PasswordInput autoComplete="new-password" value={nouveau} onChange={(event) => setNouveau(event.target.value)} />
        </FormField>
        <FormField label="Confirmer le nouveau mot de passe" error={erreurs.confirmation}>
          <PasswordInput autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        </FormField>
        <div className="grid sm:justify-end">
          <Button type="submit" disabled={enCours}>
            {enCours && <Loader2 aria-hidden className="animate-spin" />}
            Changer le mot de passe
          </Button>
        </div>
      </form>
    </SectionAdmin>
  );
}

export default function Profile() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    meApi()
      .then(({ data }) => setEmail(data.data.email ?? ""))
      .catch(() => setEmail(""));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <EnTeteAdmin titre="Mon compte" description="Vos identifiants d'administrateur." />
      {email === null ? <BlocChargement label="Chargement du compte" /> : <SectionEmail emailActuel={email} />}
      <SectionMotDePasse />
    </div>
  );
}
