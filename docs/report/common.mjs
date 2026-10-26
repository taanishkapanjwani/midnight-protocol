// Shared data, number formatting, embedded images and royal ornaments for report.html and slides.html.
// Every number is computed from the measured result files, not typed by hand.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const read = (p) => JSON.parse(readFileSync(path.join(ROOT, p), "utf8"));
export const ON = read("eval/results/latest.json"); // live run, caching on, with baseline
export const OFF = read("eval/results/live-real-catalog-no-cache.json"); // live run, caching off (deployed default)
export const CAT = read("data/catalog.json");
export const FEEDBACK = existsSync(path.join(ROOT, "docs/report/user-feedback.json")) ? read("docs/report/user-feedback.json") : null;

// ---------- helpers ----------
export const P = ON.pricing;
export const cost = (i, c, o) => ((i - c) * P.inputPerM + c * P.cachedInputPerM + o * P.outputPerM) / 1e6;
export const usd = (x, d = 2) => `$${x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
export const tiny = (x) => `$${x.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")}`;
export const pct = (x) => `${Math.round(x * 100)}%`;
export const int = (x) => Math.round(x).toLocaleString("en-US");
export const sec = (ms) => `${(ms / 1000).toFixed(1)} s`;

// ---------- embedded images (JPEG, resized) ----------
export const IMG_DIR = path.join(tmpdir(), "mp-report-img");
mkdirSync(IMG_DIR, { recursive: true });
export function img(name, width = 1500, q = 78) {
  const src = path.join(ROOT, "docs/screenshots", `${name}.png`);
  const out = path.join(IMG_DIR, `${name}-${width}.jpg`);
  execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", String(q), "--resampleWidth", String(width), src, "--out", out], { stdio: "ignore" });
  return `data:image/jpeg;base64,${readFileSync(out).toString("base64")}`;
}
export const fig = (name, caption, { width = 1500, cls = "" } = {}) =>
  `<figure class="shot ${cls}"><img src="${img(name, width)}" alt="${caption.replace(/<[^>]+>/g, "")}"><figcaption>${caption}</figcaption></figure>`;

// ---------- numbers ----------
export const N = { scenarios: ON.scenarios, feasible: ON.council.feasible, impossible: ON.council.impossible };
export const styleOff = OFF.styling;
export const styleOn = ON.styling;
export const resOff = OFF.council;
export const resOn = ON.council;
export const base = ON.baseline;
export const journeyOff = styleOff.avgCost + resOff.avgCost;
export const journeyOn = styleOn.avgCost + resOn.avgCost;
export const RUNS_PER_MONTH = 8;
export const perUser = journeyOff * RUNS_PER_MONTH;
export const cacheDelta = (journeyOn - journeyOff) / journeyOff;
export const retailers = [...new Set(CAT.items.map((i) => i.retailer))];
export const baseFails = ON.rows.filter((r) => r.styleOk && r.feasibleRepairExists && r.baseline && !r.baseline.recovered);
export const failCodes = {};
for (const r of baseFails) for (const c of new Set((r.baseline.failure ?? "").match(/[A-Z_]{5,}/g) ?? [])) failCodes[c] = (failCodes[c] ?? 0) + 1;
export const codeLabel = { DRESS_CODE: "below the dress code", WEATHER: "missing rain/cold gear", NOT_MODEST: "broke the modesty rule", OVER_BUDGET: "over budget", HEELS_NOT_ALLOWED: "heels when none allowed", NOT_WALKABLE: "not walkable", UNAVAILABLE: "unavailable item", INVALID_ID: "invented product", MISSING_ROLE: "incomplete outfit" };
export const failText = Object.entries(failCodes).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${n} ${codeLabel[c] ?? c.toLowerCase()}`).join(", ");
// Trace of the documented run (values read from the run's Council Minutes, screenshots 06 and 12)
export const T = { gIn: 6089, gCached: 5803, gOut: 413, uIn: 6203, uCached: 5807, uOut: 494 };
export const traceCost = cost(T.gIn, T.gCached, T.gOut) + cost(T.uIn, T.uCached, T.uOut);

// ---------- ornaments (same SVG language as the app) ----------
export const BOW = `<svg viewBox="0 0 200 145" class="bow" aria-hidden="true"><defs><linearGradient id="sat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FCEAF0"/><stop offset=".32" stop-color="#EDB9CA"/><stop offset=".52" stop-color="#FDF1F5"/><stop offset=".78" stop-color="#E3A5B9"/><stop offset="1" stop-color="#C98AA0"/></linearGradient></defs><path d="M94 70 C 84 96, 70 118, 56 136 L 73 129 L 79 141 C 90 117, 99 95, 103 72 Z" fill="url(#sat)"/><path d="M106 70 C 116 96, 130 118, 144 136 L 127 129 L 121 141 C 110 117, 101 95, 97 72 Z" fill="url(#sat)"/><path d="M100 62 C 72 18, 16 16, 20 52 C 24 86, 72 84, 100 68 Z" fill="url(#sat)"/><path d="M100 62 C 128 18, 184 16, 180 52 C 176 86, 128 84, 100 68 Z" fill="url(#sat)"/><path d="M30 40 C 44 26, 70 28, 88 50" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none"/><ellipse cx="100" cy="65" rx="13" ry="15" fill="url(#sat)"/></svg>`;
export const PEARLS = `<div class="pearls" aria-hidden="true">${Array.from({ length: 9 }).map((_, i) => `<i class="${i === 4 ? "big" : ""}"></i>`).join("")}</div>`;
export const divider = `<div class="divider" aria-hidden="true"><span class="line"></span>${BOW}<span class="line"></span></div>`;
export const CREST = `<svg viewBox="0 0 64 64" class="crest" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="#FFF9F5" stroke="#C6A66B" stroke-width="2.5"/><path d="M17 42 l4-17 11 10 11-10 4 17 z" fill="#C6A66B"/><circle cx="21" cy="24" r="2.6" fill="#F4DCE4"/><circle cx="32" cy="18" r="3" fill="#F4DCE4"/><circle cx="43" cy="24" r="2.6" fill="#F4DCE4"/></svg>`;

export const section = (num, eyebrow, title, body, { pageBreak = true, lead = "" } = {}) => `
<section class="chapter${pageBreak ? " break" : ""}" id="s${num}">
  <div class="${lead ? "keep" : ""}"><div class="head"><p class="eyebrow">Section ${num} · ${eyebrow}</p>
  <h2>${title}</h2>
  ${divider}</div>${lead}</div>
  ${body}
</section>`;

export const bar = (label, a, b, fmt = pct) => `
<div class="metric">
  <p>${label}</p>
  <div class="row"><span class="track"><span class="fill c" style="width:${Math.max(1, a * 100)}%"></span></span><b>${fmt(a)}</b></div>
  <div class="row"><span class="track"><span class="fill b" style="width:${Math.max(1, b * 100)}%"></span></span><b>${fmt(b)}</b></div>
</div>`;

// Agent architecture diagram
export const DIAGRAM = `
<svg viewBox="0 0 1000 472" class="diagram" role="img" aria-label="Royal Council agent architecture">
  <defs>
    <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#86682f"/></marker>
    <linearGradient id="llm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBEFF3"/><stop offset="1" stop-color="#F4DCE4"/></linearGradient>
    <linearGradient id="code" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFDF8"/><stop offset="1" stop-color="#F5EBDD"/></linearGradient>
  </defs>
  <style>
    .bx{stroke:#C6A66B;stroke-width:1.6} .t{font:600 15px 'DM Sans',sans-serif;fill:#5A293B} .s{font:12px 'DM Sans',sans-serif;fill:#7a5b6d}
    .h{font:500 22px 'Cormorant Garamond',serif;fill:#5A293B} .ln{stroke:#86682f;stroke-width:1.6;fill:none}
    .lb{font:italic 12.5px 'Cormorant Garamond',serif;fill:#5A293B} .k{font:600 10px 'DM Sans',sans-serif;letter-spacing:.14em;fill:#86682f}
  </style>
  <text x="20" y="28" class="k">ACT I · STYLE</text>
  <rect x="20" y="44" width="150" height="74" rx="14" class="bx" fill="#fff"/><text x="95" y="76" text-anchor="middle" class="t">User wishes</text><text x="95" y="96" text-anchor="middle" class="s">princess · occasion · budget</text>
  <rect x="215" y="44" width="160" height="74" rx="14" class="bx" fill="url(#code)"/><text x="295" y="72" text-anchor="middle" class="t">Shortlist (code)</text><text x="295" y="92" text-anchor="middle" class="s">133 → 30-45 legal items</text><text x="295" y="108" text-anchor="middle" class="s">+ injection guard</text>
  <rect x="420" y="34" width="190" height="94" rx="16" class="bx" fill="url(#llm)"/><text x="515" y="66" text-anchor="middle" class="h">Fairy Godmother</text><text x="515" y="88" text-anchor="middle" class="s">LLM · gpt-6-luna</text><text x="515" y="106" text-anchor="middle" class="s">picks IDs + reasons (JSON)</text>
  <rect x="655" y="34" width="190" height="94" rx="16" class="bx" fill="url(#code)"/><text x="750" y="66" text-anchor="middle" class="h">Royal Treasurer</text><text x="750" y="88" text-anchor="middle" class="s">deterministic code</text><text x="750" y="106" text-anchor="middle" class="s">prices · stock · 9 hard rules</text>
  <rect x="880" y="50" width="100" height="62" rx="14" class="bx" fill="#fff"/><text x="930" y="78" text-anchor="middle" class="t">Outfit</text><text x="930" y="96" text-anchor="middle" class="s">validated</text>
  <path d="M170 81 H213" class="ln" marker-end="url(#ar)"/><path d="M375 81 H418" class="ln" marker-end="url(#ar)"/><path d="M610 81 H653" class="ln" marker-end="url(#ar)"/><path d="M845 81 H878" class="ln" marker-end="url(#ar)"/>
  <path d="M750 128 C 750 170, 515 170, 515 130" class="ln" marker-end="url(#ar)"/><text x="632" y="186" text-anchor="middle" class="lb">itemized rejection → revise (max 2)</text>

  <text x="20" y="232" class="k">ACT II · MIDNIGHT</text>
  <rect x="20" y="248" width="190" height="94" rx="16" class="bx" fill="url(#code)"/><text x="115" y="280" text-anchor="middle" class="h">Wicked Stepmother</text><text x="115" y="302" text-anchor="middle" class="s">deterministic scenarios</text><text x="115" y="320" text-anchor="middle" class="s">8 crises · new constraints</text>
  <rect x="255" y="248" width="170" height="94" rx="16" class="bx" fill="url(#code)"/><text x="340" y="280" text-anchor="middle" class="t">Impact analysis</text><text x="340" y="300" text-anchor="middle" class="s">what broke · what stays</text><text x="340" y="318" text-anchor="middle" class="s">exact feasibility proof</text>
  <rect x="470" y="238" width="190" height="114" rx="16" class="bx" fill="url(#llm)"/><text x="565" y="272" text-anchor="middle" class="h">Midnight Guardian</text><text x="565" y="294" text-anchor="middle" class="s">LLM · gpt-6-luna</text><text x="565" y="312" text-anchor="middle" class="s">minimal repair plan (JSON)</text><text x="565" y="330" text-anchor="middle" class="s">trade-offs explained</text>
  <rect x="705" y="248" width="140" height="94" rx="16" class="bx" fill="url(#code)"/><text x="775" y="282" text-anchor="middle" class="t">Validator</text><text x="775" y="302" text-anchor="middle" class="s">same 9 rules</text><text x="775" y="318" text-anchor="middle" class="s">+ no needless swaps</text>
  <rect x="880" y="264" width="100" height="62" rx="14" class="bx" fill="#fff"/><text x="930" y="292" text-anchor="middle" class="t">Rescued</text><text x="930" y="310" text-anchor="middle" class="s">or honest "no"</text>
  <path d="M930 112 C 930 190, 115 190, 115 246" class="ln" marker-end="url(#ar)"/>
  <path d="M210 295 H253" class="ln" marker-end="url(#ar)"/><path d="M425 295 H468" class="ln" marker-end="url(#ar)"/><path d="M660 295 H703" class="ln" marker-end="url(#ar)"/><path d="M845 295 H878" class="ln" marker-end="url(#ar)"/>
  <path d="M775 342 C 775 384, 565 384, 565 354" class="ln" marker-end="url(#ar)"/><text x="670" y="400" text-anchor="middle" class="lb">validator feedback → retry (max 2), else labeled fallback</text>
  <path d="M340 342 C 340 412, 930 412, 930 328" class="ln" stroke-dasharray="5 5" marker-end="url(#ar)"/><text x="640" y="430" text-anchor="middle" class="lb">no valid outfit exists → honest refusal, no LLM call spent</text>
  <rect x="20" y="450" width="14" height="14" rx="3" fill="url(#llm)" class="bx"/><text x="42" y="462" class="s">language-model agent</text>
  <rect x="200" y="450" width="14" height="14" rx="3" fill="url(#code)" class="bx"/><text x="222" y="462" class="s">deterministic code (exact, free, instant)</text>
</svg>`;

