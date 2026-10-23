import { useState, type FormEvent } from "react";
import { Check, Copy, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useModelesAdmin, useCreateModele, useUpdateModele, useDeleteModele } from "@/hooks/useModeleContrat";
import { paginationServeur } from "@/hooks/usePagination";
import type { ModeleContrat, ModeleContratPayload } from "@/api/modeleContrat";
import RichTextEditor from "@/components/form/RichTextEditor";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import Pagination from "@/components/ui/Pagination";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { Switch } from "@/components/ui/Switch";
import { EnTeteAdmin, LigneChargement, LigneMessage, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";
import { messageErreurApi } from "@/lib/erreurApi";

// Modèles de contrat de bail (Configuration · Modèles de contrats) : tableau de la planche 25
// et éditeur en fenêtre large, avec la liste des variables à copier à côté du texte.

const TAILLE_PAGE = 10;
const NB_COLONNES = 5;
const DUREE_COPIE_MS = 1500;
const CONTENU_VIDE = "<p></p>";
const TYPES_BAIL = ["Meublé", "Non meublé", "Saisonnier", "Commercial", "Mixte"];

const VARIABLES = [
  { key: "{{nom_bailleur}}", label: "Nom du bailleur" },
  { key: "{{prenom_bailleur}}", label: "Prénom du bailleur" },
  { key: "{{nom_locataire}}", label: "Nom du locataire" },
  { key: "{{prenom_locataire}}", label: "Prénom du locataire" },
  { key: "{{profession_locataire}}", label: "Profession du locataire" },
  { key: "{{adresse_bien}}", label: "Adresse du bien" },
  { key: "{{ville}}", label: "Ville" },
  { key: "{{quartier}}", label: "Quartier" },
  { key: "{{loyer}}", label: "Montant du loyer" },
  { key: "{{caution}}", label: "Montant de la caution" },
  { key: "{{date_debut}}", label: "Début du bail" },
  { key: "{{date_fin}}", label: "Fin du bail" },
  { key: "{{type_bail}}", label: "Type de bail" },
  { key: "{{frequence_paiement}}", label: "Fréquence de paiement" },
  { key: "{{date_signature}}", label: "Date de signature" },
];

function Variables() {
  const [copiee, setCopiee] = useState<string | null>(null);

  const copier = async (cle: string) => {
    try {
      await navigator.clipboard.writeText(cle);
      setCopiee(cle);
      setTimeout(() => setCopiee(null), DUREE_COPIE_MS);
    } catch {
      toast.error("La copie a échoué. Sélectionnez la variable et copiez-la à la main.");
    }
  };

  return (
    <section aria-labelledby="titre-variables" className="rounded-card bg-surface p-4">
      <h3 id="titre-variables" className="text-body-m font-semibold text-encre">
        Variables
      </h3>
      <p className="mt-1 text-caption text-texte2">Copiez une variable, puis collez-la dans le texte : elle sera remplacée à la génération du contrat.</p>
      <ul className="mt-3 space-y-1">
        {VARIABLES.map(({ key, label }) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => copier(key)}
              aria-label={`Copier ${key} : ${label}`}
              className="grid min-h-10 w-full grid-cols-[1fr_auto] items-center gap-2 rounded-control px-2 text-left hover:bg-white"
            >
              <span className="min-w-0">
                <span className="block truncate font-mono text-ref text-encre">{key}</span>
                <span className="block text-caption text-texte2">{label}</span>
              </span>
              {copiee === key ? <Check aria-hidden className="size-4 text-baobab" /> : <Copy aria-hidden className="size-4 text-texte2" />}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FormulaireModele({ initial, onClose }: { initial?: ModeleContrat; onClose: () => void }) {
  const create = useCreateModele();
  const update = useUpdateModele();
  const [form, setForm] = useState<ModeleContratPayload>({
    titre: initial?.titre ?? "",
    typeBail: initial?.typeBail ?? null,
    contenu: initial?.contenu ?? "",
    actif: initial?.actif ?? true,
    ordre: initial?.ordre ?? 0,
  });
  const [erreurs, setErreurs] = useState<{ titre?: string; contenu?: string }>({});
  const enCours = create.isPending || update.isPending;

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    const nouvelles = {
      titre: form.titre.trim() ? undefined : "Indiquez le titre du modèle, par exemple Contrat de location meublée.",
      contenu: form.contenu.trim() && form.contenu !== CONTENU_VIDE ? undefined : "Rédigez le texte du contrat.",
    };
    setErreurs(nouvelles);
    if (nouvelles.titre || nouvelles.contenu) return;
    try {
      if (initial) await update.mutateAsync({ id: initial.id, payload: form });
      else await create.mutateAsync(form);
      toast.success(initial ? "Modèle enregistré" : "Modèle ajouté");
      onClose();
    } catch (error) {
      toast.error(messageErreurApi(error, "Le modèle n'a pas pu être enregistré. Réessayez."));
    }
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && !enCours && onClose()} title={initial ? "Modifier le modèle" : "Ajouter un modèle"} className="sm:max-w-6xl">
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-5">
            <FormField label="Titre" error={erreurs.titre}>
              <Input value={form.titre} onChange={(event) => setForm((f) => ({ ...f, titre: event.target.value }))} placeholder="Contrat de location meublée" />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Type de bail">
                <NativeSelect value={form.typeBail ?? ""} onChange={(event) => setForm((f) => ({ ...f, typeBail: event.target.value || null }))}>
                  <option value="">Tous les types</option>
                  {TYPES_BAIL.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField label="Ordre d'affichage">
                <Input type="number" min={0} value={form.ordre ?? 0} onChange={(event) => setForm((f) => ({ ...f, ordre: parseInt(event.target.value, 10) || 0 }))} />
              </FormField>
            </div>
            <div>
              <p className="mb-2 text-body-m font-semibold text-encre">Texte du contrat</p>
              <RichTextEditor value={form.contenu} onChange={(contenu) => setForm((f) => ({ ...f, contenu }))} minHeight="400px" />
              {erreurs.contenu && <FieldError id="erreur-contenu-modele">{erreurs.contenu}</FieldError>}
            </div>
            <Switch label="Proposé aux propriétaires" checked={form.actif ?? true} onChange={(actif) => setForm((f) => ({ ...f, actif }))} />
          </div>
          <Variables />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:ml-auto lg:w-[420px]">
          <Button type="button" variant="outline" onClick={onClose} disabled={enCours}>
            Annuler
          </Button>
          <Button type="submit" disabled={enCours}>
            {enCours && <Loader2 aria-hidden className="animate-spin" />}
            {initial ? "Enregistrer" : "Ajouter le modèle"}
          </Button>
        </div>
      </form>
    </SheetDialog>
  );
}

export default function ModelesContratPage() {
  const [page, setPage] = useState(1);
  const [typeBail, setTypeBail] = useState("");
  const { data, isLoading } = useModelesAdmin({ page, limit: TAILLE_PAGE, typeBail: typeBail || undefined });
  const updateModele = useUpdateModele();
  const deleteModele = useDeleteModele();
  const [formulaire, setFormulaire] = useState<{ initial?: ModeleContrat } | null>(null);
  const [aSupprimer, setASupprimer] = useState<ModeleContrat | null>(null);
  const [enBascule, setEnBascule] = useState<string | null>(null);

  const modeles = data?.items ?? [];
  const meta = data?.meta;

  const basculer = async (modele: ModeleContrat) => {
    setEnBascule(modele.id);
    try {
      await updateModele.mutateAsync({ id: modele.id, payload: { actif: !modele.actif } });
      toast.success(modele.actif ? "Modèle masqué aux propriétaires" : "Modèle proposé aux propriétaires");
    } catch {
      toast.error("Le changement n'a pas pu être enregistré. Réessayez.");
    } finally {
      setEnBascule(null);
    }
  };

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await deleteModele.mutateAsync(aSupprimer.id);
      toast.success("Modèle supprimé");
    } catch (error) {
      toast.error(messageErreurApi(error, "Le modèle n'a pas pu être supprimé."));
    } finally {
      setASupprimer(null);
    }
  };

  return (
    <div className="space-y-4">
      <EnTeteAdmin
        titre="Modèles de contrat"
        description={meta ? `${meta.total} modèle${meta.total > 1 ? "s" : ""} pour générer les contrats de bail.` : "Les modèles qui servent à générer les contrats de bail."}
        actions={
          <Button onClick={() => setFormulaire({})}>
            <Plus aria-hidden />
            Ajouter un modèle
          </Button>
        }
      />

      <NativeSelect
        aria-label="Filtrer par type de bail"
        value={typeBail}
        onChange={(event) => {
          setTypeBail(event.target.value);
          setPage(1);
        }}
        className="w-full sm:w-64"
      >
        <option value="">Type : tous</option>
        {TYPES_BAIL.map((type) => (
          <option key={type} value={type}>
            Type : {type}
          </option>
        ))}
      </NativeSelect>

      <Tableau label="Modèles de contrat">
        <TeteTableau>
          <Th>Titre</Th>
          <Th>Type de bail</Th>
          <Th alignement="droite">Ordre</Th>
          <Th>Proposé</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des modèles" />
          ) : modeles.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>Aucun modèle pour ce filtre. Ajoutez le premier.</LigneMessage>
          ) : (
            modeles.map((modele) => (
              <Tr key={modele.id}>
                <Td className="font-semibold">{modele.titre}</Td>
                <Td className="text-texte2">{modele.typeBail ?? "Tous les types"}</Td>
                <Td montant>{modele.ordre}</Td>
                <Td>
                  {enBascule === modele.id ? (
                    <Loader2 aria-label="Enregistrement" className="size-5 animate-spin text-baobab" />
                  ) : (
                    <Switch label={modele.actif ? "Oui" : "Non"} checked={modele.actif} onChange={() => basculer(modele)} className="text-body-m" />
                  )}
                </Td>
                <Td alignement="droite">
                  <div className="flex justify-end gap-2">
                    <Button size="icon-sm" variant="outline" aria-label={`Modifier ${modele.titre}`} onClick={() => setFormulaire({ initial: modele })}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button size="icon-sm" variant="outline" aria-label={`Supprimer ${modele.titre}`} onClick={() => setASupprimer(modele)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Tableau>

      {meta && <Pagination {...paginationServeur(meta.page, meta.totalPages, setPage)} total={meta.total} pageSize={TAILLE_PAGE} />}

      {formulaire && <FormulaireModele key={formulaire.initial?.id ?? "nouveau"} initial={formulaire.initial} onClose={() => setFormulaire(null)} />}
      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer ce modèle ?"
        message={`« ${aSupprimer?.titre ?? ""} » sera supprimé définitivement.`}
        confirmLabel="Supprimer"
        isPending={deleteModele.isPending}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
