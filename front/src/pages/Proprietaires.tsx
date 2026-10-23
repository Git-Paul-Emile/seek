import { Link } from "react-router-dom";
import { Bell, Building2, Check, ClipboardCheck, FileText, Receipt, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { formatMontant } from "@/lib/fcfa";

// Page propriétaires, d'après l'affiche « Propriétaires » de la charte : la promesse,
// puis la preuve dans l'arche. Les chiffres de l'arche sont un exemple, et c'est écrit.

const EXEMPLE = { encaisse: 2_450_000, attendu: 2_990_000, payes: 9, rappels: 3 };
const POURCENT = 100;

const ETAPES = [
  { titre: "Publiez", texte: "Votre bien en ligne après vérification par notre équipe, avec photos et prix en FCFA." },
  { titre: "Gérez", texte: "Baux, locataires et états des lieux au même endroit, depuis votre téléphone." },
  { titre: "Encaissez", texte: "Rappels automatiques avant l'échéance, paiements suivis, quittances en PDF." },
];

const FONCTIONS: { icon: LucideIcon; titre: string; texte: string }[] = [
  { icon: Building2, titre: "Tous vos biens", texte: "Appartements, villas, studios, bureaux : un seul tableau de bord." },
  { icon: Users, titre: "Vos locataires", texte: "Invitez-les par SMS, ils retrouvent bail et paiements dans leur espace." },
  { icon: FileText, titre: "Baux en ligne", texte: "Créez le bail à partir d'un modèle, il reste archivé et consultable." },
  { icon: Receipt, titre: "Loyers et quittances", texte: "Chaque paiement est enregistré, la quittance part en PDF." },
  { icon: Bell, titre: "Retards signalés", texte: "Les loyers en retard ressortent en tête, avec la relance à portée de main." },
  { icon: ClipboardCheck, titre: "États des lieux", texte: "Pièce par pièce à l'entrée et à la sortie, comparés en fin de bail." },
];

function ArcheExemple() {
  const progression = Math.round((EXEMPLE.encaisse / EXEMPLE.attendu) * POURCENT);
  return (
    <figure className="mx-auto w-full max-w-md rounded-t-full rounded-b-sheet bg-baobab px-8 pb-10 pt-24 text-center text-white">
      <figcaption className="text-overline font-bold uppercase text-soleil">Exemple d'un mois de gestion</figcaption>
      <p className="tabular mt-3 font-display text-display-m font-bold lg:text-display">{formatMontant(EXEMPLE.encaisse)}</p>
      <p className="text-body-l text-white/90">FCFA encaissés ce mois-ci</p>
      <div className="mx-auto mt-5 h-2 max-w-xs rounded-full bg-baobab-900" aria-hidden>
        <div className="h-full rounded-full bg-white" style={{ width: `${progression}%` }} />
      </div>
      <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left text-body-l">
        <li className="flex items-center gap-3">
          <Check aria-hidden className="size-5 shrink-0 text-soleil" />
          {EXEMPLE.payes} loyers payés, quittances envoyées
        </li>
        <li className="flex items-center gap-3">
          <Check aria-hidden className="size-5 shrink-0 text-soleil" />
          {EXEMPLE.rappels} rappels partis par SMS
        </li>
      </ul>
    </figure>
  );
}

const Proprietaires = () => {
  const { isAuthenticated } = useOwnerAuth();
  const cta = isAuthenticated ? { to: "/owner/dashboard", label: "Aller à mon tableau de bord" } : { to: "/owner/register", label: "Commencer gratuitement" };

  return (
    <div>
      <section className="bg-soleil text-encre" aria-labelledby="proprietaires-titre">
        <div className="container grid gap-10 py-12 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="text-overline font-bold uppercase">Gestion locative</p>
            <h1 id="proprietaires-titre" className="mt-3 text-display-m font-bold text-baobab lg:text-display-xl">
              Vos loyers, sans cahier.
            </h1>
            <p className="mt-4 max-w-lg text-body-l lg:text-[20px] lg:leading-[30px]">
              Publiez vos biens, invitez vos locataires par SMS, suivez chaque paiement et envoyez les quittances en un geste.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={cta.to}>{cta.label}</Link>
              </Button>
              {!isAuthenticated && (
                <Button asChild size="lg" variant="outline" className="border-encre bg-transparent hover:bg-soleil-600">
                  <Link to="/owner/login">Se connecter</Link>
                </Button>
              )}
            </div>
          </div>
          <ArcheExemple />
        </div>
      </section>

      <section className="container py-12 lg:py-20" aria-labelledby="etapes-titre">
        <h2 id="etapes-titre" className="text-h2 font-bold text-encre lg:text-[40px] lg:leading-[44px]">
          Comment ça marche
        </h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {ETAPES.map((etape, index) => (
            <li key={etape.titre}>
              <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-baobab text-h3 font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 font-body text-h3 font-semibold text-encre">{etape.titre}</h3>
              <p className="mt-1 text-body-l text-texte2">{etape.texte}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface py-12 lg:py-20" aria-labelledby="fonctions-titre">
        <div className="container">
          <h2 id="fonctions-titre" className="text-h2 font-bold text-encre lg:text-[40px] lg:leading-[44px]">
            Tout ce qu'il faut pour louer sereinement
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FONCTIONS.map(({ icon: Icon, titre, texte }) => (
              <li key={titre} className="rounded-card bg-white p-6">
                <span aria-hidden className="flex size-12 items-center justify-center rounded-control bg-baobab-100 text-baobab">
                  <Icon className="size-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-body text-h3 font-semibold text-encre">{titre}</h3>
                <p className="mt-1 text-body-m text-texte2">{texte}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container py-12 lg:py-20">
        <div className="rounded-sheet bg-baobab p-8 text-center text-white lg:p-12">
          <h2 className="text-h2 font-bold lg:text-[40px] lg:leading-[44px]">Votre premier bien en ligne aujourd'hui</h2>
          <p className="mx-auto mt-3 max-w-xl text-body-l text-white/90">
            L'inscription est gratuite. Vous publiez, nous vérifions, les locataires vous contactent directement.
          </p>
          <Button asChild size="lg" variant="inverse" className="mt-8">
            <Link to={cta.to}>{cta.label}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Proprietaires;
