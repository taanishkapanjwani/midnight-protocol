// The Royal Council orchestrator. Agents exchange structured JSON; every status event maps to a real step.
import type { Constraints, Crisis, CrisisId, Outfit, Preferences } from "../shared/types";
import { princessById } from "../shared/princesses";
import { constraintsFromPrefs, getItem, itemHardIssues, roleOf, shortlist } from "./catalog";
import { cheapestPossible, needsOuterwear, scoreOutfit, solve, validateOutfit } from "./rules";
import { applyCrisis } from "./crises";
import { sanitizeFreeText } from "./safety";
import { fairyGodmother } from "./agents/godmother";
import { royalTreasurer } from "./agents/treasurer";
import { midnightGuardian } from "./agents/guardian";
import { SafetyStop, type RunContext } from "./llm";

const MAX_GODMOTHER_REVISIONS = 2;
const MAX_GUARDIAN_ATTEMPTS = 2;

export function buildOutfit(ids: string[], reasons: Record<string, string>, c: Constraints, prefs: Preferences, title: string, rationale: string, aiRating: number | null): Outfit {
  return {
    title,
    rationale,
    items: ids.map((id) => getItem(id)).filter(Boolean).map((i) => ({ ...i!, reason: reasons[i!.id] ?? "" })),
    validation: validateOutfit(ids, c),
    score: scoreOutfit(ids, c, prefs.princess, prefs.style, aiRating),
  };
}

// ---------------------------------------------------------------- Act I: style
export async function styleRun(ctx: RunContext, live: boolean, prefs: Preferences) {
  const emit = ctx.emit;
  const note = sanitizeFreeText(prefs.owned ?? "");
  if (note.flagged)
    emit({ type: "warning", agent: "system", message: "Safety: the wardrobe note looked like an instruction (possible prompt injection). It was withheld from the agents.", data: { flags: note.flags } });

  const c = constraintsFromPrefs(prefs);
  emit({ type: "status", agent: "godmother", message: "Your Fairy Godmother is selecting the perfect ensemble...", data: { constraints: c } });
  const candidates = shortlist(c, prefs.princess, prefs.style);
  emit({ type: "agent", agent: "godmother", message: `Catalog lookup: ${candidates.length} eligible pieces after deterministic filtering (of 79).` });

  if (!solve(c, prefs.princess, prefs.style))
    return { ok: false as const, reason: `Even magic has its limits. No available outfit satisfies every constraint (the cheapest valid outfit costs about $${cheapestPossible(c)}). Try increasing your budget or relaxing one preference.`, constraints: c };

  let feedback: string | null = null;
  let proposal = null as Awaited<ReturnType<typeof fairyGodmother>> | null;
  let report = null as ReturnType<typeof royalTreasurer> | null;
  let fallbackUsed = false;
  for (let round = 0; round <= MAX_GODMOTHER_REVISIONS; round++) {
    try {
      proposal = await fairyGodmother(ctx, live, prefs, c, candidates, note.safe, feedback);
    } catch (e) {
      if (e instanceof SafetyStop) emit({ type: "warning", agent: "system", message: e.message });
      else if (/rejected the API key/.test(String(e))) throw e;
      else emit({ type: "warning", agent: "godmother", message: String((e as Error).message) });
      break;
    }
    emit({ type: "agent", agent: "godmother", message: `Proposed "${proposal.title}" with ${proposal.picks.length} pieces.`, data: proposal });
    emit({ type: "status", agent: "treasurer", message: "The Royal Treasurer is counting the kingdom's coins..." });
    report = royalTreasurer(proposal.picks.map((p) => p.id), c, prefs.princess, prefs.style);
    if (report.validation.valid) {
      emit({ type: "agent", agent: "treasurer", message: `Approved: $${report.validation.total} of $${c.budget}. All ${report.validation.checks.length} checks passed.`, data: report.validation });
      break;
    }
    emit({ type: "warning", agent: "treasurer", message: `Rejected (round ${round + 1}): ${report.validation.violations.map((v) => v.message).join("; ")}`, data: report });
    feedback = report.feedback;
    if (round < MAX_GODMOTHER_REVISIONS) emit({ type: "status", agent: "godmother", message: "The Fairy Godmother is revising the look with the Treasurer's notes..." });
  }

  let ids = proposal?.picks.map((p) => p.id.toUpperCase()) ?? [];
  const reasons: Record<string, string> = Object.fromEntries((proposal?.picks ?? []).map((p) => [p.id.toUpperCase(), p.reason]));
  if (!validateOutfit(ids, c).valid) {
    // Deterministic, clearly labeled repair: keep the Godmother's legal picks, fill the rest exactly.
    const legal = ids.filter((id) => getItem(id) && itemHardIssues(getItem(id)!, c).length === 0);
    const fixed = solve(c, prefs.princess, prefs.style, dedupeRoles(legal)) ?? solve(c, prefs.princess, prefs.style);
    ids = fixed!.ids;
    fallbackUsed = true;
    for (const id of ids) reasons[id] ??= "[Treasurer fallback] Chosen by the deterministic solver to satisfy every rule.";
    emit({ type: "warning", agent: "treasurer", message: "The Treasurer completed the outfit with a rule-based repair (labeled as fallback)." });
  }
  const outfit = buildOutfit(ids, reasons, c, prefs, proposal?.title ?? `${princessById(prefs.princess).name}'s Ensemble`, proposal?.rationale ?? "", proposal?.aiRating ?? null);
  emit({ type: "result", agent: "system", message: "The enchanted wardrobe is ready.", data: outfit });
  return { ok: true as const, outfit, constraints: c, fallbackUsed, source: proposal?.source ?? "demo", safety: { injectionFlagged: note.flagged } };
}

