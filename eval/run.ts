// The Royal Laboratory: reproducible evaluation of the Royal Council vs a single-agent baseline.
// Usage: npm run eval            (live AI; requires PORTKEY_API_KEY)
//        npm run eval -- --demo  (rule-based agents only; baseline skipped; results labeled as demo)
//        npm run eval -- --limit 5
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { ROOT, CONFIG, isLive } from "../server/env";
import { newRun } from "../server/llm";
import { analyzeCrisis, repairMetrics, rescueRun, styleRun } from "../server/orchestrator";
import { baselineRepair } from "../server/agents/baseline";
import { getItem } from "../server/catalog";
import { scoreOutfit, solve, validateOutfit } from "../server/rules";
import { PreferencesSchema, type CrisisId, type TraceEvent } from "../shared/types";

const args = process.argv.slice(2);
const demo = args.includes("--demo") || !isLive();
const limit = Number(args[args.indexOf("--limit") + 1]) || Infinity;
const scenarios = JSON.parse(readFileSync(path.join(ROOT, "eval", "scenarios.json"), "utf8")).slice(0, limit);

interface SystemResult {
  ok: boolean;
  catalogValid: boolean;
  budgetCompliant: boolean;
  recovered: boolean;
  unnecessary: number;
  aesthetic: number;
  latencyMs: number;
  calls: number;
  input: number;
  cached: number;
  output: number;
  cost: number;
  failure: string | null;
  source?: string;
}

function judge(ids: string[], s: ReturnType<typeof analyzeCrisis>, prefs: any, original: string[], maySwap: string[]) {
  const v = validateOutfit(ids, s.crisis.constraints);
  const m = repairMetrics(original, ids, s.crisis.constraints, s.affected.map((a) => a.id), maySwap);
  return {
    catalogValid: !v.violations.some((x) => x.code === "INVALID_ID" || x.code === "UNAVAILABLE"),
    budgetCompliant: !v.violations.some((x) => x.code === "OVER_BUDGET" || x.code === "INVALID_ID"),
    recovered: v.valid,
    unnecessary: m.unnecessary.length,
    aesthetic: scoreOutfit(ids, s.crisis.constraints, prefs.princess, prefs.style).aesthetic,
    failure: v.valid ? null : v.violations.map((x) => x.code + ": " + x.message).join("; "),
  };
}

const rows: any[] = [];
for (const sc of scenarios) {
  const prefs = PreferencesSchema.parse({ ...sc, owned: "" });
  process.stdout.write(`${sc.id} ${sc.princess}/${sc.occasion}/$${sc.budget}/${sc.crisis} ... `);

  // Act I - style once with the council; both systems repair the SAME original outfit.
  const events: TraceEvent[] = [];
  const sctx = newRun("council", (e) => events.push({ ...e, ts: Date.now() }), `eval-${sc.id}-style-${Date.now()}`);
  const t0 = Date.now();
  const style = await styleRun(sctx, !demo, prefs);
  const styleMs = Date.now() - t0;
  if (!style.ok) {
    rows.push({ scenario: sc, styleOk: false, styleReason: style.reason });
    console.log("style infeasible");
    continue;
  }
  const original = style.outfit.items.map((i) => i.id);
  const rejections = events.filter((e) => e.agent === "treasurer" && e.type === "warning" && /Rejected/.test(e.message)).length;
  const analysis = analyzeCrisis(prefs, original, sc.crisis as CrisisId);
  // budget-forced swaps allowed for both systems (same rule as the Guardian)
  let keep = [...analysis.remaining];
  const maySwap: string[] = [];
  while (!solve(analysis.crisis.constraints, prefs.princess, prefs.style, keep) && keep.length) {
    const priciest = [...keep].sort((a, b) => getItem(b)!.price - getItem(a)!.price)[0];
    keep = keep.filter((id) => id !== priciest);
    maySwap.push(priciest);
  }

  // Council rescue
  const cctx = newRun("council", () => {}, `eval-${sc.id}-council-${Date.now()}`);
  const t1 = Date.now();
  let council: SystemResult;
  try {
    const r = await rescueRun(cctx, !demo, prefs, original, sc.crisis);
    // An honest refusal ships no outfit, so it cannot violate budget or catalog rules.
    const shipped = r.ok ? judge(r.rescued.items.map((i) => i.id), analysis, prefs, original, maySwap) : { catalogValid: true, budgetCompliant: true, recovered: false, unnecessary: 0, aesthetic: 0, failure: null };
    council = { ok: r.ok, ...shipped, latencyMs: Date.now() - t1, calls: cctx.usage.calls, input: cctx.usage.input, cached: cctx.usage.cached, output: cctx.usage.output, cost: cctx.usage.cost, source: r.ok ? r.source : "honest-failure" };
    if (!r.ok) council.failure = r.reason;
  } catch (e) {
    council = { ok: false, catalogValid: false, budgetCompliant: false, recovered: false, unnecessary: 0, aesthetic: 0, latencyMs: Date.now() - t1, calls: cctx.usage.calls, input: cctx.usage.input, cached: cctx.usage.cached, output: cctx.usage.output, cost: cctx.usage.cost, failure: (e as Error).message };
  }

  // Baseline: one LLM call, no shortlist, no validator loop
  let baseline: SystemResult | null = null;
  if (!demo) {
    const bctx = newRun("baseline", () => {}, `eval-${sc.id}-baseline-${Date.now()}`);
    const t2 = Date.now();
    try {
      const b = await baselineRepair(bctx, prefs, original, analysis.crisis);
      baseline = { ok: true, ...judge(b.ids, analysis, prefs, original, maySwap), latencyMs: Date.now() - t2, calls: bctx.usage.calls, input: bctx.usage.input, cached: bctx.usage.cached, output: bctx.usage.output, cost: bctx.usage.cost };
    } catch (e) {
      baseline = { ok: false, catalogValid: false, budgetCompliant: false, recovered: false, unnecessary: 0, aesthetic: 0, latencyMs: Date.now() - t2, calls: bctx.usage.calls, input: bctx.usage.input, cached: bctx.usage.cached, output: bctx.usage.output, cost: bctx.usage.cost, failure: (e as Error).message };
    }
  }
  rows.push({
    scenario: sc,
    styleOk: true,
    style: { ms: styleMs, calls: sctx.usage.calls, input: sctx.usage.input, cached: sctx.usage.cached, output: sctx.usage.output, cost: sctx.usage.cost, treasurerRejections: rejections, firstTryValid: rejections === 0, fallbackUsed: style.fallbackUsed },
    affected: analysis.affected.length,
    feasibleRepairExists: Boolean(solve(analysis.crisis.constraints, prefs.princess, prefs.style)),
    council,
    baseline,
  });
  console.log(`council ${council.recovered ? "recovered" : "FAILED"}${baseline ? ` · baseline ${baseline.recovered ? "recovered" : "FAILED"}` : ""}`);
}

