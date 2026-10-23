import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationState } from "@/hooks/usePagination";
import { cn } from "@/lib/utils";

// Pagination de la charte (planche « Admin : modération ») : « 1 à 30 sur 128 », flèches encadrées.

interface Props extends PaginationState {
  total: number;
  pageSize: number;
}

const flecheClass =
  "flex size-10 shrink-0 items-center justify-center rounded-control border border-bord-champ bg-white text-encre transition-colors duration-hover hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40";

export default function Pagination({ page, totalPages, pageWindow, total, pageSize, goTo, goNext, goPrev }: Props) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 py-4">
      <p className="tabular text-body-m text-texte2">
        {from} à {to} sur {total}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" onClick={goPrev} disabled={page === 1} aria-label="Page précédente" className={flecheClass}>
          <ChevronLeft aria-hidden className="size-5" />
        </button>
        {pageWindow.map((numero) => (
          <button
            key={numero}
            type="button"
            onClick={() => goTo(numero)}
            aria-current={numero === page ? "page" : undefined}
            aria-label={`Page ${numero}`}
            className={cn(
              "tabular flex size-10 shrink-0 items-center justify-center rounded-control text-body-m font-semibold transition-colors duration-hover",
              numero === page ? "bg-baobab text-white" : "text-encre hover:bg-surface",
            )}
          >
            {numero}
          </button>
        ))}
        <button type="button" onClick={goNext} disabled={page === totalPages} aria-label="Page suivante" className={flecheClass}>
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>
    </nav>
  );
}
