import { useId } from "react";
import type { CatalogItem, PrincessId } from "../../shared/types";
import { princessById } from "../../shared/princesses";

// Original illustrations drawn in code: no external images, so nothing can fail to load.
const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
  return `#${[c(n >> 16), c((n >> 8) & 255), c(n & 255)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};

function Fabric({ id, hex }: { id: string; hex: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-f`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={shade(hex, 0.12)} />
        <stop offset=".45" stopColor={hex} />
        <stop offset=".6" stopColor={shade(hex, 0.1)} />
        <stop offset="1" stopColor={shade(hex, -0.14)} />
      </linearGradient>
    </defs>
  );
}

export function ItemArt({ item, className = "" }: { item: Pick<CatalogItem, "category" | "colorHex" | "heel" | "name">; className?: string }) {
  const id = useId().replace(/:/g, "");
  const f = `url(#${id}-f)`;
  const line = shade(item.colorHex, -0.32);
  const common = { fill: f, stroke: line, strokeWidth: 1.4, strokeLinejoin: "round" as const };
  let body: React.ReactNode;
  const n = item.name.toLowerCase();
  switch (item.category) {
    case "dress":
      body = (
        <g>
          <path d="M42 22 C 46 30, 54 30, 58 22 L 63 26 C 61 36, 60 44, 60 50 C 74 74, 82 96, 86 112 C 66 118, 34 118, 14 112 C 18 96, 26 74, 40 50 C 40 44, 39 36, 37 26 Z" {...common} />
          <path d="M40 50 C 48 54, 52 54, 60 50" stroke={line} strokeOpacity=".6" fill="none" />
          <path d="M50 54 C 48 80, 40 100, 30 114 M50 54 C 54 80, 62 100, 72 114" stroke="#fff" strokeOpacity=".35" fill="none" />
        </g>
      );
      break;
    case "top":
      body = (
        <g>
          <path d="M36 26 C 42 32, 58 32, 64 26 L 80 34 L 76 50 L 68 48 L 68 92 L 32 92 L 32 48 L 24 50 L 20 34 Z" {...common} />
          <path d="M36 26 C 44 40, 56 40, 64 26" stroke={line} strokeOpacity=".5" fill="none" />
          {[52, 64, 76].map((y) => <circle key={y} cx="50" cy={y} r="1.8" fill="#FFF9F5" stroke={line} strokeWidth=".6" />)}
        </g>
      );
      break;
    case "skirt":
      body = (
        <g>
          <rect x="34" y="24" width="32" height="8" rx="2" {...common} />
          <path d="M34 32 L 66 32 C 74 62, 82 90, 86 110 C 62 116, 38 116, 14 110 C 18 90, 26 62, 34 32 Z" {...common} />
          <path d="M42 34 L 30 110 M50 34 L 50 114 M58 34 L 70 110" stroke="#fff" strokeOpacity=".3" fill="none" />
        </g>
      );
      break;
    case "trousers":
      body = <path d="M34 22 L 66 22 L 72 112 L 54 112 L 50 52 L 46 112 L 28 112 Z" {...common} />;
      break;
    case "shoes":
      body =
        item.heel === "high" ? (
          <g>
            <path d="M16 84 C 30 82, 46 72, 58 58 C 66 64, 78 68, 86 70 C 90 72, 90 80, 84 82 L 30 92 C 22 94, 14 90, 16 84 Z" {...common} />
            <path d="M80 82 L 82 108 L 77 108 L 73 83 Z" {...common} />
          </g>
        ) : item.heel === "low" ? (
          <g>
            <path d="M12 82 C 20 72, 42 66, 56 64 C 70 62, 84 66, 88 76 C 90 84, 86 88, 78 88 L 20 90 C 12 90, 10 86, 12 82 Z" {...common} />
            <rect x="72" y="86" width="10" height="12" rx="1" {...common} />
            <path d="M38 70 C 46 64, 56 64, 62 68" stroke={line} fill="none" />
          </g>
        ) : (
          <g>
            <path d="M10 86 C 14 74, 40 70, 58 70 C 76 70, 90 76, 90 84 C 90 90, 84 92, 76 92 L 18 92 C 12 92, 9 90, 10 86 Z" {...common} />
            <path d="M30 74 C 40 82, 56 82, 66 72" stroke={line} fill="none" />
            <path d="M44 80 l-5 -5 m5 5 l5 -5" stroke={line} strokeWidth="1.2" />
          </g>
        );
      break;
    case "bag":
      body = (
        <g>
          <path d="M34 50 C 34 26, 66 26, 66 50" stroke="#C6A66B" strokeWidth="3" fill="none" />
          <path d="M20 50 L 80 50 L 74 98 C 60 102, 40 102, 26 98 Z" {...common} />
          <path d="M20 50 C 34 66, 66 66, 80 50" stroke={line} fill="none" />
          <circle cx="50" cy="62" r="4" fill="#E5CF9C" stroke="#A8874A" />
        </g>
      );
      break;
    case "jewelry":
      body = /tiara|headband|comb|clip|bow/.test(n) ? (
        <g>
          <path d="M14 82 C 30 66, 70 66, 86 82" stroke="#C6A66B" strokeWidth="3" fill="none" />
          <path d="M26 72 L 32 52 L 40 68 L 50 40 L 60 68 L 68 52 L 74 72" stroke="#C6A66B" strokeWidth="2" fill="none" />
          {[32, 50, 68].map((x, i) => <circle key={x} cx={x} cy={[52, 40, 52][i]} r="4" fill={item.colorHex} stroke="#A8874A" />)}
        </g>
      ) : /earring|stud/.test(n) ? (
        <g>
          {[36, 64].map((x) => (
            <g key={x}>
              <circle cx={x} cy="40" r="3" fill="#C6A66B" />
              <path d={`M${x} 43 L ${x} 58`} stroke="#C6A66B" strokeWidth="1.5" />
              <ellipse cx={x} cy="68" rx="8" ry="10" fill={item.colorHex} stroke={line} />
              <ellipse cx={x - 3} cy="64" rx="2.5" ry="3" fill="#fff" opacity=".7" />
            </g>
          ))}
        </g>
      ) : (
        <g>
          <path d="M22 30 C 26 70, 74 70, 78 30" stroke="#C6A66B" strokeWidth="1.6" fill="none" />
          {Array.from({ length: 11 }).map((_, i) => {
            const t = i / 10;
            const x = 22 + 56 * t;
            const y = 30 + 40 * Math.sin(Math.PI * t) * 0.75;
            return <circle key={i} cx={x} cy={y} r="3" fill="#F3ECE6" stroke="#D9CFC6" strokeWidth=".6" />;
          })}
          <path d="M50 60 C 42 70, 44 82, 50 88 C 56 82, 58 70, 50 60 Z" fill={item.colorHex} stroke={line} />
        </g>
      );
      break;
    case "outerwear":
      body = (
        <g>
          <path d="M38 20 L 62 20 L 84 34 L 88 100 L 70 100 L 66 112 L 34 112 L 30 100 L 12 100 L 16 34 Z" {...common} />
          <path d="M38 20 L 50 46 L 62 20 M50 46 L 50 112" stroke={line} strokeOpacity=".6" fill="none" />
          {[58, 74, 90].map((y) => <circle key={y} cx="56" cy={y} r="2" fill="#E5CF9C" stroke="#A8874A" strokeWidth=".6" />)}
        </g>
      );
      break;
  }
  return (
    <svg viewBox="0 0 100 124" className={className} role="img" aria-label={`${item.name} illustration`}>
      <Fabric id={id} hex={item.colorHex} />
      <ellipse cx="50" cy="116" rx="34" ry="4" fill="#5A293B" opacity=".07" />
      {body}
    </svg>
  );
}

