import type { Bien } from "@/api/bien";

// Visite vidéo du bien, avec le lecteur natif du navigateur (contrôles et plein écran
// accessibles au clavier). « preload=metadata » évite de télécharger la vidéo entière
// avant que le visiteur ne la lance.

export function VideoSection({ bien }: { bien: Bien }) {
  if (!bien.videoUrl) return null;

  return (
    <section aria-labelledby="video-titre">
      <h2 id="video-titre" className="text-h2 font-bold text-encre">
        Vidéo
      </h2>
      <video
        src={bien.videoUrl}
        controls
        playsInline
        preload="metadata"
        poster={bien.photos[0]}
        className="mt-3 aspect-video w-full rounded-card bg-encre object-contain"
      >
        Votre navigateur ne permet pas de lire cette vidéo.
      </video>
    </section>
  );
}
