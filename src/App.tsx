import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CrisisId, Preferences, PrincessId, TraceEvent, Crisis } from "../shared/types";
import { princessById } from "../shared/princesses";
import { getJson, postJson, postStream, type Health, type RescueResult, type StyleResult } from "./lib/api";
import { Crest } from "./components/Ornaments";
import { Toast, useToast } from "./components/Toast";
import Landing from "./views/Landing";
import PrincessGallery from "./views/PrincessGallery";
import Invitation from "./views/Invitation";
import Council from "./views/Council";
import Wardrobe from "./views/Wardrobe";
import Midnight from "./views/Midnight";
import EverAfter from "./views/EverAfter";
import Laboratory from "./views/Laboratory";
import Treasury from "./views/Treasury";

export type View = "landing" | "princess" | "invitation" | "council" | "wardrobe" | "midnight" | "ever-after" | "lab" | "treasury";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [health, setHealth] = useState<Health | null>(null);
  const [princess, setPrincess] = useState<PrincessId | null>(null);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [phase, setPhase] = useState<"style" | "rescue">("style");
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<StyleResult | null>(null);
  const [crisis, setCrisis] = useState<Crisis | null>(null);
  const [rescue, setRescue] = useState<RescueResult | null>(null);
  const toast = useToast();

  useEffect(() => {
    getJson<Health>("/api/health").then(setHealth).catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    const p = princess ? princessById(princess) : null;
    document.documentElement.style.setProperty("--accent", p?.accent ?? "#b98598");
    document.documentElement.style.setProperty("--accent-soft", p?.accentSoft ?? "#f9eaf0");
  }, [princess]);

  const go = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function summonGodmother(p: Preferences) {
    setPrefs(p);
    setPhase("style");
    setEvents([]);
    setError(null);
    setStyle(null);
    setRescue(null);
    setCrisis(null);
    setBusy(true);
    go("council");
    try {
      const r = await postStream<StyleResult>("/api/style", p, (e) => setEvents((xs) => [...xs, e]));
      setStyle(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function proposeCrisis(mode: "propose" | "random" | "choose", crisisId?: CrisisId) {
    if (!prefs || !style?.ok) return;
    try {
      const c = await postJson<Crisis>("/api/crisis", { prefs, outfitIds: style.outfit.items.map((i) => i.id), mode, crisisId, seed: Date.now() % 100000 });
      setCrisis(c);
    } catch (e) {
      toast.show((e as Error).message);
    }
  }

  async function summonGuardian() {
    if (!prefs || !style?.ok || !crisis) return;
    setPhase("rescue");
    setEvents([]);
    setError(null);
    setBusy(true);
    go("council");
    try {
      const r = await postStream<RescueResult>("/api/rescue", { prefs, outfitIds: style.outfit.items.map((i) => i.id), crisisId: crisis.id, runId: style.runId }, (e) => setEvents((xs) => [...xs, e]));
      setRescue(r);
      saveScrapbook(r);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function saveScrapbook(r: RescueResult) {
    try {
      const book = JSON.parse(localStorage.getItem("royal-scrapbook") ?? "[]");
      book.unshift({ at: new Date().toISOString(), princess: prefs?.princess, crisis: r.crisis.title, ok: r.ok, before: r.before.items.map((i) => i.name), after: r.ok ? r.rescued.items.map((i) => i.name) : null });
      localStorage.setItem("royal-scrapbook", JSON.stringify(book.slice(0, 20)));
    } catch {
      /* storage unavailable - scrapbook is optional */
    }
  }

  const startOver = () => {
    setStyle(null);
    setRescue(null);
    setCrisis(null);
    setEvents([]);
    go("princess");
  };

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ivory focus:px-4 focus:py-2">Skip to content</a>
      <header className="no-print sticky top-0 z-40 border-b border-gold/30 bg-ivory/85 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-5" aria-label="Main">
          <button className="flex items-center gap-3 text-left" onClick={() => go("landing")} aria-label="The Midnight Protocol home">
            <Crest size={38} />
            <span>
              <span className="display block whitespace-nowrap text-[0.8rem] leading-none text-burgundy sm:text-[0.95rem]">The Midnight Protocol</span>
              <span className="script hidden text-sm text-rose sm:block">Est. Once Upon a Time</span>
            </span>
          </button>
          <div className="flex items-center gap-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] sm:gap-2 sm:text-[0.7rem] sm:tracking-[0.2em]">
            {(
              [
                ["princess", "Atelier"],
                ["lab", "Laboratory"],
                ["treasury", "Treasury"],
              ] as const
            ).map(([v, label]) => (
              <button key={v} onClick={() => go(v)} className={`rounded-full px-2 py-2 transition hover:bg-powder sm:px-3 ${view === v ? "bg-blush text-burgundy" : "text-mauve"}`} aria-current={view === v ? "page" : undefined}>
                {label}
              </button>
            ))}
            <ModeBadge health={health} />
          </div>
        </nav>
      </header>

      <main id="main">
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.45, ease: "easeOut" }}>
            {view === "landing" && <Landing onEnter={() => go("princess")} onDiscover={() => document.getElementById("storybook")?.scrollIntoView({ behavior: "smooth" })} toast={toast.show} />}
            {view === "princess" && <PrincessGallery selected={princess} onSelect={setPrincess} onContinue={() => go("invitation")} />}
            {view === "invitation" && princess && <Invitation princess={princess} initial={prefs} onBack={() => go("princess")} onSubmit={summonGodmother} />}
            {view === "council" && (
              <Council
                phase={phase}
                events={events}
                busy={busy}
                error={error}
                health={health}
                style={style}
                rescue={rescue}
                onContinue={() => go(phase === "style" ? (style?.ok ? "wardrobe" : "invitation") : "ever-after")}
                onRetry={() => (phase === "style" ? prefs && summonGodmother(prefs) : summonGuardian())}
                onBack={() => go(phase === "style" ? "invitation" : "midnight")}
              />
            )}
            {view === "wardrobe" && style?.ok && prefs && (
              <Wardrobe prefs={prefs} style={style} onMidnight={() => { setCrisis(null); go("midnight"); }} onRestyle={() => go("invitation")} />
            )}
            {view === "midnight" && style?.ok && prefs && (
              <Midnight prefs={prefs} outfit={style.outfit} crisis={crisis} onPropose={proposeCrisis} onSummon={summonGuardian} onBack={() => go("wardrobe")} />
            )}
            {view === "ever-after" && rescue && prefs && <EverAfter prefs={prefs} rescue={rescue} onAnotherCrisis={() => { setCrisis(null); go("midnight"); }} onStartOver={startOver} />}
            {view === "lab" && <Laboratory />}
            {view === "treasury" && <Treasury health={health} />}
            {(view === "invitation" && !princess) || (view === "wardrobe" && !style?.ok) || (view === "midnight" && !style?.ok) ? (
              <EmptyState onStart={() => go("princess")} />
            ) : null}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="no-print mt-20 border-t border-gold/30 bg-parchment/60 py-10 text-center text-sm text-mauve">
        <p className="script text-2xl text-rose">and they dressed happily ever after</p>
        <p className="mt-2">The Midnight Protocol · Demonstration catalog: products and prices are illustrative, not offered by real retailers.</p>
      </footer>
      <Toast message={toast.message} />
    </div>
  );
}

function ModeBadge({ health }: { health: Health | null }) {
  if (!health) return <span className="ml-1 hidden rounded-full border border-gold/40 px-3 py-2 text-mauve sm:inline">Server offline</span>;
  const live = health.mode === "live";
  return (
    <span
      className={`ml-1 hidden items-center gap-2 rounded-full border px-3 py-2 sm:inline-flex ${live ? "border-gold/60 bg-ivory text-burgundy" : "border-rose/60 bg-powder text-burgundy"}`}
      title={live ? `Live AI via ${health.provider}` : "No API key found: agents run as clearly labeled rule-based demos"}
    >
      <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-rose"}`} />
      {live ? `Live · ${health.model}` : "Demo mode"}
    </span>
  );
}

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h2 className="text-4xl">This chapter has not begun yet</h2>
      <p className="mt-3 text-mauve">Choose your princess to open the royal wardrobe.</p>
      <button className="btn-royal mt-8" onClick={onStart}>Choose your princess</button>
    </div>
  );
}
