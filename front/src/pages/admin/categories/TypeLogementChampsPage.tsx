import { useState, useEffect, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useChampsAdminState, useSetChampsForTypeLogement } from "@/hooks/useTypeLogementChamp";
import { useEquipementsAdminState, useSetEquipementsForTypeLogement } from "@/hooks/useTypeLogementEquipement";
import { useMeublesAdminState, useSetMeublesForTypeLogement } from "@/hooks/useTypeLogementMeuble";
import { useTypeLogementsAdmin } from "@/hooks/useTypeLogements";
import type { ChampWithState } from "@/api/typeLogementChamp";
import type { EquipementWithState } from "@/api/typeLogementEquipement";
import type { MeubleWithState } from "@/api/typeLogementMeuble";
import { Button } from "@/components/ui/button";
import { BlocChargement, CaseSelection, EnTeteAdmin, SectionAdmin } from "@/components/admin/table/Tableau";

// Champs, équipements et meubles proposés pour un type de logement : une section par famille,
// une carte par catégorie, une case par élément. L'enregistrement remplace toute la configuration.

interface ChampRow {
  champId: string;
  nom: string;
  type: string;
  categorieNom: string;
  categorieOrdre: number;
  actif: boolean;
  associe: boolean;
  obligatoire: boolean;
  ordre: number;
  cleSysteme: string | null;
}

interface SimpleRow {
  id: string;
  nom: string;
  categorieNom: string;
  categorieOrdre: number;
  actif: boolean;
  associe: boolean;
}

function groupByCategorie<T extends { categorieNom: string; categorieOrdre: number }>(rows: T[]) {
  const grouped = rows.reduce<Record<string, { nom: string; ordre: number; items: T[] }>>((acc, r) => {
    if (!acc[r.categorieNom]) acc[r.categorieNom] = { nom: r.categorieNom, ordre: r.categorieOrdre, items: [] };
    acc[r.categorieNom].items.push(r);
    return acc;
  }, {});
  return Object.entries(grouped).sort((a, b) => a[1].ordre - b[1].ordre);
}

function GroupeCategorie({ nom, children }: { nom: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-filet">
      <h3 className="border-b border-filet bg-surface px-4 py-3 text-overline font-semibold uppercase text-texte2">{nom}</h3>
      <ul className="divide-y divide-filet">{children}</ul>
    </div>
  );
}

function ListeVide({ children }: { children: ReactNode }) {
  return <p className="rounded-control bg-surface p-6 text-center text-body-m text-texte2">{children}</p>;
}

function LigneSimple({ row, onToggle }: { row: SimpleRow; onToggle: () => void }) {
  return (
    <li className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-4 px-4 py-3">
      <CaseSelection label={`Proposer ${row.nom}`} checked={row.associe} onChange={onToggle} disabled={!row.actif} />
      <span className={row.associe ? "font-semibold text-encre" : "text-texte2"}>
        {row.nom}
        {!row.actif && <span className="ml-2 text-caption text-texte2">Désactivé</span>}
      </span>
    </li>
  );
}

