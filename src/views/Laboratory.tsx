import { useEffect, useState } from "react";
import { FlaskConical, ShieldCheck, ShieldX } from "lucide-react";
import { getJson } from "../lib/api";
import { FramedPanel, RibbonDivider } from "../components/Ornaments";

const COUNCIL = "#9C4A6A";
const BASELINE = "#B08A3E";

interface Agg {
  n: number; feasible: number; impossible: number; honestRefusalRate: number | null; budgetComplianceRate: number; catalogValidityRate: number; recoveryRate: number; avgUnnecessaryReplacements: number; avgAesthetic: number;
  avgLatencyMs: number; avgCalls: number; avgInput: number; avgCached: number; avgOutput: number; avgCost: number; costPerSuccessfulRescue: number | null; fallbackRate: number | null;
  failures: { id: string; crisis: string; feasible: boolean; reason: string }[];
}
interface Lab {
  generatedAt: string; mode: string; model: string; scenarios: number; styled: number;
  styling: { godmotherFirstTryValidRate: number; avgTreasurerRejections: number; fallbackRate: number; avgCalls: number; avgInput: number; avgCached: number; avgOutput: number; avgCost: number; avgMs: number } | null;
  council: Agg | null; baseline: Agg | null;
  rows: any[];
}
interface SafetyTest { name: string; risk: string; passed: boolean; evidence: string }

const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function Laboratory() {
  const [lab, setLab] = useState<Lab | null | undefined>(undefined);
  const [tests, setTests] = useState<SafetyTest[] | null>(null);
  useEffect(() => {
    getJson<Lab | null>("/api/lab").then(setLab).catch(() => setLab(null));
    getJson<SafetyTest[]>("/api/safety").then(setTests).catch(() => setTests([]));
  }, []);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="text-center">
        <p className="eyebrow">Measured, not imagined</p>
        <h1 className="mt-2 text-5xl">The Royal Laboratory</h1>
        <p className="mx-auto mt-3 max-w-2xl text-mauve">
          20 predefined scenarios across princesses, budgets, occasions and crises. The Royal Council and a single-agent baseline repair the <em>same</em> outfit after the <em>same</em> crisis; one deterministic validator grades both.
        </p>
      </div>
      <RibbonDivider />

      {lab === undefined && <div className="shimmer h-64 rounded-[28px]" />}
      {lab === null && (
        <FramedPanel className="p-10 text-center">
          <FlaskConical className="mx-auto h-10 w-10 text-gold-deep" />
          <h2 className="mt-3 text-3xl">No experiment has been run yet</h2>
          <p className="mt-2 text-mauve">Run the evaluation from the project folder, then refresh this page:</p>
          <code className="mt-4 inline-block rounded-xl bg-parchment px-4 py-2 text-sm">npm run eval</code>
        </FramedPanel>
      )}
      {lab && <Results lab={lab} />}

      <div className="mt-14">
        <h2 className="text-4xl">Safety defenses, tested live</h2>
        <p className="text-mauve">These tests run on the server each time this page loads (also available as <code>npm run test:safety</code>).</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {(tests ?? []).map((t) => (
            <article key={t.name} className="rounded-[22px] border border-gold/40 bg-ivory p-5">
              <div className="flex items-start gap-3">
                {t.passed ? <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" /> : <ShieldX className="mt-0.5 h-5 w-5 shrink-0 text-burgundy" />}
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.18em] text-mauve">{t.risk} · {t.passed ? "Pass" : "Fail"}</p>
                  <h3 className="text-lg leading-snug">{t.name}</h3>
                  <p className="mt-1 break-words text-sm text-burgundy/80">{t.evidence}</p>
                </div>
              </div>
            </article>
          ))}
          {tests === null && <div className="shimmer h-28 rounded-[22px] md:col-span-2" />}
        </div>
      </div>
    </section>
  );
}

