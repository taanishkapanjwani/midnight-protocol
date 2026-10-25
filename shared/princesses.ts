import type { PrincessId } from "./types";

export interface Princess {
  id: PrincessId;
  name: string;
  epithet: string;
  colors: { name: string; hex: string }[];
  accent: string;
  accentSoft: string;
  keywords: string[];
  description: string;
}

// Original, fairy-tale-inspired aesthetic archetypes. No studio artwork is used.
export const PRINCESSES: Princess[] = [
  {
    id: "cinderella",
    name: "Cinderella",
    epithet: "The Midnight Muse",
    colors: [
      { name: "Powder blue", hex: "#AFC8E0" },
      { name: "Silver", hex: "#C9CDD3" },
      { name: "Pearl white", hex: "#F6F2EC" },
    ],
    accent: "#6F8FB3",
    accentSoft: "#E3ECF5",
    keywords: ["Timeless", "Satin", "Delicate sparkle", "Glass-slipper"],
    description: "Timeless elegance in satin and soft shimmer, finished with crystal-clear accents.",
  },
  {
    id: "belle",
    name: "Belle",
    epithet: "The Golden Romantic",
    colors: [
      { name: "Champagne yellow", hex: "#EED9A0" },
      { name: "Warm gold", hex: "#C6A66B" },
      { name: "Cream", hex: "#F7EEDC" },
    ],
    accent: "#B08A3E",
    accentSoft: "#F6EBD2",
    keywords: ["Romantic", "Bookish", "Refined", "Vintage"],
    description: "A romantic intellectual: warm golds, refined tailoring and a hint of library-vintage.",
  },
  {
    id: "aurora",
    name: "Aurora",
    epithet: "The Rose Dreamer",
    colors: [
      { name: "Dusty pink", hex: "#D9A5B3" },
      { name: "Blush", hex: "#F4DCE4" },
      { name: "Soft gold", hex: "#D8BE8A" },
    ],
    accent: "#B98598",
    accentSoft: "#F9EAF0",
    keywords: ["Balletcore", "Ribbons", "Dreamy", "Tulle"],
    description: "Balletcore softness: tulle, ribbons and dreamy silhouettes in rose and blush.",
  },
  {
    id: "rapunzel",
    name: "Rapunzel",
    epithet: "The Lavender Enchantress",
    colors: [
      { name: "Lavender", hex: "#C3B1DA" },
      { name: "Lilac", hex: "#DCCDEA" },
      { name: "Floral pink", hex: "#EBB7C8" },
    ],
    accent: "#8E79AE",
    accentSoft: "#EFE8F6",
    keywords: ["Whimsical", "Artistic", "Floral", "Playful"],
    description: "Whimsical and artistic: lilac florals, playful details and painterly color.",
  },
  {
    id: "snowwhite",
    name: "Snow White",
    epithet: "The Vintage Royal",
    colors: [
      { name: "Ruby red", hex: "#9E2B3A" },
      { name: "Navy", hex: "#283A5E" },
      { name: "Ivory", hex: "#FFF9F5" },
    ],
    accent: "#9E2B3A",
    accentSoft: "#F6E3E5",
    keywords: ["Vintage", "Structured", "Classic", "Ruby"],
    description: "Vintage femininity with structured silhouettes, ruby accents and classic polish.",
  },
  {
    id: "ariel",
    name: "Ariel",
    epithet: "The Ocean Heiress",
    colors: [
      { name: "Seafoam", hex: "#A9D8C8" },
      { name: "Turquoise", hex: "#4FA7A5" },
      { name: "Iridescent pearl", hex: "#EAF2F0" },
    ],
    accent: "#3F8F8D",
    accentSoft: "#E3F2EF",
    keywords: ["Fluid", "Oceanic", "Pearl", "Modern"],
    description: "Fluid fabrics in seafoam and turquoise, with pearls and modern ocean polish.",
  },
];

export const princessById = (id: PrincessId) => PRINCESSES.find((p) => p.id === id)!;

export const OCCASION_LABELS: Record<string, string> = {
  gala: "Royal gala / formal dinner",
  college: "College event",
  romantic: "Romantic dinner",
  wedding: "Wedding guest",
  birthday: "Birthday celebration",
  garden: "Garden party",
  casual: "Casual day out",
};

export const STYLE_LABELS: Record<string, string> = {
  minimal: "Minimal and elegant",
  romantic: "Romantic and feminine",
  dramatic: "Dramatic and glamorous",
  vintage: "Vintage royal",
  modern: "Modern princess",
};

export const COMFORT_LABELS: Record<string, string> = {
  walking: "Comfortable walking shoes",
  noHeels: "No heels",
  weather: "Weather-friendly",
  modest: "Modest silhouettes",
  none: "No specific restrictions",
};

// Minimum formality the main garment & shoes need for an occasion.
export const OCCASION_MIN_FORMALITY: Record<string, number> = {
  gala: 4,
  wedding: 3,
  romantic: 3,
  birthday: 2,
  garden: 2,
  college: 1,
  casual: 1,
};
