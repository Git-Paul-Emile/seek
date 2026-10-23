import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ROUTE_TITLES: Array<[RegExp, string]> = [
  // Public
  [/^\/$/, "Seek · Trouvez votre logement"],
  [/^\/annonces$/, "Annonces · Seek"],
  [/^\/recherche$/, "Recherche · Seek"],
  [/^\/annonce\/[^/]+$/, "Annonce · Seek"],
  [/^\/favoris$/, "Mes favoris · Seek"],
  [/^\/proprietaires$/, "Espace propriétaires · Seek"],

  // Owner auth
  [/^\/owner\/login$/, "Connexion propriétaire · Seek"],
  [/^\/owner\/register$/, "Inscription propriétaire · Seek"],
  [/^\/owner\/forgot-password$/, "Mot de passe oublié · Seek"],
  [/^\/owner\/reset-password$/, "Réinitialisation du mot de passe · Seek"],

  // Owner espace
  [/^\/owner\/dashboard$/, "Tableau de bord · Seek"],
  [/^\/owner\/verification$/, "Vérification · Seek"],
  [/^\/owner\/profile$/, "Mon profil · Seek"],
  [/^\/owner\/paiements$/, "Historique paiements · Seek"],
  [/^\/owner\/biens\/ajouter$/, "Ajouter un bien · Seek"],
  [/^\/owner\/biens\/[^/]+\/paiements$/, "Paiements du bien · Seek"],
  [/^\/owner\/biens\/[^/]+$/, "Détail du bien · Seek"],
  [/^\/owner\/biens$/, "Mes biens · Seek"],
  [/^\/owner\/locataires\/ajouter$/, "Ajouter un locataire · Seek"],
  [/^\/owner\/locataires\/[^/]+$/, "Détail locataire · Seek"],
  [/^\/owner\/locataires$/, "Mes locataires · Seek"],
  [/^\/owner\/stats\/vues$/, "Statistiques de vues · Seek"],
  [/^\/owner\/abonnement$/, "Mon abonnement · Seek"],

  // Locataire auth
  [/^\/locataire\/activer$/, "Activation du compte · Seek"],
  [/^\/locataire\/login$/, "Connexion locataire · Seek"],
  [/^\/locataire\/forgot-password$/, "Mot de passe oublié · Seek"],
  [/^\/locataire\/reset-password$/, "Réinitialisation du mot de passe · Seek"],

  // Locataire espace
  [/^\/locataire\/dashboard$/, "Accueil · Seek"],
  [/^\/locataire\/profil$/, "Mon profil · Seek"],
  [/^\/locataire\/paiements$/, "Paiements · Seek"],
  [/^\/locataire\/proprietaire$/, "Mon propriétaire · Seek"],
  [/^\/locataire\/historique$/, "Mes logements · Seek"],
  [/^\/locataire\/documents$/, "Documents · Seek"],
  [/^\/locataire\/notifications$/, "Notifications · Seek"],
  [/^\/locataire\/etats-des-lieux\/[^/]+$/, "État des lieux · Seek"],
  [/^\/locataire\/etats-des-lieux$/, "États des lieux · Seek"],

  // Admin auth
  [/^\/admin\/login$/, "Connexion admin · Seek"],

  // Admin espace
  [/^\/admin\/dashboard$/, "Tableau de bord · Admin Seek"],
  [/^\/admin\/profile$/, "Profil · Admin Seek"],
  [/^\/admin\/signalements$/, "Signalements · Admin Seek"],
  [/^\/admin\/notifications$/, "Notifications · Admin Seek"],
  [/^\/admin\/temoignages$/, "Témoignages · Admin Seek"],
  [/^\/admin\/feedbacks$/, "Retours d'expérience · Admin Seek"],
  [/^\/admin\/champs\/categories$/, "Catégories de champs · Admin Seek"],
  [/^\/admin\/champs$/, "Champs de formulaire · Admin Seek"],
  [/^\/admin\/biens\/types\/[^/]+\/champs$/, "Champs du type de logement · Admin Seek"],
  [/^\/admin\/parametres\/config-site$/, "Configuration du site · Admin Seek"],
  [/^\/admin\/parametres\/pages-legales$/, "Pages légales · Admin Seek"],
  [/^\/admin\/utilisateurs\/locataires$/, "Locataires · Admin Seek"],
  [/^\/admin\/utilisateurs\/proprietaires$/, "Propriétaires · Admin Seek"],
  [/^\/admin\/biens\/categories$/, "Types de logement · Admin Seek"],
  [/^\/admin\/biens\/transactions$/, "Types de transaction · Admin Seek"],
  [/^\/admin\/biens\/statuts$/, "Statuts des biens · Admin Seek"],
  [/^\/admin\/biens\/meuble-equipement$/, "Meubles & équipements · Admin Seek"],
  [/^\/admin\/annonces\/[^/]+$/, "Détail annonce · Admin Seek"],
  [/^\/admin\/annonces$/, "Annonces · Admin Seek"],
  [/^\/admin\/verifications$/, "Vérifications · Admin Seek"],
  [/^\/admin\/proprietaires$/, "Propriétaires · Admin Seek"],
  [/^\/admin\/utilisateurs\/[^/]+$/, "Utilisateurs · Admin Seek"],
  [/^\/admin\/suspensions$/, "Suspensions · Admin Seek"],
  [/^\/admin\/geo\/pays$/, "Pays · Admin Seek"],
  [/^\/admin\/geo\/villes$/, "Villes · Admin Seek"],
  [/^\/admin\/geo\/quartiers$/, "Quartiers · Admin Seek"],
  [/^\/admin\/transactions$/, "Transactions · Admin Seek"],
  [/^\/admin\/premium\/historique$/, "Historique premium · Admin Seek"],
  [/^\/admin\/premium\/formules$/, "Formules premium · Admin Seek"],
  [/^\/admin\/locataires\/[^/]+\/documents$/, "Documents locataire · Admin Seek"],
  [/^\/admin\/stats\/revenus$/, "Revenus · Admin Seek"],
  [/^\/admin\/contrats\/modeles$/, "Modèles de contrat · Admin Seek"],
  [/^\/admin\/monetisation\/config$/, "Config monétisation · Admin Seek"],
  [/^\/admin\/monetisation\/plans$/, "Plans d'abonnement · Admin Seek"],
  [/^\/admin\/monetisation\/abonnements$/, "Abonnements · Admin Seek"],
  [/^\/admin\/monetisation\/mises-en-avant$/, "Mises en avant · Admin Seek"],
];

const DEFAULT_TITLE = "Seek";

export default function PageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = ROUTE_TITLES.find(([pattern]) => pattern.test(pathname));
    document.title = match ? match[1] : DEFAULT_TITLE;
  }, [pathname]);

  return null;
}
