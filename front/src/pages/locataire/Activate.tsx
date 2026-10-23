import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { activerLocataireApi } from "@/api/locataireAuth";
import type { TypePieceIdentite } from "@/api/locataire";
import { useLocataireAuth } from "@/context/LocataireAuthContext";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";
import { LocataireAuthLayout } from "@/components/locataire/LocataireAuthLayout";
import { SEXES, SITUATIONS_PROFESSIONNELLES, TYPES_PIECE } from "@/components/locataire/identiteOptions";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Activation du compte locataire en trois étapes courtes : mot de passe, identité, pièce.

const LONGUEUR_MIN = 6;

const ETAPES = [
  { titre: "Choisissez votre mot de passe", sousTitre: "Il protège votre espace locataire." },
  { titre: "Votre identité", sousTitre: "Ces informations figurent sur votre bail." },
  { titre: "Votre pièce d'identité", sousTitre: "Votre propriétaire la vérifie avant de confirmer le bail." },
] as const;

const FORMULAIRE_VIDE = {
  password: "",
  confirmPassword: "",
  dateNaissance: "",
  lieuNaissance: "",
  nationalite: "",
  sexe: "",
  situationProfessionnelle: "",
  typePiece: "" as TypePieceIdentite | "",
  numPieceIdentite: "",
  dateDelivrance: "",
  dateExpirationPiece: "",
  autoriteDelivrance: "",
};

type Champ = keyof typeof FORMULAIRE_VIDE;
type Erreurs = Partial<Record<Champ, string>>;

function valider(etape: number, form: typeof FORMULAIRE_VIDE): Erreurs {
  const erreurs: Erreurs = {};
  const requis = (champ: Champ, message: string) => {
    if (!String(form[champ]).trim()) erreurs[champ] = message;
  };
  if (etape === 0) {
    if (form.password.length < LONGUEUR_MIN) erreurs.password = `Le mot de passe doit contenir au moins ${LONGUEUR_MIN} caractères.`;
    if (form.password !== form.confirmPassword) erreurs.confirmPassword = "Les deux mots de passe ne sont pas identiques.";
  }
  if (etape === 1) {
    requis("dateNaissance", "Indiquez votre date de naissance.");
    requis("lieuNaissance", "Indiquez votre lieu de naissance.");
    requis("nationalite", "Indiquez votre nationalité.");
    requis("sexe", "Choisissez votre sexe.");
    requis("situationProfessionnelle", "Choisissez votre situation professionnelle.");
  }
  if (etape === 2) {
    requis("typePiece", "Choisissez le type de pièce.");
    requis("numPieceIdentite", "Indiquez le numéro de la pièce.");
    requis("dateDelivrance", "Indiquez la date de délivrance.");
    requis("dateExpirationPiece", "Indiquez la date d'expiration.");
    requis("autoriteDelivrance", "Indiquez l'autorité qui a délivré la pièce.");
  }
  return erreurs;
}

