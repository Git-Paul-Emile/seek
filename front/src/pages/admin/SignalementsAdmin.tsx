import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";
import { fetchSignalementsAdmin, validerSignalement, rejeterSignalement, type Signalement, type StatutSignalement } from "@/api/signalement";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  EnTeteAdmin,
  FiltresStatut,
  LigneChargement,
  LigneMessage,
  RechercheAdmin,
  Tableau,
  Td,
  TeteTableau,
  Th,
  Tr,
  type FiltreOption,
} from "@/components/admin/table/Tableau";

// Signalements d'annonces (Modération · Signalements) : puces de statut et recherche,
// tableau de la planche 25, détail et décision en fenêtre.

const NB_COLONNES = 4;
const DELAI_RECHERCHE_MS = 300;
const SEUIL_SUSPENSION = 3;

const MOTIFS_LABELS: Record<string, string> = {
  ARNAQUE: "Arnaque ou fraude",
  FAUSSES_INFOS: "Fausses informations",
  INDISPONIBLE: "Annonce indisponible",
  DOUBLON: "Annonce en doublon",
  INAPPROPRIE: "Contenu inapproprié",
  AUTRE: "Autre",
};

const FILTRES: FiltreOption<StatutSignalement>[] = [
  { valeur: "EN_ATTENTE", label: "En attente" },
  { valeur: "VALIDE", label: "Validés" },
  { valeur: "REJETE", label: "Classés sans suite" },
];

const motif = (signalement: Signalement) => MOTIFS_LABELS[signalement.motif] ?? signalement.motif;

function Bloc({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-overline font-semibold uppercase text-texte2">{titre}</h3>
      <div className="space-y-2 rounded-card bg-surface p-4 text-body-m text-encre">{children}</div>
    </section>
  );
}

function DetailSignalement({
  signalement,
  enAttente,
  onValider,
  onRejeter,
  onClose,
}: {
  signalement: Signalement;
  enAttente: boolean;
  onValider: () => void;
  onRejeter: () => void;
  onClose: () => void;
}) {
  const proprietaire = signalement.bien?.proprietaire;
  return (
    <SheetDialog open onOpenChange={(open) => !open && onClose()} title="Signalement">
      <div className="space-y-5">
        <Bloc titre="Motif">
          <StatusBadge tone="alerte">{motif(signalement)}</StatusBadge>
          <p className="whitespace-pre-wrap">{signalement.commentaire || "Aucun commentaire laissé."}</p>
          <p className="text-texte2">Envoyé le {format(new Date(signalement.createdAt), "dd/MM/yyyy · HH:mm")}</p>
        </Bloc>
        <Bloc titre="Auteur du signalement">
          <p className="font-semibold">{signalement.nom}</p>
          <p className="tabular-nums text-texte2">{signalement.telephone}</p>
        </Bloc>
        {signalement.bien && (
          <Bloc titre="Annonce concernée">
            <p className="font-semibold">{signalement.bien.titre}</p>
            <Link to={`/admin/annonces/${signalement.bien.id}`} className="font-semibold text-baobab hover:underline">
              Voir la fiche de l'annonce
            </Link>
            {proprietaire && (
              <div className="border-t border-filet pt-3">
                <p className="font-semibold">
                  {proprietaire.prenom} {proprietaire.nom}
                </p>
                <p className="tabular-nums text-texte2">{proprietaire.telephone}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge tone={proprietaire.nbSignalementsValides >= SEUIL_SUSPENSION ? "arret" : "attente"} size="sm">
                    {proprietaire.nbSignalementsValides} avertissement{proprietaire.nbSignalementsValides > 1 ? "s" : ""} sur {SEUIL_SUSPENSION}
                  </StatusBadge>
                  {proprietaire.estSuspendu && (
                    <StatusBadge tone="arret" size="sm">
                      Suspendu
                    </StatusBadge>
                  )}
                </div>
              </div>
            )}
          </Bloc>
        )}
        {enAttente ? (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={onRejeter}>
              Classer sans suite
            </Button>
            <Button onClick={onValider}>Valider</Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={onClose}>
            Fermer
          </Button>
        )}
      </div>
    </SheetDialog>
  );
}

