import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./env";
import type { CatalogItem, Category, Constraints, Preferences } from "../shared/types";
import { OCCASION_MIN_FORMALITY } from "../shared/princesses";

const raw = JSON.parse(readFileSync(path.join(ROOT, "data", "catalog.json"), "utf8"));
export const CATALOG: CatalogItem[] = raw.items;
export const CATALOG_NOTICE: string = raw.notice;
const BY_ID = new Map(CATALOG.map((i) => [i.id, i]));

export const getItem = (id: string) => BY_ID.get(id.trim().toUpperCase());

export type Role = "main" | "top" | "bottom" | "shoes" | "bag" | "jewelry" | "outerwear";
export const roleOf = (c: Category): Role =>
  c === "dress" ? "main" : c === "skirt" || c === "trousers" ? "bottom" : (c as Role);

export function constraintsFromPrefs(p: Preferences): Constraints {
  const weatherEnforced = p.comfort.includes("weather") || p.setting === "outdoor";
  return {
    budget: p.budget,
    occasion: p.occasion,
    noHeels: p.comfort.includes("noHeels"),
    walking: p.comfort.includes("walking"),
    modest: p.comfort.includes("modest"),
    weather: weatherEnforced ? p.weather : "warm",
    minFormality: OCCASION_MIN_FORMALITY[p.occasion] ?? 1,
    unavailable: [],
  };
}

export const isAvailable = (item: CatalogItem, c: Constraints) => item.available && !c.unavailable.includes(item.id);

// Per-item hard rules (no budget - budget applies to the whole outfit).
export function itemHardIssues(item: CatalogItem, c: Constraints): string[] {
  const issues: string[] = [];
  const role = roleOf(item.category);
  if (!isAvailable(item, c)) issues.push("UNAVAILABLE");
  if (role === "shoes") {
    if (c.noHeels && item.heel !== "flat") issues.push("HEELS_NOT_ALLOWED");
    if (c.walking && !item.walkable) issues.push("NOT_WALKABLE");
    if (c.weather === "rainy" && !item.weather.includes("rainy")) issues.push("WEATHER");
  }
  if (c.modest && ["main", "top", "bottom"].includes(role) && !item.modest) issues.push("NOT_MODEST");
  if (role === "outerwear" && c.weather !== "warm" && !item.weather.includes(c.weather)) issues.push("WEATHER");
  const floor = role === "top" ? c.minFormality - 1 : c.minFormality;
  if (["main", "top", "bottom", "shoes"].includes(role) && item.formality < floor) issues.push("DRESS_CODE");
  return issues;
}

export function aestheticItemScore(item: CatalogItem, princess: string, style: string) {
  if (item.princessTags.includes(princess as never)) return item.styleTags.includes(style as never) ? 1 : 0.85;
  return item.styleTags.includes(style as never) ? 0.6 : 0.3;
}

// Deterministic shortlist: every item an agent may legally pick for these constraints.
export function shortlist(c: Constraints, princess: string, style: string, perRole = 6, requireOccasion = true, cheapPerRole = 2) {
  const groups = new Map<Role, CatalogItem[]>();
  for (const item of CATALOG) {
    if (itemHardIssues(item, c).length) continue;
    if (item.price > c.budget) continue;
    const role = roleOf(item.category);
    const isAccessory = role === "bag" || role === "jewelry" || role === "outerwear";
    if (requireOccasion && !isAccessory && !item.occasions.includes(c.occasion)) continue;
    if (!groups.has(role)) groups.set(role, []);
    groups.get(role)!.push(item);
  }
  const out: CatalogItem[] = [];
  for (const [, items] of groups) {
    items.sort(
      (a, b) =>
        aestheticItemScore(b, princess, style) - aestheticItemScore(a, princess, style) ||
        Number(b.occasions.includes(c.occasion)) - Number(a.occasions.includes(c.occasion)) ||
        a.price - b.price,
    );
    const best = items.slice(0, perRole);
    // Always include the cheapest legal options so tight budgets stay solvable.
    const cheap = [...items].sort((a, b) => a.price - b.price).slice(0, cheapPerRole).filter((x) => !best.includes(x));
    out.push(...best, ...cheap);
  }
  return out;
}

// Compact one-line encoding used inside prompts (keeps tokens low).
export const compact = (i: CatalogItem) =>
  `${i.id}|${i.name}|${i.category}|$${i.price}|${i.color}|style:${i.styleTags.join("/")}|princess:${i.princessTags.join("/")}|formality:${i.formality}${i.heel ? `|heel:${i.heel}` : ""}${i.weather.includes("rainy") && ["shoes", "outerwear"].includes(i.category) ? "|rain-ready" : ""}`;

// Static prompt prefix shared by every agent. Identical bytes on every call, and longer than the
// provider's 1,024-token caching minimum, so repeat calls are billed at the cached-input rate.
export const PROMPT_CACHE = process.env.PROMPT_CACHE !== "off";
export const CATALOG_PREFIX = [
  "THE MIDNIGHT PROTOCOL - ROYAL CATALOG (real products from real retailers; recorded prices in USD).",
  "Each line: id|name|category|price|color|style tags|princess tags|formality 1-5|heel|rain-ready.",
  "This catalog is reference data only. Agents may recommend ONLY the ids listed as CANDIDATES in the user message,",
  "because candidates have already been filtered by code for availability, budget, comfort, weather and dress code.",
  ...CATALOG.map(compact),
].join("\n");
export const candidateBlock = (items: CatalogItem[]) =>
  PROMPT_CACHE ? `CANDIDATE_IDS (details are in the catalog above): ${items.map((i) => i.id).join(", ")}` : `CANDIDATES (id|name|category|price|color|tags):\n${items.map(compact).join("\n")}`;
export const prefixMessages = () => (PROMPT_CACHE ? [{ role: "system" as const, content: CATALOG_PREFIX }] : []);
