import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Look for .env in the repo folder first, then one level up.
// (Two levels up is a last resort for the author's own folder layout.)
function loadEnv(): string | null {
  for (const file of [path.join(ROOT, ".env"), path.join(ROOT, "..", ".env"), path.join(ROOT, "..", "..", ".env")]) {
    if (!existsSync(file)) continue;
    for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const key = line.slice(0, i).trim();
      const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
      if (value && process.env[key] === undefined) process.env[key] = value;
    }
    return file;
  }
  return null;
}

export const ENV_FILE = loadEnv();

const num = (name: string, fallback: number) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
};

const portkeyKey = process.env.PORTKEY_API_KEY || "";
const openaiKey = process.env.OPENAI_API_KEY || "";

export const CONFIG = {
  provider: portkeyKey ? "portkey" : openaiKey ? "openai" : "none",
  apiKey: portkeyKey || openaiKey,
  baseUrl: portkeyKey
    ? process.env.PORTKEY_BASE_URL || "https://api.portkey.ai/v1"
    : process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  model: process.env.LLM_MODEL || (portkeyKey ? "gpt-6-luna" : "gpt-4o-mini"),
  pricing: {
    // Defaults: gpt-6-luna list prices reported by third-party pricing trackers (Oct 2026); override in .env.
    inputPerM: num("PRICE_INPUT_PER_M", 0.1),
    cachedInputPerM: num("PRICE_CACHED_INPUT_PER_M", 0.01),
    outputPerM: num("PRICE_OUTPUT_PER_M", 0.5),
    source: process.env.PRICE_INPUT_PER_M ? "configured in .env" : "gpt-6-luna list price per third-party trackers (Oct 2026)",
  },
  maxCallsPerRun: num("MAX_LLM_CALLS_PER_RUN", 6),
  timeoutMs: num("LLM_TIMEOUT_MS", 60000),
  dailySpendCapUsd: num("DAILY_SPEND_CAP_USD", 5),
  port: num("PORT", 8787),
  forceDemo: process.env.DEMO_MODE === "1",
};

export const isLive = () => CONFIG.provider !== "none" && !CONFIG.forceDemo;
