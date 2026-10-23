import { Mail, MessageCircle, Phone } from "lucide-react";
import type { Bien } from "@/api/bien";
import { Button } from "@/components/ui/button";
import type { useAnnonceContact } from "@/hooks/useAnnonceContact";
import { formatFcfa, libelleFrequence } from "@/lib/fcfa";

// « Pour agir » (maquette « Fiche annonce ») : barre fixe sur mobile avec le prix rappelé,
// message et appel ; carte collante à droite sur desktop.

type Contact = ReturnType<typeof useAnnonceContact>;

const sousTitrePrix = (bien: Bien) => {
  const frequence = libelleFrequence(bien.frequencePaiement);
  const parties = [frequence ? `par ${frequence}` : null, bien.chargesIncluses ? "charges incluses" : null].filter(Boolean);
  return parties.join(", ");
};

export function ContactBar({ bien, contact }: { bien: Bien; contact: Contact }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-filet bg-white px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 lg:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          {bien.prix !== null && <p className="tabular truncate text-price font-extrabold text-encre">{formatFcfa(bien.prix)}</p>}
          <p className="truncate text-body-m text-texte2">{sousTitrePrix(bien)}</p>
        </div>
        {contact.whatsappHref && (
          <Button asChild variant="outline" size="icon" className="size-14">
            <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="Envoyer un message WhatsApp au propriétaire">
              <MessageCircle aria-hidden className="!size-6" />
            </a>
          </Button>
        )}
        {contact.appelHref && (
          <Button asChild size="lg" className="h-14 px-6">
            <a href={contact.appelHref}>
              <Phone aria-hidden />
              Appeler
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

export function ContactCard({ bien, contact }: { bien: Bien; contact: Contact }) {
  return (
    <div className="rounded-sheet border border-filet bg-white p-6 shadow-card">
      {bien.prix !== null && <p className="tabular text-h2 font-bold text-encre">{formatFcfa(bien.prix)}</p>}
      <p className="text-body-m text-texte2">{sousTitrePrix(bien)}</p>
      <div className="mt-6 space-y-3">
        {contact.appelHref && (
          <Button asChild size="lg" className="w-full">
            <a href={contact.appelHref}>
              <Phone aria-hidden />
              Appeler le propriétaire
            </a>
          </Button>
        )}
        {contact.whatsappHref && (
          <Button asChild variant="outline" size="lg" className="w-full">
            <a href={contact.whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle aria-hidden />
              Demander une visite sur WhatsApp
            </a>
          </Button>
        )}
        {contact.emailHref && (
          <Button asChild variant="link" className="w-full">
            <a href={contact.emailHref}>
              <Mail aria-hidden />
              Écrire un e-mail
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
