import { toast } from "sonner";
import type { Bien } from "@/api/bien";

// Liens de contact et partage d'une annonce : appel, WhatsApp, e-mail, partage natif du téléphone.

const MESSAGE_VISITE = (titre: string) =>
  `Bonjour, je vous contacte pour l'annonce « ${titre} » vue sur Seek. Est-il possible d'organiser une visite ?`;

export function useAnnonceContact(bien: Bien | undefined) {
  const telephone = bien?.proprietaire?.telephone?.replace(/\s/g, "") ?? null;
  const titre = bien?.titre ?? "votre bien";

  const partager = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: bien?.titre ?? "Annonce Seek", url });
        return;
      } catch {
        // Partage annulé par l'utilisateur : rien à signaler.
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast("Lien de l'annonce copié");
    } catch {
      toast("Le lien n'a pas pu être copié. Copiez l'adresse dans la barre du navigateur.");
    }
  };

  return {
    appelHref: telephone ? `tel:${telephone}` : null,
    whatsappHref: telephone
      ? `https://wa.me/${telephone.replace(/\D/g, "")}?text=${encodeURIComponent(MESSAGE_VISITE(titre))}`
      : null,
    emailHref: bien?.proprietaire?.email
      ? `mailto:${bien.proprietaire.email}?subject=${encodeURIComponent(`Demande de visite : ${titre}`)}&body=${encodeURIComponent(MESSAGE_VISITE(titre))}`
      : null,
    partager,
  };
}