// Princess-inspired gown silhouettes (original drawings, not studio artwork).
const GOWNS: Record<PrincessId, { skirt: string; bodice: string; extra?: string }> = {
  cinderella: {
    bodice: "M88 70 C 94 78, 106 78, 112 70 L 118 76 C 114 92, 112 104, 112 112 L 88 112 C 88 104, 86 92, 82 76 Z",
    skirt: "M88 112 L 112 112 C 150 150, 176 196, 186 244 C 140 258, 60 258, 14 244 C 24 196, 50 150, 88 112 Z",
    extra: "M82 76 C 70 74, 64 84, 68 92 C 74 88, 80 84, 84 82 M118 76 C 130 74, 136 84, 132 92 C 126 88, 120 84, 116 82",
  },
  belle: {
    bodice: "M84 74 C 94 72, 106 72, 116 74 L 114 92 C 112 100, 112 106, 112 112 L 88 112 C 88 106, 88 100, 86 92 Z",
    skirt: "M88 112 L 112 112 C 146 140, 172 190, 182 246 C 136 260, 64 260, 18 246 C 28 190, 54 140, 88 112 Z",
    extra: "M84 74 C 74 76, 70 82, 70 86 M116 74 C 126 76, 130 82, 130 86",
  },
  aurora: {
    bodice: "M90 68 C 96 76, 104 76, 110 68 L 114 72 C 112 90, 110 104, 110 112 L 90 112 C 90 104, 88 90, 86 72 Z",
    skirt: "M90 112 L 110 112 C 136 140, 156 176, 164 214 C 130 226, 70 226, 36 214 C 44 176, 64 140, 90 112 Z",
    extra: "M36 214 C 50 222, 64 216, 76 224 C 90 216, 110 228, 124 220 C 138 228, 150 218, 164 214",
  },
  rapunzel: {
    bodice: "M88 70 C 94 76, 106 76, 112 70 L 118 74 C 114 90, 112 104, 112 112 L 88 112 C 88 104, 86 90, 82 74 Z",
    skirt: "M88 112 L 112 112 C 140 146, 160 196, 168 248 C 126 258, 74 258, 32 248 C 40 196, 60 146, 88 112 Z",
    extra: "M82 74 C 72 80, 72 92, 78 96 M118 74 C 128 80, 128 92, 122 96",
  },
  snowwhite: {
    bodice: "M86 74 C 94 80, 106 80, 114 74 L 118 78 C 114 92, 112 104, 112 112 L 88 112 C 88 104, 86 92, 82 78 Z",
    skirt: "M88 112 L 112 112 C 138 136, 156 180, 164 236 C 126 246, 74 246, 36 236 C 44 180, 62 136, 88 112 Z",
    extra: "M80 70 C 88 58, 94 66, 100 72 C 106 66, 112 58, 120 70",
  },
  ariel: {
    bodice: "M90 70 C 96 76, 104 76, 110 70 L 114 74 C 112 92, 110 104, 110 116 L 90 116 C 90 104, 88 92, 86 74 Z",
    skirt: "M90 116 L 110 116 C 118 150, 120 186, 118 206 C 138 222, 160 238, 176 252 C 130 260, 70 260, 24 252 C 40 238, 62 222, 82 206 C 80 186, 82 150, 90 116 Z",
  },
};

