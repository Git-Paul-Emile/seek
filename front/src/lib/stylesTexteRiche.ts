// Mise en forme d'un texte riche (HTML de l'éditeur, contrats) aux tailles de la charte :
// titres, listes et paragraphes, sans le plugin typography (les pages légales, elles, utilisent prose).

export const STYLES_TEXTE_RICHE = [
  "text-body-l text-encre",
  "[&_.ProseMirror]:outline-none [&_p]:my-2",
  "[&_h1]:mb-3 [&_h1]:mt-4 [&_h1]:font-display [&_h1]:text-h2 [&_h1]:font-bold",
  "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-h3 [&_h2]:font-semibold",
  "[&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-title [&_h3]:font-semibold",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_strong]:font-semibold",
].join(" ");
