import { UserPlus, Building2, Users, FolderOpen, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const PROPERTY_TYPES = [
  { value: "appartement", label: "Appartement" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "maison", label: "Maison" },
  { value: "terrain", label: "Terrain" },
  { value: "commerce", label: "Commerce" },
  { value: "bureau", label: "Bureau" },
  { value: "immeuble", label: "Immeuble" },
];

export type Category = {
  id: string;
  name: string;
  count: number;
  image: string;
};

export const CATEGORIES: Category[] = [
  { id: "appartements", name: "Appartements", count: 245, image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80&auto=format&fit=crop" },
  { id: "villas", name: "Villas", count: 128, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80&auto=format&fit=crop" },
  { id: "studios", name: "Studios", count: 89, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80&auto=format&fit=crop" },
  { id: "commerce", name: "Commerciaux", count: 67, image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80&auto=format&fit=crop" },
  { id: "bureaux", name: "Bureaux", count: 45, image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80&auto=format&fit=crop" },
  { id: "terrains", name: "Terrains", count: 156, image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80&auto=format&fit=crop" },
  { id: "immeubles", name: "Immeubles", count: 34, image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80&auto=format&fit=crop" },
];

export type Property = {
  id: number;
  type: string;
  title: string;
  price: number;
  location: string;
  city: string;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  features: string[]; // Tableau de caractéristiques (ex: "Parking", "Ascenseur", "Climatisation", etc.)
  isNew: boolean;
};

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 1,
    type: "Appartement",
    title: "Superbe appartement aux Almadies",
    price: 85000000,
    location: "Almadies",
    city: "Dakar",
    surface: 120,
    bedrooms: 3,
    bathrooms: 2,
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    features: ["Parking", "Climatisation", "WiFi"],
    isNew: true,
  },
  {
    id: 2,
    type: "Villa",
    title: "Villa moderne à Mermoz",
    price: 150000000,
    location: "Mermoz",
    city: "Dakar",
    surface: 250,
    bedrooms: 4,
    bathrooms: 3,
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    features: ["Parking", "Piscine", "Gardien"],
    isNew: false,
  },
  {
    id: 3,
    type: "Studio",
    title: "Studio meublé Point E",
    price: 35000000,
    location: "Point E",
    city: "Dakar",
    surface: 45,
    bedrooms: 1,
    bathrooms: 1,
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    features: ["Meublé", "WiFi"],
    isNew: true,
  },
  {
    id: 4,
    type: "Commerce",
    title: "Local commercial Sacré Cœur",
    price: 120000000,
    location: "Sacré Cœur",
    city: "Dakar",
    surface: 180,
    bedrooms: 0,
    bathrooms: 2,
    images: ["/placeholder.svg", "/placeholder.svg", "/placeholder.svg"],
    features: ["Parking"],
    isNew: false,
  },
];

export type OwnerStep = {
  number: number;
  title: string;
  desc: string;
  icon: LucideIcon;
};

export const OWNER_STEPS: OwnerStep[] = [
  { number: 1, title: "Inscrivez-vous gratuitement", desc: "En moins de 2 minutes, votre espace propriétaire est prêt", icon: UserPlus },
  { number: 2, title: "Publiez votre annonce", desc: "Photos, description, prix — votre bien est en ligne en quelques clics", icon: Building2 },
  { number: 3, title: "Gérez vos locataires", desc: "Associez facilement un locataire à votre bien et suivez la relation", icon: Users },
  { number: 4, title: "Documents automatiques", desc: "Baux, quittances et contrats générés en un clic, prêts à signer", icon: FolderOpen },
  { number: 5, title: "Pilotez votre patrimoine", desc: "Loyers, baux, vues, alertes — tout centralisé en temps réel", icon: LayoutDashboard },
];

export const SORT_OPTIONS = [
  { value: "recent", label: "Plus récent" },
  { value: "oldest", label: "Moins récent" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
];

export const TRAVEL_TIMES = ["5 min", "10 min", "15 min", "20 min", "30 min"];
