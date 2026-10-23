import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { getLocataireDocumentsBienApi, type DocumentBienLocataire } from "@/api/locataireAuth";
import { SkListItems } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/brand/EmptyState";
import { formatDateLongue } from "@/lib/dates";

// Documents du logement partagés par le propriétaire.

const TYPE_LABELS: Record<string, string> = {
  ACTE_PROPRIETE: "Acte de propriété",
  PLAN_CADASTRAL: "Plan cadastral",
  PERMIS_CONSTRUIRE: "Permis de construire",
  AUTRE: "Autre document",
};

const OCTETS_PAR_KO = 1024;
const OCTETS_PAR_MO = OCTETS_PAR_KO * OCTETS_PAR_KO;

const formatTaille = (octets: number | null) => {
  if (!octets) return null;
  if (octets < OCTETS_PAR_KO) return `${octets} o`;
  if (octets < OCTETS_PAR_MO) return `${Math.round(octets / OCTETS_PAR_KO)} Ko`;
  return `${(octets / OCTETS_PAR_MO).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
};

function LigneDocument({ document }: { document: DocumentBienLocataire }) {
  const meta = [TYPE_LABELS[document.type] ?? document.type, formatTaille(document.taille), formatDateLongue(document.createdAt)]
    .filter(Boolean)
    .join(" · ");
  return (
    <li className="grid min-h-[72px] grid-cols-[auto_1fr_auto] items-center gap-4 py-3">
      <span className="flex size-11 items-center justify-center rounded-control bg-baobab-100 text-baobab">
        <FileText aria-hidden className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-title font-semibold text-encre">{document.nom}</p>
        <p className="text-body-m text-texte2">{meta}</p>
      </div>
      <a
        href={document.url}
        target="_blank"
        rel="noopener noreferrer"
        download
        aria-label={`Télécharger ${document.nom}`}
        title="Télécharger"
        className="flex size-11 items-center justify-center rounded-control bg-surface text-encre transition-colors duration-hover hover:bg-baobab-100"
      >
        <Download aria-hidden className="size-5" />
      </a>
    </li>
  );
}

export default function DocumentsBien() {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["locataire-documents-bien"],
    queryFn: getLocataireDocumentsBienApi,
  });

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">Documents</h1>
        <p className="mt-1 text-body-l text-texte2">
          Les documents du logement partagés par votre propriétaire. Pour un document manquant, demandez-le-lui directement.
        </p>
      </header>
      {isLoading ? (
        <SkListItems items={4} itemHeight="h-20" />
      ) : documents.length === 0 ? (
        <EmptyState titre="Aucun document partagé" texte="Votre propriétaire n'a pas encore partagé de document sur ce logement." />
      ) : (
        <ul className="divide-y divide-filet rounded-card bg-white px-4 lg:px-6">
          {documents.map((document) => (
            <LigneDocument key={document.id} document={document} />
          ))}
        </ul>
      )}
    </div>
  );
}