function dedupeRoles(ids: string[]) {
  const seen = new Set<string>();
  return ids.filter((id) => {
    const r = roleOf(getItem(id)!.category);
    if (r === "jewelry") return true;
    if (seen.has(r)) return false;
    seen.add(r);
    return true;
  });
}

// ---------------------------------------------------------------- Act II: crisis analysis (Stepmother)
export function analyzeCrisis(prefs: Preferences, original: string[], crisisId: CrisisId) {
  const base = constraintsFromPrefs(prefs);
  const crisis = applyCrisis(crisisId, original, base);
  const nc = crisis.constraints;
  const affected = original
    .map((id) => ({ id, issues: itemHardIssues(getItem(id)!, nc) }))
    .filter((a) => a.issues.length)
    .map((a) => ({ id: a.id, why: `${getItem(a.id)!.name}: ${a.issues.join(", ").toLowerCase().replace(/_/g, " ")}` }));
  const remaining = original.filter((id) => !affected.some((a) => a.id === id));
  const required: string[] = [];
  const roles = remaining.map((id) => roleOf(getItem(id)!.category));
  if (needsOuterwear(nc) && !roles.includes("outerwear")) required.push("outerwear");
  if (!roles.includes("bag") && !roles.includes("jewelry")) required.push("bag or jewelry");
  return { base, crisis, affected, required, remaining };
}

export interface RepairMetrics {
  valid: boolean;
  retained: string[];
  removed: string[];
  added: string[];
  unnecessary: string[];
  priceBefore: number;
  priceAfter: number;
}

export function repairMetrics(original: string[], rescued: string[], c: Constraints, affected: string[], maySwap: string[]): RepairMetrics {
  const removed = original.filter((id) => !rescued.includes(id));
  const price = (ids: string[]) => ids.reduce((s, id) => s + (getItem(id)?.price ?? 0), 0);
  return {
    valid: validateOutfit(rescued, c).valid,
    retained: original.filter((id) => rescued.includes(id)),
    removed,
    added: rescued.filter((id) => !original.includes(id)),
    unnecessary: removed.filter((id) => !affected.includes(id) && !maySwap.includes(id)),
    priceBefore: price(original),
    priceAfter: price(rescued),
  };
}

