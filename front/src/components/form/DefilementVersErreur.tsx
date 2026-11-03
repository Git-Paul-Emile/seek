import { useDefilementVersErreur } from "@/hooks/useDefilementVersErreur";

/** Monté une fois dans App : défilement vers la première erreur de tout formulaire envoyé. */
export default function DefilementVersErreur() {
  useDefilementVersErreur();
  return null;
}
