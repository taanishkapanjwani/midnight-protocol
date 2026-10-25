import { motion } from "framer-motion";
import type { Preferences } from "../../shared/types";
import { OCCASION_LABELS, princessById } from "../../shared/princesses";
import type { StyleResult } from "../lib/api";
import { money } from "../lib/format";
import { AntiqueClock, Bow, FlowingRibbon, FramedPanel, RibbonDivider } from "../components/Ornaments";
import { ChecksList, ItemCard, ScoreRings } from "../components/Outfit";

export default function Wardrobe({ prefs, style, onMidnight, onRestyle, onShop }: { prefs: Preferences; style: Extract<StyleResult, { ok: true }>; onMidnight: () => void; onRestyle: () => void; onShop: () => void }) {
  const p = princessById(prefs.princess);
  const o = style.outfit;
  const v = o.validation;
  return (
    <section className="mx-auto max-w-7xl px-5 py-12">
      <div className="relative text-center">
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.1, ease: "easeOut" }} style={{ transformOrigin: "left" }}>
          <FlowingRibbon className="pointer-events-none mx-auto -mb-6 h-16 w-full max-w-4xl opacity-80" d="M 0 200 C 200 120, 400 280, 600 200 S 1000 120, 1200 200" width={34} />
        </motion.div>
        <p className="eyebrow relative">Chapter III · The Enchanted Wardrobe</p>
        <h1 className="relative mt-2 text-5xl sm:text-6xl">{o.title}</h1>
        <p className="script relative mt-1 text-2xl sm:text-3xl" style={{ color: p.accent }}>{p.name}, {p.epithet}</p>
        <p className="relative mt-2 text-sm text-mauve">{OCCASION_LABELS[prefs.occasion]} · {prefs.style} style · {style.source === "llm" ? "Styled by the AI Fairy Godmother" : "Demo mode: rule-based styling"}{style.fallbackUsed ? " · completed by Treasurer fallback" : ""}</p>
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
        <FramedPanel className="min-w-0 p-4 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:[&>*:last-child:nth-child(odd)]:col-span-2 xl:[&>*:last-child:nth-child(odd)]:col-span-1">
            {o.items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.25 + i * 0.12 }}>
                <ItemCard item={item} />
              </motion.div>
            ))}
          </div>
        </FramedPanel>

        <div className="space-y-6">
          <div className="parchment gilded relative rounded-[26px] p-7 text-center">
            <Bow size={70} className="absolute -top-6 left-1/2 -translate-x-1/2" />
            <p className="eyebrow mt-3">The Royal Treasurer certifies</p>
            <p className="mt-2 font-serif text-6xl text-burgundy">{money(v.total)}</p>
            <p className="text-mauve">of your {money(v.budget)} budget · {money(v.remaining)} to spare</p>
            <div className="hairline my-5" />
            <div className="text-left"><ChecksList v={v} /></div>
          </div>

          <div className="rounded-[26px] border border-gold/40 bg-ivory p-7">
            <h2 className="text-2xl">The Fairy Godmother's Notes</h2>
            <p className="mt-3 font-serif text-lg italic leading-relaxed text-burgundy">{o.rationale}</p>
            {o.score.aiAestheticRating && <p className="mt-3 text-xs uppercase tracking-[0.16em] text-mauve">AI self-rating (opinion, not fact): {o.score.aiAestheticRating}/5</p>}
          </div>
        </div>
      </div>

      <RibbonDivider className="mt-8" />
      <div className="rounded-[28px] border border-gold/40 bg-ivory p-7">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl">Midnight Survival Score</h2>
            <p className="text-sm text-mauve">Before any crisis. Hard rules decide pass or fail; the rings below are rule-based.</p>
          </div>
          <p className="font-serif text-4xl">{o.score.overall}<span className="text-lg text-mauve">/100</span></p>
        </div>
        <div className="mt-6"><ScoreRings score={o.score} /></div>
      </div>

      <div className="midnight-sky relative mt-10 overflow-hidden rounded-[32px] px-6 py-12 text-center text-ivory">
        <div className="flex justify-center"><AntiqueClock size={130} minutesToMidnight={1} glow dark /></div>
        <h2 className="mt-4 text-4xl text-ivory">But will it survive midnight?</h2>
        <p className="mx-auto mt-2 max-w-xl text-ivory/80">Real life rarely goes to plan. Let the Wicked Stepmother test this outfit against the unexpected.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button className="btn-royal" onClick={onMidnight}>Let the clock strike twelve</button>
          <button className="btn-ghost !bg-transparent !text-ivory" onClick={onRestyle}>Change my wishes</button>
        </div>
        <button className="mt-4 inline-flex min-h-11 items-center px-3 text-sm text-ivory/70 underline-offset-4 hover:underline" onClick={onShop}>Skip the crisis and shop this look</button>
      </div>
    </section>
  );
}
