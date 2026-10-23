import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAllPaysAdmin, useAllVillesAdmin, useAllQuartiersAdmin, useCreateQuartier, useUpdateQuartier, useDeleteQuartier } from "@/hooks/useGeo";
import type { Pays, Quartier } from "@/api/geo";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { EnTeteAdmin, LigneChargement, LigneMessage, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";
import { messageErreurApi } from "@/lib/erreurApi";

// Quartiers et coordonnées GPS (Configuration · Géographie) : même modèle que la page Pays,
// filtres Pays puis Ville au-dessus du tableau.

const NB_COLONNES = 4;
const DECIMALES_GPS = 6;

interface ErreursQuartier {
  villeId?: string;
  nom?: string;
  latitude?: string;
  longitude?: string;
}

const lireCoordonnee = (valeur: string): number | null => {
  const nombre = parseFloat(valeur.replace(",", "."));
  return Number.isFinite(nombre) ? nombre : null;
};

function FormulaireQuartier({ initial, paysList, onClose }: { initial?: Quartier; paysList: Pays[]; onClose: () => void }) {
  const create = useCreateQuartier();
  const update = useUpdateQuartier();
  const [paysId, setPaysId] = useState(initial?.ville?.pays?.id ?? "");
  const [villeId, setVilleId] = useState(initial?.villeId ?? "");
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [latitude, setLatitude] = useState(initial ? String(initial.latitude) : "");
  const [longitude, setLongitude] = useState(initial ? String(initial.longitude) : "");
  const [erreurs, setErreurs] = useState<ErreursQuartier>({});
  const { data: villesList = [] } = useAllVillesAdmin(paysId || undefined);
  const enCours = create.isPending || update.isPending;

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    const lat = lireCoordonnee(latitude);
    const lng = lireCoordonnee(longitude);
    const nouvelles: ErreursQuartier = {
      villeId: villeId ? undefined : "Choisissez la ville du quartier.",
      nom: nom.trim() ? undefined : "Indiquez le nom du quartier, par exemple Almadies.",
      latitude: lat === null ? "Indiquez la latitude en degrés, par exemple 14.716677." : undefined,
      longitude: lng === null ? "Indiquez la longitude en degrés, par exemple -17.467686." : undefined,
    };
    setErreurs(nouvelles);
    if (Object.values(nouvelles).some(Boolean) || lat === null || lng === null) return;
    const data = { nom: nom.trim(), villeId, latitude: lat, longitude: lng };
    try {
      if (initial) await update.mutateAsync({ id: initial.id, data });
      else await create.mutateAsync(data);
      toast.success(initial ? "Quartier modifié" : "Quartier ajouté");
      onClose();
    } catch (error) {
      toast.error(messageErreurApi(error, "Le quartier n'a pas pu être enregistré. Réessayez."));
    }
  };

  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title={initial ? "Modifier le quartier" : "Ajouter un quartier"}>
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <FormField label="Pays">
          <NativeSelect
            value={paysId}
            onChange={(event) => {
              setPaysId(event.target.value);
              setVilleId("");
            }}
          >
            <option value="">Choisir un pays</option>
            {paysList.map((pays) => (
              <option key={pays.id} value={pays.id}>
                {pays.nom}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Ville" help={paysId ? undefined : "Choisissez d'abord le pays."} error={erreurs.villeId}>
          <NativeSelect value={villeId} onChange={(event) => setVilleId(event.target.value)} disabled={!paysId}>
            <option value="">Choisir une ville</option>
            {villesList.map((ville) => (
              <option key={ville.id} value={ville.id}>
                {ville.nom}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Nom du quartier" error={erreurs.nom}>
          <Input value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Almadies" />
        </FormField>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Latitude" error={erreurs.latitude}>
            <Input inputMode="decimal" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="14.716677" className="font-mono" />
          </FormField>
          <FormField label="Longitude" error={erreurs.longitude}>
            <Input inputMode="decimal" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="-17.467686" className="font-mono" />
          </FormField>
        </div>
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

export default function QuartiersPage() {
  const { data: paysList = [] } = useAllPaysAdmin();
  const [filtrePays, setFiltrePays] = useState("");
  const [filtreVille, setFiltreVille] = useState("");
  const { data: villesFiltre = [] } = useAllVillesAdmin(filtrePays || undefined);
  const { data: quartiers = [], isLoading } = useAllQuartiersAdmin(filtreVille || undefined);
  const deleteQuartier = useDeleteQuartier();
  const [formulaire, setFormulaire] = useState<{ initial?: Quartier } | null>(null);
  const [aSupprimer, setASupprimer] = useState<Quartier | null>(null);

  const supprimer = async () => {
    if (!aSupprimer) return;
    try {
      await deleteQuartier.mutateAsync(aSupprimer.id);
      toast.success("Quartier supprimé");
    } catch (error) {
      toast.error(messageErreurApi(error, "Le quartier n'a pas pu être supprimé."));
    } finally {
      setASupprimer(null);
    }
  };

  return (
    <div>
      <EnTeteAdmin
        titre="Quartiers"
        description="Les quartiers de chaque ville et leurs coordonnées GPS, utilisées par la carte."
        actions={
          <Button onClick={() => setFormulaire({})}>
            <Plus aria-hidden />
            Ajouter un quartier
          </Button>
        }
      />

      <div className="mb-4 grid gap-3 sm:flex">
        <NativeSelect
          aria-label="Filtrer par pays"
          value={filtrePays}
          onChange={(event) => {
            setFiltrePays(event.target.value);
            setFiltreVille("");
          }}
          className="w-full sm:w-56"
        >
          <option value="">Pays : tous</option>
          {paysList.map((pays) => (
            <option key={pays.id} value={pays.id}>
              Pays : {pays.nom}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Filtrer par ville" value={filtreVille} onChange={(event) => setFiltreVille(event.target.value)} disabled={!filtrePays} className="w-full sm:w-56">
          <option value="">{filtrePays ? "Ville : toutes" : "Ville : choisissez un pays"}</option>
          {villesFiltre.map((ville) => (
            <option key={ville.id} value={ville.id}>
              Ville : {ville.nom}
            </option>
          ))}
        </NativeSelect>
      </div>

      <Tableau label="Quartiers">
        <TeteTableau>
          <Th>Quartier</Th>
          <Th>Ville</Th>
          <Th>Coordonnées GPS</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des quartiers" />
          ) : quartiers.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>Aucun quartier pour ce filtre. Ajoutez le premier.</LigneMessage>
          ) : (
            quartiers.map((quartier) => (
              <Tr key={quartier.id}>
                <Td className="font-semibold">{quartier.nom}</Td>
                <Td className="text-texte2">{[quartier.ville?.nom, quartier.ville?.pays?.nom].filter(Boolean).join(" · ")}</Td>
                <Td className="whitespace-nowrap font-mono text-ref text-texte2">
                  {quartier.latitude.toFixed(DECIMALES_GPS)}, {quartier.longitude.toFixed(DECIMALES_GPS)}
                </Td>
                <Td alignement="droite">
                  <div className="flex justify-end gap-2">
                    <Button size="icon-sm" variant="outline" aria-label={`Modifier ${quartier.nom}`} onClick={() => setFormulaire({ initial: quartier })}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button size="icon-sm" variant="outline" aria-label={`Supprimer ${quartier.nom}`} onClick={() => setASupprimer(quartier)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Tableau>

      {formulaire && <FormulaireQuartier initial={formulaire.initial} paysList={paysList} onClose={() => setFormulaire(null)} />}
      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer ce quartier ?"
        message={`« ${aSupprimer?.nom ?? ""} » sera supprimé définitivement.`}
        confirmLabel="Supprimer"
        isPending={deleteQuartier.isPending}
        onConfirm={supprimer}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
