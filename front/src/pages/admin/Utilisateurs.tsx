import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import {
  useProprietaires,
  useLocataires,
  useSuspendreProprietaire,
  useReactiverProprietaire,
  useSuspendreLocataire,
  useReactiverLocataire,
  useSupprimerProprietaire,
  useSupprimerLocataire,
  useProprietaireWithBiens,
  useLocataireWithBails,
} from "@/hooks/useSuspension";
import type { BailWithBienDetails, Bien, LocataireListItem, ProprietaireListItem } from "@/api/suspension";
import type { StatutAnnonce } from "@/api/bien";
import { Button, buttonVariants } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { FenetreSuspension } from "@/components/admin/comptes/FenetreSuspension";
import { STATUT_ANNONCE } from "@/components/admin/annonces/useModerationAnnonces";
import { EnTeteAdmin, Initiales, LigneChargement, LigneMessage, RechercheAdmin, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";
import { formatMontant } from "@/lib/fcfa";
import { messageErreurApi } from "@/lib/erreurApi";

// Comptes propriétaires ou locataires (Utilisateurs) : recherche et tableau de la planche 25,
// puis une fiche en fenêtre avec les biens ou les baux, et les décisions sur le compte.

type TypeCompte = "proprietaires" | "locataires";
type Compte = ProprietaireListItem | LocataireListItem;
type Action = "suspendre" | "reactiver" | "supprimer";

const DELAI_RECHERCHE_MS = 300;
const NB_COLONNES = 4;

const STATUT_BAIL: Record<string, { label: string; tone: StatusTone }> = {
  ACTIF: { label: "Actif", tone: "positif" },
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  TERMINE: { label: "Terminé", tone: "neutre" },
  RESILIE: { label: "Résilié", tone: "arret" },
};

const STATUT_CONTRAT: Record<string, string> = { ACTIF: "Actif", BROUILLON: "Brouillon", ARCHIVE: "Archivé" };
const FREQUENCE: Record<string, string> = { MENSUEL: "par mois", TRIMESTRIEL: "par trimestre", ANNUEL: "par an" };

const date = (valeur: string) => format(new Date(valeur), "dd/MM/yyyy");

/** Texte brut d'un contrat enregistré en HTML, pour un aperçu rapide. */
const texteBrut = (html: string) => new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";

function StatutCompte({ suspendu }: { suspendu: boolean }) {
  return suspendu ? <StatusBadge tone="arret">Suspendu</StatusBadge> : <StatusBadge tone="positif">Actif</StatusBadge>;
}

function Info({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-body-m text-texte2">{libelle}</dt>
      <dd className="mt-0.5 font-semibold text-encre">{children}</dd>
    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-overline font-semibold uppercase text-texte2">{titre}</h3>
      {children}
    </section>
  );
}

function InfosCompte({ compte }: { compte: Compte & { estSuspendu: boolean } }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Info libelle="Téléphone">
        <span className="tabular-nums">{compte.telephone}</span>
      </Info>
      {compte.email && <Info libelle="E-mail">{compte.email}</Info>}
      <Info libelle="Compte">
        <StatutCompte suspendu={compte.estSuspendu} />
      </Info>
      <Info libelle="Inscrit le">{date(compte.createdAt)}</Info>
      {compte.estSuspendu && compte.motifSuspension && <Info libelle="Motif de suspension">{compte.motifSuspension}</Info>}
      {compte.estSuspendu && compte.dateSuspension && <Info libelle="Suspendu le">{date(compte.dateSuspension)}</Info>}
    </dl>
  );
}

