/** Composants skeleton réutilisables - remplacent les spinners Loader2 sur les chargements de contenu */

// ─── Base ──────────────────────────────────────────────────────────────────────

export function Sk({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`bg-filet animate-pulse rounded-lg ${className}`} style={style} />;
}

// ─── Lignes de tableau ─────────────────────────────────────────────────────────

export function SkTableRows({ rows = 6 }: { rows?: number }) {
  const WIDTHS = ["w-20", "flex-1", "w-28", "w-20", "w-14"];
  return (
    <div className="divide-y divide-filet">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          {WIDTHS.map((w, j) => (
            <Sk key={j} className={`h-4 shrink-0 ${w === "flex-1" ? "flex-1" : w}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Cartes KPI (dashboard) ────────────────────────────────────────────────────

export function SkKpiCards({
  count = 4,
  cols = "grid-cols-2 lg:grid-cols-4",
}: {
  count?: number;
  cols?: string;
}) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-card border border-filet p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sk className="h-5 w-5 rounded-full shrink-0" />
            <Sk className="h-3 w-28" />
          </div>
          <Sk className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

// ─── Bloc graphique ────────────────────────────────────────────────────────────

export function SkChartBlock({ height = "h-60" }: { height?: string }) {
  return (
    <div className="bg-white rounded-card border border-filet p-5 space-y-3">
      <Sk className="h-3 w-40" />
      <Sk className={`w-full ${height}`} />
    </div>
  );
}

// ─── Page de détail (sections empilées) ───────────────────────────────────────

export function SkDetailSections({ sections = 3 }: { sections?: number }) {
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="bg-white rounded-card border border-filet p-5 space-y-3">
        <Sk className="h-5 w-48" />
        <Sk className="h-4 w-64" />
        <Sk className="h-4 w-32" />
      </div>
      {/* Sections */}
      {Array.from({ length: sections }).map((_, i) => (
        <div key={i} className="bg-white rounded-card border border-filet p-5 space-y-3">
          <Sk className="h-3 w-24" />
          {[100, 80, 90, 70].map((w, j) => (
            <Sk key={j} className="h-4" style={{ width: `${w}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Éléments de liste simple ──────────────────────────────────────────────────

export function SkListItems({
  items = 4,
  itemHeight = "h-16",
}: {
  items?: number;
  itemHeight?: string;
}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <Sk key={i} className={`${itemHeight} w-full rounded-card`} />
      ))}
    </div>
  );
}

// ─── Grille de cartes propriété (public) ──────────────────────────────────────

export function SkPropertyCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-card overflow-hidden border border-filet">
          <Sk className="h-48 w-full rounded-none" />
          <div className="p-4 space-y-2">
            <Sk className="h-4 w-3/4" />
            <Sk className="h-3 w-1/2" />
            <Sk className="h-5 w-1/3 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Squelette de formulaire ───────────────────────────────────────────────────

export function SkForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="bg-white rounded-card border border-filet p-6 space-y-5">
      <Sk className="h-5 w-36 mb-2" />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Sk className="h-3 w-24" />
          <Sk className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Cartes mobile (remplacement de tableau) ──────────────────────────────────

export function SkMobileCards({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-card border border-filet p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Sk className="h-4 w-32" />
            <Sk className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <Sk className="h-3 w-full" />
            <Sk className="h-3 w-2/3" />
          </div>
          <Sk className="h-10 w-full rounded-control" />
        </div>
      ))}
    </div>
  );
}
