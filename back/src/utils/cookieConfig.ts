import type { CookieOptions } from "express";

/**
 * Retourne true si les cookies doivent être sécurisés (SameSite=None; Secure=true).
 * Priorité : COOKIE_SECURE=true > NODE_ENV=production
 * En local, ne pas définir ces vars → cookies Lax/non-secure pour localhost.
 */
export const isSecureCookie = (): boolean =>
  process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";

/**
 * Options de base pour un cookie HttpOnly.
 */
export const cookieOptions = (overrides: CookieOptions = {}): CookieOptions => {
  const secure = isSecureCookie();
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
    ...overrides,
  };
};
