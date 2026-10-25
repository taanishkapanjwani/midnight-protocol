import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { PrincessId } from "../../shared/types";
import { PRINCESSES } from "../../shared/princesses";
import { PrincessGown } from "../components/Art";
import { Bow, RibbonDivider } from "../components/Ornaments";

export default function PrincessGallery({ selected, onSelect, onContinue }: { selected: PrincessId | null; onSelect: (p: PrincessId) => void; onContinue: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14">
      <div className="text-center">
        <p className="eyebrow">Chapter I</p>
        <h1 className="mt-2 text-5xl">Choose Your Princess</h1>
        <p className="mx-auto mt-3 max-w-2xl text-mauve">Each aesthetic carries its own palette and spirit. The whole atelier will take on her colors.</p>
      </div>
      <RibbonDivider />
      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Princess aesthetic">
        {PRINCESSES.map((p, i) => {
          const active = selected === p.id;
          return (
            <motion.button
              key={p.id}
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(p.id)}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: active ? -8 : 0 }}
              whileHover={{ y: -6 }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className={`group relative overflow-hidden rounded-[28px] border bg-ivory text-left transition-shadow ${active ? "border-gold shadow-[0_0_0_3px_rgba(198,166,107,.35),0_24px_50px_-28px_rgba(90,41,59,.6)]" : "border-gold/40 shadow-[0_18px_40px_-30px_rgba(90,41,59,.5)]"}`}
            >
              <Bow size={58} className={`absolute right-4 top-3 z-10 transition duration-500 ${active ? "scale-100 opacity-100" : "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"}`} />
              {active && (
                <span className="absolute left-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-burgundy text-ivory">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <div className="relative h-48 sm:h-64" style={{ background: `radial-gradient(circle at 50% 40%, #fff 0%, ${p.accentSoft} 55%, ${p.colors[0].hex}55 100%)` }}>
                {active && <SparkleBurst />}
                <PrincessGown princess={p.id} className="mx-auto h-full py-3" />
              </div>
              <div className="border-t border-gold/30 p-6">
                <p className="script text-2xl" style={{ color: p.accent }}>{p.epithet}</p>
                <h2 className="text-3xl leading-tight">{p.name}</h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5" aria-label="Signature palette">
                  {p.colors.map((c) => (
                    <span key={c.hex} className="flex items-center gap-1.5 whitespace-nowrap text-xs text-mauve">
                      <span className="h-4 w-4 shrink-0 rounded-full border border-gold/50" style={{ background: c.hex }} />
                      {c.name}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-mauve">{p.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.keywords.map((k) => (
                    <span key={k} className="rounded-full border border-gold/40 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-burgundy">{k}</span>
                  ))}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
      <div className={`mt-12 text-center ${selected ? "sticky bottom-4 z-30 sm:static" : ""}`}>
        <button className="btn-royal" disabled={!selected} onClick={onContinue}>
          Open your royal invitation
          <Bow size={34} className="-my-3 -mr-3" />
        </button>
        {!selected && <p className="mt-3 text-sm text-mauve">Select a princess to continue.</p>}
      </div>
    </section>
  );
}

function SparkleBurst() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <svg key={i} className="twinkle absolute" style={{ left: `${10 + ((i * 37) % 80)}%`, top: `${8 + ((i * 23) % 80)}%`, animationDelay: `${i * 0.2}s` }} width="12" height="12" viewBox="0 0 10 10">
          <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="#C6A66B" />
        </svg>
      ))}
    </div>
  );
}
