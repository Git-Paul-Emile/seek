import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { FormField } from "@/components/ui/FormField";
import { Switch } from "@/components/ui/Switch";
import { Compteur } from "@/components/owner/annonce/ChampsAnnonce";
import { useCreateLocataire } from "@/hooks/useLocataire";
import { numeroInternational } from "@/lib/telephone";

// Inviter un locataire : le propriétaire saisit l'essentiel, le locataire complète sa fiche
// depuis le lien d'activation.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OCCUPANTS_MAX = 20;

interface Formulaire {
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  nbOccupants: number;
  presenceEnfants: boolean;
}

const valider = (f: Formulaire): Record<string, string> => {
  const erreurs: Record<string, string> = {};
  if (!f.prenom.trim()) erreurs.prenom = "Indiquez le prénom du locataire.";
  if (!f.nom.trim()) erreurs.nom = "Indiquez le nom du locataire.";
  if (!numeroInternational(f.telephone)) erreurs.telephone = "Saisissez les 9 chiffres du numéro, par exemple 77 123 45 67.";
  if (f.email.trim() && !EMAIL.test(f.email.trim())) erreurs.email = "Vérifiez l'adresse e-mail, par exemple prenom@exemple.com.";
  return erreurs;
};

export default function AddLocataire() {
  const navigate = useNavigate();
  const creation = useCreateLocataire();
  const [form, setForm] = useState<Formulaire>({
    prenom: "", nom: "", telephone: "", email: "", nbOccupants: 1, presenceEnfants: false,
  });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const maj = (partiel: Partial<Formulaire>) => setForm((prec) => ({ ...prec, ...partiel }));

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    const nouvelles = valider(form);
    setErreurs(nouvelles);
    if (Object.keys(nouvelles).length > 0) return;
    try {
      await creation.mutateAsync({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: numeroInternational(form.telephone) ?? form.telephone,
        email: form.email.trim() || null,
        nbOccupants: form.nbOccupants,
        presenceEnfants: form.presenceEnfants,
      });
      toast.success(`Fiche de ${form.prenom.trim()} créée. Envoyez-lui le lien d'activation depuis sa fiche.`);
      navigate("/owner/locataires");
    } catch {
      toast.error("La fiche n'a pas pu être créée. Vérifiez que ce numéro n'est pas déjà utilisé.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link to="/owner/locataires" className="text-body-m font-semibold text-baobab hover:underline">
          Locataires
        </Link>
        <h1 className="mt-1 font-display text-h2 font-bold text-encre lg:text-h1">Inviter un locataire</h1>
        <p className="mt-1 text-body-l text-texte2">Il complétera sa pièce d'identité et ses coordonnées depuis son lien d'activation.</p>
      </header>

      <form onSubmit={envoyer} noValidate className="space-y-5 rounded-card border border-filet bg-white p-5 lg:p-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Prénom" error={erreurs.prenom}>
            <Input value={form.prenom} autoComplete="off" onChange={(e) => maj({ prenom: e.target.value })} />
          </FormField>
          <FormField label="Nom" error={erreurs.nom}>
            <Input value={form.nom} autoComplete="off" onChange={(e) => maj({ nom: e.target.value })} />
          </FormField>
        </div>
        <FormField label="Téléphone" error={erreurs.telephone} help="Le lien d'activation est envoyé par SMS à ce numéro.">
          <PhoneInput value={form.telephone} onChange={(telephone) => maj({ telephone })} />
        </FormField>
        <FormField label="E-mail" hint="(facultatif)" error={erreurs.email}>
          <Input type="email" value={form.email} onChange={(e) => maj({ email: e.target.value })} />
        </FormField>
        <div>
          <Compteur
            label="Nombre d'occupants"
            valeur={form.nbOccupants}
            min={1}
            max={OCCUPANTS_MAX}
            onChange={(nbOccupants) => maj({ nbOccupants })}
          />
          <Switch
            label="Présence d'enfants"
            checked={form.presenceEnfants}
            onChange={(presenceEnfants) => maj({ presenceEnfants })}
            className="flex min-h-[64px] w-full justify-between border-t border-filet"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button asChild variant="outline" className="w-[38%] sm:w-auto">
            <Link to="/owner/locataires">Annuler</Link>
          </Button>
          <Button type="submit" disabled={creation.isPending} className="flex-1 sm:flex-none">
            {creation.isPending ? "Création…" : "Créer la fiche"}
          </Button>
        </div>
      </form>
    </div>
  );
}