export default function SignalementsAdmin() {
  const queryClient = useQueryClient();
  const [statut, setStatut] = useState<StatutSignalement>("EN_ATTENTE");
  const [recherche, setRecherche] = useState("");
  const [rechercheEnvoyee, setRechercheEnvoyee] = useState("");
  const [ouvert, setOuvert] = useState<Signalement | null>(null);
  const [aConfirmer, setAConfirmer] = useState<"valider" | "rejeter" | null>(null);

  useEffect(() => {
    const minuteur = setTimeout(() => setRechercheEnvoyee(recherche.trim()), DELAI_RECHERCHE_MS);
    return () => clearTimeout(minuteur);
  }, [recherche]);

  const { data: signalements = [], isLoading } = useQuery({
    queryKey: ["admin-signalements", statut, rechercheEnvoyee],
    queryFn: () => fetchSignalementsAdmin({ statut, search: rechercheEnvoyee }),
  });

  const terminer = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: ["admin-signalements"] });
    setAConfirmer(null);
    setOuvert(null);
  };

  const validation = useMutation({
    mutationFn: validerSignalement,
    onSuccess: () => terminer("Signalement validé. Le propriétaire a reçu un avertissement."),
    onError: () => toast.error("La validation n'a pas pu être enregistrée. Réessayez."),
  });

  const rejet = useMutation({
    mutationFn: rejeterSignalement,
    onSuccess: () => terminer("Signalement classé sans suite."),
    onError: () => toast.error("Le classement n'a pas pu être enregistré. Réessayez."),
  });

  const enAttente = statut === "EN_ATTENTE";

  return (
    <div>
      <EnTeteAdmin
        titre="Signalements"
        description="Les annonces signalées par les visiteurs. Validez un signalement fondé, classez les autres sans suite."
        actions={<RechercheAdmin label="Rechercher un signalement" placeholder="Téléphone, nom, commentaire" value={recherche} onChange={setRecherche} />}
      />

      <div className="mb-4">
        <FiltresStatut<StatutSignalement> label="Filtrer par statut" options={FILTRES} valeur={statut} onChange={setStatut} />
      </div>

      <Tableau label="Signalements">
        <TeteTableau>
          <Th>Annonce</Th>
          <Th>Auteur</Th>
          <Th>Motif</Th>
          <Th>Reçu</Th>
        </TeteTableau>
        <tbody>
          {isLoading ? (
            <LigneChargement colonnes={NB_COLONNES} label="Chargement des signalements" />
          ) : signalements.length === 0 ? (
            <LigneMessage colonnes={NB_COLONNES}>{enAttente ? "Aucun signalement en attente. Tout est à jour." : "Aucun signalement pour ce filtre."}</LigneMessage>
          ) : (
            signalements.map((signalement) => {
              const proprietaire = signalement.bien?.proprietaire;
              return (
                <Tr key={signalement.id} selectionne={ouvert?.id === signalement.id} onClick={() => setOuvert(signalement)}>
                  <Td className="max-w-[280px]">
                    <span className="block truncate font-semibold text-encre">{signalement.bien?.titre || "Annonce supprimée"}</span>
                    {proprietaire && (
                      <span className="block truncate text-texte2">
                        {proprietaire.prenom} {proprietaire.nom} · {proprietaire.nbSignalementsValides} avertissement{proprietaire.nbSignalementsValides > 1 ? "s" : ""}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <span className="block">{signalement.nom}</span>
                    <span className="block tabular-nums text-texte2">{signalement.telephone}</span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-2">
                      <StatusBadge tone="alerte">{motif(signalement)}</StatusBadge>
                      {signalement.commentaire && <MessageSquare aria-label="Avec un commentaire" className="size-4 shrink-0 text-texte2" />}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums text-texte2">{format(new Date(signalement.createdAt), "dd/MM · HH:mm")}</Td>
                </Tr>
              );
            })
          )}
        </tbody>
      </Tableau>

      {ouvert && !aConfirmer && (
        <DetailSignalement
          signalement={ouvert}
          enAttente={enAttente}
          onValider={() => setAConfirmer("valider")}
          onRejeter={() => setAConfirmer("rejeter")}
          onClose={() => setOuvert(null)}
        />
      )}

      <ConfirmModal
        open={aConfirmer === "valider"}
        title="Valider ce signalement ?"
        message={
          <div className="space-y-3">
            <p>Valider ce signalement entraîne :</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>le retrait immédiat de l'annonce ;</li>
              <li>un avertissement par SMS au propriétaire ;</li>
              <li>un avertissement de plus sur son compte, et sa suspension automatique au troisième ;</li>
              <li>un SMS de remerciement à l'auteur du signalement.</li>
            </ul>
          </div>
        }
        confirmLabel="Valider et avertir"
        isPending={validation.isPending}
        onConfirm={() => ouvert && validation.mutate(ouvert.id)}
        onCancel={() => setAConfirmer(null)}
      />
      <ConfirmModal
        open={aConfirmer === "rejeter"}
        title="Classer sans suite ?"
        message="Aucune mesure ne sera prise contre l'annonce ni contre le propriétaire."
        confirmLabel="Classer sans suite"
        variant="warning"
        isPending={rejet.isPending}
        onConfirm={() => ouvert && rejet.mutate(ouvert.id)}
        onCancel={() => setAConfirmer(null)}
      />
    </div>
  );
}
