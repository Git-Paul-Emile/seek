import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/FormField";
import { OwnerAuthLayout } from "@/components/owner/OwnerAuthLayout";
import {
  resendOwnerOtpApi,
  resendOwnerOtpPublicApi,
  verifyOwnerPhoneApi,
  verifyOwnerPhonePublicApi,
} from "@/api/ownerAuth";
import { useOwnerAuth } from "@/context/OwnerAuthContext";
import { useComptePublicAuth } from "@/context/ComptePublicAuthContext";

const OWNER_PENDING_OTP_KEY = "ownerPendingOtp";
const OTP_LONGUEUR = 6;

type PendingOtpData = {
  proprietaireId: string;
  prenom?: string;
  telephone?: string;
};

function readPendingOtp(): PendingOtpData | null {
  try {
    const raw = sessionStorage.getItem(OWNER_PENDING_OTP_KEY);
    return raw ? (JSON.parse(raw) as PendingOtpData) : null;
  } catch {
    return null;
  }
}

function maskPhone(phone?: string) {
  if (!phone) return "votre téléphone";
  const compact = phone.replace(/\s+/g, "");
  if (compact.length <= 4) return phone;
  return `${compact.slice(0, 4)} ${"*".repeat(Math.max(0, compact.length - 6))}${compact.slice(-2)}`;
}

export default function VerifyOwnerPhone() {
  const navigate = useNavigate();
  const { owner, setOwner, isLoading, isAuthenticated } = useOwnerAuth();
  const { refreshMe: refreshPublicAccount } = useComptePublicAuth();
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState<PendingOtpData | null>(() => readPendingOtp());
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!isLoading && owner?.telephoneVerifie) {
      sessionStorage.removeItem(OWNER_PENDING_OTP_KEY);
      navigate("/owner/dashboard", { replace: true });
    }
  }, [isLoading, navigate, owner?.telephoneVerifie]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !pending) {
      navigate("/owner/register", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, pending]);

  const currentPhone = useMemo(() => owner?.telephone ?? pending?.telephone, [owner?.telephone, pending?.telephone]);
  const currentFirstName = useMemo(() => owner?.prenom ?? pending?.prenom ?? "propriétaire", [owner?.prenom, pending?.prenom]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== OTP_LONGUEUR) {
      toast.error("Saisissez les 6 chiffres du code reçu par SMS.");
      return;
    }

    setSubmitting(true);
    try {
      const response = owner
        ? await verifyOwnerPhoneApi(cleanOtp)
        : await verifyOwnerPhonePublicApi({
            proprietaireId: pending!.proprietaireId,
            otp: cleanOtp,
          });

      sessionStorage.removeItem(OWNER_PENDING_OTP_KEY);
      setOwner(response.data.data);
      await refreshPublicAccount();
      toast.success("Numéro vérifié avec succès.");
      navigate("/owner/dashboard", { replace: true });
    } catch {
      toast.error("Ce code est incorrect ou a expiré. Demandez un nouveau code.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      if (owner) {
        await resendOwnerOtpApi();
      } else if (pending?.proprietaireId) {
        await resendOwnerOtpPublicApi(pending.proprietaireId);
      } else {
        toast.error("Impossible de retrouver votre inscription en attente.");
        return;
      }

      setPending(readPendingOtp());
      toast.success("Code renvoyé par SMS.");
    } catch {
      toast.error("Le code n'a pas pu être renvoyé. Réessayez dans un instant.");
    } finally {
      setResending(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <OwnerAuthLayout
      titre="Vérifiez votre numéro"
      sousTitre={`Bonjour ${currentFirstName}, saisissez le code à 6 chiffres envoyé par SMS au ${maskPhone(currentPhone)}.`}
      retour={{ to: "/owner/login", label: "Connexion" }}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField label="Code reçu par SMS" help="Gardez cette page ouverte pendant que vous consultez le SMS.">
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LONGUEUR}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="text-center font-mono text-h3 tracking-[0.4em]"
          />
        </FormField>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Vérification…" : "Valider le code"}
        </Button>
        <Button type="button" variant="ghost" onClick={handleResend} disabled={resending} className="w-full">
          {resending ? "Envoi…" : "Renvoyer le code par SMS"}
        </Button>
      </form>
    </OwnerAuthLayout>
  );
}
