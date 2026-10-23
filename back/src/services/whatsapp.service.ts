/**
 * Service WhatsApp via l'API Meta Cloud (https://developers.facebook.com/docs/whatsapp)
 *
 * Authentification : Bearer token (WHATSAPP_API_TOKEN)
 * Endpoint envoi   : POST https://graph.facebook.com/v20.0/{WHATSAPP_PHONE_NUMBER_ID}/messages
 *
 * ⚠️  Tant que WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID ne sont pas configurés,
 *     l'envoi est simulé (log + succès) afin de ne pas bloquer le reste du flux de
 *     notification pendant l'attente du vrai compte WhatsApp Business.
 */

import { normalizePhone } from "./sms.service.js";

const BASE_URL         = process.env.WHATSAPP_API_URL ?? "https://graph.facebook.com/v20.0";
const API_TOKEN         = process.env.WHATSAPP_API_TOKEN ?? "";
const PHONE_NUMBER_ID    = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";

export interface WhatsappResult {
  success: boolean;
  messageRetour: string;
}

export const sendWhatsapp = async (
  phone: string,
  message: string
): Promise<WhatsappResult> => {
  const normalizedPhone = normalizePhone(phone);

  if (!API_TOKEN || !PHONE_NUMBER_ID) {
    console.warn("[WhatsApp] WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID non configurés — envoi simulé");
    console.info(`[WhatsApp] (simulation) → ${normalizedPhone} : ${message}`);
    return { success: true, messageRetour: "SIMULATED_NOT_CONFIGURED" };
  }

  try {
    const response = await fetch(`${BASE_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizedPhone,
        type: "text",
        text: { body: message },
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (response.ok) {
      console.info(`[WhatsApp] Envoyé → ${normalizedPhone}`);
      return { success: true, messageRetour: JSON.stringify(data) };
    }

    const errMsg = JSON.stringify(data);
    console.error(`[WhatsApp] Échec → ${normalizedPhone} : ${errMsg}`);
    return { success: false, messageRetour: errMsg };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[WhatsApp] Erreur réseau → ${normalizedPhone} : ${msg}`);
    return { success: false, messageRetour: msg };
  }
};
