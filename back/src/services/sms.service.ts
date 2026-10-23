/**
 * Service SMS via Sendtext (https://api.sendtext.sn)
 *
 * Authentification : headers SNT-API-KEY + SNT-API-SECRET
 * Endpoint envoi   : POST /v1/sms
 * Body             : { sender_name, phone, text, sms_type: "normal" | "flash" }
 *
 * ⚠️  Le champ `sender_name` doit être enregistré dans le portail Sendtext
 *     (sendtext.sn > Mon compte > Noms d'expéditeurs) avant de pouvoir envoyer.
 *     Configurez la variable d'environnement SENDTEXT_SENDER_NAME avec la valeur
 *     exacte approuvée dans le portail.
 */

const BASE_URL   = process.env.SENDTEXT_BASE_URL   ?? "https://api.sendtext.sn/v1";
const API_KEY    = process.env.SENDTEXT_API_KEY    ?? "";
const API_SECRET = process.env.SENDTEXT_API_SECRET ?? "";
const SENDER     = process.env.SENDTEXT_SENDER_NAME ?? "SEEK";

export interface SmsResult {
  success: boolean;
  messageRetour: string;
}

// ─── Normalisation du numéro ──────────────────────────────────────────────────
// Sendtext attend le format international sans +, ex: 221771234567

export function normalizePhone(raw: string): string {
  // Supprimer espaces, tirets, parenthèses, le + initial
  const digits = raw.replace(/[\s\-()]/g, "").replace(/^\+/, "");

  // Si le numéro commence par "00", enlever le préfixe international
  if (digits.startsWith("00")) return digits.slice(2);

  // Numéro local sénégalais sur 9 chiffres (commence par 7)
  if (digits.length === 9 && /^[7]/.test(digits)) return "221" + digits;

  return digits;
}

// ─── Envoi SMS ────────────────────────────────────────────────────────────────

export const sendSms = async (
  phone: string,
  message: string,
  flash = false
): Promise<SmsResult> => {
  if (!API_KEY || !API_SECRET) {
    console.warn("[SMS] SENDTEXT_API_KEY / SENDTEXT_API_SECRET non configurés");
    return { success: false, messageRetour: "SMS credentials not configured" };
  }

  const normalizedPhone = normalizePhone(phone);

  try {
    const response = await fetch(`${BASE_URL}/sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "SNT-API-KEY":    API_KEY,
        "SNT-API-SECRET": API_SECRET,
      },
      body: JSON.stringify({
        sender_name: SENDER,
        phone:       normalizedPhone,
        text:        message,
        sms_type:    flash ? "flash" : "normal",
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (response.ok) {
      console.info(`[SMS] Envoyé → ${normalizedPhone}`);
      return { success: true, messageRetour: JSON.stringify(data) };
    }

    const errMsg = JSON.stringify(data);
    console.error(`[SMS] Échec → ${normalizedPhone} : ${errMsg}`);
    return { success: false, messageRetour: errMsg };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[SMS] Erreur réseau → ${normalizedPhone} : ${msg}`);
    return { success: false, messageRetour: msg };
  }
};

// ─── Vérification de la balance ───────────────────────────────────────────────

export const getBalance = async (): Promise<{ balance: number; expiresAt: string } | null> => {
  if (!API_KEY || !API_SECRET) return null;
  try {
    const response = await fetch(`${BASE_URL}/balance`, {
      headers: { "SNT-API-KEY": API_KEY, "SNT-API-SECRET": API_SECRET },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { balance: number; expires_at: string };
    return { balance: data.balance, expiresAt: data.expires_at };
  } catch {
    return null;
  }
};
