import { useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import EnregistrerEspecesModal from "@/components/owner/EnregistrerEspecesModal";
import { Button } from "@/components/ui/button";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/brand/EmptyState";
import { useHistoriqueTransactions } from "@/hooks/usePremium";
import { useBiensEnRetard } from "@/hooks/useBail";
import type { Transaction } from "@/api/transaction";
import { formatFcfa, formatMontant } from "@/lib/fcfa";
import { formatDateLongue } from "@/lib/dates";

// Paiements du propriétaire : loyers reçus et dépenses (mises en avant), tableau de la charte (planche 25).

const PAR_PAGE = 10;

const TYPES: Record<string, { label: string; entree: boolean }> = {
  PAIEMENT_LOYER: { label: "Loyer reçu", entree: true },
  REMBOURSEMENT: { label: "Remboursement", entree: true },
  RESTITUTION_CAUTION: { label: "Caution rendue", entree: false },
  PAIEMENT_PREMIUM: { label: "Mise en avant", entree: false },
  PAIEMENT_PROMOTION: { label: "Promotion", entree: false },
};

const STATUTS: Record<string, { tone: StatusTone; label: string }> = {
  CONFIRME: { tone: "positif", label: "Confirmé" },
  EN_ATTENTE: { tone: "attente", label: "En attente" },
  ECHEC: { tone: "alerte", label: "Échoué" },
  ANNULE: { tone: "arret", label: "Annulé" },
};

const typeDe = (t: Transaction) => TYPES[t.type] ?? { label: t.type, entree: false };
const statutDe = (t: Transaction) => STATUTS[t.statut] ?? { tone: "neutre" as const, label: t.statut };
const referenceDe = (t: Transaction) =>
  (t.type === "PAIEMENT_PREMIUM" || t.type === "PAIEMENT_PROMOTION") && t.metadata?.formuleNom
    ? t.metadata.formuleNom
    : t.transactionId ?? t.id.slice(0, 8).toUpperCase();
const dateCourte = (date: string) => new Date(date).toLocaleDateString("fr-FR");

function Montant({ transaction }: { transaction: Transaction }) {
  const { entree } = typeDe(transaction);
  return (
    <span className={entree ? "font-bold text-baobab" : "font-bold text-encre"}>
      {entree ? "+" : "-"} {formatMontant(transaction.montant)}
    </span>
  );
}

function Detail({ transaction }: { transaction: Transaction }) {
  const lignes: [string, React.ReactNode][] = [
    ["Type", typeDe(transaction).label],
    ["Montant", formatFcfa(transaction.montant)],
    ["Statut", <StatusBadge key="statut" tone={statutDe(transaction).tone}>{statutDe(transaction).label}</StatusBadge>],
    ["Mode de paiement", transaction.modePaiement],
    ["Date", formatDateLongue(transaction.dateInitiation)],
    ["Référence", <span key="ref" className="font-mono text-ref">{referenceDe(transaction)}</span>],
  ];
  if (transaction.bien) lignes.push(["Bien", transaction.bien.titre]);
  if (transaction.locataire) lignes.push(["Locataire", `${transaction.locataire.prenom} ${transaction.locataire.nom}`]);
  if (transaction.metadata?.dureeJours) {
    lignes.push(["Durée", `${transaction.metadata.dureeJours} jour${transaction.metadata.dureeJours > 1 ? "s" : ""}`]);
  }
  return (
    <dl className="divide-y divide-filet">
      {lignes.map(([terme, valeur]) => (
        <div key={terme} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3">
          <dt className="text-body-m text-texte2">{terme}</dt>
          <dd className="text-right text-body-l font-semibold text-encre">{valeur}</dd>
        </div>
      ))}
    </dl>
  );
}

function Tableau({ transactions, onOuvrir }: { transactions: Transaction[]; onOuvrir: (t: Transaction) => void }) {
  const entete = "px-4 py-4 text-left text-overline font-semibold uppercase text-texte2";
  return (
    <div className="hidden overflow-hidden rounded-card border border-filet bg-white md:block">
      <table className="w-full">
        <thead className="bg-surface">
          <tr>
            <th scope="col" className={`${entete} pl-6`}>Opération</th>
            <th scope="col" className={entete}>Mode</th>
            <th scope="col" className={entete}>Date</th>
            <th scope="col" className={`${entete} text-right`}>Montant (FCFA)</th>
            <th scope="col" className={`${entete} pr-6`}>Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-filet">
          {transactions.map((t) => (
            <tr key={t.id} className="transition-colors duration-hover hover:bg-surface/60">
              <td className="py-4 pl-6 pr-4">
                <button type="button" onClick={() => onOuvrir(t)} className="text-left">
                  <span className="block text-title font-semibold text-encre">{typeDe(t).label}</span>
                  <span className="block font-mono text-ref text-texte2">{referenceDe(t)}</span>
                </button>
              </td>
              <td className="px-4 py-4 text-body-l text-encre">{t.modePaiement}</td>
              <td className="px-4 py-4 text-body-l text-encre">{dateCourte(t.dateInitiation)}</td>
              <td className="px-4 py-4 text-right text-body-l"><Montant transaction={t} /></td>
              <td className="py-4 pl-4 pr-6"><StatusBadge tone={statutDe(t).tone}>{statutDe(t).label}</StatusBadge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cartes({ transactions, onOuvrir }: { transactions: Transaction[]; onOuvrir: (t: Transaction) => void }) {
  return (
    <ul className="divide-y divide-filet rounded-card bg-white px-4 md:hidden">
      {transactions.map((t) => (
        <li key={t.id}>
          <button type="button" onClick={() => onOuvrir(t)} className="grid w-full grid-cols-[1fr_auto] items-center gap-3 py-4 text-left">
            <span className="min-w-0">
              <span className="block text-title font-semibold text-encre">{typeDe(t).label}</span>
              <span className="block truncate text-body-m text-texte2">
                {dateCourte(t.dateInitiation)} · {t.modePaiement}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1.5 text-body-l">
              <Montant transaction={t} />
              <StatusBadge tone={statutDe(t).tone} size="sm">{statutDe(t).label}</StatusBadge>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function HistoriquePaiements() {
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState<Transaction | null>(null);
  const [especesOuvert, setEspecesOuvert] = useState(false);
  const { data, isLoading, isError } = useHistoriqueTransactions(page, PAR_PAGE);
  const { data: retards = [] } = useBiensEnRetard();
  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination;
  const totalRetard = retards.reduce((somme, r) => somme + r.totalRetard, 0);

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">Paiements</h1>
          <p className="mt-1 text-body-l text-texte2">Loyers reçus et dépenses liées à vos annonces</p>
        </div>
        <Button onClick={() => setEspecesOuvert(true)}>
          <Banknote aria-hidden />
          Enregistrer un paiement en espèces
        </Button>
      </header>

      {retards.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-card bg-soleil p-4 text-encre">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-encre text-soleil">
            <TriangleAlert aria-hidden className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-title font-bold">
              {retards.length} loyer{retards.length > 1 ? "s" : ""} en retard
            </p>
            <p className="text-body-m">{formatFcfa(totalRetard)} à relancer</p>
          </div>
          <Button asChild variant="encre">
            <Link to="/owner/loyers-retard">Voir et relancer</Link>
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Chargement des paiements">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-card bg-white" />)}
        </div>
      ) : isError ? (
        <p role="alert" className="rounded-card bg-soleil-100 p-4 text-body-m text-encre">
          Les paiements n'ont pas pu être chargés. Rechargez la page dans un instant.
        </p>
      ) : transactions.length === 0 ? (
        <EmptyState
          titre="Aucun paiement pour l'instant"
          texte="Les loyers reçus et les paiements enregistrés apparaîtront ici."
          illustration="appartement"
        />
      ) : (
        <>
          <Tableau transactions={transactions} onOuvrir={setSelection} />
          <Cartes transactions={transactions} onOuvrir={setSelection} />
          {pagination && pagination.totalPages > 1 && (
            <nav aria-label="Pagination" className="grid grid-cols-[1fr_auto] items-center gap-4">
              <p className="text-body-m text-texte2">
                {(pagination.page - 1) * PAR_PAGE + 1}-{Math.min(pagination.page * PAR_PAGE, pagination.total)} sur {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" aria-label="Page précédente" disabled={pagination.page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft aria-hidden />
                </Button>
                <Button variant="outline" size="icon" aria-label="Page suivante" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight aria-hidden />
                </Button>
              </div>
            </nav>
          )}
        </>
      )}

      <SheetDialog open={selection !== null} onOpenChange={(ouvert) => !ouvert && setSelection(null)} title="Détail du paiement">
        {selection && <Detail transaction={selection} />}
      </SheetDialog>
      {especesOuvert && <EnregistrerEspecesModal onClose={() => setEspecesOuvert(false)} />}
    </div>
  );
}
