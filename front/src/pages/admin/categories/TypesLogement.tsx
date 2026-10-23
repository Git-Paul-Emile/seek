import { Link } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { useCreateTypeLogement, useDeleteTypeLogement, useTypeLogementsAdmin, useUpdateTypeLogement } from "@/hooks/useTypeLogements";
import { buttonVariants } from "@/components/ui/button";
import { PageReferentiel } from "@/components/admin/referentiel/PageReferentiel";

// Types de logement (Configuration · Catégories) : liste de référence au modèle commun, avec
// une image par type et un accès aux champs du formulaire propres à chaque type.

export default function TypesLogement() {
  const { data: types = [], isLoading } = useTypeLogementsAdmin();
  const create = useCreateTypeLogement();
  const update = useUpdateTypeLogement();
  const remove = useDeleteTypeLogement();

  return (
    <PageReferentiel
      textes={{
        titre: "Types de logement",
        description: "Appartement, villa, terrain… Chaque type a ses propres champs dans le formulaire d'annonce.",
        unElement: "un type",
        ceElement: "ce type",
        exempleNom: "Appartement",
      }}
      elements={types}
      isLoading={isLoading}
      avecImage
      creer={(saisie) => create.mutateAsync(saisie)}
      modifier={(id, payload) => update.mutateAsync({ id, payload })}
      supprimer={(id) => remove.mutateAsync(id)}
      actionLigne={(type) => (
        <Link
          to={`/admin/biens/types/${type.id}/champs`}
          aria-label={`Champs du formulaire pour ${type.nom}`}
          title="Champs du formulaire"
          className={buttonVariants({ size: "icon-sm", variant: "outline" })}
        >
          <SlidersHorizontal aria-hidden />
        </Link>
      )}
    />
  );
}
