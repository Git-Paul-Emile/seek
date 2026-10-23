import { Clock, ShieldCheck, type LucideIcon } from "lucide-react";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrustScore {
  total: number;
  badges: ("identite_verifiee" | "anciennete_1an")[];
  nbAnnonces: number;
  moisAnciennete: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Pas de rouge (planche « Statuts ») : un score faible reste neutre, jamais alarmant.
const SEUIL_TRES_FIABLE = 75;
const SEUIL_FIABLE = 50;
const SEUIL_PEU_VERIFIE = 25;

const tonScore = (score: number): StatusTone =>
  score >= SEUIL_TRES_FIABLE ? "positif" : score >= SEUIL_FIABLE ? "attente" : "neutre";

function getScoreLabel(score: number) {
  if (score >= SEUIL_TRES_FIABLE) return "Très fiable";
  if (score >= SEUIL_FIABLE) return "Fiable";
  if (score >= SEUIL_PEU_VERIFIE) return "Peu vérifié";
  return "Non vérifié";
}

const BADGE_META: Record<TrustScore["badges"][number], { icon: LucideIcon; label: string }> = {
  identite_verifiee: { icon: ShieldCheck, label: "Identité vérifiée" },
  anciennete_1an: { icon: Clock, label: "Inscrit depuis plus d'un an" },
};

// ─── Composant compact (pour cartes / sidebar) ────────────────────────────────

export function TrustScoreCompact({ score }: { score: TrustScore }) {
  return (
    <StatusBadge tone={tonScore(score.total)} size="sm">
      {score.total}/100 · {getScoreLabel(score.total)}
    </StatusBadge>
  );
}

// ─── Composant complet (pour profil / détail) ─────────────────────────────────

export function TrustScoreFull({ score }: { score: TrustScore }) {
  return (
    <section aria-label="Score de confiance" className="space-y-4 rounded-card border border-filet bg-white p-5">
      <div className="grid grid-cols-[1fr_auto] items-baseline gap-3">
        <h3 className="text-title font-semibold text-encre">Score de confiance</h3>
        <p className="font-display text-h2 font-bold tabular-nums text-encre">
          {score.total}
          <span className="text-body-m font-normal text-texte2">/100</span>
        </p>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface" aria-hidden>
        <div className="h-full rounded-full bg-baobab" style={{ width: `${score.total}%` }} />
      </div>
      <StatusBadge tone={tonScore(score.total)} size="sm">
        {getScoreLabel(score.total)}
      </StatusBadge>
      {score.badges.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {score.badges.map((badge) => {
            const { icon: Icon, label } = BADGE_META[badge];
            return (
              <li key={badge} className="inline-flex items-center gap-1.5 rounded-full bg-baobab-100 px-3 py-1 text-caption font-semibold text-baobab">
                <Icon aria-hidden className="size-3.5" />
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─── Export par défaut = compact ─────────────────────────────────────────────

export default TrustScoreCompact;
