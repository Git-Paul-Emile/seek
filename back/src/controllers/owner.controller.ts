import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getFrontendBaseUrl } from "../config/external.js";
import * as OwnerService from "../services/owner.service.js";
import { jsonResponse } from "../utils/responseApi.js";
import { prisma } from "../config/database.js";
import {
  envoyerResetPasswordProprietaire,
  envoyerOtpTelephone,
} from "../services/notification.service.js";
import * as ComptePublicService from "../services/comptePublicAuth.service.js";
import { cookieOptions } from "../utils/cookieConfig.js";

const REFRESH_COOKIE = "ownerRefreshToken";
const ACCESS_COOKIE = "ownerAccessToken";

const setTokenCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshTokenExpiresAt: Date
) => {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions({ maxAge: 15 * 60 * 1000 }));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions({ path: "/api/owner/auth/refresh", expires: refreshTokenExpiresAt }));
};

const clearTokenCookies = (res: Response) => {
  const cookieDomain = process.env.COOKIE_DOMAIN;
  const base = cookieOptions({ ...(cookieDomain && { domain: cookieDomain }) });
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, { ...base, path: "/api/owner/auth/refresh" });
};

const setComptePublicCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshTokenExpiresAt: Date
) => {
  res.cookie("comptePublicAccessToken", accessToken, cookieOptions({ maxAge: 15 * 60 * 1000 }));
  res.cookie("comptePublicRefreshToken", refreshToken, cookieOptions({ path: "/api/public/auth/refresh", expires: refreshTokenExpiresAt }));
};

const clearComptePublicCookies = (res: Response) => {
  const base = cookieOptions();
  res.clearCookie("comptePublicAccessToken", base);
  res.clearCookie("comptePublicRefreshToken", { ...base, path: "/api/public/auth/refresh" });
};

// ─── POST /api/owner/auth/register ───────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  const { proprietaire } = await OwnerService.register(req.body);

  // Envoi de l'OTP de vérification téléphone en arrière-plan
  try {
    const otp = await OwnerService.sendOtpTelephone(proprietaire.id);
    envoyerOtpTelephone({
      telephone:      req.body.telephone as string,
      prenom:         proprietaire.prenom,
      otp,
      proprietaireId: proprietaire.id,
    }).catch((err) => console.error("[Owner] Erreur envoi OTP inscription :", err));
  } catch (err) {
    console.error("[Owner] Impossible de générer l'OTP :", err);
  }

  res.status(StatusCodes.CREATED).json(
    jsonResponse({
      status: "success",
      message: "Compte créé avec succès. Vérifiez votre téléphone pour confirmer votre numéro.",
      data: { ...proprietaire, telephoneVerifie: false },
    })
  );
};

// ─── POST /api/owner/auth/login ──────────────────────────────────────────────

export const login = async (req: Request, res: Response): Promise<void> => {
  const { accessToken, refreshToken, refreshTokenExpiresAt, proprietaire } =
    await OwnerService.login(req.body);

  setTokenCookies(res, accessToken, refreshToken, refreshTokenExpiresAt);

  // Compte public automatique
  try {
    const { tokens: cpTokens } = await ComptePublicService.getOrCreateForProprietaire(proprietaire.id);
    setComptePublicCookies(res, cpTokens.accessToken, cpTokens.refreshToken, cpTokens.refreshTokenExpiresAt);
  } catch (err) {
    console.error("[Owner login] Erreur création compte public :", err);
  }

  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Connexion réussie. Bienvenue sur SEEK !",
      data: proprietaire,
    })
  );
};

// ─── POST /api/owner/auth/refresh ─────────────────────────────────────────────

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const oldRefreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

  if (!oldRefreshToken) {
    res.status(StatusCodes.UNAUTHORIZED).json(
      jsonResponse({ status: "unauthorized", message: "Refresh token manquant" })
    );
    return;
  }

  const { accessToken, refreshToken, refreshTokenExpiresAt, proprietaireId } =
    await OwnerService.refresh(oldRefreshToken);

  setTokenCookies(res, accessToken, refreshToken, refreshTokenExpiresAt);

  // Renouveler aussi le token du compte public lié
  try {
    const { tokens: cpTokens } = await ComptePublicService.getOrCreateForProprietaire(proprietaireId);
    setComptePublicCookies(res, cpTokens.accessToken, cpTokens.refreshToken, cpTokens.refreshTokenExpiresAt);
  } catch (err) {
    console.error("[Owner refresh] Erreur renouvellement compte public :", err);
  }

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Token renouvelé" })
  );
};

// ─── POST /api/owner/auth/logout ──────────────────────────────────────────────

