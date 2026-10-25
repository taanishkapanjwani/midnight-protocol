// The Royal Treasury ledger: every LLM call is appended to logs/usage.jsonl with API-reported token counts.
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { CONFIG, ROOT } from "./env";
import type { UsageRecord } from "../shared/types";

const FILE = path.join(ROOT, "logs", "usage.jsonl");

export const costOf = (input: number, cached: number, output: number) =>
  ((input - cached) * CONFIG.pricing.inputPerM + cached * CONFIG.pricing.cachedInputPerM + output * CONFIG.pricing.outputPerM) / 1e6;

export function record(r: UsageRecord) {
  appendFileSync(FILE, JSON.stringify(r) + "\n");
}

export function readLedger(): UsageRecord[] {
  if (!existsSync(FILE)) return [];
  return readFileSync(FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l) as UsageRecord;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as UsageRecord[];
}

export function spentToday() {
  const day = new Date().toISOString().slice(0, 10);
  return readLedger()
    .filter((r) => r.ts.startsWith(day))
    .reduce((s, r) => s + r.costUsd, 0);
}

export function summarize(runsPerUserPerMonth = 8) {
  // Re-price every call from its measured tokens at the current configured prices.
  const rows = readLedger().filter((r) => r.measured).map((r) => ({ ...r, costUsd: costOf(r.inputTokens, r.cachedInputTokens, r.outputTokens) }));
  const bySystem = (system: string) => {
    const xs = rows.filter((r) => r.system === system);
    const runs = new Map<string, UsageRecord[]>();
    for (const r of xs) runs.set(r.runId, [...(runs.get(r.runId) ?? []), r]);
    const perRun = [...runs.values()].map((calls) => ({
      calls: calls.length,
      input: calls.reduce((s, c) => s + c.inputTokens, 0),
      cached: calls.reduce((s, c) => s + c.cachedInputTokens, 0),
      output: calls.reduce((s, c) => s + c.outputTokens, 0),
      cost: calls.reduce((s, c) => s + c.costUsd, 0),
      latency: calls.reduce((s, c) => s + c.latencyMs, 0),
    }));
    const avg = (k: keyof (typeof perRun)[number]) => (perRun.length ? perRun.reduce((s, r) => s + r[k], 0) / perRun.length : 0);
    const byAgent: Record<string, { calls: number; input: number; cached: number; output: number; cost: number }> = {};
    for (const r of xs) {
      const a = (byAgent[r.agent] ??= { calls: 0, input: 0, cached: 0, output: 0, cost: 0 });
      a.calls++;
      a.input += r.inputTokens;
      a.cached += r.cachedInputTokens;
      a.output += r.outputTokens;
      a.cost += r.costUsd;
    }
    return {
      runs: perRun.length,
      calls: xs.length,
      avgCallsPerRun: avg("calls"),
      avgInput: avg("input"),
      avgCached: avg("cached"),
      avgOutput: avg("output"),
      avgCost: avg("cost"),
      avgLatencyMs: avg("latency"),
      totalCost: xs.reduce((s, r) => s + r.costUsd, 0),
      byAgent,
    };
  };
  const council = bySystem("council");
  const baseline = bySystem("baseline");
  // A full journey = one styling request (Godmother calls) + one rescue request (Guardian calls).
  const avgPerRequest = (agent: string) => {
    const per = new Map<string, number>();
    for (const r of rows.filter((x) => x.agent === agent)) per.set(r.runId, (per.get(r.runId) ?? 0) + r.costUsd);
    return per.size ? [...per.values()].reduce((a, b) => a + b, 0) / per.size : 0;
  };
  const journey = avgPerRequest("godmother") + avgPerRequest("guardian");
  const perUserMonth = journey * runsPerUserPerMonth;
  return {
    pricing: CONFIG.pricing,
    model: CONFIG.model,
    measuredCalls: rows.length,
    council,
    baseline,
    projection: {
      runsPerUserPerMonth,
      perRun: journey,
      styleRequest: avgPerRequest("godmother"),
      rescueRequest: avgPerRequest("guardian"),
      perUserMonth,
      users100: perUserMonth * 100,
      users10000: perUserMonth * 10000,
    },
    spentToday: spentToday(),
    dailyCap: CONFIG.dailySpendCapUsd,
    recent: rows.slice(-25).reverse(),
  };
}
