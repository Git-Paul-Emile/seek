import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { updateProfileApi, deleteProfileApi, meOwnerApi, getOwnScoreApi } from "@/api/ownerAuth";
import { useVerificationStatus } from "@/hooks/useVerification";
import { Button, buttonVariants } from "@/components/ui/button";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/NativeSelect";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SheetDialog } from "@/components/ui/SheetDialog";
import { SkForm } from "@/components/ui/Skeleton";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
import { TrustScoreFull } from "@/components/ui/TrustScoreBadge";
import NotificationChannelsSettings from "@/components/owner/NotificationChannelsSettings";
import { formatDateLongue } from "@/lib/dates";
import { messageErreurApi } from "@/lib/erreurApi";

// Profil du propriétaire, au modèle du profil locataire (lot 3) : une carte par sujet
// (identité vérifiée, score, informations, notifications, suppression du compte).

interface Formulaire {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  sexe: string;
  password: string;
  confirmPassword: string;
}

const STATUT_VERIFICATION: Record<string, { label: string; tone: StatusTone; texte: string }> = {
  NOT_VERIFIED: { label: "Non vérifiée", tone: "neutre", texte: "Pour publier des annonces et gérer vos biens, vérifiez votre identité." },
  PENDING: { label: "En attente", tone: "attente", texte: "Votre demande est en cours d'examen. Vous ne pouvez pas en envoyer une nouvelle pour l'instant." },
  VERIFIED: { label: "Vérifiée", tone: "positif", texte: "Votre identité est vérifiée." },
  REJECTED: { label: "Refusée", tone: "alerte", texte: "Vos documents n'ont pas été acceptés. Envoyez une nouvelle demande." },
};

