import { useState } from "react";
import { toast } from "sonner";
import { loginComptePublicApi, registerComptePublicApi, type RegisterData } from "@/api/comptePublicAuth";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";

// Inscription et connexion du compte visiteur (favoris, alertes). Validation côté client pour
// le confort ; le backend revalide toujours.

const MOT_DE_PASSE_MIN = 6;

export type Onglet = "inscription" | "connexion";
type Erreurs = Partial<Record<"prenom" | "nom" | "telephone" | "email" | "password" | "formulaire", string>>;

const messageApi = (err: unknown, defaut: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? defaut;

export function useComptePublicConnexion({ hasPendingBien, onSuccess }: { hasPendingBien: boolean; onSuccess: () => void }) {
  const { setCompte } = useComptePublicAuth();
  const [onglet, setOnglet] = useState<Onglet>("inscription");
  const [chargement, setChargement] = useState(false);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [inscription, setInscription] = useState<RegisterData>({ nom: "", prenom: "", telephone: "", email: "", password: "" });
  const [connexion, setConnexion] = useState({ telephone: "", password: "" });

  const changerOnglet = (suivant: Onglet) => {
    setOnglet(suivant);
    setErreurs({});
  };

  const majInscription = (champ: keyof RegisterData, valeur: string) => {
    setInscription((prev) => ({ ...prev, [champ]: valeur }));
    setErreurs((prev) => ({ ...prev, [champ]: undefined, formulaire: undefined }));
  };

  const majConnexion = (champ: "telephone" | "password", valeur: string) => {
    setConnexion((prev) => ({ ...prev, [champ]: valeur }));
    setErreurs((prev) => ({ ...prev, [champ]: undefined, formulaire: undefined }));
  };

  const valider = (champs: Erreurs) => {
    const restantes = Object.fromEntries(Object.entries(champs).filter(([, v]) => v)) as Erreurs;
    setErreurs(restantes);
    return Object.keys(restantes).length === 0;
  };

  const inscrire = async () => {
    const valide = valider({
      prenom: inscription.prenom.trim() ? undefined : "Indiquez votre prénom.",
      nom: inscription.nom.trim() ? undefined : "Indiquez votre nom.",
      telephone: inscription.telephone.trim() ? undefined : "Indiquez votre numéro, il sert à vous connecter.",
      password:
        inscription.password.length >= MOT_DE_PASSE_MIN
          ? undefined
          : `Choisissez un mot de passe de ${MOT_DE_PASSE_MIN} caractères au moins.`,
    });
    if (!valide) return;
    setChargement(true);
    try {
      const compte = await registerComptePublicApi({ ...inscription, email: inscription.email || undefined });
      setCompte(compte);
      toast(hasPendingBien ? "Compte créé. L'annonce est dans vos favoris." : "Compte créé. Bienvenue sur Seek.");
      onSuccess();
    } catch (err) {
      const message = messageApi(err, "Le compte n'a pas été créé. Vérifiez votre connexion, puis réessayez.");
      const champ = /t[ée]l[ée]phone/i.test(message) ? "telephone" : /e-?mail/i.test(message) ? "email" : "formulaire";
      setErreurs({ [champ]: message });
    } finally {
      setChargement(false);
    }
  };

  const connecter = async () => {
    const valide = valider({
      telephone: connexion.telephone.trim() ? undefined : "Indiquez le numéro utilisé à l'inscription.",
      password: connexion.password ? undefined : "Indiquez votre mot de passe.",
    });
    if (!valide) return;
    setChargement(true);
    try {
      const compte = await loginComptePublicApi(connexion.telephone.trim(), connexion.password);
      setCompte(compte);
      toast(hasPendingBien ? "Connecté. L'annonce est dans vos favoris." : "Vous êtes connecté.");
      onSuccess();
    } catch (err) {
      setErreurs({ formulaire: messageApi(err, "Numéro ou mot de passe incorrect.") });
    } finally {
      setChargement(false);
    }
  };

  return { onglet, changerOnglet, chargement, erreurs, inscription, majInscription, connexion, majConnexion, inscrire, connecter };
}