export default function LocataireActivate() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { setLocataire } = useLocataireAuth();
  const { refreshMe: refreshPublicAccount } = useComptePublicAuth();

  const [etape, setEtape] = useState(0);
  const [form, setForm] = useState(FORMULAIRE_VIDE);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const champ = (nom: Champ) => ({
    value: form[nom],
    onChange: (event: { target: { value: string } }) => {
      setForm((prev) => ({ ...prev, [nom]: event.target.value }));
      setErreurs((prev) => ({ ...prev, [nom]: undefined }));
    },
  });

  if (!token) {
    return (
      <LocataireAuthLayout titre="Lien d'activation incomplet" sousTitre="Vérifiez le lien reçu par SMS ou e-mail, ou demandez-en un nouveau à votre propriétaire.">
        <Button asChild variant="outline" className="w-full">
          <Link to="/locataire/login">Aller à la connexion</Link>
        </Button>
      </LocataireAuthLayout>
    );
  }

  if (success) {
    return (
      <LocataireAuthLayout titre="Compte activé">
        <div className="flex items-start gap-3 rounded-card bg-baobab-100 p-5 text-body-l text-encre">
          <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-baobab" />
          <p>Votre espace locataire est prêt : bail, loyers et quittances au même endroit.</p>
        </div>
        <Button className="mt-6 w-full" onClick={() => navigate("/locataire/dashboard")}>
          Accéder à mon espace
        </Button>
      </LocataireAuthLayout>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nouvellesErreurs = valider(etape, form);
    setErreurs(nouvellesErreurs);
    if (Object.keys(nouvellesErreurs).length > 0) return;
    if (etape < ETAPES.length - 1) {
      setEtape(etape + 1);
      return;
    }
    setIsSubmitting(true);
    try {
      const { confirmPassword: _confirmation, typePiece, ...reste } = form;
      const { locataire } = await activerLocataireApi({
        token,
        ...Object.fromEntries(Object.entries(reste).map(([cle, valeur]) => [cle, valeur.trim() || null])),
        password: form.password,
        typePiece: typePiece || null,
      });
      setLocataire(locataire);
      await refreshPublicAccount();
      setSuccess(true);
    } catch {
      toast.error("L'activation n'a pas abouti. Le lien a peut-être expiré : demandez-en un nouveau à votre propriétaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const { titre, sousTitre } = ETAPES[etape];

  return (
    <LocataireAuthLayout titre={titre} sousTitre={sousTitre} retour={{ to: "/locataire/login", label: "Connexion" }}>
      <p className="mb-3 text-body-m font-semibold text-texte2">
        Étape {etape + 1} sur {ETAPES.length}
      </p>
      <div className="mb-8 grid grid-cols-3 gap-2" aria-hidden>
        {ETAPES.map((_, index) => (
          <span key={index} className={cn("h-1 rounded-full", index <= etape ? "bg-baobab" : "bg-filet")} />
        ))}
      </div>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {etape === 0 && (
          <>
            <FormField label="Mot de passe" help={`${LONGUEUR_MIN} caractères minimum`} error={erreurs.password}>
              <PasswordInput autoComplete="new-password" {...champ("password")} />
            </FormField>
            <FormField label="Confirmer le mot de passe" error={erreurs.confirmPassword}>
              <PasswordInput autoComplete="new-password" {...champ("confirmPassword")} />
            </FormField>
          </>
        )}
        {etape === 1 && (
          <>
            <FormField label="Date de naissance" error={erreurs.dateNaissance}>
              <Input type="date" {...champ("dateNaissance")} />
            </FormField>
            <FormField label="Lieu de naissance" error={erreurs.lieuNaissance}>
              <Input placeholder="Dakar" {...champ("lieuNaissance")} />
            </FormField>
            <FormField label="Nationalité" error={erreurs.nationalite}>
              <Input placeholder="Sénégalaise" {...champ("nationalite")} />
            </FormField>
            <FormField label="Sexe" error={erreurs.sexe}>
              <NativeSelect {...champ("sexe")}>
                <option value="">Choisir</option>
                {SEXES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Situation professionnelle" error={erreurs.situationProfessionnelle}>
              <NativeSelect {...champ("situationProfessionnelle")}>
                <option value="">Choisir</option>
                {SITUATIONS_PROFESSIONNELLES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </>
        )}
        {etape === 2 && (
          <>
            <FormField label="Type de pièce" error={erreurs.typePiece}>
              <NativeSelect {...champ("typePiece")}>
                <option value="">Choisir</option>
                {TYPES_PIECE.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Numéro de la pièce" error={erreurs.numPieceIdentite}>
              <Input className="font-mono" autoComplete="off" {...champ("numPieceIdentite")} />
            </FormField>
            <FormField label="Date de délivrance" error={erreurs.dateDelivrance}>
              <Input type="date" {...champ("dateDelivrance")} />
            </FormField>
            <FormField label="Date d'expiration" error={erreurs.dateExpirationPiece}>
              <Input type="date" {...champ("dateExpirationPiece")} />
            </FormField>
            <FormField label="Autorité de délivrance" error={erreurs.autoriteDelivrance}>
              <Input placeholder="Préfecture de Dakar" {...champ("autoriteDelivrance")} />
            </FormField>
          </>
        )}
        <div className={cn("grid gap-3", etape > 0 && "grid-cols-2")}>
          {etape > 0 && (
            <Button type="button" variant="outline" onClick={() => setEtape(etape - 1)}>
              Retour
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {etape < ETAPES.length - 1 ? "Continuer" : isSubmitting ? "Activation…" : "Activer mon compte"}
          </Button>
        </div>
      </form>
    </LocataireAuthLayout>
  );
}
