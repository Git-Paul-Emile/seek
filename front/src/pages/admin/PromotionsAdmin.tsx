import { useState } from "react";
import { format } from "date-fns";
import { CalendarCheck, Megaphone, RefreshCw, StopCircle, Wallet } from "lucide-react";
import { useAdminHistoriquePromotions, useAdminStatsPromotions, useAdminArreterPromotion, useAdminTraiterExpires } from "@/hooks/usePremium";
import { paginationServeur } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Pagination from "@/components/ui/Pagination";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/owner/dashboard/KpiCard";
import {
  EnTeteAdmin,
  FiltresStatut,
  LigneChargement,
  LigneMessage,
  SectionAdmin,
  Tableau,
  Td,
  TeteTableau,
  Th,
  Tr,
  type FiltreOption,
} from "@/components/admin/table/Tableau";
import { formatMontant } from "@/lib/fcfa";

// Mises en avant payantes (Finances · Promotions) : chiffres clés (planche 24), répartition
// par formule, puis l'historique au format tableau (planche 25).

const TAILLE_PAGE = 20;
const NB_COLONNES = 8;

type FiltrePromotion = "" | "ACTIVE" | "TERMINEE" | "ARRETEE" | "EXPIREE";

const STATUT_PROMOTION: Record<string, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: "Active", tone: "positif" },
  TERMINEE: { label: "Terminée", tone: "neutre" },
  ARRETEE: { label: "Arrêtée", tone: "arret" },
  EXPIREE: { label: "Expirée", tone: "attente" },
};

const FILTRES: FiltreOption<FiltrePromotion>[] = [
  { valeur: "", label: "Toutes" },
  { valeur: "ACTIVE", label: "Actives" },
  { valeur: "TERMINEE", label: "Terminées" },
  { valeur: "ARRETEE", label: "Arrêtées" },
  { valeur: "EXPIREE", label: "Expirées" },
];

const date = (valeur: string) => format(new Date(valeur), "dd/MM/yyyy");

export default function PromotionsAdmin() {
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState<FiltrePromotion>("");
  const [aArreter, setAArreter] = useState<{ id: string; titre?: string } | null>(null);

  const { data, isLoading } = useAdminHistoriquePromotions({ page, limit: TAILLE_PAGE, statut: statut || undefined });
  const { data: stats } = useAdminStatsPromotions();
  const arreter = useAdminArreterPromotion();
  const traiterExpires = useAdminTraiterExpires();

  const promotions = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  const changerStatut = (valeur: FiltrePromotion) => {
    setStatut(valeur);
    setPage(1);
  };

  const confirmerArret = () => {
    if (!aArreter) return;
    arreter.mutate({ id: aArreter.id }, { onSettled: () => setAArreter(null) });
  };

  return (
    <div className="space-y-6">
      <EnTeteAdmin
        titre="Mises en avant"
        description="Historique des promotions payantes des propriétaires."
        actions={
          <Button variant="outline" onClick={() => traiterExpires.mutate()} disabled={traiterExpires.isPending}>
            <RefreshCw aria-hidden className={traiterExpires.isPending ? "animate-spin" : undefined} />
            Clore les promotions expirées
          </Button>
        }
      />

      {stats && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard icon={Megaphone} label="Promotions" value={stats.total} />
          <KpiCard icon={CalendarCheck} label="Actives" value={stats.actives} />
          <KpiCard icon={Wallet} label="Revenus" value={formatMontant(stats.montantTotal)} unit="FCFA" />
          <KpiCard icon={Wallet} label="Ce mois" value={formatMontant(stats.montantMois)} unit="FCFA" />
        </div>
      )}

      {stats?.parFormule && stats.parFormule.length > 0 && (
        <SectionAdmin titre="Par formule">
          <ul className="divide-y divide-filet">
            {stats.parFormule.map((formule) => (
              <li key={formule.formuleNom} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 py-3 text-body-m">
                <span className="font-semibold text-encre">{formule.formuleNom}</span>
                <span className="text-texte2">
                  {formule.count} promotion{formule.count > 1 ? "s" : ""}
                </span>
                <span className="font-semibold tabular-nums text-encre">{formatMontant(formule.montant)} FCFA</span>
              </li>
            ))}
          </ul>
        </SectionAdmin>
      )}

      <FiltresStatut label="Filtrer par statut" options={FILTRES} valeur={statut} onChange={changerStatut} />

      <Tableau label="Historique des promotions">
        <TeteTableau>
          <Th>Bien</Th>
          <Th>Propriétaire</Th>
          <Th>Formule</Th>
          <Th alignement="droite">Montant FCFA</Th>
          <Th>Statut</Th>
          <Th>Début</Th>
          <Th>Fin</Th>
          <Th alignement="droite">
            <span className="sr-only">Actions</span>
          </Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des promotions" />
          ) : promotions.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>Aucune promotion pour ce filtre.</LigneMessage>
          ) : (
            promotions.map((promotion) => {
              const statutPromotion = STATUT_PROMOTION[promotion.statut] ?? { label: promotion.statut, tone: "neutre" as const };
              return (
                <Tr key={promotion.id}>
                  <Td className="max-w-[220px] truncate font-semibold">{promotion.bien?.titre ?? "Sans titre"}</Td>
                  <Td>{promotion.proprietaire ? `${promotion.proprietaire.prenom} ${promotion.proprietaire.nom}` : ""}</Td>
                  <Td>{promotion.formuleNom}</Td>
                  <Td montant>{formatMontant(promotion.montant)}</Td>
                  <Td>
                    <StatusBadge tone={statutPromotion.tone}>{statutPromotion.label}</StatusBadge>
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums text-texte2">{date(promotion.dateDebut)}</Td>
                  <Td className="whitespace-nowrap tabular-nums text-texte2">{date(promotion.dateFin)}</Td>
                  <Td alignement="droite">
                    {promotion.statut === "ACTIVE" && (
                      <Button size="sm" variant="outline" onClick={() => setAArreter({ id: promotion.id, titre: promotion.bien?.titre })}>
                        <StopCircle aria-hidden />
                        Arrêter
                      </Button>
                    )}
                  </Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Tableau>

      <Pagination {...paginationServeur(page, totalPages, setPage)} total={total} pageSize={TAILLE_PAGE} />

      <ConfirmModal
        open={Boolean(aArreter)}
        title="Arrêter cette promotion ?"
        message={`La mise en avant de « ${aArreter?.titre ?? "ce bien"} » s'arrête tout de suite et le propriétaire est prévenu.`}
        confirmLabel="Arrêter la promotion"
        isPending={arreter.isPending}
        onConfirm={confirmerArret}
        onCancel={() => setAArreter(null)}
      />
    </div>
  );
}
