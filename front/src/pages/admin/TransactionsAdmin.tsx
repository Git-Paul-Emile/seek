import { useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import { CalendarDays, CircleCheck, Download, Wallet } from "lucide-react";
import { useAdminHistoriqueTransactions, useAdminStatsTransactions } from "@/hooks/usePremium";
import { paginationServeur } from "@/hooks/usePagination";
import type { Transaction } from "@/api/transaction";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/NativeSelect";
import Pagination from "@/components/ui/Pagination";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { KpiCard } from "@/components/owner/dashboard/KpiCard";
import {
  EnTeteAdmin,
  LigneChargement,
  LigneMessage,
  RechercheAdmin,
  SectionAdmin,
  Tableau,
  Td,
  TeteTableau,
  Th,
  Tr,
} from "@/components/admin/table/Tableau";
import { formatMontant } from "@/lib/fcfa";

// Historique des paiements (Finances · Transactions) : chiffres clés (planche 24), tendance
// sur douze mois, tableau filtrable (planche 25) et détail en fenêtre.

const TAILLE_PAGE = 20;
const NB_COLONNES = 7;
const DELAI_RECHERCHE_MS = 300;

const TYPE_LABELS: Record<string, string> = {
  LOYER: "Loyer",
  PREMIUM: "Premium",
  CAUTION: "Caution",
};

const STATUT_TRANSACTION: Record<string, { label: string; tone: StatusTone }> = {
  CONFIRME: { label: "Confirmée", tone: "positif" },
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  ECHOUE: { label: "Échouée", tone: "arret" },
  REMBOURSE: { label: "Remboursée", tone: "neutre" },
};

const statutDe = (statut: string) => STATUT_TRANSACTION[statut] ?? { label: statut, tone: "neutre" as const };
const date = (valeur: string) => format(new Date(valeur), "dd/MM/yyyy");

function exporterCsv(transactions: Transaction[]) {
  const entete = ["ID", "Type", "Montant", "Mode paiement", "Référence", "Statut", "Propriétaire", "Téléphone", "Bien", "Date initiation", "Date confirmation"];
  const lignes = transactions.map((t) => [
    t.id,
    TYPE_LABELS[t.type] ?? t.type,
    t.montant,
    t.modePaiement,
    t.reference ?? t.transactionId ?? "",
    statutDe(t.statut).label,
    t.proprietaire ? `${t.proprietaire.prenom} ${t.proprietaire.nom}` : "",
    t.proprietaire?.telephone ?? "",
    t.bien?.titre ?? "",
    date(t.dateInitiation),
    t.dateConfirmation ? date(t.dateConfirmation) : "",
  ]);
  const csv = [entete, ...lignes].map((ligne) => ligne.map((valeur) => `"${String(valeur).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
  lien.click();
  URL.revokeObjectURL(url);
}

function Tendance({ mois }: { mois: { label: string; montant: number; count: number }[] }) {
  const max = Math.max(...mois.map(({ montant }) => montant), 1);
  return (
    <SectionAdmin titre="Douze derniers mois">
      <ul className="space-y-3">
        {mois.map(({ label, montant, count }) => (
          <li key={label} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 text-body-m">
            <span className="text-texte2">{label}</span>
            <span aria-hidden className="h-3 overflow-hidden rounded-full bg-surface">
              <span className="block h-full rounded-full bg-baobab" style={{ width: `${(montant / max) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums text-encre">
              <span className="font-semibold">{formatMontant(montant)} FCFA</span>
              <span className="text-texte2"> · {count}</span>
            </span>
          </li>
        ))}
      </ul>
    </SectionAdmin>
  );
}

function LigneDetail({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(110px,40%)_1fr] gap-4 py-3">
      <dt className="text-texte2">{libelle}</dt>
      <dd className="break-words text-right text-encre">{children}</dd>
    </div>
  );
}

function DetailTransaction({ transaction, onClose }: { transaction: Transaction; onClose: () => void }) {
  const statut = statutDe(transaction.statut);
  const reference = transaction.reference ?? transaction.transactionId;
  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title="Détail de la transaction">
      <p className="font-display text-price-l font-bold text-encre">
        {formatMontant(transaction.montant)} <span className="font-body text-body-l font-semibold">FCFA</span>
      </p>
      <StatusBadge tone={statut.tone} className="mt-2">
        {statut.label}
      </StatusBadge>
      <dl className="mt-4 divide-y divide-filet border-t border-filet text-body-m">
        <LigneDetail libelle="Type">{TYPE_LABELS[transaction.type] ?? transaction.type}</LigneDetail>
        <LigneDetail libelle="Mode de paiement">{transaction.modePaiement}</LigneDetail>
        {reference && (
          <LigneDetail libelle="Référence">
            <span className="font-mono text-ref">{reference}</span>
          </LigneDetail>
        )}
        <LigneDetail libelle="Initiée le">{date(transaction.dateInitiation)}</LigneDetail>
        {transaction.dateConfirmation && <LigneDetail libelle="Confirmée le">{date(transaction.dateConfirmation)}</LigneDetail>}
        {transaction.proprietaire && (
          <LigneDetail libelle="Propriétaire">
            {transaction.proprietaire.prenom} {transaction.proprietaire.nom} · {transaction.proprietaire.telephone}
          </LigneDetail>
        )}
        {transaction.bien && <LigneDetail libelle="Bien">{transaction.bien.titre}</LigneDetail>}
        {transaction.locataire && (
          <LigneDetail libelle="Locataire">
            {transaction.locataire.prenom} {transaction.locataire.nom} · {transaction.locataire.telephone}
          </LigneDetail>
        )}
        {transaction.metadata?.formuleNom && <LigneDetail libelle="Formule premium">{transaction.metadata.formuleNom}</LigneDetail>}
        {transaction.note && <LigneDetail libelle="Note">{transaction.note}</LigneDetail>}
        <LigneDetail libelle="Identifiant">
          <span className="font-mono text-ref text-texte2">{transaction.id}</span>
        </LigneDetail>
      </dl>
    </SheetDialog>
  );
}

