import { Link } from "react-router-dom";
import { Bell, TriangleAlert } from "lucide-react";
import { formatFcfa, formatMontant, NO_BREAK_SPACE } from "@/lib/fcfa";
import { useOwnerNavigation } from "@/components/owner/useOwnerNavigation";

// Bandeau Baobab du tableau de bord mobile (charte, planche 33) puis alerte des retards.

interface BandeauMobileProps {
  prenom: string;
  dateCourte: string;
  nbBiens: number;
  moisCourant: string;
  encaisse: number;
  attendu: number;
  tauxRecouvrement: number | null;
}

const elision = (mois: string) => (/^[aeiouy]/i.test(mois) ? `d'${mois}` : `de ${mois}`);

export function BandeauMobile(props: BandeauMobileProps) {
  const { initiales, nbNonLues } = useOwnerNavigation();
  const { prenom, dateCourte, nbBiens, moisCourant, encaisse, attendu, tauxRecouvrement } = props;

  return (
    <section aria-label="Résumé du mois" className="bg-baobab-900 px-4 pb-8 pt-6 text-white">
      <div className="flex items-center gap-3">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-soleil font-display text-h3 font-bold text-encre">
          {initiales}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-h3 font-bold">Bonjour {prenom}</h1>
          <p className="truncate text-body-m text-white/80">
            {dateCourte} · {nbBiens} bien{nbBiens > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          to="/owner/notifications"
          aria-label={nbNonLues ? `Notifications, ${nbNonLues} non lues` : "Notifications"}
          className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-white/10"
        >
          <Bell aria-hidden className="size-6" strokeWidth={1.75} />
          {nbNonLues ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-soleil px-1 text-caption font-bold text-encre">
              {nbNonLues > 9 ? "9+" : nbNonLues}
            </span>
          ) : null}
        </Link>
      </div>

      <p className="mt-6 text-overline font-semibold uppercase text-white/75">Loyers {elision(moisCourant)}</p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-display-m font-bold">{formatMontant(encaisse)}</span>
        <span className="text-body-l font-semibold">FCFA{NO_BREAK_SPACE}reçus</span>
      </p>
      {attendu > 0 && tauxRecouvrement !== null ? (
        <>
          <p className="mt-2 text-body-m text-white/80">sur {formatFcfa(attendu)} attendus</p>
          <div className="mt-5 flex items-center gap-4">
            <div
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-baobab"
              role="progressbar"
              aria-valuenow={tauxRecouvrement}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Part des loyers du mois déjà payée"
            >
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(tauxRecouvrement, 100)}%` }} />
            </div>
            <span className="text-body-l font-bold">{tauxRecouvrement}{NO_BREAK_SPACE}%</span>
          </div>
        </>
      ) : (
        <p className="mt-2 text-body-m text-white/80">Aucun loyer attendu ce mois-ci.</p>
      )}
    </section>
  );
}

export function AlerteRetards({ nombre, total }: { nombre: number; total: number }) {
  return (
    <div className="flex items-center gap-4 rounded-card bg-soleil p-4 text-encre">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-encre text-soleil">
        <TriangleAlert aria-hidden className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-title font-bold">
          {nombre} loyer{nombre > 1 ? "s" : ""} en retard
        </p>
        <p className="text-body-m">{formatFcfa(total)} à relancer</p>
      </div>
      <Link
        to="/owner/loyers-retard"
        className="flex h-11 shrink-0 items-center rounded-control bg-encre px-4 text-body-m font-semibold text-white"
      >
        Relancer
      </Link>
    </div>
  );
}