export const logout = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
  if (refreshToken) {
    const proprietaireId = await OwnerService.logout(refreshToken);
    if (proprietaireId) {
      try {
        await ComptePublicService.revokePublicTokensForProprietaire(proprietaireId);
      } catch (err) {
        console.error("[Owner logout] Erreur révocation compte public :", err);
      }
    }
  }
  clearTokenCookies(res);
  clearComptePublicCookies(res);
  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Déconnexion réussie" })
  );
};

// ─── GET /api/owner/auth/me ───────────────────────────────────────────────────

export const me = async (req: Request, res: Response): Promise<void> => {
  const owner = req.owner!;
  const proprietaire = await OwnerService.me(owner.id);
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Propriétaire authentifié",
      data: proprietaire,
    })
  );
};

// ─── PUT /api/owner/profile ─────────────────────────────────────────────────

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const owner = req.owner!;
  const updated = await OwnerService.updateProfile(owner.id, req.body);
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Profil mis à jour avec succès",
      data: updated,
    })
  );
};

// ─── DELETE /api/owner/profile ───────────────────────────────────────────────

export const deleteProfile = async (req: Request, res: Response): Promise<void> => {
  const owner = req.owner!;
  await OwnerService.deleteProfile(owner.id);
  clearTokenCookies(res);
  res.status(StatusCodes.OK).json(
    jsonResponse({
      status: "success",
      message: "Compte supprimé avec succès. Toutes vos annonces ont également été supprimées.",
    })
  );
};

// ─── POST /api/owner/auth/forgot-password ────────────────────────────────────

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { identifiant } = req.body;
  if (!identifiant) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "Identifiant requis" }));
    return;
  }

  try {
    const { token, email, telephone, prenom, proprietaireId } =
      await OwnerService.requestPasswordReset(identifiant);

    const frontUrl = getFrontendBaseUrl();
    const lien = `${frontUrl}/owner/reset-password?token=${token}`;

    // Envoi SMS + email (email si disponible) en arrière-plan
    envoyerResetPasswordProprietaire({
      telephone,
      email,
      prenom,
      lien,
      proprietaireId,
    }).catch((err) => console.error("[Owner] Erreur envoi reset password :", err));
  } catch (e: any) {
    if (e.statusCode === StatusCodes.OK) {
      // Compte non trouvé, on répond OK quand même (ne pas révéler)
    } else {
      throw e;
    }
  }

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Si ce compte existe, un lien de réinitialisation a été envoyé." })
  );
};

// ─── POST /api/owner/auth/reset-password ─────────────────────────────────────

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;
  if (!token || !password) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "Token et nouveau mot de passe requis" }));
    return;
  }
  if (password.length < 8) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "Le mot de passe doit contenir au moins 8 caractères" }));
    return;
  }
  await OwnerService.resetPassword(token, password);
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Mot de passe réinitialisé avec succès" }));
};

// ─── GET /api/owner/messages ──────────────────────────────────────────────────

export const getMessagesInternes = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) { res.status(StatusCodes.UNAUTHORIZED).json(jsonResponse({ status: "fail", message: "Non authentifié" })); return; }
  const data = await prisma.messageInterne.findMany({
    where:   { proprietaireId },
    orderBy: { createdAt: "desc" },
    take:    50,
  });
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Messages récupérés", data }));
};

// ─── POST /api/owner/messages/lus ────────────────────────────────────────────

export const marquerMessagesLus = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) { res.status(StatusCodes.UNAUTHORIZED).json(jsonResponse({ status: "fail", message: "Non authentifié" })); return; }
  await prisma.messageInterne.updateMany({
    where: { proprietaireId, lu: false },
    data:  { lu: true },
  });
  res.status(StatusCodes.OK).json(jsonResponse({ status: "success", message: "Messages marqués comme lus" }));
};

export const getBiensSansEdl = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    res.status(StatusCodes.UNAUTHORIZED).json(jsonResponse({ status: "fail", message: "Non authentifié" }));
    return;
  }

  const bails = await prisma.bailLocation.findMany({
    where: {
      proprietaireId,
      statut: { in: ["ACTIF", "EN_PREAVIS", "EN_RENOUVELLEMENT", "EN_ATTENTE"] as any[] },
      etatsDesLieux: {
        none: { type: "ENTREE" as any },
      },
    },
    select: {
      id: true,
      bienId: true,
      locataireId: true,
      dateDebutBail: true,
      bien: {
        select: {
          titre: true,
          ville: true,
          region: true,
        },
      },
      locataire: {
        select: {
          prenom: true,
          nom: true,
        },
      },
    },
    orderBy: { dateDebutBail: "desc" },
  });

  res.status(StatusCodes.OK).json(jsonResponse({
    status: "success",
    message: "Biens sans état des lieux récupérés",
    data: {
      count: bails.length,
      items: bails,
    },
  }));
};

// ─── POST /api/owner/auth/verifier-telephone ─────────────────────────────────

