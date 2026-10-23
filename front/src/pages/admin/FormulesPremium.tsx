import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminFormules, useAdminCreateFormule, useAdminUpdateFormule, useAdminDeleteFormule, type FormulePremiumFull } from "@/hooks/usePremium";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/brand/EmptyState";
import { BlocChargement, CarteAdmin, EnTeteAdmin } from "@/components/admin/table/Tableau";
import { formatMontant } from "@/lib/fcfa";
import { messageErreurApi } from "@/lib/erreurApi";

// Formules de mise en avant (Finances · Formules premium) : une carte par formule, comme les
// offres vues par le propriétaire, et un formulaire en fenêtre.

const FORMULE_VIDE: Partial<FormulePremiumFull> = {
  code: "",
  nom: "",
  dureeJours: 7,
  prix: 5000,
  accroche: "",
  description: "",
  idealPour: [],
  populer: false,
  actif: true,
  ordre: 1,
};

interface ErreursFormule {
  code?: string;
  nom?: string;
  dureeJours?: string;
  prix?: string;
}

function FormulaireFormule({ initial, onClose }: { initial: Partial<FormulePremiumFull>; onClose: () => void }) {
  const create = useAdminCreateFormule();
  const update = useAdminUpdateFormule();
  const [form, setForm] = useState<Partial<FormulePremiumFull>>(initial);
  const [idealPour, setIdealPour] = useState((initial.idealPour ?? []).join("\n"));
  const [erreurs, setErreurs] = useState<ErreursFormule>({});
  const enCours = create.isPending || update.isPending;

  const champ = <K extends keyof FormulePremiumFull>(cle: K, valeur: FormulePremiumFull[K]) => setForm((actuel) => ({ ...actuel, [cle]: valeur }));

  const enregistrer = (event: FormEvent) => {
    event.preventDefault();
    const nouvelles: ErreursFormule = {
      code: form.code?.trim() ? undefined : "Indiquez un code court, par exemple BASIC.",
      nom: form.nom?.trim() ? undefined : "Indiquez le nom affiché aux propriétaires.",
      dureeJours: (form.dureeJours ?? 0) > 0 ? undefined : "La durée compte au moins un jour.",
      prix: (form.prix ?? -1) >= 0 ? undefined : "Le prix est un montant positif en FCFA.",
    };
    setErreurs(nouvelles);
    if (Object.values(nouvelles).some(Boolean)) return;

    const data = { ...form, idealPour: idealPour.split("\n").map((ligne) => ligne.trim()).filter(Boolean) };
    const options = {
      onSuccess: () => {
        toast.success(form.id ? "Formule modifiée" : "Formule ajoutée");
        onClose();
      },
      onError: (error: unknown) => toast.error(messageErreurApi(error, "La formule n'a pas pu être enregistrée. Réessayez.")),
    };
    if (form.id) update.mutate({ id: form.id, data }, options);
    else create.mutate(data, options);
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title={form.id ? "Modifier la formule" : "Ajouter une formule"}>
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Code" error={erreurs.code}>
            <Input value={form.code ?? ""} onChange={(event) => champ("code", event.target.value.toUpperCase())} placeholder="BASIC" className="font-mono uppercase" />
          </FormField>
          <FormField label="Nom" error={erreurs.nom}>
            <Input value={form.nom ?? ""} onChange={(event) => champ("nom", event.target.value)} placeholder="Formule Basic" />
          </FormField>
          <FormField label="Durée en jours" error={erreurs.dureeJours}>
            <Input type="number" min={1} value={form.dureeJours ?? ""} onChange={(event) => champ("dureeJours", Number(event.target.value))} />
          </FormField>
          <FormField label="Prix en FCFA" error={erreurs.prix}>
            <Input type="number" min={0} value={form.prix ?? ""} onChange={(event) => champ("prix", Number(event.target.value))} />
          </FormField>
        </div>
        <FormField label="Accroche" hint="Facultatif">
          <Input value={form.accroche ?? ""} onChange={(event) => champ("accroche", event.target.value)} placeholder="Idéal pour commencer" />
        </FormField>
        <FormField label="Description" hint="Facultatif">
          <Textarea rows={3} value={form.description ?? ""} onChange={(event) => champ("description", event.target.value)} />
        </FormField>
        <FormField label="Idéal pour" help="Une raison par ligne, affichée en liste sur l'offre.">
          <Textarea rows={3} value={idealPour} onChange={(event) => setIdealPour(event.target.value)} placeholder={"Petits propriétaires\nPremière annonce"} />
        </FormField>
        <FormField label="Ordre d'affichage" help="Les plus petits nombres s'affichent en premier.">
          <Input type="number" min={0} value={form.ordre ?? 1} onChange={(event) => champ("ordre", Number(event.target.value))} />
        </FormField>
        <div className="grid gap-1">
          <Switch label="Mise en avant « Populaire »" checked={form.populer ?? false} onChange={(populer) => champ("populer", populer)} />
          <Switch label="Proposée aux propriétaires" checked={form.actif ?? true} onChange={(actif) => champ("actif", actif)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={enCours}>
            {enCours && <Loader2 aria-hidden className="animate-spin" />}
            {form.id ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </form>
    </SheetDialog>
  );
}

export default function FormulesPremium() {
  const { data: formules = [], isLoading } = useAdminFormules();
  const suppression = useAdminDeleteFormule();
  const [formulaire, setFormulaire] = useState<Partial<FormulePremiumFull> | null>(null);
  const [aSupprimer, setASupprimer] = useState<FormulePremiumFull | null>(null);

  const supprimer = () => {
    if (!aSupprimer) return;
    suppression.mutate(aSupprimer.id, {
      onSuccess: () => toast.success("Formule supprimée"),
      onError: (error) => toast.error(messageErreurApi(error, "La formule n'a pas pu être supprimée.")),
      onSettled: () => setASupprimer(null),
    });
  };

  return (
    <div className="space-y-6">
      <EnTeteAdmin
        titre="Formules premium"
        description="Les offres de mise en avant proposées aux propriétaires."
        actions={
          <Button onClick={() => setFormulaire(FORMULE_VIDE)}>
            <Plus aria-hidden />
            Ajouter une formule
          </Button>
        }
      />

      {isLoading ? (
        <BlocChargement label="Chargement des formules" />
      ) : formules.length === 0 ? (
        <CarteAdmin>
          <EmptyState titre="Aucune formule" texte="Ajoutez une première formule pour permettre aux propriétaires de mettre leurs annonces en avant." illustration="villa" />
        </CarteAdmin>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {formules.map((formule) => (
            <li key={formule.id} className={formule.populer ? "flex flex-col rounded-card border-2 border-baobab bg-white p-5" : "flex flex-col rounded-card border border-filet bg-white p-5"}>
              <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    {formule.populer && (
                      <StatusBadge tone="premium" size="sm">
                        Populaire
                      </StatusBadge>
                    )}
                    {formule.actif ? (
                      <StatusBadge tone="positif" size="sm">
                        Proposée
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="neutre" size="sm">
                        Masquée
                      </StatusBadge>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-h3 font-bold text-encre">{formule.nom}</h2>
                  <p className="font-mono text-ref text-texte2">{formule.code}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon-sm" variant="outline" aria-label={`Modifier ${formule.nom}`} onClick={() => setFormulaire(formule)}>
                    <Pencil aria-hidden />
                  </Button>
                  <Button size="icon-sm" variant="outline" aria-label={`Supprimer ${formule.nom}`} onClick={() => setASupprimer(formule)}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </div>
              <p className="mt-4 font-display text-price font-bold text-encre">
                {formatMontant(formule.prix)} FCFA
                <span className="font-body text-body-m font-normal text-texte2"> · {formule.dureeJours} jours</span>
              </p>
              {formule.accroche && <p className="mt-2 text-body-m text-texte2">{formule.accroche}</p>}
            </li>
          ))}
        </ul>
      )}

      {formulaire && <FormulaireFormule key={formulaire.id ?? "nouvelle"} initial={formulaire} onClose={() => setFormulaire(null)} />}
      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer cette formule ?"
        message={`« ${aSupprimer?.nom ?? ""} » ne sera plus proposée. Les promotions déjà payées restent dans l'historique.`}
        confirmLabel="Supprimer"
        isPending={suppression.isPending}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
