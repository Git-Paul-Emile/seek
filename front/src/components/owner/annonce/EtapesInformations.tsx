import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Switch } from "@/components/ui/Switch";
import { PropertyIllustration } from "@/components/brand/PropertyIllustration";
import { illustrationForType } from "@/components/brand/illustrationKind";
import DynamicForm from "@/components/form/DynamicForm";
import { CarteChoix, Compteur, IntituleGroupe } from "./ChampsAnnonce";
import type { AnnonceForm } from "./useAnnonceForm";

// Étapes 1 à 3 : type de bien, localisation, caractéristiques.

export function EtapeType({ form }: { form: AnnonceForm }) {
  const { v, maj, listes, erreurs, choisirType, verificationType } = form;
  return (
    <div className="space-y-8">
      <section>
        <IntituleGroupe>Vous proposez ce bien…</IntituleGroupe>
        <div className="grid grid-cols-2 gap-3">
          {listes.transactions.map((transaction) => (
            <CarteChoix
              key={transaction.id}
              selectionne={v.typeTransaction?.id === transaction.id}
              onClick={() =>
                maj({ typeTransaction: transaction, frequence: /vente|achat/i.test(transaction.slug) ? "unique" : v.frequence === "unique" ? "mensuel" : v.frequence })
              }
              className="min-h-16 items-center px-4 text-title font-semibold text-encre"
            >
              {transaction.nom}
            </CarteChoix>
          ))}
        </div>
        {erreurs.transaction && <FieldError id="erreur-transaction">{erreurs.transaction}</FieldError>}
      </section>

      <section>
        <IntituleGroupe>Type de bien</IntituleGroupe>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {listes.types.map((type) => (
            <CarteChoix
              key={type.id}
              selectionne={v.typeLogement?.id === type.id}
              disabled={verificationType}
              onClick={() => choisirType(type)}
              className="flex-col overflow-hidden"
            >
              <span className="block aspect-[4/3] w-full">
                <PropertyIllustration kind={illustrationForType(type.slug)} />
              </span>
              <span className="px-4 py-3 text-title font-semibold text-encre">{type.nom}</span>
            </CarteChoix>
          ))}
        </div>
        {erreurs.type && <FieldError id="erreur-type">{erreurs.type}</FieldError>}
      </section>
    </div>
  );
}

