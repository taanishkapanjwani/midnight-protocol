import type { Constraints, Crisis, Outfit, Preferences, TraceEvent } from "../../shared/types";

export interface Health {
  mode: "live" | "demo";
  provider: string;
  model: string;
  envFile: string | null;
  pricing: { inputPerM: number; cachedInputPerM: number; outputPerM: number; source: string };
  caps: { maxCallsPerRun: number; timeoutMs: number; dailySpendCapUsd: number };
}

export interface Usage { input: number; cached: number; output: number; cost: number; calls: number }

export type StyleResult =
  | { ok: true; outfit: Outfit; constraints: Constraints; fallbackUsed: boolean; source: string; runId: string; usage: Usage; mode: string; safety: { injectionFlagged: boolean } }
  | { ok: false; reason: string; constraints: Constraints; runId: string; usage: Usage; mode: string };

export interface RepairMetrics { valid: boolean; retained: string[]; removed: string[]; added: string[]; unnecessary: string[]; priceBefore: number; priceAfter: number }

interface RescueCommon {
  crisis: Crisis;
  affected: { id: string; why: string }[];
  required: string[];
  before: Outfit;
  underCrisis: Outfit;
  runId: string;
  usage: Usage;
  mode: string;
}
export type RescueResult =
  | (RescueCommon & { ok: true; survivedUnchanged: boolean; rescued: Outfit; explanation: string; tradeoffs: string[]; metrics: RepairMetrics; source: string; maySwap?: string[] })
  | (RescueCommon & { ok: false; reason: string });

export async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Request failed (${r.status})`);
  return r.json();
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? `Request failed (${r.status})`);
  return j;
}

// Reads the server's NDJSON event stream; resolves with the final "done" payload.
export async function postStream<T>(url: string, body: unknown, onEvent: (e: TraceEvent) => void): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok || !r.body) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error ?? `Request failed (${r.status})`);
  }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done: T | null = null;
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buf += decoder.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      const e = JSON.parse(line) as TraceEvent;
      if (e.type === "error") throw new Error(e.message);
      if (e.type === "done") done = e.data as T;
      else onEvent(e);
    }
  }
  if (!done) throw new Error("The council was interrupted before finishing.");
  return done;
}

export type { Preferences };
