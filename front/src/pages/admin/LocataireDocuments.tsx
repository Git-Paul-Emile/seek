import { useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ExternalLink, FileText, Info } from "lucide-react";
import { useLocataireAvecDocuments } from "@/hooks/useSuspension";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/brand/EmptyState";
import { BlocChargement, CarteAdmin, EnTeteAdmin, SectionAdmin } from "@/components/admin/table/Tableau";
import { formatMontant } from "@/lib/fcfa";

// Dossier d'un locataire vu par l'administration : informations, pièces d'identité (validées
// par le propriétaire, pas par l'admin) et baux. Une section par bloc, comme les fiches du lot 2.

const RETOUR = { to: "/admin/utilisateurs/locataires", label: "Locataires" };

const TYPE_DOC_LABELS: Record<string, string> = {
  CNI_RECTO: "Carte d'identité, recto",
  CNI_VERSO: "Carte d'identité, verso",
  PASSEPORT: "Passeport",
  PERMIS: "Permis de conduire",
  SELFIE: "Selfie",
  AUTRE: "Autre document",
};

const STATUT_VERIFICATION: Record<string, { label: string; tone: StatusTone }> = {
  PENDING: { label: "En attente", tone: "attente" },
  EN_ATTENTE: { label: "En attente", tone: "attente" },
  VERIFIED: { label: "Vérifié", tone: "positif" },
  VALIDE: { label: "Validé", tone: "positif" },
  REJECTED: { label: "Refusé", tone: "arret" },
  REJETE: { label: "Refusé", tone: "arret" },
  NOT_VERIFIED: { label: "Non vérifié", tone: "neutre" },
};

const STATUT_BAIL: Record<string, { label: string; tone: StatusTone }> = {
  ACTIF: { label: "Actif", tone: "positif" },
  TERMINE: { label: "Terminé", tone: "neutre" },
  RESILIE: { label: "Résilié", tone: "arret" },
};

const IMAGE = /\.(jpeg|jpg|gif|png|webp)$/i;
const date = (valeur: string) => format(new Date(valeur), "dd/MM/yyyy");
const statut = (table: Record<string, { label: string; tone: StatusTone }>, valeur: string) => table[valeur] ?? { label: valeur, tone: "neutre" as const };

function InfoLigne({ libelle, children }: { libelle: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-body-m text-texte2">{libelle}</dt>
      <dd className="mt-0.5 font-semibold text-encre">{children}</dd>
    </div>
  );
}

