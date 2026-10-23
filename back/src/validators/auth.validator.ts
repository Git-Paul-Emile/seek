import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ error: "L'email est requis" })
    .email("Format d'email invalide")
    .toLowerCase(),
  password: z
    .string({ error: "Le mot de passe est requis" })
    .min(1, "Le mot de passe est requis"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Schema pour le changement de mot de passe ───────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ error: "Le mot de passe actuel est requis" })
      .min(1, "Le mot de passe actuel est requis"),
    newPassword: z
      .string({ error: "Le nouveau mot de passe est requis" })
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre",
      }),
    confirmPassword: z
      .string({ error: "La confirmation du mot de passe est requise" })
      .min(1, "La confirmation du mot de passe est requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Le nouveau mot de passe doit être différent de l'actuel",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
