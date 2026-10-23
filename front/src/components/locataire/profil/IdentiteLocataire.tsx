import { useState, type FormEvent } from "react";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Locataire } from "@/api/locataire";
import { updateProfilLocataireApi } from "@/api/locataireAuth";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { formatDateLongue } from "@/lib/dates";
import { normaliserSexe, SEXES, SITUATIONS_PROFESSIONNELLES, TYPES_PIECE } from "../identiteOptions";

// Identité du locataire : renseignée à l'activation, modifiable par lui
// tant qu'aucune vérification n'est en cours d'examen.

const LONGUEUR_DATE_ISO = 10;
const dateIso = (date?: string | null) => (date ? date.slice(0, LONGUEUR_DATE_ISO) : "");
const dateLisible = (date?: string | null) => (date ? formatDateLongue(date) : "Non renseignée");

const versFormulaire = (locataire: Locataire) => ({
  dateNaissance: dateIso(locataire.dateNaissance),
  lieuNaissance: locataire.lieuNaissance ?? "",
  nationalite: locataire.nationalite ?? "",
  sexe: normaliserSexe(locataire.sexe),
  situationProfessionnelle: locataire.situationProfessionnelle ?? "",
  typePiece: locataire.typePiece ?? "",
  numPieceIdentite: locataire.numPieceIdentite ?? "",
  dateDelivrance: dateIso(locataire.dateDelivrance),
  dateExpirationPiece: dateIso(locataire.dateExpirationPiece),
  autoriteDelivrance: locataire.autoriteDelivrance ?? "",
});

type Formulaire = ReturnType<typeof versFormulaire>;

function Lignes({ lignes }: { lignes: [string, string][] }) {
  return (
    <dl className="divide-y divide-filet">
      {lignes.map(([cle, valeur]) => (
        <div key={cle} className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-4 py-3">
          <dt className="text-body-m text-texte2">{cle}</dt>
          <dd className="text-right text-body-l font-semibold text-encre">{valeur || "Non renseigné"}</dd>
        </div>
      ))}
    </dl>
  );
}

