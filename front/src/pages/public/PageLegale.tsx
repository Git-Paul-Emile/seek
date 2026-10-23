import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { fetchPageLegaleBySlug } from "@/api/pageLegale";
import { EmptyState } from "@/components/brand/EmptyState";
import { formatDateLongue } from "@/lib/dates";

// Pages légales (confidentialité, conditions d'utilisation, conformité) : contenu rédigé dans
// l'admin, mis en forme avec la typographie de la charte.

const SLUG_PAR_CHEMIN: Record<string, string> = {
  "/politique-confidentialite": "politique-confidentialite",
  "/conditions-utilisation": "conditions-utilisation",
  "/conformite-donnees": "conformite-donnees",
};

const CINQ_MINUTES_MS = 5 * 60 * 1000;

// Styles du texte riche saisi dans l'admin (titres, listes, tableaux, liens).
const PROSE =
  "prose max-w-none prose-headings:font-display prose-headings:text-encre prose-h2:mt-10 prose-h2:text-h2 prose-h3:text-h3 " +
  "prose-p:text-body-l prose-p:text-encre prose-li:text-body-l prose-li:text-encre prose-strong:text-encre " +
  "prose-a:font-semibold prose-a:text-baobab prose-table:text-body-m prose-th:bg-surface prose-th:px-4 prose-th:py-3 " +
  "prose-th:text-left prose-th:text-overline prose-th:uppercase prose-th:text-texte2 prose-td:border-t prose-td:border-filet prose-td:px-4 prose-td:py-3 " +
  "[&>h2:first-child]:mt-0";

export default function PageLegale() {
  const { pathname } = useLocation();
  const slug = SLUG_PAR_CHEMIN[pathname] ?? "";

  const { data: page, isLoading, isError } = useQuery({
    queryKey: ["page-legale", slug],
    queryFn: () => fetchPageLegaleBySlug(slug),
    enabled: Boolean(slug),
    staleTime: CINQ_MINUTES_MS,
  });

  if (!slug || isError || (page && !page.publie)) {
    return (
      <div className="container">
        <EmptyState
          titreNiveau="h1"
          titre={isError ? "Cette page n'a pas pu être chargée" : "Page bientôt disponible"}
          texte={isError ? "Vérifiez votre connexion internet, puis rechargez la page." : "Ce document est en cours de rédaction par notre équipe."}
        />
      </div>
    );
  }

  return (
    <article className="container max-w-3xl py-10 lg:py-16">
      {isLoading ? (
        <div className="space-y-4" aria-label="Chargement du document">
          <div className="h-10 w-2/3 animate-pulse rounded bg-surface" />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-surface" />
          ))}
        </div>
      ) : (
        <>
          <header className="border-b border-filet pb-6">
            <h1 className="text-h1 font-bold text-encre">{page?.titre ?? "Document légal"}</h1>
            <p className="mt-2 text-body-m text-texte2">
              {[page?.version ? `Version ${page.version}` : null, page?.updatedAt ? `mise à jour le ${formatDateLongue(page.updatedAt)}` : null]
                .filter(Boolean)
                .join(", ")}
            </p>
          </header>
          {/* Contenu HTML saisi par l'équipe Seek dans l'admin (pages légales). */}
          <div className={`${PROSE} mt-8`} dangerouslySetInnerHTML={{ __html: page?.contenu ?? "" }} />
          <footer className="mt-12 rounded-card bg-surface p-5 text-body-m text-encre">
            Seek applique la loi n° 2008-12 sur la protection des données personnelles au Sénégal. Pour toute réclamation,
            vous pouvez saisir la Commission de protection des données personnelles :{" "}
            <a href="https://cdp.sn" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-baobab underline-offset-4 hover:underline">
              cdp.sn
              <ExternalLink aria-hidden className="size-4" />
            </a>
          </footer>
        </>
      )}
    </article>
  );
}
