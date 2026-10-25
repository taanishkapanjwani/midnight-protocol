// OpenAI-compatible client (Portkey gateway or OpenAI) with timeouts, call caps, spend caps and usage logging.
import { z } from "zod";
import { CONFIG } from "./env";
import { costOf, record, spentToday } from "./ledger";
import type { TraceEvent } from "../shared/types";

export class SafetyStop extends Error {}

export interface RunContext {
  runId: string;
  system: "council" | "baseline";
  calls: number;
  maxCalls: number;
  emit: (e: Omit<TraceEvent, "ts">) => void;
  usage: { input: number; cached: number; output: number; cost: number; calls: number };
}

export function newRun(system: RunContext["system"], emit: RunContext["emit"] = () => {}, runId?: string): RunContext {
  return {
    runId: runId ?? `${system}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    system,
    calls: 0,
    maxCalls: CONFIG.maxCallsPerRun,
    emit,
    usage: { input: 0, cached: 0, output: 0, cost: 0, calls: 0 },
  };
}

type Msg = { role: "system" | "user" | "assistant"; content: string };

async function chat(messages: Msg[], signal: AbortSignal) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (CONFIG.provider === "portkey") {
    headers["x-portkey-api-key"] = CONFIG.apiKey;
    if (process.env.PORTKEY_VIRTUAL_KEY) headers["x-portkey-virtual-key"] = process.env.PORTKEY_VIRTUAL_KEY;
    if (process.env.PORTKEY_PROVIDER) headers["x-portkey-provider"] = process.env.PORTKEY_PROVIDER;
  } else headers.Authorization = `Bearer ${CONFIG.apiKey}`;
  const res = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    signal,
    body: JSON.stringify({ model: CONFIG.model, messages, response_format: { type: "json_object" } }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

function parseJson(content: string) {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  return JSON.parse(cleaned);
}

/**
 * Call the model and return schema-validated JSON.
 * - Hard cap on calls per run (stops runaway loops)
 * - Daily spend cap
 * - Timeout per call
 * - Up to `maxAttempts` attempts for malformed JSON / schema failures, feeding the error back
 */
export async function callAgent<S extends z.ZodTypeAny>(
  ctx: RunContext,
  agent: string,
  messages: Msg[],
  schema: S,
  maxAttempts = 2,
): Promise<z.infer<S>> {
  type T = z.infer<S>;
  let convo = [...messages];
  let lastErr = "";
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (ctx.calls >= ctx.maxCalls) throw new SafetyStop(`Call cap reached (${ctx.maxCalls} LLM calls per run) - stopping to prevent a runaway loop.`);
    if (spentToday() >= CONFIG.dailySpendCapUsd) throw new SafetyStop(`Daily spend cap of $${CONFIG.dailySpendCapUsd} reached.`);
    ctx.calls++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);
    const t0 = Date.now();
    let json: any;
    try {
      json = await chat(convo, controller.signal);
    } catch (e: any) {
      clearTimeout(timer);
      lastErr = e.name === "AbortError" ? `Timed out after ${CONFIG.timeoutMs} ms` : e.message;
      ctx.emit({ type: "warning", agent: agent as never, message: `Attempt ${attempt} failed: ${lastErr}` });
      if (/HTTP 4(01|03)/.test(lastErr)) throw new Error(`The AI provider rejected the API key (${lastErr.slice(0, 120)})`);
      continue;
    }
    clearTimeout(timer);
    const latencyMs = Date.now() - t0;
    const u = json.usage ?? {};
    const input = u.prompt_tokens ?? 0;
    const cached = u.prompt_tokens_details?.cached_tokens ?? 0;
    const output = u.completion_tokens ?? 0;
    const cost = costOf(input, cached, output);
    ctx.usage.input += input;
    ctx.usage.cached += cached;
    ctx.usage.output += output;
    ctx.usage.cost += cost;
    ctx.usage.calls++;
    const content: string = json.choices?.[0]?.message?.content ?? "";
    let parsed: T | null = null;
    try {
      const r = schema.safeParse(parseJson(content));
      if (r.success) parsed = r.data;
      else lastErr = r.error.issues.slice(0, 4).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    } catch {
      lastErr = "Response was not valid JSON";
    }
    record({
      ts: new Date().toISOString(),
      runId: ctx.runId,
      agent,
      system: ctx.system,
      model: json.model ?? CONFIG.model,
      inputTokens: input,
      cachedInputTokens: cached,
      outputTokens: output,
      latencyMs,
      costUsd: cost,
      measured: Boolean(json.usage),
      attempt,
      ok: parsed !== null,
    });
    ctx.emit({ type: "agent", agent: agent as never, message: `LLM call ${ctx.calls}: ${input} in (${cached} cached) / ${output} out tokens, ${latencyMs} ms`, data: { input, cached, output, latencyMs, cost } });
    if (parsed) return parsed;
    ctx.emit({ type: "warning", agent: agent as never, message: `Malformed output rejected (${lastErr}). Retrying.` });
    convo = [...messages, { role: "assistant", content }, { role: "user", content: `Your JSON was invalid: ${lastErr}. Return ONLY corrected JSON matching the schema.` }];
  }
  throw new Error(`${agent} could not produce valid output: ${lastErr}`);
}
