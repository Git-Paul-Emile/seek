import { useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useProprietaires, useLocataires, useSuspendreProprietaire, useReactiverProprietaire, useSuspendreLocataire, useReactiverLocataire } from "@/hooks/useSuspension";
import type { LocataireListItem, ProprietaireListItem } from "@/api/suspension";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { FenetreSuspension } from "@/components/admin/comptes/FenetreSuspension";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  EnTeteAdmin,
  FiltresStatut,
  Initiales,
  LigneChargement,
  LigneMessage,
  RechercheAdmin,
  Tableau,
  Td,
  TeteTableau,
  Th,
  Tr,
  type FiltreOption,
} from "@/components/admin/table/Tableau";
import { messageErreurApi } from "@/lib/erreurApi";

// Suspensions de comptes (Modération · Suspensions) : propriétaires ou locataires, puces de
// statut et recherche, tableau de la planche 25, détail et décisions en fenêtre.

type Public = "proprietaires" | "locataires";
type FiltreStatut = "tous" | "suspendus" | "actifs";
type Compte = ProprietaireListItem | (LocataireListItem & { dateFinSuspension?: string | null });

const DELAI_RECHERCHE_MS = 300;
const NB_COLONNES = 4;


const FILTRES: FiltreOption<FiltreStatut>[] = [
  { valeur: "tous", label: "Tous" },
  { valeur: "suspendus", label: "Suspendus" },
  { valeur: "actifs", label: "Actifs" },
];

const EST_SUSPENDU: Record<FiltreStatut, boolean | undefined> = { tous: undefined, suspendus: true, actifs: false };
const date = (valeur: string) => format(new Date(valeur), "dd/MM/yyyy");

function StatutCompte({ compte }: { compte: Compte }) {
  return compte.estSuspendu ? <StatusBadge tone="arret">Suspendu</StatusBadge> : <StatusBadge tone="positif">Actif</StatusBadge>;
}

function LigneDetail({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(120px,40%)_1fr] gap-4 py-3">
      <dt className="text-texte2">{libelle}</dt>
      <dd className="break-words text-right text-encre">{children}</dd>
    </div>
  );
}

function DetailCompte({ compte, onSuspendre, onReactiver, onClose }: { compte: Compte; onSuspendre: () => void; onReactiver: () => void; onClose: () => void }) {
  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title={`${compte.prenom} ${compte.nom}`}>
      <StatutCompte compte={compte} />
      <dl className="mt-4 divide-y divide-filet border-t border-filet text-body-m">
        <LigneDetail libelle="Téléphone">
          <span className="tabular-nums">{compte.telephone}</span>
        </LigneDetail>
        {compte.email && <LigneDetail libelle="E-mail">{compte.email}</LigneDetail>}
        <LigneDetail libelle="Inscrit le">{date(compte.createdAt)}</LigneDetail>
        {compte.estSuspendu && (
          <>
            {compte.motifSuspension && <LigneDetail libelle="Motif">{compte.motifSuspension}</LigneDetail>}
            {compte.dateSuspension && <LigneDetail libelle="Suspendu le">{date(compte.dateSuspension)}</LigneDetail>}
            {"dateFinSuspension" in compte && (
              <LigneDetail libelle="Réactivation">
                {compte.dateFinSuspension ? `Automatique le ${date(compte.dateFinSuspension)}` : "À faire à la main"}
              </LigneDetail>
            )}
          </>
        )}
      </dl>
      <div className="mt-6">
        {compte.estSuspendu ? (
          <Button className="w-full" onClick={onReactiver}>
            Réactiver le compte
          </Button>
        ) : (
          <Button variant="encre" className="w-full" onClick={onSuspendre}>
            Suspendre le compte
          </Button>
        )}
      </div>
    </SheetDialog>
  );
}

