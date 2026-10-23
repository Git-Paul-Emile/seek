import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CircleCheck, FileSignature, Loader2, MessageSquareWarning, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import type { StatutEtatDesLieux } from "@/api/etatDesLieux.api";
import {
  useContesterEtatDesLieux,
  useEtatDesLieuxLocataire,
  useSignerEtatDesLieux,
  type ContestationElement,
} from "@/hooks/useEtatsDesLieuxLocataire";
import { Button } from "@/components/ui/button";
import { SkDetailSections } from "@/components/ui/Skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/brand/EmptyState";
import { ElementEtatDesLieux } from "@/components/locataire/etats-des-lieux/ElementEtatDesLieux";
import { formatDateLongue } from "@/lib/dates";

// Revue d'un état des lieux par le locataire : il le signe, ou conteste des éléments
// (motif et photo), puis le propriétaire rectifie, note une réserve ou refuse.

const STATUTS: Record<StatutEtatDesLieux, { label: string; tone: StatusTone }> = {
  BROUILLON: { label: "Brouillon", tone: "neutre" },
  EN_ATTENTE_VALIDATION: { label: "À valider", tone: "attente" },
  VALIDE: { label: "Signé", tone: "positif" },
  CONTESTE: { label: "Contesté", tone: "attente" },
  EN_LITIGE: { label: "En litige", tone: "alerte" },
};

const AVIS: Partial<Record<StatutEtatDesLieux, { icon: typeof CircleCheck; titre: string; texte: string; className: string }>> = {
  CONTESTE: {
    icon: MessageSquareWarning,
    titre: "Contestation envoyée",
    texte: "Votre propriétaire doit rectifier les éléments ou noter une réserve. S'il refuse, l'état des lieux passe en litige.",
    className: "bg-soleil-100",
  },
  EN_LITIGE: {
    icon: TriangleAlert,
    titre: "Désaccord bloquant",
    texte: "Votre propriétaire a refusé vos contestations. Pour conclure, faites établir un état des lieux contradictoire par un huissier de justice ou un médiateur.",
    className: "bg-soleil-100",
  },
};

export default function EtatDesLieuxReview() {
  const { id } = useParams<{ id: string }>();
  const { data: edl, isLoading } = useEtatDesLieuxLocataire(id);
  const signer = useSignerEtatDesLieux();
  const contester = useContesterEtatDesLieux();
  const [contestations, setContestations] = useState<ContestationElement[]>([]);

  if (isLoading) return <SkDetailSections sections={3} />;
  if (!edl || !id) {
    return <EmptyState titreNiveau="h1" titre="État des lieux introuvable" texte="Ce document n'existe plus ou ne vous est pas destiné." />;
  }

  const enAttente = edl.statut === "EN_ATTENTE_VALIDATION";
  const statut = STATUTS[edl.statut];
  const avis = AVIS[edl.statut];

  const signerDocument = () =>
    signer.mutate(id, {
      onSuccess: () => toast.success("État des lieux signé"),
      onError: () => toast.error("La signature n'a pas pu être enregistrée. Réessayez."),
    });

  const envoyerContestations = () =>
    contester.mutate(
      { id, elements: contestations },
      {
        onSuccess: () => {
          setContestations([]);
          toast.success("Contestations envoyées à votre propriétaire");
        },
        onError: () => toast.error("Les contestations n'ont pas pu être envoyées. Réessayez."),
      },
    );

  return (
    <div className="max-w-4xl space-y-6 pb-4">
      <Link to="/locataire/etats-des-lieux" className="inline-flex min-h-11 items-center gap-1.5 text-body-m font-semibold text-baobab">
        <ArrowLeft aria-hidden className="size-4" />
        États des lieux
      </Link>
      <header className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">
            État des lieux {edl.type === "ENTREE" ? "d'entrée" : "de sortie"}
          </h1>
          <p className="mt-1 text-body-l text-texte2">
            Réalisé le {formatDateLongue(edl.dateRealisation)}
            {edl.nbCles != null ? ` · ${edl.nbCles} clé${edl.nbCles > 1 ? "s" : ""} remise${edl.nbCles > 1 ? "s" : ""}` : ""}
          </p>
        </div>
        <StatusBadge tone={statut.tone} className="justify-self-start">{statut.label}</StatusBadge>
      </header>

      {edl.statut === "VALIDE" && (
        <p className="flex items-start gap-3 rounded-card bg-baobab-100 p-5 text-body-l text-encre">
          <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-baobab" />
          {edl.dateValidation ? `Signé le ${formatDateLongue(edl.dateValidation)}. ` : ""}Ce document est verrouillé et fait foi pour votre bail.
        </p>
      )}
      {avis && (
        <div className={`flex items-start gap-3 rounded-card p-5 text-encre ${avis.className}`}>
          <avis.icon aria-hidden className="mt-0.5 size-6 shrink-0" />
          <div>
            <p className="text-title font-bold">{avis.titre}</p>
            <p className="mt-1 text-body-m">{avis.texte}</p>
          </div>
        </div>
      )}
      {enAttente && (
        <p className="text-body-l text-texte2">
          Vérifiez chaque élément. S'il ne correspond pas à ce que vous constatez, contestez-le avec une photo.
        </p>
      )}

      {edl.pieces.map((piece) => (
        <section key={piece.id ?? piece.nom} aria-label={piece.nom}>
          <h2 className="mb-3 font-display text-h3 font-bold text-encre">{piece.nom}</h2>
          <ul className="divide-y divide-filet overflow-hidden rounded-card bg-white px-4 lg:px-6">
            {piece.elements.map((element) => (
              <ElementEtatDesLieux
                key={element.id ?? element.nom}
                element={element}
                peutContester={enAttente}
                contestationLocale={contestations.find((c) => c.elementId === element.id)}
                onContester={(contestation) => setContestations((liste) => [...liste, contestation])}
                onRetirer={() => setContestations((liste) => liste.filter((c) => c.elementId !== element.id))}
              />
            ))}
          </ul>
        </section>
      ))}

      {enAttente && (
        <div className="grid gap-4 rounded-card border border-filet bg-white p-5 shadow-float sm:grid-cols-[1fr_auto] sm:items-center lg:sticky lg:bottom-6 lg:z-10">
          {contestations.length > 0 ? (
            <>
              <div>
                <p className="text-title font-bold text-encre">
                  {contestations.length} contestation{contestations.length > 1 ? "s" : ""} à envoyer
                </p>
                <p className="text-body-m text-texte2">Votre propriétaire les examine avant toute signature.</p>
              </div>
              <Button variant="encre" onClick={envoyerContestations} disabled={contester.isPending}>
                {contester.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <MessageSquareWarning aria-hidden />}
                Envoyer mes contestations
              </Button>
            </>
          ) : (
            <>
              <div>
                <p className="text-title font-bold text-encre">Tout est conforme ?</p>
                <p className="text-body-m text-texte2">En signant, vous certifiez que ce document décrit fidèlement le logement.</p>
              </div>
              <Button onClick={signerDocument} disabled={signer.isPending}>
                {signer.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <FileSignature aria-hidden />}
                Signer l'état des lieux
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
