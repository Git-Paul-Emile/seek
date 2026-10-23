import { Outlet, useLocation, matchPath } from "react-router-dom";
import { Bell, Heart, Home, Search, User } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FeedbackWidget from "@/components/layout/FeedbackWidget";
import ComparisonBar from "@/components/comparison/ComparisonBar";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { HeaderSearch } from "@/components/recherche/HeaderSearch";
import { BottomNav, type BottomNavItem } from "@/components/ui/BottomNav";
import { usePublicSession } from "@/hooks/usePublicSession";

// Pages qui affichent leur propre barre en haut sur mobile (maquettes Résultats et Fiche).
const OWN_MOBILE_HEADER = ["/annonces", "/recherche", "/annonce/:id"];
const SEARCH_PAGES = ["/annonces", "/recherche"];
// La fiche a sa barre d'action fixe (prix, message, appel) à la place des onglets.
const NO_BOTTOM_NAV = ["/annonce/:id"];

const matches = (patterns: string[], pathname: string) => patterns.some((pattern) => matchPath(pattern, pathname));

const PublicLayout = () => {
  const { pathname } = useLocation();
  const session = usePublicSession();
  const isHome = pathname === "/";
  const showBottomNav = !matches(NO_BOTTOM_NAV, pathname);

  const tabs: BottomNavItem[] = [
    { to: "/", label: "Accueil", icon: Home },
    { to: "/annonces", label: "Rechercher", icon: Search },
    { to: "/favoris", label: "Favoris", icon: Heart },
    { to: "/alertes", label: "Alertes", icon: Bell },
    session.isConnected
      ? { to: "/mon-compte", label: "Compte", icon: User }
      : { label: "Compte", icon: User, onSelect: session.openConnexion },
  ];

  return (
    <div className="relative overflow-x-clip">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-white focus:px-4 focus:py-3 focus:text-encre"
      >
        Aller au contenu
      </a>
      <Navbar
        tone={isHome ? "baobab" : "blanc"}
        hideOnMobile={matches(OWN_MOBILE_HEADER, pathname)}
        center={matches(SEARCH_PAGES, pathname) ? <HeaderSearch /> : undefined}
      />
      <OfflineBanner />
      <main id="contenu" className={showBottomNav ? "min-h-screen pb-20 lg:pb-0" : "min-h-screen"}>
        <Outlet />
      </main>
      <Footer />
      {/* L'onglet latéral recouvre le contenu sur téléphone : réservé au desktop. */}
      <div className="hidden lg:block">
        <FeedbackWidget />
      </div>
      <ComparisonBar />
      {showBottomNav && <BottomNav items={tabs} />}
    </div>
  );
};

export default PublicLayout;
