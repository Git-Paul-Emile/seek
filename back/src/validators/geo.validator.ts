import { z } from "zod";

export const positionSchema = z.object({
  lat: z.coerce.number({ error: "Latitude invalide" }).min(-90, "Latitude invalide").max(90, "Latitude invalide"),
  lng: z.coerce.number({ error: "Longitude invalide" }).min(-180, "Longitude invalide").max(180, "Longitude invalide"),
});
