import { ChevronRight, Loader2 } from "lucide-react";
import type { Bien } from "@/api/bien";
import Pagination from "@/components/ui/Pagination";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BienVignette } from "@/components/owner/BienVignette";
import { useIsLargeDesktop } from "@/hooks/useIsDesktop";
import { PanneauDecision } from "@/components/admin/annonces/PanneauDecision";
import { STATUT_ANNONCE, TAILLE_PAGE, useModerationAnnonces, type FiltreAnnonces } from "@/components/admin/annonces/useModerationAnnonces";
import {
  CaseSelection,
  EnTeteAdmin,
  FiltresStatut,
  Initiales,
  LigneMessage,
  RechercheAdmin,
  Tableau,
  Td,
  TeteTableau,
  Th,
  Tr,
  type FiltreOption,
} from "@/components/admin/table/Tableau";
import { formatMontant } from "@/lib/fcfa";
import { referenceBien } from "@/lib/referenceBien";
import { format } from "date-fns";

// Modération des annonces (charte, planches 25 et 41) : file d'attente filtrée par statut,
// recherche, ville et type, sélection multiple, et panneau de décision à droite sur desktop (tiroir sur mobile).

const NB_COLONNES = 7;

const dateSoumission = (date: string) => format(new Date(date), "dd/MM · HH:mm");

function CelluleAnnonce({ annonce }: { annonce: Bien }) {
  return (
    <div className="flex min-w-[200px] items-center gap-3">
      <BienVignette photo={annonce.photos[0]} typeLogement={annonce.typeLogement?.nom} titre="" className="h-12 w-16" />
      <div className="min-w-0">
        <p className="line-clamp-2 font-semibold text-encre">{annonce.titre || "Sans titre"}</p>
        <p className="text-texte2">
          <span className="font-mono text-ref">SK-{referenceBien(annonce.id)}</span>
          {/* La colonne Ville n'apparaît qu'en très grand écran : en dessous, la ville suit la référence. */}
          <span className="2xl:hidden">{annonce.quartier || annonce.ville ? ` · ${annonce.quartier || annonce.ville}` : ""}</span>
        </p>
      </div>
    </div>
  );
}

function CarteMobile({ annonce, onOuvrir }: { annonce: Bien; onOuvrir: () => void }) {
  const statut = STATUT_ANNONCE[annonce.statutAnnonce];
  return (
    <li>
      <button type="button" onClick={onOuvrir} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 py-4 text-left">
        <BienVignette photo={annonce.photos[0]} typeLogement={annonce.typeLogement?.nom} titre="" className="h-14 w-[72px]" />
        <div className="min-w-0">
          <p className="truncate text-title font-semibold text-encre">{annonce.titre || "Sans titre"}</p>
          <p className="truncate text-body-m text-texte2">
            {[annonce.ville, annonce.prix ? `${formatMontant(annonce.prix)} FCFA` : null].filter(Boolean).join(" · ")}
          </p>
          <StatusBadge tone={statut.tone} size="sm" className="mt-2">
            {statut.label}
          </StatusBadge>
        </div>
        <ChevronRight aria-hidden className="size-5 text-texte2" />
      </button>
    </li>
  );
}

