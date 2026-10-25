import { motion } from "framer-motion";
import { AlertTriangle, Apple, Check, Loader2, Scale, ShieldCheck, Wand2 } from "lucide-react";
import type { TraceEvent } from "../../shared/types";
import type { Health, RescueResult, StyleResult } from "../lib/api";
import { Bow, FramedPanel, Particles } from "../components/Ornaments";

const AGENTS = [
  { key: "godmother", name: "The Fairy Godmother", role: "Creative Stylist", kind: "LLM agent", icon: Wand2, tone: "#B98598" },
  { key: "treasurer", name: "The Royal Treasurer", role: "Budget Guardian", kind: "Deterministic code", icon: Scale, tone: "#C6A66B" },
  { key: "stepmother", name: "The Wicked Stepmother", role: "Adversarial Challenger", kind: "Deterministic scenarios", icon: Apple, tone: "#5A293B" },
  { key: "guardian", name: "The Midnight Guardian", role: "Rescue & Validation", kind: "LLM agent + validator", icon: ShieldCheck, tone: "#3E4A7A" },
] as const;

type State = "waiting" | "working" | "done" | "warning";

export default function Council(props: {
  phase: "style" | "rescue";
  events: TraceEvent[];
  busy: boolean;
  error: string | null;
  health: Health | null;
  style: StyleResult | null;
  rescue: RescueResult | null;
  onContinue: () => void;
  onRetry: () => void;
  onBack: () => void;
}) {
  const { phase, events, busy, error, style, rescue } = props;
  const statusEvents = events.filter((e) => e.type === "status");
  const current = busy ? statusEvents.at(-1)?.agent : undefined;
  const stateOf = (key: string): State => {
    if (current === key) return "working";
    const mine = events.filter((e) => e.agent === key);
    if (!mine.length) return phase === "rescue" && earlier(key) ? "done" : "waiting";
    return mine.at(-1)?.type === "warning" && !mine.some((e) => e.type === "agent" && /Approved|validated/.test(e.message)) ? "warning" : "done";
  };
  // In the rescue phase, the stylist agents already finished in Chapter III: say what they did.
  const earlier = (key: string) => {
    if (!style?.ok) return null;
    if (key === "godmother") return `Styled "${style.outfit.title}" in Chapter III.`;
    if (key === "treasurer") return `Approved $${style.outfit.validation.total} of $${style.outfit.validation.budget} in Chapter III.`;
    return null;
  };
  const visible = phase === "style" ? AGENTS.filter((a) => a.key === "godmother" || a.key === "treasurer") : AGENTS;
  const result = phase === "style" ? style : rescue;
  const usage = result?.usage;
  const mode = result?.mode ?? props.health?.mode;

  return (
    <section className="relative mx-auto max-w-7xl px-5 py-12">
      <div className="text-center">
        <p className="eyebrow">{phase === "style" ? "Chapter III" : "Chapter IV"} · Live agent workflow</p>
        <h1 className="mt-2 text-5xl">The Royal Council Chamber</h1>
        <p className="mx-auto mt-3 max-w-2xl text-mauve" aria-live="polite">
          {busy ? statusEvents.at(-1)?.message ?? "The council is gathering..." : error ? "The council was interrupted." : "The council has reached its verdict."}
        </p>
        {mode === "demo" && (
          <p className="mx-auto mt-3 inline-block rounded-full border border-rose/50 bg-powder px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-burgundy">
            Demo mode · no API key · agents are rule-based, not live AI
          </p>
        )}
      </div>

      <div className={`mt-10 grid gap-5 ${visible.length === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2"}`}>
        {visible.map((a, i) => {
          const s = stateOf(a.key);
          const lastMsg = events.filter((e) => e.agent === a.key && e.type !== "status").at(-1)?.message;
          return (
            <motion.article
              key={a.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative overflow-hidden rounded-[26px] border bg-ivory p-6 transition-shadow ${s === "working" ? "glow-pulse border-gold" : "border-gold/40"}`}
              aria-label={`${a.name}: ${s}`}
            >
              <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: a.tone, opacity: s === "waiting" ? 0.25 : 0.9 }} />
              <div className="flex items-start justify-between">
                <div className="grid h-14 w-14 place-items-center rounded-full border border-gold/60 bg-parchment">
                  <a.icon className="h-6 w-6" style={{ color: a.tone }} strokeWidth={1.5} />
                </div>
                <StateBadge s={s} />
              </div>
              <h2 className="mt-4 text-2xl leading-tight">{a.name}</h2>
              <p className="text-sm text-mauve">{a.role}</p>
              <p className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-gold-deep">{a.kind}</p>
              <p className="mt-4 min-h-[3.5rem] text-sm leading-relaxed text-burgundy">{lastMsg ?? (phase === "rescue" ? earlier(a.key) : null) ?? (s === "waiting" ? "Awaiting their turn..." : "")}</p>
            </motion.article>
          );
        })}
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
        <FramedPanel className="p-6 sm:p-8">
          <h2 className="text-2xl">Council Minutes</h2>
          <p className="text-sm text-mauve">Every line below is a real step from the server, in order.</p>
          <ol className="scroll-thin mt-4 max-h-[22rem] space-y-2 sm:max-h-[34rem] overflow-auto pr-2 text-sm">
            {events.map((e, i) => (
              <li key={i} className={`flex flex-col gap-0.5 rounded-xl px-3 py-2 sm:flex-row sm:gap-3 ${e.type === "warning" ? "bg-blush/50" : "bg-parchment/60"}`}>
                <span className="shrink-0 text-[0.65rem] sm:w-24 uppercase tracking-[0.14em] text-gold-deep">{e.agent ?? "system"}</span>
                <span className="text-burgundy">{e.message}</span>
              </li>
            ))}
            {busy && <li className="shimmer h-9 rounded-xl" aria-hidden="true" />}
          </ol>
        </FramedPanel>

        <div className="order-first space-y-6 lg:order-none">
          {busy && <EnchantedWardrobe />}
          {!busy && error && (
            <div className="rounded-[26px] border border-burgundy/30 bg-blush/40 p-6" role="alert">
              <h2 className="flex items-center gap-2 text-2xl"><AlertTriangle className="h-5 w-5" /> The spell faltered</h2>
              <p className="mt-2 text-sm">{error}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button className="btn-royal" onClick={props.onRetry}>Try again</button>
                <button className="btn-ghost" onClick={props.onBack}>Go back</button>
              </div>
            </div>
          )}
          {!busy && !error && result && (
            <div className="parchment gilded-soft rounded-[26px] border p-6">
              {result.ok ? (
                <>
                  <h2 className="text-2xl">{phase === "style" ? "The ensemble is ready" : "The Guardian has ruled"}</h2>
                  <p className="mt-2 text-sm text-mauve">{phase === "style" ? "Approved by the Royal Treasurer." : "Repair validated against every new constraint."}</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl">Even magic has its limits</h2>
                  <p className="mt-2 text-sm text-burgundy">{result.reason}</p>
                </>
              )}
              {usage && (
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Stat k="LLM calls" v={String(usage.calls)} />
                  <Stat k="Cost (measured)" v={usage.calls ? `$${usage.cost.toFixed(5)}` : "$0 · no AI calls"} />
                  <Stat k="Input tokens" v={`${usage.input.toLocaleString()} (${usage.cached.toLocaleString()} cached)`} />
                  <Stat k="Output tokens" v={usage.output.toLocaleString()} />
                </dl>
              )}
              <button className="btn-royal mt-6" onClick={result.ok ? props.onContinue : props.onBack}>
                {result.ok ? (phase === "style" ? "Open the Enchanted Wardrobe" : "See Happily Ever After") : "Adjust your wishes"}
                <Bow size={30} className="-my-3 -mr-2" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StateBadge({ s }: { s: State }) {
  const map = {
    waiting: { label: "Waiting", cls: "text-mauve border-gold/30", icon: null },
    working: { label: "At work", cls: "text-burgundy border-gold bg-blush/60", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
    done: { label: "Done", cls: "text-burgundy border-gold/60 bg-parchment", icon: <Check className="h-3.5 w-3.5" /> },
    warning: { label: "Objected", cls: "text-burgundy border-burgundy/40 bg-blush/60", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  }[s];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${map.cls}`}>{map.icon}{map.label}</span>;
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-ivory/80 px-3 py-2">
      <dt className="text-[0.65rem] uppercase tracking-[0.16em] text-mauve">{k}</dt>
      <dd className="font-serif text-lg text-burgundy">{v}</dd>
    </div>
  );
}

// The enchanted loading screen: a wardrobe whose doors swing open while agents work.
function EnchantedWardrobe() {
  return (
    <div className="relative overflow-hidden rounded-[26px] border border-gold/50 bg-gradient-to-b from-ivory to-blush/60 p-6 text-center">
      <Particles count={14} />
      <svg viewBox="0 0 200 200" className="mx-auto h-48" aria-hidden="true">
        <defs>
          <linearGradient id="wd" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFF9F5" />
            <stop offset="1" stopColor="#F5EBDD" />
          </linearGradient>
        </defs>
        <path d="M40 40 C 40 20, 160 20, 160 40 L 160 180 L 40 180 Z" fill="#F9EAF0" stroke="#C6A66B" strokeWidth="2" />
        <g>
          <rect x="70" y="60" width="60" height="100" rx="4" fill="#F4DCE4" opacity=".6" />
          <path d="M85 70 C 92 78, 108 78, 115 70 L 118 90 C 128 120, 132 140, 134 156 L 66 156 C 68 140, 72 120, 82 90 Z" fill="#E7B9C6" stroke="#B98598" />
        </g>
        <motion.g style={{ transformOrigin: "40px 100px" }} animate={{ rotateY: [0, -70, -70, 0] }} transition={{ duration: 3.2, repeat: Infinity }}>
          <path d="M40 40 C 40 26, 100 22, 100 22 L 100 180 L 40 180 Z" fill="url(#wd)" stroke="#C6A66B" strokeWidth="2" />
          <circle cx="92" cy="104" r="3" fill="#C6A66B" />
        </motion.g>
        <motion.g style={{ transformOrigin: "160px 100px" }} animate={{ rotateY: [0, 70, 70, 0] }} transition={{ duration: 3.2, repeat: Infinity }}>
          <path d="M100 22 C 100 22, 160 26, 160 40 L 160 180 L 100 180 Z" fill="url(#wd)" stroke="#C6A66B" strokeWidth="2" />
          <circle cx="108" cy="104" r="3" fill="#C6A66B" />
        </motion.g>
        <path d="M30 180 H 170" stroke="#C6A66B" strokeWidth="4" />
      </svg>
      <p className="script mt-2 text-2xl text-rose">A little magic, a little arithmetic...</p>
    </div>
  );
}
