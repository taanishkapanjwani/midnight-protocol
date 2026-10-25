import { motion } from "framer-motion";
import { Crown, Feather, Mail, Shield, Sparkles } from "lucide-react";
import { AntiqueClock, Bow, FlowingRibbon, Particles, PearlString, RibbonDivider, RosePetal } from "../components/Ornaments";
import { GildedMirror } from "../components/Art";

const CHAPTERS = [
  { n: "I", title: "The Royal Invitation", text: "Tell us the occasion, your budget and what comfort means to you.", icon: Mail },
  { n: "II", title: "Choose Your Princess", text: "Six fairy-tale aesthetics, each with its own palette and spirit.", icon: Crown },
  { n: "III", title: "The Fairy Godmother's Atelier", text: "An AI stylist composes your look from a real catalog, and a Treasurer audits every coin.", icon: Sparkles },
  { n: "IV", title: "The Midnight Crisis", text: "The Wicked Stepmother strikes: sold-out gowns, rain, budget cuts, a long walk.", icon: Feather },
  { n: "V", title: "Happily Ever After", text: "The Midnight Guardian repairs only what broke, and proves the magic survived.", icon: Shield },
];

export default function Landing({ onEnter, onDiscover, toast }: { onEnter: () => void; onDiscover: () => void; toast: (m: string) => void }) {
  return (
    <>
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FFF9F5 0%, #FBEFF2 55%, #F4DCE4 100%)" }}>
        <Particles count={30} />
        <FlowingRibbon className="sway pointer-events-none absolute -left-10 -top-14 h-[260px] w-[110%] opacity-90" d="M -20 120 C 180 20, 320 220, 520 120 S 860 10, 1000 110 S 1180 220, 1240 140" width={30} />
        <FlowingRibbon className="sway pointer-events-none absolute -left-10 bottom-0 h-[220px] w-[110%] opacity-70 [animation-delay:-3s]" d="M -20 260 C 200 360, 380 180, 600 270 S 980 380, 1240 240" width={22} />
        {[{ l: "8%", t: "62%", r: 20 }, { l: "88%", t: "30%", r: -30 }, { l: "46%", t: "86%", r: 60 }, { l: "70%", t: "78%", r: 10 }].map((p, i) => (
          <RosePetal key={i} className="sway absolute w-8" style={{ left: p.l, top: p.t, transform: `rotate(${p.r}deg)`, animationDelay: `${-i * 1.7}s` }} />
        ))}

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 pb-24 pt-20 lg:grid-cols-[1.05fr_1fr] lg:pt-24">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <p className="script text-3xl text-rose">Est. Once Upon a Time</p>
            <h1 className="display mt-3 text-5xl leading-[1.05] text-burgundy sm:text-6xl lg:text-7xl">
              The Midnight
              <br />
              <span className="gold-text">Protocol</span>
            </h1>
            <PearlString className="mt-6 justify-start" count={11} />
            <p className="mt-6 font-serif text-2xl italic text-burgundy sm:text-3xl">Because every princess deserves a wardrobe that survives reality.</p>
            <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-mauve">
              Step into your own fairytale. Let your Fairy Godmother create your dream look, challenge it against the unexpected, and rescue it before the clock strikes twelve.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button className="btn-royal" onClick={onEnter}>
                Enter the Royal Wardrobe
                <Bow size={34} className="-my-3 -mr-3" />
              </button>
              <button className="btn-ghost" onClick={onDiscover}>Discover the Magic</button>
            </div>
          </motion.div>

          <motion.div className="relative mx-auto h-[460px] w-full max-w-[420px] sm:h-[540px]" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, delay: 0.15 }}>
            <GildedMirror princess="aurora" className="absolute inset-x-6 top-0 h-[92%] cursor-pointer" onClick={() => toast("Mirror, mirror, on the wall... the best-dressed look is still within budget.")} />
            <Bow size={120} className="sway absolute left-1/2 top-[-22px] -translate-x-1/2" />
            <div className="absolute -bottom-2 -left-2 sm:-left-8">
              <AntiqueClock size={150} minutesToMidnight={5} onClick={() => toast("Tick, tock... five minutes until the Stepmother arrives.")} />
            </div>
            <PearlString className="absolute bottom-10 right-0 rotate-[-12deg]" count={7} />
          </motion.div>
        </div>
      </section>

      <section id="storybook" className="mx-auto max-w-7xl scroll-mt-20 px-6 py-20">
        <div className="text-center">
          <p className="eyebrow">The enchanted storybook</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Five chapters to happily ever after</h2>
          <p className="mx-auto mt-4 max-w-2xl text-mauve">
            Behind the fairytale is a real multi-agent AI system: a creative stylist, a deterministic budget auditor, an adversarial tester and a rescue agent that must prove every fix.
          </p>
        </div>
        <RibbonDivider />
        <ol className="relative mt-6 grid gap-6 md:grid-cols-5">
          <div className="hairline absolute left-0 right-0 top-[52px] hidden md:block" aria-hidden="true" />
          {CHAPTERS.map((c, i) => (
            <motion.li
              key={c.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="parchment gilded-soft relative rounded-3xl border p-6 pt-8 text-center"
            >
              <div className="mx-auto -mt-14 mb-4 grid h-16 w-16 place-items-center rounded-full border border-gold bg-ivory shadow-[0_0_0_5px_rgba(244,220,228,.8)]">
                <c.icon className="h-6 w-6 text-gold-deep" strokeWidth={1.4} />
              </div>
              <p className="font-serif text-2xl text-gold-deep">{c.n}</p>
              <h3 className="mt-1 text-xl leading-tight">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-mauve">{c.text}</p>
            </motion.li>
          ))}
        </ol>
        <div className="mt-14 text-center">
          <button className="btn-royal" onClick={onEnter}>
            Begin the story
            <Bow size={34} className="-my-3 -mr-3" />
          </button>
        </div>
      </section>
    </>
  );
}
