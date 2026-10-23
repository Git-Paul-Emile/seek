import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import type { FavoriItem } from "@/api/favori";
import { ListingCard, ListingCardSkeleton } from "@/components/annonces/ListingCard";
import { EmptyState } from "@/components/brand/EmptyState";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useFavoris } from "@/hooks/useFavoris";
import { useFavorisList, useRemoveFavori } from "@/hooks/useFavorisList";
import { usePublicSession } from "@/hooks/usePublicSession";

// Mes favoris : les annonces gardées, celles retirées depuis restent visibles et grisées
// pour que le visiteur comprenne pourquoi elles ne sont plus consultables.

const SQUELETTES = 4;

function FavoriRetire({ item }: { item: FavoriItem }) {
  const retirer = useRemoveFavori();
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none opacity-50 grayscale">
        <ListingCard annonce={item.bien} />
      </div>
      <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-2">
        <StatusBadge tone="arret">Annonce retirée</StatusBadge>
        <Button
          size="icon-sm"
          variant="inverse"
          onClick={() => retirer.mutate(item.bienId)}
          disabled={retirer.isPending}
          aria-label={`Retirer ${item.bien.titre ?? "cette annonce"} de vos favoris`}
          className="shadow-card"
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export default function FavorisPage() {
  const { isAuthenticated, idsLoaded } = useFavoris();
  const { data: favoris = [], isLoading, isError } = useFavorisList();
  const session = usePublicSession();
  const total = favoris.length;

  return (
    <div className="container py-8 lg:py-12">
      <h1 className="text-h1 font-bold text-encre">Mes favoris</h1>
      {isAuthenticated && !isLoading && total > 0 && (
        <p className="mt-1 text-body-l text-texte2">
          {total} annonce{total > 1 ? "s" : ""} gardée{total > 1 ? "s" : ""}
        </p>
      )}

      {idsLoaded && !isAuthenticated && (
        <EmptyState
          titre="Gardez les annonces qui vous plaisent"
          texte="Créez un compte gratuit ou connectez-vous : vos favoris vous suivent sur votre téléphone et votre ordinateur."
          action={<Button onClick={session.openConnexion}>Se connecter ou créer un compte</Button>}
        />
      )}

      {isAuthenticated && isError && (
        <EmptyState
          titre="Vos favoris n'ont pas pu être chargés"
          texte="Vérifiez votre connexion internet, puis rechargez la page."
          action={<Button variant="outline" onClick={() => window.location.reload()}>Recharger</Button>}
        />
      )}

      {isAuthenticated && !isLoading && !isError && total === 0 && (
        <EmptyState
          titre="Aucun favori pour l'instant"
          texte="Touchez le cœur d'une annonce pour la retrouver ici."
          illustration="villa"
          action={
            <Button asChild>
              <Link to="/annonces">Voir les annonces</Link>
            </Button>
          }
        />
      )}

      {isAuthenticated && (isLoading || total > 0) && (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: SQUELETTES }, (_, i) => (
                <li key={i}>
                  <ListingCardSkeleton />
                </li>
              ))
            : favoris.map((item) => (
                <li key={item.id}>
                  {item.bienSuppr ? <FavoriRetire item={item} /> : <ListingCard annonce={item.bien} comparable={item.bien} />}
                </li>
              ))}
        </ul>
      )}
    </div>
  );
}
