import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Send, TriangleAlert, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useLocataires, useSearchLocataire } from "@/hooks/useLocataire";
import { useCreerBail } from "@/hooks/useBail";
import { useCreateBailInvitation } from "@/hooks/useBailInvitation";
import type { Bail } from "@/api/bail";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { Switch } from "@/components/ui/Switch";
import { formatFcfa, libelleFrequence } from "@/lib/fcfa";
import { messageErreurApi } from "@/lib/erreurApi";
import { cn } from "@/lib/utils";

// Association d'un locataire à un bien (fenêtre de la charte, planche « Alertes et fenêtres ») :
// un locataire de la liste, ou un compte Seek trouvé par téléphone qui reçoit une invitation.

interface BailFormProps {
  bienId: string;
  bien: {
    prix?: number | null;
    caution?: number | null;
    frequencePaiement?: string | null;
    titre?: string | null;
    adresse?: string | null;
    ville?: string | null;
  };
  onClose: () => void;
  onBailCreated: (bail: Bail) => void;
}

type ModeLocataire = "MES_LOCATAIRES" | "RECHERCHE";
type Erreurs = Partial<Record<"locataireId" | "typeBail" | "dateDebutBail" | "cautionVersee" | "jourLimitePaiement", string>>;

const TYPES_BAIL = ["Habitation", "Commercial", "Mixte"];
const JOUR_MIN = 1;
const JOUR_MAX = 28;

