import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { fetchAllTemoignagesAdmin, updateTemoignage, deleteTemoignage, type Temoignage, type UpdateTemoignageData } from "@/api/temoignage";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/textarea";
import { EnTeteAdmin, LigneChargement, LigneMessage, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";

// Témoignages des visiteurs (Configuration · Témoignages) : tableau de la planche 25,
// modification en fenêtre, publication par interrupteur.

const QK = ["temoignages-admin"];
const NB_COLONNES = 6;

function FormulaireTemoignage({ temoignage, onClose }: { temoignage: Temoignage; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Required<UpdateTemoignageData>>({
    nom: temoignage.nom,
    profession: temoignage.profession ?? "",
    temoignage: temoignage.temoignage,
    actif: temoignage.actif ?? false,
    ordre: temoignage.ordre ?? 0,
  });
  const [erreurs, setErreurs] = useState<{ nom?: string; temoignage?: string }>({});

  const update = useMutation({
    mutationFn: (data: UpdateTemoignageData) => updateTemoignage(temoignage.id, data),
    onSuccess: () => {
      toast.success("Témoignage enregistré");
      queryClient.invalidateQueries({ queryKey: QK });
      onClose();
    },
    onError: () => toast.error("Le témoignage n'a pas pu être enregistré. Réessayez."),
  });

  const enregistrer = (event: FormEvent) => {
    event.preventDefault();
    const nouvelles = {
      nom: form.nom.trim() ? undefined : "Indiquez le nom de la personne.",
      temoignage: form.temoignage.trim() ? undefined : "Le témoignage ne peut pas être vide.",
    };
    setErreurs(nouvelles);
    if (nouvelles.nom || nouvelles.temoignage) return;
    update.mutate(form);
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title="Modifier le témoignage">
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <FormField label="Nom" error={erreurs.nom}>
          <Input value={form.nom} onChange={(event) => setForm((f) => ({ ...f, nom: event.target.value }))} />
        </FormField>
        <FormField label="Profession" hint="Facultatif">
          <Input value={form.profession} onChange={(event) => setForm((f) => ({ ...f, profession: event.target.value }))} />
        </FormField>
        <FormField label="Témoignage" error={erreurs.temoignage}>
          <Textarea rows={4} value={form.temoignage} onChange={(event) => setForm((f) => ({ ...f, temoignage: event.target.value }))} />
        </FormField>
        <FormField label="Ordre d'affichage" help="Les plus petits nombres s'affichent en premier.">
          <Input type="number" min={0} value={form.ordre} onChange={(event) => setForm((f) => ({ ...f, ordre: parseInt(event.target.value, 10) || 0 }))} />
        </FormField>
        <Switch label="Visible sur le site" checked={form.actif} onChange={(actif) => setForm((f) => ({ ...f, actif }))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending && <Loader2 aria-hidden className="animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </form>
    </SheetDialog>
  );
}

export default function TemoignagesAdmin() {
  const queryClient = useQueryClient();
  const [enEdition, setEnEdition] = useState<Temoignage | null>(null);
  const [aSupprimer, setASupprimer] = useState<Temoignage | null>(null);

  const { data: temoignages = [], isLoading } = useQuery({ queryKey: QK, queryFn: fetchAllTemoignagesAdmin });

  const suppression = useMutation({
    mutationFn: deleteTemoignage,
    onSuccess: () => {
      toast.success("Témoignage supprimé");
      queryClient.invalidateQueries({ queryKey: QK });
    },
    onError: () => toast.error("Le témoignage n'a pas pu être supprimé. Réessayez."),
    onSettled: () => setASupprimer(null),
  });

  return (
    <div>
      <EnTeteAdmin titre="Témoignages" description="Publiez, modifiez ou supprimez les témoignages envoyés par les visiteurs." />

      <Tableau label="Témoignages">
        <TeteTableau>
          <Th>Nom</Th>
          <Th>Profession</Th>
          <Th>Témoignage</Th>
          <Th>Statut</Th>
          <Th alignement="droite">Ordre</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des témoignages" />
          ) : temoignages.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>Aucun témoignage reçu pour l'instant.</LigneMessage>
          ) : (
            temoignages.map((temoignage) => (
              <Tr key={temoignage.id}>
                <Td className="font-semibold">{temoignage.nom}</Td>
                <Td className="text-texte2">{temoignage.profession}</Td>
                <Td className="max-w-[280px]">
                  <span className="line-clamp-2 text-texte2">{temoignage.temoignage}</span>
                </Td>
                <Td>
                  {temoignage.actif ? <StatusBadge tone="positif">Publié</StatusBadge> : <StatusBadge tone="attente">En attente</StatusBadge>}
                </Td>
                <Td montant>{temoignage.ordre ?? 0}</Td>
                <Td alignement="droite">
                  <div className="flex justify-end gap-2">
                    <Button size="icon-sm" variant="outline" aria-label={`Modifier le témoignage de ${temoignage.nom}`} onClick={() => setEnEdition(temoignage)}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button size="icon-sm" variant="outline" aria-label={`Supprimer le témoignage de ${temoignage.nom}`} onClick={() => setASupprimer(temoignage)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Tableau>

      {enEdition && <FormulaireTemoignage key={enEdition.id} temoignage={enEdition} onClose={() => setEnEdition(null)} />}
      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer ce témoignage ?"
        message={`Le témoignage de ${aSupprimer?.nom ?? ""} sera supprimé définitivement.`}
        confirmLabel="Supprimer"
        isPending={suppression.isPending}
        onConfirm={() => aSupprimer && suppression.mutate(aSupprimer.id)}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
