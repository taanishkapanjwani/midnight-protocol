import { useId, useMemo, type CSSProperties } from "react";

// Satin gradient stops shared by every ribbon element: layered highlights read as folded satin.
function SatinDefs({ id, tone = "blush" }: { id: string; tone?: "blush" | "deep" }) {
  const s = tone === "blush" ? ["#FCEAF0", "#EDB9CA", "#FDF1F5", "#E3A5B9", "#C98AA0"] : ["#E9B6C6", "#C98AA0", "#EFC7D3", "#B47388", "#8F5A6E"];
  return (
    <defs>
      <linearGradient id={`${id}-satin`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={s[0]} />
        <stop offset=".32" stopColor={s[1]} />
        <stop offset=".52" stopColor={s[2]} />
        <stop offset=".78" stopColor={s[3]} />
        <stop offset="1" stopColor={s[4]} />
      </linearGradient>
      <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#B87790" stopOpacity=".55" />
        <stop offset="1" stopColor="#8F5A6E" stopOpacity=".15" />
      </linearGradient>
      <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#5A293B" floodOpacity=".18" />
      </filter>
    </defs>
  );
}

export function Bow({ size = 64, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 145" width={size} height={size * 0.725} className={className} style={style} aria-hidden="true">
      <SatinDefs id={id} />
      <g filter={`url(#${id}-soft)`}>
        {/* tails */}
        <path d="M94 70 C 84 96, 70 118, 56 136 L 73 129 L 79 141 C 90 117, 99 95, 103 72 Z" fill={`url(#${id}-satin)`} />
        <path d="M106 70 C 116 96, 130 118, 144 136 L 127 129 L 121 141 C 110 117, 101 95, 97 72 Z" fill={`url(#${id}-satin)`} />
        <path d="M97 74 C 92 96, 84 114, 76 128" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" fill="none" />
        {/* loops */}
        <path d="M100 62 C 72 18, 16 16, 20 52 C 24 86, 72 84, 100 68 Z" fill={`url(#${id}-satin)`} />
        <path d="M100 62 C 128 18, 184 16, 180 52 C 176 86, 128 84, 100 68 Z" fill={`url(#${id}-satin)`} />
        <path d="M100 65 C 80 46, 46 40, 38 55 C 56 50, 80 56, 100 67 Z" fill={`url(#${id}-shade)`} />
        <path d="M100 65 C 120 46, 154 40, 162 55 C 144 50, 120 56, 100 67 Z" fill={`url(#${id}-shade)`} />
        <path d="M30 40 C 44 26, 70 28, 88 50" stroke="#fff" strokeOpacity=".7" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M170 40 C 156 26, 130 28, 112 50" stroke="#fff" strokeOpacity=".45" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* knot */}
        <ellipse cx="100" cy="65" rx="13" ry="15" fill={`url(#${id}-satin)`} />
        <path d="M92 58 C 96 54, 104 54, 108 58" stroke="#fff" strokeOpacity=".75" strokeWidth="1.8" fill="none" />
        <path d="M90 72 C 96 78, 104 78, 110 72" stroke="#A86A82" strokeOpacity=".5" strokeWidth="1.5" fill="none" />
      </g>
    </svg>
  );
}

// A long flowing satin ribbon (used to frame the hero and as dividers).
export function FlowingRibbon({ className = "", d, width = 26 }: { className?: string; d: string; width?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 1200 400" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-r`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E7AFC2" stopOpacity="0" />
          <stop offset=".08" stopColor="#EDB9CA" />
          <stop offset=".25" stopColor="#FCEAF0" />
          <stop offset=".42" stopColor="#E3A5B9" />
          <stop offset=".6" stopColor="#FBE3EB" />
          <stop offset=".78" stopColor="#D995AC" />
          <stop offset=".92" stopColor="#F6D3DF" />
          <stop offset="1" stopColor="#E7AFC2" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-s`}>
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#5A293B" floodOpacity=".14" />
        </filter>
      </defs>
      <path d={d} stroke={`url(#${id}-r)`} strokeWidth={width} fill="none" strokeLinecap="round" filter={`url(#${id}-s)`} />
      <path d={d} stroke="#fff" strokeOpacity=".55" strokeWidth={width * 0.12} fill="none" transform={`translate(0 ${-width * 0.22})`} />
      <path d={d} stroke="#A86A82" strokeOpacity=".18" strokeWidth={width * 0.1} fill="none" transform={`translate(0 ${width * 0.3})`} />
    </svg>
  );
}

export function RibbonDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center py-6 ${className}`} aria-hidden="true">
      <div className="hairline w-full max-w-3xl" />
      <div className="absolute flex items-center gap-3 bg-ivory px-4">
        <Pearl />
        <Bow size={56} />
        <Pearl />
      </div>
    </div>
  );
}

export function Pearl({ r = 5 }: { r?: number }) {
  return (
    <svg width={r * 2 + 2} height={r * 2 + 2} viewBox={`0 0 ${r * 2 + 2} ${r * 2 + 2}`} aria-hidden="true">
      <defs>
        <radialGradient id="pearl-g" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".55" stopColor="#F3ECE6" />
          <stop offset="1" stopColor="#D9CFC6" />
        </radialGradient>
      </defs>
      <circle cx={r + 1} cy={r + 1} r={r} fill="url(#pearl-g)" stroke="#E2D6CB" strokeWidth=".5" />
    </svg>
  );
}

export function PearlString({ count = 9, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-1 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Pearl key={i} r={i === Math.floor(count / 2) ? 6 : 4} />
      ))}
    </div>
  );
}

// Gilded filigree corner flourish.
export function Filigree({ className = "", flip = "" }: { className?: string; flip?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} style={{ transform: flip }} aria-hidden="true">
      <g stroke="#C6A66B" strokeWidth="1.3" fill="none" strokeLinecap="round">
        <path d="M4 76 V 30 C 4 14, 14 4, 30 4 H 76" />
        <path d="M10 70 V 34 C 10 20, 20 10, 34 10 H 70" strokeOpacity=".5" />
        <path d="M18 18 C 26 26, 34 22, 32 14 C 30 8, 22 10, 24 16" />
        <path d="M18 18 C 10 26, 14 34, 22 32 C 28 30, 26 22, 20 24" />
        <circle cx="18" cy="18" r="2.2" fill="#C6A66B" />
      </g>
    </svg>
  );
}

export function FramedPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative gilded rounded-[28px] bg-ivory ${className}`}>
      <Filigree className="pointer-events-none absolute left-2 top-2 h-10 w-10" />
      <Filigree className="pointer-events-none absolute right-2 top-2 h-10 w-10" flip="scaleX(-1)" />
      <Filigree className="pointer-events-none absolute bottom-2 left-2 h-10 w-10" flip="scaleY(-1)" />
      <Filigree className="pointer-events-none absolute bottom-2 right-2 h-10 w-10" flip="scale(-1,-1)" />
      {children}
    </div>
  );
}