function Results({ lab }: { lab: Lab }) {
  const c = lab.council!;
  const b = lab.baseline;
  const metrics: { label: string; c: number; b?: number; fmt: (x: number) => string; max: number }[] = [
    { label: `Crisis recovery rate (${c.feasible} solvable scenarios)`, c: c.recoveryRate, b: b?.recoveryRate, fmt: pct, max: 1 },
    ...(c.honestRefusalRate != null ? [{ label: `Honest refusal on impossible scenarios (${c.impossible})`, c: c.honestRefusalRate, b: b?.honestRefusalRate ?? undefined, fmt: pct, max: 1 }] : []),
    { label: "Budget compliance of recommended outfits", c: c.budgetComplianceRate, b: b?.budgetComplianceRate, fmt: pct, max: 1 },
    { label: "Catalog validity of recommended outfits", c: c.catalogValidityRate, b: b?.catalogValidityRate, fmt: pct, max: 1 },
    { label: "Aesthetic score (rule-based)", c: c.avgAesthetic / 100, b: b ? b.avgAesthetic / 100 : undefined, fmt: (x) => `${Math.round(x * 100)}`, max: 1 },
  ];
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-parchment/60 px-5 py-3 text-sm">
        <span>Run {new Date(lab.generatedAt).toLocaleString()} · {lab.styled}/{lab.scenarios} scenarios styled · model: {lab.model}</span>
        <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.16em] ${lab.mode === "live" ? "bg-ivory" : "bg-blush"}`}>{lab.mode === "live" ? "Live AI measurements" : "Demo run: rule-based only, no baseline"}</span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <FramedPanel className="p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-3xl">Council vs single agent</h2>
            <div className="flex gap-4 text-sm" aria-label="Legend">
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: COUNCIL }} />Royal Council</span>
              {b && <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm" style={{ background: BASELINE }} />Single-agent baseline</span>}
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="text-sm font-medium">{m.label}</p>
                <Bar value={m.c} max={m.max} color={COUNCIL} label={m.fmt(m.c)} title={`Royal Council: ${m.fmt(m.c)}`} />
                {m.b !== undefined && <Bar value={m.b} max={m.max} color={BASELINE} label={m.fmt(m.b)} title={`Baseline: ${m.fmt(m.b)}`} />}
              </div>
            ))}
          </div>
        </FramedPanel>

        <div className="space-y-4">
          <Kpi k="Unnecessary replacements / rescue" c={c.avgUnnecessaryReplacements.toFixed(2)} b={b?.avgUnnecessaryReplacements.toFixed(2)} />
          <Kpi k="Avg processing time" c={`${(c.avgLatencyMs / 1000).toFixed(1)} s`} b={b ? `${(b.avgLatencyMs / 1000).toFixed(1)} s` : undefined} />
          <Kpi k="LLM calls / rescue" c={c.avgCalls.toFixed(2)} b={b?.avgCalls.toFixed(2)} />
          <Kpi k="Tokens in / out per rescue" c={`${Math.round(c.avgInput)} / ${Math.round(c.avgOutput)}`} b={b ? `${Math.round(b.avgInput)} / ${Math.round(b.avgOutput)}` : undefined} sub={`Council: ${Math.round(c.avgCached)} of its input tokens were cached (billed at the cached rate)`} />
          <Kpi k="Cost / successful rescue" c={c.costPerSuccessfulRescue != null ? `$${c.costPerSuccessfulRescue.toFixed(5)}` : "-"} b={b?.costPerSuccessfulRescue != null ? `$${b.costPerSuccessfulRescue.toFixed(5)}` : b ? "-" : undefined} />
          {c.fallbackRate != null && <Kpi k="Council rule-based fallback rate" c={pct(c.fallbackRate)} />}
          {lab.styling && <Kpi k="Godmother valid on first try" c={pct(lab.styling.godmotherFirstTryValidRate)} sub={`${lab.styling.avgTreasurerRejections.toFixed(2)} Treasurer rejections per outfit`} />}
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-[24px] border border-gold/40 bg-ivory p-5">
        <h2 className="text-2xl">Every scenario</h2>
        <table className="mt-4 w-full min-w-[760px] text-sm">
          <thead>
            <tr className="text-left text-[0.62rem] uppercase tracking-[0.16em] text-mauve">
              <th className="pb-2">ID</th><th className="pb-2">Princess</th><th className="pb-2">Occasion</th><th className="pb-2">Budget</th><th className="pb-2">Crisis</th>
              <th className="pb-2">Council</th>{b && <th className="pb-2">Baseline</th>}<th className="pb-2">Council tokens</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold/15">
            {lab.rows.map((r) => (
              <tr key={r.scenario.id}>
                <td className="py-2">{r.scenario.id}</td>
                <td className="py-2 capitalize">{r.scenario.princess}</td>
                <td className="py-2 capitalize">{r.scenario.occasion}</td>
                <td className="py-2">${r.scenario.budget}</td>
                <td className="py-2">{r.scenario.crisis.replace(/_/g, " ")}</td>
                <td className="py-2">{!r.styleOk ? "infeasible" : r.council.recovered ? `✓ ${r.council.source === "fallback" ? "(fallback)" : ""}` : r.feasibleRepairExists ? "✗" : "refused honestly"}</td>
                {b && <td className="py-2">{r.styleOk ? (r.baseline?.recovered ? "✓" : r.feasibleRepairExists ? "✗" : "✗ shipped invalid outfit") : "-"}</td>}
                <td className="py-2">{r.styleOk ? `${r.council.input + (r.style?.input ?? 0)} / ${r.council.output + (r.style?.output ?? 0)}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Failures title="Council failure cases" xs={c.failures} />
        {b && <Failures title="Baseline failure cases" xs={b.failures} />}
      </div>
    </>
  );
}

