import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMeublesAdmin, useCreateMeubles, useUpdateMeuble, useDeleteMeuble } from "@/hooks/useMeubles";
import { useEquipementsAdmin, useCreateEquipements, useUpdateEquipement, useDeleteEquipement } from "@/hooks/useEquipements";
import { useCategoriesMeubleAdmin, useCreateCategorieMeuble, useUpdateCategorieMeuble, useDeleteCategorieMeuble } from "@/hooks/useCategorieMeuble";
import { useCategoriesEquipementAdmin, useCreateCategorieEquipement, useUpdateCategorieEquipement, useDeleteCategorieEquipement } from "@/hooks/useCategorieEquipement";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import Pagination from "@/components/ui/Pagination";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/textarea";
import { EnTeteAdmin, FiltresStatut, LigneChargement, LigneMessage, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";
import { messageErreurApi } from "@/lib/erreurApi";

// Meubles et équipements proposés dans le formulaire d'annonce, et leurs catégories.
// Les deux familles ont la même forme : la page les décrit une fois (FAMILLES) et affiche
// pour chacune un tableau de la planche 25. Création et modification en fenêtre.

type Famille = "meuble" | "equipement";
type Vue = "elements" | "categories";

interface Element {
  id: string;
  nom: string;
  categorieId: string;
  categorie: { id: string; nom: string };
  actif: boolean;
}

interface Categorie {
  id: string;
  nom: string;
  slug: string;
  actif: boolean;
  ordre: number;
}

interface DonneesFamille {
  titre: string;
  unElement: string;
  exemples: string;
  elements: Element[];
  categories: Categorie[];
  chargement: boolean;
  creer: (items: { nom: string; categorieId: string }[]) => Promise<unknown>;
  modifier: (id: string, payload: { nom?: string; categorieId?: string; actif?: boolean }) => Promise<unknown>;
  supprimer: (id: string) => Promise<unknown>;
  creerCategorie: (payload: { nom: string; ordre?: number }) => Promise<unknown>;
  modifierCategorie: (id: string, payload: { nom?: string; ordre?: number; actif?: boolean }) => Promise<unknown>;
  supprimerCategorie: (id: string) => Promise<unknown>;
}

const TAILLE_PAGE = 10;
const NOM_MIN = 2;
const TOUTES = "Toutes";
const FAMILLES_ORDRE: Famille[] = ["meuble", "equipement"];
const OPTIONS_FAMILLE = [
  { value: "meuble" as const, label: "Meubles" },
  { value: "equipement" as const, label: "Équipements" },
];

type Cible = { famille: Famille; genre: "element" | "categorie"; id: string; nom: string };

function useFamilles(): Record<Famille, DonneesFamille> {
  const meubles = useMeublesAdmin();
  const equipements = useEquipementsAdmin();
  const catMeubles = useCategoriesMeubleAdmin();
  const catEquipements = useCategoriesEquipementAdmin();
  const createMeubles = useCreateMeubles();
  const updateMeuble = useUpdateMeuble();
  const deleteMeuble = useDeleteMeuble();
  const createEquipements = useCreateEquipements();
  const updateEquipement = useUpdateEquipement();
  const deleteEquipement = useDeleteEquipement();
  const createCatMeuble = useCreateCategorieMeuble();
  const updateCatMeuble = useUpdateCategorieMeuble();
  const deleteCatMeuble = useDeleteCategorieMeuble();
  const createCatEquipement = useCreateCategorieEquipement();
  const updateCatEquipement = useUpdateCategorieEquipement();
  const deleteCatEquipement = useDeleteCategorieEquipement();

  return {
    meuble: {
      titre: "Meubles",
      unElement: "un meuble",
      exemples: "Canapé\nTable basse\nBibliothèque",
      elements: meubles.data ?? [],
      categories: catMeubles.data ?? [],
      chargement: meubles.isLoading || catMeubles.isLoading,
      creer: (items) => createMeubles.mutateAsync({ items }),
      modifier: (id, payload) => updateMeuble.mutateAsync({ id, payload }),
      supprimer: (id) => deleteMeuble.mutateAsync(id),
      creerCategorie: (payload) => createCatMeuble.mutateAsync(payload),
      modifierCategorie: (id, payload) => updateCatMeuble.mutateAsync({ id, payload }),
      supprimerCategorie: (id) => deleteCatMeuble.mutateAsync(id),
    },
    equipement: {
      titre: "Équipements",
      unElement: "un équipement",
      exemples: "Climatisation\nVentilateur\nTélévision",
      elements: equipements.data ?? [],
      categories: catEquipements.data ?? [],
      chargement: equipements.isLoading || catEquipements.isLoading,
      creer: (items) => createEquipements.mutateAsync({ items }),
      modifier: (id, payload) => updateEquipement.mutateAsync({ id, payload }),
      supprimer: (id) => deleteEquipement.mutateAsync(id),
      creerCategorie: (payload) => createCatEquipement.mutateAsync(payload),
      modifierCategorie: (id, payload) => updateCatEquipement.mutateAsync({ id, payload }),
      supprimerCategorie: (id) => deleteCatEquipement.mutateAsync(id),
    },
  };
}

const lignes = (texte: string) =>
  texte
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter((ligne) => ligne.length >= NOM_MIN);

function BoutonsLigne({ nom, onModifier, onSupprimer }: { nom: string; onModifier: () => void; onSupprimer: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <Button size="icon-sm" variant="outline" aria-label={`Modifier ${nom}`} onClick={onModifier}>
        <Pencil aria-hidden />
      </Button>
      <Button size="icon-sm" variant="outline" aria-label={`Supprimer ${nom}`} onClick={onSupprimer}>
        <Trash2 aria-hidden />
      </Button>
    </div>
  );
}

function InterrupteurActif({ actif, enCours, onBasculer }: { actif: boolean; enCours: boolean; onBasculer: () => void }) {
  if (enCours) return <Loader2 aria-label="Enregistrement" className="size-5 animate-spin text-baobab" />;
  return <Switch label={actif ? "Oui" : "Non"} checked={actif} onChange={onBasculer} className="text-body-m" />;
}

function TableauElements({
  donnees,
  elements,
  afficherCategorie,
  enBascule,
  onBasculer,
  onModifier,
  onSupprimer,
}: {
  donnees: DonneesFamille;
  elements: Element[];
  afficherCategorie: boolean;
  enBascule: string | null;
  onBasculer: (element: Element) => void;
  onModifier: (element: Element) => void;
  onSupprimer: (element: Element) => void;
}) {
  const pagination = usePagination(elements, TAILLE_PAGE);
  const nbColonnes = afficherCategorie ? 4 : 3;
  return (
    <section aria-label={donnees.titre} className="min-w-0 space-y-3">
      <h2 className="font-display text-h3 font-bold text-encre">
        {donnees.titre} <span className="font-body text-body-l font-normal text-texte2">· {elements.length}</span>
      </h2>
      <Tableau label={donnees.titre}>
        <TeteTableau>
          <Th>Nom</Th>
          {afficherCategorie && <Th>Catégorie</Th>}
          <Th>Proposé</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {donnees.chargement ? (
            <LigneChargement colonnes={nbColonnes} label={`Chargement : ${donnees.titre}`} />
          ) : elements.length === 0 ? (
            <LigneMessage colonnes={nbColonnes}>Rien dans cette catégorie pour l'instant.</LigneMessage>
          ) : (
            pagination.pageItems.map((element) => (
              <Tr key={element.id}>
                <Td className="font-semibold">{element.nom}</Td>
                {afficherCategorie && <Td className="text-texte2">{element.categorie.nom}</Td>}
                <Td>
                  <InterrupteurActif actif={element.actif} enCours={enBascule === element.id} onBasculer={() => onBasculer(element)} />
                </Td>
                <Td alignement="droite">
                  <BoutonsLigne nom={element.nom} onModifier={() => onModifier(element)} onSupprimer={() => onSupprimer(element)} />
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Tableau>
      <Pagination {...pagination} total={elements.length} pageSize={TAILLE_PAGE} />
    </section>
  );
}

function TableauCategories({
  donnees,
  enBascule,
  onBasculer,
  onModifier,
  onSupprimer,
}: {
  donnees: DonneesFamille;
  enBascule: string | null;
  onBasculer: (categorie: Categorie) => void;
  onModifier: (categorie: Categorie) => void;
  onSupprimer: (categorie: Categorie) => void;
}) {
  const pagination = usePagination(donnees.categories, TAILLE_PAGE);
  const nbColonnes = 5;
  return (
    <section aria-label={`Catégories de ${donnees.titre.toLowerCase()}`} className="min-w-0 space-y-3">
      <h2 className="font-display text-h3 font-bold text-encre">
        Catégories de {donnees.titre.toLowerCase()} <span className="font-body text-body-l font-normal text-texte2">· {donnees.categories.length}</span>
      </h2>
      <Tableau label={`Catégories de ${donnees.titre.toLowerCase()}`}>
        <TeteTableau>
          <Th>Nom</Th>
          <Th>Slug</Th>
          <Th alignement="droite">Ordre</Th>
          <Th>Proposée</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {donnees.chargement ? (
            <LigneChargement colonnes={nbColonnes} label="Chargement des catégories" />
          ) : donnees.categories.length === 0 ? (
            <LigneMessage colonnes={nbColonnes}>Aucune catégorie. Ajoutez la première.</LigneMessage>
          ) : (
            pagination.pageItems.map((categorie) => (
              <Tr key={categorie.id}>
                <Td className="font-semibold">{categorie.nom}</Td>
                <Td>
                  <span className="rounded-control bg-surface px-2 py-1 font-mono text-ref text-texte2">{categorie.slug}</span>
                </Td>
                <Td montant>{categorie.ordre}</Td>
                <Td>
                  <InterrupteurActif actif={categorie.actif} enCours={enBascule === categorie.id} onBasculer={() => onBasculer(categorie)} />
                </Td>
                <Td alignement="droite">
                  <BoutonsLigne nom={categorie.nom} onModifier={() => onModifier(categorie)} onSupprimer={() => onSupprimer(categorie)} />
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Tableau>
      <Pagination {...pagination} total={donnees.categories.length} pageSize={TAILLE_PAGE} />
    </section>
  );
}

function ChoixCategorie({ categories, value, onChange, error }: { categories: Categorie[]; value: string; onChange: (id: string) => void; error?: string }) {
  return (
    <FormField label="Catégorie" error={error}>
      <NativeSelect value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Choisir une catégorie</option>
        {categories
          .filter(({ actif }) => actif)
          .map((categorie) => (
            <option key={categorie.id} value={categorie.id}>
              {categorie.nom}
            </option>
          ))}
      </NativeSelect>
    </FormField>
  );
}

function BoutonsFormulaire({ enCours, libelle, onClose }: { enCours: boolean; libelle: string; onClose: () => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button type="button" variant="outline" onClick={onClose} disabled={enCours}>
        Annuler
      </Button>
      <Button type="submit" disabled={enCours}>
        {enCours && <Loader2 aria-hidden className="animate-spin" />}
        {libelle}
      </Button>
    </div>
  );
}

/** Ajout en lot : une famille, une catégorie de cette famille, un nom par ligne. */
function FormulaireAjout({ familles, onClose }: { familles: Record<Famille, DonneesFamille>; onClose: () => void }) {
  const [famille, setFamille] = useState<Famille>("meuble");
  const [categorieId, setCategorieId] = useState("");
  const [noms, setNoms] = useState("");
  const [erreurs, setErreurs] = useState<{ categorie?: string; noms?: string }>({});
  const [enCours, setEnCours] = useState(false);
  const donnees = familles[famille];

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    const items = lignes(noms).map((nom) => ({ nom, categorieId }));
    const nouvelles = {
      categorie: categorieId ? undefined : "Choisissez la catégorie.",
      noms: items.length > 0 ? undefined : `Écrivez au moins un nom de ${NOM_MIN} caractères ou plus.`,
    };
    setErreurs(nouvelles);
    if (nouvelles.categorie || nouvelles.noms) return;
    setEnCours(true);
    try {
      await donnees.creer(items);
      toast.success(`${items.length} élément${items.length > 1 ? "s" : ""} ajouté${items.length > 1 ? "s" : ""}`);
      onClose();
    } catch (error) {
      toast.error(messageErreurApi(error, "L'ajout a échoué. Réessayez."));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && !enCours && onClose()} title="Ajouter des éléments">
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <SegmentedControl
          label="Famille"
          options={OPTIONS_FAMILLE}
          value={famille}
          onChange={(valeur) => {
            setFamille(valeur);
            setCategorieId("");
          }}
        />
        <ChoixCategorie categories={donnees.categories} value={categorieId} onChange={setCategorieId} error={erreurs.categorie} />
        <FormField label={donnees.titre} help="Un nom par ligne." error={erreurs.noms}>
          <Textarea rows={6} value={noms} onChange={(event) => setNoms(event.target.value)} placeholder={donnees.exemples} />
        </FormField>
        <BoutonsFormulaire enCours={enCours} libelle="Ajouter" onClose={onClose} />
      </form>
    </SheetDialog>
  );
}

function FormulaireElement({ donnees, element, onClose }: { donnees: DonneesFamille; element: Element; onClose: () => void }) {
  const [nom, setNom] = useState(element.nom);
  const [categorieId, setCategorieId] = useState(element.categorieId);
  const [erreurs, setErreurs] = useState<{ nom?: string; categorie?: string }>({});
  const [enCours, setEnCours] = useState(false);

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    const nouvelles = {
      nom: nom.trim().length >= NOM_MIN ? undefined : `Le nom compte au moins ${NOM_MIN} caractères.`,
      categorie: categorieId ? undefined : "Choisissez la catégorie.",
    };
    setErreurs(nouvelles);
    if (nouvelles.nom || nouvelles.categorie) return;
    setEnCours(true);
    try {
      await donnees.modifier(element.id, { nom: nom.trim(), categorieId });
      toast.success("Modifications enregistrées");
      onClose();
    } catch (error) {
      toast.error(messageErreurApi(error, "L'enregistrement a échoué. Réessayez."));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && !enCours && onClose()} title={`Modifier ${donnees.unElement}`}>
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <FormField label="Nom" error={erreurs.nom}>
          <Input value={nom} onChange={(event) => setNom(event.target.value)} />
        </FormField>
        <ChoixCategorie categories={donnees.categories} value={categorieId} onChange={setCategorieId} error={erreurs.categorie} />
        <BoutonsFormulaire enCours={enCours} libelle="Enregistrer" onClose={onClose} />
      </form>
    </SheetDialog>
  );
}

function FormulaireCategorie({
  familles,
  initiale,
  onClose,
}: {
  familles: Record<Famille, DonneesFamille>;
  initiale?: { famille: Famille; categorie: Categorie };
  onClose: () => void;
}) {
  const ordreSuivant = (cible: Famille) => familles[cible].categories.reduce((max, { ordre }) => Math.max(max, ordre), -1) + 1;
  const [famille, setFamilleBrute] = useState<Famille>(initiale?.famille ?? "meuble");
  const donnees = familles[famille];
  const [nom, setNom] = useState(initiale?.categorie.nom ?? "");
  const [ordre, setOrdre] = useState(String(initiale?.categorie.ordre ?? ordreSuivant(famille)));

  const setFamille = (valeur: Famille) => {
    setFamilleBrute(valeur);
    setOrdre(String(ordreSuivant(valeur)));
  };
  const [erreur, setErreur] = useState<string>();
  const [enCours, setEnCours] = useState(false);

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    if (nom.trim().length < NOM_MIN) {
      setErreur(`Le nom compte au moins ${NOM_MIN} caractères.`);
      return;
    }
    setErreur(undefined);
    setEnCours(true);
    const payload = { nom: nom.trim(), ordre: Number(ordre) || 0 };
    try {
      if (initiale) await donnees.modifierCategorie(initiale.categorie.id, payload);
      else await donnees.creerCategorie(payload);
      toast.success(initiale ? "Catégorie enregistrée" : "Catégorie ajoutée");
      onClose();
    } catch (error) {
      toast.error(messageErreurApi(error, "La catégorie n'a pas pu être enregistrée. Réessayez."));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && !enCours && onClose()} title={initiale ? "Modifier la catégorie" : "Ajouter une catégorie"}>
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        {!initiale && <SegmentedControl label="Famille" options={OPTIONS_FAMILLE} value={famille} onChange={setFamille} />}
        <FormField label="Nom de la catégorie" error={erreur}>
          <Input value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Salon" />
        </FormField>
        <FormField label="Ordre d'affichage" help="Les plus petits nombres s'affichent en premier.">
          <Input type="number" min={0} value={ordre} onChange={(event) => setOrdre(event.target.value)} />
        </FormField>
        <BoutonsFormulaire enCours={enCours} libelle={initiale ? "Enregistrer" : "Ajouter"} onClose={onClose} />
      </form>
    </SheetDialog>
  );
}

export default function MeubleEquipement() {
  const familles = useFamilles();
  const [vue, setVue] = useState<Vue>("elements");
  const [filtre, setFiltre] = useState(TOUTES);
  const [ajout, setAjout] = useState(false);
  const [elementEnEdition, setElementEnEdition] = useState<{ famille: Famille; element: Element } | null>(null);
  const [categorieEnEdition, setCategorieEnEdition] = useState<{ initiale?: { famille: Famille; categorie: Categorie } } | null>(null);
  const [aSupprimer, setASupprimer] = useState<Cible | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [enBascule, setEnBascule] = useState<string | null>(null);

  const tousElements = FAMILLES_ORDRE.flatMap((famille) => familles[famille].elements);
  const nomsCategories = Array.from(new Set(FAMILLES_ORDRE.flatMap((famille) => familles[famille].categories.map(({ nom }) => nom)))).sort();
  const filtres = [
    { valeur: TOUTES, label: TOUTES, compteur: tousElements.length },
    ...nomsCategories.map((nom) => ({ valeur: nom, label: nom, compteur: tousElements.filter((element) => element.categorie.nom === nom).length })),
  ];
  const filtrer = (elements: Element[]) => (filtre === TOUTES ? elements : elements.filter((element) => element.categorie.nom === filtre));

  const basculer = async (cle: string, action: () => Promise<unknown>, message: string) => {
    setEnBascule(cle);
    try {
      await action();
      toast.success(message);
    } catch (error) {
      toast.error(messageErreurApi(error, "Le changement n'a pas pu être enregistré. Réessayez."));
    } finally {
      setEnBascule(null);
    }
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    const donnees = familles[aSupprimer.famille];
    setSuppressionEnCours(true);
    try {
      if (aSupprimer.genre === "element") await donnees.supprimer(aSupprimer.id);
      else await donnees.supprimerCategorie(aSupprimer.id);
      toast.success(`« ${aSupprimer.nom} » a été supprimé`);
    } catch (error) {
      toast.error(messageErreurApi(error, "La suppression a échoué. Réessayez."));
    } finally {
      setSuppressionEnCours(false);
      setASupprimer(null);
    }
  };

  return (
    <div className="space-y-6">
      <EnTeteAdmin
        titre="Meubles et équipements"
        description={`${familles.meuble.categories.length} catégories de meubles · ${familles.equipement.categories.length} catégories d'équipements`}
        actions={
          vue === "elements" ? (
            <Button onClick={() => setAjout(true)}>
              <Plus aria-hidden />
              Ajouter des éléments
            </Button>
          ) : (
            <Button onClick={() => setCategorieEnEdition({})}>
              <Plus aria-hidden />
              Ajouter une catégorie
            </Button>
          )
        }
      />

      <SegmentedControl<Vue>
        label="Afficher"
        options={[
          { value: "elements", label: "Éléments" },
          { value: "categories", label: "Catégories" },
        ]}
        value={vue}
        onChange={setVue}
      />

      {vue === "elements" ? (
        <>
          <FiltresStatut label="Filtrer par catégorie" options={filtres} valeur={filtre} onChange={setFiltre} />
          <div className="grid gap-6 2xl:grid-cols-2">
            {FAMILLES_ORDRE.map((famille) => {
              const donnees = familles[famille];
              return (
                <TableauElements
                  key={`${famille}-${filtre}`}
                  donnees={donnees}
                  elements={filtrer(donnees.elements)}
                  afficherCategorie={filtre === TOUTES}
                  enBascule={enBascule}
                  onBasculer={(element) =>
                    basculer(element.id, () => donnees.modifier(element.id, { actif: !element.actif }), element.actif ? `« ${element.nom} » est masqué` : `« ${element.nom} » est proposé`)
                  }
                  onModifier={(element) => setElementEnEdition({ famille, element })}
                  onSupprimer={(element) => setASupprimer({ famille, genre: "element", id: element.id, nom: element.nom })}
                />
              );
            })}
          </div>
        </>
      ) : (
        <div className="grid gap-6 2xl:grid-cols-2">
          {FAMILLES_ORDRE.map((famille) => {
            const donnees = familles[famille];
            return (
              <TableauCategories
                key={famille}
                donnees={donnees}
                enBascule={enBascule}
                onBasculer={(categorie) =>
                  basculer(
                    categorie.id,
                    () => donnees.modifierCategorie(categorie.id, { actif: !categorie.actif }),
                    categorie.actif ? `« ${categorie.nom} » est masquée` : `« ${categorie.nom} » est proposée`,
                  )
                }
                onModifier={(categorie) => setCategorieEnEdition({ initiale: { famille, categorie } })}
                onSupprimer={(categorie) => setASupprimer({ famille, genre: "categorie", id: categorie.id, nom: categorie.nom })}
              />
            );
          })}
        </div>
      )}

      {ajout && <FormulaireAjout familles={familles} onClose={() => setAjout(false)} />}
      {elementEnEdition && (
        <FormulaireElement
          key={elementEnEdition.element.id}
          donnees={familles[elementEnEdition.famille]}
          element={elementEnEdition.element}
          onClose={() => setElementEnEdition(null)}
        />
      )}
      {categorieEnEdition && (
        <FormulaireCategorie
          key={categorieEnEdition.initiale?.categorie.id ?? "nouvelle"}
          familles={familles}
          initiale={categorieEnEdition.initiale}
          onClose={() => setCategorieEnEdition(null)}
        />
      )}
      <ConfirmModal
        open={Boolean(aSupprimer)}
        title={aSupprimer?.genre === "categorie" ? "Supprimer cette catégorie ?" : "Supprimer cet élément ?"}
        message={
          aSupprimer?.genre === "categorie"
            ? `« ${aSupprimer.nom} » sera supprimée. Déplacez d'abord les éléments qu'elle contient dans une autre catégorie.`
            : `« ${aSupprimer?.nom ?? ""} » disparaîtra du formulaire d'annonce.`
        }
        confirmLabel="Supprimer"
        isPending={suppressionEnCours}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
