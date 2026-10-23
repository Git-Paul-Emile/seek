import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Tailles de l'échelle typographique de la charte (tailwind.config.ts).
// Sans cette déclaration, tailwind-merge confond `text-h2` avec une couleur
// et supprime l'une des deux classes quand on écrit `text-h2 text-encre`.
const CHARTE_FONT_SIZES = [
  "display-xl",
  "display",
  "display-m",
  "h1",
  "h2",
  "h3",
  "price-l",
  "title",
  "price",
  "body-l",
  "body-m",
  "caption",
  "overline",
  "ref",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: CHARTE_FONT_SIZES }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