function Bar({ value, max, color, label, title }: { value: number; max: number; color: string; label: string; title: string }) {
  return (
    <div className="mt-1.5 flex items-center gap-3" title={title}>
      <div className="h-4 flex-1 rounded-full bg-blush/40">
        <div className="h-4 rounded-r-[4px] rounded-l-full transition-all duration-1000" style={{ width: `${Math.max(1, (value / max) * 100)}%`, background: color }} />
      </div>
      <span className="w-12 text-right font-serif text-lg text-burgundy">{label}</span>
    </div>
  );
}

function Kpi({ k, c, b, sub }: { k: string; c: string; b?: string; sub?: string }) {
  return (
    <div className="rounded-[20px] border border-gold/40 bg-ivory px-5 py-4">
      <p className="text-[0.62rem] uppercase tracking-[0.18em] text-mauve">{k}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-5">
        <span className="font-serif text-2xl"><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COUNCIL }} />{c}</span>
        {b !== undefined && <span className="font-serif text-2xl text-burgundy/80"><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm" style={{ background: BASELINE }} />{b}</span>}
      </div>
      {sub && <p className="text-xs text-mauve">{sub}</p>}
    </div>
  );
}

function Failures({ title, xs }: { title: string; xs: { id: string; crisis: string; feasible: boolean; reason: string }[] }) {
  return (
    <div className="rounded-[24px] border border-gold/40 bg-ivory p-5">
      <h3 className="text-2xl">{title}</h3>
      {xs.length === 0 ? <p className="mt-2 text-sm text-mauve">None.</p> : (
        <ul className="mt-3 space-y-2 text-sm">
          {xs.map((f) => <li key={f.id}><span className="font-semibold">{f.id}</span> ({f.crisis.replace(/_/g, " ")}{f.feasible ? "" : ", impossible by design"}): <span className="text-burgundy/80">{f.reason}</span></li>)}
        </ul>
      )}
    </div>
  );
}
