// Input guards. User free text is treated as untrusted DATA, never as instructions.
const INJECTION_PATTERNS = [
  /ignore (all |any )?(previous|prior|above) (instructions|rules)/i,
  /disregard (the )?(rules|instructions|system)/i,
  /system prompt/i,
  /you are now/i,
  /api[_ -]?key|portkey|\.env\b/i,
  /reveal|print|show (me )?(your|the) (instructions|prompt|key)/i,
  /budget (doesn'?t|does not) matter|ignore (the )?budget/i,
  /<\/?(system|assistant|instructions)>/i,
];

export function sanitizeFreeText(text: string) {
  const cleaned = text
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ")
    .replace(/https?:\/\/\S+/g, "[link removed]")
    .slice(0, 400)
    .trim();
  const flags = INJECTION_PATTERNS.filter((p) => p.test(cleaned)).map((p) => p.source);
  // Neutralize flagged text instead of passing attacker instructions to the model.
  const safe = flags.length ? "[wardrobe note withheld: it contained instructions rather than clothing details]" : cleaned;
  return { safe, flagged: flags.length > 0, flags };
}

// Simple in-memory rate limiter per IP to protect the API budget.
const hits = new Map<string, number[]>();
export function rateLimited(ip: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const xs = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  xs.push(now);
  hits.set(ip, xs);
  return xs.length > limit;
}
