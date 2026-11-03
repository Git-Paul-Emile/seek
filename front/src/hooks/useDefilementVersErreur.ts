import { useEffect } from "react";

// À l'envoi d'un formulaire, si des erreurs apparaissent, la page défile jusqu'à la première
// et le curseur se place dans le champ concerné. Les erreurs du site sont signalées par
// aria-invalid sur le champ ou par role="alert" (FieldError, erreur serveur) : un seul
// comportement pour tous les formulaires, sans les modifier un par un.

const SELECTEUR_ERREUR = '[aria-invalid="true"], [role="alert"]';
// Les validations asynchrones (zod via react-hook-form) affichent leurs erreurs un peu après l'envoi.
const ATTENTE_MAX_MS = 1500;
// Erreur déjà affichée et inchangée au nouvel envoi : aucune mutation, on vérifie une fois.
const VERIFICATION_DIFFEREE_MS = 120;

const champDe = (form: HTMLFormElement, erreur: Element): HTMLElement | null => {
  if (erreur instanceof HTMLElement && erreur.matches("input, select, textarea")) return erreur;
  return erreur.id ? form.querySelector<HTMLElement>(`[aria-describedby~="${CSS.escape(erreur.id)}"]`) : null;
};

const allerALaPremiereErreur = (form: HTMLFormElement) => {
  const erreur = form.querySelector(SELECTEUR_ERREUR);
  if (!erreur) return false;
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  erreur.scrollIntoView({ behavior: reduit ? "auto" : "smooth", block: "center" });
  champDe(form, erreur)?.focus({ preventScroll: true });
  return true;
};

export function useDefilementVersErreur() {
  useEffect(() => {
    const surEnvoi = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const observateur = new MutationObserver(() => {
        if (allerALaPremiereErreur(form)) observateur.disconnect();
      });
      observateur.observe(form, { subtree: true, childList: true, attributes: true, attributeFilter: ["aria-invalid", "role"] });
      window.setTimeout(() => {
        if (allerALaPremiereErreur(form)) observateur.disconnect();
      }, VERIFICATION_DIFFEREE_MS);
      window.setTimeout(() => observateur.disconnect(), ATTENTE_MAX_MS);
    };
    document.addEventListener("submit", surEnvoi, true);
    return () => document.removeEventListener("submit", surEnvoi, true);
  }, []);
}