export const verifierTelephone = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    res.status(StatusCodes.UNAUTHORIZED).json(jsonResponse({ status: "fail", message: "Non authentifié" }));
    return;
  }
  const { otp } = req.body;
  if (!otp) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "Code OTP requis" }));
    return;
  }
  const { accessToken, refreshToken, refreshTokenExpiresAt, proprietaire } = await OwnerService.verifyOtpTelephone(proprietaireId, String(otp));

  setTokenCookies(res, accessToken, refreshToken, refreshTokenExpiresAt);

  // Compte public automatique (première connexion après inscription)
  try {
    const { tokens: cpTokens } = await ComptePublicService.getOrCreateForProprietaire(proprietaireId);
    setComptePublicCookies(res, cpTokens.accessToken, cpTokens.refreshToken, cpTokens.refreshTokenExpiresAt);
  } catch (err) {
    console.error("[Owner verifierTelephone] Erreur création compte public :", err);
  }

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Numéro de téléphone vérifié avec succès.", data: proprietaire })
  );
};

// ─── POST /api/owner/auth/renvoyer-otp ───────────────────────────────────────

export const renvoyerOtp = async (req: Request, res: Response): Promise<void> => {
  const proprietaireId = req.owner?.id;
  if (!proprietaireId) {
    res.status(StatusCodes.UNAUTHORIZED).json(jsonResponse({ status: "fail", message: "Non authentifié" }));
    return;
  }
  // Récupérer les infos du propriétaire
  const proprietaire = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    select: { prenom: true, telephone: true },
  });
  if (!proprietaire) {
    res.status(StatusCodes.NOT_FOUND).json(jsonResponse({ status: "fail", message: "Compte introuvable" }));
    return;
  }

  const otp = await OwnerService.sendOtpTelephone(proprietaireId);
  const notif = await envoyerOtpTelephone({
    telephone:      proprietaire.telephone,
    prenom:         proprietaire.prenom,
    otp,
    proprietaireId,
    sync: true,
  });

  if (notif.sent === false) {
    res.status(StatusCodes.BAD_GATEWAY).json(
      jsonResponse({ status: "fail", message: "Échec de l'envoi du SMS. Réessayez dans quelques instants ou contactez le support." })
    );
    return;
  }

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Code OTP renvoyé sur votre téléphone." })
  );
};

// ─── POST /api/owner/auth/verifier-telephone-public ─────────────────────────

export const verifierTelephonePublic = async (req: Request, res: Response): Promise<void> => {
  const { proprietaireId, otp } = req.body;
  if (!proprietaireId || !otp) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "ID propriétaire et code OTP requis" }));
    return;
  }
  const { accessToken, refreshToken, refreshTokenExpiresAt, proprietaire } = await OwnerService.verifyOtpTelephone(proprietaireId, String(otp));

  setTokenCookies(res, accessToken, refreshToken, refreshTokenExpiresAt);

  try {
    const { tokens: cpTokens } = await ComptePublicService.getOrCreateForProprietaire(proprietaireId);
    setComptePublicCookies(res, cpTokens.accessToken, cpTokens.refreshToken, cpTokens.refreshTokenExpiresAt);
  } catch (err) {
    console.error("[Owner verifierTelephonePublic] Erreur création compte public :", err);
  }

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Numéro de téléphone vérifié avec succès.", data: proprietaire })
  );
};

// ─── POST /api/owner/auth/renvoyer-otp-public ───────────────────────────────

export const renvoyerOtpPublic = async (req: Request, res: Response): Promise<void> => {
  const { proprietaireId } = req.body;
  if (!proprietaireId) {
    res.status(StatusCodes.BAD_REQUEST).json(jsonResponse({ status: "fail", message: "ID propriétaire requis" }));
    return;
  }
  
  // Récupérer les infos du propriétaire
  const proprietaire = await prisma.proprietaire.findUnique({
    where: { id: proprietaireId },
    select: { prenom: true, telephone: true },
  });
  if (!proprietaire) {
    res.status(StatusCodes.NOT_FOUND).json(jsonResponse({ status: "fail", message: "Compte introuvable" }));
    return;
  }

  const otp = await OwnerService.sendOtpTelephone(proprietaireId);
  const notif = await envoyerOtpTelephone({
    telephone:      proprietaire.telephone,
    prenom:         proprietaire.prenom,
    otp,
    proprietaireId,
    sync: true,
  });

  if (notif.sent === false) {
    res.status(StatusCodes.BAD_GATEWAY).json(
      jsonResponse({ status: "fail", message: "Échec de l'envoi du SMS. Réessayez dans quelques instants ou contactez le support." })
    );
    return;
  }

  res.status(StatusCodes.OK).json(
    jsonResponse({ status: "success", message: "Code OTP renvoyé sur votre téléphone." })
  );
};

