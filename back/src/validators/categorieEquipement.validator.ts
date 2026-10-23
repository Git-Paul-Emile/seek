import { z } from "zod";

const nomSchema   = z.string().trim().min(2, "Minimum 2 caractères").max(100);
const ordreSchema = z.coerce.number().int().min(0).optional();

export const createCategorieEquipementSchema = z.object({
  nom:   nomSchema,
  actif: z.boolean().optional(),
  ordre: ordreSchema,
});

export const updateCategorieEquipementSchema = z.object({
  nom:   nomSchema.optional(),
  actif: z.boolean().optional(),
  ordre: ordreSchema,
});

export type CreateCategorieEquipementInput = z.infer<typeof createCategorieEquipementSchema>;
export type UpdateCategorieEquipementInput = z.infer<typeof updateCategorieEquipementSchema>;
