import { useCreateStatutBien, useDeleteStatutBien, useStatutsBienAdmin, useUpdateStatutBien } from "@/hooks/useStatutsBien";
import { PageReferentiel } from "@/components/admin/referentiel/PageReferentiel";

// Statuts de bien (Configuration · Catégories) : liste de référence au modèle commun.

export default function StatutsBien() {
  const { data: statuts = [], isLoading } = useStatutsBienAdmin();
  const create = useCreateStatutBien();
  const update = useUpdateStatutBien();
  const remove = useDeleteStatutBien();

  return (
    <PageReferentiel
      textes={{
        titre: "Statuts de bien",
        description: "L'état d'un bien affiché sur l'annonce : libre, loué, en travaux…",
        unElement: "un statut",
        ceElement: "ce statut",
        exempleNom: "Disponible",
      }}
      elements={statuts}
      isLoading={isLoading}
      creer={({ nom, ordre }) => create.mutateAsync({ nom, ordre })}
      modifier={(id, { nom, ordre, actif }) => update.mutateAsync({ id, payload: { nom, ordre, actif } })}
      supprimer={(id) => remove.mutateAsync(id)}
    />
  );
}
