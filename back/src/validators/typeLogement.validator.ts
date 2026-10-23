import { z } from "zod";

// Note : le champ "image" n'est plus validé ici.
// Il provient de req.file (Multer) et est traité dans le contrôleur.

export const createTypeLogementSchema = z.object({
  nom:   z.string({ error: "Le nom est requis" }).min(2, "Minimum 2 caractères").max(50),
  ordre: z.coerce.number().int().min(0).optional(), // coerce : supporte les strings FormData
});

export const updateTypeLogementSchema = z.object({
  nom:   z.string().min(2, "Minimum 2 caractères").max(50).optional(),
  // actif accepte boolean (JSON) ou string "true"/"false" (FormData)
  actif: z.preprocess(
    (v) => (typeof v === "string" ? v === "true" : v),
    z.boolean()
  ).optional(),
  ordre: z.coerce.number().int().min(0).optional(),
});

export type CreateTypeLogementInput = z.infer<typeof createTypeLogementSchema>;
export type UpdateTypeLogementInput = z.infer<typeof updateTypeLogementSchema>;
