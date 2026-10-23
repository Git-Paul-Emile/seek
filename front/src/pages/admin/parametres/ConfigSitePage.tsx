import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CheckCircle, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfigSite, useUpdateConfigSite, useUploadLogoFiligrane, useDeleteLogoFiligrane, ServiceHoursDay } from "@/hooks/useConfigSite";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { Switch } from "@/components/ui/Switch";
import { BlocChargement, EnTeteAdmin, SectionAdmin } from "@/components/admin/table/Tableau";

// Réglages du site public (Configuration · Paramètres du site) : filigrane des photos,
// coordonnées de contact et horaires du service client, une section par sujet.

const JOURS = [
  { key: "lundi", label: "Lundi" },
  { key: "mardi", label: "Mardi" },
  { key: "mercredi", label: "Mercredi" },
  { key: "jeudi", label: "Jeudi" },
  { key: "vendredi", label: "Vendredi" },
  { key: "samedi", label: "Samedi" },
  { key: "dimanche", label: "Dimanche" },
];

const HORAIRES_PAR_DEFAUT: ServiceHoursDay[] = [
  { day: "lundi", isOpen: true, open: "08:00", close: "18:00" },
  { day: "mardi", isOpen: true, open: "08:00", close: "18:00" },
  { day: "mercredi", isOpen: true, open: "08:00", close: "18:00" },
  { day: "jeudi", isOpen: true, open: "08:00", close: "18:00" },
  { day: "vendredi", isOpen: true, open: "08:00", close: "18:00" },
  { day: "samedi", isOpen: true, open: "09:00", close: "18:00" },
  { day: "dimanche", isOpen: false, open: "09:00", close: "13:00" },
];