export function WaxSeal({ size = 72, letter = "M" }: { size?: number; letter?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <radialGradient id="wax" cx=".38" cy=".32" r=".75">
          <stop offset="0" stopColor="#C77A92" />
          <stop offset=".55" stopColor="#8E4560" />
          <stop offset="1" stopColor="#5A293B" />
        </radialGradient>
      </defs>
      <path d="M50 4 C 62 6, 66 2, 76 10 C 86 16, 90 24, 94 34 C 99 46, 96 56, 94 66 C 90 78, 82 86, 70 92 C 60 97, 46 98, 34 94 C 22 90, 12 82, 7 70 C 2 58, 4 46, 6 36 C 10 22, 20 12, 32 7 C 38 4, 44 4, 50 4 Z" fill="url(#wax)" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="#E9B6C6" strokeOpacity=".5" strokeWidth="2" />
      <text x="50" y="62" textAnchor="middle" fontFamily="Pinyon Script, cursive" fontSize="38" fill="#F4DCE4" fillOpacity=".9">{letter}</text>
    </svg>
  );
}

export function Crest({ size = 40, onClick }: { size?: number; onClick?: () => void }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" onClick={onClick} className={onClick ? "cursor-pointer" : ""} aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#FFF9F5" stroke="#C6A66B" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#C6A66B" strokeOpacity=".4" />
      <path d="M17 42 l4-17 11 10 11-10 4 17 z" fill="#C6A66B" />
      <path d="M17 45 h30" stroke="#C6A66B" strokeWidth="2" />
      <circle cx="21" cy="24" r="2.6" fill="#F4DCE4" stroke="#C6A66B" strokeWidth=".8" />
      <circle cx="32" cy="18" r="3" fill="#F4DCE4" stroke="#C6A66B" strokeWidth=".8" />
      <circle cx="43" cy="24" r="2.6" fill="#F4DCE4" stroke="#C6A66B" strokeWidth=".8" />
    </svg>
  );
}

