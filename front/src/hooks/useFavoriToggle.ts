import { toast } from "sonner";
import { useFavoris } from "@/hooks/useFavoris";
import { useFavorisAuthModal } from "@/context/FavorisAuthModalContext";

/**
 * Ajout / retrait d'un favori depuis une carte ou une fiche.
 * Sans compte public, ouvre la modale de connexion et garde le bien en attente.
 * Le toast propose « Annuler », comme sur la planche « Alertes et fenêtres ».
 */
export function useFavoriToggle(bienId: string) {
  const { isFavori, toggleFavori, isAuthenticated } = useFavoris();
  const { openModal } = useFavorisAuthModal();
  const actif = isFavori(bienId);

  const toggle = async () => {
    if (!isAuthenticated) {
      openModal(bienId);
      return;
    }
    const etaitFavori = actif;
    try {
      await toggleFavori(bienId);
      toast(etaitFavori ? "Retiré de vos favoris" : "Ajouté à vos favoris", {
        action: { label: "Annuler", onClick: () => void toggleFavori(bienId) },
      });
    } catch {
      toast("Le favori n'a pas été enregistré. Vérifiez votre connexion, puis réessayez.");
    }
  };

  return { actif, toggle };
}
