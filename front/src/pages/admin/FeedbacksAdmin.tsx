import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, Smile, ThumbsUp, Trash2 } from "lucide-react";
import { fetchFeedbacksAdmin, deleteFeedback, markFeedbacksRead, type Feedback } from "@/api/feedback";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/brand/EmptyState";
import { KpiCard } from "@/components/owner/dashboard/KpiCard";
import { BlocChargement, CarteAdmin, EnTeteAdmin } from "@/components/admin/table/Tableau";

// Avis envoyés depuis le widget du site public : chiffres clés (planche 24), puis un avis
// par ligne avec ses deux notes et ses deux réponses libres.

const NOTE_MAX = 5;
const QK = ["feedbacks-admin"];

const LIBELLE_EXPERIENCE: Record<number, string> = {
  1: "Très mauvaise",
  2: "Mauvaise",
  3: "Moyenne",
  4: "Bonne",
  5: "Excellente",
};

const moyenne = (valeur: number | null | undefined) => (valeur ? `${valeur.toFixed(1).replace(".", ",")} / ${NOTE_MAX}` : "Pas encore de note");

/** Note sur 5 : cinq pastilles, les premières en Baobab. Le chiffre est écrit pour les lecteurs d'écran. */
function Note({ libelle, valeur, texte }: { libelle: string; valeur: number | null; texte?: string }) {
  return (
    <div>
      <p className="text-overline font-semibold uppercase text-texte2">{libelle}</p>
      {valeur ? (
        <p className="mt-1 flex items-center gap-2">
          <span aria-hidden className="flex gap-1">
            {Array.from({ length: NOTE_MAX }, (_, index) => (
              <span key={index} className={index < valeur ? "size-3 rounded-full bg-baobab" : "size-3 rounded-full bg-filet"} />
            ))}
          </span>
          <span className="text-body-m font-semibold text-encre">
            {valeur} / {NOTE_MAX}
            {texte ? ` · ${texte}` : ""}
          </span>
        </p>
      ) : (
        <p className="mt-1 text-body-m text-texte2">Sans réponse</p>
      )}
    </div>
  );
}

function Reponse({ libelle, texte }: { libelle: string; texte: string }) {
  return (
    <div>
      <p className="text-overline font-semibold uppercase text-texte2">{libelle}</p>
      <p className="mt-1 text-body-l text-encre">{texte}</p>
    </div>
  );
}

export default function FeedbacksAdmin() {
  const queryClient = useQueryClient();
  const [aSupprimer, setASupprimer] = useState<Feedback | null>(null);
  const { data, isLoading } = useQuery({ queryKey: QK, queryFn: fetchFeedbacksAdmin });

  // Ouvrir la page vaut lecture : le compteur de la barre latérale se remet à zéro.
  useEffect(() => {
    markFeedbacksRead()
      .then(() => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }))
      .catch(() => undefined);
  }, [queryClient]);

  const suppression = useMutation({
    mutationFn: deleteFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK });
      toast.success("Avis supprimé");
    },
    onError: () => toast.error("L'avis n'a pas pu être supprimé. Réessayez."),
    onSettled: () => setASupprimer(null),
  });

  const feedbacks: Feedback[] = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <EnTeteAdmin titre="Avis des utilisateurs" description="Les retours envoyés depuis le bouton « Votre avis » du site public." />

      {meta && (
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard icon={MessageSquare} label="Avis reçus" value={meta.total} />
          <KpiCard icon={Smile} label="Expérience moyenne" value={moyenne(meta.avgExperience)} />
          <KpiCard icon={ThumbsUp} label="Facilité moyenne" value={moyenne(meta.avgFacilite)} />
        </div>
      )}

      {isLoading ? (
        <BlocChargement label="Chargement des avis" />
      ) : feedbacks.length === 0 ? (
        <CarteAdmin>
          <EmptyState titre="Aucun avis pour l'instant" texte="Les avis envoyés par les visiteurs apparaîtront ici." illustration="studio" />
        </CarteAdmin>
      ) : (
        <ul className="divide-y divide-filet rounded-card border border-filet bg-white">
          {feedbacks.map((feedback) => {
            const vide = !feedback.apprecie && !feedback.frustration && !feedback.experience && !feedback.facilite;
            return (
              <li key={feedback.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:p-6">
                <div className="min-w-0 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Note libelle="Expérience" valeur={feedback.experience} texte={feedback.experience ? LIBELLE_EXPERIENCE[feedback.experience] : undefined} />
                    <Note libelle="Facilité d'utilisation" valeur={feedback.facilite} />
                  </div>
                  {feedback.apprecie && <Reponse libelle="Ce qui plaît" texte={feedback.apprecie} />}
                  {feedback.frustration && <Reponse libelle="Ce qui bloque" texte={feedback.frustration} />}
                  {vide && <p className="text-body-m text-texte2">Avis envoyé sans réponse.</p>}
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
                  <span className="whitespace-nowrap text-body-m tabular-nums text-texte2">{format(new Date(feedback.createdAt), "dd/MM/yyyy · HH:mm")}</span>
                  <Button size="icon-sm" variant="outline" aria-label="Supprimer cet avis" onClick={() => setASupprimer(feedback)}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(aSupprimer)}
        title="Supprimer cet avis ?"
        message="L'avis sera supprimé définitivement et ne comptera plus dans les moyennes."
        confirmLabel="Supprimer"
        isPending={suppression.isPending}
        onConfirm={() => aSupprimer && suppression.mutate(aSupprimer.id)}
        onCancel={() => setASupprimer(null)}
      />
    </div>
  );
}
