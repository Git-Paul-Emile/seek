import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ChevronLeft, Loader2, Lock, PlusCircle, Send, Trash2, TriangleAlert } from "lucide-react";
import {
  createEtatDesLieux,
  updateEtatDesLieux,
  getEtatDesLieuxOwner,
  getCreationContextOwner,
  submitEtatDesLieux,
  uploadEtatLieuxImage,
  resoudreContestationsProprietaire,
  type EtatDesLieux,
  type PieceEtatDesLieux,
  type ElementEtatDesLieux,
  type TypeEtatDesLieux,
  type EtatElement,
  type StatutEtatDesLieux,
} from "@/api/etatDesLieux.api";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import ImageUpload from "@/components/ui/ImageUpload";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { Chip } from "@/components/ui/Chip";
import { messageErreurApi } from "@/lib/erreurApi";

// État des lieux d'entrée ou de sortie, côté propriétaire : clés, puis une carte par pièce et
// une ligne par élément (état, commentaire, photo). En cas de contestation du locataire, une
// décision par élément contesté. La barre d'actions reste en bas de l'écran.

type Decision = "RECTIFIER" | "ACCEPTER_RESERVE" | "REFUSER";

interface Resolution {
  decision: Decision;
  etat?: EtatElement;
  commentaire?: string;
  photos?: string[];
}

const ETATS: { value: EtatElement; label: string }[] = [
  { value: "NEUF", label: "Neuf" },
  { value: "BON", label: "Bon état" },
  { value: "USAGE", label: "État d'usage" },
  { value: "MAUVAIS", label: "Mauvais état" },
  { value: "DEGRADE", label: "Dégradé" },
];

const PIECES_OPTIONS = ["Salon", "Cuisine", "Chambre", "Douche", "WC", "Couloir", "Balcon", "Terrasse", "Autre"].map((nom) => ({ value: nom, label: nom }));

const ELEMENTS_OPTIONS = [
  "Murs et Plafonds",
  "Sols",
  "Plinthes",
  "Menuiseries (Portes/Fenêtres)",
  "Électricité (Prises/Interrupteurs)",
  "Éclairage (Ampoules/Plafonniers)",
  "Plomberie (Robinet/Évier/Lavabo)",
  "Chauffage/Radiateur",
  "Meubles/Placards",
  "Électroménager",
  "Serrurerie/Poignées",
  "VMC/Aération",
  "Vitres",
  "Autre",
].map((nom) => ({ value: nom, label: nom }));

const ELEMENTS_COMMUNS = ["Murs et Plafonds", "Sols", "Menuiseries (Portes/Fenêtres)", "Électricité (Prises/Interrupteurs)", "Plomberie (Robinet/Évier/Lavabo)"];

const DECISIONS: { value: Decision; label: string }[] = [
  { value: "RECTIFIER", label: "Rectifier la ligne" },
  { value: "ACCEPTER_RESERVE", label: "Note de réserve" },
  { value: "REFUSER", label: "Refuser la contestation" },
];

const STATUTS: Record<StatutEtatDesLieux, { label: string; tone: StatusTone }> = {
  BROUILLON: { label: "Brouillon", tone: "neutre" },
  EN_ATTENTE_VALIDATION: { label: "Envoyé au locataire", tone: "attente" },
  VALIDE: { label: "Signé", tone: "positif" },
  CONTESTE: { label: "Contesté par le locataire", tone: "alerte" },
  EN_LITIGE: { label: "En litige", tone: "alerte" },
};

const elementVide = (nom = ""): ElementEtatDesLieux => ({ nom, etat: "BON", commentaire: "", photos: [] });
const libelleEtat = (etat: EtatElement) => ETATS.find(({ value }) => value === etat)?.label ?? etat;

