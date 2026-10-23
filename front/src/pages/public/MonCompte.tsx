import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bell, Lock, LogOut, Trash2, User, type LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/brand/EmptyState";
import { MesAlertes } from "@/components/compte/MesAlertes";
import { MotDePasseForm } from "@/components/compte/MotDePasseForm";
import { ProfilForm } from "@/components/compte/ProfilForm";
import { SuppressionCompte } from "@/components/compte/SuppressionCompte";
import { Button } from "@/components/ui/button";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { cn } from "@/lib/utils";

// Mon compte (visiteur) : profil, mot de passe, alertes SMS, suppression.
// L'onglet actif vit dans l'URL (?onglet=alertes) pour pouvoir y renvoyer directement.

type Onglet = "profil" | "mot-de-passe" | "alertes" | "supprimer";

const ONGLETS: { cle: Onglet; libelle: string; icon: LucideIcon }[] = [
  { cle: "profil", libelle: "Profil", icon: User },
  { cle: "alertes", libelle: "Alertes", icon: Bell },
  { cle: "mot-de-passe", libelle: "Mot de passe", icon: Lock },
  { cle: "supprimer", libelle: "Supprimer", icon: Trash2 },
];

/**
 * Un propriétaire ou un locataire connecté a aussi un compte visiteur. S'il a expiré,
 * on tente une fois de le rétablir avant d'afficher la page.
 */
function useRecuperationSessionPublique() {
  const { isAuthenticated, refreshMe } = useComptePublicAuth();
  const { isAuthenticated: isOwnerAuth, isLoading: ownerLoading } = useOwnerAuth();
  const { isAuthenticated: isLocataireAuth, isLoading: locataireLoading } = useLocataireAuth();
  const [enCours, setEnCours] = useState(false);
  const tentee = useRef(false);
  const sessionPrivee = isOwnerAuth || isLocataireAuth;

  useEffect(() => {
    if (ownerLoading || locataireLoading || !sessionPrivee || isAuthenticated || tentee.current) return;
    tentee.current = true;
    setEnCours(true);
    void refreshMe().finally(() => setEnCours(false));
  }, [ownerLoading, locataireLoading, sessionPrivee, isAuthenticated, refreshMe]);

  return { enCours, sessionPrivee, isLocataireAuth };
}

export default function MonCompte() {
  const { compte, isAuthenticated, isLoading, logout } = useComptePublicAuth();
  const recuperation = useRecuperationSessionPublique();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const onglet = (ONGLETS.find((o) => o.cle === searchParams.get("onglet"))?.cle ?? "profil") as Onglet;

  if (isLoading || recuperation.enCours) {
    return <div className="container py-12"><div className="h-64 animate-pulse rounded-card bg-surface" aria-label="Chargement du compte" /></div>;
  }

  if (!isAuthenticated || !compte) {
    return (
      <div className="container">
        {recuperation.sessionPrivee ? (
          <EmptyState
            titreNiveau="h1"
            titre="Votre session a expiré"
            texte="Déconnectez-vous puis reconnectez-vous pour retrouver vos favoris et vos alertes."
            action={
              <Button
                onClick={async () => {
                  await logout();
                  navigate(recuperation.isLocataireAuth ? "/locataire/login" : "/owner/login");
                }}
              >
                Me reconnecter
              </Button>
            }
          />
        ) : (
          <EmptyState titreNiveau="h1" titre="Connectez-vous pour voir votre compte" texte="Utilisez le bouton Compte en bas de l'écran ou « Se connecter » en haut de la page." />
        )}
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 lg:py-12">
      <div className="grid grid-cols-[1fr_auto] items-center gap-4">
        <div>
          <h1 className="text-h1 font-bold text-encre">Mon compte</h1>
          <p className="mt-1 text-body-l text-texte2">
            {compte.prenom} {compte.nom}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void logout().then(() => navigate("/"))}>
          <LogOut aria-hidden />
          Se déconnecter
        </Button>
      </div>

      <div role="tablist" aria-label="Rubriques du compte" className="hide-scrollbar mt-8 flex gap-2 overflow-x-auto border-b border-filet">
        {ONGLETS.map(({ cle, libelle, icon: Icon }) => (
          <button
            key={cle}
            type="button"
            role="tab"
            id={`onglet-${cle}`}
            aria-selected={onglet === cle}
            aria-controls={`panneau-${cle}`}
            onClick={() => setSearchParams(cle === "profil" ? {} : { onglet: cle }, { replace: true })}
            className={cn(
              "-mb-px inline-flex h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-body-m font-semibold transition-colors duration-tab",
              onglet === cle ? "border-baobab text-baobab" : "border-transparent text-texte2 hover:text-encre",
            )}
          >
            <Icon aria-hidden className="size-5" />
            {libelle}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panneau-${onglet}`} aria-labelledby={`onglet-${onglet}`} className="pt-8">
        {onglet === "profil" && <ProfilForm compte={compte} />}
        {onglet === "alertes" && <MesAlertes />}
        {onglet === "mot-de-passe" && <MotDePasseForm />}
        {onglet === "supprimer" && <SuppressionCompte />}
      </div>
    </div>
  );
}
