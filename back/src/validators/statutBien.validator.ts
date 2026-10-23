import { z } from "zod";

export const createStatutBienSchema = z.object({
  nom:   z.string({ error: "Le nom est requis" }).min(2, "Minimum 2 caractères").max(50),
  ordre: z.coerce.number().int().min(0).optional(),
});

export const updateStatutBienSchema = z.object({
  nom:   z.string().min(2, "Minimum 2 caractères").max(50).optional(),
  actif: z.boolean().optional(),
  ordre: z.coerce.number().int().min(0).optional(),
});

export type CreateStatutBienInput = z.infer<typeof createStatutBienSchema>;
export type UpdateStatutBienInput = z.infer<typeof updateStatutBienSchema>;
