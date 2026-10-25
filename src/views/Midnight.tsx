import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dices } from "lucide-react";
import { CRISIS_IDS, type Crisis, type CrisisId, type Outfit, type Preferences } from "../../shared/types";
import { getJson } from "../lib/api";
import { money } from "../lib/format";
import { AntiqueClock, Stars } from "../components/Ornaments";

interface CrisisInfo { id: CrisisId; title: string; blurb: string }

export default function Midnight({ prefs, outfit, crisis, onPropose, onSummon, onBack }: {
  prefs: Preferences;
  outfit: Outfit;
  crisis: Crisis | null;
  onPropose: (mode: "propose" | "random" | "choose", id?: CrisisId) => Promise<void>;
  onSummon: () => void;
  onBack: () => void;
}) {
  const [list, setList] = useState<CrisisInfo[]>([]);
  const [minutes, setMinutes] = useState(3);
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    getJson<CrisisInfo[]>("/api/crises").then(setList).catch(() => setList(CRISIS_IDS.map((id) => ({ id, title: id, blurb: "" }))));
    const t = window.setTimeout(() => setMinutes(0), 400);
    if (!crisis) onPropose("propose");
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const target = crisis?.targetItemId ? outfit.items.find((i) => i.id === crisis.targetItemId) : null;

  return (
    <section className="midnight-sky relative min-h-[88vh] overflow-hidden px-5 py-14 text-ivory">
      <div className="opacity-70"><Stars count={50} /></div>
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <div className="flex justify-center"><AntiqueClock size={190} minutesToMidnight={minutes} glow dark /></div>
        <motion.h1 initial={{ opacity: 0, letterSpacing: "0.4em" }} animate={{ opacity: 1, letterSpacing: "0.14em" }} transition={{ duration: 1.2 }} className="display mt-6 text-3xl text-ivory sm:text-5xl">
          Oh dear... the clock is striking twelve.
        </motion.h1>
        <p className="mt-3 text-ivory/75">The Wicked Stepmother has discovered a complication.</p>

        <AnimatePresence mode="wait">
          {crisis ? (
            <motion.div key={crisis.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto mt-10 max-w-2xl rounded-[28px] border border-gold/60 bg-[#232948]/80 p-8 text-left shadow-[0_0_60px_-20px_rgba(198,166,107,.6)] backdrop-blur">
              <p className="text-[0.7rem] uppercase tracking-[0.24em] text-gold">The Stepmother's crisis · {crisis.title}</p>
              <p className="mt-3 font-serif text-2xl italic leading-snug text-ivory sm:text-3xl">“{crisis.narration}”</p>
              <ul className="mt-5 space-y-1.5 text-sm text-ivory/85">
                {crisis.changes.map((c) => <li key={c}>· {c}</li>)}
              </ul>
              {target && <p className="mt-4 text-sm text-gold">Threatened piece: {target.name} ({money(target.price)})</p>}
            </motion.div>
          ) : (
            <div className="mx-auto mt-10 h-48 max-w-2xl rounded-[28px] border border-gold/30 bg-white/5" aria-hidden="true" />
          )}
        </AnimatePresence>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button className="btn-ghost !bg-transparent !text-ivory" onClick={() => setChoosing((x) => !x)}>Select another crisis</button>
          <button className="btn-ghost !bg-transparent !text-ivory" onClick={() => onPropose("random")}><Dices className="h-4 w-4" /> Random crisis</button>
        </div>

        {choosing && (
          <div className="mx-auto mt-6 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((c) => (
              <button
                key={c.id}
                onClick={() => { onPropose("choose", c.id); setChoosing(false); }}
                className={`rounded-2xl border bg-[#232948]/75 p-4 text-left backdrop-blur-sm transition hover:bg-[#2c3357] ${crisis?.id === c.id ? "border-gold" : "border-gold/30"}`}
                aria-pressed={crisis?.id === c.id}
              >
                <p className="font-serif text-lg text-ivory">{c.title}</p>
                <p className="mt-1 text-xs text-ivory/70">{c.blurb}</p>
              </button>
            ))}
          </div>
        )}

        <div className="mt-12">
          <button className="btn-royal sm:!px-10 sm:!py-5 sm:!text-[0.85rem]" disabled={!crisis} onClick={onSummon}>
            Summon the Midnight Guardian
          </button>
          <div className="mt-4">
            <button className="inline-flex min-h-11 items-center px-3 text-sm text-ivory/70 underline-offset-4 hover:underline" onClick={onBack}>Back to the wardrobe</button>
          </div>
          <p className="mt-6 text-xs text-ivory/50">Crises are predefined and reproducible. Budget ${prefs.budget} · {outfit.items.length} pieces at stake.</p>
        </div>
      </div>
    </section>
  );
}
