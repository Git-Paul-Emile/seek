import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Award, Eye, Hourglass, Phone, ShieldCheck, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { useVerificationStatus } from "@/hooks/useVerification";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Rappel de vérification d'identité du propriétaire (charte, planche « Alertes et fenêtres ») :
// bandeau Soleil pâle pour l'attente et le refus, surface pour le compte non vérifié.

interface VerificationAlertProps {
  variant?: "banner" | "card";
  showBenefits?: boolean;
}

type StatutAffiche = "PENDING" | "NOT_VERIFIED" | "REJECTED";

const CONTENU: Record<StatutAffiche, { icone: LucideIcon; titre: string; texte: string; action?: string; actionCourte?: string; fond: string }> = {
  PENDING: {
    icone: Hourglass,
    titre: "Demande en cours d'analyse",
    texte: "Votre demande de vérification est en cours d'analyse. Nous vous informerons dès validation.",
    fond: "bg-soleil-100",
  },
  NOT_VERIFIED: {
    icone: ShieldCheck,
    titre: "Votre compte n'est pas encore vérifié",
    texte: "Les annonces des comptes vérifiés inspirent plus de confiance.",
    action: "Vérifier mon identité",
    actionCourte: "Vérifier",
    fond: "bg-surface",
  },
  REJECTED: {
    icone: TriangleAlert,
    titre: "Demande de vérification refusée",
    texte: "Vous pouvez envoyer une nouvelle demande.",
    action: "Envoyer une nouvelle demande",
    actionCourte: "Refaire",
    fond: "bg-soleil-100",
  },
};

const AVANTAGES: { icone: LucideIcon; libelle: string }[] = [
  { icone: Eye, libelle: "Plus de visibilité" },
  { icone: Award, libelle: "Badge de confiance" },
  { icone: Phone, libelle: "Meilleur taux de contact" },
];

function IconeStatut({ icone: Icone, statut }: { icone: LucideIcon; statut: StatutAffiche }) {
  return (
    <Icone
      aria-hidden
      className={cn("mt-0.5 size-5 shrink-0", statut === "REJECTED" ? "fill-soleil text-encre" : statut === "NOT_VERIFIED" ? "text-baobab" : "text-encre")}
    />
  );
}

function Motif({ motif }: { motif?: string | null }) {
  if (!motif) return null;
  return (
    <p className="mt-1 text-body-m text-encre">
      <span className="font-semibold">Motif : </span>
      {motif}
    </p>
  );
}

export function VerificationAlert({ variant = "banner", showBenefits = false }: VerificationAlertProps) {
  const { data: status, isLoading } = useVerificationStatus();

  if (isLoading) return variant === "banner" ? <div className="h-14 animate-pulse rounded-card bg-surface" /> : null;
  const statut = status?.statut;
  if (statut !== "PENDING" && statut !== "NOT_VERIFIED" && statut !== "REJECTED") return null;

  const contenu = CONTENU[statut];
  const motif = statut === "REJECTED" ? status?.documents?.motifRejet : null;

  if (variant === "card") {
    return (
      <section aria-label={contenu.titre} className={cn("rounded-card p-5 lg:p-6", contenu.fond)}>
        <div className="grid grid-cols-[auto_1fr] items-start gap-3">
          <IconeStatut icone={contenu.icone} statut={statut} />
          <div className="min-w-0">
            <h3 className="font-display text-h3 font-bold text-encre">{contenu.titre}</h3>
            <Motif motif={motif} />
            <p className="mt-1 text-body-m text-texte2">{contenu.texte}</p>
            {showBenefits && statut === "NOT_VERIFIED" && (
              <ul className="mt-3 space-y-2">
                {AVANTAGES.map(({ icone: Icone, libelle }) => (
                  <li key={libelle} className="flex items-center gap-2 text-body-m text-encre">
                    <Icone aria-hidden className="size-4 text-baobab" />
                    {libelle}
                  </li>
                ))}
              </ul>
            )}
            {contenu.action && (
              <Link to="/owner/verification" className={buttonVariants({ className: "mt-4" })}>
                {contenu.action}
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <Bandeau fond={contenu.fond} icone={<IconeStatut icone={contenu.icone} statut={statut} />} action={contenu.actionCourte}>
      <p className="text-body-m font-semibold text-encre">{statut === "NOT_VERIFIED" ? `${contenu.titre}.` : contenu.titre}</p>
      <p className="text-body-m text-texte2">{contenu.texte}</p>
      <Motif motif={motif} />
    </Bandeau>
  );
}

function Bandeau({ fond, icone, action, children, onDismiss }: { fond: string; icone: ReactNode; action?: string; children: ReactNode; onDismiss?: () => void }) {
  return (
    <div role="status" className={cn("grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-3 rounded-card p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center", fond)}>
      {icone}
      <div className="min-w-0">{children}</div>
      {(action || onDismiss) && (
        <div className="col-start-2 flex items-center gap-2 sm:col-start-auto">
          {action && (
            <Link to="/owner/verification" className={buttonVariants({ size: "sm" })}>
              {action}
            </Link>
          )}
          {onDismiss && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={onDismiss} aria-label="Masquer ce message">
              <X aria-hidden />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Version compacte pour les formulaires (soft restriction)
 */
export function VerificationBanner({ onDismiss }: { onDismiss?: () => void }) {
  const { data: status, isLoading } = useVerificationStatus();
  const statut = status?.statut;
  if (isLoading || (statut !== "PENDING" && statut !== "NOT_VERIFIED" && statut !== "REJECTED")) return null;

  const contenu = CONTENU[statut];
  const motif = statut === "REJECTED" ? status?.documents?.motifRejet : null;

  return (
    <Bandeau fond="bg-soleil-100" icone={<IconeStatut icone={contenu.icone} statut={statut} />} action={contenu.action} onDismiss={onDismiss}>
      <p className="text-body-m font-semibold text-encre">{contenu.titre}</p>
      {statut !== "REJECTED" && <p className="text-body-m text-texte2">{contenu.texte}</p>}
      <Motif motif={motif} />
    </Bandeau>
  );
}
