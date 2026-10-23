import { Link, useNavigate } from "react-router-dom";
import { ArrowUpRight, Bell, ChevronRight, History, LogOut, UserRoundCog, type LucideIcon } from "lucide-react";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useLocataireVerificationStatus } from "@/hooks/useLocataireVerification";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { IdentiteLocataire } from "@/components/locataire/profil/IdentiteLocataire";
import { VerificationIdentite } from "@/components/locataire/profil/VerificationIdentite";

// Profil du locataire : coordonnées (tenues par le propriétaire), identité, vérification.
// Sur téléphone, l'onglet Profil porte aussi les liens secondaires et la déconnexion.

const LIENS_MOBILES: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/locataire/notifications", label: "Notifications", icon: Bell },
  { to: "/locataire/historique", label: "Mes logements", icon: History },
  { to: "/locataire/proprietaire", label: "Mon propriétaire", icon: UserRoundCog },
  { to: "/", label: "Voir le site", icon: ArrowUpRight },
];

function Coordonnees() {
  const { locataire } = useLocataireAuth();
  if (!locataire) return null;
  const lignes: [string, string][] = [
    ["Nom", `${locataire.prenom} ${locataire.nom}`],
    ["Téléphone", locataire.telephone],
    ["E-mail", locataire.email ?? "Non renseigné"],
    ["Occupants", `${locataire.nbOccupants} personne${locataire.nbOccupants > 1 ? "s" : ""}`],
    ["Enfants", locataire.presenceEnfants ? "Oui" : "Non"],
  ];
  return (
    <section aria-labelledby="titre-coordonnees" className="rounded-card bg-white p-5 lg:p-6">
      <h2 id="titre-coordonnees" className="font-display text-h3 font-bold text-encre">
        Coordonnées
      </h2>
      <p className="mt-1 text-body-m text-texte2">Pour les modifier, adressez-vous à votre propriétaire.</p>
      <dl className="mt-4 divide-y divide-filet">
        {lignes.map(([cle, valeur]) => (
          <div key={cle} className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-4 py-3">
            <dt className="text-body-m text-texte2">{cle}</dt>
            <dd className="break-all text-right text-body-l font-semibold text-encre">{valeur}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LiensMobiles() {
  const { logout } = useLocataireAuth();
  const navigate = useNavigate();
  const seDeconnecter = async () => {
    await logout();
    navigate("/locataire/login", { replace: true });
  };
  return (
    <nav aria-label="Plus" className="rounded-card bg-white px-4 lg:hidden">
      <ul className="divide-y divide-filet">
        {LIENS_MOBILES.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="flex min-h-14 items-center gap-3 text-body-l text-encre">
              <Icon aria-hidden className="size-6 text-baobab" strokeWidth={1.75} />
              <span className="flex-1">{label}</span>
              <ChevronRight aria-hidden className="size-5 text-texte2" />
            </Link>
          </li>
        ))}
        <li>
          <button type="button" onClick={seDeconnecter} className="flex min-h-14 w-full items-center gap-3 text-left text-body-l text-encre">
            <LogOut aria-hidden className="size-6 text-texte2" strokeWidth={1.75} />
            Se déconnecter
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default function LocataireProfil() {
  const { locataire } = useLocataireAuth();
  const { data: verification } = useLocataireVerificationStatus();
  if (!locataire) return null;

  const statutVerification = verification?.statut ?? locataire.verification?.statut ?? "NOT_VERIFIED";
  const motifRejet = verification?.documents?.motifRejet ?? locataire.verification?.motifRejet;

  return (
    <div className="space-y-6">
      <header className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">Mon profil</h1>
          <p className="mt-1 text-body-l text-texte2">Vos informations et la vérification de votre identité.</p>
        </div>
        <StatusBadge tone={locataire.statut === "ACTIF" ? "positif" : "attente"} className="justify-self-start">
          {locataire.statut === "ACTIF" ? "Compte actif" : "Compte à activer"}
        </StatusBadge>
      </header>
      <div className="grid gap-6 lg:gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6 lg:space-y-8">
          <Coordonnees />
          <IdentiteLocataire locataire={locataire} verificationEnCours={statutVerification === "PENDING"} />
        </div>
        <div className="space-y-6">
          <VerificationIdentite statut={statutVerification} motifRejet={motifRejet} />
          <LiensMobiles />
        </div>
      </div>
    </div>
  );
}
