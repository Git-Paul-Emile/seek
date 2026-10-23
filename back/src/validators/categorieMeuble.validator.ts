import { z } from "zod";

const nomSchema   = z.string().trim().min(2, "Minimum 2 caractères").max(100);
const ordreSchema = z.coerce.number().int().min(0).optional();

export const createCategorieMeubleSchema = z.object({
  nom:   nomSchema,
  actif: z.boolean().optional(),
  ordre: ordreSchema,
});

export const updateCategorieMeubleSchema = z.object({
  nom:   nomSchema.optional(),
  actif: z.boolean().optional(),
  ordre: ordreSchema,
});

export type CreateCategorieMeubleInput = z.infer<typeof createCategorieMeubleSchema>;
export type UpdateCategorieMeubleInput = z.infer<typeof updateCategorieMeubleSchema>;