// ---------------------------------------------------------------- Act III: rescue (Guardian)
export async function rescueRun(ctx: RunContext, live: boolean, prefs: Preferences, original: string[], crisisId: CrisisId) {
  const emit = ctx.emit;
  const { base, crisis, affected, required, remaining } = analyzeCrisis(prefs, original, crisisId);
  const nc = crisis.constraints;
  emit({ type: "status", agent: "stepmother", message: "The Wicked Stepmother has discovered a complication...", data: crisis });
  emit({ type: "agent", agent: "stepmother", message: crisis.narration, data: { changes: crisis.changes, affected, required } });

  const before = buildOutfit(original, {}, base, prefs, "Before Midnight", "", null);
  const underCrisis = buildOutfit(original, {}, nc, prefs, "At the Stroke of Twelve", "", null);
  const common = { crisis, affected, required, before, underCrisis };

  if (underCrisis.validation.valid) {
    emit({ type: "agent", agent: "guardian", message: "The outfit already survives this crisis - no changes needed." });
    return { ok: true as const, survivedUnchanged: true, rescued: { ...before, validation: underCrisis.validation, score: underCrisis.score, title: "Untouched by Midnight" }, explanation: "Your outfit already satisfies every new constraint. The Guardian changed nothing.", tradeoffs: [], metrics: repairMetrics(original, original, nc, [], []), source: "rules", ...common };
  }

  emit({ type: "status", agent: "guardian", message: "The Midnight Guardian is restoring the enchantment..." });
  const floor = cheapestPossible(nc);
  if (floor > nc.budget) {
    emit({ type: "warning", agent: "guardian", message: `Infeasible: the cheapest valid outfit costs $${floor}, above the $${nc.budget} budget.` });
    return { ok: false as const, reason: `Even magic has its limits. No available outfit satisfies every constraint - the cheapest valid outfit costs $${floor}, but the budget is $${nc.budget}. Try increasing your budget or relaxing one preference.`, ...common };
  }

  // Which unaffected items can stay? Unlock the most expensive ones only if the budget forces it.
  let keep = [...remaining];
  const maySwap: string[] = [];
  while (!solve(nc, prefs.princess, prefs.style, keep) && keep.length) {
    const priciest = [...keep].sort((a, b) => getItem(b)!.price - getItem(a)!.price)[0];
    keep = keep.filter((id) => id !== priciest);
    maySwap.push(priciest);
  }
  const fallbackSolution = solve(nc, prefs.princess, prefs.style, keep);
  if (!fallbackSolution) return { ok: false as const, reason: "Even magic has its limits. No available outfit satisfies every constraint. Try increasing your budget or relaxing one preference.", ...common };
  if (maySwap.length) emit({ type: "agent", agent: "treasurer", message: `Budget check: to stay within $${nc.budget}, these pieces may also be swapped: ${maySwap.map((id) => getItem(id)!.name).join(", ")}.` });

  const neededRoles = new Set<string>([...affected.map((a) => roleOf(getItem(a.id)!.category)), ...maySwap.map((id) => roleOf(getItem(id)!.category))]);
  if (required.includes("outerwear")) neededRoles.add("outerwear");
  if (required.includes("bag or jewelry")) ["bag", "jewelry"].forEach((r) => neededRoles.add(r));
  if (neededRoles.has("main")) ["top", "bottom"].forEach((r) => neededRoles.add(r));
  const candidates = shortlist(nc, prefs.princess, prefs.style, 5, false, 3).filter((i) => neededRoles.has(roleOf(i.category)) && !original.includes(i.id));
  emit({ type: "agent", agent: "guardian", message: `Impact analysis: ${affected.length} affected piece(s), ${keep.length} kept, ${candidates.length} replacement candidates.` });

  let ids: string[] = [];
  let explanation = "";
  let tradeoffs: string[] = [];
  let aiRating: number | null = null;
  let reasons: Record<string, string> = {};
  let source: "llm" | "fallback" | "demo" = live ? "llm" : "demo";
  let feedback: string | null = null;
  let success = false;

  if (live) {
    for (let attempt = 1; attempt <= MAX_GUARDIAN_ATTEMPTS && !success; attempt++) {
      let plan;
      try {
        plan = await midnightGuardian(ctx, prefs, original, crisis, affected, required, keep, maySwap, candidates, feedback);
      } catch (e) {
        if (/rejected the API key/.test(String(e))) throw e;
        emit({ type: "warning", agent: "guardian", message: (e as Error).message });
        break;
      }
      const v = validateOutfit(plan.ids, nc);
      const m = repairMetrics(original, plan.ids, nc, affected.map((a) => a.id), maySwap);
      const itemized = plan.ids.map((id) => { const it = getItem(id); return it ? `${id} $${it.price}` : `${id} (unknown)`; }).join(" + ");
      const problems = [`Your plan: ${itemized} = $${v.total} (budget $${nc.budget}).`, ...v.violations.map((x) => `${x.code}: ${x.message}`), ...m.unnecessary.map((id) => `UNNECESSARY_CHANGE: ${id} was unaffected - keep it`)];
      if (!plan.feasible) problems.push("A valid repair DOES exist within the candidates - try again.");
      if (problems.length === 1) {
        ({ ids, explanation, tradeoffs, aiRating, reasons } = plan);
        success = true;
        emit({ type: "agent", agent: "guardian", message: `Repair validated on attempt ${attempt}: $${v.total} of $${nc.budget}.`, data: plan });
      } else {
        feedback = problems.join("\n");
        emit({ type: "warning", agent: "guardian", message: `Validator rejected repair attempt ${attempt}: ${problems.join("; ")}` });
      }
    }
  }
  if (!success) {
    ids = fallbackSolution.ids;
    source = live ? "fallback" : "demo";
    const label = live ? "[Rule-based fallback]" : "[Demo mode - rule-based]";
    for (const id of ids) if (!original.includes(id)) reasons[id] = `${label} Best-scoring valid replacement under the new constraints.`;
    explanation = live
      ? "The AI Guardian's plans did not pass validation, so the deterministic solver produced this repair. It keeps every unaffected piece it could."
      : "DEMO MODE: this repair was computed by the deterministic solver, not a live AI model.";
    tradeoffs = [];
    emit({ type: "warning", agent: "guardian", message: `${label} repair applied.` });
  }

  const m = repairMetrics(original, ids, nc, affected.map((a) => a.id), maySwap);
  const rescued = buildOutfit(ids, Object.fromEntries(ids.map((id) => [id, reasons[id] ?? "Kept from your original look."])), nc, prefs, "After the Rescue", explanation, aiRating);
  if (!rescued.validation.valid)
    return { ok: false as const, reason: "The rescue could not be validated, so it is not shown. Even magic has its limits.", ...common };
  emit({ type: "result", agent: "system", message: "The magic survived midnight.", data: rescued });
  return { ok: true as const, survivedUnchanged: false, rescued, explanation, tradeoffs, metrics: m, maySwap, source, ...common };
}

export type CrisisAnalysis = ReturnType<typeof analyzeCrisis> & { crisis: Crisis };
