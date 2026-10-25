import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ClipboardCopy, Download, ExternalLink, Footprints, Loader2, RefreshCw, Sparkles, Wand2, X } from "lucide-react";
import type { CatalogItem, CrisisId, Outfit, Preferences } from "../../shared/types";
import { princessById } from "../../shared/princesses";
import { postJson } from "../lib/api";
import { money, niceDate, titleCase } from "../lib/format";
import { Bow, FlowingRibbon, FramedPanel, PearlString, RibbonDivider } from "../components/Ornaments";
import { ProductImage } from "../components/ProductImage";
import { useModal } from "../lib/useModal";
import { ChecksList } from "../components/Outfit";

export interface CrisisRef { originalIds: string[]; crisisId: CrisisId }
const CLOTHING = ["dress", "top", "skirt", "trousers", "outerwear"];
const oneSize = (sizes: string[]) => sizes.length === 0 || /^one size$/i.test(sizes[0]);
interface LiveStatus { id: string; price: number | null; available: boolean; sizes: string[]; checkedAt: string; error?: string }
interface Alternative { item: CatalogItem; delta: number; newTotal: number; reasons: string[] }
interface AltResult { current: CatalogItem; budget: number; alternatives: Alternative[]; explanation: string }
type Goal = "similar" | "cheaper" | "comfier";

