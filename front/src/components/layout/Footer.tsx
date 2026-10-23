import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { useConfigSite } from "@/hooks/useConfigSite";
import { usePublicSession } from "@/hooks/usePublicSession";

// Pied de page de la charte : aplat Baobab foncé, liens utiles, service client.

interface FooterLink {
  to: string;
  label: string;
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h2 className="font-body text-body-l font-bold text-white">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="text-body-l text-white/80 transition-colors duration-hover hover:text-white hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const Footer = () => {
  const { data: config } = useConfigSite();
  const session = usePublicSession();
  const annee = new Date().getFullYear();

  const chercher: FooterLink[] = [
    { to: "/annonces?typeTransaction=location", label: "Louer" },
    { to: "/annonces?typeTransaction=vente", label: "Acheter" },
    { to: "/annonces?vue=carte", label: "Carte des annonces" },
    { to: "/alertes", label: "Alertes SMS" },
  ];
  const proprietaires: FooterLink[] = [
    { to: session.publierHref, label: "Publier une annonce" },
    { to: "/proprietaires", label: "Gestion locative" },
    { to: session.espaceProprietaireHref, label: "Espace propriétaire" },
  ];
  const aide: FooterLink[] = [
    { to: session.espaceLocataireHref, label: "Espace locataire" },
    { to: "/a-propos", label: "À propos" },
    { to: "/conditions-utilisation", label: "Conditions d'utilisation" },
    { to: "/politique-confidentialite", label: "Confidentialité" },
    { to: "/conformite-donnees", label: "Conformité des données" },
  ];

  return (
    <footer className="bg-baobab-900 text-white">
      <div className="container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4 lg:py-16">
        <div>
          <Link to="/" aria-label="Seek, accueil" className="inline-block">
            <Logo variant="blanc" height={40} />
          </Link>
          <p className="mt-4 max-w-xs text-body-l text-white/80">
            Trouvez, louez, gérez. L'immobilier au Sénégal, simplement.
          </p>
          {config?.contactPhone && (
            <p className="mt-6 text-body-l text-white/80">
              Service client :{" "}
              <a href={`tel:${config.contactPhone.replace(/\s/g, "")}`} className="font-semibold text-white hover:underline">
                {config.contactPhone}
              </a>
            </p>
          )}
        </div>
        <FooterColumn title="Chercher" links={chercher} />
        <FooterColumn title="Propriétaires" links={proprietaires} />
        <FooterColumn title="Aide" links={aide} />
      </div>
      <div className="border-t border-white/10">
        <p className="container py-6 text-body-m text-white/70">© {annee} Seek · Dakar, Sénégal</p>
      </div>
    </footer>
  );
};

export default Footer;
