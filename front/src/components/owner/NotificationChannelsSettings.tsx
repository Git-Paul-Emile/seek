import { useEffect, useState } from "react";
import { Loader2, Mail, MessageCircle, MessageSquare, Smartphone, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useCanauxNotification, useUpdateCanauxNotification } from "@/hooks/useNotificationPreferences";
import type { CanalNotification } from "@/api/notificationPreferences";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { messageErreurApi } from "@/lib/erreurApi";
import { formatFcfa } from "@/lib/fcfa";
import { cn } from "@/lib/utils";

// Canaux de notification du propriétaire (carte du profil) : le SMS est gratuit, plusieurs
// canaux à la fois demandent un paiement unique, réglé dans une fenêtre de la charte.

const CANAL_INFO: Record<CanalNotification, { label: string; icon: LucideIcon }> = {
  SMS: { label: "SMS", icon: MessageSquare },
  EMAIL: { label: "E-mail", icon: Mail },
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle },
};

export default function NotificationChannelsSettings() {
  const { data, isLoading } = useCanauxNotification();
  const updateMutation = useUpdateCanauxNotification();

  const [selection, setSelection] = useState<CanalNotification[]>(["SMS"]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPaiement, setSelectedPaiement] = useState<string | null>(null);

  useEffect(() => {
    if (data?.canaux) setSelection(data.canaux);
  }, [data?.canaux]);

  const toggleCanal = (canal: CanalNotification) => {
    setSelection((prev) => (prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal]));
  };

  const hasChanged = data ? JSON.stringify([...selection].sort()) !== JSON.stringify([...data.canaux].sort()) : false;
  const needsPayment = selection.length > 1 && !data?.canauxPayes;
  const frais = formatFcfa(data?.fraisCanauxSupplementaires ?? 0);

  const handleSave = () => {
    if (selection.length === 0) {
      toast.error("Choisissez au moins un canal de notification.");
      return;
    }
    if (needsPayment) {
      setModalOpen(true);
      return;
    }
    updateMutation.mutate(
      { canaux: selection },
      {
        onSuccess: () => toast.success("Canaux de notification enregistrés"),
        onError: (error) => toast.error(messageErreurApi(error, "Les canaux n'ont pas pu être enregistrés. Réessayez.")),
      },
    );
  };

  const handlePayerEtEnregistrer = () => {
    if (!selectedPaiement) return;
    updateMutation.mutate(
      { canaux: selection, modePaiement: selectedPaiement },
      {
        onSuccess: () => {
          toast.success("Paiement effectué, canaux de notification enregistrés");
          setModalOpen(false);
          setSelectedPaiement(null);
        },
        onError: (error) => toast.error(messageErreurApi(error, "Le paiement n'a pas abouti. Vérifiez votre solde Mobile Money puis réessayez.")),
      },
    );
  };

  return (
    <section aria-labelledby="titre-canaux" className="rounded-card bg-white p-5 lg:p-6">
      <h2 id="titre-canaux" className="mb-4 font-display text-h3 font-bold text-encre">
        Canaux de notification
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-1/2 animate-pulse rounded bg-filet" />
          <div className="h-10 animate-pulse rounded-control bg-surface" />
        </div>
      ) : (
        <>
          <p className="text-body-m text-texte2">
            Choisissez comment recevoir vos notifications. Le SMS est gratuit. Plusieurs canaux à la fois demandent un paiement unique de{" "}
            <strong className="text-encre">{frais}</strong>.
          </p>

          <div role="group" aria-label="Canaux de notification" className="mt-4 flex flex-wrap gap-2">
            {(data?.canauxDisponibles ?? ["SMS", "EMAIL", "WHATSAPP"]).map((canal) => {
              const { label, icon: Icon } = CANAL_INFO[canal];
              return (
                <Chip key={canal} selected={selection.includes(canal)} onClick={() => toggleCanal(canal)} icon={<Icon aria-hidden className="size-4" />}>
                  {label}
                </Chip>
              );
            })}
          </div>

          {needsPayment && (
            <p className="mt-4 rounded-control bg-soleil-100 p-4 text-body-m text-encre">
              Vous avez choisi plusieurs canaux : un paiement unique de {frais} débloque définitivement cette option.
            </p>
          )}

          <div className="mt-5 grid sm:justify-end">
            <Button type="button" onClick={handleSave} disabled={!hasChanged || updateMutation.isPending}>
              {updateMutation.isPending && !modalOpen && <Loader2 aria-hidden className="animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </>
      )}

      <SheetDialog
        open={modalOpen}
        onOpenChange={(open) => !open && !updateMutation.isPending && setModalOpen(false)}
        title="Débloquer plusieurs canaux"
        description={`Paiement unique de ${frais} pour recevoir vos notifications sur plusieurs canaux.`}
      >
        <fieldset className="space-y-3">
          <legend className="mb-3 text-body-m font-semibold text-encre">Choisissez un moyen de paiement</legend>
          {(data?.moyensPaiement ?? []).map((moyen) => {
            const choisi = selectedPaiement === moyen.id;
            return (
              <label
                key={moyen.id}
                className={cn(
                  "grid cursor-pointer grid-cols-[auto_auto_1fr] items-center gap-3 rounded-card border px-4 py-3 transition-colors duration-hover",
                  choisi ? "border-2 border-baobab bg-baobab-100 px-[15px] py-[11px]" : "border-filet bg-white hover:bg-surface",
                )}
              >
                <input type="radio" name="moyen-paiement-canaux" checked={choisi} onChange={() => setSelectedPaiement(moyen.id)} className="size-5 accent-baobab" />
                <Smartphone aria-hidden className="size-6 text-encre" strokeWidth={1.75} />
                <span className="min-w-0">
                  <span className="block text-body-l font-semibold text-encre">{moyen.nom}</span>
                  <span className="block text-body-m text-texte2">{moyen.description}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={() => setModalOpen(false)} disabled={updateMutation.isPending}>
            Annuler
          </Button>
          <Button variant="soleil" onClick={handlePayerEtEnregistrer} disabled={!selectedPaiement || updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 aria-hidden className="animate-spin" />}
            Payer et enregistrer
          </Button>
        </div>
      </SheetDialog>
    </section>
  );
}
