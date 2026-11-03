import { useState } from "react";
import { CheckCircle2, ChevronRight, Loader2, MessageSquare, Send } from "lucide-react";
import { submitFeedback } from "@/api/feedback";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/Chip";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Avis des visiteurs (site public) : un onglet discret sur le bord gauche ouvre une fenêtre de
// la charte (tiroir sur mobile). Quatre questions, chacune facultative, envoyées à la fin.

type TypeQuestion = "note" | "echelle" | "texte";
type CleAvis = "experience" | "facilite" | "apprecie" | "frustration";

interface Question {
  cle: CleAvis;
  type: TypeQuestion;
  intitule: string;
}

interface Avis {
  experience?: number;
  facilite?: number;
  apprecie?: string;
  frustration?: string;
}

const QUESTIONS: Question[] = [
  { cle: "experience", type: "note", intitule: "Comment jugez-vous votre expérience sur Seek ?" },
  { cle: "facilite", type: "echelle", intitule: "Seek est-il facile à utiliser ? De 1, difficile, à 5, très facile." },
  { cle: "apprecie", type: "texte", intitule: "Qu'est-ce qui vous plaît le plus sur Seek ?" },
  { cle: "frustration", type: "texte", intitule: "Qu'est-ce qui vous a gêné ou ralenti ?" },
];

// Émojis Twemoji (même rendu sur tous les navigateurs), servis par cdnjs.
const twemoji = (code: string) => `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`;

const NOTES = [
  { valeur: 1, label: "Très mauvais", emoji: twemoji("1f62b") },
  { valeur: 2, label: "Mauvais", emoji: twemoji("1f615") },
  { valeur: 3, label: "Moyen", emoji: twemoji("1f610") },
  { valeur: 4, label: "Bien", emoji: twemoji("1f642") },
  { valeur: 5, label: "Magnifique", emoji: twemoji("1f60d") },
];

const ECHELLE = [1, 2, 3, 4, 5];

export default function FeedbackWidget() {
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState(0);
  const [avis, setAvis] = useState<Avis>({});
  const [envoi, setEnvoi] = useState(false);
  const [termine, setTermine] = useState(false);

  const question = QUESTIONS[etape];
  const derniere = etape === QUESTIONS.length - 1;
  const valeur = avis[question.cle];
  const choixRequis = question.type !== "texte";

  const recommencer = () => {
    setEtape(0);
    setAvis({});
    setTermine(false);
  };

  const fermer = (open: boolean) => {
    setOuvert(open);
    if (!open && termine) recommencer();
  };

  const envoyer = async () => {
    setEnvoi(true);
    try {
      await submitFeedback(avis);
    } catch {
      // L'avis est un bonus : un échec d'envoi ne doit pas bloquer le visiteur.
    } finally {
      setEnvoi(false);
      setTermine(true);
    }
  };

  const suivante = () => {
    if (derniere) void envoyer();
    else setEtape((actuelle) => actuelle + 1);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="fixed left-0 top-1/2 z-[80] flex -translate-y-1/2 items-center gap-2 rounded-r-control bg-encre px-2.5 py-3 text-white transition-colors duration-hover hover:bg-baobab-900"
        style={{ writingMode: "vertical-rl" }}
      >
        <MessageSquare aria-hidden className="size-4 rotate-90 text-soleil" />
        <span className="rotate-180 text-caption font-semibold">Votre avis</span>
      </button>

      <SheetDialog open={ouvert} onOpenChange={fermer} title={termine ? "Merci pour votre avis" : "Votre avis sur Seek"}>
        {termine ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-baobab-100">
              <CheckCircle2 aria-hidden className="size-7 text-baobab" />
            </span>
            <p className="mt-4 max-w-xs text-body-l text-texte2">Vos réponses nous aident à améliorer Seek pour tous ses utilisateurs.</p>
            <Button variant="outline" className="mt-6" onClick={recommencer}>
              Donner un autre avis
            </Button>
          </div>
        ) : (
          <div>
            <div aria-hidden className="mb-5 flex gap-1.5">
              {QUESTIONS.map(({ cle }, index) => (
                <span key={cle} className={cn("h-1.5 rounded-full transition-all duration-tab", index === etape ? "w-6 bg-baobab" : index < etape ? "w-2 bg-baobab-100" : "w-2 bg-filet")} />
              ))}
            </div>
            <p className="text-caption text-texte2">
              Question {etape + 1} sur {QUESTIONS.length}
            </p>

            {question.type === "texte" ? (
              <>
                <label htmlFor={`avis-${question.cle}`} className="mt-1 block text-title font-semibold text-encre">
                  {question.intitule}
                </label>
                <Textarea
                  id={`avis-${question.cle}`}
                  rows={4}
                  className="mt-4"
                  value={(valeur as string | undefined) ?? ""}
                  onChange={(event) => setAvis((actuel) => ({ ...actuel, [question.cle]: event.target.value }))}
                  placeholder="Votre réponse, facultative"
                />
              </>
            ) : (
              <fieldset>
                <legend className="mt-1 text-title font-semibold text-encre">{question.intitule}</legend>
                <div className={cn("mt-4 flex gap-2", question.type === "note" ? "justify-between pb-7" : "")}>
                  {question.type === "note"
                    ? NOTES.map((note) => {
                        const choisi = valeur === note.valeur;
                        const atenue = valeur !== undefined && !choisi;
                        return (
                          // Le libellé apparaît au survol et au clavier ; il reste affiché sur la note choisie (utile sur mobile, sans survol).
                          <button
                            key={note.valeur}
                            type="button"
                            aria-pressed={choisi}
                            aria-label={note.label}
                            onClick={() => setAvis((actuel) => ({ ...actuel, experience: note.valeur }))}
                            className="group relative flex size-14 items-center justify-center rounded-full transition-colors duration-hover hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre"
                          >
                            <img
                              src={note.emoji}
                              alt=""
                              className={cn(
                                "size-9 transition-transform duration-hover",
                                choisi ? "scale-125" : "group-hover:scale-110",
                                atenue && "opacity-40 group-hover:opacity-100",
                              )}
                            />
                            <span
                              aria-hidden
                              className={cn(
                                "pointer-events-none absolute top-full mt-1 whitespace-nowrap text-caption font-semibold text-baobab transition-opacity duration-hover",
                                choisi ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
                              )}
                            >
                              {note.label}
                            </span>
                          </button>
                        );
                      })
                    : ECHELLE.map((niveau) => (
                        <Chip
                          key={niveau}
                          selected={valeur === niveau}
                          onClick={() => setAvis((actuel) => ({ ...actuel, facilite: niveau }))}
                          aria-label={`${niveau} sur 5`}
                          className="flex-1 justify-center font-semibold tabular-nums"
                        >
                          {niveau}
                        </Chip>
                      ))}
                </div>
              </fieldset>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={suivante} disabled={envoi}>
                Passer
              </Button>
              <Button onClick={suivante} disabled={envoi || (choixRequis && valeur === undefined)}>
                {envoi ? <Loader2 aria-hidden className="animate-spin" /> : derniere ? <Send aria-hidden /> : null}
                {derniere ? "Envoyer" : "Suivant"}
                {!derniere && <ChevronRight aria-hidden />}
              </Button>
            </div>
          </div>
        )}
      </SheetDialog>
    </>
  );
}
