import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChevronRight } from "lucide-react";
import { usePendingVerifications, useApproveVerification, useRejectVerification } from "@/hooks/useAdminVerification";
import { useIsLargeDesktop } from "@/hooks/useIsDesktop";
import type { PendingVerification } from "@/api/ownerAuth";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PanneauVerification } from "@/components/admin/verifications/PanneauVerification";
import { EnTeteAdmin, Initiales, LigneChargement, LigneMessage, Tableau, Td, TeteTableau, Th, Tr } from "@/components/admin/table/Tableau";

// Vérifications d'identité des propriétaires : file de décision au modèle de la planche 41,
// tableau à gauche, panneau de décision à droite dès 1 280 px, tiroir en dessous.

const NB_COLONNES = 4;
const VIDE = "Aucune demande en attente. Toutes les vérifications sont traitées.";

const piece = (verification: PendingVerification) => (verification.verification?.typePiece === "CNI" ? "Carte d'identité" : "Passeport");
const dateSoumission = (valeur: string) => format(new Date(valeur), "dd/MM · HH:mm");

export default function AdminVerificationsPage() {
  const { data: verifications = [], isLoading } = usePendingVerifications();
  const approuver = useApproveVerification();
  const rejeter = useRejectVerification();
  const panneauLateral = useIsLargeDesktop();
  const [ouverte, setOuverte] = useState<PendingVerification | null>(null);
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);

  const valider = () => {
    if (!ouverte) return;
    approuver.mutate(ouverte.id, {
      onSuccess: () => {
        toast.success("Identité du propriétaire validée");
        setOuverte(null);
      },
      onError: () => toast.error("La validation n'a pas pu être enregistrée. Réessayez."),
    });
  };

  const refuser = (motif: string) => {
    if (!ouverte) return;
    rejeter.mutate(
      { proprietaireId: ouverte.id, motif },
      {
        onSuccess: () => {
          toast.success("Demande rejetée");
          setOuverte(null);
        },
        onError: () => toast.error("Le rejet n'a pas pu être enregistré. Réessayez."),
      },
    );
  };

  const panneau = ouverte && (
    <PanneauVerification
      key={ouverte.id}
      verification={ouverte}
      validationEnCours={approuver.isPending}
      rejetEnCours={rejeter.isPending}
      onValider={valider}
      onRejeter={refuser}
      onAgrandir={setImage}
    />
  );

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
      <div className="min-w-0">
        <EnTeteAdmin
          titre="Vérifications d'identité"
          description={isLoading ? "Chargement de la file…" : `${verifications.length} demande${verifications.length > 1 ? "s" : ""} en attente`}
        />

        <Tableau label="Demandes de vérification" className="hidden lg:block">
          <TeteTableau>
            <Th>Propriétaire</Th>
            <Th>Pièce</Th>
            <Th>Soumise</Th>
            <Th>Statut</Th>
          </TeteTableau>
          <tbody>
            {isLoading ? (
              <LigneChargement colonnes={NB_COLONNES} label="Chargement des demandes" />
            ) : verifications.length === 0 ? (
              <LigneMessage colonnes={NB_COLONNES}>{VIDE}</LigneMessage>
            ) : (
              verifications.map((verification) => (
                <Tr key={verification.id} selectionne={ouverte?.id === verification.id} onClick={() => setOuverte(verification)}>
                  <Td>
                    <span className="flex items-center gap-3">
                      <Initiales prenom={verification.prenom} nom={verification.nom} />
                      <span className="min-w-0">
                        <span className="block font-semibold text-encre">
                          {verification.prenom} {verification.nom}
                        </span>
                        <span className="block tabular-nums text-texte2">{verification.telephone}</span>
                      </span>
                    </span>
                  </Td>
                  <Td>{piece(verification)}</Td>
                  <Td className="whitespace-nowrap tabular-nums text-texte2">{dateSoumission(verification.createdAt)}</Td>
                  <Td>
                    <StatusBadge tone="attente">À vérifier</StatusBadge>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Tableau>

        <ul className="divide-y divide-filet rounded-card bg-white px-4 lg:hidden">
          {isLoading ? (
            <li className="py-10 text-center text-body-m text-texte2">Chargement de la file…</li>
          ) : verifications.length === 0 ? (
            <li className="py-10 text-center text-body-m text-texte2">{VIDE}</li>
          ) : (
            verifications.map((verification) => (
              <li key={verification.id}>
                <button type="button" onClick={() => setOuverte(verification)} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 py-4 text-left">
                  <Initiales prenom={verification.prenom} nom={verification.nom} />
                  <span className="min-w-0">
                    <span className="block truncate text-title font-semibold text-encre">
                      {verification.prenom} {verification.nom}
                    </span>
                    <span className="block truncate text-body-m text-texte2">
                      {piece(verification)} · {dateSoumission(verification.createdAt)}
                    </span>
                  </span>
                  <ChevronRight aria-hidden className="size-5 text-texte2" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {panneauLateral ? (
        <aside aria-label="Décision">
          <div className="sticky top-8 max-h-[calc(100vh-64px)] overflow-y-auto rounded-card border border-filet bg-white p-6">
            {panneau || <p className="py-16 text-center text-body-m text-texte2">Choisissez une demande dans la liste pour l'examiner.</p>}
          </div>
        </aside>
      ) : null}

      <SheetDialog open={Boolean(ouverte) && !panneauLateral} onOpenChange={(open) => !open && setOuverte(null)} title="Décision" className="sm:max-w-xl">
        {panneau}
      </SheetDialog>

      <SheetDialog open={Boolean(image)} onOpenChange={(open) => !open && setImage(null)} title={image?.alt ?? "Pièce"} className="sm:max-w-3xl">
        {image && <img src={image.src} alt={image.alt} className="max-h-[70vh] w-full rounded-control object-contain" />}
      </SheetDialog>
    </div>
  );
}