function CarteBien({ bien }: { bien: Bien }) {
  const statut = bien.statutAnnonce ? STATUT_ANNONCE[bien.statutAnnonce as StatutAnnonce] : undefined;
  const caracteristiques = [
    bien.typeLogement,
    bien.typeTransaction,
    bien.surface != null ? `${bien.surface} m²` : null,
    bien.nbChambres != null ? `${bien.nbChambres} ch.` : null,
  ].filter(Boolean);
  return (
    <li className="grid grid-cols-[1fr_auto] items-start gap-3 py-3">
      <span className="min-w-0">
        <span className="block font-semibold text-encre">{bien.titre || "Sans titre"}</span>
        <span className="block text-body-m text-texte2">{[bien.quartier, bien.ville].filter(Boolean).join(", ")}</span>
        <span className="block text-body-m text-texte2">
          {[...caracteristiques, bien.prix != null ? `${formatMontant(bien.prix)} FCFA` : null].filter(Boolean).join(" · ")}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        {statut && (
          <StatusBadge tone={statut.tone} size="sm">
            {statut.label}
          </StatusBadge>
        )}
        {!bien.actif && (
          <StatusBadge tone="neutre" size="sm">
            Masqué
          </StatusBadge>
        )}
      </span>
    </li>
  );
}

function CarteBail({ bail }: { bail: BailWithBienDetails }) {
  const [contratOuvert, setContratOuvert] = useState(false);
  const statut = STATUT_BAIL[bail.statut] ?? { label: bail.statut, tone: "neutre" as const };
  const periode = [bail.dateDebutBail ? `Du ${date(bail.dateDebutBail)}` : null, bail.dateFinBail ? `au ${date(bail.dateFinBail)}` : null].filter(Boolean).join(" ");
  const bien = bail.bien;
  return (
    <li className="space-y-3 py-4">
      <div className="grid grid-cols-[1fr_auto] items-start gap-3">
        <span className="min-w-0">
          <span className="block font-semibold text-encre">{bien?.titre || (bien ? "Sans titre" : "Bien supprimé")}</span>
          <span className="block text-body-m text-texte2">
            {[bien?.quartierRel?.nom ?? bien?.quartier, bien?.quartierRel?.ville.nom ?? bien?.ville, bien?.typeLogement?.nom, bail.typeBail].filter(Boolean).join(" · ")}
          </span>
          {periode && <span className="block text-body-m text-texte2">{periode}</span>}
        </span>
        <StatusBadge tone={statut.tone} size="sm">
          {statut.label}
        </StatusBadge>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {bail.montantLoyer != null && (
          <Info libelle="Loyer">
            {formatMontant(bail.montantLoyer)} FCFA {bail.frequencePaiement ? FREQUENCE[bail.frequencePaiement] ?? bail.frequencePaiement : ""}
          </Info>
        )}
        {bail.montantCaution != null && (
          <Info libelle="Caution">
            {formatMontant(bail.montantCaution)} FCFA · {bail.cautionVersee ? "versée" : "non versée"}
          </Info>
        )}
      </dl>
      {bail.contrat && (
        <div className="rounded-control bg-surface p-3">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3">
            <span className="min-w-0 text-body-m">
              <span className="block font-semibold text-encre">{bail.contrat.titre || "Contrat"}</span>
              <span className="block text-texte2">
                {STATUT_CONTRAT[bail.contrat.statut] ?? bail.contrat.statut} · créé le {date(bail.contrat.createdAt)}
              </span>
            </span>
            {bail.contrat.contenu && (
              <Button size="sm" variant="outline" onClick={() => setContratOuvert((ouvert) => !ouvert)} aria-expanded={contratOuvert}>
                {contratOuvert ? "Masquer" : "Lire"}
              </Button>
            )}
          </div>
          {contratOuvert && bail.contrat.contenu && (
            <p className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-control bg-white p-3 text-body-m text-encre">{texteBrut(bail.contrat.contenu)}</p>
          )}
        </div>
      )}
    </li>
  );
}

function FicheProprietaire({ id }: { id: string }) {
  const { data, isLoading } = useProprietaireWithBiens(id);
  const proprietaire = data?.data;
  if (isLoading || !proprietaire) return <Loader2 aria-label="Chargement de la fiche" className="mx-auto my-10 size-6 animate-spin text-baobab" />;
  return (
    <div className="space-y-6">
      <Bloc titre="Informations">
        <InfosCompte compte={proprietaire} />
      </Bloc>
      <Bloc titre={`Biens · ${proprietaire.biens.length}`}>
        {proprietaire.biens.length === 0 ? (
          <p className="text-body-m text-texte2">Aucun bien enregistré.</p>
        ) : (
          <ul className="divide-y divide-filet">
            {proprietaire.biens.map((bien) => (
              <CarteBien key={bien.id} bien={bien} />
            ))}
          </ul>
        )}
      </Bloc>
    </div>
  );
}