export default function SuspensionsPage() {
  const [publicVise, setPublicVise] = useState<Public>("proprietaires");
  const [statut, setStatut] = useState<FiltreStatut>("tous");
  const [recherche, setRecherche] = useState("");
  const [rechercheEnvoyee, setRechercheEnvoyee] = useState("");
  const [ouvert, setOuvert] = useState<Compte | null>(null);
  const [action, setAction] = useState<"suspendre" | "reactiver" | null>(null);

  useEffect(() => {
    const minuteur = setTimeout(() => setRechercheEnvoyee(recherche.trim()), DELAI_RECHERCHE_MS);
    return () => clearTimeout(minuteur);
  }, [recherche]);

  const filtre = { estSuspendu: EST_SUSPENDU[statut], search: rechercheEnvoyee || undefined };
  const proprietaires = useProprietaires(filtre);
  const locataires = useLocataires(filtre);
  const suspendreProprietaire = useSuspendreProprietaire();
  const reactiverProprietaire = useReactiverProprietaire();
  const suspendreLocataire = useSuspendreLocataire();
  const reactiverLocataire = useReactiverLocataire();

  const estProprietaires = publicVise === "proprietaires";
  const requete = estProprietaires ? proprietaires : locataires;
  const comptes: Compte[] = requete.data?.data ?? [];
  const enCours = suspendreProprietaire.isPending || reactiverProprietaire.isPending || suspendreLocataire.isPending || reactiverLocataire.isPending;

  const fermer = () => {
    setAction(null);
    setOuvert(null);
  };

  const suspendre = async (motif: string) => {
    if (!ouvert) return;
    try {
      if (estProprietaires) await suspendreProprietaire.mutateAsync({ id: ouvert.id, motif, masquerAnnonces: true });
      else await suspendreLocataire.mutateAsync({ id: ouvert.id, motif });
      toast.success("Compte suspendu");
      fermer();
    } catch (error) {
      toast.error(messageErreurApi(error, "La suspension n'a pas pu être enregistrée. Réessayez."));
    }
  };

  const reactiver = async () => {
    if (!ouvert) return;
    try {
      if (estProprietaires) await reactiverProprietaire.mutateAsync({ id: ouvert.id, afficherAnnonces: true });
      else await reactiverLocataire.mutateAsync(ouvert.id);
      toast.success("Compte réactivé");
      fermer();
    } catch (error) {
      toast.error(messageErreurApi(error, "La réactivation n'a pas pu être enregistrée. Réessayez."));
    }
  };

  return (
    <div>
      <EnTeteAdmin
        titre="Suspensions"
        description="Suspendez un compte qui enfreint les règles, réactivez-le une fois la situation réglée."
        actions={<RechercheAdmin label="Rechercher un compte" placeholder="Nom, téléphone ou e-mail" value={recherche} onChange={setRecherche} />}
      />

      <div className="mb-4 grid gap-3 lg:flex lg:items-center lg:justify-between">
        <SegmentedControl<Public>
          label="Type de compte"
          options={[
            { value: "proprietaires", label: "Propriétaires" },
            { value: "locataires", label: "Locataires" },
          ]}
          value={publicVise}
          onChange={(valeur) => {
            setPublicVise(valeur);
            setOuvert(null);
          }}
        />
        <FiltresStatut<FiltreStatut> label="Filtrer par statut" options={FILTRES} valeur={statut} onChange={setStatut} />
      </div>

      <Tableau label={estProprietaires ? "Propriétaires" : "Locataires"}>
        <TeteTableau>
          <Th>{estProprietaires ? "Propriétaire" : "Locataire"}</Th>
          <Th>Contact</Th>
          <Th>Statut</Th>
          <Th>Suspension</Th>
        </TeteTableau>
        <tbody>
          {requete.isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des comptes" />
          ) : comptes.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>Aucun compte pour ces critères.</LigneMessage>
          ) : (
            comptes.map((compte) => (
              <Tr key={compte.id} selectionne={ouvert?.id === compte.id} onClick={() => setOuvert(compte)}>
                <Td>
                  <span className="flex items-center gap-3">
                    <Initiales prenom={compte.prenom} nom={compte.nom} />
                    <span className="font-semibold text-encre">
                      {compte.prenom} {compte.nom}
                    </span>
                  </span>
                </Td>
                <Td>
                  <span className="block tabular-nums">{compte.telephone}</span>
                  {compte.email && <span className="block max-w-[220px] truncate text-texte2">{compte.email}</span>}
                </Td>
                <Td>
                  <StatutCompte compte={compte} />
                </Td>
                <Td className="max-w-[260px] text-texte2">
                  {compte.estSuspendu ? (
                    <>
                      <span className="block truncate text-encre">{compte.motifSuspension}</span>
                      {compte.dateSuspension && <span className="block tabular-nums">depuis le {date(compte.dateSuspension)}</span>}
                    </>
                  ) : null}
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Tableau>

      {ouvert && !action && (
        <DetailCompte compte={ouvert} onSuspendre={() => setAction("suspendre")} onReactiver={() => setAction("reactiver")} onClose={() => setOuvert(null)} />
      )}
      {ouvert && action === "suspendre" && (
        <FenetreSuspension key={ouvert.id} nom={`${ouvert.prenom} ${ouvert.nom}`} proprietaire={estProprietaires} enCours={enCours} onConfirmer={suspendre} onClose={() => setAction(null)} />
      )}
      <ConfirmModal
        open={Boolean(ouvert) && action === "reactiver"}
        title={`Réactiver ${ouvert?.prenom ?? ""} ${ouvert?.nom ?? ""} ?`}
        message={estProprietaires ? "Le propriétaire pourra se reconnecter et ses annonces seront remises en ligne." : "Le locataire pourra se reconnecter."}
        confirmLabel="Réactiver"
        variant="warning"
        isPending={enCours}
        onConfirm={reactiver}
        onCancel={() => setAction(null)}
      />
    </div>
  );
}
