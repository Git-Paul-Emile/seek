import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Encart propriétaires : l'unique aplat Soleil de l'accueil (publiez, gérez, encaissez).
// Chaque promesse correspond à une fonction livrée : modération, baux et états des lieux,
// rappels de loyer automatiques (cron.service) et quittances PDF.

const ETAPES = [
  { titre: "Publiez", texte: "Votre annonce en ligne après vérification par notre équipe." },
  { titre: "Gérez", texte: "Baux, locataires et états des lieux, depuis votre téléphone." },
  { titre: "Encaissez", texte: "Rappels automatiques avant l'échéance et quittances en PDF." },
];

const OwnerStepsSection = () => (
  <section className="pb-12 lg:pb-20" aria-labelledby="proprietaires-titre">
    <div className="container">
      <div className="rounded-sheet bg-soleil p-6 text-encre lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:p-12">
        <div>
          <p className="text-overline font-bold uppercase">Vous êtes propriétaire ?</p>
          <h2 id="proprietaires-titre" className="mt-3 text-display-m font-bold lg:text-[56px] lg:leading-[60px]">
            Vos loyers, sans cahier ni Excel.
          </h2>
          <p className="mt-4 hidden text-body-l lg:block">
            Publiez vos biens, invitez vos locataires par SMS, suivez chaque paiement et envoyez les quittances en un
            geste.
          </p>
          <Button asChild size="lg" className="mt-8 hidden lg:inline-flex">
            <Link to="/owner/register">Commencer gratuitement</Link>
          </Button>
        </div>
        <ol className="mt-6 space-y-5 lg:mt-0 lg:space-y-4">
          {ETAPES.map((etape, index) => (
            <li key={etape.titre} className="flex gap-4 lg:rounded-card lg:bg-white lg:p-5">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-encre text-body-l font-bold text-soleil"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="font-body text-h3 font-semibold">{etape.titre}</h3>
                <p className="text-body-l lg:text-texte2">{etape.texte}</p>
              </div>
            </li>
          ))}
        </ol>
        <Button asChild size="lg" className="mt-8 w-full lg:hidden">
          <Link to="/owner/register">Commencer gratuitement</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default OwnerStepsSection;
