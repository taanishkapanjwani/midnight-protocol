import express from "express";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { CONFIG, ENV_FILE, ROOT, isLive } from "./env";
import { CATALOG, CATALOG_NOTICE, constraintsFromPrefs } from "./catalog";
import { newRun } from "./llm";
import { summarize } from "./ledger";
import { rateLimited } from "./safety";
import { rescueRun, styleRun } from "./orchestrator";
import { CRISIS_INFO, stepmotherApply, stepmotherPropose, stepmotherRandom } from "./agents/stepmother";
import { runSafetyTests } from "./selftest";
import { CRISIS_IDS, PreferencesSchema, type TraceEvent } from "../shared/types";

const app = express();
app.use(express.json({ limit: "50kb" }));

app.use("/api", (req, res, next) => {
  if (req.method === "POST" && rateLimited(req.ip ?? "local")) return res.status(429).json({ error: "Too many requests - please wait a minute." });
  next();
});

app.get("/api/health", (_req, res) => {
  res.json({
    mode: isLive() ? "live" : "demo",
    provider: CONFIG.provider,
    model: CONFIG.model,
    envFile: ENV_FILE ? path.relative(ROOT, ENV_FILE) || ".env" : null,
    pricing: CONFIG.pricing,
    caps: { maxCallsPerRun: CONFIG.maxCallsPerRun, timeoutMs: CONFIG.timeoutMs, dailySpendCapUsd: CONFIG.dailySpendCapUsd },
  });
});

app.get("/api/catalog", (_req, res) => res.json({ notice: CATALOG_NOTICE, items: CATALOG }));
app.get("/api/crises", (_req, res) => res.json(CRISIS_IDS.map((id) => ({ id, ...CRISIS_INFO[id] }))));

// Stream NDJSON events so the UI shows genuine, live workflow states.
function stream(res: express.Response) {
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  return (e: Omit<TraceEvent, "ts">) => res.write(JSON.stringify({ ...e, ts: Date.now() }) + "\n");
}

app.post("/api/style", async (req, res) => {
  const parsed = PreferencesSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues.map((i) => i.message).join("; ") });
  const emit = stream(res);
  const ctx = newRun("council", emit);
  try {
    const result = await styleRun(ctx, isLive(), parsed.data);
    emit({ type: "done", message: "complete", data: { ...result, runId: ctx.runId, usage: ctx.usage, mode: isLive() ? "live" : "demo" } });
  } catch (e) {
    emit({ type: "error", message: (e as Error).message });
  }
  res.end();
});

const CrisisReq = z.object({
  prefs: PreferencesSchema,
  outfitIds: z.array(z.string().max(20)).min(1).max(8),
  mode: z.enum(["propose", "random", "choose"]),
  crisisId: z.enum(CRISIS_IDS).optional(),
  seed: z.number().optional(),
});

app.post("/api/crisis", (req, res) => {
  const p = CrisisReq.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid crisis request" });
  const base = constraintsFromPrefs(p.data.prefs);
  const ids = p.data.outfitIds;
  const id =
    p.data.mode === "choose" && p.data.crisisId
      ? p.data.crisisId
      : p.data.mode === "random"
        ? stepmotherRandom(ids, base, p.data.seed ?? Date.now())
        : stepmotherPropose(ids, base);
  res.json(stepmotherApply(id, ids, base));
});

const RescueReq = z.object({ prefs: PreferencesSchema, outfitIds: z.array(z.string().max(20)).min(1).max(8), crisisId: z.enum(CRISIS_IDS), runId: z.string().max(80).optional() });

app.post("/api/rescue", async (req, res) => {
  const p = RescueReq.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Invalid rescue request" });
  const emit = stream(res);
  const ctx = newRun("council", emit, p.data.runId);
  try {
    const result = await rescueRun(ctx, isLive(), p.data.prefs, p.data.outfitIds, p.data.crisisId);
    emit({ type: "done", message: "complete", data: { ...result, runId: ctx.runId, usage: ctx.usage, mode: isLive() ? "live" : "demo" } });
  } catch (e) {
    emit({ type: "error", message: (e as Error).message });
  }
  res.end();
});

app.get("/api/treasury", (req, res) => res.json(summarize(Number(req.query.runsPerMonth) || 8)));

app.get("/api/lab", (_req, res) => {
  const file = path.join(ROOT, "eval", "results", "latest.json");
  if (!existsSync(file)) return res.json(null);
  res.json(JSON.parse(readFileSync(file, "utf8")));
});

app.get("/api/safety", async (_req, res) => res.json(await runSafetyTests()));

// Serve the built frontend.
const dist = path.join(ROOT, "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(CONFIG.port, () => {
  console.log(`\n  The Midnight Protocol is open at http://localhost:${CONFIG.port}`);
  console.log(`  Mode: ${isLive() ? `LIVE AI (${CONFIG.provider}, ${CONFIG.model})` : "DEMO (no API key found - rule-based agents, clearly labeled)"}`);
  console.log(`  .env: ${ENV_FILE ?? "not found (checked repo folder and folder above)"}\n`);
});
