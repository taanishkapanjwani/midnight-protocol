// Shop the Royal Look: "Find My Glass Slipper" alternatives and checkout validation.
// Everything here is deterministic: alternatives come only from the verified catalog and are
// accepted only if the whole outfit still passes every rule (budget, dress code, comfort, weather).
import type { CatalogItem, Constraints, CrisisId, Preferences } from "../shared/types";
import { CATALOG, aestheticItemScore, constraintsFromPrefs, getItem, itemHardIssues, roleOf } from "./catalog";
import { applyCrisis } from "./crises";
import { validateOutfit } from "./rules";

export type AltGoal = "similar" | "cheaper" | "comfier";

export function shopConstraints(prefs: Preferences, crisis?: { originalIds: string[]; crisisId: CrisisId }): Constraints {
  const base = constraintsFromPrefs(prefs);
  return crisis ? applyCrisis(crisis.crisisId, crisis.originalIds, base).constraints : base;
}

// Bags and jewelry are interchangeable accessories; every other slot swaps like for like.
const ACCESSORY = new Set(["bag", "jewelry"]);
const sameSlot = (a: CatalogItem, b: CatalogItem) =>
  roleOf(a.category) === roleOf(b.category) || (ACCESSORY.has(a.category) && ACCESSORY.has(b.category));

export function findAlternatives(prefs: Preferences, outfitIds: string[], itemId: string, c: Constraints, goal: AltGoal) {
  const current = getItem(itemId);
  if (!current) return { error: "Unknown item" as const };
  const others = outfitIds.filter((id) => id !== itemId);
  const results = [];
  for (const cand of CATALOG) {
    if (cand.id === itemId || outfitIds.includes(cand.id) || !sameSlot(cand, current)) continue;
    if (itemHardIssues(cand, c).length) continue;
    const ids = [...others, cand.id];
    const v = validateOutfit(ids, c);
    if (!v.valid) continue;
    const delta = Math.round((cand.price - current.price) * 100) / 100;
    if (goal === "cheaper" && delta >= 0) continue;
    const comfier = roleOf(cand.category) === "shoes" ? (cand.heel === "flat" && current.heel !== "flat") || (cand.walkable && !current.walkable) : false;
    if (goal === "comfier" && !comfier) continue;
    const fit = aestheticItemScore(cand, prefs.princess, prefs.style) + (cand.occasions.includes(c.occasion) ? 0.4 : 0);
    const reasons: string[] = [];
    if (delta < 0) reasons.push(`Saves $${Math.abs(delta).toFixed(2)}`);
    if (cand.princessTags.includes(prefs.princess)) reasons.push("Same princess palette");
    if (comfier) reasons.push(cand.heel === "flat" ? "Flat and walkable" : "Easier to walk in");
    if (cand.weather.includes("rainy") && !current.weather.includes("rainy") && ["shoes", "outerwear"].includes(cand.category)) reasons.push("Rain-ready");
    if (cand.retailer !== current.retailer) reasons.push(`From ${cand.retailer}`);
    const score = goal === "cheaper" ? -cand.price : goal === "comfier" ? fit + (cand.heel === "flat" ? 1 : 0) : fit - Math.abs(delta) / 400;
    results.push({ item: cand, delta, newTotal: v.total, reasons, score });
  }
  results.sort((a, b) => b.score - a.score);
  return {
    current,
    budget: c.budget,
    goal,
    alternatives: results.slice(0, 4).map(({ score: _s, ...r }) => r),
    explanation: results.length
      ? `${results.length} catalog piece${results.length === 1 ? "" : "s"} could replace the ${current.name} while keeping every rule (budget $${c.budget}).`
      : `No catalog piece can replace the ${current.name} without breaking a rule${goal !== "similar" ? ` for "${goal}"` : ""}. Try another search.`,
  };
}

export function budgetFloor(prefs: Preferences) {
  // Cheapest complete outfit that satisfies the user's own rules (used to guide the budget step).
  const c = constraintsFromPrefs({ ...prefs, budget: 5000 });
  const pool = (role: string) => CATALOG.filter((i) => roleOf(i.category) === role && itemHardIssues(i, c).length === 0).map((i) => i.price);
  const min = (xs: number[]) => (xs.length ? Math.min(...xs) : Infinity);
  const main = Math.min(min(pool("main")), min(pool("top")) + min(pool("bottom")));
  const acc = Math.min(min(pool("bag")), min(pool("jewelry")));
  const outer = c.weather === "cold" || c.weather === "rainy" ? min(pool("outerwear")) : 0;
  const floor = main + min(pool("shoes")) + acc + outer;
  return { floor: Number.isFinite(floor) ? Math.ceil(floor) : null };
}
