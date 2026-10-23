import { Mail, Phone } from "lucide-react";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useProprietaireLocataire } from "@/hooks/useProprietaireLocataire";
import { SkDetailSections } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/brand/EmptyState";

// Coordonnées du propriétaire du logement en cours.

const STATUTS_BAIL_EN_COURS = ["ACTIF", "EN_PREAVIS"];

export default function ProprietaireLocatairePage() {
  const { locataire } = useLocataireAuth();
  const aUnBail = Boolean(locataire?.bails?.some((bail) => STATUTS_BAIL_EN_COURS.includes(bail.statut)));
  const { data, isLoading } = useProprietaireLocataire(aUnBail);

  if (isLoading) return <SkDetailSections sections={2} />;

  if (!data) {
    return (
      <EmptyState
        titreNiveau="h1"
        titre="Aucun propriétaire associé"
        texte="Les coordonnées de votre propriétaire apparaissent ici pendant votre bail."
      />
    );
  }

  const { proprietaire, bien } = data;
  const initiales = `${proprietaire.prenom[0] ?? ""}${proprietaire.nom[0] ?? ""}`.toUpperCase();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">Mon propriétaire</h1>
      <section className="rounded-card bg-white p-5 lg:p-6">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-baobab-100 font-display text-title font-bold text-baobab">
            {initiales}
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-h3 font-bold text-encre">
              {proprietaire.prenom} {proprietaire.nom}
            </h2>
            <p className="text-body-m text-texte2">Propriétaire{bien?.titre ? ` · ${bien.titre}` : ""}</p>
          </div>
        </div>
        <dl className="mt-6 divide-y divide-filet border-t border-filet">
          <div className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-4 py-3">
            <dt className="text-body-l text-texte2">Téléphone</dt>
            <dd className="text-right text-body-l font-semibold tabular-nums text-encre">{proprietaire.telephone}</dd>
          </div>
          {proprietaire.email && (
            <div className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-4 py-3">
              <dt className="text-body-l text-texte2">E-mail</dt>
              <dd className="break-all text-right text-body-l font-semibold text-encre">{proprietaire.email}</dd>
            </div>
          )}
        </dl>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button asChild>
            <a href={`tel:${proprietaire.telephone.replace(/\s/g, "")}`}>
              <Phone aria-hidden />
              Appeler
            </a>
          </Button>
          {proprietaire.email && (
            <Button asChild variant="outline">
              <a href={`mailto:${proprietaire.email}`}>
                <Mail aria-hidden />
                Écrire un e-mail
              </a>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
