import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Trash2 } from "lucide-react";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useAlerteEdlManquant, useLocataireEcheancier, useLocataireHistorique } from "@/hooks/useLocataireEcheancier";
import { useMessagesBailLocataire } from "@/hooks/useBail";
import { useLocataireInvitations } from "@/hooks/useBailInvitation";
import { useContratLocataire } from "@/hooks/useContratLocataire";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/brand/EmptyState";
import LocatairePayModal from "@/components/locataire/LocatairePayModal";
import { useLocataireNavigation } from "@/components/locataire/useLocataireNavigation";
import { useQuittancesTelechargement } from "@/components/locataire/useQuittancesTelechargement";
import { CarteLogement } from "@/components/locataire/accueil/CarteLogement";
import { BlocProchainLoyer } from "@/components/locataire/accueil/BlocProchainLoyer";
import { DerniersPaiements } from "@/components/locataire/accueil/DerniersPaiements";
import { MonBail } from "@/components/locataire/accueil/MonBail";
import { AlerteEtatDesLieux, InvitationsBail, MessagesProprietaire } from "@/components/locataire/accueil/AvisLocataire";
import { ContratDialog, PreavisDialog, ResilierDialog, SupprimerCompteDialog } from "@/components/locataire/accueil/BailDialogs";

// Accueil locataire (charte, planche 34) : rassurant, le logement dans l'arche
// et le prochain loyer en grand, puis les preuves (bail, paiements, quittances).

type Fenetre = "paiement" | "contrat" | "preavis" | "resilier" | "supprimer" | null;

const STATUTS_BAIL_EN_COURS = ["ACTIF", "EN_PREAVIS"];
// Les messages de paiement en espèces ont leur propre suivi dans Paiements.
const TYPE_MESSAGE_ESPECES = "PAIEMENT_ESPECES";

function EnTete({ prenom }: { prenom: string }) {
  const { nbNonLues } = useLocataireNavigation();
  return (
    <header className="grid grid-cols-[1fr_auto] items-center gap-4">
      <div>
        <p className="text-body-l text-texte2">Bonjour,</p>
        <h1 className="font-display text-h1 font-bold text-encre">{prenom}</h1>
      </div>
      <Link
        to="/locataire/notifications"
        aria-label={nbNonLues ? `Notifications, ${nbNonLues} non lues` : "Notifications"}
        className="relative flex size-14 items-center justify-center rounded-full bg-white text-encre shadow-card lg:hidden"
      >
        <Bell aria-hidden className="size-6" strokeWidth={1.75} />
        {nbNonLues > 0 && <span aria-hidden className="absolute right-3 top-3 size-3 rounded-full bg-soleil" />}
      </Link>
    </header>
  );
}

export default function LocataireDashboard() {
  const { locataire } = useLocataireAuth();
  const bail = locataire?.bails?.find((b) => STATUTS_BAIL_EN_COURS.includes(b.statut));
  const aUnBail = Boolean(bail);

  const [fenetre, setFenetre] = useState<Fenetre>(null);
  const ouvrir = (nom: Fenetre) => () => setFenetre(nom);
  const surChangement = (nom: Fenetre) => (open: boolean) => setFenetre(open ? nom : null);

  const { data: echeancier = [] } = useLocataireEcheancier(aUnBail);
  const { data: alerteEdl } = useAlerteEdlManquant(aUnBail);
  const { data: historique = [] } = useLocataireHistorique();
  const { data: messages = [] } = useMessagesBailLocataire();
  const { data: invitations = [] } = useLocataireInvitations();
  const { data: contrat, isLoading: contratEnChargement } = useContratLocataire(aUnBail);
  const quittances = useQuittancesTelechargement();

  if (!locataire) return null;

  const messagesNonLus = messages.filter((message) => !message.lu && message.type !== TYPE_MESSAGE_ESPECES);
  const proprietaire = quittances.proprietaire
    ? `${quittances.proprietaire.prenom} ${quittances.proprietaire.nom}`
    : undefined;

  return (
    <div className="space-y-6 lg:space-y-8">
      <EnTete prenom={locataire.prenom} />
      <InvitationsBail invitations={invitations} />

      {bail ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
          <div className="space-y-6 lg:space-y-8">
            <CarteLogement bail={bail} />
            <BlocProchainLoyer
              echeancier={echeancier}
              quittanceDisponible={quittances.disponible}
              peutDeclarer={bail.statut === "ACTIF"}
              onPayer={ouvrir("paiement")}
            />
            <MessagesProprietaire messages={messagesNonLus} proprietaire={proprietaire} />
            {alerteEdl && (
              <AlerteEtatDesLieux
                titreBien={alerteEdl.bien.titre || alerteEdl.bien.region || alerteEdl.bien.ville || "Votre logement"}
              />
            )}
            <DerniersPaiements
              echeancier={echeancier}
              quittanceDisponible={quittances.disponible}
              onTelecharger={quittances.telecharger}
            />
          </div>
          <div className="space-y-6 lg:space-y-8">
            <MonBail
              bail={bail}
              contrat={contrat}
              onVoirContrat={ouvrir("contrat")}
              onPreavis={ouvrir("preavis")}
              onResilier={ouvrir("resilier")}
            />
          </div>
        </div>
      ) : (
        <section className="rounded-sheet bg-white px-6">
          <EmptyState
            titre="Aucun bail en cours"
            texte={
              historique.length > 0
                ? "Votre dernier bail est terminé. Votre compte reste actif et vos anciens logements restent consultables."
                : "Votre propriétaire n'a pas encore associé de logement à votre compte. Il vous enverra une invitation."
            }
            action={
              historique.length > 0 ? (
                <Button asChild variant="outline">
                  <Link to="/locataire/historique">Voir mes anciens logements</Link>
                </Button>
              ) : undefined
            }
          />
          <div className="grid gap-4 border-t border-filet py-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <p className="text-body-m text-texte2">
              Vous pouvez supprimer votre compte tant qu'aucun bail n'est en cours et qu'aucun paiement n'est en attente.
            </p>
            <Button variant="ghost" onClick={ouvrir("supprimer")}>
              <Trash2 aria-hidden />
              Supprimer mon compte
            </Button>
          </div>
        </section>
      )}

      {fenetre === "paiement" && <LocatairePayModal echeancier={echeancier} onClose={() => setFenetre(null)} />}
      <ContratDialog
        open={fenetre === "contrat"}
        onOpenChange={surChangement("contrat")}
        contrat={contrat}
        isLoading={contratEnChargement}
      />
      <PreavisDialog open={fenetre === "preavis"} onOpenChange={surChangement("preavis")} dateFinBail={bail?.dateFinBail} />
      <ResilierDialog open={fenetre === "resilier"} onOpenChange={surChangement("resilier")} />
      <SupprimerCompteDialog open={fenetre === "supprimer"} onOpenChange={surChangement("supprimer")} />
    </div>
  );
}