export function PrincessGown({ princess, className = "" }: { princess: PrincessId; className?: string }) {
  const id = useId().replace(/:/g, "");
  const p = princessById(princess);
  const g = GOWNS[princess];
  const [c1, c2, c3] = p.colors.map((c) => c.hex);
  return (
    <svg viewBox="0 0 200 270" className={className} role="img" aria-label={`${p.name}-inspired gown illustration`}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(c1, 0.12)} />
          <stop offset=".4" stopColor={c1} />
          <stop offset=".62" stopColor={shade(c1, 0.14)} />
          <stop offset="1" stopColor={shade(c1, -0.12)} />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={princess === "snowwhite" ? c2 : shade(c1, -0.05)} />
          <stop offset="1" stopColor={princess === "snowwhite" ? shade(c2, -0.1) : c1} />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="256" rx="84" ry="8" fill="#5A293B" opacity=".08" />
      {/* dress form stand */}
      <path d="M100 30 C 92 30, 88 38, 88 46 C 88 56, 94 62, 100 62 C 106 62, 112 56, 112 46 C 112 38, 108 30, 100 30 Z" fill="#F5EBDD" stroke="#C6A66B" strokeWidth="1" />
      <path d="M100 62 L 100 70" stroke="#C6A66B" strokeWidth="2" />
      <path d={g.skirt} fill={`url(#${id}-g)`} stroke={shade(c1, -0.3)} strokeWidth="1.2" />
      <path d={g.skirt} fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1" transform="translate(0 -6) scale(1 1)" />
      {[0.3, 0.5, 0.7].map((t) => (
        <path key={t} d={`M100 116 C ${100 + (t - 0.5) * 60} 170, ${100 + (t - 0.5) * 120} 210, ${100 + (t - 0.5) * 180} 244`} stroke="#fff" strokeOpacity=".28" fill="none" />
      ))}
      <path d={g.bodice} fill={`url(#${id}-b)`} stroke={shade(c1, -0.3)} strokeWidth="1.2" />
      {g.extra && <path d={g.extra} fill={princess === "snowwhite" ? "#FFF9F5" : c3} fillOpacity=".7" stroke={shade(c1, -0.25)} strokeWidth="1" />}
      <path d="M88 112 C 96 116, 104 116, 112 112" stroke={c3 === "#FFF9F5" ? "#C6A66B" : shade(c2, -0.1)} strokeWidth="3" fill="none" />
      {Array.from({ length: 7 }).map((_, i) => (
        <circle key={i} cx={90 + i * 3.3} cy={80 + Math.sin(i) * 2} r="1.1" fill="#fff" opacity=".8" />
      ))}
    </svg>
  );
}