const HEURES = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`);

/** Complète les horaires enregistrés avec les jours manquants, valeurs par défaut. */
const completerHoraires = (enregistres: ServiceHoursDay[] | undefined): ServiceHoursDay[] => {
  if (!Array.isArray(enregistres) || enregistres.length === 0) return HORAIRES_PAR_DEFAUT;
  const presents = new Set(enregistres.map(({ day }) => day));
  return [...enregistres, ...HORAIRES_PAR_DEFAUT.filter(({ day }) => !presents.has(day))];
};

interface FormConfig {
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  serviceClientHours: ServiceHoursDay[];
}

function SelectHeure({ label, value, onChange }: { label: string; value: string; onChange: (heure: string) => void }) {
  return (
    <NativeSelect aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="w-28">
      {HEURES.map((heure) => (
        <option key={heure} value={heure}>
          {heure}
        </option>
      ))}
    </NativeSelect>
  );
}

export default function ConfigSitePage() {
  const { data: config, isLoading } = useConfigSite();
  const updateConfig = useUpdateConfigSite();
  const uploadLogo = useUploadLogoFiligrane();
  const deleteLogo = useDeleteLogoFiligrane();
  const champLogo = useRef<HTMLInputElement>(null);
  const [apercuLogo, setApercuLogo] = useState<string | null>(null);
  const [logoEnAttente, setLogoEnAttente] = useState<File | null>(null);
  const [form, setForm] = useState<FormConfig>({ contactEmail: "", contactPhone: "", contactAddress: "", serviceClientHours: [] });

  useEffect(() => {
    if (!config) return;
    setForm({
      contactEmail: config.contactEmail,
      contactPhone: config.contactPhone,
      contactAddress: config.contactAddress,
      serviceClientHours: completerHoraires(config.serviceClientHours),
    });
  }, [config]);

  // Libère l'URL temporaire de l'aperçu quand il change ou quand la page se ferme.
  useEffect(() => () => {
    if (apercuLogo) URL.revokeObjectURL(apercuLogo);
  }, [apercuLogo]);

  const changerJour = (jour: string, changements: Partial<ServiceHoursDay>) =>
    setForm((actuel) => ({ ...actuel, serviceClientHours: actuel.serviceClientHours.map((h) => (h.day === jour ? { ...h, ...changements } : h)) }));

  const enregistrer = () =>
    updateConfig.mutate(form, {
      onSuccess: () => toast.success("Paramètres enregistrés"),
      onError: () => toast.error("Les paramètres n'ont pas pu être enregistrés. Réessayez."),
    });

  const choisirLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const fichier = event.target.files?.[0];
    event.target.value = "";
    if (!fichier) return;
    if (fichier.type !== "image/png") {
      toast.error("Choisissez un fichier PNG, de préférence sans fond.");
      return;
    }
    setLogoEnAttente(fichier);
    setApercuLogo(URL.createObjectURL(fichier));
  };

  const oublierLogoEnAttente = () => {
    setLogoEnAttente(null);
    setApercuLogo(null);
  };

  const appliquerLogo = () => {
    if (!logoEnAttente) return;
    uploadLogo.mutate(logoEnAttente, {
      onSuccess: () => {
        toast.success("Filigrane enregistré");
        oublierLogoEnAttente();
      },
      onError: () => toast.error("Le logo n'a pas pu être envoyé. Réessayez."),
    });
  };

  const supprimerLogo = () =>
    deleteLogo.mutate(undefined, {
      onSuccess: () => {
        toast.success("Filigrane supprimé");
        oublierLogoEnAttente();
      },
      onError: () => toast.error("Le filigrane n'a pas pu être supprimé. Réessayez."),
    });

  const logo = apercuLogo ?? config?.logoFiligrane ?? null;

  return (
    <div className="max-w-3xl space-y-6">
      <EnTeteAdmin titre="Paramètres du site" description="Filigrane des photos, coordonnées et horaires affichés sur le site public." />

      {isLoading ? (
        <BlocChargement label="Chargement des paramètres" />
      ) : (
        <>
          <SectionAdmin titre="Filigrane des photos" description="Ce logo est apposé discrètement sur chaque nouvelle photo d'annonce. Un PNG sans fond donne le meilleur rendu.">
            <div className="grid gap-4 sm:grid-cols-[176px_1fr] sm:items-center">
              <button
                type="button"
                onClick={() => champLogo.current?.click()}
                aria-label="Choisir un logo PNG"
                className="flex h-24 w-44 items-center justify-center overflow-hidden rounded-control border-2 border-dashed border-bord-champ bg-surface"
              >
                {logo ? <img src={logo} alt="" className="max-h-full max-w-full object-contain p-2" /> : <ImagePlus aria-hidden className="size-6 text-texte2" />}
              </button>
              <div className="flex flex-wrap gap-2">
                <input ref={champLogo} type="file" accept="image/png" className="hidden" onChange={choisirLogo} />
                {logoEnAttente ? (
                  <>
                    <Button onClick={appliquerLogo} disabled={uploadLogo.isPending}>
                      {uploadLogo.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <CheckCircle aria-hidden />}
                      Appliquer ce logo
                    </Button>
                    <Button variant="outline" onClick={oublierLogoEnAttente} disabled={uploadLogo.isPending}>
                      Annuler
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => champLogo.current?.click()}>
                      <ImagePlus aria-hidden />
                      {config?.logoFiligrane ? "Changer le logo" : "Choisir un logo PNG"}
                    </Button>
                    {config?.logoFiligrane && (
                      <Button variant="outline" onClick={supprimerLogo} disabled={deleteLogo.isPending}>
                        {deleteLogo.isPending ? <Loader2 aria-hidden className="animate-spin" /> : <Trash2 aria-hidden />}
                        Supprimer
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </SectionAdmin>

          <SectionAdmin titre="Coordonnées">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Adresse e-mail">
                <Input type="email" value={form.contactEmail} onChange={(event) => setForm((f) => ({ ...f, contactEmail: event.target.value }))} placeholder="contact@seek.sn" />
              </FormField>
              <FormField label="Téléphone">
                <Input type="tel" value={form.contactPhone} onChange={(event) => setForm((f) => ({ ...f, contactPhone: event.target.value }))} placeholder="+221 77 000 00 00" />
              </FormField>
            </div>
            <div className="mt-5">
              <FormField label="Adresse">
                <Input value={form.contactAddress} onChange={(event) => setForm((f) => ({ ...f, contactAddress: event.target.value }))} placeholder="Dakar, Sénégal" />
              </FormField>
            </div>
          </SectionAdmin>

          <SectionAdmin titre="Horaires du service client">
            <ul className="divide-y divide-filet">
              {JOURS.map(({ key, label }) => {
                const horaires = form.serviceClientHours.find(({ day }) => day === key);
                const ouvert = horaires?.isOpen ?? false;
                return (
                  <li key={key} className="grid min-h-16 items-center gap-3 py-2 sm:grid-cols-[180px_1fr]">
                    <Switch label={label} checked={ouvert} onChange={(isOpen) => changerJour(key, { isOpen })} className="font-semibold" />
                    {ouvert ? (
                      <div className="flex items-center gap-2 text-body-m text-texte2">
                        <SelectHeure label={`${label}, ouverture`} value={horaires?.open ?? "08:00"} onChange={(open) => changerJour(key, { open })} />
                        à
                        <SelectHeure label={`${label}, fermeture`} value={horaires?.close ?? "18:00"} onChange={(close) => changerJour(key, { close })} />
                      </div>
                    ) : (
                      <span className="text-body-m text-texte2">Fermé</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </SectionAdmin>

          <div className="grid sm:justify-end">
            <Button onClick={enregistrer} disabled={updateConfig.isPending}>
              {updateConfig.isPending && <Loader2 aria-hidden className="animate-spin" />}
              Enregistrer les coordonnées et les horaires
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
