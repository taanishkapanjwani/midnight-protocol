// Agent 4 - The Midnight Guardian (LLM + deterministic validation): repairs only what the crisis broke.
import { GuardianOutputSchema, type CatalogItem, type Constraints, type Crisis, type GuardianOutput, type Preferences } from "../../shared/types";
import { princessById } from "../../shared/princesses";
import { candidateBlock, compact, getItem, prefixMessages } from "../catalog";
import { callAgent, type RunContext } from "../llm";
import { needsOuterwear } from "../rules";

export const GUARDIAN_SYSTEM = `You are THE MIDNIGHT GUARDIAN, the rescue agent inside "The Midnight Protocol", a multi-agent fashion app.
A crisis has broken part of an outfit. Repair it with the SMALLEST change that satisfies every new constraint while preserving the princess aesthetic.

HARD RULES (a deterministic validator will reject violations):
1. Only use product IDs from CANDIDATES. Never invent IDs, prices, links or availability.
2. You MUST replace or remove every item listed in AFFECTED. You MUST add any role listed in REQUIRED_ADDITIONS.
3. Do NOT touch items listed in KEEP unless they also appear in MAY_SWAP_FOR_BUDGET and the budget cannot be met otherwise.
4. Final outfit structure: one dress OR top+skirt/trousers; exactly one pair of shoes; at least one bag or jewelry (max 1 bag, 2 jewelry); an outer layer if required; max 6 items.
5. Final total must be <= NEW_BUDGET. Add prices carefully.
6. If no valid repair exists, set "feasible": false and explain honestly. Never pretend a rescue worked.

Return ONLY JSON:
{"replacements": [{"removeId": "<id>", "addId": "<id>", "reason": "<one sentence>"}],
 "additions": [{"addId": "<id>", "reason": "<one sentence>"}],
 "removals": [{"removeId": "<id>", "reason": "<one sentence>"}],
 "explanation": "<2-3 sentences addressed to the user about what changed and why>",
 "tradeoffs": ["<short trade-off>", "..."],
 "aestheticPreserved": <integer 1-5, how well the princess aesthetic survived>,
 "feasible": true}`;

export interface RepairPlan {
  ids: string[];
  explanation: string;
  tradeoffs: string[];
  aiRating: number | null;
  reasons: Record<string, string>;
  feasible: boolean;
}

export function applyPlan(original: string[], out: GuardianOutput): string[] {
  const norm = (s: string) => s.trim().toUpperCase();
  const ids = original.filter(
    (id) => !out.replacements.some((r) => norm(r.removeId) === id) && !out.removals.some((r) => norm(r.removeId) === id),
  );
  for (const r of out.replacements) if (!ids.includes(r.addId)) ids.push(r.addId.trim().toUpperCase());
  for (const a of out.additions) if (!ids.includes(a.addId)) ids.push(a.addId.trim().toUpperCase());
  return ids;
}

export async function midnightGuardian(
  ctx: RunContext,
  prefs: Preferences,
  original: string[],
  crisis: Crisis,
  affected: { id: string; why: string }[],
  requiredAdditions: string[],
  keep: string[],
  maySwap: string[],
  candidates: CatalogItem[],
  feedback: string | null,
): Promise<RepairPlan> {
  const c: Constraints = crisis.constraints;
  const princess = princessById(prefs.princess);
  const line = (id: string) => {
    const i = getItem(id);
    return i ? compact(i) : id;
  };
  const keptTotal = keep.reduce((s, id) => s + (getItem(id)?.price ?? 0), 0);
  const originalTotal = original.reduce((s, id) => s + (getItem(id)?.price ?? 0), 0);
  const savings = originalTotal - c.budget;
  const user = [
    `PRINCESS: ${princess.name} - ${princess.epithet}. Keywords: ${princess.keywords.join(", ")}.`,
    `ORIGINAL_OUTFIT:\n${original.map(line).join("\n")}`,
    `CRISIS: ${crisis.narration}`,
    `NEW_CONSTRAINTS: ${crisis.changes.join("; ")}. NEW_BUDGET: $${c.budget}. Weather: ${c.weather}. Outer layer required: ${needsOuterwear(c)}. Min formality: ${c.minFormality}/5.`,
    `AFFECTED (must change):\n${affected.map((a) => `${a.id}: ${a.why}`).join("\n") || "none"}`,
    `REQUIRED_ADDITIONS: ${requiredAdditions.join(", ") || "none"}`,
    `KEEP (unaffected, total $${keptTotal}): ${keep.join(", ") || "none"}`,
    `MAY_SWAP_FOR_BUDGET: ${maySwap.join(", ") || "none"}`,
    `ORIGINAL_TOTAL: $${originalTotal}. ${savings > 0 ? `The outfit is $${savings} OVER the new budget: you MUST replace pieces from MAY_SWAP_FOR_BUDGET with cheaper CANDIDATES of the same category until the total is <= $${c.budget}.` : "The original total fits the new budget."}`,
    `${candidateBlock(candidates)}\n(All candidates satisfy the new rules individually.)`,
    feedback ? `VALIDATOR FEEDBACK ON YOUR LAST PLAN (fix all):\n${feedback}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const out = await callAgent(ctx, "guardian", [
    ...prefixMessages(),
    { role: "system", content: GUARDIAN_SYSTEM },
    { role: "user", content: user },
  ], GuardianOutputSchema);
  const reasons: Record<string, string> = {};
  for (const r of out.replacements) reasons[r.addId.toUpperCase()] = r.reason;
  for (const a of out.additions) reasons[a.addId.toUpperCase()] = a.reason;
  return {
    ids: applyPlan(original, out),
    explanation: out.explanation,
    tradeoffs: out.tradeoffs,
    aiRating: out.aestheticPreserved,
    reasons,
    feasible: out.feasible,
  };
}
