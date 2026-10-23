import logoPrincipal from "@/assets/brand/seek-logo.svg";
import logoBlanc from "@/assets/brand/seek-logo-blanc.svg";
import symbole from "@/assets/brand/seek-symbole.svg";
import symboleBlanc from "@/assets/brand/seek-symbole-blanc.svg";
import { cn } from "@/lib/utils";

// Déclinaisons de docs/refonte/Logos/README.md.
// principal : sur blanc ou surface. blanc et symbole-blanc : sur Baobab, Baobab 900 ou encre.
const LOGO_SOURCES = {
  principal: logoPrincipal,
  blanc: logoBlanc,
  symbole,
  "symbole-blanc": symboleBlanc,
} as const;

// Rapport largeur / hauteur des viewBox SVG, pour réserver la place et éviter le décalage de mise en page.
const LOGO_RATIOS = {
  principal: 2951 / 737,
  blanc: 2951 / 737,
  symbole: 518 / 723,
  "symbole-blanc": 518 / 723,
} as const;

export type LogoVariant = keyof typeof LOGO_SOURCES;

interface LogoProps {
  variant?: LogoVariant;
  /** Hauteur en pixels. Le logo complet ne descend pas sous 72 px de large (18 px de haut). */
  height?: number;
  className?: string;
}

export function Logo({ variant = "principal", height = 32, className }: LogoProps) {
  return (
    <img
      src={LOGO_SOURCES[variant]}
      alt="Seek"
      height={height}
      width={Math.round(height * LOGO_RATIOS[variant])}
      className={cn("block shrink-0", className)}
      style={{ height, width: "auto" }}
    />
  );
}
