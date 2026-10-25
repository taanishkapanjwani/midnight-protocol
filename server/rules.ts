// Deterministic rules engine: validation, Midnight Survival Score, and an exact solver.
// No language model is involved here - arithmetic and hard constraints are code, not guesses.
import type { CatalogItem, Constraints, ScoreCard, ValidationResult, Violation } from "../shared/types";
import { CATALOG, aestheticItemScore, getItem, itemHardIssues, roleOf, type Role } from "./catalog";

const MESSAGES: Record<string, string> = {
  UNAVAILABLE: "is not available",
  HEELS_NOT_ALLOWED: "has a heel, but heels are not allowed",
  NOT_WALKABLE: "is not comfortable for walking",
  NOT_MODEST: "is not a modest silhouette",
  WEATHER: "is not suitable for the weather",
  DRESS_CODE: "is below the required dress code",
};

export const needsOuterwear = (c: Constraints) => c.weather === "cold" || c.weather === "rainy";

export function validateOutfit(ids: string[], c: Constraints): ValidationResult {
  const violations: Violation[] = [];
  const items: CatalogItem[] = [];
  for (const id of ids) {
    const item = getItem(id);
    if (!item) violations.push({ code: "INVALID_ID", itemId: id, message: `"${id}" is not a catalog product ID` });
    else items.push(item);
  }
  for (const item of items)
    for (const code of itemHardIssues(item, c))
      violations.push({ code: code as Violation["code"], itemId: item.id, message: `${item.name} ${MESSAGES[code]}` });

  const count = (r: Role) => items.filter((i) => roleOf(i.category) === r).length;
  const hasDress = count("main") > 0;
  const hasSeparates = count("top") > 0 && count("bottom") > 0;
  if (!hasDress && !hasSeparates) violations.push({ code: "MISSING_ROLE", message: "Outfit needs a dress or a top with a skirt/trousers" });
  if (hasDress && (count("top") > 0 || count("bottom") > 0))
    violations.push({ code: "DUPLICATE_ROLE", message: "Choose either a dress or separates, not both" });
  if (count("shoes") !== 1) violations.push({ code: count("shoes") ? "DUPLICATE_ROLE" : "MISSING_ROLE", message: "Outfit needs exactly one pair of shoes" });
  if (count("bag") + count("jewelry") === 0) violations.push({ code: "MISSING_ROLE", message: "Outfit needs at least one bag or jewelry piece" });
  for (const r of ["main", "top", "bottom", "bag", "outerwear"] as Role[])
    if (count(r) > 1) violations.push({ code: "DUPLICATE_ROLE", message: `Only one ${r} item allowed` });
  if (count("jewelry") > 2) violations.push({ code: "DUPLICATE_ROLE", message: "At most two jewelry pieces" });
  if (needsOuterwear(c) && count("outerwear") === 0)
    violations.push({ code: "WEATHER", message: `${c.weather === "rainy" ? "Rain" : "Cold"} requires a suitable outer layer` });
  if (ids.length > 6) violations.push({ code: "TOO_MANY_ITEMS", message: "At most six items" });
  if (new Set(ids).size !== ids.length) violations.push({ code: "DUPLICATE_ROLE", message: "The same item was listed twice" });

  const total = Math.round(items.reduce((s, i) => s + i.price, 0) * 100) / 100;
  if (total > c.budget) violations.push({ code: "OVER_BUDGET", message: `Total $${total} exceeds the $${c.budget} budget by $${(total - c.budget).toFixed(2)}` });

  const has = (code: string) => violations.some((v) => v.code === code);
  const checks = [
    { label: "Every item exists in the catalog", passed: !has("INVALID_ID"), hard: true },
    { label: "Every item is available", passed: !has("UNAVAILABLE"), hard: true },
    { label: `Total within $${c.budget} budget`, passed: !has("OVER_BUDGET"), hard: true },
    { label: "Complete outfit structure", passed: !has("MISSING_ROLE") && !has("DUPLICATE_ROLE") && !has("TOO_MANY_ITEMS"), hard: true },
    { label: "Meets the dress code", passed: !has("DRESS_CODE"), hard: true },
  ];
  if (c.noHeels) checks.push({ label: "No heels", passed: !has("HEELS_NOT_ALLOWED"), hard: true });
  if (c.walking) checks.push({ label: "Walkable shoes", passed: !has("NOT_WALKABLE"), hard: true });
  if (c.modest) checks.push({ label: "Modest silhouettes", passed: !has("NOT_MODEST"), hard: true });
  if (c.weather !== "warm") checks.push({ label: `Ready for ${c.weather} weather`, passed: !has("WEATHER"), hard: true });

  return { valid: violations.length === 0, total, budget: c.budget, remaining: Math.round((c.budget - total) * 100) / 100, violations, checks };
}