export default function Annonces() {
  const m = useModerationAnnonces();
  const panneauLateral = useIsLargeDesktop();

  const filtres: FiltreOption<FiltreAnnonces>[] = [
    { valeur: "EN_ATTENTE", label: "En attente", compteur: m.compteurs?.EN_ATTENTE },
    { valeur: "SIGNALEES", label: "Signalées", compteur: m.compteurs?.SIGNALEES },
    { valeur: "PUBLIE", label: "Publiées" },
    { valeur: "REJETE", label: "Rejetées" },
    { valeur: "TOUS", label: "Toutes" },
  ];
  const toutCoche = m.selectionnables.length > 0 && m.selectionnables.every(({ id }) => m.selection.has(id));
  const unePartie = !toutCoche && m.selectionnables.some(({ id }) => m.selection.has(id));
  const decider = (action: "APPROUVER" | "REJETER", note: string) => m.ouverte && m.decider(m.ouverte, action, note);
  const fileVide = m.filtresActifs ? "Aucune annonce ne correspond à cette recherche." : "Aucune annonce dans cette file. Tout est à jour.";

  const panneau = m.ouverte && (
    <PanneauDecision key={m.ouverte.id} annonce={m.ouverte} enCours={m.decisionEnCours} onDecider={decider} />
  );

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6">
      <div className="min-w-0">
        <EnTeteAdmin
          titre="Annonces"
          description={m.isLoading ? "Chargement de la file…" : `${m.total} annonce${m.total > 1 ? "s" : ""} dans cette file`}
          actions={
            <RechercheAdmin
              label="Rechercher une annonce"
              placeholder="Titre, référence, propriétaire"
              value={m.recherche}
              onChange={m.setRecherche}
            />
          }
        />

        <div className="mb-4">
          <FiltresStatut
            label="Filtrer par statut"
            options={filtres}
            valeur={m.filtre}
            onChange={m.setFiltre}
            apres={
              <>
                <span aria-hidden className="mx-1 hidden w-px shrink-0 self-stretch bg-filet sm:block" />
                <NativeSelect aria-label="Ville" value={m.ville} onChange={(event) => m.setVille(event.target.value)} className="w-48 shrink-0">
                  <option value="">Ville : toutes</option>
                  {m.villes.map((ville) => (
                    <option key={ville} value={ville}>
                      Ville : {ville}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  aria-label="Type de logement"
                  value={m.typeLogementId}
                  onChange={(event) => m.setTypeLogementId(event.target.value)}
                  className="w-48 shrink-0"
                >
                  <option value="">Type : tous</option>
                  {m.typesLogement.map((type) => (
                    <option key={type.id} value={type.id}>
                      Type : {type.nom}
                    </option>
                  ))}
                </NativeSelect>
              </>
            }
          />
        </div>

        <Tableau label="Annonces à modérer" className="hidden lg:block">
          <TeteTableau>
            <Th className="w-12">
              <CaseSelection label="Tout sélectionner" checked={toutCoche} indeterminate={unePartie} onChange={m.toutBasculer} />
            </Th>
            <Th>Annonce</Th>
            <Th>Propriétaire</Th>
            <Th className="hidden 2xl:table-cell">Ville</Th>
            <Th alignement="droite">Prix FCFA</Th>
            <Th>Soumise</Th>
            <Th>Statut</Th>
          </TeteTableau>
          <tbody>
            {m.isLoading ? (
              <LigneMessage colonnes={NB_COLONNES}>
                <Loader2 aria-hidden className="mx-auto size-6 animate-spin text-baobab" />
                <span className="sr-only">Chargement des annonces</span>
              </LigneMessage>
            ) : m.annonces.length === 0 ? (
              <LigneMessage colonnes={NB_COLONNES}>{fileVide}</LigneMessage>
            ) : (
              m.annonces.map((annonce) => {
                const statut = STATUT_ANNONCE[annonce.statutAnnonce];
                const proprietaire = annonce.proprietaire;
                return (
                  <Tr key={annonce.id} selectionne={m.ouverte?.id === annonce.id || m.selection.has(annonce.id)} onClick={() => m.setOuverte(annonce)}>
                    <Td>
                      {annonce.statutAnnonce === "EN_ATTENTE" && (
                        <CaseSelection
                          label={`Sélectionner ${annonce.titre ?? "l'annonce"}`}
                          checked={m.selection.has(annonce.id)}
                          onChange={(coche) => m.basculer(annonce.id, coche)}
                        />
                      )}
                    </Td>
                    <Td>
                      <CelluleAnnonce annonce={annonce} />
                    </Td>
                    <Td>
                      {proprietaire ? (
                        <span className="flex items-center gap-2">
                          <Initiales prenom={proprietaire.prenom} nom={proprietaire.nom} />
                          <span className="min-w-[80px]">
                            {proprietaire.prenom} {proprietaire.nom}
                          </span>
                        </span>
                      ) : null}
                    </Td>
                    <Td className="hidden 2xl:table-cell">{annonce.quartier || annonce.ville}</Td>
                    <Td montant>{annonce.prix ? formatMontant(annonce.prix) : ""}</Td>
                    <Td className="whitespace-nowrap tabular-nums text-texte2">{dateSoumission(annonce.updatedAt)}</Td>
                    <Td>
                      <StatusBadge tone={statut.tone}>{statut.label}</StatusBadge>
                    </Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </Tableau>

        <ul className="divide-y divide-filet rounded-card bg-white px-4 lg:hidden">
          {m.isLoading ? (
            <li className="py-10 text-center">
              <Loader2 aria-hidden className="mx-auto size-6 animate-spin text-baobab" />
            </li>
          ) : m.annonces.length === 0 ? (
            <li className="py-10 text-center text-body-m text-texte2">{fileVide}</li>
          ) : (
            m.annonces.map((annonce) => <CarteMobile key={annonce.id} annonce={annonce} onOuvrir={() => m.setOuverte(annonce)} />)
          )}
        </ul>

        <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto]">
          <p className="pt-4 text-body-m text-texte2 sm:pt-0">
            {m.selection.size > 0 && (
              <>
                {m.selection.size} annonce{m.selection.size > 1 ? "s" : ""} sélectionnée{m.selection.size > 1 ? "s" : ""} ·{" "}
                <button
                  type="button"
                  onClick={m.validerSelection}
                  disabled={m.validationGroupee}
                  className="font-semibold text-baobab hover:underline disabled:opacity-60"
                >
                  {m.validationGroupee ? "Validation en cours…" : "Valider la sélection"}
                </button>
              </>
            )}
          </p>
          <Pagination {...m.pagination} total={m.total} pageSize={TAILLE_PAGE} />
        </div>
      </div>

      {panneauLateral ? (
        <aside aria-label="Décision">
          <div className="sticky top-8 max-h-[calc(100vh-64px)] overflow-y-auto rounded-card border border-filet bg-white p-6">
            {panneau || (
              <p className="py-16 text-center text-body-m text-texte2">Choisissez une annonce dans la liste pour l'examiner.</p>
            )}
          </div>
        </aside>
      ) : null}

      <SheetDialog
        open={Boolean(m.ouverte) && !panneauLateral}
        onOpenChange={(open) => !open && m.setOuverte(null)}
        title="Décision"
        className="sm:max-w-xl"
      >
        {panneau}
      </SheetDialog>
    </div>
  );
}
