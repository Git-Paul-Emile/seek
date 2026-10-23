import { Check, CircleDashed, Hourglass, Star, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Charte, planche « Statuts » : toujours un mot et une icône, lisible même sans la couleur.
// Pas de rouge : l'alerte est en Soleil plein avec le triangle.
export type StatusTone = "positif" | "attente" | "alerte" | "arret" | "neutre" | "premium";

const TONES: Record<StatusTone, { icon: LucideIcon; className: string }> = {
  positif: { icon: Check, className: "bg-baobab-100 text-baobab" },
  attente: { icon: Hourglass, className: "bg-soleil-100 text-encre" },
  alerte: { icon: TriangleAlert, className: "bg-soleil text-encre" },
  arret: { icon: X, className: "border-[1.5px] border-encre bg-white text-encre" },
  neutre: { icon: CircleDashed, className: "bg-surface text-texte2" },
  premium: { icon: Star, className: "bg-encre text-soleil" },
};

interface StatusBadgeProps {
  tone: StatusTone;
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ tone, children, size = "md", className }: StatusBadgeProps) {
  const { icon: Icon, className: toneClassName } = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold",
        size === "md" ? "h-8 px-3 text-body-m" : "h-6 px-2 text-caption",
        toneClassName,
        className,
      )}
    >
      <Icon aria-hidden className={size === "md" ? "size-4" : "size-3.5"} strokeWidth={2} />
      {children}
    </span>
  );
}
