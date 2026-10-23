import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Carte de chiffre clé (charte, planche 24) : tuile d'icône, libellé, valeur, ligne de contexte.
// La variante « alerte » passe en Soleil plein avec la tuile encre, comme les loyers en retard.

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  /** Unité affichée en petit après la valeur (« FCFA »). */
  unit?: React.ReactNode;
  footer?: React.ReactNode;
  tone?: "neutre" | "alerte";
}

export function KpiCard({ icon: Icon, label, value, unit, footer, tone = "neutre" }: KpiCardProps) {
  const alerte = tone === "alerte";
  return (
    <section
      aria-label={label}
      className={cn(
        "flex min-w-0 flex-col rounded-card p-5",
        alerte ? "bg-soleil text-encre" : "border border-filet bg-white",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-control",
            alerte ? "bg-encre text-soleil" : "bg-baobab-100 text-baobab",
          )}
        >
          <Icon aria-hidden className="size-5" strokeWidth={1.75} />
        </span>
        <h2 className={cn("text-body-m", alerte ? "font-semibold" : "text-texte2")}>{label}</h2>
      </div>
      <p className="mt-5 flex flex-wrap items-baseline gap-x-2 font-display text-price-l font-bold text-encre">
        {value}
        {unit ? <span className="font-body text-body-l font-semibold tracking-normal">{unit}</span> : null}
      </p>
      {footer ? <div className="mt-4 text-body-m text-texte2">{footer}</div> : null}
    </section>
  );
}