export function EtapeLocalisation({ form }: { form: AnnonceForm }) {
  const { v, maj, listes, erreurs } = form;
  return (
    <div className="space-y-5">
      <FormField label="Pays" error={erreurs.pays}>
        <NativeSelect
          value={v.pays?.id ?? ""}
          onChange={(e) => maj({ pays: listes.pays.find((p) => p.id === e.target.value) ?? null, ville: null, quartier: null })}
        >
          <option value="">Choisir un pays</option>
          {listes.pays.map((p) => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField label="Région" error={erreurs.region}>
        <NativeSelect
          value={v.ville?.id ?? ""}
          disabled={!v.pays || listes.villesChargement}
          onChange={(e) =>
            maj({ ville: listes.villes.find((x) => x.id === e.target.value) ?? null, quartier: null, latitude: null, longitude: null })
          }
        >
          <option value="">{v.pays ? "Choisir une région" : "Choisissez d'abord le pays"}</option>
          {listes.villes.map((x) => (
            <option key={x.id} value={x.id}>{x.nom}</option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField label="Quartier" error={erreurs.quartier}>
        <NativeSelect
          value={v.quartier?.id ?? ""}
          disabled={!v.ville || listes.quartiersChargement}
          onChange={(e) => {
            const quartier = listes.quartiers.find((q) => q.id === e.target.value) ?? null;
            maj({ quartier, latitude: quartier?.latitude ?? null, longitude: quartier?.longitude ?? null });
          }}
        >
          <option value="">
            {!v.ville ? "Choisissez d'abord la région" : listes.quartiers.length ? "Choisir un quartier" : "Aucun quartier disponible"}
          </option>
          {listes.quartiers.map((q) => (
            <option key={q.id} value={q.id}>{q.nom}</option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField label="Adresse" hint="(facultatif)" help="Elle sert à placer le bien sur la carte, elle n'est pas affichée en entier.">
        <Input value={v.adresse} onChange={(e) => maj({ adresse: e.target.value })} placeholder="12 rue de Thiong" />
      </FormField>
      <FormField label="Point de repère" hint="(facultatif)">
        <Input value={v.pointRepere} onChange={(e) => maj({ pointRepere: e.target.value })} placeholder="En face de la pharmacie" />
      </FormField>
    </div>
  );
}

const PIECES = [
  { cle: "nbChambres", label: "Chambres" },
  { cle: "nbSdb", label: "Salles de bain" },
  { cle: "nbSalons", label: "Salons" },
  { cle: "nbCuisines", label: "Cuisines" },
  { cle: "nbWc", label: "Toilettes" },
] as const;

const OPTIONS = [
  { cle: "meuble", label: "Meublé" },
  { cle: "parking", label: "Avec parking" },
  { cle: "ascenseur", label: "Avec ascenseur" },
  { cle: "fumeurs", label: "Fumeurs acceptés" },
  { cle: "animaux", label: "Animaux acceptés" },
] as const;

export function EtapeCaracteristiques({ form }: { form: AnnonceForm }) {
  const { v, maj, champsSysteme, surfaceObligatoire, erreurs, erreursChamps, setErreursChamps } = form;
  if (!v.typeLogement) {
    return <p className="text-body-l text-texte2">Choisissez d'abord le type de bien à l'étape 1.</p>;
  }
  const pieces = PIECES.filter((p) => champsSysteme.has(p.cle));
  const options = OPTIONS.filter((o) => champsSysteme.has(o.cle));

  return (
    <div className="space-y-8">
      {(champsSysteme.has("surface") || champsSysteme.has("etage")) && (
        <div className="grid grid-cols-2 gap-4">
          {champsSysteme.has("surface") && (
            <FormField label="Surface habitable" hint={surfaceObligatoire ? undefined : "(facultatif)"} error={erreurs.surface}>
              <div className="relative">
                <Input inputMode="numeric" value={v.surface} onChange={(e) => maj({ surface: e.target.value.replace(/\D/g, "") })} className="pr-12" />
                <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-body-l text-texte2">m²</span>
              </div>
            </FormField>
          )}
          {champsSysteme.has("etage") && (
            <FormField label="Étage" help="0 pour le rez-de-chaussée">
              <Input inputMode="numeric" value={v.etage} onChange={(e) => maj({ etage: e.target.value.replace(/\D/g, "") })} />
            </FormField>
          )}
        </div>
      )}

      {pieces.length > 0 && (
        <section>
          <IntituleGroupe>Pièces</IntituleGroupe>
          {pieces.map(({ cle, label }) => (
            <Compteur key={cle} label={label} valeur={v[cle]} onChange={(valeur) => form.majChamp(cle, valeur)} />
          ))}
        </section>
      )}

      {options.length > 0 && (
        <section>
          <IntituleGroupe>Le logement est…</IntituleGroupe>
          <div className="divide-y divide-filet">
            {options.map(({ cle, label }) => (
              <Switch
                key={cle}
                label={label}
                checked={v[cle]}
                onChange={(valeur) => form.majChamp(cle, valeur)}
                className="flex min-h-[64px] w-full justify-between"
              />
            ))}
          </div>
        </section>
      )}

      {form.champsPersonnalises.length > 0 && (
        <section>
          <IntituleGroupe>Informations propres à ce type de bien</IntituleGroupe>
          <DynamicForm
            champs={form.champsPersonnalises}
            values={v.champsValeurs}
            errors={erreursChamps}
            loading={form.champsChargement}
            onChange={(champId, valeur) => {
              maj({ champsValeurs: { ...v.champsValeurs, [champId]: valeur } });
              if (erreursChamps[champId]) {
                setErreursChamps(Object.fromEntries(Object.entries(erreursChamps).filter(([id]) => id !== champId)));
              }
            }}
          />
        </section>
      )}

      {champsSysteme.size === 0 && form.champsPersonnalises.length === 0 && !form.champsChargement && (
        <p className="text-body-l text-texte2">Aucune caractéristique à renseigner pour ce type de bien.</p>
      )}
    </div>
  );
}
