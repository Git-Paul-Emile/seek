import { useRef, useState } from "react";
import { Plus, Star, Upload, Video, X } from "lucide-react";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/utils";
import { PHOTO_TAILLE_MAX, PHOTO_TYPES, PHOTOS_MAX, PHOTOS_MIN, VIDEO_TAILLE_MAX, VIDEO_TYPES } from "./etapes";
import { IntituleGroupe } from "./ChampsAnnonce";
import type { AnnonceForm } from "./useAnnonceForm";

// Étape 6 : photos et vidéo (charte, planche 26). La première photo sert de couverture.

const OCTETS_PAR_MO = 1024 * 1024;

interface Vignette {
  cle: string;
  src: string;
  couverture: boolean;
  onRetirer: () => void;
  onCouverture?: () => void;
}

function VignettePhoto({ vignette, numero }: { vignette: Vignette; numero: number }) {
  return (
    <li className="group relative aspect-[4/3] overflow-hidden rounded-card bg-surface">
      <img src={vignette.src} alt={`Photo ${numero}`} className="h-full w-full object-cover" />
      <span className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-full bg-white text-body-m font-bold text-encre">
        {numero}
      </span>
      {vignette.couverture ? (
        <span className="absolute bottom-2 left-2 rounded-full bg-baobab px-3 py-1 text-caption font-bold text-white">Couverture</span>
      ) : (
        vignette.onCouverture && (
          <button
            type="button"
            onClick={vignette.onCouverture}
            aria-label={`Choisir la photo ${numero} comme couverture`}
            title="Choisir comme couverture"
            className="absolute bottom-2 left-2 flex size-8 items-center justify-center rounded-full bg-white text-encre"
          >
            <Star aria-hidden className="size-4" />
          </button>
        )
      )}
      <button
        type="button"
        onClick={vignette.onRetirer}
        aria-label={`Retirer la photo ${numero}`}
        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-encre/70 text-white"
      >
        <X aria-hidden className="size-4" />
      </button>
    </li>
  );
}