function Carte({ titre, actions, children }: { titre: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={titre} className="rounded-card bg-white p-5 lg:p-6">
      <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-3">
        <h2 className="font-display text-h3 font-bold text-encre">{titre}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

function CarteVerification() {
  const { data: statut, isLoading } = useVerificationStatus();
  const [apercu, setApercu] = useState<{ src: string; libelle: string } | null>(null);
  const cle = statut?.statut ?? "NOT_VERIFIED";
  const { label, tone, texte } = STATUT_VERIFICATION[cle] ?? STATUT_VERIFICATION.NOT_VERIFIED;
  const documents = statut?.documents;
  const pieces = [
    { src: documents?.pieceIdentiteRecto, libelle: documents?.typePiece === "PASSEPORT" ? "Passeport" : "Carte d'identité, recto" },
    { src: documents?.pieceIdentiteVerso, libelle: "Carte d'identité, verso" },
    { src: documents?.selfie, libelle: "Selfie" },
  ].filter((piece): piece is { src: string; libelle: string } => Boolean(piece.src));
  const piecesVisibles = cle === "VERIFIED" || cle === "PENDING";

  return (
    <Carte titre="Vérification d'identité" actions={isLoading ? undefined : <StatusBadge tone={tone}>{label}</StatusBadge>}>
      {isLoading ? (
        <Loader2 aria-label="Chargement" className="mx-auto size-6 animate-spin text-baobab" />
      ) : (
        <>
          <p className="text-body-m text-texte2">{texte}</p>
          {cle === "VERIFIED" && statut?.verifiedAt && <p className="mt-1 text-body-m text-texte2">Vérifiée le {formatDateLongue(statut.verifiedAt)}.</p>}
          {cle === "REJECTED" && documents?.motifRejet && (
            <p className="mt-4 rounded-control bg-soleil-100 p-4 text-body-m text-encre">
              <span className="font-semibold">Motif : </span>
              {documents.motifRejet}
            </p>
          )}
          {piecesVisibles && pieces.length > 0 && (
            <ul className="mt-4 grid grid-cols-3 gap-3">
              {pieces.map((piece) => (
                <li key={piece.libelle}>
                  <button
                    type="button"
                    onClick={() => setApercu(piece)}
                    aria-label={`Agrandir : ${piece.libelle}`}
                    className="block aspect-[4/3] w-full overflow-hidden rounded-control border border-filet bg-surface"
                  >
                    <img src={piece.src} alt="" className="size-full object-cover" />
                  </button>
                  <p className="mt-1 text-caption text-texte2">{piece.libelle}</p>
                </li>
              ))}
            </ul>
          )}
          {(cle === "NOT_VERIFIED" || cle === "REJECTED") && (
            <Link to="/owner/verification" className={buttonVariants({ className: "mt-4" })}>
              <ShieldCheck aria-hidden />
              {cle === "REJECTED" ? "Envoyer une nouvelle demande" : "Vérifier mon identité"}
            </Link>
          )}
        </>
      )}
      <SheetDialog open={Boolean(apercu)} onOpenChange={(open) => !open && setApercu(null)} title={apercu?.libelle ?? "Document"} className="sm:max-w-3xl">
        {apercu && <img src={apercu.src} alt={apercu.libelle} className="max-h-[70vh] w-full rounded-control object-contain" />}
      </SheetDialog>
    </Carte>
  );
}

export default function Profile() {
  const { owner, setOwner, logout } = useOwnerAuth();
  const navigate = useNavigate();
  const { data: score } = useQuery({ queryKey: ["owner-trust-score"], queryFn: () => getOwnScoreApi().then((r) => r.data.data.score) });
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [suppression, setSuppression] = useState(false);
  const [confirmerSuppression, setConfirmerSuppression] = useState(false);
  const [erreurConfirmation, setErreurConfirmation] = useState<string>();
  const [form, setForm] = useState<Formulaire>({ prenom: "", nom: "", email: "", telephone: "", sexe: "", password: "", confirmPassword: "" });

  useEffect(() => {
    meOwnerApi()
      .then(({ data }) => {
        const profil = data.data;
        setForm((actuel) => ({
          ...actuel,
          prenom: profil.prenom ?? "",
          nom: profil.nom ?? "",
          email: profil.email ?? "",
          telephone: profil.telephone ?? "",
          sexe: profil.sexe ?? "",
        }));
      })
      .catch(() => toast.error("Le profil n'a pas pu être chargé. Rechargez la page."))
      .finally(() => setChargement(false));
  }, []);

  const champ = (cle: keyof Formulaire) => (event: { target: { value: string } }) => setForm((actuel) => ({ ...actuel, [cle]: event.target.value }));

  const enregistrer = async (event: FormEvent) => {
    event.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      setErreurConfirmation("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    setErreurConfirmation(undefined);
    setEnregistrement(true);
    try {
      const { data } = await updateProfileApi({
        prenom: form.prenom,
        nom: form.nom,
        email: form.email || null,
        sexe: form.sexe || null,
        ...(form.telephone !== owner?.telephone ? { telephone: form.telephone } : {}),
        ...(form.password ? { password: form.password } : {}),
      });
      setOwner(data.data);
      toast.success("Profil enregistré");
      setForm((actuel) => ({ ...actuel, password: "", confirmPassword: "" }));
    } catch (error) {
      toast.error(messageErreurApi(error, "Le profil n'a pas pu être enregistré. Réessayez."));
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimerCompte = async () => {
    setSuppression(true);
    try {
      await deleteProfileApi();
      await logout();
      navigate("/proprietaires");
    } catch {
      toast.error("Le compte n'a pas pu être supprimé. Réessayez.");
      setConfirmerSuppression(false);
    } finally {
      setSuppression(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-h2 font-bold text-encre lg:text-h1">Mon profil</h1>
        <p className="mt-1 text-body-l text-texte2">Vos informations, votre vérification d'identité et vos préférences.</p>
      </header>

      <CarteVerification />

      {score && (
        <div>
          <TrustScoreFull score={score} />
          <p className="mt-2 px-1 text-caption text-texte2">Ce score est visible par les visiteurs de vos annonces. Une identité vérifiée l'améliore.</p>
        </div>
      )}

      {chargement ? (
        <SkForm fields={6} />
      ) : (
        <Carte titre="Informations personnelles">
          <form onSubmit={enregistrer} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Prénom">
                <Input autoComplete="given-name" value={form.prenom} onChange={champ("prenom")} />
              </FormField>
              <FormField label="Nom">
                <Input autoComplete="family-name" value={form.nom} onChange={champ("nom")} />
              </FormField>
            </div>
            <FormField label="Genre" hint="Facultatif">
              <NativeSelect value={form.sexe} onChange={champ("sexe")}>
                <option value="">Ne pas préciser</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
              </NativeSelect>
            </FormField>
            <FormField label="Téléphone">
              <Input type="tel" autoComplete="tel" value={form.telephone} onChange={champ("telephone")} placeholder="77 000 00 00" />
            </FormField>
            <FormField label="Adresse e-mail" hint="Facultatif">
              <Input type="email" autoComplete="email" value={form.email} onChange={champ("email")} placeholder="vous@exemple.com" />
            </FormField>
            <fieldset className="space-y-5 border-t border-filet pt-5">
              <legend className="pt-5 text-body-m font-semibold text-encre">Changer le mot de passe</legend>
              <FormField label="Nouveau mot de passe" help="Laissez vide pour garder le mot de passe actuel.">
                <PasswordInput autoComplete="new-password" value={form.password} onChange={champ("password")} />
              </FormField>
              <FormField label="Confirmer le nouveau mot de passe" error={erreurConfirmation}>
                <PasswordInput autoComplete="new-password" value={form.confirmPassword} onChange={champ("confirmPassword")} />
              </FormField>
            </fieldset>
            <div className="grid sm:justify-end">
              <Button type="submit" disabled={enregistrement}>
                {enregistrement && <Loader2 aria-hidden className="animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </Carte>
      )}

      <NotificationChannelsSettings />

      <Carte titre="Supprimer mon compte">
        <p className="text-body-m text-texte2">La suppression est définitive. Vos annonces seront supprimées avec le compte.</p>
        <Button variant="outline" className="mt-4" onClick={() => setConfirmerSuppression(true)} disabled={suppression}>
          Supprimer mon compte
        </Button>
      </Carte>

      <ConfirmModal
        open={confirmerSuppression}
        title="Supprimer votre compte ?"
        message="Toutes vos annonces seront supprimées. Vous ne pourrez récupérer ni votre compte ni vos données."
        confirmLabel="Supprimer mon compte"
        isPending={suppression}
        onConfirm={supprimerCompte}
        onCancel={() => setConfirmerSuppression(false)}
      />
    </div>
  );
}
