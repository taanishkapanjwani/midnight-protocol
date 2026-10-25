// Baseline for the Royal Laboratory: ONE general-purpose LLM call asked to repair the outfit,
// with the full catalog and no deterministic shortlist, validator feedback or retries on rule violations.
import { BaselineOutputSchema, type Crisis, type Preferences } from "../../shared/types";
import { OCCASION_LABELS, STYLE_LABELS, COMFORT_LABELS, princessById } from "../../shared/princesses";
import { CATALOG, compact, getItem } from "../catalog";
import { callAgent, type RunContext } from "../llm";

const SYSTEM = `You are a helpful fashion stylist. The user's outfit was disrupted by a problem. Return a repaired complete outfit using only product IDs from the catalog provided.
An outfit is one dress or a top plus skirt/trousers, one pair of shoes, and at least one bag or jewelry piece; add an outer layer if the weather needs it.
Stay within the budget. Return ONLY JSON: {"items":[{"id":"<id>","reason":"<sentence>"}],"explanation":"<2-3 sentences>"}`;

export async function baselineRepair(ctx: RunContext, prefs: Preferences, original: string[], crisis: Crisis) {
  const p = princessById(prefs.princess);
  const catalogLines = CATALOG.map((i) => `${compact(i)}|${i.available ? "in stock" : "SOLD OUT"}`).join("\n");
  const user = [
    `I'm dressing as a ${p.name}-inspired look (${p.keywords.join(", ")}) for a ${OCCASION_LABELS[prefs.occasion]}. Style: ${STYLE_LABELS[prefs.style]}. Comfort: ${prefs.comfort.map((x) => COMFORT_LABELS[x]).join(", ") || "none"}.`,
    `My outfit was: ${original.map((id) => `${id} ${getItem(id)?.name}`).join(", ")}.`,
    `Problem: ${crisis.narration} ${crisis.changes.join(". ")}. My budget is $${crisis.constraints.budget}.`,
    `CATALOG:\n${catalogLines}`,
  ].join("\n");
  const out = await callAgent(ctx, "baseline", [
    { role: "system", content: SYSTEM },
    { role: "user", content: user },
  ], BaselineOutputSchema);
  return { ids: out.items.map((i) => i.id.trim().toUpperCase()), explanation: out.explanation };
}
