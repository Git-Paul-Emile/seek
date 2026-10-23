import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCategoriesChamp, useCreateCategorieChamp, useUpdateCategorieChamp, useDeleteCategorieChamp } from "@/hooks/useCategorieChamp";
import type { CategorieChamp } from "@/api/categorieChamp";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { EnTeteAdmin, LigneChargement, LigneMessage, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";
import { messageErreurApi } from "@/lib/erreurApi";

// Catégories de champs dynamiques (Configuration · Catégories et champs) : même modèle que
// la page Pays, tableau de la planche 25 et formulaire en fenêtre.

const NB_COLONNES = 3;

function FormulaireCategorie({ initial, onClose }: { initial?: CategorieChamp; onClose: () => void }) {
  const create = useCreateCategorieChamp();
  const update = useUpdateCategorieChamp();
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [ordre, setOrdre] = useState(String(initial?.ordre ?? 0));
  const [erreur, setErreur] = useState<string>();
  const enCours = create.isPending || update.isPending;

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    if (!nom.trim()) {
      setErreur("Indiquez le nom de la catégorie, par exemple Superficie.");
      return;
    }
    setErreur(undefined);
    const payload = { nom: nom.trim(), ordre: Number(ordre) || 0 };
    try {
      if (initial) await update.mutateAsync({ id: initial.id, payload });
      else await create.mutateAsync(payload);
      toast.success(initial ? "Catégorie modifiée" : "Catégorie ajoutée");
      onClose();
    } catch (error) {
      toast.error(messageErreurApi(error, "La catégorie n'a pas pu être enregistrée. Réessayez."));
    }
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title={initial ? "Modifier la catégorie" : "Ajouter une catégorie"}>
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <FormField label="Nom de la catégorie" error={erreur}>
          <Input value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Superficie" autoFocus />
        </FormField>
        <FormField label="Ordre d'affichage" help="Les plus petits nombres s'affichent en premier.">
          <Input type="number" min={0} value={ordre} onChange={(event) => setOrdre(event.target.value)} />
        </FormField>
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

export default function CategoriesChampPage() {
  const { data: categories = [], isLoading } = useCategoriesChamp();
  const deleteCategorie = useDeleteCategorieChamp();
  const [formulaire, setFormulaire] = useState<{ initial?: CategorieChamp } | null>(null);
  const [aSupprimer, setASupprimer] = useState<CategorieChamp | null>(null);

  const supprimer = () => {
    if (!aSupprimer) return;
    deleteCategorie.mutate(aSupprimer.id, {
      onSuccess: () => toast.success("Catégorie supprimée"),
      onError: (error) => toast.error(messageErreurApi(error, "La catégorie n'a pas pu être supprimée.")),
      onSettled: () => setASupprimer(null),
    });
  };

  return (
    <div>
      <EnTeteAdmin
        titre="Catégories de champs"
        description="Elles regroupent les champs du formulaire d'annonce."
        actions={
          <Button onClick={() => setFormulaire({})}>
            <Plus aria-hidden />
            Ajouter une catégorie
          </Button>
        }
      />

      <Tableau label="Catégories de champs">
        <TeteTableau>
          <Th>Nom</Th>
          <Th alignement="droite">Ordre</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des catégories" />
          ) : categories.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>Aucune catégorie pour l'instant. Ajoutez la première.</LigneMessage>
          ) : (
            categories.map((categorie) => (
              <Tr key={categorie.id}>
                <Td className="font-semibold">{categorie.nom}</Td>
                <Td montant>{categorie.ordre}</Td>
                <Td alignement="droite">
                  <div className="flex justify-end gap-2">
                    <Button size="icon-sm" variant="outline" aria-label={`Modifier ${categorie.nom}`} onClick={() => setFormulaire({ initial: categorie })}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button size="icon-sm" variant="outline" aria-label={`Supprimer ${categorie.nom}`} onClick={() => setASupprimer(categorie)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Tableau>

      {formulaire && <FormulaireCategorie initial={formulaire.initial} onClose={() => setFormulaire(null)} />}
      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer cette catégorie ?"
        message={`« ${aSupprimer?.nom ?? ""} » sera supprimée. Si elle contient encore des champs, déplacez-les ou supprimez-les d'abord.`}
        confirmLabel="Supprimer"
        isPending={deleteCategorie.isPending}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
