import { useMemo, useState } from "react";
import { Banknote, ChevronRight, CircleCheck, Hourglass, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import type { Echeance, BienAvecBailActif } from "@/api/bail";
import { useEnregistrerPaiementEspeces, useEcheancier, useBiensAvecBailActif } from "@/hooks/useBail";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDateLongue } from "@/lib/dates";
import { messageErreurApi } from "@/lib/erreurApi";
import { formatFcfa } from "@/lib/fcfa";

// Paiement en espèces saisi par le propriétaire (fenêtre de la charte) : choix du bien si
// besoin, puis du mois. Le locataire confirme ensuite depuis son espace.

const todayIso = () => new Date().toISOString().split("T")[0];

const STATUT_ECHEANCE: Record<string, string> = { EN_RETARD: "En retard", EN_ATTENTE: "En attente" };

const libelleMois = (date: string) => new Date(date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

// ─── Étape formulaire (bien + bail + échéancier connus) ───────────────────────

function FormStep({
  bienId,
  bailId,
  echeancier,
  bienTitre,
  locataireNom,
  onClose,
}: {
  bienId: string;
  bailId: string;
  echeancier: Echeance[];
  bienTitre?: string;
  locataireNom?: string;
  onClose: () => void;
}) {
  const unpaid = echeancier
    .filter((e) => e.statut !== "PAYE" && e.statut !== "ANNULE" && e.statut !== "EN_ATTENTE_CONFIRMATION")
    .sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime());

  const [selectedEcheanceId, setSelectedEcheanceId] = useState(unpaid[0]?.id ?? "");
  const [nombreMois, setNombreMois] = useState(1);
  const [datePaiement] = useState(todayIso());
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const { mutate, isPending } = useEnregistrerPaiementEspeces();

  const selectedEch = echeancier.find((e) => e.id === selectedEcheanceId);
  const selectedIndex = unpaid.findIndex((e) => e.id === selectedEcheanceId);
  const maxNombreMois = selectedIndex >= 0 ? unpaid.length - selectedIndex : 0;
  const effectiveNombreMois = Math.min(nombreMois, Math.max(maxNombreMois, 1));
  const echeancesSelectionnees = useMemo(
    () => (selectedIndex >= 0 ? unpaid.slice(selectedIndex, selectedIndex + effectiveNombreMois) : []),
    [effectiveNombreMois, selectedIndex, unpaid],
  );
  const montantTotal = echeancesSelectionnees.reduce((sum, item) => sum + item.montant, 0);

  const canSubmit = !!selectedEcheanceId && datePaiement.length > 0 && new Date(datePaiement) <= new Date(todayIso());

  const handleSubmit = () => {
    if (!canSubmit) return;
    mutate(
      {
        bienId,
        bailId,
        echeanceId: selectedEcheanceId,
        payload: { datePaiement, nombreMois: effectiveNombreMois, note: note || undefined },
      },
      {
        onSuccess: () => {
          setDone(true);
          toast.success("Paiement en espèces enregistré. Le locataire doit le confirmer.");
        },
        onError: (error) => toast.error(messageErreurApi(error, "Le paiement n'a pas pu être enregistré. Réessayez.")),
      },
    );
  };

  if (done) {
    return (
      <div className="text-center">
        <CircleCheck aria-hidden className="mx-auto size-12 text-baobab" />
        <p className="mt-3 text-body-l font-semibold text-encre">Paiement enregistré</p>
        <p className="mt-1 text-body-m text-texte2">Le locataire a reçu une notification. Il doit confirmer ce paiement depuis son espace Seek.</p>
        <Button className="mt-6 w-full" onClick={onClose}>
          Fermer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {(bienTitre || locataireNom) && (
        <div className="rounded-card bg-surface p-4">
          {bienTitre && <p className="truncate text-body-m font-semibold text-encre">{bienTitre}</p>}
          {locataireNom && <p className="truncate text-body-m text-texte2">Locataire : {locataireNom}</p>}
        </div>
      )}

      <p className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-control bg-soleil-100 p-4 text-body-m text-encre">
        <Hourglass aria-hidden className="mt-0.5 size-4" />
        <span>
          Le paiement reste <strong>en attente de confirmation</strong> jusqu'à ce que le locataire le valide depuis son espace.
        </span>
      </p>

      {unpaid.length === 0 ? (
        <p className="rounded-control bg-surface p-4 text-center text-body-m text-texte2">Aucune échéance à régler pour ce bail.</p>
      ) : (
        <FormField label="Mois concerné">
          <NativeSelect
            value={selectedEcheanceId}
            onChange={(e) => {
              setSelectedEcheanceId(e.target.value);
              setNombreMois(1);
            }}
          >
            {unpaid.map((e) => (
              <option key={e.id} value={e.id}>
                {libelleMois(e.dateEcheance)} · {formatFcfa(e.montant)} · {STATUT_ECHEANCE[e.statut] ?? "À venir"}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      )}

      {maxNombreMois > 1 && (
        <FormField label="Nombre de mois" help={`Jusqu'à ${maxNombreMois} mois à partir du mois choisi.`}>
          <Input type="number" inputMode="numeric" min={1} max={maxNombreMois} value={effectiveNombreMois} onChange={(e) => setNombreMois(Math.max(1, Number(e.target.value) || 1))} />
        </FormField>
      )}

      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-card bg-surface p-4 text-body-m">
        <dt className="text-texte2">Type</dt>
        <dd className="text-right font-semibold text-encre">Paiement de loyer</dd>
        <dt className="text-texte2">Mode de paiement</dt>
        <dd className="text-right font-semibold text-encre">Espèces</dd>
        <dt className="text-texte2">Date de réception</dt>
        <dd className="text-right font-semibold text-encre">{formatDateLongue(datePaiement)}</dd>
        {selectedEch && (
          <>
            <dt className="text-texte2">Montant total</dt>
            <dd className="text-right text-price font-bold text-encre">{formatFcfa(montantTotal || selectedEch.montant)}</dd>
          </>
        )}
      </dl>

      <FormField label="Note" hint="(facultatif)">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Exemple : remis en main propre au bureau" />
      </FormField>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit || isPending || unpaid.length === 0}>
          {isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Banknote aria-hidden />}
          Enregistrer le paiement
        </Button>
      </div>
    </div>
  );
}

// ─── Chargement bail/échéancier après sélection d'un bien ─────────────────────

function LoadBailStep({ item, onClose }: { item: BienAvecBailActif; onClose: () => void }) {
  const { data: echeancier = [], isLoading } = useEcheancier(item.bienId, item.bailId);

  if (isLoading) return <Loader2 aria-label="Chargement" className="mx-auto my-12 size-6 animate-spin text-baobab" />;

  return (
    <FormStep
      bienId={item.bienId}
      bailId={item.bailId}
      echeancier={echeancier}
      bienTitre={item.bienTitre ?? undefined}
      locataireNom={item.locataireNom ?? undefined}
      onClose={onClose}
    />
  );
}

// ─── Props publiques ──────────────────────────────────────────────────────────

interface EnregistrerEspecesModalProps {
  /** Si fourni, saute l'étape de sélection du bien */
  bienId?: string;
  bailId?: string;
  echeancier?: Echeance[];
  bienTitre?: string;
  locataireNom?: string;
  onClose: () => void;
}

// ─── Fenêtre principale ───────────────────────────────────────────────────────

export default function EnregistrerEspecesModal({ bienId, bailId, echeancier, bienTitre, locataireNom, onClose }: EnregistrerEspecesModalProps) {
  const { data: biens = [], isLoading } = useBiensAvecBailActif();
  const [selectedItem, setSelectedItem] = useState<BienAvecBailActif | null>(null);
  const [search, setSearch] = useState("");

  // Recherche par nom, prénom, téléphone locataire ou titre du bien
  const directMode = !!bienId && !!bailId && echeancier !== undefined;
  const q = search.trim().toLowerCase();
  const filtered = biens.filter((b) => {
    if (!q) return true;
    return (
      (b.locataireNom ?? "").toLowerCase().includes(q) ||
      (b.locataireTelephone ?? "").includes(q) ||
      (b.bienTitre ?? "").toLowerCase().includes(q) ||
      (b.bienVille ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <SheetDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Enregistrer un paiement en espèces"
      description={directMode || selectedItem ? undefined : "Choisissez le bien concerné."}
    >
      {bienId && bailId && echeancier ? (
        <FormStep bienId={bienId} bailId={bailId} echeancier={echeancier} bienTitre={bienTitre} locataireNom={locataireNom} onClose={onClose} />
      ) : selectedItem ? (
        <LoadBailStep item={selectedItem} onClose={onClose} />
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texte2" />
            <Input
              type="search"
              aria-label="Rechercher un bien ou un locataire"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nom, prénom ou téléphone du locataire"
              autoFocus
              className="pl-12"
            />
          </div>

          {isLoading ? (
            <Loader2 aria-label="Chargement" className="mx-auto my-8 size-6 animate-spin text-baobab" />
          ) : filtered.length === 0 ? (
            <p className="rounded-control bg-surface p-4 text-center text-body-m text-texte2">
              {biens.length === 0 ? "Aucun bien n'a de bail actif." : "Aucun bien ne correspond à cette recherche."}
            </p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {filtered.map((b) => (
                <li key={b.bailId}>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(b)}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-card border border-filet p-4 text-left transition-colors duration-hover hover:bg-surface"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-body-l font-semibold text-encre">{b.bienTitre ?? "Bien sans titre"}</span>
                      <span className="block truncate text-body-m text-texte2">
                        {[b.bienVille, `${formatFcfa(b.montantLoyer)} / mois`].filter(Boolean).join(" · ")}
                      </span>
                      {b.locataireNom && (
                        <span className="block truncate text-body-m text-texte2">{[b.locataireNom, b.locataireTelephone].filter(Boolean).join(" · ")}</span>
                      )}
                    </span>
                    <ChevronRight aria-hidden className="size-5 text-texte2" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button variant="outline" className="w-full" onClick={onClose}>
            Annuler
          </Button>
        </div>
      )}
    </SheetDialog>
  );
}