function FormulaireIdentite({ locataire, onFermer }: { locataire: Locataire; onFermer: () => void }) {
  const { setLocataire } = useLocataireAuth();
  const [form, setForm] = useState<Formulaire>(() => versFormulaire(locataire));
  const [enregistrement, setEnregistrement] = useState(false);
  const champ = (nom: keyof Formulaire) => ({
    value: form[nom],
    onChange: (event: { target: { value: string } }) => setForm((f) => ({ ...f, [nom]: event.target.value })),
  });
  // Une situation saisie librement avant la liste reste proposée.
  const situations = SITUATIONS_PROFESSIONNELLES.some(({ value }) => value === form.situationProfessionnelle) || !form.situationProfessionnelle
    ? SITUATIONS_PROFESSIONNELLES
    : [...SITUATIONS_PROFESSIONNELLES, { value: form.situationProfessionnelle, label: form.situationProfessionnelle }];

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    setEnregistrement(true);
    try {
      const { typePiece, ...reste } = form;
      const misAJour = await updateProfilLocataireApi({
        ...Object.fromEntries(Object.entries(reste).map(([cle, valeur]) => [cle, valeur.trim() || null])),
        typePiece: typePiece ? (typePiece as Locataire["typePiece"]) : null,
      });
      setLocataire({ ...locataire, ...misAJour });
      toast.success("Informations enregistrées");
      onFermer();
    } catch {
      toast.error("Vos informations n'ont pas pu être enregistrées. Réessayez.");
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <form onSubmit={enregistrer} noValidate className="mt-6 space-y-8">
      <fieldset className="space-y-5">
        <legend className="mb-4 text-overline font-semibold uppercase text-texte2">Naissance et situation</legend>
        <FormField label="Date de naissance">
          <Input type="date" {...champ("dateNaissance")} />
        </FormField>
        <FormField label="Lieu de naissance">
          <Input {...champ("lieuNaissance")} />
        </FormField>
        <FormField label="Nationalité">
          <Input {...champ("nationalite")} />
        </FormField>
        <FormField label="Sexe">
          <NativeSelect {...champ("sexe")}>
            <option value="">Choisir</option>
            {SEXES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Situation professionnelle">
          <NativeSelect {...champ("situationProfessionnelle")}>
            <option value="">Choisir</option>
            {situations.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </fieldset>
      <fieldset className="space-y-5">
        <legend className="mb-4 text-overline font-semibold uppercase text-texte2">Pièce d'identité</legend>
        <FormField label="Type de pièce">
          <NativeSelect {...champ("typePiece")}>
            <option value="">Choisir</option>
            {TYPES_PIECE.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Numéro de la pièce">
          <Input className="font-mono" autoComplete="off" {...champ("numPieceIdentite")} />
        </FormField>
        <FormField label="Date de délivrance">
          <Input type="date" {...champ("dateDelivrance")} />
        </FormField>
        <FormField label="Date d'expiration">
          <Input type="date" {...champ("dateExpirationPiece")} />
        </FormField>
        <FormField label="Autorité de délivrance">
          <Input {...champ("autoriteDelivrance")} />
        </FormField>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" variant="outline" onClick={onFermer}>
          Annuler
        </Button>
        <Button type="submit" disabled={enregistrement}>
          {enregistrement && <Loader2 aria-hidden className="animate-spin" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

interface IdentiteLocataireProps {
  locataire: Locataire;
  verificationEnCours: boolean;
}

export function IdentiteLocataire({ locataire, verificationEnCours }: IdentiteLocataireProps) {
  const [modification, setModification] = useState(false);
  const typePiece = TYPES_PIECE.find(({ value }) => value === locataire.typePiece)?.label ?? locataire.typePiece;
  const sexe = SEXES.find(({ value }) => value === normaliserSexe(locataire.sexe))?.label ?? locataire.sexe ?? "";

  return (
    <section aria-labelledby="titre-identite" className="rounded-card bg-white p-5 lg:p-6">
      <div className="grid grid-cols-[1fr_auto] items-center gap-3">
        <h2 id="titre-identite" className="font-display text-h3 font-bold text-encre">
          Identité
        </h2>
        {locataire.statut === "ACTIF" && !modification && (
          <Button variant="ghost" size="sm" onClick={() => setModification(true)} disabled={verificationEnCours}>
            <Pencil aria-hidden />
            Modifier
          </Button>
        )}
      </div>
      {locataire.statut !== "ACTIF" ? (
        <p className="mt-3 text-body-m text-texte2">
          Activez votre compte avec le lien envoyé par votre propriétaire pour renseigner votre identité.
        </p>
      ) : modification ? (
        <FormulaireIdentite locataire={locataire} onFermer={() => setModification(false)} />
      ) : (
        <>
          {verificationEnCours && (
            <p className="mt-3 text-body-m text-texte2">
              Modification impossible pendant l'examen de vos documents. Annulez la demande de vérification pour modifier.
            </p>
          )}
          <div className="mt-4">
            <Lignes
              lignes={[
                ["Date de naissance", dateLisible(locataire.dateNaissance)],
                ["Lieu de naissance", locataire.lieuNaissance ?? ""],
                ["Nationalité", locataire.nationalite ?? ""],
                ["Sexe", sexe],
                ["Situation professionnelle", locataire.situationProfessionnelle ?? ""],
                ["Pièce", typePiece ? `${typePiece}${locataire.numPieceIdentite ? ` · ${locataire.numPieceIdentite}` : ""}` : ""],
                ["Délivrée le", dateLisible(locataire.dateDelivrance)],
                ["Expire le", dateLisible(locataire.dateExpirationPiece)],
                ["Autorité", locataire.autoriteDelivrance ?? ""],
              ]}
            />
          </div>
        </>
      )}
    </section>
  );
}
