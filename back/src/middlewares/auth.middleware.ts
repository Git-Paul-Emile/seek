import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import * as AuthService from "../services/auth.service.js";
import { jsonResponse } from "../utils/responseApi.js";

// Étendre l'interface Request d'Express pour y ajouter `admin`
declare global {
  namespace Express {
    interface Request {
      admin?: { id: string; email: string };
    }
  }
}

/**
 * Middleware d'authentification admin.
 * Lit le JWT access token depuis :
 *  1. Le cookie `accessToken` (HttpOnly - prioritaire)
 *  2. Le header Authorization: Bearer <token> (fallback pour les clients API)
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. Extraire le token
  let token: string | undefined = req.cookies?.accessToken;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json(
      jsonResponse({ status: "unauthorized", message: "Authentification requise" })
    );
    return;
  }

  // 2. Vérifier la signature et l'expiration
  try {
    const payload = AuthService.verifyAccessToken(token);
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(StatusCodes.UNAUTHORIZED).json(
      jsonResponse({ status: "unauthorized", message: "Token invalide ou expiré" })
    );
  }
};
