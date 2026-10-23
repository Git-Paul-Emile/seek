import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/FieldError";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { useComptePublicConnexion, type Onglet } from "@/hooks/useComptePublicConnexion";

// Compte visiteur : demandé pour garder des favoris ou gérer ses alertes.

const ONGLETS: { value: Onglet; label: string }[] = [
  { value: "inscription", label: "Créer un compte" },
  { value: "connexion", label: "Se connecter" },
];

interface Props {
  onClose: () => void;
  hasPendingBien?: boolean;
}

export default function FavorisAuthModal({ onClose, hasPendingBien = false }: Props) {
  const c = useComptePublicConnexion({ hasPendingBien, onSuccess: onClose });
  const { erreurs } = c;

  return (
    <SheetDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={hasPendingBien ? "Gardez cette annonce" : "Votre compte Seek"}
      description="Retrouvez vos favoris et vos alertes sur tous vos appareils."
    >
      <SegmentedControl label="Choix du formulaire" options={ONGLETS} value={c.onglet} onChange={c.changerOnglet} className="w-full [&>button]:flex-1" />

      {c.onglet === "inscription" ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void c.inscrire();
          }}
          className="mt-6 space-y-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prénom" error={erreurs.prenom}>
              <Input value={c.inscription.prenom} onChange={(e) => c.majInscription("prenom", e.target.value)} autoComplete="given-name" />
            </FormField>
            <FormField label="Nom" error={erreurs.nom}>
              <Input value={c.inscription.nom} onChange={(e) => c.majInscription("nom", e.target.value)} autoComplete="family-name" />
            </FormField>
          </div>
          <FormField label="Téléphone" help="Il sert à vous connecter." error={erreurs.telephone}>
            <Input type="tel" inputMode="tel" value={c.inscription.telephone} onChange={(e) => c.majInscription("telephone", e.target.value)} autoComplete="tel" />
          </FormField>
          <FormField label="E-mail" hint="(facultatif)" error={erreurs.email}>
            <Input type="email" value={c.inscription.email ?? ""} onChange={(e) => c.majInscription("email", e.target.value)} autoComplete="email" />
          </FormField>
          <FormField label="Mot de passe" help="6 caractères au moins." error={erreurs.password}>
            <PasswordInput value={c.inscription.password} onChange={(e) => c.majInscription("password", e.target.value)} autoComplete="new-password" />
          </FormField>
          {erreurs.formulaire && <FieldError id="inscription-erreur">{erreurs.formulaire}</FieldError>}
          <Button type="submit" className="w-full" disabled={c.chargement}>
            {c.chargement && <Loader2 aria-hidden className="animate-spin" />}
            {c.chargement ? "Création en cours…" : hasPendingBien ? "Créer mon compte et garder l'annonce" : "Créer mon compte"}
          </Button>
        </form>
      ) : (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void c.connecter();
          }}
          className="mt-6 space-y-5"
        >
          <FormField label="Téléphone" error={erreurs.telephone}>
            <Input type="tel" inputMode="tel" value={c.connexion.telephone} onChange={(e) => c.majConnexion("telephone", e.target.value)} autoComplete="tel" />
          </FormField>
          <FormField label="Mot de passe" error={erreurs.password}>
            <PasswordInput value={c.connexion.password} onChange={(e) => c.majConnexion("password", e.target.value)} autoComplete="current-password" />
          </FormField>
          {erreurs.formulaire && <FieldError id="connexion-erreur">{erreurs.formulaire}</FieldError>}
          <Button type="submit" className="w-full" disabled={c.chargement}>
            {c.chargement && <Loader2 aria-hidden className="animate-spin" />}
            {c.chargement ? "Connexion en cours…" : "Se connecter"}
          </Button>
        </form>
      )}
    </SheetDialog>
  );
}