export default function EtatDesLieuxForm() {
  const { id, bailId } = useParams<{ id?: string; bailId?: string }>();
  const [searchParams] = useSearchParams();
  const typeParam = (searchParams.get("type") as TypeEtatDesLieux) || "ENTREE";
  const navigate = useNavigate();

  const [chargement, setChargement] = useState(false);
  const [edl, setEdl] = useState<EtatDesLieux | null>(null);
  const [nbCles, setNbCles] = useState(0);
  const [pieces, setPieces] = useState<PieceEtatDesLieux[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});

  const chargerEdl = async (edlId: string) => {
    try {
      setChargement(true);
      const donnees = await getEtatDesLieuxOwner(edlId);
      setEdl(donnees);
      setNbCles(donnees.nbCles || 0);
      setPieces(donnees.pieces || []);
    } catch {
      toast.error("L'état des lieux n'a pas pu être chargé. Réessayez.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (id) chargerEdl(id);
    else setPieces([{ nom: "Salon", elements: [elementVide()] }]);
  }, [id]);

  // Une sortie ne se crée que si le bail le permet : sinon, retour à la liste avec la raison.
  useEffect(() => {
    if (id || !bailId || typeParam !== "SORTIE") return;
    const retourListe = () => navigate(`/owner/bails/${bailId}/etats-des-lieux`, { replace: true });
    getCreationContextOwner(bailId)
      .then((contexte) => {
        if (!contexte.canCreateSortie) {
          toast.error(contexte.sortieBlockReason || "L'état des lieux de sortie ne peut pas encore être créé.");
          retourListe();
        }
      })
      .catch(() => {
        toast.error("Les conditions de sortie n'ont pas pu être vérifiées.");
        retourListe();
      });
  }, [id, bailId, navigate, typeParam]);

  const modifierPiece = (indexPiece: number, modification: (piece: PieceEtatDesLieux) => PieceEtatDesLieux) =>
    setPieces((actuelles) => actuelles.map((piece, index) => (index === indexPiece ? modification(piece) : piece)));

  const modifierElement = <K extends keyof ElementEtatDesLieux>(indexPiece: number, indexElement: number, cle: K, valeur: ElementEtatDesLieux[K]) =>
    modifierPiece(indexPiece, (piece) => ({
      ...piece,
      elements: piece.elements.map((element, index) => (index === indexElement ? { ...element, [cle]: valeur } : element)),
    }));

  const ajouterElements = (indexPiece: number, noms: string[]) =>
    modifierPiece(indexPiece, (piece) => ({ ...piece, elements: [...piece.elements, ...noms.map(elementVide)] }));

  const retirerElement = (indexPiece: number, indexElement: number) =>
    modifierPiece(indexPiece, (piece) => ({ ...piece, elements: piece.elements.filter((_, index) => index !== indexElement) }));

  const changerPhoto = async (indexPiece: number, indexElement: number, fichier: File | null) => {
    if (!fichier) {
      modifierElement(indexPiece, indexElement, "photos", []);
      return;
    }
    try {
      setChargement(true);
      const url = await uploadEtatLieuxImage(fichier);
      modifierElement(indexPiece, indexElement, "photos", [url]);
      toast.success("Photo ajoutée");
    } catch {
      toast.error("La photo n'a pas pu être envoyée. Réessayez.");
    } finally {
      setChargement(false);
    }
  };

  const enregistrer = async (envoyer: boolean) => {
    const listeEtatsDesLieux = `/owner/bails/${bailId}/etats-des-lieux`;
    try {
      setChargement(true);
      const payload = {
        bailId: bailId!,
        type: edl ? edl.type : typeParam,
        nbCles,
        pieces: pieces.map((piece) => ({
          nom: piece.nom,
          elements: piece.elements.map(({ nom, etat, commentaire, photos }) => ({ nom, etat, commentaire, photos })),
        })),
      };
      if (id) {
        await updateEtatDesLieux(id, payload);
        if (envoyer) {
          await submitEtatDesLieux(id);
          toast.success("État des lieux envoyé au locataire pour signature");
          navigate(listeEtatsDesLieux);
        } else {
          toast.success("Brouillon enregistré");
          chargerEdl(id);
        }
      } else {
        const cree = await createEtatDesLieux(payload);
        if (envoyer) {
          await submitEtatDesLieux(cree.id);
          toast.success("État des lieux créé et envoyé au locataire");
          navigate(listeEtatsDesLieux);
        } else {
          toast.success("Brouillon créé");
          navigate(`/owner/etats-des-lieux/${cree.id}`);
        }
      }
    } catch (error) {
      toast.error(messageErreurApi(error, "L'état des lieux n'a pas pu être enregistré. Réessayez."));
    } finally {
      setChargement(false);
    }
  };

  const envoyerResolutions = async () => {
    if (!id) return;
    const contestes = pieces.flatMap(({ elements }) => elements).filter((element) => element.estConteste && element.id);
    const restants = contestes.filter((element) => !resolutions[element.id!]).length;
    if (restants > 0) {
      toast.error(`Choisissez une décision pour ${restants > 1 ? `les ${restants} contestations restantes` : "la contestation restante"}.`);
      return;
    }
    try {
      setChargement(true);
      await resoudreContestationsProprietaire(
        id,
        Object.entries(resolutions).map(([elementId, resolution]) => ({ elementId, ...resolution })),
      );
      toast.success("Décisions envoyées au locataire");
      setResolutions({});
      chargerEdl(id);
    } catch {
      toast.error("Les décisions n'ont pas pu être envoyées. Réessayez.");
    } finally {
      setChargement(false);
    }
  };

  const lectureSeule = edl ? edl.statut !== "BROUILLON" && edl.statut !== "CONTESTE" : false;
  const conteste = edl?.statut === "CONTESTE";
  const litige = edl?.statut === "EN_LITIGE";
  const type = edl?.type ?? typeParam;

  return (
    <div className="max-w-5xl space-y-6 pb-4">
      <header>
        <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-10 items-center gap-1 text-body-m font-semibold text-baobab hover:underline">
          <ChevronLeft aria-hidden className="size-4" />
          États des lieux
        </button>
        <h1 className="mt-1 font-display text-h2 font-bold text-encre lg:text-h1">
          {id ? "" : "Nouvel "}état des lieux {type === "ENTREE" ? "d'entrée" : "de sortie"}
        </h1>
        {edl && (
          <StatusBadge tone={STATUTS[edl.statut].tone} className="mt-2">
            {STATUTS[edl.statut].label}
          </StatusBadge>
        )}
      </header>

      {conteste && (
        <p className="flex items-start gap-3 rounded-card bg-soleil-100 p-4 text-body-m text-encre">
          <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 fill-soleil" />
          <span>
            <span className="block font-semibold">Le locataire conteste certains éléments.</span>
            Pour chacun, rectifiez la ligne, ajoutez une note de réserve ou refusez la contestation. Un refus met l'état des lieux en litige.
          </span>
        </p>
      )}
      {litige && (
        <p className="flex items-start gap-3 rounded-card bg-soleil-100 p-4 text-body-m text-encre">
          <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 fill-soleil" />
          <span>
            <span className="block font-semibold">État des lieux en litige.</span>
            Vous avez refusé des contestations du locataire : un médiateur ou un huissier devra intervenir.
          </span>
        </p>
      )}

      <section aria-label="Clés" className="grid gap-4 rounded-card bg-white p-5 sm:grid-cols-[220px_1fr] sm:items-end lg:p-6">
        <FormField label="Clés remises">
          <Input type="number" min={0} inputMode="numeric" disabled={lectureSeule} value={nbCles} onChange={(event) => setNbCles(parseInt(event.target.value, 10) || 0)} />
        </FormField>
        <p className="text-body-m text-texte2">Vérifiez chaque pièce et notez l'état des éléments. Une fois terminé, envoyez l'état des lieux au locataire pour signature.</p>
      </section>

      {conteste && (
        <section aria-labelledby="titre-contestations" className="space-y-4">
          <h2 id="titre-contestations" className="font-display text-h3 font-bold text-encre">
            Contestations du locataire
          </h2>
          {pieces.map((piece) => {
            const contestes = piece.elements.filter((element) => element.estConteste);
            if (contestes.length === 0) return null;
            return (
              <div key={piece.id ?? piece.nom} className="rounded-card bg-white p-5 lg:p-6">
                <h3 className="text-title font-semibold text-encre">{piece.nom}</h3>
                <ul className="mt-3 divide-y divide-filet">
                  {contestes.map((element) => {
                    const decision = element.id ? resolutions[element.id]?.decision : undefined;
                    return (
                      <li key={element.id} className="space-y-3 py-4">
                        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                          <p className="font-semibold text-encre">{element.nom}</p>
                          <StatusBadge tone="neutre" size="sm">
                            {libelleEtat(element.etat)}
                          </StatusBadge>
                        </div>
                        <div className="rounded-control bg-soleil-100 p-3 text-body-m text-encre">
                          <p className="font-semibold">Motif du locataire</p>
                          <p className="mt-1">« {element.motifContestation} »</p>
                          {element.photoContestation && (
                            <img src={element.photoContestation} alt="Photo jointe par le locataire" className="mt-2 size-24 rounded-control object-cover" crossOrigin="anonymous" />
                          )}
                        </div>
                        <fieldset>
                          <legend className="mb-2 text-body-m font-semibold text-encre">Votre décision</legend>
                          <div className="flex flex-wrap gap-2">
                            {DECISIONS.map(({ value, label }) => (
                              <Chip key={value} size="sm" selected={decision === value} onClick={() => element.id && setResolutions((actuelles) => ({ ...actuelles, [element.id!]: { decision: value } }))}>
                                {label}
                              </Chip>
                            ))}
                          </div>
                          {decision === "REFUSER" && <p className="mt-2 text-body-m font-semibold text-encre">Ce refus mettra l'état des lieux en litige.</p>}
                        </fieldset>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {!conteste && !litige && (
        <div className="space-y-6">
          {pieces.map((piece, indexPiece) => (
            // L'ordre d'empilement garde les listes déroulantes d'une pièce au-dessus de la suivante.
            <section key={piece.id ?? indexPiece} aria-label={piece.nom || `Pièce ${indexPiece + 1}`} className="relative rounded-card bg-white p-5 lg:p-6" style={{ zIndex: 100 - indexPiece }}>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,280px)_1fr_auto] sm:items-center">
                {lectureSeule ? (
                  <h2 className="font-display text-h3 font-bold text-encre">{piece.nom}</h2>
                ) : (
                  <SearchableSelect options={PIECES_OPTIONS} value={piece.nom} onChange={(nom) => modifierPiece(indexPiece, (actuelle) => ({ ...actuelle, nom }))} placeholder="Choisir une pièce" />
                )}
                <span aria-hidden className="hidden sm:block" />
                {!lectureSeule && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => ajouterElements(indexPiece, ELEMENTS_COMMUNS)}>
                      Éléments courants
                    </Button>
                    <Button size="icon-sm" variant="outline" aria-label={`Retirer la pièce ${piece.nom}`} onClick={() => setPieces((actuelles) => actuelles.filter((_, index) => index !== indexPiece))}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                )}
              </div>

              <ul className="mt-4 divide-y divide-filet">
                {piece.elements.map((element, indexElement) => (
                  <li key={element.id ?? indexElement} className="relative grid gap-4 py-4 lg:grid-cols-[1fr_1fr_1.6fr]" style={{ zIndex: 40 - indexElement }}>
                    <div>
                      <p className="mb-2 text-body-m font-semibold text-encre">Élément</p>
                      {lectureSeule ? (
                        <p className="text-encre">{element.nom}</p>
                      ) : (
                        <SearchableSelect options={ELEMENTS_OPTIONS} value={element.nom} onChange={(nom) => modifierElement(indexPiece, indexElement, "nom", nom)} placeholder="Choisir un élément" />
                      )}
                    </div>
                    <FormField label="État">
                      <NativeSelect disabled={lectureSeule} value={element.etat} onChange={(event) => modifierElement(indexPiece, indexElement, "etat", event.target.value as EtatElement)}>
                        {ETATS.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </NativeSelect>
                    </FormField>
                    <div className="space-y-3">
                      <FormField label="Commentaire" hint="Facultatif">
                        <Input
                          disabled={lectureSeule}
                          value={element.commentaire ?? ""}
                          onChange={(event) => modifierElement(indexPiece, indexElement, "commentaire", event.target.value)}
                          placeholder="Tache sur le mur gauche, rayure sur la porte…"
                        />
                      </FormField>
                      {lectureSeule ? (
                        element.photos?.[0] && <img src={element.photos[0]} alt={`Photo : ${element.nom}`} className="h-28 rounded-control object-cover" />
                      ) : (
                        <ImageUpload label="Photo" currentImage={element.photos?.[0] ?? null} onChange={(fichier) => changerPhoto(indexPiece, indexElement, fichier)} />
                      )}
                    </div>
                    {!lectureSeule && (
                      <Button
                        size="icon-sm"
                        variant="outline"
                        aria-label={`Retirer l'élément ${element.nom || indexElement + 1}`}
                        onClick={() => retirerElement(indexPiece, indexElement)}
                        className="justify-self-end lg:absolute lg:right-0 lg:top-4"
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>

              {!lectureSeule && (
                <Button variant="ghost" className="mt-2 w-full border border-dashed border-bord-champ" onClick={() => ajouterElements(indexPiece, [""])}>
                  <PlusCircle aria-hidden />
                  Ajouter un élément
                </Button>
              )}
            </section>
          ))}

          {!lectureSeule && (
            <Button variant="outline" className="w-full" onClick={() => setPieces((actuelles) => [...actuelles, { nom: "", elements: [elementVide()] }])}>
              <PlusCircle aria-hidden />
              Ajouter une pièce
            </Button>
          )}
        </div>
      )}

      <div className="sticky bottom-4 z-[110] flex flex-wrap justify-end gap-3 rounded-card border border-filet bg-white/95 p-4 shadow-float backdrop-blur">
        {conteste ? (
          <Button onClick={envoyerResolutions} disabled={chargement}>
            {chargement ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden />}
            Envoyer mes décisions au locataire
          </Button>
        ) : !lectureSeule ? (
          <>
            <Button variant="outline" onClick={() => enregistrer(false)} disabled={chargement}>
              Enregistrer le brouillon
            </Button>
            <Button onClick={() => enregistrer(true)} disabled={chargement}>
              {chargement ? <Loader2 aria-hidden className="animate-spin" /> : <Send aria-hidden />}
              Envoyer au locataire
            </Button>
          </>
        ) : (
          <p className="flex items-center gap-2 text-body-m font-semibold text-encre">
            <Lock aria-hidden className="size-4" />
            Cet état des lieux ne peut plus être modifié.
          </p>
        )}
      </div>
    </div>
  );
}
