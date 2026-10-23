import { useId } from "react";
import { cn } from "@/lib/utils";

// Hero de la charte : Dakar vue à travers la porte (l'arche, motif signature).
// Redessiné en SVG d'après la planche d'accueil, mêmes couleurs que le logo.

const C = {
  baobab: "#0A5C43",
  baobab900: "#084A36",
  baobab100: "#E3EFE9",
  soleil: "#FFC233",
  surface: "#F3F7F5",
};

interface Building {
  x: number;
  top: number;
  width: number;
  dark?: boolean;
  /** Fenêtres allumées, repérées par "ligne-colonne". */
  lit: string[];
}

interface Composition {
  width: number;
  height: number;
  ground: number;
  sun: { cx: number; cy: number; r: number };
  buildings: Building[];
  /** Porte jaune au pied d'un immeuble, comme sur la maquette mobile. */
  door?: { x: number; width: number; height: number };
}

const WINDOW_W = 36;
const WINDOW_H = 45;
const WINDOW_STEP_Y = 84;
const WINDOW_GAP_X = 30;
const WINDOW_COLUMNS = 2;
const SLAB_H = 21;
const SLAB_OVERHANG = 9;

// Portrait : planche « Accueil desktop : le hero ».
const PORTRAIT: Composition = {
  width: 900,
  height: 1240,
  ground: 950,
  sun: { cx: 570, cy: 275, r: 180 },
  buildings: [
    { x: -30, top: 322, width: 195, lit: ["0-1", "3-0", "4-1"] },
    { x: 195, top: 383, width: 225, dark: true, lit: ["0-0", "1-1", "4-0"] },
    { x: 450, top: 203, width: 180, lit: ["1-0", "2-1", "5-0", "6-1"] },
    { x: 660, top: 443, width: 260, lit: ["1-0", "2-1"] },
  ],
};

// Panoramique : planche « Accueil mobile », arche large au-dessus du formulaire.
const PANORAMA: Composition = {
  width: 1430,
  height: 720,
  ground: 560,
  sun: { cx: 1120, cy: 190, r: 100 },
  buildings: [
    { x: 100, top: 270, width: 135, lit: ["0-1", "2-0"] },
    { x: 250, top: 300, width: 110, dark: true, lit: ["1-0"] },
    { x: 375, top: 220, width: 145, lit: ["0-0", "2-1", "3-0"] },
    { x: 535, top: 330, width: 120, lit: ["1-1"] },
    { x: 670, top: 260, width: 120, lit: ["0-1", "2-0"] },
    { x: 805, top: 300, width: 130, dark: true, lit: ["1-0", "2-1"] },
    { x: 950, top: 200, width: 120, lit: ["1-0", "3-1"] },
    { x: 1085, top: 290, width: 140, lit: ["0-1", "2-1"] },
    { x: 1240, top: 330, width: 100, lit: ["0-0"] },
  ],
  door: { x: 593, width: 40, height: 110 },
};

function windowsFor(building: Building, ground: number) {
  const blockWidth = WINDOW_COLUMNS * WINDOW_W + (WINDOW_COLUMNS - 1) * WINDOW_GAP_X;
  const startX = building.x + (building.width - blockWidth) / 2;
  const rows = Math.max(1, Math.floor((ground - building.top - 120) / WINDOW_STEP_Y));
  const lit = new Set(building.lit);
  return Array.from({ length: rows * WINDOW_COLUMNS }, (_, index) => {
    const row = Math.floor(index / WINDOW_COLUMNS);
    const column = index % WINDOW_COLUMNS;
    return {
      key: `${row}-${column}`,
      x: startX + column * (WINDOW_W + WINDOW_GAP_X),
      y: building.top + 40 + row * WINDOW_STEP_Y,
      fill: lit.has(`${row}-${column}`) ? C.soleil : C.baobab100,
    };
  });
}

interface DakarSkylineProps {
  variant?: "portrait" | "panorama";
  className?: string;
}

export function DakarSkyline({ variant = "portrait", className }: DakarSkylineProps) {
  const clipId = useId();
  const scene = variant === "portrait" ? PORTRAIT : PANORAMA;
  const { width, height, ground } = scene;
  const radius = width / 2;
  const archPath =
    variant === "portrait"
      ? `M0 ${height} V${radius} A${radius} ${radius} 0 0 1 ${width} ${radius} V${height} Z`
      : `M0 ${height} V360 A${radius} 360 0 0 1 ${width} 360 V${height} Z`;
  const dashRows = [ground + 60, ground + 126, ground + 192];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("block h-auto w-full", className)}
      aria-hidden
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={archPath} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={width} height={height} fill={C.surface} />
        <circle cx={scene.sun.cx} cy={scene.sun.cy} r={scene.sun.r} fill={C.soleil} />
        {scene.buildings.map((building) => (
          <g key={building.x}>
            <rect
              x={building.x - SLAB_OVERHANG}
              y={building.top - SLAB_H}
              width={building.width + SLAB_OVERHANG * 2}
              height={SLAB_H}
              fill={C.baobab900}
            />
            <rect
              x={building.x}
              y={building.top}
              width={building.width}
              height={ground - building.top}
              fill={building.dark ? C.baobab900 : C.baobab}
            />
            {windowsFor(building, ground).map((w) => (
              <rect key={w.key} x={w.x} y={w.y} width={WINDOW_W} height={WINDOW_H} rx="3" fill={w.fill} />
            ))}
          </g>
        ))}
        {scene.door && (
          <path
            d={`M${scene.door.x} ${ground} V${ground - scene.door.height + scene.door.width / 2} A${scene.door.width / 2} ${scene.door.width / 2} 0 0 1 ${scene.door.x + scene.door.width} ${ground - scene.door.height + scene.door.width / 2} V${ground} Z`}
            fill={C.soleil}
          />
        )}
        <rect x="0" y={ground} width={width} height={height - ground} fill={C.baobab} />
        {dashRows.map((y, row) =>
          Array.from({ length: Math.ceil(width / 240) + 1 }, (_, i) => (
            <rect
              key={`${row}-${i}`}
              x={i * 240 + (row % 2) * 110 - 40}
              y={y}
              width="60"
              height="8"
              rx="4"
              fill={C.baobab900}
            />
          )),
        )}
      </g>
    </svg>
  );
}