export default function TransactionsAdmin() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [statut, setStatut] = useState("");
  const [recherche, setRecherche] = useState("");
  const [rechercheEnvoyee, setRechercheEnvoyee] = useState("");
  const [detail, setDetail] = useState<Transaction | null>(null);

  // La requête part 300 ms après la dernière frappe, et la liste repart de la page 1.
  useEffect(() => {
    const valeur = recherche.trim();
    if (valeur === rechercheEnvoyee) return;
    const minuteur = setTimeout(() => {
      setRechercheEnvoyee(valeur);
      setPage(1);
    }, DELAI_RECHERCHE_MS);
    return () => clearTimeout(minuteur);
  }, [recherche, rechercheEnvoyee]);

  const { data, isLoading } = useAdminHistoriqueTransactions({
    page,
    limit: TAILLE_PAGE,
    type: type || undefined,
    statut: statut || undefined,
    search: rechercheEnvoyee || undefined,
  });
  const { data: stats } = useAdminStatsTransactions();

  const transactions = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <EnTeteAdmin
        titre="Transactions"
        description="Tous les paiements passés par la plateforme : loyers, cautions et formules premium."
        actions={
          <Button variant="outline" onClick={() => exporterCsv(transactions)} disabled={transactions.length === 0}>
            <Download aria-hidden />
            Exporter cette page en CSV
          </Button>
        }
      />

      {stats && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard icon={CircleCheck} label="Paiements confirmés" value={stats.totalConfirme} />
          <KpiCard icon={Wallet} label="Montant total" value={formatMontant(stats.montantTotal)} unit="FCFA" />
          <KpiCard icon={CalendarDays} label="Ce mois" value={formatMontant(stats.montantMois)} unit="FCFA" />
          <KpiCard icon={CalendarDays} label="Cette année" value={formatMontant(stats.montantAnnee)} unit="FCFA" />
        </div>
      )}

      {stats?.par12Mois && stats.par12Mois.some(({ montant }) => montant > 0) && <Tendance mois={stats.par12Mois} />}

      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
        <RechercheAdmin label="Rechercher une transaction" placeholder="Référence ou téléphone" value={recherche} onChange={setRecherche} />
        <NativeSelect
          aria-label="Type de transaction"
          value={type}
          onChange={(event) => {
            setType(event.target.value);
            setPage(1);
          }}
          className="lg:w-48"
        >
          <option value="">Type : tous</option>
          {Object.entries(TYPE_LABELS).map(([valeur, label]) => (
            <option key={valeur} value={valeur}>
              Type : {label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Statut de la transaction"
          value={statut}
          onChange={(event) => {
            setStatut(event.target.value);
            setPage(1);
          }}
          className="lg:w-52"
        >
          <option value="">Statut : tous</option>
          <option value="CONFIRME">Statut : confirmée</option>
          <option value="EN_ATTENTE">Statut : en attente</option>
          <option value="ECHOUE">Statut : échouée</option>
        </NativeSelect>
      </div>

      <Tableau label="Transactions">
        <TeteTableau>
          <Th>Type</Th>
          <Th alignement="droite">Montant FCFA</Th>
          <Th>Paiement</Th>
          <Th>Statut</Th>
          <Th>Propriétaire</Th>
          <Th>Bien</Th>
          <Th>Date</Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des transactions" />
          ) : transactions.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>Aucune transaction pour ces critères.</LigneMessage>
          ) : (
            transactions.map((transaction) => {
              const statutLigne = statutDe(transaction.statut);
              return (
                <Tr key={transaction.id} onClick={() => setDetail(transaction)}>
                  <Td className="font-semibold">{TYPE_LABELS[transaction.type] ?? transaction.type}</Td>
                  <Td montant>{formatMontant(transaction.montant)}</Td>
                  <Td>
                    <span className="block">{transaction.modePaiement}</span>
                    {(transaction.reference ?? transaction.transactionId) && (
                      <span className="block max-w-[140px] truncate font-mono text-ref text-texte2">{transaction.reference ?? transaction.transactionId}</span>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge tone={statutLigne.tone}>{statutLigne.label}</StatusBadge>
                  </Td>
                  <Td>
                    {transaction.proprietaire && (
                      <>
                        <span className="block">
                          {transaction.proprietaire.prenom} {transaction.proprietaire.nom}
                        </span>
                        <span className="block tabular-nums text-texte2">{transaction.proprietaire.telephone}</span>
                      </>
                    )}
                  </Td>
                  <Td className="max-w-[180px] truncate text-texte2">{transaction.bien?.titre}</Td>
                  <Td className="whitespace-nowrap tabular-nums text-texte2">{date(transaction.dateInitiation)}</Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Tableau>

      <Pagination {...paginationServeur(page, totalPages, setPage)} total={total} pageSize={TAILLE_PAGE} />

      {detail && <DetailTransaction transaction={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
