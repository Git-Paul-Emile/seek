import {
  BusFront,
  Church,
  Croissant,
  FlameKindling,
  GraduationCap,
  Hospital,
  Landmark,
  MapPin,
  Moon,
  Pill,
  Route,
  School,
  Shield,
  ShoppingCart,
  Store,
  type LucideIcon,
} from "lucide-react";

// Icône d'un établissement proche. Les types viennent d'OpenStreetMap (« hopital », « arret_bus »)
// ou d'un libellé saisi (« Hôpital », « Banque ») : les motifs couvrent les deux écritures.
// Lucide n'a pas d'icône de mosquée : le croissant de lune est le symbole retenu.

const ICONES: [RegExp, LucideIcon][] = [
  [/h[oô]pital|clinique/i, Hospital],
  [/pharmacie/i, Pill],
  [/universit/i, GraduationCap],
  [/[eé]cole|coll[eè]ge|lyc[eé]e/i, School],
  [/supermarch/i, ShoppingCart],
  [/march[eé]/i, Store],
  [/boulangerie/i, Croissant],
  [/mosqu[eé]e/i, Moon],
  [/[eé]glise/i, Church],
  [/gendarmerie|police/i, Shield],
  [/pompier/i, FlameKindling],
  [/mairie|banque/i, Landmark],
  [/bus|brt/i, BusFront],
  [/route/i, Route],
];

export const iconeEtablissement = (type: string): LucideIcon =>
  ICONES.find(([motif]) => motif.test(type))?.[1] ?? MapPin;
