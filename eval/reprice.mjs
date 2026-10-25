// Re-prices a results file from its measured token counts (tokens and outcomes are unchanged).
// Usage: node eval/reprice.mjs eval/results/latest.json [inPerM cachedPerM outPerM]
import { readFileSync, writeFileSync } from "node:fs";
const [file, a = "0.10", b = "0.01", c = "0.50"] = process.argv.slice(2);
const P = { inputPerM: +a, cachedInputPerM: +b, outputPerM: +c };
const cost = (x) => ((x.input - x.cached) * P.inputPerM + x.cached * P.cachedInputPerM + x.output * P.outputPerM) / 1e6;
const r = JSON.parse(readFileSync(file, "utf8"));
for (const row of r.rows) for (const k of ["style", "council", "baseline"]) if (row[k]) row[k].cost = cost(row[k]);
const done = r.rows.filter((x) => x.styleOk);
for (const k of ["council", "baseline"]) {
  const agg = r[k];
  if (!agg) continue;
  const feas = done.filter((x) => x.feasibleRepairExists && x[k]).map((x) => x[k]);
  agg.avgCost = feas.reduce((s, x) => s + x.cost, 0) / feas.length;
  const ok = feas.filter((x) => x.recovered).length;
  agg.costPerSuccessfulRescue = ok ? feas.reduce((s, x) => s + x.cost, 0) / ok : null;
}
if (r.styling) r.styling.avgCost = done.reduce((s, x) => s + x.style.cost, 0) / done.length;
r.pricing = { ...P, source: "gpt-6-luna list price per third-party trackers (Oct 2026); costs re-priced from measured tokens" };
writeFileSync(file, JSON.stringify(r, null, 2));
console.log(file, "council", r.council.avgCost.toFixed(6), "baseline", r.baseline?.avgCost.toFixed(6), "style", r.styling.avgCost.toFixed(6));