export default function BailForm({ bienId, bien, onClose, onBailCreated }: BailFormProps) {
  const { data: locataires = [] } = useLocataires();
  const creerBail = useCreerBail();
  const creerInvitation = useCreateBailInvitation();

  const [mode, setMode] = useState<ModeLocataire>("MES_LOCATAIRES");
  const [telephone, setTelephone] = useState("");
  const [telephoneCherche, setTelephoneCherche] = useState("");
  const { data: resultat, isFetching: recherche } = useSearchLocataire(telephoneCherche ? { telephone: telephoneCherche } : {});
  const externe = resultat?.found && resultat.locataire && !resultat.locataire.estDansMaListe ? resultat.locataire : null;

  const [form, setForm] = useState({
    locataireId: "",
    typeBail: "",
    dateDebutBail: "",
    dateFinBail: "",
    renouvellement: true,
    cautionVersee: "" as "" | "oui" | "non",
    jourLimitePaiement: "",
  });
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const enCours = creerBail.isPending || creerInvitation.isPending;
  const invitation = mode === "RECHERCHE" && Boolean(externe);
  const libres = locataires.filter((l) => !l.bails?.some((b) => b.statut === "ACTIF"));
  const associes = locataires.filter((l) => l.bails?.some((b) => b.statut === "ACTIF"));
  const frequence = libelleFrequence(bien.frequencePaiement);

  const champ = <K extends keyof typeof form>(cle: K, valeur: (typeof form)[K]) => setForm((actuel) => ({ ...actuel, [cle]: valeur }));

  const changerMode = (valeur: ModeLocataire) => {
    setMode(valeur);
    if (valeur === "MES_LOCATAIRES") {
      setTelephoneCherche("");
      setTelephone("");
    }
  };

  const chercher = () => {
    const numero = telephone.trim().replace(/\s/g, "");
    if (numero) setTelephoneCherche(numero);
  };

  const choisirDansMaListe = () => {
    if (!resultat?.locataire) return;
    champ("locataireId", resultat.locataire.id);
    setMode("MES_LOCATAIRES");
    toast.success("Locataire sélectionné dans votre liste");
  };

  const verifier = (): Erreurs => {
    const jour = Number(form.jourLimitePaiement);
    return {
      locataireId: mode === "MES_LOCATAIRES" && !form.locataireId ? "Choisissez le locataire." : undefined,
      typeBail: form.typeBail ? undefined : "Choisissez le type de bail.",
      dateDebutBail: form.dateDebutBail ? undefined : "Indiquez la date de début du bail.",
      cautionVersee: form.cautionVersee ? undefined : "Indiquez si la caution a été versée.",
      jourLimitePaiement: !form.jourLimitePaiement
        ? "Indiquez le jour limite de paiement."
        : !Number.isInteger(jour) || jour < JOUR_MIN || jour > JOUR_MAX
          ? `Choisissez un jour entre ${JOUR_MIN} et ${JOUR_MAX}.`
          : undefined,
    };
  };

  const conditions = () => ({
    typeBail: form.typeBail,
    dateDebutBail: form.dateDebutBail,
    dateFinBail: form.dateFinBail || null,
    renouvellement: form.renouvellement,
    montantLoyer: bien.prix ?? 0,
    montantCaution: bien.caution ?? null,
    cautionVersee: form.cautionVersee === "oui",
    jourLimitePaiement: Number(form.jourLimitePaiement),
    frequencePaiement: bien.frequencePaiement ?? null,
  });

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    const nouvelles = verifier();
    setErreurs(nouvelles);
    if (Object.values(nouvelles).some(Boolean)) return;

    if (invitation && externe) {
      try {
        await creerInvitation.mutateAsync({ bienId, locataireId: externe.id, ...conditions() });
        toast.success(`Invitation envoyée à ${externe.prenom} ${externe.nom}`);
        onClose();
      } catch (error) {
        toast.error(messageErreurApi(error, "L'invitation n'a pas pu être envoyée. Réessayez dans un instant."));
      }
      return;
    }

    try {
      const bail = await creerBail.mutateAsync({ bienId, payload: { locataireId: form.locataireId, ...conditions() } });
      toast.success("Bail créé : le bien est maintenant loué");
      onBailCreated(bail);
    } catch (error) {
      toast.error(messageErreurApi(error, "Le bail n'a pas pu être créé. Réessayez."));
    }
  };

  return (
    <SheetDialog
      open
      onOpenChange={(open) => !open && !enCours && onClose()}
      title={invitation ? "Inviter un locataire" : "Associer un locataire"}
      description={[bien.titre || bien.adresse || "Bien", bien.ville].filter(Boolean).join(" · ")}
    >
      <form onSubmit={enregistrer} noValidate className="space-y-5">
        <SegmentedControl<ModeLocataire>
          label="Choisir le locataire"
          options={[
            { value: "MES_LOCATAIRES", label: "Mes locataires" },
            { value: "RECHERCHE", label: "Par téléphone" },
          ]}
          value={mode}
          onChange={changerMode}
          className="w-full [&>button]:flex-1"
        />

        {mode === "MES_LOCATAIRES" ? (
          locataires.length === 0 ? (
            <p className="rounded-control bg-surface p-4 text-center text-body-m text-texte2">
              Aucun locataire pour l'instant.{" "}
              <Link to="/owner/locataires/ajouter" className="font-semibold text-baobab hover:underline">
                Créer un locataire
              </Link>
            </p>
          ) : (
            <FormField label="Locataire" error={erreurs.locataireId}>
              <NativeSelect value={form.locataireId} onChange={(event) => champ("locataireId", event.target.value)}>
                <option value="">Choisir un locataire</option>
                {libres.length > 0 && (
                  <optgroup label={`Disponibles · ${libres.length}`}>
                    {libres.map((locataire) => (
                      <option key={locataire.id} value={locataire.id}>
                        {locataire.prenom} {locataire.nom} · {locataire.telephone}
                      </option>
                    ))}
                  </optgroup>
                )}
                {associes.length > 0 && (
                  <optgroup label={`Déjà sous bail · ${associes.length}`}>
                    {associes.map((locataire) => {
                      const bail = locataire.bails?.find((b) => b.statut === "ACTIF");
                      return (
                        <option key={locataire.id} value={locataire.id}>
                          {locataire.prenom} {locataire.nom} · {bail?.bien?.titre || bail?.bien?.ville || "Bien loué"}
                        </option>
                      );
                    })}
                  </optgroup>
                )}
              </NativeSelect>
            </FormField>
          )
        ) : (
          <div className="space-y-3">
            <FormField label="Téléphone du locataire" help="Le numéro de son compte Seek.">
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Input
                  type="tel"
                  value={telephone}
                  onChange={(event) => setTelephone(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      chercher();
                    }
                  }}
                  placeholder="+221 77 000 00 00"
                />
                <Button type="button" size="icon" variant="outline" aria-label="Chercher ce numéro" onClick={chercher} disabled={!telephone.trim() || recherche}>
                  {recherche ? <Loader2 aria-hidden className="animate-spin" /> : <Search aria-hidden />}
                </Button>
              </div>
            </FormField>
            {telephoneCherche && resultat && !recherche && (
              <div className="rounded-control bg-surface p-4 text-body-m">
                {!resultat.found ? (
                  <p className="text-texte2">
                    Aucun compte locataire pour ce numéro.{" "}
                    <Link to="/owner/locataires/ajouter" className="font-semibold text-baobab hover:underline">
                      Créer le locataire
                    </Link>
                  </p>
                ) : resultat.locataire?.estDansMaListe ? (
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <UserCheck aria-hidden className="size-5 text-baobab" />
                    <p className="text-encre">
                      <span className="font-semibold">
                        {resultat.locataire.prenom} {resultat.locataire.nom}
                      </span>{" "}
                      est déjà dans votre liste.
                    </p>
                    <Button type="button" size="sm" variant="outline" onClick={choisirDansMaListe}>
                      Choisir
                    </Button>
                  </div>
                ) : (
                  externe && (
                    <div className="grid grid-cols-[auto_1fr] items-start gap-3">
                      <TriangleAlert aria-hidden className="mt-0.5 size-5 fill-soleil text-encre" />
                      <p className="text-encre">
                        <span className="font-semibold">
                          {externe.prenom} {externe.nom}
                        </span>{" "}
                        a déjà un compte Seek chez un autre propriétaire. Remplissez les conditions ci-dessous : il recevra une invitation à accepter depuis son espace.
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        <FormField label="Type de bail" error={erreurs.typeBail}>
          <NativeSelect value={form.typeBail} onChange={(event) => champ("typeBail", event.target.value)}>
            <option value="">Choisir le type</option>
            {TYPES_BAIL.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </NativeSelect>
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Début du bail" error={erreurs.dateDebutBail}>
            <Input type="date" value={form.dateDebutBail} onChange={(event) => champ("dateDebutBail", event.target.value)} />
          </FormField>
          <FormField label="Fin du bail" hint="Facultatif">
            <Input type="date" value={form.dateFinBail} onChange={(event) => champ("dateFinBail", event.target.value)} />
          </FormField>
        </div>

        <Switch label="Renouvellement possible" checked={form.renouvellement} onChange={(valeur) => champ("renouvellement", valeur)} />

        <section aria-labelledby="titre-conditions" className="space-y-5 rounded-card bg-surface p-4">
          <h3 id="titre-conditions" className="text-overline font-semibold uppercase text-texte2">
            Conditions financières
          </h3>
          <dl className="grid grid-cols-2 gap-3 text-body-m">
            <div>
              <dt className="text-texte2">Loyer</dt>
              <dd className="font-semibold text-encre">
                {bien.prix ? formatFcfa(bien.prix) : "Non renseigné"}
                {frequence ? ` / ${frequence}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-texte2">Caution</dt>
              <dd className="font-semibold text-encre">{bien.caution ? formatFcfa(bien.caution) : "Aucune"}</dd>
            </div>
          </dl>
          <fieldset>
            <legend className="mb-2 text-body-m font-semibold text-encre">Caution versée</legend>
            <div className="grid grid-cols-2 gap-3">
              {(["oui", "non"] as const).map((valeur) => {
                const choisi = form.cautionVersee === valeur;
                return (
                  <label
                    key={valeur}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-control border bg-white px-3",
                      choisi ? "border-2 border-baobab px-[11px] text-baobab" : "border-filet text-encre",
                    )}
                  >
                    <input type="radio" name="cautionVersee" checked={choisi} onChange={() => champ("cautionVersee", valeur)} className="size-5 accent-baobab" />
                    <span className="font-semibold">{valeur === "oui" ? "Oui" : "Non"}</span>
                  </label>
                );
              })}
            </div>
            {erreurs.cautionVersee && <FieldError id="erreur-caution-versee">{erreurs.cautionVersee}</FieldError>}
          </fieldset>
          <FormField label="Jour limite de paiement" help="Le loyer est dû avant ce jour de chaque mois. Exemple : 5 pour avant le 5." error={erreurs.jourLimitePaiement}>
            <Input type="number" min={JOUR_MIN} max={JOUR_MAX} inputMode="numeric" value={form.jourLimitePaiement} onChange={(event) => champ("jourLimitePaiement", event.target.value)} placeholder="5" />
          </FormField>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={enCours}>
            Annuler
          </Button>
          <Button type="submit" variant={invitation ? "soleil" : "default"} disabled={enCours || (mode === "RECHERCHE" && !externe)}>
            {enCours ? <Loader2 aria-hidden className="animate-spin" /> : invitation ? <Send aria-hidden /> : null}
            {invitation ? "Envoyer l'invitation" : "Créer le bail"}
          </Button>
        </div>
      </form>
    </SheetDialog>
  );
}
