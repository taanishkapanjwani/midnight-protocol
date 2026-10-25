import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { OutfitItem, ScoreCard, ValidationResult } from "../../shared/types";
import { ItemArt } from "./Art";

export function ItemCard({ item, badge, compact = false, showReason = true }: { item: OutfitItem; badge?: { label: string; tone: "keep" | "new" | "out" }; compact?: boolean; showReason?: boolean }) {
  const tones = { keep: "bg-parchment text-burgundy border-gold/50", new: "bg-burgundy text-ivory border-burgundy", out: "bg-blush text-burgundy border-rose/50 line-through" };
  return (
    <article className={`relative overflow-hidden rounded-[22px] border border-gold/45 bg-ivory ${badge?.tone === "out" ? "opacity-70" : ""}`}>
      {badge && <span className={`absolute right-3 top-3 z-10 rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] ${tones[badge.tone]}`}>{badge.label}</span>}
      <div className={`relative ${compact ? "h-28" : "h-40"} m-2 rounded-[16px] border border-gold/30`} style={{ background: "radial-gradient(circle at 50% 35%, #fff, var(--accent-soft))" }}>
        <ItemArt item={item} className="mx-auto h-full py-2" />
      </div>
      <div className={compact ? "px-3 pb-3" : "px-4 pb-4"}>
        <p className="text-[0.62rem] uppercase tracking-[0.18em] text-mauve">{item.category} · {item.color}</p>
        <h3 className={`${compact ? "text-base" : "text-lg"} leading-snug`}>{item.name}</h3>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="font-serif text-xl text-burgundy">${item.price}</span>
          <span className="text-[0.62rem] text-mauve">{item.id}</span>
        </div>
        {!compact && (
          <p className="mt-1 text-[0.7rem] text-mauve">
            {item.available ? "In the demo catalog · available" : "Unavailable"}
            {item.heel ? ` · ${item.heel === "flat" ? "flat" : `${item.heel} heel`}` : ""}
          </p>
        )}
        {showReason && item.reason && !compact && <p className="mt-3 border-t border-gold/25 pt-3 font-serif text-[1.02rem] italic leading-snug text-burgundy">“{item.reason}”</p>}
      </div>
    </article>
  );
}

export function Ring({ value, label, sub, size = 92, muted = false }: { value: number; label: string; sub?: string; size?: number; muted?: boolean }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <figure className="flex flex-col items-center text-center">
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${label}: ${value} out of 100`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#F4DCE4" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={muted ? "#B98598" : "url(#ring-gold)"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform="rotate(-90 50 50)"
        />
        <defs>
          <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F0E0B8" />
            <stop offset=".5" stopColor="#C6A66B" />
            <stop offset="1" stopColor="#A8874A" />
          </linearGradient>
        </defs>
        <text x="50" y="57" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="24" fontWeight="600" fill="#5A293B">{value}</text>
      </svg>
      <figcaption className="mt-1 text-xs font-medium text-burgundy">{label}</figcaption>
      {sub && <span className="text-[0.62rem] uppercase tracking-[0.14em] text-mauve">{sub}</span>}
    </figure>
  );
}

export function ScoreRings({ score, size = 92 }: { score: ScoreCard; size?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Ring value={score.aesthetic} label="Princess aesthetic" sub="Rule-based tags" size={size} />
      <Ring value={score.budget} label="Budget" sub="Hard limit" size={size} muted={score.budget < 100} />
      <Ring value={score.occasion} label="Occasion" sub="Rule-based" size={size} />
      <Ring value={score.practicality} label="Practicality" sub="Hard checks" size={size} muted={score.practicality < 100} />
    </div>
  );
}

export function ChecksList({ v }: { v: ValidationResult }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {v.checks.map((c) => (
        <li key={c.label} className="flex items-center gap-2">
          <span className={`grid h-5 w-5 place-items-center rounded-full ${c.passed ? "bg-parchment text-gold-deep" : "bg-burgundy text-ivory"}`}>
            {c.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          </span>
          <span className={c.passed ? "text-burgundy" : "font-semibold text-burgundy"}>{c.label}</span>
        </li>
      ))}
    </ul>
  );
}
