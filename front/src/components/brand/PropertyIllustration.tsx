import { cn } from "@/lib/utils";
import { ILLUSTRATION_TINT, type IllustrationKind } from "@/components/brand/illustrationKind";

// Illustrations de la charte (planche « Icônes et illustrations ») redessinées en SVG :
// façades plates en deux couleurs, sans contour ni dégradé. Elles habillent catégories,
// états vides et annonces sans photo ; une annonce publiée garde ses vraies photos.

const C = {
  baobab: "#0A5C43",
  baobab900: "#084A36",
  baobab100: "#E3EFE9",
  soleil: "#FFC233",
  soleil100: "#FFF1CC",
  surface: "#F3F7F5",
  sable: "#F7E3A8",
  parcelle: "#CFE3D9",
};

function Baobab({ x, ground, scale = 1 }: { x: number; ground: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${ground}) scale(${scale})`} fill={C.baobab900}>
      <path d="M-6 0 L-4 -48 Q-14 -60 -26 -70 L-21 -75 Q-8 -64 0 -58 Q8 -64 21 -75 L26 -70 Q14 -60 4 -48 L6 0 Z" />
      <circle cx="-26" cy="-80" r="11" />
      <circle cx="-12" cy="-88" r="12" />
      <circle cx="4" cy="-89" r="12" />
      <circle cx="18" cy="-84" r="11" />
      <circle cx="29" cy="-78" r="10" />
    </g>
  );
}

function Appartement() {
  const rows = [83, 124, 166, 208];
  const cols = [145, 195, 245];
  const lit = new Set(["0-0", "0-2", "1-1", "1-2", "2-0", "2-1", "3-0", "3-2"]);
  return (
    <>
      <circle cx="318" cy="78" r="30" fill={C.soleil} />
      <rect x="244" y="40" width="34" height="20" fill={C.baobab900} />
      <rect x="122" y="58" width="182" height="12" fill={C.baobab900} />
      <rect x="128" y="70" width="170" height="190" fill={C.baobab} />
      {rows.map((y, r) => (
        <g key={y}>
          <rect x="136" y={y + 28} width="154" height="3" fill={C.baobab900} />
          {cols.map((x, c) => (
            <rect key={x} x={x} y={y} width="35" height="23" fill={lit.has(`${r}-${c}`) ? C.soleil : C.baobab100} />
          ))}
        </g>
      ))}
      <path d="M195 260 V232 A17.5 17.5 0 0 1 230 232 V260 Z" fill={C.soleil100} />
      <Baobab x={63} ground={260} />
    </>
  );
}

function Villa() {
  const slats = [455, 475, 495, 515, 535, 555];
  return (
    <>
      <circle cx="290" cy="102" r="58" fill={C.soleil} />
      <rect x="200" y="78" width="116" height="10" fill={C.baobab900} />
      <rect x="205" y="88" width="105" height="40" fill={C.baobab} />
      <path d="M222 125 V108 A11.5 11.5 0 0 1 245 108 V125 Z" fill={C.soleil100} />
      <path d="M262 125 V108 A11.5 11.5 0 0 1 285 108 V125 Z" fill={C.soleil100} />
      <rect x="78" y="120" width="244" height="11" fill={C.baobab900} />
      <rect x="85" y="131" width="230" height="76" fill={C.baobab} />
      <path d="M105 195 V162 A14 14 0 0 1 133 162 V195 Z" fill={C.soleil} />
      <path d="M150 195 V162 A14 14 0 0 1 178 162 V195 Z" fill={C.soleil} />
      <path d="M262 207 V166 A16.5 16.5 0 0 1 295 166 V207 Z" fill={C.soleil100} />
      <circle cx="355" cy="168" r="25" fill={C.baobab900} />
      <circle cx="333" cy="187" r="17" fill={C.baobab900} />
      <rect x="40" y="205" width="320" height="52" fill={C.baobab900} />
      {slats.map((x) => (
        <g key={x}>
          <rect x={x - 400} y="215" width="8" height="32" fill={C.baobab} />
          <rect x={x - 200} y="215" width="8" height="32" fill={C.baobab} />
        </g>
      ))}
      <rect x="185" y="205" width="48" height="52" fill={C.soleil} />
    </>
  );
}

function Studio() {
  return (
    <>
      <circle cx="92" cy="82" r="26" fill={C.soleil} />
      <rect x="238" y="54" width="36" height="6" fill={C.baobab900} />
      <rect x="242" y="60" width="28" height="26" fill={C.baobab900} />
      <rect x="144" y="84" width="140" height="12" fill={C.baobab900} />
      <rect x="150" y="96" width="128" height="164" fill={C.baobab} />
      <rect x="138" y="152" width="152" height="5" fill={C.baobab900} />
      <path d="M170 155 V126 A16.5 16.5 0 0 1 203 126 V155 Z" fill={C.soleil} />
      <path d="M225 155 V126 A16.5 16.5 0 0 1 258 126 V155 Z" fill={C.baobab100} />
      <path d="M170 230 V201 A16.5 16.5 0 0 1 203 201 V230 Z" fill={C.baobab100} />
      <path d="M225 260 V206 A16.5 16.5 0 0 1 258 206 V260 Z" fill={C.soleil100} />
      <Baobab x={332} ground={260} scale={0.8} />
    </>
  );
}

function Bureau() {
  const stripes = Array.from({ length: 9 }, (_, i) => 48 + i * 22);
  const litStripes = new Set([0, 4, 7]);
  const sideRows = [152, 174, 196, 218, 240];
  return (
    <>
      <circle cx="96" cy="92" r="34" fill={C.soleil} />
      <rect x="224" y="10" width="6" height="18" fill={C.baobab900} />
      <rect x="170" y="27" width="124" height="11" fill={C.baobab900} />
      <rect x="175" y="38" width="113" height="226" fill={C.baobab} />
      {stripes.map((y, i) => (
        <rect key={y} x="186" y={y} width="91" height="11" fill={litStripes.has(i) ? C.soleil : C.baobab100} />
      ))}
      <rect x="118" y="140" width="60" height="124" fill={C.baobab900} />
      {sideRows.map((y) => (
        <rect key={y} x="126" y={y} width="40" height="8" fill={C.baobab100} />
      ))}
      <rect x="288" y="170" width="58" height="94" fill={C.baobab900} />
      {sideRows.slice(1).map((y, i) => (
        <rect key={y} x="296" y={y + 10} width="40" height="8" fill={i === 1 ? C.soleil : C.baobab100} />
      ))}
      <path d="M214 264 V244 A18 18 0 0 1 250 244 V264 Z" fill={C.soleil100} />
    </>
  );
}

function Terrain() {
  const stakes: [number, number][] = [
    [120, 205],
    [330, 205],
    [60, 283],
    [370, 283],
  ];
  return (
    <>
      <rect x="0" y="190" width="400" height="110" fill={C.baobab100} />
      <circle cx="300" cy="92" r="40" fill={C.soleil} />
      <polygon points="120,205 330,205 370,283 60,283" fill={C.parcelle} />
      {stakes.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x - 4} y={y - 20} width="8" height="18" fill={C.soleil} />
          <rect x={x - 7} y={y - 2} width="14" height="4" fill={C.baobab900} />
        </g>
      ))}
      <rect x="215" y="150" width="4" height="56" fill={C.baobab900} />
      <rect x="186" y="118" width="62" height="38" rx="3" fill={C.baobab} />
      <path d="M210 148 V134 A7 7 0 0 1 224 134 V148 Z" fill={C.soleil} />
      <Baobab x={95} ground={190} scale={0.75} />
    </>
  );
}

const SCENES: Record<IllustrationKind, () => JSX.Element> = {
  appartement: Appartement,
  villa: Villa,
  studio: Studio,
  bureau: Bureau,
  terrain: Terrain,
};

interface PropertyIllustrationProps {
  kind: IllustrationKind;
  className?: string;
  /** Cadrage : "contain" garde toute la scène, "cover" remplit une vignette 4:3. */
  fit?: "contain" | "cover";
}

export function PropertyIllustration({ kind, className, fit = "cover" }: PropertyIllustrationProps) {
  const Scene = SCENES[kind];
  const soleil = ILLUSTRATION_TINT[kind] === "soleil";
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio={fit === "cover" ? "xMidYMax slice" : "xMidYMax meet"}
      className={cn("block h-full w-full", className)}
      aria-hidden
      focusable="false"
    >
      <rect width="400" height="300" fill={soleil ? C.soleil100 : C.surface} />
      {kind !== "terrain" && (
        <rect x="0" y={kind === "bureau" ? 262 : kind === "villa" ? 255 : 258} width="400" height="50" fill={soleil ? C.sable : C.baobab100} />
      )}
      <Scene />
    </svg>
  );
}
