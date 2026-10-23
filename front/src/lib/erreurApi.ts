import axios from "axios";

// Message d'erreur renvoyé par le back (format jsonResponse : { message }), sinon le texte
// de repli, qui dit à l'utilisateur quoi faire.

export const messageErreurApi = (error: unknown, repli: string): string => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return repli;
};
