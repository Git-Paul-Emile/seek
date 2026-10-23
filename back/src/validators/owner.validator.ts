import { z } from "zod";

export const registerOwnerSchema = z.object({
  prenom: z
    .string({ error: "Le prénom est requis" })
    .min(2, "Le prénom doit contenir au moins 2 caractères")
    .max(50, "Le prénom ne peut pas dépasser 50 caractères"),
  nom: z
    .string({ error: "Le nom est requis" })
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  // sexe et email peuvent arriver comme chaîne vide depuis le front
  sexe: z.string().optional(),
  telephone: z
    .string({ error: "Le numéro de téléphone est requis" })
    .min(1, "Le numéro de téléphone est requis")
    .regex(
      /^[+]?[\d\s\-()\d]{7,}$/,
      "Format invalide - ex : 77 000 00 00 ou +221 77 000 00 00"
    ),
  email: z
    .string()
    .refine(
      (v) => v === "" || z.string().email().safeParse(v).success,
      "Format email invalide - ex : prenom@email.com"
    )
    .optional(),
  password: z
    .string({ error: "Le mot de passe est requis" })
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export type RegisterOwnerInput = z.infer<typeof registerOwnerSchema>;

export const loginOwnerSchema = z.object({
  identifiant: z
    .string({ error: "L'identifiant est requis" })
    .min(1, "L'identifiant est requis"),
  password: z
    .string({ error: "Le mot de passe est requis" })
    .min(1, "Le mot de passe est requis"),
});

export type LoginOwnerInput = z.infer<typeof loginOwnerSchema>;
