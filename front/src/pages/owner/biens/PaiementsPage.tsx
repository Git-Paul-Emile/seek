import { useState, type ReactNode } from "react";
import { useParams, Link } from "react-router-dom";
import { Archive, ArrowLeft, Banknote, Bell, CalendarPlus, ChevronDown, Download, Eye, History, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import EnregistrerEspecesModal from "@/components/owner/EnregistrerEspecesModal";
import { EmptyState } from "@/components/brand/EmptyState";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { useBienById } from "@/hooks/useBien";
import {
  useBailActif,
  useEcheancier,
  useSolde,
  useMobileMoney,
  useHistoriqueBails,
  useProlongerEcheancesAnnee,
  useConfirmerReception,
} from "@/hooks/useBail";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { generateQuittancePDF, openQuittancePDF, downloadAllQuittancesZip } from "@/lib/generateQuittance";
import { genererQuittanceApi } from "@/api/quittance";
import { useEnvoyerRappel, useRappelsEcheance } from "@/hooks/useQuittance";
import type { Echeance } from "@/api/bail";
import { formatDateLongue } from "@/lib/dates";
import { messageErreurApi } from "@/lib/erreurApi";
import { formatFcfa } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Paiements d'un bail : solde, progression, Mobile Money, puis la liste des échéances
// filtrable, avec relance, confirmation de réception et quittances.

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutFilter = "TOUT" | "EN_RETARD" | "EN_ATTENTE" | "EN_ATTENTE_CONFIRMATION" | "A_VENIR" | "PAYE";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUT_CFG: Record<string, { label: string; tone: StatusTone }> = {
  A_VENIR: { label: "À venir", tone: "neutre" },
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  EN_RETARD: { label: "En retard", tone: "alerte" },
  EN_ATTENTE_CONFIRMATION: { label: "À confirmer", tone: "attente" },
  PAYE: { label: "Payé", tone: "positif" },
  ANNULE: { label: "Annulé", tone: "arret" },
};

const ORDER: Record<string, number> = {
  EN_ATTENTE_CONFIRMATION: 0,
  EN_RETARD: 1,
  EN_ATTENTE: 2,
  A_VENIR: 3,
  PAYE: 4,
  ANNULE: 5,
};

const canDownload = (s: string) => s === "PAYE";

const joursRetard = (dateEcheance: string) => Math.max(0, Math.floor((Date.now() - new Date(dateEcheance).getTime()) / 86400000));

// ─── Statuts de notification ──────────────────────────────────────────────────

const NOTIF_STATUT: Record<string, { label: string; tone: StatusTone }> = {
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  ENVOYE: { label: "Envoyée", tone: "positif" },
  ECHEC: { label: "Échec", tone: "alerte" },
};

function Carte({ titre, actions, children, className }: { titre: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={titre} className={cn("rounded-card bg-white p-5 lg:p-6", className)}>
      <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3">
        <h2 className="font-display text-h3 font-bold text-encre">{titre}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

// ─── Historique des relances d'une échéance ───────────────────────────────────

function RelanceHistoriquePanel({ bienId, bailId, echeanceId }: { bienId: string; bailId: string; echeanceId: string }) {
  const { data = [], isLoading } = useRappelsEcheance(bienId, bailId, echeanceId, true);

  return (
    <div className="mt-3 rounded-control bg-surface p-4">
      <h3 className="text-overline font-semibold uppercase text-texte2">Historique des relances</h3>
      {isLoading ? (
        <p className="mt-2 flex items-center gap-2 text-body-m text-texte2">
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Chargement
        </p>
      ) : data.length === 0 ? (
        <p className="mt-2 text-body-m text-texte2">Aucune relance envoyée pour cette échéance.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {data.map((r) => {
            const cfg = NOTIF_STATUT[r.statut] ?? { label: r.statut, tone: "neutre" as const };
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-m text-texte2">
                <StatusBadge tone={cfg.tone} size="sm">
                  {cfg.label}
                </StatusBadge>
                <span>
                  {new Date(r.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span>{r.canal}</span>
                {r.messageRetour && (
                  <span className="min-w-0 truncate" title={r.messageRetour}>
                    {r.messageRetour}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Bouton relance SMS + Email ───────────────────────────────────────────────

function RelanceButton({ bienId, bailId, echeanceId }: { bienId: string; bailId: string; echeanceId: string }) {
  const { mutate, isPending } = useEnvoyerRappel();
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() =>
        mutate(
          { bienId, bailId, echeanceId },
          {
            onSuccess: () => toast.success("Relance envoyée au locataire par SMS et e-mail"),
            onError: (error) => toast.error(messageErreurApi(error, "La relance n'est pas partie. Réessayez dans un instant.")),
          },
        )
      }
      disabled={isPending}
    >
      {isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Bell aria-hidden />}
      Relancer
    </Button>
  );
}

// ─── Bouton confirmation de réception ────────────────────────────────────────

function ConfirmerButton({ bienId, bailId, echeanceId }: { bienId: string; bailId: string; echeanceId: string }) {
  const { mutate, isPending } = useConfirmerReception();
  return (
    <Button
      size="sm"
      onClick={() =>
        mutate(
          { bienId, bailId, echeanceId },
          {
            onSuccess: () => toast.success("Réception du paiement confirmée"),
            onError: (error) => toast.error(messageErreurApi(error, "La réception n'a pas pu être confirmée. Réessayez.")),
          },
        )
      }
      disabled={isPending}
    >
      {isPending ? <Loader2 aria-hidden className="animate-spin" /> : <ShieldCheck aria-hidden />}
      Confirmer la réception
    </Button>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function PaiementsPage() {
  const { id } = useParams<{ id: string }>();
  const { owner } = useOwnerAuth();

  const { data: bien, isLoading: bienLoading } = useBienById(id ?? "");
  const { data: bail, isLoading: bailLoading } = useBailActif(id ?? "");
  const { data: historiqueBails = [], isLoading: historiqueLoading } = useHistoriqueBails(id ?? "");
  const effectiveBail = bail ?? historiqueBails[0] ?? null;
  const { data: echeancier = [], isLoading: echLoading } = useEcheancier(id ?? "", effectiveBail?.id ?? "");
  const { data: solde } = useSolde(id ?? "", effectiveBail?.id ?? "");
  const { data: mobileMoney } = useMobileMoney(id ?? "");

  const { mutate: prolongerAnnee, isPending: isProlonging } = useProlongerEcheancesAnnee();
  const [isZipping, setIsZipping] = useState(false);
  const [showEspecesModal, setShowEspecesModal] = useState(false);

  const [filter, setFilter] = useState<StatutFilter>("TOUT");
  const [showAllMM, setShowAllMM] = useState(false);
  const [expandedRappelId, setExpandedRappelId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  // displayYear contrôle jusqu'à quelle année les A_VENIR sont affichées
  const [displayYear, setDisplayYear] = useState(currentYear);

  // N'afficher les A_VENIR que jusqu'à displayYear (masque les années futures pré-générées)
  const visibleEcheancier = echeancier.filter((e) => e.statut !== "A_VENIR" || new Date(e.dateEcheance).getFullYear() <= displayYear);

  // Bannière : dernière échéance visible est en décembre de displayYear, bail continue au-delà
  const lastVisible =
    visibleEcheancier.length > 0 ? visibleEcheancier.reduce((a, b) => (new Date(a.dateEcheance) > new Date(b.dateEcheance) ? a : b)) : null;
  const showRenewalBanner =
    !!effectiveBail &&
    ["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT"].includes(effectiveBail.statut) &&
    !!lastVisible &&
    new Date(lastVisible.dateEcheance).getFullYear() === displayYear &&
    new Date(lastVisible.dateEcheance).getMonth() === 11 &&
    (!effectiveBail.dateFinBail || new Date(effectiveBail.dateFinBail).getFullYear() > displayYear);

  const isLoading = bienLoading || bailLoading || historiqueLoading || echLoading;

  // Filtrage + tri sur les échéances visibles
  const filtered = visibleEcheancier.filter((e) => filter === "TOUT" || e.statut === filter);
  const sorted = [...filtered].sort(
    (a, b) => (ORDER[a.statut] ?? 9) - (ORDER[b.statut] ?? 9) || new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime(),
  );

  const buildQuittanceData = async (ech: Echeance) => {
    if (!effectiveBail || !bien || !owner) return null;
    let quittanceNumero = ech.id.slice(0, 8).toUpperCase();
    let dateGeneration = new Date().toLocaleDateString("fr-FR");
    try {
      const q = await genererQuittanceApi(id!, effectiveBail.id, ech.id);
      quittanceNumero = q.numero;
      dateGeneration = new Date(q.dateGeneration).toLocaleDateString("fr-FR");
    } catch { /* fallback */ }
    return {
      numero: quittanceNumero,
      dateGeneration,
      dateEcheance: ech.dateEcheance,
      datePaiement: ech.datePaiement!,
      modePaiement: ech.modePaiement ?? undefined,
      reference: ech.reference ?? undefined,
      note: ech.note ?? undefined,
      montantLoyer: ech.montant,
      statut: ech.statut,
      bienTitre: bien.titre ?? undefined,
      bienAdresse: [bien.adresse, bien.quartier].filter(Boolean).join(", ") || undefined,
      bienVille: bien.ville ?? undefined,
      bienPays: bien.pays ?? undefined,
      proprietaireNom: `${owner.prenom} ${owner.nom}`,
      proprietaireTelephone: owner.telephone,
      locataireNom: `${effectiveBail.locataire.prenom} ${effectiveBail.locataire.nom}`,
      locataireTelephone: effectiveBail.locataire.telephone,
    };
  };

  const handleOpen = async (ech: Echeance) => {
    const data = await buildQuittanceData(ech);
    if (data) openQuittancePDF(data);
  };

  const handleDownload = async (ech: Echeance) => {
    if (!effectiveBail || !bien || !owner) return;
    let quittanceNumero = ech.id.slice(0, 8).toUpperCase();
    let dateGeneration = new Date().toLocaleDateString("fr-FR");
    try {
      const q = await genererQuittanceApi(id!, effectiveBail.id, ech.id);
      quittanceNumero = q.numero;
      dateGeneration = new Date(q.dateGeneration).toLocaleDateString("fr-FR");
    } catch {
      // fallback sur l'ID local si l'API échoue
    }
    generateQuittancePDF({
      numero: quittanceNumero,
      dateGeneration,
      dateEcheance: ech.dateEcheance,
      datePaiement: ech.datePaiement!,
      modePaiement: ech.modePaiement ?? undefined,
      reference: ech.reference ?? undefined,
      note: ech.note ?? undefined,
      montantLoyer: ech.montant,
      statut: ech.statut,
      bienTitre: bien.titre ?? undefined,
      bienAdresse:
        [bien.adresse, bien.quartier].filter(Boolean).join(", ") || undefined,
      bienVille: bien.ville ?? undefined,
      bienPays: bien.pays ?? undefined,
      proprietaireNom: `${owner.prenom} ${owner.nom}`,
      proprietaireTelephone: owner.telephone,
      locataireNom: `${effectiveBail.locataire.prenom} ${effectiveBail.locataire.nom}`,
      locataireTelephone: effectiveBail.locataire.telephone,
    });
  };

  const handleDownloadAll = async () => {
    if (!effectiveBail || !bien || !owner) return;
    const payees = visibleEcheancier.filter(e => canDownload(e.statut) && e.datePaiement);
    if (payees.length === 0) { toast.error("Aucune quittance disponible : aucun loyer payé pour l'instant."); return; }
    setIsZipping(true);
    try {
      const quittanceDatas = await Promise.all(
        payees.map(async (ech) => {
          let numero = ech.id.slice(0, 8).toUpperCase();
          let dateGeneration = new Date().toLocaleDateString("fr-FR");
          try {
            const q = await import("@/api/quittance").then(m => m.genererQuittanceApi(id!, effectiveBail.id, ech.id));
            numero = q.numero;
            dateGeneration = new Date(q.dateGeneration).toLocaleDateString("fr-FR");
          } catch { /* fallback */ }
          return {
            numero,
            dateGeneration,
            dateEcheance: ech.dateEcheance,
            datePaiement: ech.datePaiement!,
            modePaiement: ech.modePaiement ?? undefined,
            reference: ech.reference ?? undefined,
            note: ech.note ?? undefined,
            montantLoyer: ech.montant,
            statut: ech.statut,
            bienTitre: bien.titre ?? undefined,
            bienAdresse: [bien.adresse, bien.quartier].filter(Boolean).join(", ") || undefined,
            bienVille: bien.ville ?? undefined,
            bienPays: bien.pays ?? undefined,
            proprietaireNom: `${owner.prenom} ${owner.nom}`,
            proprietaireTelephone: owner.telephone,
            locataireNom: `${effectiveBail.locataire.prenom} ${effectiveBail.locataire.nom}`,
            locataireTelephone: effectiveBail.locataire.telephone,
          };
        })
      );
      const nomBien = (bien.titre ?? "bien").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      await downloadAllQuittancesZip(quittanceDatas, `quittances-${nomBien}.zip`);
      toast.success(`${payees.length} quittance(s) téléchargée(s)`);
    } catch {
      toast.error("Le fichier ZIP n'a pas pu être créé. Réessayez.");
    } finally {
      setIsZipping(false);
    }
  };

  const nbEnAttenteConfirmation = visibleEcheancier.filter((e) => e.statut === "EN_ATTENTE_CONFIRMATION").length;

  const FILTER_TABS: { key: StatutFilter; label: string; count?: number }[] = [
    { key: "TOUT", label: "Tout", count: visibleEcheancier.length },
    { key: "EN_RETARD", label: "En retard", count: visibleEcheancier.filter((e) => e.statut === "EN_RETARD").length },
    { key: "EN_ATTENTE", label: "En attente", count: visibleEcheancier.filter((e) => e.statut === "EN_ATTENTE").length },
    { key: "EN_ATTENTE_CONFIRMATION", label: "À confirmer", count: nbEnAttenteConfirmation },
    { key: "A_VENIR", label: "À venir", count: visibleEcheancier.filter((e) => e.statut === "A_VENIR").length },
    { key: "PAYE", label: "Payés", count: visibleEcheancier.filter((e) => e.statut === "PAYE").length },
  ];

  const prolonger = () => {
    if (!effectiveBail) return;
    prolongerAnnee(
      { bienId: id!, bailId: effectiveBail.id, anneeActuelle: displayYear },
      {
        onSuccess: (res) => {
          setDisplayYear(res.annee);
          toast.success(res.generated > 0 ? `${res.generated} échéance(s) créée(s) pour ${res.annee}` : `Échéances de ${res.annee} affichées`);
        },
        onError: (error) => toast.error(messageErreurApi(error, "Les échéances n'ont pas pu être créées. Réessayez.")),
      },
    );
  };

  if (isLoading) {
    return <Loader2 aria-label="Chargement des paiements" className="mx-auto mt-24 size-7 animate-spin text-baobab" />;
  }

  if (!bien) {
    return (
      <EmptyState
        titreNiveau="h1"
        titre="Bien introuvable"
        texte="Ce bien n'existe plus ou ne vous appartient pas."
        action={
          <Button asChild>
            <Link to="/owner/biens">Retour à mes biens</Link>
          </Button>
        }
      />
    );
  }

  if (!effectiveBail) {
    return (
      <EmptyState
        titreNiveau="h1"
        titre="Aucun bail pour ce bien"
        texte="Associez un locataire au bien pour suivre ses paiements."
        action={
          <Button asChild>
            <Link to={`/owner/biens/${id}`}>Retour au bien</Link>
          </Button>
        }
      />
    );
  }

  const progression = solde && solde.totalEcheances > 0 ? Math.round((solde.nbPaye / solde.totalEcheances) * 100) : null;

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <Link to={`/owner/biens/${id}`} className="inline-flex items-center gap-1 text-body-m font-semibold text-baobab hover:underline">
            <ArrowLeft aria-hidden className="size-4" />
            Retour au bien
          </Link>
          <h1 className="mt-1 font-display text-h2 font-bold text-encre lg:text-h1">Paiements · {bien.titre || "Logement"}</h1>
          <p className="mt-1 text-body-l text-texte2">
            {effectiveBail.locataire.prenom} {effectiveBail.locataire.nom} · bail depuis{" "}
            {new Date(effectiveBail.dateDebutBail).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowEspecesModal(true)}>
            <Banknote aria-hidden />
            Paiement en espèces
          </Button>
          <Button variant="outline" onClick={handleDownloadAll} disabled={isZipping} title="Télécharger toutes les quittances en ZIP">
            {isZipping ? <Loader2 aria-hidden className="animate-spin" /> : <Archive aria-hidden />}
            Quittances (ZIP)
          </Button>
        </div>
      </header>

      {solde && (
        <Carte titre="Solde du bail">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-control bg-surface p-4">
              <dt className="text-body-m text-texte2">Payés</dt>
              <dd className="mt-1 text-h3 font-bold text-encre">
                {solde.nbPaye} sur {solde.totalEcheances}
              </dd>
              <dd className="text-caption text-texte2">{formatFcfa(solde.montantPaye)}</dd>
            </div>
            <div className={cn("rounded-control p-4", solde.nbEnRetard > 0 ? "bg-soleil" : "bg-surface")}>
              <dt className={cn("text-body-m", solde.nbEnRetard > 0 ? "font-semibold text-encre" : "text-texte2")}>En retard</dt>
              <dd className="mt-1 text-h3 font-bold text-encre">{solde.nbEnRetard}</dd>
              <dd className={cn("text-caption", solde.nbEnRetard > 0 ? "text-encre" : "text-texte2")}>{formatFcfa(solde.montantEnRetard)}</dd>
            </div>
            <div className="rounded-control bg-surface p-4">
              <dt className="text-body-m text-texte2">Reste dû</dt>
              <dd className="mt-1 text-h3 font-bold text-encre">{formatFcfa(solde.solde)}</dd>
            </div>
            <div className="rounded-control bg-surface p-4">
              <dt className="text-body-m text-texte2">Total du bail</dt>
              <dd className="mt-1 text-h3 font-bold text-encre">{formatFcfa(solde.montantTotalDu)}</dd>
              <dd className="text-caption text-texte2">{solde.totalEcheances} échéances</dd>
            </div>
          </dl>

          {progression !== null && (
            <div className="mt-5">
              <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                <span id="libelle-progression" className="text-body-m font-semibold text-encre">
                  Progression des paiements
                </span>
                <span className="text-body-m font-bold text-baobab">{progression} %</span>
              </div>
              <div
                role="progressbar"
                aria-labelledby="libelle-progression"
                aria-valuenow={progression}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface"
              >
                <div className="h-full rounded-full bg-baobab" style={{ width: `${progression}%` }} />
              </div>
              <p className="mt-2 text-body-m text-texte2">
                {[
                  `${solde.nbPaye} payés`,
                  solde.nbEnRetard > 0 ? `${solde.nbEnRetard} en retard` : null,
                  solde.nbEnAttente > 0 ? `${solde.nbEnAttente} en attente` : null,
                  solde.nbAVenir > 0 ? `${solde.nbAVenir} à venir` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          )}
        </Carte>
      )}

      {mobileMoney && mobileMoney.providers.length > 0 && (
        <section aria-label="Moyens de paiement Mobile Money" className="rounded-card bg-white p-5 lg:p-6">
          <button
            type="button"
            onClick={() => setShowAllMM((v) => !v)}
            aria-expanded={showAllMM}
            className="grid min-h-12 w-full grid-cols-[1fr_auto] items-center gap-3 text-left"
          >
            <span className="font-display text-h3 font-bold text-encre">
              Mobile Money
              {mobileMoney.pays && <span className="font-body text-body-m font-normal text-texte2"> · {mobileMoney.pays}</span>}
            </span>
            <ChevronDown aria-hidden className={cn("size-5 text-texte2 transition-transform duration-tab", showAllMM && "rotate-180")} />
          </button>
          {showAllMM && (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {mobileMoney.providers.map((p) => (
                <li key={p.nom} className="rounded-control bg-surface p-4">
                  <p className="text-body-m font-semibold text-encre">{p.nom}</p>
                  <p className="mt-1 text-body-m text-texte2">{p.instructions}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showRenewalBanner && (
        <div className="grid grid-cols-[auto_1fr] items-start gap-3 rounded-card bg-baobab-100 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <CalendarPlus aria-hidden className="mt-0.5 size-5 text-baobab sm:mt-0" />
          <div className="min-w-0">
            <p className="text-body-l font-semibold text-encre">Échéances prévues jusqu'en décembre {displayYear}</p>
            <p className="text-body-m text-texte2">Créez les échéances de {displayYear + 1} pour continuer le suivi du bail.</p>
          </div>
          <Button className="col-span-2 sm:col-span-1" onClick={prolonger} disabled={isProlonging}>
            {isProlonging ? <Loader2 aria-hidden className="animate-spin" /> : <CalendarPlus aria-hidden />}
            Créer {displayYear + 1}
          </Button>
        </div>
      )}

      <Carte titre="Échéances">
        <div role="group" aria-label="Filtrer les échéances" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTER_TABS.map((tab) => (
            <Chip key={tab.key} size="sm" selected={filter === tab.key} onClick={() => setFilter(tab.key)}>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && <span className="font-semibold">· {tab.count}</span>}
            </Chip>
          ))}
        </div>

        {sorted.length === 0 ? (
          <p className="mt-4 rounded-control bg-surface p-6 text-center text-body-m text-texte2">Aucune échéance pour ce filtre.</p>
        ) : (
          <ul className="mt-2 divide-y divide-filet">
            {sorted.map((ech) => (
              <LigneEcheance
                key={ech.id}
                ech={ech}
                bienId={id!}
                bailId={effectiveBail.id}
                isExpanded={expandedRappelId === ech.id}
                onToggleRappels={() => setExpandedRappelId(expandedRappelId === ech.id ? null : ech.id)}
                onOpen={() => handleOpen(ech)}
                onDownload={() => handleDownload(ech)}
              />
            ))}
          </ul>
        )}
      </Carte>

      {showEspecesModal && (
        <EnregistrerEspecesModal
          bienId={id!}
          bailId={effectiveBail.id}
          echeancier={echeancier}
          bienTitre={bien?.titre ?? undefined}
          locataireNom={`${effectiveBail.locataire.prenom} ${effectiveBail.locataire.nom}`}
          onClose={() => setShowEspecesModal(false)}
        />
      )}
    </div>
  );
}

// ─── Ligne d'échéance ─────────────────────────────────────────────────────────

function LigneEcheance({
  ech,
  bienId,
  bailId,
  isExpanded,
  onToggleRappels,
  onOpen,
  onDownload,
}: {
  ech: Echeance;
  bienId: string;
  bailId: string;
  isExpanded: boolean;
  onToggleRappels: () => void;
  onOpen: () => void;
  onDownload: () => void;
}) {
  const cfg = STATUT_CFG[ech.statut] ?? STATUT_CFG.A_VENIR;
  const showRappelActions = ech.statut === "EN_RETARD" || ech.statut === "EN_ATTENTE";
  // Confirmer réception : paiement déclaré par le locataire, en attente ou déjà payé mais non confirmé
  const peutConfirmer =
    (ech.statut === "EN_ATTENTE_CONFIRMATION" || canDownload(ech.statut)) && ech.sourceEnregistrement === "LOCATAIRE" && !ech.confirmeParProprietaire;
  const quittance = canDownload(ech.statut) && Boolean(ech.datePaiement);

  const details = [
    ech.datePaiement
      ? `Payé le ${formatDateLongue(ech.datePaiement)}${ech.modePaiement ? ` · ${ech.modePaiement}` : ""}${ech.reference ? ` · Réf. ${ech.reference}` : ""}`
      : null,
    ech.statut === "PAYE" && ech.sourceEnregistrement ? `Enregistré par ${ech.sourceEnregistrement === "LOCATAIRE" ? "le locataire" : "vous"}` : null,
    ech.confirmeParProprietaire && ech.dateConfirmation ? `Réception confirmée le ${formatDateLongue(ech.dateConfirmation)}` : null,
    ech.confirmeParLocataire ? "Confirmé par le locataire" : null,
    ech.statut === "EN_ATTENTE_CONFIRMATION" && ech.sourceEnregistrement === "LOCATAIRE" ? "Déclaré par le locataire, en attente de votre confirmation" : null,
    ech.statut === "EN_ATTENTE_CONFIRMATION" && ech.sourceEnregistrement === "PROPRIETAIRE" ? "En attente de la confirmation du locataire" : null,
  ].filter((ligne): ligne is string => Boolean(ligne));

  return (
    <li className="py-4">
      <div className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-body-l font-semibold text-encre">{formatDateLongue(ech.dateEcheance)}</p>
            <StatusBadge tone={cfg.tone} size="sm">
              {ech.statut === "EN_RETARD" ? `${cfg.label} · ${joursRetard(ech.dateEcheance)} j` : cfg.label}
            </StatusBadge>
          </div>
          {details.map((ligne) => (
            <p key={ligne} className="mt-1 text-body-m text-texte2">
              {ligne}
            </p>
          ))}
          {ech.note && <p className="mt-1 text-body-m italic text-texte2">{ech.note}</p>}
        </div>
        <p className="whitespace-nowrap text-price font-bold text-encre">{formatFcfa(ech.montant)}</p>

        {(showRappelActions || peutConfirmer || quittance) && (
          <div className="col-span-2 flex flex-wrap gap-2">
            {showRappelActions && <RelanceButton bienId={bienId} bailId={bailId} echeanceId={ech.id} />}
            {showRappelActions && (
              <Button size="sm" variant="ghost" onClick={onToggleRappels} aria-expanded={isExpanded}>
                <History aria-hidden />
                Relances
                <ChevronDown aria-hidden className={cn("transition-transform duration-tab", isExpanded && "rotate-180")} />
              </Button>
            )}
            {peutConfirmer && <ConfirmerButton bienId={bienId} bailId={bailId} echeanceId={ech.id} />}
            {quittance && (
              <>
                <Button size="sm" variant="outline" onClick={onOpen}>
                  <Eye aria-hidden />
                  Voir la quittance
                </Button>
                <Button size="sm" variant="outline" onClick={onDownload} aria-label="Télécharger la quittance en PDF">
                  <Download aria-hidden />
                  PDF
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isExpanded && <RelanceHistoriquePanel bienId={bienId} bailId={bailId} echeanceId={ech.id} />}
    </li>
  );
}
