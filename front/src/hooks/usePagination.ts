import { useState, useMemo, useEffect } from "react";

const PAGE_SIZE   = 10;
const WINDOW_SIZE = 5;

export interface PaginationState {
  page:       number;
  totalPages: number;
  pageWindow: number[];
  goTo:       (p: number) => void;
  goNext:     () => void;
  goPrev:     () => void;
  reset:      () => void;
}

/** Numéros de page affichés autour de la page courante. */
export function fenetrePages(page: number, totalPages: number, windowSize = WINDOW_SIZE): number[] {
  const half  = Math.floor(windowSize / 2);
  let   start = Math.max(1, page - half);
  let   end   = start + windowSize - 1;
  if (end > totalPages) {
    end   = totalPages;
    start = Math.max(1, end - windowSize + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Pagination faite par le serveur : la page vit dans l'état du composant parent. */
export function paginationServeur(page: number, totalPages: number, setPage: (page: number) => void): PaginationState {
  const goTo = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));
  return {
    page,
    totalPages,
    pageWindow: fenetrePages(page, totalPages),
    goTo,
    goNext: () => goTo(page + 1),
    goPrev: () => goTo(page - 1),
    reset: () => setPage(1),
  };
}

export function usePagination<T>(
  items: T[],
  pageSize   = PAGE_SIZE,
  windowSize = WINDOW_SIZE,
): PaginationState & { pageItems: T[] } {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage   = Math.min(page, totalPages);

  // Clamp when items shrink (e.g. after a delete or filter change)
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  const pageWindow = useMemo(() => fenetrePages(safePage, totalPages, windowSize), [safePage, totalPages, windowSize]);

  const goTo   = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));
  const goNext = () => goTo(safePage + 1);
  const goPrev = () => goTo(safePage - 1);
  const reset  = () => setPage(1);

  return { page: safePage, totalPages, pageWindow, pageItems, goTo, goNext, goPrev, reset };
}