function FicheLocataire({ id }: { id: string }) {
  const { data, isLoading } = useLocataireWithBails(id);
  const locataire = data?.data;
  if (isLoading || !locataire) return <Loader2 aria-label="Chargement de la fiche" className="mx-auto my-10 size-6 animate-spin text-baobab" />;
  return (
    <div className="space-y-6">
      <Bloc titre="Informations">
        <InfosCompte compte={locataire} />
      </Bloc>
      <Bloc titre="Propriétaire qui a créé le compte">
        <p className="font-semibold text-encre">
          {locataire.proprietaire.prenom} {locataire.proprietaire.nom}
        </p>
        <p className="text-body-m tabular-nums text-texte2">{locataire.proprietaire.telephone}</p>
      </Bloc>
      <Bloc titre={`Baux · ${locataire.bails.length}`}>
        {locataire.bails.length === 0 ? (
          <p className="text-body-m text-texte2">Aucun bail enregistré.</p>
        ) : (
          <ul className="divide-y divide-filet">
            {locataire.bails.map((bail) => (
              <CarteBail key={bail.id} bail={bail} />
            ))}
          </ul>
        )}
      </Bloc>
    </div>
  );
}

export default function UtilisateursPage() {
  const { type } = useParams<{ type: TypeCompte }>();
  const typeCompte: TypeCompte = type === "locataires" ? "locataires" : "proprietaires";
  const estProprietaires = typeCompte === "proprietaires";
  const [recherche, setRecherche] = useState("");
  const [rechercheEnvoyee, setRechercheEnvoyee] = useState("");
  const [ouvert, setOuvert] = useState<Compte | null>(null);
  const [action, setAction] = useState<Action | null>(null);

  useEffect(() => {
    const minuteur = setTimeout(() => setRechercheEnvoyee(recherche.trim()), DELAI_RECHERCHE_MS);
    return () => clearTimeout(minuteur);
  }, [recherche]);

  // Changer de liste (lien de la barre latérale) referme la fiche ouverte.
  useEffect(() => {
    setOuvert(null);
    setAction(null);
  }, [typeCompte]);

  const filtre = { search: rechercheEnvoyee || undefined };
  const proprietaires = useProprietaires(filtre);
  const locataires = useLocataires(filtre);
  const suspendreProprietaire = useSuspendreProprietaire();
  const reactiverProprietaire = useReactiverProprietaire();
  const supprimerProprietaire = useSupprimerProprietaire();
  const suspendreLocataire = useSuspendreLocataire();
  const reactiverLocataire = useReactiverLocataire();
  const supprimerLocataire = useSupprimerLocataire();

  const requete = estProprietaires ? proprietaires : locataires;
  const comptes: Compte[] = requete.data?.data ?? [];
  const nbSuspendus = comptes.filter(({ estSuspendu }) => estSuspendu).length;
  const enCours = [suspendreProprietaire, reactiverProprietaire, supprimerProprietaire, suspendreLocataire, reactiverLocataire, supprimerLocataire].some(({ isPending }) => isPending);
  const nomOuvert = ouvert ? `${ouvert.prenom} ${ouvert.nom}` : "";

  const terminer = (message: string) => {
    toast.success(message);
    setAction(null);
    setOuvert(null);
  };

  const executer = async (operation: () => Promise<unknown>, succes: string, echec: string) => {
    try {
      await operation();
      terminer(succes);
    } catch (error) {
      toast.error(messageErreurApi(error, echec));
    }
  };

  const suspendre = (motif: string) =>
    ouvert &&
    executer(
      () => (estProprietaires ? suspendreProprietaire.mutateAsync({ id: ouvert.id, motif, masquerAnnonces: true }) : suspendreLocataire.mutateAsync({ id: ouvert.id, motif })),
      "Compte suspendu",
      "La suspension n'a pas pu être enregistrée. Réessayez.",
    );

  const reactiver = () =>
    ouvert &&
    executer(
      () => (estProprietaires ? reactiverProprietaire.mutateAsync({ id: ouvert.id, afficherAnnonces: true }) : reactiverLocataire.mutateAsync(ouvert.id)),
      "Compte réactivé",
      "La réactivation n'a pas pu être enregistrée. Réessayez.",
    );

  const supprimer = () =>
    ouvert &&
    executer(
      () => (estProprietaires ? supprimerProprietaire.mutateAsync(ouvert.id) : supprimerLocataire.mutateAsync(ouvert.id)),
      "Compte supprimé",
      "La suppression a échoué. Réessayez.",
    );

  return (
    <div>
      <EnTeteAdmin
        titre={estProprietaires ? "Propriétaires" : "Locataires"}
        description={requete.isLoading ? "Chargement…" : `${comptes.length} compte${comptes.length > 1 ? "s" : ""} · ${nbSuspendus} suspendu${nbSuspendus > 1 ? "s" : ""}`}
        actions={<RechercheAdmin label="Rechercher un compte" placeholder="Nom, téléphone ou e-mail" value={recherche} onChange={setRecherche} />}
      />

      <Tableau label={estProprietaires ? "Propriétaires" : "Locataires"}>
        <TeteTableau>
          <Th>{estProprietaires ? "Propriétaire" : "Locataire"}</Th>
          <Th>Contact</Th>
          <Th>Statut</Th>
          <Th>Inscrit le</Th>
        </TeteTableau>
        <tbody>
          {requete.isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des comptes" />
          ) : comptes.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>{rechercheEnvoyee ? "Aucun compte ne correspond à cette recherche." : "Aucun compte pour l'instant."}</LigneMessage>
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
                  {compte.email && <span className="block max-w-[240px] truncate text-texte2">{compte.email}</span>}
                </Td>
                <Td>
                  <StatutCompte suspendu={compte.estSuspendu} />
                </Td>
                <Td className="whitespace-nowrap tabular-nums text-texte2">{date(compte.createdAt)}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Tableau>

      {ouvert && !action && (
        <SheetDialog open onOpenChange={(open) => !open && setOuvert(null)} title={nomOuvert} className="sm:max-w-2xl">
          {estProprietaires ? <FicheProprietaire id={ouvert.id} /> : <FicheLocataire id={ouvert.id} />}
          <div className="mt-6 grid gap-3 border-t border-filet pt-5 sm:grid-cols-3">
            {!estProprietaires && (
              <Link to={`/admin/locataires/${ouvert.id}/documents`} className={buttonVariants({ variant: "outline" })}>
                <FileText aria-hidden />
                Pièces d'identité
              </Link>
            )}
            {ouvert.estSuspendu ? (
              <Button variant="outline" onClick={() => setAction("reactiver")}>
                Réactiver
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setAction("suspendre")}>
                Suspendre
              </Button>
            )}
            <Button variant="encre" onClick={() => setAction("supprimer")}>
              Supprimer le compte
            </Button>
          </div>
        </SheetDialog>
      )}

      {ouvert && action === "suspendre" && (
        <FenetreSuspension key={ouvert.id} nom={nomOuvert} proprietaire={estProprietaires} enCours={enCours} onConfirmer={suspendre} onClose={() => setAction(null)} />
      )}
      <ConfirmModal
        open={Boolean(ouvert) && action === "reactiver"}
        title={`Réactiver ${nomOuvert} ?`}
        message={estProprietaires ? "Le propriétaire pourra se reconnecter et ses annonces seront remises en ligne." : "Le locataire pourra se reconnecter."}
        confirmLabel="Réactiver"
        variant="warning"
        isPending={enCours}
        onConfirm={reactiver}
        onCancel={() => setAction(null)}
      />
      <ConfirmModal
        open={Boolean(ouvert) && action === "supprimer"}
        title={`Supprimer le compte de ${nomOuvert} ?`}
        message="Le compte et toutes les données qui lui sont liées seront supprimés définitivement. Cette action ne peut pas être annulée."
        confirmLabel="Supprimer définitivement"
        isPending={enCours}
        onConfirm={supprimer}
        onCancel={() => setAction(null)}
      />
    </div>
  );
}