export default function Shop({ prefs, initial, crisis, onBack, onStartOver, toast }: {
  prefs: Preferences;
  initial: Outfit;
  crisis: CrisisRef | null;
  onBack: () => void;
  onStartOver: () => void;
  toast: (m: string) => void;
}) {
  const p = princessById(prefs.princess);
  const [outfit, setOutfit] = useState<Outfit>(initial);
  const [sizes, setSizes] = useState<Record<string, string>>({});
  const [live, setLive] = useState<Record<string, LiveStatus>>({});
  const [checking, setChecking] = useState(false);
  const [slipperFor, setSlipperFor] = useState<CatalogItem | null>(null);
  const ORDER = ["dress", "top", "skirt", "trousers", "outerwear", "shoes", "bag", "jewelry"];
  const items = [...outfit.items].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category));
  const ids = outfit.items.map((i) => i.id);
  const checkedAt = outfit.items.map((i) => i.checkedAt).sort()[0];

  async function checkStock() {
    setChecking(true);
    try {
      const rows = await postJson<LiveStatus[]>("/api/stock", { ids });
      setLive(Object.fromEntries(rows.map((r) => [r.id, r])));
      const sold = rows.filter((r) => !r.available).length;
      const moved = rows.filter((r) => r.available && r.price !== null && r.price !== outfit.items.find((i) => i.id === r.id)?.price).length;
      toast(sold ? `${sold} piece${sold > 1 ? "s are" : " is"} sold out right now. Let the Glass Slipper find a replacement.` : moved ? `All in stock. ${moved} price${moved > 1 ? "s have" : " has"} changed since we recorded ${moved > 1 ? "them" : "it"}.` : "Every piece is in stock at the recorded price.");
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  async function swap(oldId: string, alt: CatalogItem) {
    const next = ids.map((id) => (id === oldId ? alt.id : id));
    const o = await postJson<Outfit>("/api/validate", { prefs, outfitIds: next, crisis: crisis ?? undefined });
    if (!o.validation.valid) return toast("That swap would break a rule, so the Treasurer refused it.");
    setOutfit({ ...o, title: outfit.title, rationale: outfit.rationale });
    setLive((l) => Object.fromEntries(Object.entries(l).filter(([k]) => k !== oldId)));
    setSlipperFor(null);
    toast(`${titleCase(alt.name)} is in. New total ${money(o.validation.total)}.`);
  }

  const byRetailer = useMemo(() => {
    const m = new Map<string, typeof outfit.items>();
    for (const i of items) m.set(i.retailer, [...(m.get(i.retailer) ?? []), i]);
    return [...m.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit]);

  const listText = () =>
    [
      `${outfit.title} - ${p.name}, ${p.epithet}`,
      ...outfit.items.map((i) => `- ${titleCase(i.name)} (${i.retailer})${sizes[i.id] ? `, size ${sizes[i.id]}` : ""}: ${money(i.price)} - ${i.url}`),
      `Total recorded: ${money(outfit.validation.total)} of ${money(outfit.validation.budget)} budget`,
      `Prices and stock recorded ${niceDate(checkedAt)}. Confirm on each retailer's page; taxes and shipping not included.`,
    ].join("\n");

  async function copyList() {
    try {
      await navigator.clipboard.writeText(listText());
      toast("Your Royal Checkout List is copied.");
    } catch {
      toast("Copy is blocked in this browser - use Download instead.");
    }
  }

  function downloadCsv() {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = [["Item", "Retailer", "Size", "Recorded price (USD)", "Checked", "Product page"], ...outfit.items.map((i) => [titleCase(i.name), i.retailer, sizes[i.id] ?? "", i.price.toFixed(2), i.checkedAt, i.url])];
    const blob = new Blob([rows.map((r) => r.map((c) => esc(String(c))).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `royal-checkout-${prefs.princess}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-5">
      <div className="relative text-center">
        <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.1 }} style={{ transformOrigin: "left" }}>
          <FlowingRibbon className="pointer-events-none mx-auto -mb-4 h-14 w-full max-w-3xl opacity-80" d="M 0 200 C 300 120, 500 280, 600 200 S 900 120, 1200 200" width={38} />
        </motion.div>
        <p className="eyebrow">Chapter VI · Shop the Royal Look</p>
        <h1 className="mt-2 text-4xl sm:text-6xl">{outfit.title}</h1>
        <p className="script mt-1 text-2xl sm:text-3xl" style={{ color: p.accent }}>{p.name}, {p.epithet}</p>
        <p className="mx-auto mt-3 max-w-2xl text-mauve">
          Real pieces from real boutiques. Prices and stock were recorded from each retailer on {niceDate(checkedAt)}, and checkout happens on the retailer's own website.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button className="btn-royal" onClick={checkStock} disabled={checking}>
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Check stock & prices now
          </button>
          <a className="btn-ghost" href="#checkout-list">Royal Checkout List</a>
        </div>
      </div>

      <div className={`mt-10 grid gap-6 sm:grid-cols-2 ${items.length % 3 === 0 ? "lg:grid-cols-3" : "xl:grid-cols-4"}`}>
        {items.map((item, i) => {
          const st = live[item.id];
          const priceMoved = st?.available && st.price !== null && st.price !== item.price;
          return (
            <motion.article key={item.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="relative flex flex-col overflow-hidden rounded-[26px] border border-gold/60 bg-ivory shadow-[0_0_0_4px_#FFF9F5,0_0_0_5px_rgba(198,166,107,.35),0_24px_44px_-30px_rgba(90,41,59,.55)]">
              <Bow size={64} className="absolute -right-1 -top-1 z-10 rotate-12" />
              <div className="relative m-3 aspect-[4/5] overflow-hidden rounded-[18px] border border-gold/40 bg-white lg:aspect-square">
                <ProductImage item={item} fit={CLOTHING.includes(item.category) ? "cover" : "contain"} className="h-full w-full transition duration-700 hover:scale-[1.03]" />
                {st && (
                  <span className={`absolute bottom-3 left-3 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${st.available ? "bg-ivory/95 text-burgundy" : "bg-burgundy text-ivory"}`}>
                    {st.available ? "In stock now" : st.error ? "Couldn't reach retailer" : "Sold out now"}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col px-5 pb-5">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gold-deep">{item.retailer} · {item.category}</p>
                <h2 className="mt-1 text-xl leading-snug">{titleCase(item.name)}</h2>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
                  <span className="font-serif text-3xl">{money(item.price)}</span>
                  {priceMoved && <span className="text-sm text-burgundy">now {money(st!.price!)} at retailer</span>}
                </div>
                <p className="text-xs text-mauve">Recorded price · checked {niceDate(item.checkedAt)}</p>
                {(st?.sizes ?? item.sizes).length > 0 && !oneSize(item.sizes) && (
                  <div className="mt-3">
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-mauve">{st ? "Sizes in stock now" : "Sizes in stock when checked"}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`Size for ${titleCase(item.name)}`}>
                      {(st?.sizes ?? item.sizes).map((s) => (
                        <button key={s} role="radio" aria-checked={sizes[item.id] === s} onClick={() => setSizes((x) => ({ ...x, [item.id]: s }))} className={`min-h-11 min-w-11 rounded-full border px-3 text-sm transition ${sizes[item.id] === s ? "border-gold bg-blush text-burgundy" : "border-gold/40 text-burgundy hover:bg-powder"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {item.reason && !/^Kept/.test(item.reason) && <p className="mt-3 font-serif text-base italic leading-snug text-burgundy/90">“{item.reason}”</p>}
                <div className="mt-auto flex flex-col gap-2 pt-5">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn-royal justify-center !px-5 !py-3.5">
                    Shop at {item.retailer} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <button className="btn-ghost justify-center !py-3" onClick={() => setSlipperFor(item)}>
                    <Wand2 className="h-4 w-4" /> Find my Glass Slipper
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      <RibbonDivider className="mt-10" />

      <div id="checkout-list" className="scroll-mt-24">
        <FramedPanel className="parchment px-5 py-10 sm:px-12">
          <div className="text-center">
            <p className="eyebrow">Your list to take shopping</p>
            <h2 className="mt-2 text-4xl">The Royal Checkout List</h2>
            <PearlString className="mt-4" />
          </div>
          <div className="mx-auto mt-8 max-w-3xl space-y-6">
            {byRetailer.map(([retailer, items]) => (
              <div key={retailer}>
                <div className="flex items-baseline justify-between border-b border-gold/40 pb-2">
                  <h3 className="text-xl">{retailer}</h3>
                  <span className="text-sm text-mauve">Subtotal {money(items.reduce((s, i) => s + i.price, 0))}</span>
                </div>
                <ul className="mt-3 space-y-3">
                  {items.map((i) => (
                    <li key={i.id} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 sm:grid-cols-[3.5rem_1fr_auto_auto] sm:gap-4">
                      <div className="h-16 w-14 shrink-0 overflow-hidden rounded-xl border border-gold/40 bg-white">
                        <ProductImage item={i} className="h-full w-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-medium leading-snug">{titleCase(i.name)}</p>
                        <span className="font-serif text-lg sm:hidden">{money(i.price)}</span>
                        <p className="text-xs text-mauve">{sizes[i.id] ? `Size ${sizes[i.id]}` : oneSize(i.sizes) ? "One size" : "Choose a size above"} · {i.category}</p>
                      </div>
                      <span className="hidden font-serif text-xl sm:inline">{money(i.price)}</span>
                      <a href={i.url} target="_blank" rel="noopener noreferrer" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/50 text-burgundy hover:bg-powder" aria-label={`Open ${titleCase(i.name)} at ${i.retailer} in a new tab`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-8 grid max-w-3xl gap-6 border-t border-gold/40 pt-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm text-mauve">Total recorded cost · {outfit.items.length} pieces from {byRetailer.length} retailer{byRetailer.length > 1 ? "s" : ""}</p>
              <p className="font-serif text-5xl">{money(outfit.validation.total)}</p>
              <p className={`text-sm ${outfit.validation.valid ? "text-mauve" : "font-semibold text-burgundy"}`}>
                {outfit.validation.valid ? `Within your ${money(outfit.validation.budget)} budget · ${money(outfit.validation.remaining)} to spare` : "This look no longer passes every rule"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="btn-royal" onClick={copyList}><ClipboardCopy className="h-4 w-4" /> Copy list</button>
              <button className="btn-ghost" onClick={downloadCsv}><Download className="h-4 w-4" /> Download CSV</button>
            </div>
          </div>
          <details className="mx-auto mt-6 max-w-3xl rounded-2xl border border-gold/30 bg-ivory/70 px-5 py-3 text-sm">
            <summary className="cursor-pointer font-medium">The Treasurer's checks for this list</summary>
            <div className="mt-3"><ChecksList v={outfit.validation} /></div>
          </details>
          <p className="mx-auto mt-6 max-w-3xl text-xs leading-relaxed text-mauve">
            Purchases and payments happen only on each retailer's website. The Midnight Protocol is not affiliated with these retailers and earns nothing from these links. Prices and sizes were recorded from each retailer's public product data and can change at any time; taxes and shipping are not included. "Check stock & prices now" asks each retailer directly but is not a guarantee of inventory.
          </p>
        </FramedPanel>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <button className="btn-ghost" onClick={onBack}>Back</button>
        <button className="btn-royal" onClick={onStartOver}><Sparkles className="h-4 w-4" /> Start a new story</button>
      </div>

      <AnimatePresence>
        {slipperFor && (
          <GlassSlipper
            key={slipperFor.id}
            prefs={prefs}
            item={slipperFor}
            outfitIds={ids}
            crisis={crisis}
            liveSoldOut={live[slipperFor.id] ? !live[slipperFor.id].available : false}
            onClose={() => setSlipperFor(null)}
            onSwap={(alt) => swap(slipperFor.id, alt)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function GlassSlipper({ prefs, item, outfitIds, crisis, liveSoldOut, onClose, onSwap }: {
  prefs: Preferences;
  item: CatalogItem;
  outfitIds: string[];
  crisis: CrisisRef | null;
  liveSoldOut: boolean;
  onClose: () => void;
  onSwap: (alt: CatalogItem) => Promise<void>;
}) {
  const closeRef = useModal(onClose);
  const [goal, setGoal] = useState<Goal>("similar");
  const [res, setRes] = useState<AltResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(g: Goal) {
    setGoal(g);
    setRes(null);
    setError(null);
    try {
      setRes(await postJson<AltResult>("/api/alternatives", { prefs, outfitIds, itemId: item.id, goal: g, crisis: crisis ?? undefined }));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load("similar");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goals: { g: Goal; label: string; show: boolean }[] = [
    { g: "similar", label: "Most similar", show: true },
    { g: "cheaper", label: "Cheaper", show: true },
    { g: "comfier", label: "Easier to walk in", show: item.category === "shoes" },
  ];

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-burgundy/40 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} role="dialog" aria-modal="true" aria-label="Find my Glass Slipper">
      <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 30 }} className="parchment relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-[28px] border border-gold/60 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[28px] sm:p-8">
        <div className="sticky top-0 z-10 h-0">
          <button ref={closeRef} onClick={onClose} className="absolute -right-2 top-3 grid h-11 w-11 place-items-center rounded-full bg-parchment/95 text-mauve shadow-sm backdrop-blur hover:bg-powder sm:-right-4" aria-label="Close"><X /></button>
        </div>
        <div className="flex items-start gap-3 pt-5 pr-12 sm:pt-0">
          <Footprints className="mt-1 h-6 w-6 shrink-0 text-gold-deep" />
          <div>
            <p className="eyebrow">Find my Glass Slipper</p>
            <h2 className="line-clamp-3 text-xl leading-tight sm:text-3xl">Alternatives for {titleCase(item.name)}</h2>
            <p className="mt-1 text-sm text-mauve">{liveSoldOut ? "This piece is sold out at the retailer right now. " : ""}Every suggestion keeps your whole look within budget and every rule.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2" role="tablist">
          {goals.filter((x) => x.show).map((x) => (
            <button key={x.g} role="tab" aria-selected={goal === x.g} onClick={() => load(x.g)} className={`min-h-11 rounded-full border px-4 text-sm transition ${goal === x.g ? "border-gold bg-blush" : "border-gold/40 hover:bg-powder"}`}>{x.label}</button>
          ))}
        </div>
        {error && <p className="mt-4 text-sm text-burgundy" role="alert">{error}</p>}
        <div className="min-h-[22rem]">
        {!res && !error && <div className="shimmer mt-5 h-48 rounded-2xl" />}
        {res && (
          <>
            <p className="mt-4 text-sm text-mauve">{res.explanation}</p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {res.alternatives.map((a) => (
                <li key={a.item.id} className="flex gap-3 rounded-2xl border border-gold/40 bg-ivory p-3">
                  <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-gold/30 bg-white">
                    <ProductImage item={a.item} className="h-full w-full" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-[0.6rem] uppercase tracking-[0.16em] text-mauve">{a.item.retailer}</p>
                    <p className="text-sm font-medium leading-snug">{titleCase(a.item.name)}</p>
                    <p className="mt-0.5 font-serif text-lg">{money(a.item.price)} <span className="text-xs text-mauve">({a.delta > 0 ? "+" : a.delta < 0 ? "−" : "±"}{money(Math.abs(a.delta))})</span></p>
                    <p className="text-xs text-mauve">{a.reasons.join(" · ") || "Keeps every rule"}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                      <button
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-burgundy px-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ivory disabled:opacity-60"
                        disabled={busy !== null}
                        onClick={async () => {
                          setBusy(a.item.id);
                          await onSwap(a.item);
                          setBusy(null);
                        }}
                      >
                        {busy === a.item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Swap in
                      </button>
                      <a href={a.item.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 px-2 text-xs text-burgundy underline-offset-4 hover:underline">
                        View <ExternalLink className="h-3 w-3" /><span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {res.alternatives.length === 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-gold/50 bg-ivory/70 p-6 text-center">
                <p className="font-serif text-xl">No glass slipper fits here yet</p>
                <p className="mt-1 text-sm text-mauve">Try another tab, or go back and raise the budget a little.</p>
              </div>
            )}
          </>
        )}
        </div>
      </motion.div>
    </motion.div>
  );
}
