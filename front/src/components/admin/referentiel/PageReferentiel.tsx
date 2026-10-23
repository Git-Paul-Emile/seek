import { useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormField } from "@/components/ui/FormField";
import ImageUpload from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/ui/Pagination";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { Switch } from "@/components/ui/Switch";
import { EnTeteAdmin, LigneChargement, LigneMessage, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";
import { messageErreurApi } from "@/lib/erreurApi";

// Page de liste de référence (statuts de bien, types de transaction, types de logement) :
// même modèle que la page Pays. Tableau de la planche 25, activation par interrupteur,
// création et modification en fenêtre. Chaque page ne fournit que ses textes et ses appels.

export interface ElementReferentiel {
  id: string;
  nom: string;
  slug: string;
  ordre: number;
  actif: boolean;
  image?: string | null;
}

export interface SaisieReferentiel {
  nom: string;
  ordre?: number;
  imageFile?: File;
}

export interface TextesReferentiel {
  titre: string;
  description: string;
  /** « un statut », « un type » : sert dans les boutons et les fenêtres. */
  unElement: string;
  /** « ce statut », « ce type ». */
  ceElement: string;
  exempleNom: string;
}

const TAILLE_PAGE = 10;
const NOM_MIN = 2;
const NOM_MAX = 50;

const schemaSaisie = z.object({
  nom: z.string().trim().min(NOM_MIN, `Le nom compte au moins ${NOM_MIN} caractères.`).max(NOM_MAX, `Le nom compte ${NOM_MAX} caractères au plus.`),
  ordre: z.coerce.number().int().min(0, "L'ordre est un nombre positif ou zéro."),
});

interface PageReferentielProps<T extends ElementReferentiel> {
  textes: TextesReferentiel;
  elements: T[];
  isLoading: boolean;
  avecImage?: boolean;
  creer: (saisie: SaisieReferentiel) => Promise<unknown>;
  modifier: (id: string, modification: Partial<SaisieReferentiel> & { actif?: boolean }) => Promise<unknown>;
  supprimer: (id: string) => Promise<unknown>;
  /** Action supplémentaire en tête des boutons de la ligne (lien vers les champs, par exemple). */
  actionLigne?: (element: T) => ReactNode;
}

function FormulaireReferentiel<T extends ElementReferentiel>({
  textes,
  initial,
  ordreSuivant,
  avecImage,
  enregistrer,
  onClose,
}: {
  textes: TextesReferentiel;
  initial?: T;
  ordreSuivant: number;
  avecImage: boolean;
  enregistrer: (saisie: SaisieReferentiel) => Promise<unknown>;
  onClose: () => void;
}) {
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [ordre, setOrdre] = useState(String(initial?.ordre ?? ordreSuivant));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [erreurs, setErreurs] = useState<{ nom?: string; ordre?: string }>({});
  const [enCours, setEnCours] = useState(false);

  const valider = async (event: FormEvent) => {
    event.preventDefault();
    const resultat = schemaSaisie.safeParse({ nom, ordre });
    if (!resultat.success) {
      const { fieldErrors } = resultat.error.flatten();
      setErreurs({ nom: fieldErrors.nom?.[0], ordre: fieldErrors.ordre?.[0] });
      return;
    }
    setErreurs({});
    setEnCours(true);
    try {
      await enregistrer({ nom: nom.trim(), ordre: Number(ordre), imageFile: imageFile ?? undefined });
      toast.success(initial ? "Modifications enregistrées" : `« ${nom.trim()} » a été ajouté`);
      onClose();
    } catch (error) {
      toast.error(messageErreurApi(error, "L'enregistrement a échoué. Réessayez."));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && !enCours && onClose()} title={initial ? `Modifier ${textes.ceElement}` : `Ajouter ${textes.unElement}`}>
      <form onSubmit={valider} noValidate className="space-y-5">
        <FormField label="Nom" error={erreurs.nom}>
          <Input value={nom} onChange={(event) => setNom(event.target.value)} placeholder={textes.exempleNom} autoFocus />
        </FormField>
        {avecImage && <ImageUpload label="Image" currentImage={initial?.image} onChange={setImageFile} />}
        <FormField
          label="Ordre d'affichage"
          help={initial ? "Si cette position est déjà prise, les deux éléments échangent leur place." : "Les plus petits nombres s'affichent en premier."}
          error={erreurs.ordre}
        >
          <Input type="number" min={0} value={ordre} onChange={(event) => setOrdre(event.target.value)} />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={enCours}>
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

export function PageReferentiel<T extends ElementReferentiel>({
  textes,
  elements,
  isLoading,
  avecImage = false,
  creer,
  modifier,
  supprimer,
  actionLigne,
}: PageReferentielProps<T>) {
  const pagination = usePagination(elements, TAILLE_PAGE);
  const [formulaire, setFormulaire] = useState<{ initial?: T } | null>(null);
  const [aSupprimer, setASupprimer] = useState<T | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [enBascule, setEnBascule] = useState<string | null>(null);

  const ordreSuivant = elements.length > 0 ? Math.max(...elements.map(({ ordre }) => ordre)) + 1 : 0;
  const nbColonnes = avecImage ? 6 : 5;

  const basculer = async (element: T) => {
    setEnBascule(element.id);
    try {
      await modifier(element.id, { actif: !element.actif });
      toast.success(element.actif ? `« ${element.nom} » est masqué` : `« ${element.nom} » est proposé`);
    } catch (error) {
      toast.error(messageErreurApi(error, "Le changement n'a pas pu être enregistré. Réessayez."));
    } finally {
      setEnBascule(null);
    }
  };

  const confirmerSuppression = async () => {
    if (!aSupprimer) return;
    setSuppressionEnCours(true);
    try {
      await supprimer(aSupprimer.id);
      toast.success(`« ${aSupprimer.nom} » a été supprimé`);
    } catch (error) {
      toast.error(messageErreurApi(error, "La suppression a échoué. Réessayez."));
    } finally {
      setSuppressionEnCours(false);
      setASupprimer(null);
    }
  };

  return (
    <div>
      <EnTeteAdmin
        titre={textes.titre}
        description={textes.description}
        actions={
          <Button onClick={() => setFormulaire({})}>
            <Plus aria-hidden />
            Ajouter {textes.unElement}
          </Button>
        }
      />

      <Tableau label={textes.titre}>
        <TeteTableau>
          {avecImage && (
            <Th className="w-20">
              <span className="sr-only">Image</span>
            </Th>
          )}
          <Th>Nom</Th>
          <Th>Slug</Th>
          <Th alignement="droite">Ordre</Th>
          <Th>Proposé</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneChargement colonnes={nbColonnes} label={`Chargement : ${textes.titre}`} />
          ) : elements.length === 0 ? (
            <LigneMessage colonnes={nbColonnes}>La liste est vide. Ajoutez le premier élément.</LigneMessage>
          ) : (
            pagination.pageItems.map((element) => (
              <Tr key={element.id}>
                {avecImage && (
                  <Td>
                    {element.image ? (
                      <img src={element.image} alt="" className="h-10 w-14 rounded-control object-cover" />
                    ) : (
                      <span className="flex h-10 w-14 items-center justify-center rounded-control bg-surface">
                        <Building2 aria-hidden className="size-4 text-texte2" />
                      </span>
                    )}
                  </Td>
                )}
                <Td className="font-semibold">{element.nom}</Td>
                <Td>
                  <span className="rounded-control bg-surface px-2 py-1 font-mono text-ref text-texte2">{element.slug}</span>
                </Td>
                <Td montant>{element.ordre}</Td>
                <Td>
                  {enBascule === element.id ? (
                    <Loader2 aria-label="Enregistrement" className="size-5 animate-spin text-baobab" />
                  ) : (
                    <Switch label={element.actif ? "Oui" : "Non"} checked={element.actif} onChange={() => basculer(element)} className="text-body-m" />
                  )}
                </Td>
                <Td alignement="droite">
                  <div className="flex justify-end gap-2">
                    {actionLigne?.(element)}
                    <Button size="icon-sm" variant="outline" aria-label={`Modifier ${element.nom}`} onClick={() => setFormulaire({ initial: element })}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button size="icon-sm" variant="outline" aria-label={`Supprimer ${element.nom}`} onClick={() => setASupprimer(element)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Tableau>

      <Pagination {...pagination} total={elements.length} pageSize={TAILLE_PAGE} />

      {formulaire && (
        <FormulaireReferentiel
          textes={textes}
          initial={formulaire.initial}
          ordreSuivant={ordreSuivant}
          avecImage={avecImage}
          enregistrer={(saisie) => (formulaire.initial ? modifier(formulaire.initial.id, saisie) : creer(saisie))}
          onClose={() => setFormulaire(null)}
        />
      )}
      <ConfirmModal
        open={Boolean(aSupprimer)}
        title={`Supprimer ${textes.ceElement} ?`}
        message={`« ${aSupprimer?.nom ?? ""} » sera supprimé définitivement.`}
        confirmLabel="Supprimer"
        isPending={suppressionEnCours}
        onConfirm={confirmerSuppression}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
