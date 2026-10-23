import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { fetchAnnoncePublique, fetchAnnoncesSimilaires } from "@/api/bien";
import { AnnonceGallery } from "@/components/annonce-detail/AnnonceGallery";
import { AnnonceResume } from "@/components/annonce-detail/AnnonceResume";
import { CaracteristiquesGrid } from "@/components/annonce-detail/CaracteristiquesGrid";
import { ContactBar, ContactCard } from "@/components/annonce-detail/ContactActions";
import { DescriptionEquipements } from "@/components/annonce-detail/DescriptionEquipements";
import { LocalisationSection } from "@/components/annonce-detail/LocalisationSection";
import { ProprietaireCard } from "@/components/annonce-detail/ProprietaireCard";
import { ListingCard } from "@/components/annonces/ListingCard";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import SignalementModal from "@/components/SignalementModal";
import { Button } from "@/components/ui/button";
import { useAnnonceContact } from "@/hooks/useAnnonceContact";
import { marquerAnnonceVue } from "@/lib/annoncesVues";
import { formatFcfa } from "@/lib/fcfa";

// Fiche annonce (planche « Fiche annonce, page entière ») en trois temps :
// au-dessus de la ligne de flottaison, pour décider, pour agir.

const DEUX_MINUTES_MS = 2 * 60 * 1000;
const CINQ_MINUTES_MS = 5 * 60 * 1000;
const NOMBRE_SIMILAIRES = 4;
const LONGUEUR_DESCRIPTION_OG = 160;

function FicheSquelette() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Chargement de l'annonce">
      <div className="aspect-[4/3] bg-surface lg:container lg:mt-6 lg:aspect-auto lg:h-[480px] lg:rounded-sheet" />
      <div className="container mt-6 space-y-3">
        <div className="h-6 w-24 rounded-full bg-surface" />
        <div className="h-8 w-3/4 rounded bg-surface" />
        <div className="h-5 w-1/2 rounded bg-surface" />
        <div className="h-10 w-2/3 rounded bg-surface" />
      </div>
    </div>
  );
}

function AnnonceIntrouvable() {
  return (
    <div className="container flex max-w-md flex-col items-center py-16 text-center">
      <div className="aspect-[4/3] w-60 overflow-hidden rounded-t-full">
        <PropertyIllustration kind="appartement" />
      </div>
      <h1 className="mt-6 text-h2 font-bold text-encre">Annonce introuvable</h1>
      <p className="mt-2 text-body-l text-texte2">Cette annonce a été retirée ou son lien est incomplet.</p>
      <Button asChild className="mt-6">
        <Link to="/annonces">Voir les annonces</Link>
      </Button>
    </div>
  );
}

export default function AnnonceDetail() {
  const { id } = useParams<{ id: string }>();
  const [signalementOuvert, setSignalementOuvert] = useState(false);

  const { data: bien, isLoading, isError } = useQuery({
    queryKey: ["annonce-publie", id],
    queryFn: () => fetchAnnoncePublique(id as string),
    enabled: Boolean(id),
    staleTime: DEUX_MINUTES_MS,
  });
  const { data: similaires = [] } = useQuery({
    queryKey: ["annonces-similaires", id],
    queryFn: () => fetchAnnoncesSimilaires(id as string, NOMBRE_SIMILAIRES),
    enabled: Boolean(id && bien),
    staleTime: CINQ_MINUTES_MS,
  });
  const contact = useAnnonceContact(bien);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  // Grise le marqueur de cette annonce sur la carte de recherche (« déjà vu »).
  useEffect(() => {
    if (bien) marquerAnnonceVue(bien.id);
  }, [bien]);

  if (isLoading) return <FicheSquelette />;
  if (isError || !bien) return <AnnonceIntrouvable />;

  const titre = bien.titre ?? "Annonce immobilière";
  const descriptionOg =
    bien.description?.slice(0, LONGUEUR_DESCRIPTION_OG) ??
    [bien.typeLogement?.nom, bien.quartier, bien.prix ? formatFcfa(bien.prix) : null].filter(Boolean).join(", ");

  return (
    <article className="pb-28 lg:pb-16">
      <Helmet>
        <title>{`${titre} | Seek`}</title>
        <meta name="description" content={descriptionOg} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={titre} />
        <meta property="og:description" content={descriptionOg} />
        {bien.photos[0] && <meta property="og:image" content={bien.photos[0]} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="lg:container lg:pt-6">
        <AnnonceGallery bien={bien} onShare={() => void contact.partager()} />
      </div>

      <div className="container mt-6 lg:mt-10 lg:grid lg:grid-cols-[1fr_380px] lg:gap-12">
        <div className="space-y-10">
          <AnnonceResume bien={bien} />
          <CaracteristiquesGrid bien={bien} />
          <DescriptionEquipements bien={bien} />
          <LocalisationSection bien={bien} />
          <div className="space-y-6">
            <ProprietaireCard bien={bien} onSignaler={() => setSignalementOuvert(true)} />
          </div>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <ContactCard bien={bien} contact={contact} />
          </div>
        </aside>
      </div>

      {similaires.length > 0 && (
        <section className="container mt-16" aria-labelledby="similaires-titre">
          <h2 id="similaires-titre" className="text-h2 font-bold text-encre">
            Annonces similaires
          </h2>
          <ul className="hide-scrollbar -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:px-0">
            {similaires.map((annonce) => (
              <li key={annonce.id} className="w-[280px] shrink-0 snap-start lg:w-auto">
                <ListingCard annonce={annonce} comparable={annonce} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <ContactBar bien={bien} contact={contact} />
      {signalementOuvert && <SignalementModal bien={bien} onClose={() => setSignalementOuvert(false)} />}
    </article>
  );
}
