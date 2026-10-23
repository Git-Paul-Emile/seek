import { useCreateTypeTransaction, useDeleteTypeTransaction, useTypeTransactionsAdmin, useUpdateTypeTransaction } from "@/hooks/useTypeTransactions";
import { PageReferentiel } from "@/components/admin/referentiel/PageReferentiel";

// Types de transaction (Configuration · Catégories) : liste de référence au modèle commun.

export default function TypesTransaction() {
  const { data: types = [], isLoading } = useTypeTransactionsAdmin();
  const create = useCreateTypeTransaction();
  const update = useUpdateTypeTransaction();
  const remove = useDeleteTypeTransaction();

  return (
    <PageReferentiel
      textes={{
        titre: "Types de transaction",
        description: "Location, vente… Chaque annonce en choisit un, et la recherche filtre dessus.",
        unElement: "un type",
        ceElement: "ce type",
        exempleNom: "Location",
      }}
      elements={types}
      isLoading={isLoading}
      creer={({ nom, ordre }) => create.mutateAsync({ nom, ordre })}
      modifier={(id, { nom, ordre, actif }) => update.mutateAsync({ id, payload: { nom, ordre, actif } })}
      supprimer={(id) => remove.mutateAsync(id)}
    />
  );
}
