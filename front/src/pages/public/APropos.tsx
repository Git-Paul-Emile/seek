import { Link } from "react-router-dom";
import { Bell, ClipboardCheck, FileText, Receipt, ShieldCheck, Smartphone, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { useConfigSite } from "@/hooks/useConfigSite";
import { useLieux } from "@/hooks/useRecherche";
import { useTypeLogements } from "@/hooks/useTypeLogements";
import { formatMontant } from "@/lib/fcfa";

// À propos : ce que fait Seek, pour qui, avec des chiffres lus en direct dans la base
// (aucune métrique inventée, rules/30-produit/ui.md) et les coordonnées saisies dans l'admin.

const FONCTIONS: { icon: LucideIcon; titre: string; texte: string }[] = [
  { icon: ShieldCheck, titre: "Annonces modérées", texte: "Chaque annonce est relue par l'équipe avant publication. Les signalements sont examinés." },
  { icon: Bell, titre: "Alertes SMS", texte: "Un SMS dès qu'une annonce correspond à vos critères, désactivable à tout moment." },
  { icon: FileText, titre: "Baux en ligne", texte: "Le propriétaire crée le bail, le locataire le retrouve dans son espace." },
  { icon: Receipt, titre: "Loyers et quittances", texte: "Paiements suivis mois par mois, rappels avant l'échéance, quittances en PDF." },
  { icon: ClipboardCheck, titre: "États des lieux", texte: "Entrée et sortie documentées pièce par pièce, comparées en fin de bail." },
  { icon: Smartphone, titre: "Pensé pour le téléphone", texte: "Mobile money, prix en FCFA, application installable sur l'écran d'accueil." },
];

function ChiffresReels() {
  const { data: types = [] } = useTypeLogements();
  const { data: lieux } = useLieux();
  const annonces = types.reduce((total, type) => total + (type.count ?? 0), 0);
  const chiffres = [
    { valeur: annonces, libelle: annonces > 1 ? "annonces publiées" : "annonce publiée" },
    { valeur: lieux?.villes.length ?? 0, libelle: "villes avec des annonces" },
    { valeur: lieux?.quartiers.length ?? 0, libelle: "quartiers couverts" },
  ].filter((chiffre) => chiffre.valeur > 0);

  if (chiffres.length === 0) return null;
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      {chiffres.map(({ valeur, libelle }) => (
        <div key={libelle} className="rounded-card border border-filet bg-white p-5">
          <dt className="text-body-m text-texte2">{libelle}</dt>
          <dd className="tabular mt-1 font-display text-h1 font-bold text-encre">{formatMontant(valeur)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function APropos() {
  const { data: config } = useConfigSite();

  return (
    <div>
      <section className="bg-baobab text-white" aria-labelledby="apropos-titre">
        <div className="container grid gap-8 py-12 lg:grid-cols-[1.5fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="text-overline font-bold uppercase text-soleil">À propos</p>
            <h1 id="apropos-titre" className="mt-3 text-display-m font-bold lg:text-display">
              L'immobilier au Sénégal, simplement.
            </h1>
            <p className="mt-4 max-w-xl text-body-l text-white/90">
              Seek est un portail d'annonces pour trouver où vivre, et un outil de gestion locative pour les propriétaires :
              biens, locataires, baux, loyers et quittances au même endroit.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="inverse">
                <Link to="/annonces">Voir les annonces</Link>
              </Button>
              <Button asChild variant="outline-inverse">
                <Link to="/proprietaires">Je suis propriétaire</Link>
              </Button>
            </div>
          </div>
          <div className="hidden justify-center lg:flex">
            <Logo variant="symbole-blanc" height={220} />
          </div>
        </div>
      </section>

      <section className="container py-12 lg:py-20" aria-labelledby="fonctions-titre">
        <h2 id="fonctions-titre" className="text-h2 font-bold text-encre lg:text-[40px] lg:leading-[44px]">
          Ce que Seek fait pour vous
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FONCTIONS.map(({ icon: Icon, titre, texte }) => (
            <li key={titre} className="rounded-card bg-surface p-6">
              <span aria-hidden className="flex size-12 items-center justify-center rounded-control bg-baobab-100 text-baobab">
                <Icon className="size-6" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 font-body text-h3 font-semibold text-encre">{titre}</h3>
              <p className="mt-1 text-body-m text-texte2">{texte}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <ChiffresReels />
        </div>
      </section>

      <section className="container pb-12 lg:pb-20" aria-labelledby="donnees-titre">
        <div className="rounded-sheet border border-filet p-6 lg:p-10">
          <h2 id="donnees-titre" className="text-h3 font-bold text-encre">Vos données personnelles</h2>
          <p className="mt-2 max-w-2xl text-body-l text-texte2">
            Seek applique la loi n° 2008-12 sur la protection des données personnelles au Sénégal. Les documents ci-dessous
            expliquent ce que nous collectons et pourquoi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to="/politique-confidentialite">Politique de confidentialité</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/conformite-donnees">Conformité des données</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/conditions-utilisation">Conditions d'utilisation</Link>
            </Button>
          </div>
        </div>
      </section>

      {(config?.contactEmail || config?.contactPhone) && (
        <section className="container pb-16" aria-labelledby="contact-titre">
          <h2 id="contact-titre" className="text-h3 font-bold text-encre">Nous contacter</h2>
          <ul className="mt-4 space-y-2 text-body-l text-encre">
            {config.contactPhone && (
              <li>
                Téléphone :{" "}
                <a href={`tel:${config.contactPhone.replace(/\s/g, "")}`} className="font-semibold text-baobab hover:underline">
                  {config.contactPhone}
                </a>
              </li>
            )}
            {config.contactEmail && (
              <li>
                E-mail :{" "}
                <a href={`mailto:${config.contactEmail}`} className="font-semibold text-baobab hover:underline">
                  {config.contactEmail}
                </a>
              </li>
            )}
            {config.contactAddress && <li>Adresse : {config.contactAddress}</li>}
          </ul>
        </section>
      )}
    </div>
  );
}
