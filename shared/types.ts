import { z } from "zod";

// ---------- Catalog ----------
export const CATEGORIES = ["dress", "top", "skirt", "trousers", "shoes", "bag", "jewelry", "outerwear"] as const;
export type Category = (typeof CATEGORIES)[number];

export const OCCASIONS = ["gala", "college", "romantic", "wedding", "birthday", "garden", "casual"] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const STYLES = ["minimal", "romantic", "dramatic", "vintage", "modern"] as const;
export type Style = (typeof STYLES)[number];

export const PRINCESS_IDS = ["cinderella", "belle", "aurora", "rapunzel", "snowwhite", "ariel"] as const;
export type PrincessId = (typeof PRINCESS_IDS)[number];

export const COMFORT_PREFS = ["walking", "noHeels", "weather", "modest", "none"] as const;
export type ComfortPref = (typeof COMFORT_PREFS)[number];

export interface CatalogItem {
  id: string;
  name: string;
  category: Category;
  price: number;
  color: string;
  colorHex: string;
  styleTags: Style[];
  princessTags: PrincessId[];
  occasions: Occasion[];
  formality: number; // 1 casual .. 5 black tie
  heel: "flat" | "low" | "high" | null; // shoes only
  walkable: boolean;
  weather: ("warm" | "cold" | "rainy")[];
  modest: boolean;
  available: boolean;
  sizes: string[]; // in-stock sizes reported by the retailer when last checked
  image: string | null; // retailer's product photo
  retailer: string;
  url: string; // retailer's product page
  checkedAt: string; // YYYY-MM-DD when price and stock were last verified
}

// ---------- User preferences ----------
export const PreferencesSchema = z.object({
  princess: z.enum(PRINCESS_IDS),
  occasion: z.enum(OCCASIONS),
  budget: z.number().min(40, "Budget must be at least $40").max(5000, "Budget must be at most $5,000"),
  style: z.enum(STYLES),
  comfort: z.array(z.enum(COMFORT_PREFS)).max(5),
  owned: z.string().max(400, "Please keep wardrobe notes under 400 characters").default(""),
  setting: z.enum(["indoor", "outdoor"]).default("indoor"),
  weather: z.enum(["warm", "cold", "rainy"]).default("warm"),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

// Constraints are the machine-checkable form of preferences (+ crisis changes).
export interface Constraints {
  budget: number;
  occasion: Occasion;
  noHeels: boolean;
  walking: boolean;
  modest: boolean;
  weather: "warm" | "cold" | "rainy";
  minFormality: number;
  unavailable: string[]; // ids made unavailable by a crisis
}

// ---------- Agent outputs (validated LLM JSON) ----------
export const RoleEnum = z.enum(["main", "top", "bottom", "shoes", "bag", "jewelry", "outerwear"]);

export const GodmotherOutputSchema = z.object({
  title: z.string().min(3).max(80),
  items: z
    .array(z.object({ id: z.string().min(3).max(20), reason: z.string().min(3).max(240) }))
    .min(3)
    .max(6),
  rationale: z.string().min(10).max(700),
  aestheticSelfRating: z.number().int().min(1).max(5),
});
export type GodmotherOutput = z.infer<typeof GodmotherOutputSchema>;

export const GuardianOutputSchema = z.object({
  replacements: z
    .array(z.object({ removeId: z.string().min(3).max(20), addId: z.string().min(3).max(20), reason: z.string().min(3).max(240) }))
    .max(6),
  additions: z.array(z.object({ addId: z.string().min(3).max(20), reason: z.string().max(240) })).max(3).default([]),
  removals: z.array(z.object({ removeId: z.string(), reason: z.string().max(240) })).max(4).default([]),
  explanation: z.string().min(10).max(600),
  tradeoffs: z.array(z.string().max(200)).max(5),
  aestheticPreserved: z.number().int().min(1).max(5),
  feasible: z.boolean(),
});
export type GuardianOutput = z.infer<typeof GuardianOutputSchema>;

export const BaselineOutputSchema = z.object({
  items: z.array(z.object({ id: z.string(), reason: z.string().max(240) })).min(1).max(8),
  explanation: z.string().max(700),
});
export type BaselineOutput = z.infer<typeof BaselineOutputSchema>;

// ---------- Validation / scoring ----------
export interface Violation {
  code:
    | "INVALID_ID"
    | "UNAVAILABLE"
    | "OVER_BUDGET"
    | "MISSING_ROLE"
    | "DUPLICATE_ROLE"
    | "HEELS_NOT_ALLOWED"
    | "NOT_WALKABLE"
    | "NOT_MODEST"
    | "WEATHER"
    | "DRESS_CODE"
    | "TOO_MANY_ITEMS";
  itemId?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  total: number;
  budget: number;
  remaining: number;
  violations: Violation[];
  checks: { label: string; passed: boolean; hard: boolean }[];
}

export interface ScoreCard {
  aesthetic: number; // rule-based 0-100
  budget: number;
  occasion: number;
  practicality: number;
  overall: number;
  hardFail: boolean;
  aiAestheticRating: number | null; // 1-5, labeled AI opinion
}

export interface OutfitItem extends CatalogItem {
  reason: string;
}

export interface Outfit {
  title: string;
  items: OutfitItem[];
  rationale: string;
  validation: ValidationResult;
  score: ScoreCard;
}

// ---------- Crisis ----------
export const CRISIS_IDS = [
  "sold_out",
  "long_walk",
  "rain",
  "cold_snap",
  "strict_dress_code",
  "budget_cut",
  "accessory_lost",
  "no_heels",
] as const;
export type CrisisId = (typeof CRISIS_IDS)[number];

export interface Crisis {
  id: CrisisId;
  title: string;
  narration: string;
  targetItemId: string | null;
  changes: string[]; // human-readable constraint changes
  constraints: Constraints; // constraints AFTER the crisis
}

// ---------- Telemetry ----------
export interface UsageRecord {
  ts: string;
  runId: string;
  agent: string;
  system: "council" | "baseline";
  model: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  latencyMs: number;
  costUsd: number;
  measured: boolean; // true = API-reported usage, false = demo/estimate
  attempt: number;
  ok: boolean;
}

export interface TraceEvent {
  type: "status" | "agent" | "warning" | "result" | "error" | "done";
  agent?: "godmother" | "treasurer" | "stepmother" | "guardian" | "system";
  message: string;
  data?: unknown;
  ts: number;
}
