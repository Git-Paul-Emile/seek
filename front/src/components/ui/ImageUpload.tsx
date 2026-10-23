import React, { useId, useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";
import { FieldError } from "@/components/ui/FieldError";
import { cn } from "@/lib/utils";

// ─── Constantes de validation (miroir des règles backend) ────────────────────

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/jfif"];
const ALLOWED_EXTENSIONS = ".jpg,.jpeg,.jfif,.png,.webp,.avif";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageUploadProps {
  /** URL de l'image existante (mode édition) */
  currentImage?: string | null;
  /** Appelé avec le fichier sélectionné, ou null si supprimé */
  onChange: (file: File | null) => void;
  /** Message d'erreur externe (ex: retour serveur) */
  error?: string;
  label?: string;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ImageUpload({
  currentImage,
  onChange,
  error,
  label = "Image",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const idErreur = useId();

  // Image affichée : prévisualisation du nouveau fichier ou image existante
  const displayedImage = preview ?? currentImage ?? null;
  const activeError = localError ?? error ?? null;

  const validate = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Format non autorisé. Utilisez JPEG, JFIF, PNG, WEBP ou AVIF.";
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `Fichier trop volumineux. Taille maximale : 5 Mo (actuel : ${(file.size / 1024 / 1024).toFixed(1)} Mo).`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const err = validate(file);
    if (err) {
      setLocalError(err);
      setPreview(null);
      onChange(null);
      return;
    }
    setLocalError(null);
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input pour permettre de re-sélectionner le même fichier
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleClear = () => {
    setPreview(null);
    setLocalError(null);
    onChange(null);
  };

  return (
    <div>
      <p className="mb-2 text-body-m font-semibold text-encre">{label}</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-card border-2 border-dashed transition-colors duration-hover",
          activeError ? "border-encre bg-soleil-100" : isDragging ? "border-baobab bg-baobab-100" : "border-bord-champ bg-white hover:bg-surface",
        )}
      >
        {displayedImage ? (
          // ─── Prévisualisation ────────────────────────────────────────────────
          <div className="relative">
            <img
              src={displayedImage}
              alt="Aperçu"
              className="h-40 w-full rounded-card object-cover"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-2 z-10 flex size-10 items-center justify-center rounded-full bg-white text-encre shadow-card hover:bg-surface"
              aria-label="Supprimer l'image"
              title="Supprimer l'image"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Overlay cliquable pour changer l'image */}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="absolute inset-0 flex items-end justify-center rounded-card bg-encre/20 pb-3 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100"
            >
              <span className="rounded-full bg-encre/70 px-3 py-1 text-caption font-semibold text-white">
                Changer d'image
              </span>
            </button>
          </div>
        ) : (
          // ─── Zone de dépôt / sélection ───────────────────────────────────────
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-describedby={activeError ? idErreur : undefined}
            className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2"
          >
            <span className="flex size-10 items-center justify-center rounded-control bg-baobab-100 text-baobab">
              <Upload aria-hidden className="size-5" />
            </span>
            <div className="text-center">
              <p className="text-body-m font-semibold text-baobab">
                Cliquez ou glissez une image
              </p>
              <p className="mt-0.5 text-caption text-texte2">
                JPEG, JFIF, PNG, WEBP ou AVIF, 5 Mo maximum
              </p>
            </div>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Erreur de validation */}
      {activeError && <FieldError id={idErreur}>{activeError}</FieldError>}

      {/* Indicateur : image actuelle non modifiée */}
      {currentImage && !preview && !localError && (
        <p className="mt-2 flex items-center gap-1.5 text-caption text-texte2">
          <ImageIcon aria-hidden className="size-3.5" />
          Image actuelle conservée si aucun fichier sélectionné
        </p>
      )}
    </div>
  );
}
