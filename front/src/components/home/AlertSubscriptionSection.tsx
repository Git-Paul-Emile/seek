import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/FieldError";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { useAlerteSmsForm } from "@/hooks/useAlerteSmsForm";

// « Soyez prévenu par SMS » : numéro, type, quartier, et c'est parti.

const AlertSubscriptionSection = ({ titreNiveau = "h2" }: { titreNiveau?: "h1" | "h2" }) => {
  const form = useAlerteSmsForm();
  const Titre = titreNiveau;

  return (
    <section id="alertes" className="pb-12 lg:pb-20" aria-labelledby="alerte-titre">
      <div className="container">
        <div className="rounded-sheet bg-surface p-6 lg:grid lg:grid-cols-[1fr_1.4fr] lg:items-center lg:gap-10 lg:p-10">
          <div className="lg:flex lg:items-start lg:gap-5">
            <span aria-hidden className="flex size-16 shrink-0 items-center justify-center rounded-full bg-baobab-100 text-baobab">
              <Bell className="size-7" strokeWidth={1.75} />
            </span>
            <div className="mt-5 lg:mt-0">
              <Titre id="alerte-titre" className="font-body text-h3 font-bold text-encre lg:text-[28px] lg:leading-[36px]">
                Soyez prévenu par SMS
              </Titre>
              <p className="mt-2 text-body-l text-texte2">
                Dès qu'un bien correspond à vos critères, vous recevez un SMS. Désactivable à tout moment.
              </p>
            </div>
          </div>

          {form.isSuccess ? (
            <div role="status" className="mt-6 rounded-card bg-baobab-100 p-5 lg:mt-0">
              <p className="flex items-center gap-2 text-body-l font-semibold text-baobab">
                <Check aria-hidden className="size-5" />
                Votre alerte est active.
              </p>
              <p className="mt-1 text-body-m text-encre">Vous recevrez un SMS dès qu'une annonce correspond.</p>
              <Button variant="link" className="mt-2" onClick={form.reset}>
                Créer une autre alerte
              </Button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                form.submit();
              }}
              className="mt-6 space-y-4 lg:mt-0"
            >
              <div>
                <label htmlFor="alerte-telephone" className="mb-2 block text-body-m font-semibold text-encre">
                  Votre numéro
                </label>
                <PhoneInput
                  id="alerte-telephone"
                  value={form.telephone}
                  onChange={form.setTelephone}
                  onBlur={() => form.telephone && form.verifierTelephone()}
                  readOnly={form.telephoneVerrouille}
                  aria-invalid={Boolean(form.erreurTelephone)}
                  aria-describedby={form.erreurTelephone ? "alerte-telephone-erreur" : undefined}
                />
                {form.erreurTelephone && <FieldError id="alerte-telephone-erreur">{form.erreurTelephone}</FieldError>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="alerte-type" className="mb-2 block text-body-m font-semibold text-encre">
                    Type de logement
                  </label>
                  <NativeSelect id="alerte-type" value={form.typeLogement} onChange={(e) => form.setTypeLogement(e.target.value)}>
                    <option value="">Tous les types</option>
                    {form.typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div>
                  <label htmlFor="alerte-quartier" className="mb-2 block text-body-m font-semibold text-encre">
                    Quartier
                  </label>
                  <NativeSelect id="alerte-quartier" value={form.quartier} onChange={(e) => form.setQuartier(e.target.value)}>
                    <option value="">Tous les quartiers</option>
                    {form.quartierOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
              {form.erreurEnvoi && <FieldError id="alerte-envoi-erreur">{form.erreurEnvoi}</FieldError>}
              <Button type="submit" className="w-full" disabled={form.isPending}>
                {form.isPending && <Loader2 aria-hidden className="animate-spin" />}
                {form.isPending ? "Envoi en cours…" : "Créer mon alerte"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default AlertSubscriptionSection;