// Ornate gilded mirror with a gown reflected inside.
export function GildedMirror({ princess = "aurora", className = "", onClick }: { princess?: PrincessId; className?: string; onClick?: () => void }) {
  const id = useId().replace(/:/g, "");
  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <svg viewBox="0 0 300 420" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F3E5C3" />
            <stop offset=".3" stopColor="#C6A66B" />
            <stop offset=".55" stopColor="#EBD9AE" />
            <stop offset=".8" stopColor="#A8874A" />
            <stop offset="1" stopColor="#D8BE8A" />
          </linearGradient>
          <radialGradient id={`${id}-glass`} cx=".42" cy=".35" r=".8">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset=".55" stopColor="#F9EAF0" />
            <stop offset="1" stopColor="#E9CFD9" />
          </radialGradient>
        </defs>
        <path d="M150 6 C 160 22, 178 18, 186 30 C 176 34, 164 34, 150 46 C 136 34, 124 34, 114 30 C 122 18, 140 22, 150 6 Z" fill={`url(#${id}-gold)`} />
        <ellipse cx="150" cy="222" rx="132" ry="182" fill={`url(#${id}-gold)`} />
        <ellipse cx="150" cy="222" rx="120" ry="170" fill="none" stroke="#8F7240" strokeOpacity=".5" strokeWidth="1.5" />
        <ellipse cx="150" cy="222" rx="112" ry="162" fill={`url(#${id}-glass)`} />
        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          return <circle key={i} cx={150 + 126 * Math.cos(a)} cy={222 + 176 * Math.sin(a)} r="3.4" fill="#F7F1EA" stroke="#D9CFC6" strokeWidth=".5" />;
        })}
        <path d="M70 120 C 90 92, 120 78, 150 74" stroke="#fff" strokeWidth="6" strokeOpacity=".7" fill="none" strokeLinecap="round" />
        <path d="M66 150 C 70 134, 78 122, 88 112" stroke="#fff" strokeWidth="3" strokeOpacity=".6" fill="none" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-x-[16%] top-[17%] bottom-[9%]">
        <PrincessGown princess={princess} className="h-full w-full" />
      </div>
    </div>
  );
}