export default function TypeLogementChampsPage() {
  const { id: typeLogementId = "" } = useParams<{ id: string }>();
  const { data: types = [] }        = useTypeLogementsAdmin();
  const typeLogement                = types.find((t) => t.id === typeLogementId);

  const { data: champsRaw = [], isLoading: champsLoading } = useChampsAdminState(typeLogementId);
  const { data: equipementsRaw = [], isLoading: eqLoading } = useEquipementsAdminState(typeLogementId);
  const { data: meublesRaw = [], isLoading: mblLoading } = useMeublesAdminState(typeLogementId);
  const setChamps = useSetChampsForTypeLogement(typeLogementId);
  const setEquipements = useSetEquipementsForTypeLogement(typeLogementId);
  const setMeubles = useSetMeublesForTypeLogement(typeLogementId);

  const isLoading = champsLoading || eqLoading || mblLoading;
  const isSaving = setChamps.isPending || setEquipements.isPending || setMeubles.isPending;

  const [champRows, setChampRows] = useState<ChampRow[]>([]);
  const [equipementRows, setEquipementRows] = useState<SimpleRow[]>([]);
  const [meubleRows, setMeubleRows] = useState<SimpleRow[]>([]);

  useEffect(() => {
    if (!champsRaw.length) return;
    setChampRows(
      (champsRaw as ChampWithState[]).map((c, i) => ({
        champId:        c.id,
        nom:            c.nom,
        type:           c.type,
        categorieNom:   c.categorie.nom,
        categorieOrdre: c.categorie.ordre,
        actif:          c.actif,
        associe:        c.typeLogements.length > 0,
        obligatoire:    c.typeLogements[0]?.obligatoire ?? false,
        ordre:          c.typeLogements[0]?.ordre ?? i,
        cleSysteme:     c.cleSysteme,
      }))
    );
  }, [champsRaw]);

  useEffect(() => {
    if (!equipementsRaw.length) return;
    setEquipementRows(
      (equipementsRaw as EquipementWithState[]).map((eq) => ({
        id:            eq.id,
        nom:           eq.nom,
        categorieNom:  eq.categorie.nom,
        categorieOrdre: 0,
        actif:         eq.actif,
        associe:       eq.typeLogements.length > 0,
      }))
    );
  }, [equipementsRaw]);

  useEffect(() => {
    if (!meublesRaw.length) return;
    setMeubleRows(
      (meublesRaw as MeubleWithState[]).map((m) => ({
        id:            m.id,
        nom:           m.nom,
        categorieNom:  m.categorie.nom,
        categorieOrdre: 0,
        actif:         m.actif,
        associe:       m.typeLogements.length > 0,
      }))
    );
  }, [meublesRaw]);

  const toggle = (champId: string) => {
    setChampRows((prev) =>
      prev.map((r) =>
        r.champId === champId ? { ...r, associe: !r.associe, obligatoire: false } : r
      )
    );
  };

  const toggleObligatoire = (champId: string) => {
    setChampRows((prev) =>
      prev.map((r) =>
        r.champId === champId && r.associe ? { ...r, obligatoire: !r.obligatoire } : r
      )
    );
  };

  const toggleEquipement = (id: string) => {
    setEquipementRows((prev) => prev.map((r) => (r.id === id ? { ...r, associe: !r.associe } : r)));
  };

  const toggleMeuble = (id: string) => {
    setMeubleRows((prev) => prev.map((r) => (r.id === id ? { ...r, associe: !r.associe } : r)));
  };

  const handleSave = async () => {
    const associatedChamps = champRows
      .filter((r) => r.associe)
      .map((r, i) => ({ champId: r.champId, obligatoire: r.obligatoire, ordre: i }));
    const associatedEquipementIds = equipementRows.filter((r) => r.associe).map((r) => r.id);
    const associatedMeubleIds = meubleRows.filter((r) => r.associe).map((r) => r.id);

    try {
      await Promise.all([
        setChamps.mutateAsync(associatedChamps),
        setEquipements.mutateAsync(associatedEquipementIds),
        setMeubles.mutateAsync(associatedMeubleIds),
      ]);
      toast.success("Configuration enregistrée");
    } catch {
      toast.error("La configuration n'a pas pu être enregistrée. Réessayez.");
    }
  };

  const sortedChampGroups = groupByCategorie(champRows);
  const sortedEquipementGroups = groupByCategorie(equipementRows);
  const sortedMeubleGroups = groupByCategorie(meubleRows);
  const nbAssocies = champRows.filter((r) => r.associe).length
    + equipementRows.filter((r) => r.associe).length
    + meubleRows.filter((r) => r.associe).length;

  const boutonEnregistrer = (
    <Button onClick={handleSave} disabled={isSaving || isLoading}>
      {isSaving ? <Loader2 aria-hidden className="animate-spin" /> : <Check aria-hidden />}
      Enregistrer la configuration
    </Button>
  );

  return (
    <div>
      <EnTeteAdmin
        retour={{ to: "/admin/biens/categories", label: "Types de logement" }}
        titre={typeLogement?.nom ?? "Type de logement"}
        description={`${nbAssocies} élément${nbAssocies > 1 ? "s" : ""} proposé${nbAssocies > 1 ? "s" : ""} dans le formulaire d'annonce de ce type.`}
        actions={boutonEnregistrer}
      />

      {isLoading ? (
        <BlocChargement label="Chargement de la configuration" />
      ) : (
        <div className="space-y-6">
          <SectionAdmin titre="Champs" description="Cochez les champs à proposer. « Obligatoire » empêche de publier sans les remplir.">
            {champRows.length === 0 ? (
              <ListeVide>
                Aucun champ pour l'instant. Créez-les dans{" "}
                <Link to="/admin/champs" className="font-semibold text-baobab hover:underline">
                  Champs de formulaire
                </Link>
                .
              </ListeVide>
            ) : (
              <div className="space-y-4">
                {sortedChampGroups.map(([catNom, group]) => (
                  <GroupeCategorie key={catNom} nom={group.nom}>
                    {group.items.map((row) => (
                      <li key={row.champId} className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[auto_1fr_auto]">
                        <CaseSelection label={`Proposer ${row.nom}`} checked={row.associe} onChange={() => toggle(row.champId)} disabled={!row.actif} />
                        <span className="min-w-0">
                          <span className={row.associe ? "font-semibold text-encre" : "text-texte2"}>{row.nom}</span>
                          {row.cleSysteme && <span className="ml-2 text-caption text-texte2">Champ système</span>}
                          {!row.actif && <span className="ml-2 text-caption text-texte2">Désactivé</span>}
                          <span className="block font-mono text-ref text-texte2">{row.type}</span>
                        </span>
                        {row.associe && (
                          <label className="col-start-2 inline-flex min-h-10 cursor-pointer items-center gap-2 text-body-m text-encre sm:col-start-3">
                            <input
                              type="checkbox"
                              checked={row.obligatoire}
                              onChange={() => toggleObligatoire(row.champId)}
                              className="size-5 cursor-pointer rounded-marker accent-baobab"
                            />
                            Obligatoire
                          </label>
                        )}
                      </li>
                    ))}
                  </GroupeCategorie>
                ))}
              </div>
            )}
          </SectionAdmin>

          <SectionAdmin titre="Équipements" description="Les équipements que le propriétaire peut cocher pour ce type de bien.">
            {equipementRows.length === 0 ? (
              <ListeVide>
                Aucun équipement pour l'instant. Créez-les dans{" "}
                <Link to="/admin/biens/meuble-equipement" className="font-semibold text-baobab hover:underline">
                  Meubles et équipements
                </Link>
                .
              </ListeVide>
            ) : (
              <div className="space-y-4">
                {sortedEquipementGroups.map(([catNom, group]) => (
                  <GroupeCategorie key={catNom} nom={group.nom}>
                    {group.items.map((row) => (
                      <LigneSimple key={row.id} row={row} onToggle={() => toggleEquipement(row.id)} />
                    ))}
                  </GroupeCategorie>
                ))}
              </div>
            )}
          </SectionAdmin>

          <SectionAdmin titre="Meubles" description="Les meubles que le propriétaire peut déclarer pour ce type de bien.">
            {meubleRows.length === 0 ? (
              <ListeVide>
                Aucun meuble pour l'instant. Créez-les dans{" "}
                <Link to="/admin/biens/meuble-equipement" className="font-semibold text-baobab hover:underline">
                  Meubles et équipements
                </Link>
                .
              </ListeVide>
            ) : (
              <div className="space-y-4">
                {sortedMeubleGroups.map(([catNom, group]) => (
                  <GroupeCategorie key={catNom} nom={group.nom}>
                    {group.items.map((row) => (
                      <LigneSimple key={row.id} row={row} onToggle={() => toggleMeuble(row.id)} />
                    ))}
                  </GroupeCategorie>
                ))}
              </div>
            )}
          </SectionAdmin>

          <div className="grid sm:justify-end">{boutonEnregistrer}</div>
        </div>
      )}
    </div>
  );
}
