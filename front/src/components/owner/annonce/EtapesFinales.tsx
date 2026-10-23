import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { formatFcfa, formatSaisieMontant, libelleFrequence, parseMontant } from "@/lib/fcfa";
import { formatDateLongue } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { CarteChoix, IntituleGroupe } from "./ChampsAnnonce";
import { DESCRIPTION_MAX, DESCRIPTION_MIN, FREQUENCES, type EtapeId } from "./etapes";
import type { AnnonceForm } from "./useAnnonceForm";

// Étapes 7 et 8 : prix et disponibilité, puis titre, description et relecture.

const STATUT_LIBRE = "libre";
const TITRE_MAX = 200;

function ChampMontant({ valeur, onChange }: { valeur: string; onChange: (chiffres: string) => void }) {
  return (
    <div className="relative">
      <Input
        inputMode="numeric"
        value={formatSaisieMontant(valeur)}
        onChange={(e) => onChange(String(parseMontant(e.target.value) ?? ""))}
        className="pr-20 text-price font-bold"
      />
      <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-body-l font-semibold text-texte2">
        FCFA
      </span>
    </div>
  );
}

export function EtapePrix({ form }: { form: AnnonceForm }) {
  const { v, maj, listes, erreurs } = form;
  const vente = v.frequence === "unique";
  return (
    <div className="space-y-6">
      <section>
        <IntituleGroupe>Le bien est actuellement…</IntituleGroupe>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {listes.statuts.map((statut) => (
            <CarteChoix
              key={statut.id}
              selectionne={v.statutBien?.id === statut.id}
              onClick={() => maj({ statutBien: statut })}
              className="min-h-14 items-center px-4 text-title font-semibold text-encre"
            >
              {statut.nom}
            </CarteChoix>
          ))}
        </div>
        {erreurs.statut && <FieldError id="erreur-statut">{erreurs.statut}</FieldError>}
      </section>
      <FormField label={vente ? "Prix de vente" : "Loyer"} error={erreurs.prix}>
        <ChampMontant valeur={v.prix} onChange={(prix) => maj({ prix })} />
      </FormField>
      <FormField label="Fréquence de paiement">
        <NativeSelect value={v.frequence} onChange={(e) => maj({ frequence: e.target.value })}>
          {FREQUENCES.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </NativeSelect>
      </FormField>
      {!vente && (
        <FormField label="Caution" hint="(facultatif)" help="Montant demandé à l'entrée et rendu en fin de bail.">
          <ChampMontant valeur={v.caution} onChange={(caution) => maj({ caution })} />
        </FormField>
      )}
      {v.statutBien && v.statutBien.slug !== STATUT_LIBRE && (
        <FormField label="Disponible à partir du" hint="(facultatif)">
          <Input type="date" value={v.disponibleLe} onChange={(e) => maj({ disponibleLe: e.target.value })} />
        </FormField>
      )}
    </div>
  );
}

function LigneResume({ titre, valeur, etape, form }: { titre: string; valeur: string; etape: EtapeId; form: AnnonceForm }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-4 py-4">
      <div className="min-w-0">
        <dt className="text-body-m text-texte2">{titre}</dt>
        <dd className="mt-0.5 text-body-l text-encre">{valeur || "Non renseigné"}</dd>
      </div>
      <button type="button" onClick={() => form.allerA(etape)} className="text-body-m font-semibold text-baobab hover:underline">
        Modifier
      </button>
    </div>
  );
}

export function EtapeRecapitulatif({ form }: { form: AnnonceForm }) {
  const { v, maj, erreurs } = form;
  const longueur = v.description.trim().length;
  const pieces = [
    v.surface && `${v.surface} m²`,
    v.nbChambres && `${v.nbChambres} ch.`,
    v.nbSdb && `${v.nbSdb} sdb`,
    v.nbSalons && `${v.nbSalons} salon${v.nbSalons > 1 ? "s" : ""}`,
  ].filter(Boolean);
  const frequence = libelleFrequence(v.frequence);
  const prix = v.prix ? `${formatFcfa(Number(v.prix))}${frequence ? ` par ${frequence}` : ""}` : "";
  const nbPhotos = v.photosExistantes.length + v.nouvellesPhotos.length;

  return (
    <div className="space-y-8">
      <FormField label="Titre de l'annonce" error={erreurs.titre} help="Exemple : Appartement F4 vue mer aux Almadies">
        <Input value={v.titre} maxLength={TITRE_MAX} onChange={(e) => maj({ titre: e.target.value })} />
      </FormField>
      <div>
        <FormField label="Description" error={erreurs.description}>
          <Textarea
            rows={7}
            value={v.description}
            onChange={(e) => maj({ description: e.target.value })}
            placeholder="Le logement, le quartier, les transports, ce qui le rend agréable à vivre."
          />
        </FormField>
        <p className={cn("mt-2 text-right text-caption", longueur > DESCRIPTION_MAX ? "font-bold text-encre" : "text-texte2")}>
          {longueur} / {DESCRIPTION_MAX} caractères, {DESCRIPTION_MIN} minimum
        </p>
      </div>
      <section>
        <IntituleGroupe>Relisez votre annonce</IntituleGroupe>
        <dl className="divide-y divide-filet rounded-card border border-filet px-5">
          <LigneResume form={form} etape="type" titre="Type" valeur={[v.typeLogement?.nom, v.typeTransaction?.nom].filter(Boolean).join(" · ")} />
          <LigneResume form={form} etape="localisation" titre="Localisation" valeur={[v.quartier?.nom, v.ville?.nom, v.pays?.nom].filter(Boolean).join(", ")} />
          <LigneResume form={form} etape="caracteristiques" titre="Caractéristiques" valeur={pieces.join(" · ")} />
          <LigneResume form={form} etape="equipements" titre="Équipements" valeur={v.equipementIds.length ? `${v.equipementIds.length} sélectionné(s)` : ""} />
          <LigneResume form={form} etape="meubles" titre="Meubles" valeur={v.meuble ? `Meublé · ${v.meubleIds.length} meuble(s)` : "Non meublé"} />
          <LigneResume form={form} etape="photos" titre="Photos" valeur={`${nbPhotos} photo${nbPhotos > 1 ? "s" : ""}${v.video || v.videoExistante ? " et une vidéo" : ""}`} />
          <LigneResume
            form={form}
            etape="prix"
            titre="Prix"
            valeur={[prix, v.statutBien?.nom, v.disponibleLe ? `disponible le ${formatDateLongue(v.disponibleLe)}` : null].filter(Boolean).join(" · ")}
          />
        </dl>
      </section>
    </div>
  );
}
