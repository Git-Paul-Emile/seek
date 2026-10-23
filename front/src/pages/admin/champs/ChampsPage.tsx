import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useChampsAdmin, useCreateChamp, useUpdateChamp, useDeleteChamp } from "@/hooks/useChamp";
import { useCategoriesChamp } from "@/hooks/useCategorieChamp";
import type { Champ, TypeChamp, CreateChampPayload } from "@/api/champ";
import { TYPE_CHAMP_LABELS } from "@/api/champ";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/textarea";
import { EnTeteAdmin, LigneChargement, LigneMessage, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";
import { messageErreurApi } from "@/lib/erreurApi";

// Champs du formulaire d'annonce (Configuration · Catégories et champs) : tableau de la
// planche 25, activation par interrupteur, création et modification en fenêtre.

const TYPE_CHAMP_OPTIONS: TypeChamp[] = ["TEXTE", "NOMBRE", "SURFACE", "PRIX", "BOOLEEN", "SELECT", "DATE"];
const TYPES_AVEC_UNITE: TypeChamp[] = ["NOMBRE", "SURFACE", "PRIX"];
const NB_COLONNES = 6;

interface ErreursChamp {
  nom?: string;
  categorie?: string;
  options?: string;
}

function FormulaireChamp({ initial, onClose }: { initial?: Champ; onClose: () => void }) {
  const { data: categories = [] } = useCategoriesChamp();
  const create = useCreateChamp();
  const update = useUpdateChamp();

  const [nom, setNom] = useState(initial?.nom ?? "");
  const [type, setType] = useState<TypeChamp>(initial?.type ?? "TEXTE");
  const [unite, setUnite] = useState(initial?.unite ?? "");
  const [options, setOptions] = useState((initial?.options ?? []).join(", "));
  const [categorieId, setCategorieId] = useState(initial?.categorieId ?? "");
  const [erreurs, setErreurs] = useState<ErreursChamp>({});
  const enCours = create.isPending || update.isPending;

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    const nouvelles: ErreursChamp = {
      nom: nom.trim() ? undefined : "Indiquez le nom du champ, par exemple Superficie.",
      categorie: categorieId ? undefined : "Choisissez la catégorie du champ.",
      options: type === "SELECT" && !options.trim() ? "Ajoutez au moins une option, séparées par des virgules." : undefined,
    };
    setErreurs(nouvelles);
    if (nouvelles.nom || nouvelles.categorie || nouvelles.options) return;

    const payload: CreateChampPayload = {
      nom: nom.trim(),
      type,
      unite: TYPES_AVEC_UNITE.includes(type) ? unite.trim() || null : null,
      options: type === "SELECT" ? options.split(",").map((option) => option.trim()).filter(Boolean) : [],
      categorieId,
    };
    try {
      if (initial) await update.mutateAsync({ id: initial.id, payload });
      else await create.mutateAsync(payload);
      toast.success(initial ? "Champ modifié" : "Champ ajouté");
      onClose();
    } catch (error) {
      toast.error(messageErreurApi(error, "Le champ n'a pas pu être enregistré. Réessayez."));
    }
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title={initial ? "Modifier le champ" : "Ajouter un champ"}>
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <FormField label="Catégorie" error={erreurs.categorie}>
          <NativeSelect value={categorieId} onChange={(event) => setCategorieId(event.target.value)}>
            <option value="">Choisir une catégorie</option>
            {categories.map((categorie) => (
              <option key={categorie.id} value={categorie.id}>
                {categorie.nom}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Nom du champ" error={erreurs.nom}>
          <Input value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Superficie" />
        </FormField>
        <fieldset>
          <legend className="mb-2 text-body-m font-semibold text-encre">Type de champ</legend>
          <div className="flex flex-wrap gap-2">
            {TYPE_CHAMP_OPTIONS.map((option) => (
              <Chip key={option} selected={type === option} onClick={() => setType(option)}>
                {TYPE_CHAMP_LABELS[option]}
              </Chip>
            ))}
          </div>
        </fieldset>
        {TYPES_AVEC_UNITE.includes(type) && (
          <FormField label="Unité" hint="Facultatif">
            <Input value={unite} onChange={(event) => setUnite(event.target.value)} placeholder={type === "SURFACE" ? "m²" : type === "PRIX" ? "FCFA" : ""} />
          </FormField>
        )}
        {type === "SELECT" && (
          <FormField label="Options" help="Séparez les options par des virgules." error={erreurs.options}>
            <Textarea rows={3} value={options} onChange={(event) => setOptions(event.target.value)} placeholder="Carrelage, Parquet, Béton ciré" />
          </FormField>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={enCours}>
            {enCours && <Loader2 aria-hidden className="animate-spin" />}
            {initial ? "Enregistrer" : "Ajouter"}
          </Button>
        </div>
      </form>
    </SheetDialog>
  );
}

export default function ChampsPage() {
  const { data: champs = [], isLoading } = useChampsAdmin();
  const deleteChamp = useDeleteChamp();
  const updateChamp = useUpdateChamp();
  const [formulaire, setFormulaire] = useState<{ initial?: Champ } | null>(null);
  const [aSupprimer, setASupprimer] = useState<Champ | null>(null);
  const [enBascule, setEnBascule] = useState<string | null>(null);

  const basculer = (champ: Champ) => {
    setEnBascule(champ.id);
    updateChamp.mutate(
      { id: champ.id, payload: { actif: !champ.actif } },
      {
        onSuccess: () => toast.success(champ.actif ? `« ${champ.nom} » masqué du formulaire` : `« ${champ.nom} » affiché dans le formulaire`),
        onError: () => toast.error("Le changement n'a pas pu être enregistré. Réessayez."),
        onSettled: () => setEnBascule(null),
      },
    );
  };

  const supprimer = () => {
    if (!aSupprimer) return;
    deleteChamp.mutate(aSupprimer.id, {
      onSuccess: () => toast.success("Champ supprimé"),
      onError: (error) => toast.error(messageErreurApi(error, "Le champ n'a pas pu être supprimé.")),
      onSettled: () => setASupprimer(null),
    });
  };

  return (
    <div>
      <EnTeteAdmin
        titre="Champs de formulaire"
        description={`${champs.length} champ${champs.length > 1 ? "s" : ""} proposé${champs.length > 1 ? "s" : ""} aux propriétaires selon le type de bien.`}
        actions={
          <Button onClick={() => setFormulaire({})}>
            <Plus aria-hidden />
            Ajouter un champ
          </Button>
        }
      />

      <Tableau label="Champs de formulaire">
        <TeteTableau>
          <Th>Nom</Th>
          <Th>Catégorie</Th>
          <Th>Type</Th>
          <Th>Unité ou options</Th>
          <Th>Actif</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des champs" />
          ) : champs.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>Aucun champ. Créez d'abord une catégorie de champs, puis ajoutez vos champs.</LigneMessage>
          ) : (
            champs.map((champ) => (
              <Tr key={champ.id}>
                <Td className="font-semibold">{champ.nom}</Td>
                <Td className="text-texte2">{champ.categorie.nom}</Td>
                <Td>
                  <span className="rounded-control bg-surface px-2 py-1 font-mono text-ref text-texte2">{TYPE_CHAMP_LABELS[champ.type]}</span>
                </Td>
                <Td className="max-w-[240px] truncate text-texte2">{champ.type === "SELECT" ? champ.options.join(", ") : champ.unite}</Td>
                <Td>
                  {enBascule === champ.id ? (
                    <Loader2 aria-label="Enregistrement" className="size-5 animate-spin text-baobab" />
                  ) : (
                    <Switch label={champ.actif ? "Oui" : "Non"} checked={champ.actif} onChange={() => basculer(champ)} className="text-body-m" />
                  )}
                </Td>
                <Td alignement="droite">
                  <div className="flex justify-end gap-2">
                    <Button size="icon-sm" variant="outline" aria-label={`Modifier ${champ.nom}`} onClick={() => setFormulaire({ initial: champ })}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button size="icon-sm" variant="outline" aria-label={`Supprimer ${champ.nom}`} onClick={() => setASupprimer(champ)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Tableau>

      {formulaire && <FormulaireChamp initial={formulaire.initial} onClose={() => setFormulaire(null)} />}
      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer ce champ ?"
        message={`« ${aSupprimer?.nom ?? ""} » disparaît du formulaire d'annonce. Cette action est définitive.`}
        confirmLabel="Supprimer"
        isPending={deleteChamp.isPending}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