// Antique clock. `minutes` before midnight controls the hands; `glow` animates the crisis state.
export function AntiqueClock({ size = 160, minutesToMidnight = 5, glow = false, dark = false, onClick }: { size?: number; minutesToMidnight?: number; glow?: boolean; dark?: boolean; onClick?: () => void }) {
  const id = useId().replace(/:/g, "");
  const minuteAngle = ((60 - minutesToMidnight) / 60) * 360;
  const hourAngle = (11 / 12) * 360 + ((60 - minutesToMidnight) / 60) * 30;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" onClick={onClick} className={`${glow ? "glow-pulse rounded-full" : ""} ${onClick ? "cursor-pointer" : ""}`} role="img" aria-label={`Antique clock, ${minutesToMidnight} minutes to midnight`}>
      <defs>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F0E0B8" />
          <stop offset=".45" stopColor="#C6A66B" />
          <stop offset="1" stopColor="#8F7240" />
        </linearGradient>
        <radialGradient id={`${id}-face`} cx=".5" cy=".4" r=".7">
          <stop offset="0" stopColor={dark ? "#2B3155" : "#FFFDF9"} />
          <stop offset="1" stopColor={dark ? "#1A1F3A" : "#F5EBDD"} />
        </radialGradient>
      </defs>
      {Array.from({ length: 12 }).map((_, i) => (
        <circle key={i} cx={100 + 94 * Math.sin((i * Math.PI) / 6)} cy={100 - 94 * Math.cos((i * Math.PI) / 6)} r="3.2" fill="#F3ECE6" stroke="#C6A66B" strokeWidth=".6" />
      ))}
      <circle cx="100" cy="100" r="86" fill={`url(#${id}-gold)`} />
      <circle cx="100" cy="100" r="76" fill={`url(#${id}-face)`} stroke="#8F7240" strokeWidth="1" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="#C6A66B" strokeOpacity=".5" />
      {["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"].map((n, i) => (
        <text key={n} x={100 + 52 * Math.sin((i * Math.PI) / 6)} y={100 - 52 * Math.cos((i * Math.PI) / 6) + 5} textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="13" fontWeight="600" fill={dark ? "#E5CF9C" : "#5A293B"}>
          {n}
        </text>
      ))}
      {Array.from({ length: 60 }).map((_, i) => (
        <line key={i} x1="100" y1="27" x2="100" y2={i % 5 ? "30" : "33"} stroke={dark ? "#E5CF9C" : "#927385"} strokeWidth={i % 5 ? ".6" : "1.4"} transform={`rotate(${i * 6} 100 100)`} />
      ))}
      <g style={{ transition: "transform 1.2s cubic-bezier(.4,1.6,.5,1)", transformOrigin: "100px 100px", transform: `rotate(${hourAngle}deg)` }}>
        <path d="M100 100 L 97 72 L 100 60 L 103 72 Z" fill={dark ? "#F0E0B8" : "#5A293B"} />
      </g>
      <g style={{ transition: "transform 1.2s cubic-bezier(.4,1.6,.5,1)", transformOrigin: "100px 100px", transform: `rotate(${minuteAngle}deg)` }}>
        <path d="M100 104 L 98.5 60 L 100 38 L 101.5 60 Z" fill={dark ? "#F0E0B8" : "#5A293B"} />
      </g>
      <circle cx="100" cy="100" r="5" fill={`url(#${id}-gold)`} />
    </svg>
  );
}

export function Particles({ count = 26, className = "" }: { count?: number; className?: string }) {
  const ps = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${40 + ((i * 53) % 60)}%`,
        size: 3 + ((i * 7) % 5),
        dur: 6 + ((i * 13) % 7),
        delay: -((i * 1.7) % 9),
      })),
    [count],
  );
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {ps.map((p, i) => (
        <span key={i} className="particle" style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  );
}

export function Stars({ count = 40 }: { count?: number }) {
  const s = useMemo(() => Array.from({ length: count }).map((_, i) => ({ l: (i * 47) % 100, t: (i * 29) % 100, d: (i % 7) * 0.35, z: 1 + (i % 3) })), [count]);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {s.map((x, i) => (
        <svg key={i} className="twinkle absolute" style={{ left: `${x.l}%`, top: `${x.t}%`, animationDelay: `${x.d}s` }} width={x.z * 6} height={x.z * 6} viewBox="0 0 10 10">
          <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="#F0E0B8" />
        </svg>
      ))}
    </div>
  );
}

export function RosePetal({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 30" className={className} style={style} aria-hidden="true">
      <path d="M2 18 C 8 2, 30 0, 38 10 C 30 26, 10 30, 2 18 Z" fill="#EDB9CA" opacity=".85" />
      <path d="M6 17 C 14 10, 26 8, 34 11" stroke="#fff" strokeOpacity=".5" fill="none" />
    </svg>
  );
}
