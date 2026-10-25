import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { getJson, type Health } from "../lib/api";
import { FramedPanel, RibbonDivider } from "../components/Ornaments";

interface SystemSummary { runs: number; calls: number; avgCallsPerRun: number; avgInput: number; avgCached: number; avgOutput: number; avgCost: number; avgLatencyMs: number; totalCost: number; byAgent: Record<string, { calls: number; input: number; cached: number; output: number; cost: number }> }
interface Summary {
  pricing: { inputPerM: number; cachedInputPerM: number; outputPerM: number; source: string };
  model: string;
  measuredCalls: number;
  council: SystemSummary;
  baseline: SystemSummary;
  projection: { runsPerUserPerMonth: number; perRun: number; perUserMonth: number; users100: number; users10000: number };
  spentToday: number;
  dailyCap: number;
  recent: { ts: string; runId: string; agent: string; system: string; model: string; inputTokens: number; cachedInputTokens: number; outputTokens: number; latencyMs: number; costUsd: number; attempt: number; ok: boolean }[];
}

const usd = (x: number, d = 4) => `$${x.toFixed(d)}`;

export default function Treasury({ health }: { health: Health | null }) {
  const [runs, setRuns] = useState(8);
  const [s, setS] = useState<Summary | null>(null);
  useEffect(() => {
    getJson<Summary>(`/api/treasury?runsPerMonth=${runs}`).then(setS).catch(() => setS(null));
  }, [runs]);

  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="text-center">
        <p className="eyebrow">Tokenomics</p>
        <h1 className="mt-2 text-5xl">The Royal Treasury</h1>
        <p className="mx-auto mt-3 max-w-2xl text-mauve">Every LLM call is logged with the token counts the API itself reports. Costs use the configured price per million tokens.</p>
      </div>
      <RibbonDivider />
      {!s ? (
        <div className="shimmer h-64 rounded-[28px]" />
      ) : s.measuredCalls === 0 ? (
        <FramedPanel className="p-10 text-center">
          <Coins className="mx-auto h-10 w-10 text-gold-deep" />
          <h2 className="mt-3 text-3xl">The ledger is empty</h2>
          <p className="mt-2 text-mauve">{health?.mode === "demo" ? "The app is in demo mode, so no AI calls (and no tokens) have been spent. Add PORTKEY_API_KEY to measure live usage." : "Style an outfit or run npm run eval to record measured usage."}</p>
        </FramedPanel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Tile k="Cost per full journey" v={usd(s.projection.perRun, 5)} sub="Style + rescue, measured average" />
            <Tile k="Per user / month" v={usd(s.projection.perUserMonth, 4)} sub={`${s.projection.runsPerUserPerMonth} journeys per month`} />
            <Tile k="100 users / month" v={usd(s.projection.users100, 2)} sub="Projection from measured average" />
            <Tile k="10,000 users / month" v={usd(s.projection.users10000, 2)} sub="Projection from measured average" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-mauve">
            <label htmlFor="runs">Journeys per user per month</label>
            <input id="runs" type="range" min={1} max={30} value={runs} onChange={(e) => setRuns(Number(e.target.value))} className="accent-[#C6A66B]" />
            <span className="font-serif text-lg text-burgundy">{runs}</span>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <FramedPanel className="p-6 sm:p-8">
              <h2 className="text-2xl">Per run (measured averages)</h2>
              <table className="mt-4 w-full text-sm">
                <thead><tr className="text-left text-[0.62rem] uppercase tracking-[0.16em] text-mauve"><th className="pb-2" /><th className="pb-2">Royal Council</th><th className="pb-2">Baseline</th></tr></thead>
                <tbody className="divide-y divide-gold/15">
                  {([
                    ["Runs logged", (x: SystemSummary) => String(x.runs)],
                    ["AI calls per run", (x: SystemSummary) => x.avgCallsPerRun.toFixed(2)],
                    ["Input tokens", (x: SystemSummary) => Math.round(x.avgInput).toLocaleString()],
                    ["Cached input tokens", (x: SystemSummary) => Math.round(x.avgCached).toLocaleString()],
                    ["Output tokens", (x: SystemSummary) => Math.round(x.avgOutput).toLocaleString()],
                    ["Cost per run", (x: SystemSummary) => usd(x.avgCost, 5)],
                    ["AI latency per run", (x: SystemSummary) => `${(x.avgLatencyMs / 1000).toFixed(1)} s`],
                  ] as const).map(([k, f]) => (
                    <tr key={k}><td className="py-2">{k}</td><td className="py-2 font-serif text-lg">{f(s.council)}</td><td className="py-2 font-serif text-lg">{s.baseline.runs ? f(s.baseline) : "-"}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-mauve">A "run" is one request (style or rescue). The cost per full journey adds both.</p>
            </FramedPanel>

            <div className="rounded-[26px] border border-gold/40 bg-ivory p-6 sm:p-8">
              <h2 className="text-2xl">By agent</h2>
              <table className="mt-4 w-full text-sm">
                <thead><tr className="text-left text-[0.62rem] uppercase tracking-[0.16em] text-mauve"><th className="pb-2">Agent</th><th className="pb-2">Calls</th><th className="pb-2">In</th><th className="pb-2">Cached</th><th className="pb-2">Out</th><th className="pb-2">Cost</th></tr></thead>
                <tbody className="divide-y divide-gold/15">
                  {Object.entries({ ...s.council.byAgent, ...s.baseline.byAgent }).map(([a, x]) => (
                    <tr key={a}><td className="py-2 capitalize">{a}</td><td className="py-2">{x.calls}</td><td className="py-2">{x.input.toLocaleString()}</td><td className="py-2">{x.cached.toLocaleString()}</td><td className="py-2">{x.output.toLocaleString()}</td><td className="py-2">{usd(x.cost, 4)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="hairline my-5" />
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <dt className="text-mauve">Model</dt><dd>{s.model}</dd>
                <dt className="text-mauve">Price / 1M input</dt><dd>${s.pricing.inputPerM}</dd>
                <dt className="text-mauve">Price / 1M cached input</dt><dd>${s.pricing.cachedInputPerM}</dd>
                <dt className="text-mauve">Price / 1M output</dt><dd>${s.pricing.outputPerM}</dd>
                <dt className="text-mauve">Price source</dt><dd>{s.pricing.source}</dd>
                <dt className="text-mauve">Spent today / cap</dt><dd>{usd(s.spentToday, 4)} / ${s.dailyCap}</dd>
              </dl>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto rounded-[24px] border border-gold/40 bg-ivory p-5">
            <h2 className="text-2xl">Recent ledger entries</h2>
            <p className="text-xs text-mauve">All values are API-reported usage (measured), not estimates.</p>
            <table className="mt-3 w-full min-w-[720px] text-sm">
              <thead><tr className="text-left text-[0.62rem] uppercase tracking-[0.16em] text-mauve"><th className="pb-2">Time</th><th className="pb-2">Agent</th><th className="pb-2">Attempt</th><th className="pb-2">In</th><th className="pb-2">Cached</th><th className="pb-2">Out</th><th className="pb-2">Latency</th><th className="pb-2">Cost</th><th className="pb-2">Valid JSON</th></tr></thead>
              <tbody className="divide-y divide-gold/15">
                {s.recent.map((r, i) => (
                  <tr key={i}><td className="py-1.5">{new Date(r.ts).toLocaleTimeString()}</td><td className="py-1.5 capitalize">{r.agent}</td><td className="py-1.5">{r.attempt}</td><td className="py-1.5">{r.inputTokens}</td><td className="py-1.5">{r.cachedInputTokens}</td><td className="py-1.5">{r.outputTokens}</td><td className="py-1.5">{(r.latencyMs / 1000).toFixed(1)} s</td><td className="py-1.5">{usd(r.costUsd, 5)}</td><td className="py-1.5">{r.ok ? "yes" : "no"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function Tile({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div className="parchment gilded-soft rounded-[22px] border p-5">
      <p className="text-[0.62rem] uppercase tracking-[0.18em] text-mauve">{k}</p>
      <p className="mt-1 font-serif text-4xl">{v}</p>
      <p className="text-xs text-mauve">{sub}</p>
    </div>
  );
}
