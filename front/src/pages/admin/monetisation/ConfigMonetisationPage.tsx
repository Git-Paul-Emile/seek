import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConfigMonetisation, useUpdateConfigMonetisation } from "@/hooks/useMonetisation";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/Switch";
import { BlocChargement, EnTeteAdmin } from "@/components/admin/table/Tableau";

// Modules de revenus (Finances · Monétisation) : un interrupteur par module, une phrase
// qui dit ce qu'il change, puis l'enregistrement.

export default function ConfigMonetisationPage() {
  const { data: config, isLoading } = useConfigMonetisation();
  const updateConfig = useUpdateConfigMonetisation();
  const [miseEnAvantActive, setMiseEnAvantActive] = useState(false);

  useEffect(() => {
    if (config) setMiseEnAvantActive(config.miseEnAvantActive);
  }, [config]);

  const enregistrer = () =>
    updateConfig.mutate(
      { miseEnAvantActive },
      {
        onSuccess: () => toast.success("Configuration enregistrée"),
        onError: () => toast.error("La configuration n'a pas pu être enregistrée. Réessayez."),
      },
    );

  return (
    <div className="max-w-2xl">
      <EnTeteAdmin titre="Monétisation" description="Activez les modules de revenus proposés aux propriétaires." />

      {isLoading ? (
        <BlocChargement label="Chargement de la configuration" />
      ) : (
        <section aria-labelledby="titre-modules" className="rounded-card border border-filet bg-white p-6">
          <h2 id="titre-modules" className="font-display text-h3 font-bold text-encre">
            Modules
          </h2>
          <div className="mt-4 border-t border-filet pt-4">
            <Switch label="Mises en avant payantes" checked={miseEnAvantActive} onChange={setMiseEnAvantActive} className="font-semibold" />
            <p className="text-body-m text-texte2">Les propriétaires peuvent payer une formule pour placer leur annonce en tête des résultats.</p>
          </div>
          <div className="mt-6 grid sm:justify-end">
            <Button onClick={enregistrer} disabled={updateConfig.isPending}>
              {updateConfig.isPending && <Loader2 aria-hidden className="animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
