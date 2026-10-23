import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router-dom";
import { Camera, ChevronLeft, ChevronRight, Heart, Share2, Star, X } from "lucide-react";
import type { Bien } from "@/api/bien";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import { useFavoriToggle } from "@/hooks/useFavoriToggle";
import { cn } from "@/lib/utils";

// Galerie de la fiche (maquette « Fiche annonce ») : photo 4:3 qui défile au doigt,
// boutons ronds retour, partage, favori, badge Premium, compteur de photos, plein écran.

const boutonRond = "flex size-12 items-center justify-center rounded-full bg-white text-encre shadow-card hover:bg-surface";

interface AnnonceGalleryProps {
  bien: Bien;
  onShare: () => void;
}

export function AnnonceGallery({ bien, onShare }: AnnonceGalleryProps) {
  const navigate = useNavigate();
  const piste = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [pleinEcran, setPleinEcran] = useState(false);
  const favori = useFavoriToggle(bien.id);
  const photos = bien.photos ?? [];
  const titre = bien.titre ?? "Annonce";

  const allerA = (cible: number) => {
    const suivant = (cible + photos.length) % photos.length;
    piste.current?.scrollTo({ left: suivant * piste.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="relative overflow-hidden bg-surface lg:rounded-sheet">
      {photos.length > 0 ? (
        <div
          ref={piste}
          onScroll={(event) => setIndex(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}
          className="hide-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto lg:aspect-auto lg:h-[480px]"
        >
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => setPleinEcran(true)}
              aria-label={`Agrandir la photo ${i + 1} sur ${photos.length}`}
              className="h-full w-full shrink-0 snap-center"
            >
              <img
                src={photo}
                alt={i === 0 ? titre : ""}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="aspect-[4/3] lg:aspect-auto lg:h-[480px]">
          <PropertyIllustration kind={illustrationForType(bien.typeLogement?.slug)} />
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-4">
        <button type="button" aria-label="Retour" onClick={() => navigate(-1)} className={cn(boutonRond, "pointer-events-auto lg:invisible")}>
          <ChevronLeft aria-hidden className="size-6" />
        </button>
        <div className="pointer-events-auto flex gap-3">
          <button type="button" aria-label="Partager l'annonce" onClick={onShare} className={boutonRond}>
            <Share2 aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-pressed={favori.actif}
            aria-label={favori.actif ? "Retirer de vos favoris" : "Ajouter à vos favoris"}
            onClick={() => void favori.toggle()}
            className={boutonRond}
          >
            <Heart aria-hidden className={cn("size-6", favori.actif && "fill-baobab text-baobab")} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {photos.length > 1 && (
        <div className="absolute inset-y-0 left-4 right-4 hidden items-center justify-between lg:flex">
          <button type="button" aria-label="Photo précédente" onClick={() => allerA(index - 1)} className={boutonRond}>
            <ChevronLeft aria-hidden className="size-6" />
          </button>
          <button type="button" aria-label="Photo suivante" onClick={() => allerA(index + 1)} className={boutonRond}>
            <ChevronRight aria-hidden className="size-6" />
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
        {bien.estMisEnAvant ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-encre px-3 py-1.5 text-body-m font-semibold text-soleil">
            <Star aria-hidden className="size-4 fill-soleil" />
            Premium
          </span>
        ) : (
          <span />
        )}
        {photos.length > 0 && (
          <span className="tabular inline-flex items-center gap-1.5 rounded-full bg-encre/60 px-3 py-1.5 text-body-m font-semibold text-white" aria-live="polite">
            <Camera aria-hidden className="size-4" />
            {index + 1} / {photos.length}
          </span>
        )}
      </div>

      <Dialog.Root open={pleinEcran} onOpenChange={setPleinEcran}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-encre" />
          <Dialog.Content className="fixed inset-0 z-[71] flex items-center justify-center focus:outline-none">
            <Dialog.Title className="sr-only">Photos de {titre}</Dialog.Title>
            <Dialog.Description className="sr-only">
              Photo {index + 1} sur {photos.length}
            </Dialog.Description>
            <img src={photos[index]} alt="" className="max-h-full max-w-full object-contain" />
            <Dialog.Close asChild>
              <button type="button" aria-label="Fermer" className={cn(boutonRond, "absolute right-4 top-4")}>
                <X aria-hidden className="size-6" />
              </button>
            </Dialog.Close>
            {photos.length > 1 && (
              <>
                <button type="button" aria-label="Photo précédente" onClick={() => setIndex((index - 1 + photos.length) % photos.length)} className={cn(boutonRond, "absolute left-4")}>
                  <ChevronLeft aria-hidden className="size-6" />
                </button>
                <button type="button" aria-label="Photo suivante" onClick={() => setIndex((index + 1) % photos.length)} className={cn(boutonRond, "absolute right-4")}>
                  <ChevronRight aria-hidden className="size-6" />
                </button>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
