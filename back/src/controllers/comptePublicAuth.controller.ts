import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { jsonResponse } from "../utils/responseApi.js";
import * as AuthService from "../services/comptePublicAuth.service.js";
import { cookieOptions } from "../utils/cookieConfig.js";

const ACCESS_COOKIE = "comptePublicAccessToken";
const REFRESH_COOKIE = "comptePublicRefreshToken";

const cookieOpts = (maxAge: number) => cookieOptions({ maxAge });

// POST /api/public/auth/register
export const register = async (req: Request, res: Response) => {
  const { nom, prenom, telephone, email, password } = req.body;

  if (!nom || !prenom || !telephone || !password) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "nom, prenom, telephone et password sont requis" })
    );
    return;
  }

  const { compte, tokens } = await AuthService.register({ nom, prenom, telephone, email, password });

  res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOpts(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts(30 * 24 * 3600 * 1000));

  res.status(StatusCodes.CREATED).json(
    jsonResponse({ status: "success", message: "Compte créé avec succès", data: compte })
  );
};

// POST /api/public/auth/login
export const login = async (req: Request, res: Response) => {
  const { telephone, password } = req.body;

  if (!telephone || !password) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "telephone et password sont requis" })
    );
    return;
  }

  const { compte, tokens } = await AuthService.login({ telephone, password });

  res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOpts(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts(30 * 24 * 3600 * 1000));

  res.json(jsonResponse({ status: "success", message: "Connexion réussie", data: compte }));
};

// POST /api/public/auth/refresh
export const refresh = async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

  if (!rawToken) {
    res.status(StatusCodes.UNAUTHORIZED).json(
      jsonResponse({ status: "unauthorized", message: "Refresh token manquant" })
    );
    return;
  }

  const { compte, tokens } = await AuthService.refreshTokens(rawToken);

  res.cookie(ACCESS_COOKIE, tokens.accessToken, cookieOpts(15 * 60 * 1000));
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, cookieOpts(30 * 24 * 3600 * 1000));

  res.json(jsonResponse({ status: "success", message: "Token rafraîchi", data: compte }));
};

// POST /api/public/auth/logout
export const logout = async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

  if (rawToken) await AuthService.logout(rawToken);

  const cookieDomain = process.env.COOKIE_DOMAIN;
  const base = cookieOptions({ ...(cookieDomain && { domain: cookieDomain }) });
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);

  res.json(jsonResponse({ status: "success", message: "Déconnexion réussie", data: null }));
};

// GET /api/public/auth/me
export const me = async (req: Request, res: Response) => {
  const compte = await AuthService.getMe(req.comptePublic!.id);
  res.json(jsonResponse({ status: "success", message: "Profil", data: compte }));
};

// PUT /api/public/auth/profile
export const updateProfile = async (req: Request, res: Response) => {
  const { nom, prenom, email } = req.body;

  if (!nom && !prenom && email === undefined) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "Aucun champ à mettre à jour" })
    );
    return;
  }

  const compte = await AuthService.updateProfile(req.comptePublic!.id, { nom, prenom, email });
  res.json(jsonResponse({ status: "success", message: "Profil mis à jour", data: compte }));
};

// PUT /api/public/auth/change-password
export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "currentPassword et newPassword sont requis" })
    );
    return;
  }

  if (newPassword.length < 6) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "Le nouveau mot de passe doit faire au moins 6 caractères" })
    );
    return;
  }

  await AuthService.changePassword(req.comptePublic!.id, { currentPassword, newPassword });
  res.json(jsonResponse({ status: "success", message: "Mot de passe modifié avec succès", data: null }));
};

// DELETE /api/public/auth/account
export const deleteAccount = async (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    res.status(StatusCodes.BAD_REQUEST).json(
      jsonResponse({ status: "fail", message: "Mot de passe requis pour confirmer la suppression" })
    );
    return;
  }

  await AuthService.deleteAccount(req.comptePublic!.id, password);

  const base = cookieOptions();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);

  res.json(jsonResponse({ status: "success", message: "Compte supprimé avec succès", data: null }));
};
