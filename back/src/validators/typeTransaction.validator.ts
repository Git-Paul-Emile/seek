import { z } from "zod";

export const createTypeTransactionSchema = z.object({
  nom:   z.string({ error: "Le nom est requis" }).min(2, "Minimum 2 caractères").max(50),
  ordre: z.coerce.number().int().min(0).optional(),
});

export const updateTypeTransactionSchema = z.object({
  nom:   z.string().min(2, "Minimum 2 caractères").max(50).optional(),
  actif: z.boolean().optional(),
  ordre: z.coerce.number().int().min(0).optional(),
});

export type CreateTypeTransactionInput = z.infer<typeof createTypeTransactionSchema>;
export type UpdateTypeTransactionInput = z.infer<typeof updateTypeTransactionSchema>;