// Midnight Survival Score - documented rubric (see README "Scoring rubric").
export function scoreOutfit(ids: string[], c: Constraints, princess: string, style: string, aiAestheticRating: number | null = null): ScoreCard {
  const v = validateOutfit(ids, c);
  const items = ids.map(getItem).filter(Boolean) as CatalogItem[];
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const aesthetic = Math.round(avg(items.map((i) => aestheticItemScore(i, princess, style))) * 100);
  const budget = v.total <= c.budget ? 100 : Math.max(0, Math.round((c.budget / Math.max(v.total, 1)) * 60));
  const wearables = items.filter((i) => ["main", "top", "bottom", "shoes"].includes(roleOf(i.category)));
  const dressCodeMisses = v.violations.filter((x) => x.code === "DRESS_CODE").length;
  const occasion = Math.max(0, Math.round(avg(wearables.map((i) => (i.occasions.includes(c.occasion) ? 1 : 0.4))) * 100) - dressCodeMisses * 25);
  const practicalChecks = v.checks.filter((k) => /heels|Walkable|Modest|weather/i.test(k.label));
  const shoes = items.find((i) => i.category === "shoes");
  const practicality = practicalChecks.length
    ? Math.round((practicalChecks.filter((k) => k.passed).length / practicalChecks.length) * 100)
    : 70 + (shoes?.walkable ? 30 : 0);
  const hardFail = !v.valid;
  const raw = Math.round((aesthetic + budget + occasion + practicality) / 4);
  return { aesthetic, budget, occasion, practicality, overall: hardFail ? Math.min(raw, 49) : raw, hardFail, aiAestheticRating };
}

// Exact solver: best valid outfit for the constraints, optionally keeping locked items.
// Used for (1) feasibility checks, (2) demo mode, (3) clearly labeled fallback repairs.
export function solve(c: Constraints, princess: string, style: string, locked: string[] = []) {
  const lockedItems = locked.map(getItem).filter(Boolean) as CatalogItem[];
  const lockedRoles = new Set(lockedItems.map((i) => roleOf(i.category)));
  // Best-fitting items PLUS the cheapest ones, so tight budgets are never missed.
  const pool = (role: Role, nFit = 6, nCheap = 3) => {
    const legal = CATALOG.filter((i) => roleOf(i.category) === role && itemHardIssues(i, c).length === 0 && i.price <= c.budget);
    const best = [...legal].sort((a, b) => fit(b) - fit(a) || a.price - b.price).slice(0, nFit);
    const cheap = [...legal].sort((a, b) => a.price - b.price).slice(0, nCheap);
    return [...best, ...cheap.filter((x) => !best.includes(x))];
  };
  const fit = (i: CatalogItem) =>
    aestheticItemScore(i, princess, style) + (i.occasions.includes(c.occasion) ? 0.5 : 0);

  const lockedDress = lockedRoles.has("main");
  const lockedSeparates = lockedRoles.has("top") || lockedRoles.has("bottom");
  const mains: CatalogItem[][] = [];
  if (!lockedSeparates) for (const d of lockedDress ? [null] : pool("main")) mains.push(d ? [d] : []);
  if (!lockedDress) {
    const tops = lockedRoles.has("top") ? [null] : pool("top", 3, 2);
    const bottoms = lockedRoles.has("bottom") ? [null] : pool("bottom", 3, 2);
    for (const t of tops) for (const b of bottoms) mains.push([t, b].filter(Boolean) as CatalogItem[]);
  }
  const opt = (role: Role, required: boolean) => {
    if (lockedRoles.has(role)) return [[]] as CatalogItem[][];
    const xs = pool(role).map((i) => [i]);
    return required ? xs : [[], ...xs];
  };
  const shoes = opt("shoes", true);
  const bags = opt("bag", false);
  const jewels = opt("jewelry", false);
  const outer = opt("outerwear", needsOuterwear(c));
  const base = lockedItems.reduce((s, i) => s + i.price, 0);

  let best: { ids: string[]; value: number; total: number } | null = null;
  for (const m of mains) for (const s of shoes) for (const b of bags) for (const j of jewels) for (const o of outer) {
    const picked = [...m, ...s, ...b, ...j, ...o];
    const total = base + picked.reduce((a, i) => a + i.price, 0);
    if (total > c.budget) continue;
    const ids = [...locked, ...picked.map((i) => i.id)];
    if (!validateOutfit(ids, c).valid) continue;
    const all = [...lockedItems, ...picked];
    const value = all.reduce((a, i) => a + fit(i), 0) / all.length + all.length * 0.05 - total / (c.budget * 50);
    if (!best || value > best.value) best = { ids, value, total };
  }
  return best;
}

// Cheapest valid outfit cost - used by the Guardian to prove infeasibility honestly.
export function cheapestPossible(c: Constraints) {
  const loose = { ...c, budget: 1e9 };
  const minOf = (role: Role) =>
    Math.min(...CATALOG.filter((i) => roleOf(i.category) === role && itemHardIssues(i, loose).length === 0).map((i) => i.price));
  const main = Math.min(minOf("main"), minOf("top") + minOf("bottom"));
  const acc = Math.min(minOf("bag"), minOf("jewelry"));
  return main + minOf("shoes") + acc + (needsOuterwear(c) ? minOf("outerwear") : 0);
}
