import { useState, type FormEvent } from "react";
import { Banknote, Info, Landmark, Loader2, Minus, Plus, ReceiptText, Smartphone, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import type { Echeance } from "@/api/bail";
import { usePayerEcheancesLocataire } from "@/hooks/useLocataireEcheancier";
import { useProprietaireLocataire } from "@/hooks/useProprietaireLocataire";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { FormField } from "@/components/ui/FormField";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/lib/fcfa";
import { cn } from "@/lib/utils";
import { echeancesARegler, jourMois, libelleMois } from "./paiementStatut";

// Confirmer un paiement (charte, planche 34) : le locataire déclare son règlement,
// le propriétaire le valide, puis la quittance devient disponible.

type Methode = "mobile" | "especes" | "virement";

const METHODES: { value: Methode; label: string; description: string; icon: LucideIcon }[] = [
  { value: "mobile", label: "Mobile money", description: "Transfert depuis votre téléphone", icon: Smartphone },
  { value: "especes", label: "Espèces", description: "Remis en main propre", icon: Banknote },
  { value: "virement", label: "Virement bancaire", description: "Vers le compte du propriétaire", icon: Landmark },
];

const OPERATEURS = ["Wave", "Orange Money", "Autre opérateur"];
const MODE_MOBILE_GENERIQUE = "Mobile money";
// Le back limite un règlement groupé à 36 échéances.
const MAX_MOIS = 36;

const aujourdhuiIso = () => new Date().toISOString().split("T")[0];

const modePaiementPour = (methode: Methode, operateur: string) => {
  if (methode === "especes") return "Espèces";
  if (methode === "virement") return "Virement bancaire";
  return operateur === "Autre opérateur" ? MODE_MOBILE_GENERIQUE : operateur;
};

interface LocatairePayModalProps {
  echeancier: Echeance[];
  onClose: () => void;
}

export default function LocatairePayModal({ echeancier, onClose }: LocatairePayModalProps) {
  const aRegler = echeancesARegler(echeancier);
  const maxMois = Math.min(aRegler.length, MAX_MOIS);

  const [nombreMois, setNombreMois] = useState(1);
  const [methode, setMethode] = useState<Methode>("mobile");
  const [operateur, setOperateur] = useState(OPERATEURS[0]);
  const [datePaiement, setDatePaiement] = useState(aujourdhuiIso());
  const [reference, setReference] = useState("");
  const [erreurDate, setErreurDate] = useState<string>();

  const { mutate, isPending } = usePayerEcheancesLocataire();
  const { data: proprietaireData } = useProprietaireLocataire();

  if (aRegler.length === 0) return null;

  const concernees = aRegler.slice(0, nombreMois);
  const total = concernees.reduce((somme, echeance) => somme + echeance.montant, 0);
  const premiere = concernees[0];
  const derniere = concernees[concernees.length - 1];
  const titreLoyer =
    concernees.length > 1
      ? `Loyers de ${libelleMois(premiere.dateEcheance).toLowerCase()} à ${libelleMois(derniere.dateEcheance).toLowerCase()}`
      : `Loyer de ${libelleMois(premiere.dateEcheance).toLowerCase()}`;
  const bienTitre = proprietaireData?.bien?.titre;
  const proprietaire = proprietaireData?.proprietaire
    ? `${proprietaireData.proprietaire.prenom} ${proprietaireData.proprietaire.nom}`
    : "Votre propriétaire";

  const validerDate = () => {
    if (!datePaiement) return "Indiquez la date à laquelle vous avez payé.";
    if (datePaiement > aujourdhuiIso()) return "La date de paiement ne peut pas être dans le futur.";
    return undefined;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const erreur = validerDate();
    setErreurDate(erreur);
    if (erreur) return;
    mutate(
      {
        nombreMois,
        datePaiement,
        modePaiement: modePaiementPour(methode, operateur),
        reference: methode === "especes" ? undefined : reference.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          toast.success(
            res.paye > 1
              ? `${res.paye} loyers déclarés. ${proprietaire} doit maintenant confirmer.`
              : `Paiement déclaré. ${proprietaire} doit maintenant confirmer.`,
          );
          onClose();
        },
        onError: () => toast.error("La confirmation n'a pas pu être envoyée. Réessayez dans un instant."),
      },
    );
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title="Confirmer un paiement">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="flex items-start gap-4 rounded-card border border-filet p-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-baobab-100 text-baobab">
            <ReceiptText aria-hidden className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-body-m text-texte2">{titreLoyer}</p>
            <p className="font-display text-h2 font-bold text-encre">{formatFcfa(total)}</p>
            <p className="text-body-m text-texte2">
              Échéance : {jourMois(premiere.dateEcheance)}
              {bienTitre ? ` · ${bienTitre}` : ""}
            </p>
          </div>
        </div>

        {maxMois > 1 && (
          <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <div>
              <p className="text-body-m font-semibold text-encre">Nombre de mois réglés</p>
              <p className="text-caption text-texte2">
                {aRegler.length} loyer{aRegler.length > 1 ? "s" : ""} à régler, du plus ancien au plus récent
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Un mois de moins"
                disabled={nombreMois <= 1}
                onClick={() => setNombreMois((n) => n - 1)}
              >
                <Minus aria-hidden />
              </Button>
              <output aria-live="polite" className="w-8 text-center text-title font-bold text-encre">
                {nombreMois}
              </output>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Un mois de plus"
                disabled={nombreMois >= maxMois}
                onClick={() => setNombreMois((n) => n + 1)}
              >
                <Plus aria-hidden />
              </Button>
            </div>
          </div>
        )}

        <fieldset>
          <legend className="mb-3 text-body-m font-semibold text-encre">Comment avez-vous payé ?</legend>
          <div className="space-y-3">
            {METHODES.map(({ value, label, description, icon: Icon }) => {
              const choisi = methode === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-center gap-4 rounded-card border px-4 py-3 transition-colors duration-hover",
                    choisi ? "border-2 border-baobab bg-baobab-100 px-[15px] py-[11px]" : "border-filet bg-white hover:bg-surface",
                  )}
                >
                  <input
                    type="radio"
                    name="methode"
                    value={value}
                    checked={choisi}
                    onChange={() => setMethode(value)}
                    className="size-5 shrink-0 accent-baobab"
                  />
                  <Icon aria-hidden className={cn("size-6 shrink-0", choisi ? "text-baobab" : "text-encre")} strokeWidth={1.75} />
                  <span className="min-w-0">
                    <span className={cn("block text-body-l font-semibold", choisi ? "text-baobab" : "text-encre")}>{label}</span>
                    <span className={cn("block text-body-m", choisi ? "text-baobab" : "text-texte2")}>{description}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className={cn("grid gap-4", methode === "mobile" && "grid-cols-2")}>
          {methode === "mobile" && (
            <FormField label="Opérateur">
              <NativeSelect value={operateur} onChange={(event) => setOperateur(event.target.value)}>
                {OPERATEURS.map((nom) => (
                  <option key={nom} value={nom}>
                    {nom}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          )}
          <FormField label="Date" error={erreurDate}>
            <Input
              type="date"
              value={datePaiement}
              max={aujourdhuiIso()}
              onChange={(event) => setDatePaiement(event.target.value)}
              onBlur={() => setErreurDate(validerDate())}
            />
          </FormField>
        </div>

        {methode !== "especes" && (
          <FormField
            label="Référence de la transaction"
            hint="(facultatif)"
            help={
              methode === "mobile"
                ? "Elle figure dans le SMS de confirmation de votre opérateur."
                : "Elle figure sur l'avis de virement de votre banque."
            }
          >
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value.toUpperCase())}
              autoComplete="off"
              spellCheck={false}
              className="font-mono tracking-wide"
            />
          </FormField>
        )}

        <div className="flex items-start gap-3 rounded-card bg-soleil-100 p-4 text-body-m text-encre">
          <Info aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
          <p>{proprietaire} reçoit votre demande. Votre quittance sera disponible dans Paiements dès sa confirmation.</p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending && <Loader2 aria-hidden className="animate-spin" />}
          {isPending ? "Envoi en cours…" : "Envoyer la confirmation"}
        </Button>
      </form>
    </SheetDialog>
  );
}