const done = rows.filter((r) => r.styleOk);
const agg = (k: "council" | "baseline") => {
  const all = done.filter((r) => r[k]);
  if (!all.length) return null;
  const xs = all.filter((r) => r.feasibleRepairExists).map((r) => r[k]) as SystemResult[];
  const impossible = all.filter((r) => !r.feasibleRepairExists).map((r) => r[k]) as SystemResult[];
  const shipped = all.map((r) => r[k]).filter((x: SystemResult) => x.ok) as SystemResult[];
  const rate = (f: (x: SystemResult) => boolean) => xs.filter(f).length / xs.length;
  const mean = (f: (x: SystemResult) => number) => xs.reduce((s, x) => s + f(x), 0) / xs.length;
  const recovered = xs.filter((x) => x.recovered);
  return {
    n: xs.length,
    feasible: xs.length,
    impossible: impossible.length,
    // Of outfits the system actually recommended:
    budgetComplianceRate: shipped.length ? shipped.filter((x) => x.budgetCompliant).length / shipped.length : 1,
    catalogValidityRate: shipped.length ? shipped.filter((x) => x.catalogValid).length / shipped.length : 1,
    // Of impossible scenarios, how often the system honestly refused instead of shipping an invalid outfit:
    honestRefusalRate: impossible.length ? impossible.filter((x) => !x.ok).length / impossible.length : null,
    recoveryRate: rate((x) => x.recovered),
    avgUnnecessaryReplacements: mean((x) => x.unnecessary),
    avgAesthetic: mean((x) => x.aesthetic),
    avgLatencyMs: mean((x) => x.latencyMs),
    avgCalls: mean((x) => x.calls),
    avgInput: mean((x) => x.input),
    avgCached: mean((x) => x.cached),
    avgOutput: mean((x) => x.output),
    avgCost: mean((x) => x.cost),
    costPerSuccessfulRescue: recovered.length ? xs.reduce((s, x) => s + x.cost, 0) / recovered.length : null,
    fallbackRate: k === "council" ? rate((x) => x.source === "fallback") : null,
    failures: all.filter((r) => !r[k].recovered).map((r) => ({ id: r.scenario.id, crisis: r.scenario.crisis, feasible: r.feasibleRepairExists, reason: r[k].failure ?? "Refused honestly" })),
  };
};
const styleRows = done.map((r) => r.style);
const out = {
  generatedAt: new Date().toISOString(),
  mode: demo ? "demo" : "live",
  model: demo ? "none (rule-based)" : CONFIG.model,
  pricing: CONFIG.pricing,
  scenarios: scenarios.length,
  styled: done.length,
  styling: styleRows.length
    ? {
        godmotherFirstTryValidRate: styleRows.filter((s) => s.firstTryValid).length / styleRows.length,
        avgTreasurerRejections: styleRows.reduce((s, x) => s + x.treasurerRejections, 0) / styleRows.length,
        fallbackRate: styleRows.filter((s) => s.fallbackUsed).length / styleRows.length,
        avgCalls: styleRows.reduce((s, x) => s + x.calls, 0) / styleRows.length,
        avgInput: styleRows.reduce((s, x) => s + x.input, 0) / styleRows.length,
        avgCached: styleRows.reduce((s, x) => s + x.cached, 0) / styleRows.length,
        avgOutput: styleRows.reduce((s, x) => s + x.output, 0) / styleRows.length,
        avgCost: styleRows.reduce((s, x) => s + x.cost, 0) / styleRows.length,
        avgMs: styleRows.reduce((s, x) => s + x.ms, 0) / styleRows.length,
      }
    : null,
  council: agg("council"),
  baseline: agg("baseline"),
  rows,
};
mkdirSync(path.join(ROOT, "eval", "results"), { recursive: true });
const stamp = out.generatedAt.replace(/[:.]/g, "-");
writeFileSync(path.join(ROOT, "eval", "results", `run-${stamp}.json`), JSON.stringify(out, null, 2));
writeFileSync(path.join(ROOT, "eval", "results", "latest.json"), JSON.stringify(out, null, 2));
console.log(`\nSaved eval/results/latest.json (${out.mode}). Council recovery ${(out.council!.recoveryRate * 100).toFixed(0)}%${out.baseline ? `, baseline ${(out.baseline.recoveryRate * 100).toFixed(0)}%` : ""}.`);
