import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Footprints, Printer, ScrollText, X } from "lucide-react";
import type { Outfit, Preferences } from "../../shared/types";
import { OCCASION_LABELS, princessById } from "../../shared/princesses";
import type { RescueResult } from "../lib/api";
import { Bow, FlowingRibbon, FramedPanel, Particles, PearlString, WaxSeal } from "../components/Ornaments";
import { ChecksList, ItemCard, Ring } from "../components/Outfit";

export default function EverAfter({ prefs, rescue, onAnotherCrisis, onStartOver }: { prefs: Preferences; rescue: RescueResult; onAnotherCrisis: () => void; onStartOver: () => void }) {
  const [decree, setDecree] = useState(false);
  const p = princessById(prefs.princess);

  if (!rescue.ok) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="eyebrow">Chapter V</p>
        <h1 className="mt-2 text-5xl">Even magic has its limits</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-burgundy">{rescue.reason}</p>
        <p className="mt-3 text-sm text-mauve">Crisis: {rescue.crisis.title}. The Guardian refuses to fabricate a rescue that breaks your constraints.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button className="btn-royal" onClick={onAnotherCrisis}>Try another crisis</button>
          <button className="btn-ghost" onClick={onStartOver}>Start a new story</button>
        </div>
      </section>
    );
  }

  const m = rescue.metrics;
  const after = rescue.rescued;
  const delta = m.priceAfter - m.priceBefore;
  const affectedIds = rescue.affected.map((a) => a.id);
  const badgeBefore = (id: string) => (m.removed.includes(id) ? { label: "Replaced", tone: "out" as const } : { label: "Kept", tone: "keep" as const });
  const badgeAfter = (id: string) => (m.added.includes(id) ? { label: "New", tone: "new" as const } : { label: "Kept", tone: "keep" as const });

  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="relative overflow-hidden rounded-[32px] border border-gold/50 px-6 py-12 text-center" style={{ background: "linear-gradient(180deg,#FFF9F5,#F9EAF0)" }}>
        <Particles count={22} />
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.2 }}>
          <FlowingRibbon className="mx-auto -mb-2 h-14 w-full max-w-3xl opacity-80" d="M 0 200 C 300 120, 500 280, 600 200 S 900 120, 1200 200" width={40} />
        </motion.div>
        <p className="eyebrow relative">Chapter V · Happily Ever After</p>
        <motion.h1 initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.8 }} className="display relative mt-3 text-3xl sm:text-5xl">
          <span className="text-burgundy">{rescue.survivedUnchanged ? "Untouched by midnight" : "The magic survived midnight."}</span>
        </motion.h1>
        <p className="relative mx-auto mt-4 max-w-2xl font-serif text-xl italic text-burgundy">{rescue.explanation}</p>
        <p className="relative mt-3 text-xs uppercase tracking-[0.18em] text-mauve">
          {rescue.source === "llm" ? "Repair planned by the AI Midnight Guardian and verified by code" : rescue.source === "fallback" ? "Rule-based fallback repair (AI plan failed validation)" : rescue.source === "demo" ? "Demo mode: rule-based repair, not live AI" : "Verified by the rules engine"}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat k="Pieces kept" v={`${m.retained.length} of ${rescue.before.items.length}`} sub={m.unnecessary.length ? `${m.unnecessary.length} changed unnecessarily` : "Nothing changed unnecessarily"} />
        <Stat k="Pieces replaced" v={`${m.removed.length} out · ${m.added.length} in`} sub={`${affectedIds.length} broken by the crisis`} />
        <Stat k="Price change" v={`${delta >= 0 ? "+" : "−"}$${Math.abs(delta).toFixed(0)}`} sub={`$${m.priceAfter} of $${after.validation.budget} budget`} />
        <Stat k="Budget compliance" v={after.validation.total <= after.validation.budget ? "Within budget" : "Over budget"} sub="Checked by deterministic code" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Column title="Before Midnight" outfit={rescue.before} badge={badgeBefore} note={`Under the crisis this look ${rescue.underCrisis.validation.valid ? "still passes" : "fails"}: ${rescue.underCrisis.validation.violations.map((v) => v.message).join("; ") || "no issues"}`} />
        <Column title="After the Rescue" outfit={after} badge={badgeAfter} highlight />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <FramedPanel className="p-6 sm:p-8">
          <h2 className="text-3xl">Midnight Survival Score</h2>
          <p className="text-sm text-mauve">Same rubric, three moments. A hard-rule failure caps the overall score at 49.</p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[0.65rem] uppercase tracking-[0.16em] text-mauve">
                  <th className="pb-3 pr-4 font-medium">Dimension</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-medium">Before</th>
                  <th className="whitespace-nowrap pb-3 pr-4 font-medium">Midnight</th>
                  <th className="whitespace-nowrap pb-3 font-medium">Rescued</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/20">
                {([
                  ["Princess aesthetic (rule-based)", "aesthetic"],
                  ["Budget compliance (hard)", "budget"],
                  ["Occasion suitability (rule-based)", "occasion"],
                  ["Practicality & comfort (hard)", "practicality"],
                  ["Overall", "overall"],
                ] as const).map(([label, k]) => (
                  <tr key={k} className={k === "overall" ? "font-semibold" : ""}>
                    <td className="py-2.5 pr-3">{label}</td>
                    <td className="py-2.5 font-serif text-lg">{rescue.before.score[k]}</td>
                    <td className={`py-2.5 font-serif text-lg ${rescue.underCrisis.score.hardFail ? "text-rose" : ""}`}>{rescue.underCrisis.score[k]}</td>
                    <td className="py-2.5 font-serif text-lg">{after.score[k]}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2.5 pr-3">Status</td>
                  <td className="py-2.5">{rescue.before.validation.valid ? "Pass" : "Fail"}</td>
                  <td className="py-2.5">{rescue.underCrisis.validation.valid ? "Pass" : "Fail"}</td>
                  <td className="py-2.5">{after.validation.valid ? "Pass" : "Fail"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {after.score.aiAestheticRating && <p className="mt-4 text-xs uppercase tracking-[0.14em] text-mauve">AI opinion: aesthetic preserved {after.score.aiAestheticRating}/5 (subjective, labeled separately)</p>}
          <div className="mt-6 flex flex-wrap justify-around gap-4">
            <Ring value={rescue.underCrisis.score.overall} label="At midnight" muted />
            <Ring value={after.score.overall} label="After rescue" />
          </div>
        </FramedPanel>

        <div className="space-y-6">
          <div className="rounded-[26px] border border-gold/40 bg-ivory p-6">
            <h2 className="flex items-center gap-2 text-2xl"><Footprints className="h-5 w-5 text-gold-deep" /> The Glass Slipper Test</h2>
            <p className="mt-1 text-sm text-mauve">Can the rescued look survive the real evening?</p>
            <div className="mt-4"><ChecksList v={after.validation} /></div>
          </div>
          {rescue.tradeoffs.length > 0 && (
            <div className="rounded-[26px] border border-gold/40 bg-ivory p-6">
              <h2 className="text-2xl">Trade-offs</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{rescue.tradeoffs.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          )}
          <div className="parchment gilded-soft rounded-[26px] border p-6">
            <h2 className="text-2xl">Keep the memory</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn-royal" onClick={() => setDecree(true)}><ScrollText className="h-4 w-4" /> Royal Decree</button>
              <button className="btn-ghost" onClick={() => exportScrapbook(prefs, rescue)}><Download className="h-4 w-4" /> Scrapbook</button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button className="btn-royal" onClick={onAnotherCrisis}>Face another crisis</button>
        <button className="btn-ghost" onClick={onStartOver}>Start a new story</button>
      </div>

      <AnimatePresence>
        {decree && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-burgundy/40 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Royal Decree" onClick={() => setDecree(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl">
              <FramedPanel className="parchment relative px-8 py-12 text-center sm:px-14">
                <button className="no-print absolute right-5 top-5 text-mauve" onClick={() => setDecree(false)} aria-label="Close"><X /></button>
                <Bow size={90} className="absolute -top-10 left-1/2 -translate-x-1/2" />
                <p className="eyebrow mt-4">By decree of the Royal Wardrobe</p>
                <h2 className="display mt-3 text-3xl">Midnight-Proof</h2>
                <p className="mt-4 font-serif text-xl italic">this ensemble has been declared fit to survive the night.</p>
                <PearlString className="my-6" />
                <dl className="mx-auto grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-left text-sm">
                  <dt className="text-mauve">Aesthetic</dt><dd>{p.name}, {p.epithet}</dd>
                  <dt className="text-mauve">Occasion</dt><dd>{OCCASION_LABELS[prefs.occasion]}</dd>
                  <dt className="text-mauve">Crisis survived</dt><dd>{rescue.crisis.title}</dd>
                  <dt className="text-mauve">Total</dt><dd>${after.validation.total} of ${after.validation.budget}</dd>
                  <dt className="text-mauve">Validation</dt><dd>{after.validation.checks.filter((c) => c.passed).length}/{after.validation.checks.length} checks passed</dd>
                </dl>
                <p className="mt-6 text-sm">{after.items.map((i) => i.name).join(" · ")}</p>
                <div className="mt-6 flex items-center justify-center gap-6">
                  <WaxSeal size={70} letter={p.name[0]} />
                  <div className="text-left">
                    <p className="script text-2xl text-rose">The Midnight Guardian</p>
                    <p className="text-xs text-mauve">{new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p>
                  </div>
                </div>
                <button className="btn-ghost no-print mt-8" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print or save as PDF</button>
              </FramedPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Column({ title, outfit, badge, note, highlight }: { title: string; outfit: Outfit; badge: (id: string) => { label: string; tone: "keep" | "new" | "out" }; note?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-[28px] border p-6 ${highlight ? "border-gold bg-ivory shadow-[0_0_0_3px_rgba(198,166,107,.2)]" : "border-gold/40 bg-parchment/50"}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-3xl">{title}</h2>
        <p className="font-serif text-2xl">${outfit.validation.total}</p>
      </div>
      {note && <p className="mt-1 text-sm text-mauve">{note}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {outfit.items.map((i) => <ItemCard key={i.id} item={i} compact badge={badge(i.id)} />)}
      </div>
      {highlight && outfit.items.some((i) => i.reason && !/^Kept/.test(i.reason)) && (
        <ul className="mt-4 space-y-2 border-t border-gold/25 pt-4 text-sm">
          {outfit.items.filter((i) => i.reason && !/^Kept/.test(i.reason)).map((i) => (
            <li key={i.id}><span className="font-semibold">{i.name}:</span> <span className="font-serif text-base italic">{i.reason}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ k, v, sub }: { k: string; v: string; sub: string }) {
  return (
    <div className="rounded-[22px] border border-gold/40 bg-ivory p-5">
      <p className="text-[0.65rem] uppercase tracking-[0.18em] text-mauve">{k}</p>
      <p className="mt-1 font-serif text-3xl">{v}</p>
      <p className="text-xs text-mauve">{sub}</p>
    </div>
  );
}

function exportScrapbook(prefs: Preferences, r: Extract<RescueResult, { ok: true }>) {
  const data = {
    exportedAt: new Date().toISOString(),
    princess: prefs.princess,
    occasion: prefs.occasion,
    crisis: { title: r.crisis.title, narration: r.crisis.narration, changes: r.crisis.changes },
    before: r.before.items.map(({ id, name, price }) => ({ id, name, price })),
    after: r.rescued.items.map(({ id, name, price }) => ({ id, name, price })),
    scores: { before: r.before.score, atMidnight: r.underCrisis.score, after: r.rescued.score },
    note: "Demonstration catalog: products and prices are illustrative.",
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `royal-scrapbook-${prefs.princess}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
