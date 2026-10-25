// Agent 2 - The Royal Treasurer (deterministic code): prices, availability, budget and rule checks.
// Budget arithmetic is never delegated to the language model.
import type { Constraints, ValidationResult } from "../../shared/types";
import { CATALOG, aestheticItemScore, getItem, itemHardIssues, roleOf } from "../catalog";
import { validateOutfit } from "../rules";

export interface TreasurerReport {
  validation: ValidationResult;
  feedback: string | null;
  suggestions: { forId: string | null; id: string; name: string; price: number }[];
}

export function royalTreasurer(ids: string[], c: Constraints, princess: string, style: string): TreasurerReport {
  const validation = validateOutfit(ids, c);
  if (validation.valid) return { validation, feedback: null, suggestions: [] };

  const suggestions: TreasurerReport["suggestions"] = [];
  const cheaperIn = (category: string, maxPrice: number, exclude: string[]) =>
    CATALOG.filter((i) => i.category === category && i.price < maxPrice && !exclude.includes(i.id) && itemHardIssues(i, c).length === 0)
      .sort((a, b) => aestheticItemScore(b, princess, style) - aestheticItemScore(a, princess, style) || a.price - b.price)
      .slice(0, 2);

  // Lower-cost or rule-compliant alternatives for each problem item.
  for (const v of validation.violations) {
    const item = v.itemId ? getItem(v.itemId) : undefined;
    if (!item) continue;
    for (const alt of cheaperIn(item.category, item.price + 40, ids))
      suggestions.push({ forId: item.id, id: alt.id, name: alt.name, price: alt.price });
  }
  if (validation.violations.some((v) => v.code === "OVER_BUDGET")) {
    const priciest = ids.map(getItem).filter(Boolean).sort((a, b) => b!.price - a!.price)[0]!;
    for (const alt of cheaperIn(priciest.category, priciest.price, ids))
      suggestions.push({ forId: priciest.id, id: alt.id, name: alt.name, price: alt.price });
  }
  const lines = validation.violations.map((v) => `- ${v.code}: ${v.message}`);
  const lineItems = ids.map((id) => {
    const i = getItem(id);
    return i ? `${i.id} ${i.name} $${i.price}` : `${id} (unknown)`;
  });
  const feedback = [
    `Your outfit was REJECTED. Itemized: ${lineItems.join(" + ")} = $${validation.total} (budget $${c.budget}).`,
    ...lines,
    suggestions.length ? `Valid alternatives you may use: ${suggestions.map((s) => `${s.id} ${s.name} $${s.price}`).join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return { validation, feedback, suggestions };
}

export const roleList = (ids: string[]) => ids.map((id) => roleOf(getItem(id)!.category));
