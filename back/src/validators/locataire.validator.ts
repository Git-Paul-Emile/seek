import { z } from "zod";

export const createLocataireSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  prenom: z.string().min(2, "Le prénom est requis"),
  telephone: z.string().min(6, "Le téléphone est requis"),
  email: z.string().email("Email invalide").optional().nullable(),
  nbOccupants: z.number().int().min(1).optional(),
  presenceEnfants: z.boolean().optional(),
});

export const updateLocataireSchema = z.object({
  nom: z.string().min(2).optional(),
  prenom: z.string().min(2).optional(),
  telephone: z.string().min(6).optional(),
  email: z.string().email("Email invalide").optional().nullable(),
  nbOccupants: z.number().int().min(1).optional(),
  presenceEnfants: z.boolean().optional(),
});
