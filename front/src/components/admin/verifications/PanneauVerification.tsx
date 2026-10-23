import { useId, useState } from "react";
import { Loader2, ZoomIn } from "lucide-react";
import type { PendingVerification } from "@/api/ownerAuth";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { Initiales } from "../table/Tableau";

// Panneau de décision d'une vérification d'identité, au modèle de la planche 41 : la personne,
// ses pièces, la liste de contrôle, puis la décision. Valider exige toute la liste cochée ;
// rejeter exige un motif, affiché ensuite au propriétaire.

const MOTIFS_REJET = [
  "Document illisible",
  "Document expiré",
  "Informations non conformes au compte",
  "Photo non correspondante",
  "Document incomplet",
  "Suspicion de fraude",
];

const AUTRE_MOTIF = "autre";

const CONTROLES = [
  { cle: "lisible", libelle: "Document lisible : net, bien éclairé, quatre coins visibles" },
  { cle: "complet", libelle: "Document complet : toutes les informations visibles" },
  { cle: "valide", libelle: "Document en cours de validité" },
  { cle: "nom", libelle: "Nom et prénom identiques à ceux du compte" },
  { cle: "selfie", libelle: "Le selfie correspond à la photo du document" },
] as const;

type CleControle = (typeof CONTROLES)[number]["cle"];

interface PanneauVerificationProps {
  verification: PendingVerification;
  validationEnCours: boolean;
  rejetEnCours: boolean;
  onValider: () => void;
  onRejeter: (motif: string) => void;
  onAgrandir: (image: { src: string; alt: string }) => void;
}

function Piece({ src, libelle, onAgrandir }: { src: string; libelle: string; onAgrandir: () => void }) {
  return (
    <figure>
      <figcaption className="mb-2 text-body-m font-semibold text-encre">{libelle}</figcaption>
      <button type="button" onClick={onAgrandir} aria-label={`Agrandir : ${libelle}`} className="group relative block w-full overflow-hidden rounded-control border border-filet bg-surface">
        <img src={src} alt="" className="aspect-[4/3] w-full object-contain" />
        <span className="absolute inset-0 flex items-center justify-center bg-encre/0 transition-colors group-hover:bg-encre/30">
          <ZoomIn aria-hidden className="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </button>
    </figure>
  );
}

export function PanneauVerification({ verification, validationEnCours, rejetEnCours, onValider, onRejeter, onAgrandir }: PanneauVerificationProps) {
  const [coches, setCoches] = useState<Record<CleControle, boolean>>({ lisible: false, complet: false, valide: false, nom: false, selfie: false });
  const [motif, setMotif] = useState("");
  const [motifLibre, setMotifLibre] = useState("");
  const [erreurMotif, setErreurMotif] = useState<string>();
  const idErreur = useId();
  const pieces = verification.verification;
  const cni = pieces?.typePiece === "CNI";
  const toutCoche = Object.values(coches).every(Boolean);
  const enCours = validationEnCours || rejetEnCours;

  const rejeter = () => {
    const choisi = motif === AUTRE_MOTIF ? motifLibre.trim() : motif;
    if (!choisi) {
      setErreurMotif("Choisissez le motif du rejet : le propriétaire le verra sur sa page Vérification.");
      return;
    }
    setErreurMotif(undefined);
    onRejeter(choisi);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-card bg-surface p-4">
        <Initiales prenom={verification.prenom} nom={verification.nom} />
        <div className="min-w-0">
          <p className="text-title font-semibold text-encre">
            {verification.prenom} {verification.nom}
          </p>
          <p className="text-body-m tabular-nums text-texte2">{verification.telephone}</p>
          {verification.email && <p className="truncate text-body-m text-texte2">{verification.email}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {pieces?.pieceIdentiteRecto && (
          <Piece
            src={pieces.pieceIdentiteRecto}
            libelle={cni ? "Carte d'identité, recto" : "Passeport, page d'identité"}
            onAgrandir={() => onAgrandir({ src: pieces.pieceIdentiteRecto!, alt: cni ? "Carte d'identité, recto" : "Passeport" })}
          />
        )}
        {pieces?.pieceIdentiteVerso && (
          <Piece src={pieces.pieceIdentiteVerso} libelle="Carte d'identité, verso" onAgrandir={() => onAgrandir({ src: pieces.pieceIdentiteVerso!, alt: "Carte d'identité, verso" })} />
        )}
        {pieces?.selfie && <Piece src={pieces.selfie} libelle="Selfie" onAgrandir={() => onAgrandir({ src: pieces.selfie!, alt: "Selfie" })} />}
      </div>

      <fieldset>
        <legend className="mb-3 text-body-m font-semibold text-encre">Liste de contrôle</legend>
        <div className="space-y-1">
          {CONTROLES.map(({ cle, libelle }) => (
            <label key={cle} className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-body-m text-encre">
              <input
                type="checkbox"
                checked={coches[cle]}
                onChange={(event) => setCoches((actuels) => ({ ...actuels, [cle]: event.target.checked }))}
                className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-marker accent-baobab"
              />
              {libelle}
            </label>
          ))}
        </div>
      </fieldset>

      {!toutCoche && (
        <fieldset>
          <legend className="mb-3 text-body-m font-semibold text-encre">Motif du rejet</legend>
          <div className="flex flex-wrap gap-2">
            {[...MOTIFS_REJET, AUTRE_MOTIF].map((valeur) => (
              <Chip
                key={valeur}
                size="sm"
                selected={motif === valeur}
                onClick={() => {
                  setMotif(valeur);
                  setErreurMotif(undefined);
                }}
              >
                {valeur === AUTRE_MOTIF ? "Autre motif" : valeur}
              </Chip>
            ))}
          </div>
          {motif === AUTRE_MOTIF && (
            <div className="mt-4">
              <FormField label="Précisez le motif">
                <Input value={motifLibre} onChange={(event) => setMotifLibre(event.target.value)} />
              </FormField>
            </div>
          )}
          {erreurMotif && <FieldError id={idErreur}>{erreurMotif}</FieldError>}
          <p className="mt-2 text-caption text-texte2">Le motif s'affiche sur la page Vérification du propriétaire.</p>
        </fieldset>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={rejeter} disabled={enCours || toutCoche}>
          {rejetEnCours && <Loader2 aria-hidden className="animate-spin" />}
          Rejeter
        </Button>
        <Button onClick={onValider} disabled={enCours || !toutCoche}>
          {validationEnCours && <Loader2 aria-hidden className="animate-spin" />}
          Valider
        </Button>
      </div>
      {!toutCoche && <p className="-mt-3 text-caption text-texte2">Cochez toute la liste de contrôle pour pouvoir valider.</p>}
    </div>
  );
}
