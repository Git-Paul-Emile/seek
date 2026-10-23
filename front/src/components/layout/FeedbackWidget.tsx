import { useState } from "react";
import { X, MessageSquare, Send, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback } from "@/api/feedback";

// ─── Types ───────────────────────────────────────────────────────────────────

type StepType = "emoji" | "scale" | "text";

interface Step {
  id: string;
  type: StepType;
  question: string;
  subtext?: string;
}

interface FeedbackValues {
  experience?: number;
  facilite?: number;
  apprecie?: string;
  frustration?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    id: "experience",
    type: "emoji",
    question: "Comment évalues-tu ton expérience globale sur Seek ?",
  },
  {
    id: "facilite",
    type: "scale",
    question: "Dans quelle mesure Seek est-il facile à utiliser ?",
  },
  {
    id: "apprecie",
    type: "text",
    question: "Qu'est-ce que tu apprécies le plus sur Seek ?",
  },
  {
    id: "frustration",
    type: "text",
    question: "Y a-t-il quelque chose qui t'a gêné ou ralenti lors de ton utilisation ?",
  },
];

// Twemoji SVG via CDN - rendu identique sur tous les navigateurs/OS
const tw = (cp: string) =>
  `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${cp}.svg`;

const EMOJIS = [
  { value: 1, src: tw("1f62b"), label: "Très mauvais" },
  { value: 2, src: tw("1f615"), label: "Mauvais" },
  { value: 3, src: tw("1f610"), label: "Moyen" },
  { value: 4, src: tw("1f642"), label: "Bien" },
  { value: 5, src: tw("1f60d"), label: "Magnifique" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [values, setValues] = useState<FeedbackValues>({});
  const [hoverEmoji, setHoverEmoji] = useState<number | null>(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const openWidget = () => {
    setClosing(false);
    setOpen(true);
  };

  const closeWidget = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 300);
  };

  const handleToggle = () => (open ? closeWidget() : openWidget());

  const currentValue = () => {
    if (step.type === "emoji" || step.type === "scale") return values[step.id as keyof FeedbackValues] as number | undefined;
    return values[step.id as keyof FeedbackValues] as string | undefined;
  };

  const setNumericValue = (v: number) =>
    setValues((prev) => ({ ...prev, [step.id]: v }));

  const setTextValue = (v: string) =>
    setValues((prev) => ({ ...prev, [step.id]: v }));

  const submit = async (finalValues: FeedbackValues) => {
    try {
      await submitFeedback({
        experience:  finalValues.experience,
        facilite:    finalValues.facilite,
        apprecie:    finalValues.apprecie,
        frustration: finalValues.frustration,
      });
    } catch {
      // Échec silencieux - ne pas bloquer l'UX
    }
    setDone(true);
  };

  const goNext = () => {
    if (isLast) {
      void submit(values);
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const skip = () => {
    if (isLast) {
      void submit(values);
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const reset = () => {
    setStepIndex(0);
    setDone(false);
    setValues({});
  };

  const canNext = () => {
    const v = currentValue();
    if (step.type === "text") return true;
    return v !== undefined;
  };

  return (
    <>
      <style>{`
        @keyframes feedbackSlideIn {
          from { opacity: 0; transform: translateX(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)     scale(1); }
        }
        @keyframes feedbackSlideOut {
          from { opacity: 1; transform: translateX(0)     scale(1); }
          to   { opacity: 0; transform: translateX(-12px) scale(0.97); }
        }
        .feedback-enter { animation: feedbackSlideIn  0.28s cubic-bezier(0.34, 1.3, 0.64, 1) forwards; }
        .feedback-leave { animation: feedbackSlideOut 0.25s cubic-bezier(0.36, 0, 0.66, 0) forwards; }
        .emoji-bounce:hover { animation: emojiBounce 0.35s ease; }
        @keyframes emojiBounce { 0%,100% { transform: scale(1); } 40% { transform: scale(1.25); } 70% { transform: scale(0.95); } }
      `}</style>

      {/* ── Tab latéral gauche ──────────────────────────────────── */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[90]">
        <button
          onClick={handleToggle}
          title="Laisser un avis"
          className={`
            flex items-center gap-2 px-3 py-2.5
            bg-encre text-white
            rounded-r-control shadow-lg
            hover:bg-baobab-900 active:scale-95
            transition-all duration-200
            ${open ? "pl-4" : ""}
          `}
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          <MessageSquare
            className="w-4 h-4 text-baobab shrink-0"
            style={{ transform: "rotate(90deg)" }}
          />
          <span
            className="text-caption font-semibold tracking-wider uppercase"
            style={{ transform: "rotate(180deg)" }}
          >
            Feedback
          </span>
        </button>
      </div>

      {/* ── Panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          className={`
            fixed left-14 top-1/2 -translate-y-1/2 z-[90]
            w-[300px] sm:w-[320px]
            bg-white rounded-card shadow-2xl border border-filet overflow-hidden
            ${closing ? "feedback-leave" : "feedback-enter"}
          `}
        >
          {/* Bouton fermer */}
          <button
            onClick={closeWidget}
            className="absolute top-3 right-3 p-1.5 rounded-control text-texte2 hover:bg-surface hover:text-texte2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Body */}
          <div className="p-5 pt-4">
            {done ? (
              /* ── Succès ── */
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-baobab-100 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-baobab" />
                </div>
                <div>
                  <p className="font-bold text-encre">Merci pour ton retour !</p>
                  <p className="text-caption text-texte2 mt-1 leading-relaxed">
                    Tes réponses nous aident à améliorer Seek pour toi et tous les utilisateurs.
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-caption text-baobab hover:underline mt-1"
                >
                  Donner un nouvel avis
                </button>
              </div>
            ) : (
              /* ── Steps ── */
              <>
                {/* Progress dots */}
                <div className="flex items-center gap-1.5 mb-4">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === stepIndex
                          ? "w-5 bg-baobab"
                          : i < stepIndex
                          ? "w-2 bg-baobab-100"
                          : "w-2 bg-filet"
                      }`}
                    />
                  ))}
                </div>

                {/* Question */}
                <p className="text-body-m font-semibold text-encre leading-snug mb-1 pr-6">
                  {step.question}
                </p>
                {step.subtext && (
                  <p className="text-caption text-texte2 mb-3">{step.subtext}</p>
                )}

                {/* Input - Emoji */}
                {step.type === "emoji" && (
                  <div className="flex justify-between items-end mt-4 mb-2">
                    {EMOJIS.map(({ value, src, label }) => {
                      const hasSelection = values.experience !== undefined;
                      const selected = values.experience === value;
                      const isHovered = hoverEmoji === value;
                      const dimmed = hasSelection && !selected && !isHovered;
                      return (
                        <button
                          key={value}
                          onClick={() => setNumericValue(value)}
                          onMouseEnter={() => setHoverEmoji(value)}
                          onMouseLeave={() => setHoverEmoji(null)}
                          className="flex flex-col items-center gap-1"
                        >
                          <img
                            src={src}
                            alt={label}
                            className={`w-8 h-8 transition-all duration-150 ${
                              selected
                                ? "scale-125 drop-shadow-md"
                                : isHovered
                                ? "scale-110"
                                : dimmed
                                ? "opacity-30 scale-90"
                                : "scale-100"
                            }`}
                          />
                          <span
                            className={`text-caption font-semibold whitespace-nowrap transition-opacity duration-150 ${
                              selected || isHovered ? "text-baobab opacity-100" : "opacity-0"
                            }`}
                          >
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Input - Scale 1-5 */}
                {step.type === "scale" && (
                  <div className="flex gap-2 mt-4 mb-2">
                    {[1, 2, 3, 4, 5].map((v) => {
                      const selected = values.facilite === v;
                      return (
                        <button
                          key={v}
                          onClick={() => setNumericValue(v)}
                          className={`flex-1 h-10 rounded-control text-body-m font-bold border-2 transition-all duration-150 ${
                            selected
                              ? "bg-encre border-encre text-white scale-105"
                              : "border-filet text-texte2 hover:border-baobab hover:text-baobab"
                          }`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Input - Textarea */}
                {step.type === "text" && (
                  <Textarea
                    value={(values[step.id as keyof FeedbackValues] as string) ?? ""}
                    onChange={(e) => setTextValue(e.target.value)}
                    placeholder="Écris ta réponse ici…"
                    className="mt-3 mb-2 resize-none text-body-m min-h-[90px] focus-visible:ring-filet"
                    rows={3}
                  />
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-filet">
                  <button
                    onClick={skip}
                    className="text-caption text-texte2 hover:text-texte2 underline underline-offset-2 transition-colors"
                  >
                    Passer
                  </button>
                  <Button
                    onClick={goNext}
                    disabled={!canNext()}
                    className={`h-8 px-4 text-caption font-semibold gap-1.5 transition-all ${
                      isLast
                        ? "bg-baobab hover:bg-baobab-900 text-white"
                        : "bg-encre hover:bg-baobab-900 text-white"
                    }`}
                  >
                    {isLast ? (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Envoyer
                      </>
                    ) : (
                      <>
                        Suivant
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
