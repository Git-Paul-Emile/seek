import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAllPaysAdmin, useCreatePays, useDeletePays, useUpdatePays } from "@/hooks/useGeo";
import type { Pays } from "@/api/geo";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EnTeteAdmin, LigneMessage, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";

// Pays de la plateforme (Configuration · Géographie) : tableau de la charte (planche 25)
// et formulaire en fenêtre.

const CODE_ISO_MAX = 3;
const NB_COLONNES = 4;

function FormulairePays({ initial, onClose }: { initial?: Pays; onClose: () => void }) {
  const create = useCreatePays();
  const update = useUpdatePays();
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [erreurs, setErreurs] = useState<{ nom?: string; code?: string }>({});
  const enCours = create.isPending || update.isPending;

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    const nouvelles = {
      nom: nom.trim() ? undefined : "Indiquez le nom du pays.",
      code: !code.trim()
        ? "Indiquez le code ISO du pays, par exemple SN."
        : code.trim().length > CODE_ISO_MAX
          ? `Le code ISO compte ${CODE_ISO_MAX} lettres au plus.`
          : undefined,
    };
    setErreurs(nouvelles);
    if (nouvelles.nom || nouvelles.code) return;
    const data = { nom: nom.trim(), code: code.trim().toUpperCase() };
    try {
      if (initial) await update.mutateAsync({ id: initial.id, data });
      else await create.mutateAsync(data);
      toast.success(initial ? "Pays modifié" : "Pays ajouté");
      onClose();
    } catch {
      toast.error("Le pays n'a pas pu être enregistré. Vérifiez que le code n'existe pas déjà.");
    }
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title={initial ? "Modifier le pays" : "Ajouter un pays"}>
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <FormField label="Nom du pays" error={erreurs.nom}>
          <Input value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Sénégal" autoFocus />
        </FormField>
        <FormField label="Code ISO" help="Deux ou trois lettres, par exemple SN." error={erreurs.code}>
          <Input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="font-mono uppercase" maxLength={CODE_ISO_MAX} />
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

export default function PaysPage() {
  const { data: pays = [], isLoading } = useAllPaysAdmin();
  const deletePays = useDeletePays();
  const [formulaire, setFormulaire] = useState<{ initial?: Pays } | null>(null);
  const [aSupprimer, setASupprimer] = useState<Pays | null>(null);

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await deletePays.mutateAsync(aSupprimer.id);
      toast.success("Pays supprimé");
    } catch {
      toast.error("Le pays n'a pas pu être supprimé.");
    } finally {
      setASupprimer(null);
    }
  };

  return (
    <div>
      <EnTeteAdmin
        titre="Pays"
        description="Les pays proposés aux propriétaires et dans la recherche."
        actions={
          <Button onClick={() => setFormulaire({})}>
            <Plus aria-hidden />
            Ajouter un pays
          </Button>
        }
      />

      <Tableau label="Pays">
        <TeteTableau>
          <Th>Nom</Th>
          <Th>Code</Th>
          <Th alignement="droite">Villes</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneMessage colonnes={NB_COLONNES}>
              <Loader2 aria-hidden className="mx-auto size-6 animate-spin text-baobab" />
              <span className="sr-only">Chargement des pays</span>
            </LigneMessage>
          ) : pays.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>Aucun pays pour l'instant. Ajoutez le premier.</LigneMessage>
          ) : (
            pays.map((p) => {
              const nbVilles = p._count?.villes ?? 0;
              return (
                <Tr key={p.id}>
                  <Td className="font-semibold">{p.nom}</Td>
                  <Td className="font-mono text-ref">{p.code}</Td>
                  <Td montant>
                    {nbVilles} ville{nbVilles > 1 ? "s" : ""}
                  </Td>
                  <Td alignement="droite">
                    <div className="flex justify-end gap-2">
                      <Button size="icon-sm" variant="outline" aria-label={`Modifier ${p.nom}`} onClick={() => setFormulaire({ initial: p })}>
                        <Pencil aria-hidden />
                      </Button>
                      <Button size="icon-sm" variant="outline" aria-label={`Supprimer ${p.nom}`} onClick={() => setASupprimer(p)}>
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

      {formulaire && <FormulairePays initial={formulaire.initial} onClose={() => setFormulaire(null)} />}
      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer ce pays ?"
        message={`« ${aSupprimer?.nom ?? ""} » sera supprimé, ainsi que ses villes.`}
        confirmLabel="Supprimer"
        isPending={deletePays.isPending}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
