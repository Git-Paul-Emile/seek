import { useState } from "react";
import { Check, ClipboardCheck, Loader2, MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";
import type { MessageBailLocataire } from "@/api/locataireAuth";
import type { BailInvitation } from "@/api/bailInvitation";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/lib/fcfa";
import { formatDateLongue } from "@/lib/dates";
import { useMarquerMessagesBailLocataireLus } from "@/hooks/useBail";
import { useAccepterInvitation, useRefuserInvitation } from "@/hooks/useBailInvitation";
import { useDemanderEtatDesLieux } from "@/hooks/useLocataireEcheancier";

const VOYELLE_INITIALE = /^[aeiouyhàâéèêëîïôöûü]/i;
/** « d'Aminata », « de Moussa ». */
const de = (nom: string) => (VOYELLE_INITIALE.test(nom) ? `d'${nom}` : `de ${nom}`);

// Avis de l'accueil locataire : messages du propriétaire (planche 34), état des lieux
// à planifier et invitations à rejoindre un bail.

export function MessagesProprietaire({ messages, proprietaire }: { messages: MessageBailLocataire[]; proprietaire?: string }) {
  const marquerLus = useMarquerMessagesBailLocataireLus();
  if (messages.length === 0) return null;
  return (
    <section aria-label="Messages de votre propriétaire" className="space-y-3">
      {messages.map((message) => (
        <article key={message.id} className="flex items-start gap-4 rounded-card bg-soleil-100 p-5 text-encre">
          <MessageSquare aria-hidden className="mt-0.5 size-6 shrink-0" strokeWidth={1.75} />
          <div className="min-w-0 flex-1">
            <h2 className="text-title font-bold">
              {proprietaire ? `Message ${de(proprietaire)}, votre propriétaire` : message.titre}
            </h2>
            {proprietaire && <p className="mt-1 text-body-l font-semibold">{message.titre}</p>}
            <p className="mt-1 text-body-l">{message.corps}</p>
            <p className="mt-2 text-caption text-texte2">{formatDateLongue(message.createdAt)}</p>
          </div>
          <button
            type="button"
            onClick={() => marquerLus.mutate()}
            aria-label="Marquer comme lu"
            title="Marquer comme lu"
            className="-m-2 flex size-11 shrink-0 items-center justify-center rounded-control hover:bg-soleil/40"
          >
            <X aria-hidden className="size-5" />
          </button>
        </article>
      ))}
    </section>
  );
}

export function AlerteEtatDesLieux({ titreBien }: { titreBien: string }) {
  const demanderEdl = useDemanderEtatDesLieux();
  const demander = () =>
    demanderEdl.mutate(undefined, {
      onSuccess: (data) =>
        toast.success(data.sent ? "Demande envoyée à votre propriétaire" : "Une demande a déjà été envoyée récemment"),
      onError: () => toast.error("La demande n'a pas pu être envoyée. Réessayez."),
    });

  return (
    <section className="grid gap-4 rounded-card border border-filet bg-white p-5 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-baobab-100 text-baobab">
          <ClipboardCheck aria-hidden className="size-5" />
        </span>
        <div>
          <h2 className="text-title font-semibold text-encre">État des lieux d'entrée à planifier</h2>
          <p className="mt-1 text-body-m text-texte2">
            {titreBien} : demandez à votre propriétaire de lancer l'état des lieux d'entrée.
          </p>
        </div>
      </div>
      <Button variant="outline" onClick={demander} disabled={demanderEdl.isPending}>
        {demanderEdl.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden />}
        Demander l'état des lieux
      </Button>
    </section>
  );
}

export function InvitationsBail({ invitations }: { invitations: BailInvitation[] }) {
  const accepter = useAccepterInvitation();
  const refuser = useRefuserInvitation();
  const [enCours, setEnCours] = useState<string | null>(null);

  if (invitations.length === 0) return null;

  const traiter = async (invitation: BailInvitation, action: "accepter" | "refuser") => {
    setEnCours(invitation.token);
    try {
      if (action === "accepter") {
        await accepter.mutateAsync(invitation.token);
        toast.success("Invitation acceptée : votre bail est créé.");
      } else {
        await refuser.mutateAsync(invitation.token);
        toast.success("Invitation refusée");
      }
    } catch {
      toast.error("L'invitation n'a pas pu être traitée. Réessayez.");
    } finally {
      setEnCours(null);
    }
  };

  return (
    <section aria-labelledby="titre-invitations" className="space-y-3">
      <h2 id="titre-invitations" className="font-display text-h3 font-bold text-encre">
        Invitation{invitations.length > 1 ? "s" : ""} à rejoindre un bail
      </h2>
      {invitations.map((invitation) => {
        const { bien, proprietaire } = invitation;
        const titre = bien?.titre || bien?.adresse || bien?.ville || "Logement";
        const occupe = enCours === invitation.token;
        return (
          <article key={invitation.id} className="rounded-card bg-white p-5">
            <h3 className="text-title font-semibold text-encre">{titre}</h3>
            <p className="mt-1 text-body-m text-texte2">
              {[bien?.quartier, bien?.ville].filter(Boolean).join(", ")}
              {proprietaire ? ` · Propriétaire : ${proprietaire.prenom} ${proprietaire.nom}` : ""}
            </p>
            <p className="mt-2 text-body-m text-encre">
              Loyer {formatFcfa(invitation.montantLoyer)}
              {invitation.montantCaution ? ` · Caution ${formatFcfa(invitation.montantCaution)}` : ""} · Début le{" "}
              {formatDateLongue(invitation.dateDebutBail)}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button onClick={() => traiter(invitation, "accepter")} disabled={occupe}>
                {occupe ? <Loader2 aria-hidden className="animate-spin" /> : <Check aria-hidden />}
                Accepter
              </Button>
              <Button variant="outline" onClick={() => traiter(invitation, "refuser")} disabled={occupe}>
                <X aria-hidden />
                Refuser
              </Button>
            </div>
          </article>
        );
      })}
    </section>
  );
}
