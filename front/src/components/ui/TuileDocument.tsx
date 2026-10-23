import { useId, useRef } from "react";
import { Camera, Upload, X } from "lucide-react";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/utils";

// Tuile d'envoi d'une photo de document (pièce d'identité, selfie) : zone en pointillés,
// puis aperçu avec un bouton pour retirer la photo. Partagée par le locataire et le propriétaire.

export interface TuileDocumentProps {
  libelle: string;
  fichier?: { apercu: string };
  erreur?: string;
  selfie?: boolean;
  onChoisir: (liste: FileList | null) => void;
  onRetirer: () => void;
}

export function TuileDocument({ libelle, fichier, erreur, selfie = false, onChoisir, onRetirer }: TuileDocumentProps) {
  const input = useRef<HTMLInputElement>(null);
  const idErreur = useId();
  const Icone = selfie ? Camera : Upload;
  return (
    <div>
      <p className="mb-2 text-body-m font-semibold text-encre">{libelle}</p>
      {fichier ? (
        <div className="relative overflow-hidden rounded-control border-2 border-baobab bg-surface">
          <img src={fichier.apercu} alt={libelle} className="h-32 w-full object-contain" />
          <button
            type="button"
            onClick={onRetirer}
            aria-label={`Retirer : ${libelle}`}
            className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-encre/70 text-white hover:bg-encre"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          aria-describedby={erreur ? idErreur : undefined}
          className={cn(
            "flex h-32 w-full flex-col items-center justify-center gap-2 rounded-control border-2 border-dashed bg-white text-body-m font-medium text-baobab transition-colors duration-hover hover:bg-baobab-100",
            erreur ? "border-encre" : "border-bord-champ",
          )}
        >
          <Icone aria-hidden className="size-6" />
          {selfie ? "Prendre ou choisir une photo" : "Choisir une photo"}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        capture={selfie ? "user" : undefined}
        className="hidden"
        onChange={(event) => {
          onChoisir(event.target.files);
          event.target.value = "";
        }}
      />
      {erreur && <FieldError id={idErreur}>{erreur}</FieldError>}
    </div>
  );
}