export default function LocataireDocuments() {
  const { id = "" } = useParams();
  const { data: result, isLoading } = useLocataireAvecDocuments(id);
  const [image, setImage] = useState<string | null>(null);
  const locataire = result?.data;

  if (isLoading) {
    return (
      <div className="max-w-3xl">
        <EnTeteAdmin retour={RETOUR} titre="Dossier du locataire" />
        <BlocChargement label="Chargement du dossier" />
      </div>
    );
  }

  if (!locataire) {
    return (
      <div className="max-w-3xl">
        <EnTeteAdmin retour={RETOUR} titre="Dossier du locataire" />
        <CarteAdmin>
          <EmptyState titre="Locataire introuvable" texte="Ce compte n'existe plus ou le lien est incorrect. Revenez à la liste des locataires." />
        </CarteAdmin>
      </div>
    );
  }

  const verification = locataire.verification;

  return (
    <div className="max-w-3xl space-y-6">
      <EnTeteAdmin retour={RETOUR} titre={`${locataire.prenom} ${locataire.nom}`} description="Dossier du locataire" />

      <SectionAdmin titre="Informations">
        <dl className="grid gap-4 sm:grid-cols-2">
          <InfoLigne libelle="Téléphone">
            <span className="tabular-nums">{locataire.telephone}</span>
          </InfoLigne>
          {locataire.email && <InfoLigne libelle="E-mail">{locataire.email}</InfoLigne>}
          <InfoLigne libelle="Compte">
            {locataire.estSuspendu ? <StatusBadge tone="arret">Suspendu</StatusBadge> : <StatusBadge tone="positif">Actif</StatusBadge>}
          </InfoLigne>
          <InfoLigne libelle="Inscrit le">{date(locataire.createdAt)}</InfoLigne>
          {locataire.proprietaire && (
            <div className="sm:col-span-2">
              <InfoLigne libelle="Propriétaire">
                {locataire.proprietaire.prenom} {locataire.proprietaire.nom} · <span className="tabular-nums">{locataire.proprietaire.telephone}</span>
              </InfoLigne>
            </div>
          )}
        </dl>
      </SectionAdmin>

      <SectionAdmin
        titre="Vérification d'identité"
        actions={verification ? <StatusBadge tone={statut(STATUT_VERIFICATION, verification.statut).tone}>{statut(STATUT_VERIFICATION, verification.statut).label}</StatusBadge> : undefined}
      >
        <p className="mb-4 flex items-start gap-2 rounded-control bg-surface p-3 text-body-m text-encre">
          <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-baobab" />
          Le propriétaire valide les pièces de ses locataires. L'administration les consulte seulement.
        </p>
        {!verification ? (
          <p className="text-body-m text-texte2">Aucune pièce envoyée pour l'instant.</p>
        ) : (
          <>
            {verification.verifiedAt && <p className="mb-3 text-body-m text-texte2">Vérifié le {date(verification.verifiedAt)}</p>}
            {verification.documents.length === 0 ? (
              <p className="text-body-m text-texte2">Aucune pièce envoyée pour l'instant.</p>
            ) : (
              <ul className="divide-y divide-filet rounded-control border border-filet">
                {verification.documents.map((doc) => {
                  const libelle = TYPE_DOC_LABELS[doc.type] ?? doc.type;
                  const statutDoc = statut(STATUT_VERIFICATION, doc.statut);
                  return (
                    <li key={doc.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 p-3">
                      {IMAGE.test(doc.url) ? (
                        <button type="button" onClick={() => setImage(doc.url)} aria-label={`Agrandir : ${libelle}`} className="size-14 overflow-hidden rounded-control border border-filet">
                          <img src={doc.url} alt="" className="size-full object-cover" />
                        </button>
                      ) : (
                        <span className="flex size-14 items-center justify-center rounded-control bg-surface">
                          <FileText aria-hidden className="size-5 text-texte2" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block font-semibold text-encre">{libelle}</span>
                        <span className="block text-body-m text-texte2">Envoyé le {date(doc.createdAt)}</span>
                        <StatusBadge tone={statutDoc.tone} size="sm" className="mt-1">
                          {statutDoc.label}
                        </StatusBadge>
                      </span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Ouvrir ${libelle} dans un nouvel onglet`}
                        className="flex size-10 items-center justify-center rounded-control border border-bord-champ text-encre hover:bg-surface"
                      >
                        <ExternalLink aria-hidden className="size-4" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </SectionAdmin>

      {locataire.bails && locataire.bails.length > 0 && (
        <SectionAdmin titre={`Baux · ${locataire.bails.length}`}>
          <ul className="divide-y divide-filet">
            {locataire.bails.map((bail) => {
              const statutBail = statut(STATUT_BAIL, bail.statut);
              return (
                <li key={bail.id} className="grid grid-cols-[1fr_auto] items-start gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block font-semibold text-encre">{bail.bien?.titre ?? "Sans titre"}</span>
                    <span className="block text-body-m text-texte2">
                      {[bail.bien?.ville, bail.typeBail, bail.montantLoyer ? `${formatMontant(bail.montantLoyer)} FCFA par mois` : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <StatusBadge tone={statutBail.tone}>{statutBail.label}</StatusBadge>
                </li>
              );
            })}
          </ul>
        </SectionAdmin>
      )}

      <SheetDialog open={Boolean(image)} onOpenChange={(open) => !open && setImage(null)} title="Pièce d'identité" className="sm:max-w-3xl">
        {image && <img src={image} alt="Pièce d'identité en grand" className="max-h-[70vh] w-full rounded-control object-contain" />}
      </SheetDialog>
    </div>
  );
}
