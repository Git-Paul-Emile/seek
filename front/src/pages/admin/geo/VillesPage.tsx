import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAllPaysAdmin, useAllVillesAdmin, useCreateVille, useUpdateVille, useDeleteVille } from "@/hooks/useGeo";
import type { Pays, Ville } from "@/api/geo";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { EnTeteAdmin, LigneChargement, LigneMessage, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";
import { messageErreurApi } from "@/lib/erreurApi";

// Villes de la plateforme (Configuration · Géographie) : même modèle que la page Pays,
// avec un filtre par pays au-dessus du tableau.

const NB_COLONNES = 4;

function FormulaireVille({ initial, paysList, onClose }: { initial?: Ville; paysList: Pays[]; onClose: () => void }) {
  const create = useCreateVille();
  const update = useUpdateVille();
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [paysId, setPaysId] = useState(initial?.paysId ?? "");
  const [erreurs, setErreurs] = useState<{ nom?: string; paysId?: string }>({});
  const enCours = create.isPending || update.isPending;

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    const nouvelles = {
      paysId: paysId ? undefined : "Choisissez le pays de la ville.",
      nom: nom.trim() ? undefined : "Indiquez le nom de la ville, par exemple Dakar.",
    };
    setErreurs(nouvelles);
    if (nouvelles.nom || nouvelles.paysId) return;
    const data = { nom: nom.trim(), paysId };
    try {
      if (initial) await update.mutateAsync({ id: initial.id, data });
      else await create.mutateAsync(data);
      toast.success(initial ? "Ville modifiée" : "Ville ajoutée");
      onClose();
    } catch (error) {
      toast.error(messageErreurApi(error, "La ville n'a pas pu être enregistrée. Réessayez."));
    }
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title={initial ? "Modifier la ville" : "Ajouter une ville"}>
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <FormField label="Pays" error={erreurs.paysId}>
          <NativeSelect value={paysId} onChange={(event) => setPaysId(event.target.value)}>
            <option value="">Choisir un pays</option>
            {paysList.map((pays) => (
              <option key={pays.id} value={pays.id}>
                {pays.nom}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Nom de la ville" error={erreurs.nom}>
          <Input value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Dakar" />
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

export default function VillesPage() {
  const { data: paysList = [] } = useAllPaysAdmin();
  const [filtrePays, setFiltrePays] = useState("");
  const { data: villes = [], isLoading } = useAllVillesAdmin(filtrePays || undefined);
  const deleteVille = useDeleteVille();
  const [formulaire, setFormulaire] = useState<{ initial?: Ville } | null>(null);
  const [aSupprimer, setASupprimer] = useState<Ville | null>(null);

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await deleteVille.mutateAsync(aSupprimer.id);
      toast.success("Ville supprimée");
    } catch (error) {
      toast.error(messageErreurApi(error, "La ville n'a pas pu être supprimée."));
    } finally {
      setASupprimer(null);
    }
  };

  return (
    <div>
      <EnTeteAdmin
        titre="Villes"
        description="Les villes de chaque pays, proposées dans les annonces et la recherche."
        actions={
          <Button onClick={() => setFormulaire({})}>
            <Plus aria-hidden />
            Ajouter une ville
          </Button>
        }
      />

      <NativeSelect aria-label="Filtrer par pays" value={filtrePays} onChange={(event) => setFiltrePays(event.target.value)} className="mb-4 w-full sm:w-64">
        <option value="">Pays : tous</option>
        {paysList.map((pays) => (
          <option key={pays.id} value={pays.id}>
            Pays : {pays.nom}
          </option>
        ))}
      </NativeSelect>

      <Tableau label="Villes">
        <TeteTableau>
          <Th>Ville</Th>
          <Th>Pays</Th>
          <Th alignement="droite">Quartiers</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des villes" />
          ) : villes.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>Aucune ville pour ce filtre. Ajoutez la première.</LigneMessage>
          ) : (
            villes.map((ville) => {
              const nbQuartiers = ville._count?.quartiers ?? 0;
              return (
                <Tr key={ville.id}>
                  <Td className="font-semibold">{ville.nom}</Td>
                  <Td>
                    {ville.pays && (
                      <>
                        <span className="font-mono text-ref text-texte2">{ville.pays.code}</span> {ville.pays.nom}
                      </>
                    )}
                  </Td>
                  <Td montant>
                    {nbQuartiers} quartier{nbQuartiers > 1 ? "s" : ""}
                  </Td>
                  <Td alignement="droite">
                    <div className="flex justify-end gap-2">
                      <Button size="icon-sm" variant="outline" aria-label={`Modifier ${ville.nom}`} onClick={() => setFormulaire({ initial: ville })}>
                        <Pencil aria-hidden />
                      </Button>
                      <Button size="icon-sm" variant="outline" aria-label={`Supprimer ${ville.nom}`} onClick={() => setASupprimer(ville)}>
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Tableau>

      {formulaire && <FormulaireVille initial={formulaire.initial} paysList={paysList} onClose={() => setFormulaire(null)} />}
      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer cette ville ?"
        message={`« ${aSupprimer?.nom ?? ""} » sera supprimée, ainsi que ses quartiers.`}
        confirmLabel="Supprimer"
        isPending={deleteVille.isPending}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