export function EtapePhotos({ form }: { form: AnnonceForm }) {
  const { v, maj, erreurs } = form;
  const entreePhotos = useRef<HTMLInputElement>(null);
  const entreeVideo = useRef<HTMLInputElement>(null);
  const [erreurFichier, setErreurFichier] = useState("");
  const [erreurVideo, setErreurVideo] = useState("");
  const [survol, setSurvol] = useState(false);
  const total = v.photosExistantes.length + v.nouvellesPhotos.length;

  const ajouterPhotos = (fichiers: FileList | null) => {
    if (!fichiers) return;
    const refus: string[] = [];
    const valides = Array.from(fichiers).filter((f) => {
      if (!PHOTO_TYPES.includes(f.type)) refus.push(`${f.name} n'est pas une image JPG, PNG ou WEBP`);
      else if (f.size > PHOTO_TAILLE_MAX) refus.push(`${f.name} dépasse ${PHOTO_TAILLE_MAX / OCTETS_PAR_MO} Mo`);
      else return true;
      return false;
    });
    const places = PHOTOS_MAX - total;
    if (valides.length > places) refus.push(`${PHOTOS_MAX} photos maximum : ${valides.length - places} non ajoutée(s)`);
    maj({
      nouvellesPhotos: [
        ...v.nouvellesPhotos,
        ...valides.slice(0, Math.max(places, 0)).map((file) => ({ file, preview: URL.createObjectURL(file) })),
      ],
    });
    setErreurFichier(refus.join(". "));
    if (entreePhotos.current) entreePhotos.current.value = "";
  };

  const retirerNouvelle = (index: number) => {
    URL.revokeObjectURL(v.nouvellesPhotos[index].preview);
    const couverture = index === v.couverture ? 0 : index < v.couverture ? v.couverture - 1 : v.couverture;
    maj({ nouvellesPhotos: v.nouvellesPhotos.filter((_, i) => i !== index), couverture });
  };

  // Les photos déjà en ligne passent avant les nouvelles : la couverture se choisit parmi elles.
  const vignettes: Vignette[] = [
    ...v.photosExistantes.map((src, i) => ({
      cle: src,
      src,
      couverture: i === 0,
      onRetirer: () => maj({ photosExistantes: v.photosExistantes.filter((_, x) => x !== i) }),
      onCouverture: () => maj({ photosExistantes: [src, ...v.photosExistantes.filter((_, x) => x !== i)] }),
    })),
    ...v.nouvellesPhotos.map((p, i) => ({
      cle: p.preview,
      src: p.preview,
      couverture: v.photosExistantes.length === 0 && i === v.couverture,
      onRetirer: () => retirerNouvelle(i),
      onCouverture: v.photosExistantes.length === 0 ? () => maj({ couverture: i }) : undefined,
    })),
  ];

  const choisirVideo = (fichier: File | undefined) => {
    if (entreeVideo.current) entreeVideo.current.value = "";
    if (!fichier) return;
    if (!VIDEO_TYPES.includes(fichier.type)) return setErreurVideo("Choisissez une vidéo MP4, MOV, AVI ou WEBM.");
    if (fichier.size > VIDEO_TAILLE_MAX) return setErreurVideo(`La vidéo dépasse ${VIDEO_TAILLE_MAX / OCTETS_PAR_MO} Mo.`);
    setErreurVideo("");
    if (v.video) URL.revokeObjectURL(v.video.preview);
    maj({ video: { file: fichier, preview: URL.createObjectURL(fichier) }, videoExistante: null });
  };
  const videoAffichee = v.video?.preview ?? v.videoExistante;

  return (
    <div className="space-y-8">
      {total < PHOTOS_MAX && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setSurvol(true);
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault();
            setSurvol(false);
            ajouterPhotos(e.dataTransfer.files);
          }}
          className={cn(
            "flex flex-col items-center rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors duration-hover",
            survol ? "border-baobab bg-baobab-100" : "border-bord-champ bg-surface",
          )}
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-baobab-100 text-baobab">
            <Upload aria-hidden className="size-7" />
          </span>
          <p className="mt-4 text-title font-semibold text-encre">Glissez vos photos ici</p>
          <p className="mt-1 text-body-l text-texte2">
            ou{" "}
            <button type="button" onClick={() => entreePhotos.current?.click()} className="font-semibold text-baobab underline underline-offset-4">
              parcourez votre téléphone
            </button>
          </p>
          <p className="mt-3 text-body-m text-texte2">
            JPG, PNG ou WEBP · {PHOTOS_MIN} à {PHOTOS_MAX} photos · {PHOTO_TAILLE_MAX / OCTETS_PAR_MO} Mo par photo
          </p>
        </div>
      )}
      <input ref={entreePhotos} type="file" accept={PHOTO_TYPES.join(",")} multiple className="hidden" onChange={(e) => ajouterPhotos(e.target.files)} />
      {erreurFichier && <FieldError id="erreur-fichier">{erreurFichier}</FieldError>}
      {erreurs.photos && <FieldError id="erreur-photos">{erreurs.photos}</FieldError>}

      {vignettes.length > 0 && (
        <section>
          <div className="mb-3 grid grid-cols-1 gap-1 sm:grid-cols-[1fr_auto] sm:items-baseline">
            <h3 className="text-title font-bold text-encre">{total} photo{total > 1 ? "s" : ""} sur {PHOTOS_MAX}</h3>
            <p className="text-body-m text-texte2">La couverture apparaît en premier dans les résultats</p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {vignettes.map((vignette, i) => (
              <VignettePhoto key={vignette.cle} vignette={vignette} numero={i + 1} />
            ))}
            {total < PHOTOS_MAX && (
              <li>
                <button
                  type="button"
                  onClick={() => entreePhotos.current?.click()}
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-bord-champ bg-surface text-body-l text-texte2 hover:bg-baobab-100"
                >
                  <Plus aria-hidden className="size-6" />
                  Ajouter
                </button>
              </li>
            )}
          </ul>
        </section>
      )}

      <section>
        <IntituleGroupe>Vidéo de visite (facultatif)</IntituleGroupe>
        {videoAffichee ? (
          <div className="relative overflow-hidden rounded-card bg-encre">
            <video src={videoAffichee} controls className="max-h-64 w-full object-contain" />
            <button
              type="button"
              onClick={() => {
                if (v.video) URL.revokeObjectURL(v.video.preview);
                maj({ video: null, videoExistante: null });
              }}
              aria-label="Retirer la vidéo"
              className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-encre/70 text-white"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => entreeVideo.current?.click()}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-control border border-dashed border-bord-champ bg-white text-body-l font-semibold text-encre hover:bg-surface"
          >
            <Video aria-hidden className="size-5" />
            Ajouter une vidéo · MP4, MOV, WEBM · {VIDEO_TAILLE_MAX / OCTETS_PAR_MO} Mo
          </button>
        )}
        <input ref={entreeVideo} type="file" accept={VIDEO_TYPES.join(",")} className="hidden" onChange={(e) => choisirVideo(e.target.files?.[0])} />
        {erreurVideo && <FieldError id="erreur-video">{erreurVideo}</FieldError>}
      </section>
    </div>
  );
}
