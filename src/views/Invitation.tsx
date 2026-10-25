import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { COMFORT_PREFS, OCCASIONS, STYLES, type Preferences, type PrincessId } from "../../shared/types";
import { COMFORT_LABELS, OCCASION_LABELS, STYLE_LABELS, princessById } from "../../shared/princesses";
import { Bow, FramedPanel, WaxSeal } from "../components/Ornaments";

const STEPS = ["Occasion", "Budget", "Style", "Comfort", "Wardrobe & weather"];

export default function Invitation({ princess, initial, onBack, onSubmit }: { princess: PrincessId; initial: Preferences | null; onBack: () => void; onSubmit: (p: Preferences) => void }) {
  const p = princessById(princess);
  const [step, setStep] = useState(0);
  const [occasion, setOccasion] = useState<Preferences["occasion"] | null>(initial?.occasion ?? null);
  const [budget, setBudget] = useState<string>(initial ? String(initial.budget) : "");
  const [style, setStyle] = useState<Preferences["style"] | null>(initial?.style ?? null);
  const [comfort, setComfort] = useState<Preferences["comfort"]>(initial?.comfort ?? []);
  const [owned, setOwned] = useState(initial?.owned ?? "");
  const [setting, setSetting] = useState<Preferences["setting"]>(initial?.setting ?? "indoor");
  const [weather, setWeather] = useState<Preferences["weather"]>(initial?.weather ?? "warm");

  const budgetNum = Number(budget);
  const budgetError = budget === "" ? null : !Number.isFinite(budgetNum) ? "Please enter a number." : budgetNum < 40 ? "The royal minimum is $40." : budgetNum > 5000 ? "Please keep it under $5,000." : null;
  const canNext = [!!occasion, budget !== "" && !budgetError, !!style, true, true][step];

  const toggleComfort = (c: Preferences["comfort"][number]) => {
    if (c === "none") return setComfort(comfort.includes("none") ? [] : ["none"]);
    setComfort((xs) => (xs.includes(c) ? xs.filter((x) => x !== c) : [...xs.filter((x) => x !== "none"), c]));
  };

  const submit = () =>
    onSubmit({ princess, occasion: occasion!, budget: Math.round(budgetNum), style: style!, comfort: comfort.filter((c) => c !== "none"), owned: owned.trim(), setting, weather });

  return (
    <section className="mx-auto max-w-3xl px-5 py-14">
      <div className="text-center">
        <p className="eyebrow">Chapter I</p>
        <h1 className="mt-2 text-5xl">The Royal Invitation</h1>
      </div>

      {/* Golden ribbon progress */}
      <div className="mx-auto mt-8 max-w-xl" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
        <div className="relative h-3 rounded-full bg-blush/60">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg,#E5CF9C,#C6A66B,#F0E0B8,#C6A66B)" }}
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
          <motion.div className="absolute -top-4" animate={{ left: `calc(${((step + 1) / STEPS.length) * 100}% - 22px)` }} transition={{ duration: 0.5 }}>
            <Bow size={44} />
          </motion.div>
        </div>
        <ol className="mt-4 hidden justify-between text-[0.65rem] uppercase tracking-[0.18em] text-mauve sm:flex">
          {STEPS.map((s, i) => (
            <li key={s} className={i <= step ? "text-burgundy" : ""}>{s}</li>
          ))}
        </ol>
      </div>

      <FramedPanel className="parchment mt-10 px-6 py-12 sm:px-14">
        <div className="absolute -top-9 left-1/2 -translate-x-1/2">
          <WaxSeal size={72} letter={p.name[0]} />
        </div>
        <p className="text-center font-serif text-lg italic text-mauve">
          You are cordially invited to dress as <span className="text-burgundy">{p.name}, {p.epithet}</span>
        </p>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35 }} className="mt-8">
            {step === 0 && (
              <Question title="What occasion are you dressing for?">
                <div className="grid gap-3 sm:grid-cols-2">
                  {OCCASIONS.map((o) => (
                    <button key={o} className="chip" aria-pressed={occasion === o} onClick={() => setOccasion(o)}>{OCCASION_LABELS[o]}</button>
                  ))}
                </div>
              </Question>
            )}
            {step === 1 && (
              <Question title="What is your total budget?">
                <label className="block">
                  <span className="sr-only">Budget in US dollars</span>
                  <div className="relative mx-auto max-w-xs">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-serif text-2xl text-gold-deep">$</span>
                    <input
                      className="field pl-10 text-center font-serif text-3xl"
                      inputMode="numeric"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ""))}
                      placeholder="150"
                      aria-invalid={!!budgetError}
                      aria-describedby="budget-help"
                      autoFocus
                    />
                  </div>
                </label>
                <p id="budget-help" className={`mt-3 text-center text-sm ${budgetError ? "text-burgundy" : "text-mauve"}`}>{budgetError ?? "USD, for the complete look: clothing, shoes and accessories."}</p>
                <div className="mt-4 flex justify-center gap-2">
                  {[80, 120, 180, 250].map((b) => (
                    <button key={b} className="chip px-4 py-2 text-sm" aria-pressed={budget === String(b)} onClick={() => setBudget(String(b))}>${b}</button>
                  ))}
                </div>
              </Question>
            )}
            {step === 2 && (
              <Question title="What is your preferred style?">
                <div className="grid gap-3 sm:grid-cols-2">
                  {STYLES.map((s) => (
                    <button key={s} className="chip" aria-pressed={style === s} onClick={() => setStyle(s)}>{STYLE_LABELS[s]}</button>
                  ))}
                </div>
              </Question>
            )}
            {step === 3 && (
              <Question title="What are your comfort preferences?" hint="Choose any that apply.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {COMFORT_PREFS.map((c) => (
                    <button key={c} className="chip" aria-pressed={c === "none" ? comfort.length === 0 || comfort.includes("none") : comfort.includes(c)} onClick={() => toggleComfort(c)}>{COMFORT_LABELS[c]}</button>
                  ))}
                </div>
              </Question>
            )}
            {step === 4 && (
              <Question title="A few final details" hint="Both optional.">
                <label className="block text-left">
                  <span className="text-sm font-medium text-burgundy">What do you already own?</span>
                  <textarea className="field mt-2 min-h-24" maxLength={400} value={owned} onChange={(e) => setOwned(e.target.value)} placeholder="e.g. a cream cardigan and pearl studs" />
                  <span className="mt-1 block text-right text-xs text-mauve">{owned.length}/400 · Please don't include personal details.</span>
                </label>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <fieldset>
                    <legend className="text-sm font-medium text-burgundy">Setting</legend>
                    <div className="mt-2 flex gap-2">
                      {(["indoor", "outdoor"] as const).map((s) => (
                        <button key={s} className="chip flex-1 text-center capitalize" aria-pressed={setting === s} onClick={() => setSetting(s)}>{s}</button>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset>
                    <legend className="text-sm font-medium text-burgundy">Weather</legend>
                    <div className="mt-2 flex gap-2">
                      {(["warm", "cold", "rainy"] as const).map((w) => (
                        <button key={w} className="chip flex-1 text-center capitalize" aria-pressed={weather === w} onClick={() => setWeather(w)}>{w}</button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              </Question>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between">
          <button className="btn-ghost" onClick={() => (step === 0 ? onBack() : setStep(step - 1))}>
            <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Princesses" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button className="btn-royal" disabled={!canNext} onClick={() => setStep(step + 1)}>
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button className="btn-royal" onClick={submit}>
              Summon the Fairy Godmother <Bow size={30} className="-my-3 -mr-2" />
            </button>
          )}
        </div>
      </FramedPanel>
    </section>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-center text-3xl">{title}</h2>
      {hint && <p className="mt-1 text-center text-sm text-mauve">{hint}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}
