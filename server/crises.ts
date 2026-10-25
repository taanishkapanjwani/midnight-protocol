// The Wicked Stepmother's crisis library: controlled, reproducible disruptions.
import type { CatalogItem, Constraints, Crisis, CrisisId } from "../shared/types";
import { CRISIS_IDS } from "../shared/types";
import { getItem, roleOf } from "./catalog";
import { validateOutfit } from "./rules";

export const CRISIS_INFO: Record<CrisisId, { title: string; blurb: string }> = {
  sold_out: { title: "The Vanishing Gown", blurb: "Your main piece sells out moments before the ball." },
  long_walk: { title: "The Long Walk", blurb: "The carriage is cancelled - a 20-minute walk to the palace." },
  rain: { title: "The Enchanted Storm", blurb: "Rain clouds gather over the kingdom." },
  cold_snap: { title: "The Frost Spell", blurb: "A sudden cold snap chills the evening." },
  strict_dress_code: { title: "The Royal Decree", blurb: "The event is upgraded to black tie." },
  budget_cut: { title: "The Raided Treasury", blurb: "Your budget shrinks by 30%." },
  accessory_lost: { title: "The Stolen Jewel", blurb: "Your accessory is lost on the way." },
  no_heels: { title: "The Twisted Ankle", blurb: "A twisted ankle means no heels tonight." },
};

export function applyCrisis(id: CrisisId, outfitIds: string[], base: Constraints): Crisis {
  const items = outfitIds.map(getItem).filter(Boolean) as CatalogItem[];
  const find = (...roles: string[]) => items.filter((i) => roles.includes(roleOf(i.category))).sort((a, b) => b.price - a.price)[0];
  const shoes = find("shoes");
  const c: Constraints = { ...base, unavailable: [...base.unavailable] };
  let target: CatalogItem | undefined;
  let narration = "";
  const changes: string[] = [];

  switch (id) {
    case "sold_out":
      target = find("main") ?? find("bottom", "top");
      if (target) c.unavailable.push(target.id);
      narration = `Oh dear! The ${target?.name ?? "centerpiece"} has vanished from the royal wardrobe - sold out moments before the ball.`;
      changes.push(`${target?.name ?? "Main piece"} is now unavailable`);
      break;
    case "long_walk":
      c.walking = true;
      target = shoes;
      narration = `The carriage has turned back into a pumpkin! Your ${shoes?.name ?? "shoes"} must now survive a 20-minute walk to the royal ball.`;
      changes.push("Shoes must be comfortable for a 20-minute walk");
      break;
    case "rain":
      c.weather = "rainy";
      target = shoes;
      narration = "Storm clouds roll over the palace. Every step to the ball will be through the rain.";
      changes.push("Weather is now rainy: rain-ready shoes and an outer layer are required");
      break;
    case "cold_snap":
      c.weather = "cold";
      narration = "A frost spell falls over the kingdom. The night air is suddenly bitter cold.";
      changes.push("Weather is now cold: a warm outer layer is required");
      break;
    case "strict_dress_code":
      c.minFormality = Math.min(5, Math.max(4, base.minFormality + 1));
      target = find("main", "bottom");
      narration = `A royal messenger arrives: the evening is now strictly black tie. Formality level ${c.minFormality} or higher is required.`;
      changes.push(`Dress code raised to formality ${c.minFormality}/5 for clothing and shoes`);
      break;
    case "budget_cut":
      c.budget = Math.round(base.budget * 0.7);
      narration = `The royal treasury has been raided! Your budget shrinks from $${base.budget} to $${c.budget}.`;
      changes.push(`Budget reduced 30% to $${c.budget}`);
      break;
    case "accessory_lost":
      target = find("jewelry") ?? find("bag");
      if (target) c.unavailable.push(target.id);
      narration = `A mischievous raven has stolen your ${target?.name ?? "accessory"}!`;
      changes.push(`${target?.name ?? "Accessory"} is no longer available`);
      break;
    case "no_heels":
      c.noHeels = true;
      target = shoes;
      narration = "A twisted ankle on the palace stairs - tonight, only flat shoes will do.";
      changes.push("No heels allowed: flat shoes only");
      break;
  }
  return { id, title: CRISIS_INFO[id].title, narration, targetItemId: target?.id ?? null, changes, constraints: c };
}

export const crisisBreaksOutfit = (id: CrisisId, ids: string[], base: Constraints) =>
  !validateOutfit(ids, applyCrisis(id, ids, base).constraints).valid;

// Proposal policy: the most realistic crisis that actually threatens THIS outfit.
export function proposeCrisis(ids: string[], base: Constraints): CrisisId {
  const shoes = ids.map(getItem).find((i) => i?.category === "shoes");
  const order: CrisisId[] = [];
  if (shoes?.heel === "high") order.push("long_walk", "no_heels");
  if (base.weather === "warm") order.push("rain");
  order.push("sold_out", "budget_cut", "strict_dress_code", "accessory_lost", "cold_snap");
  return order.find((id) => crisisBreaksOutfit(id, ids, base)) ?? "sold_out";
}

// Seeded random choice among crises that actually break the outfit (reproducible with a seed).
export function randomCrisis(ids: string[], base: Constraints, seed: number): CrisisId {
  const effective = CRISIS_IDS.filter((id) => crisisBreaksOutfit(id, ids, base));
  const list = effective.length ? effective : [...CRISIS_IDS];
  const x = Math.abs(Math.sin(seed) * 10000);
  return list[Math.floor((x - Math.floor(x)) * list.length)];
}
