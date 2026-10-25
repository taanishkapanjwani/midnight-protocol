// Reads one product's current public data from a retailer's Shopify store (/products/<handle>.js).
export const RETAILER_NAMES = {
  "us.princesspolly.com": "Princess Polly",
  "petalandpup.com": "Petal & Pup",
  "hillhousehome.com": "Hill House Home",
  "shopakira.com": "Akira",
  "whitefoxboutique.com": "White Fox",
  "stevemadden.com": "Steve Madden",
  "birdies.com": "Birdies",
  "dolcevita.com": "Dolce Vita",
  "hunterboots.com": "Hunter",
  "jwpei.com": "JW PEI",
  "baublebar.com": "BaubleBar",
  "ettika.com": "Ettika",
  "gorjana.com": "Gorjana",
  "lelesadoughi.com": "Lele Sadoughi",
};
// Some retailers publish names in ALL CAPS; store them in readable title case.
export const tidyName = (raw) => {
  const s = raw.replace(/\s+/g, " ").trim();
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[\s(/-])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bH2o\b/g, "H2O").replace(/\bPu\b/g, "PU").replace(/\b(In|And|Of|With|The)\b(?!$)/g, (w, _x, i) => (i === 0 ? w : w.toLowerCase()));
};
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh) MidnightProtocolCatalog/1.0 (student project)" };

export async function fetchLive(host, handle) {
  const res = await fetch(`https://${host}/products/${handle}.js`, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const p = await res.json();
  const optionNames = (p.options ?? []).map((o) => (typeof o === "string" ? o : o.name));
  const sizeIdx = optionNames.findIndex((o) => /size/i.test(o));
  const avail = p.variants.filter((v) => v.available);
  const sizes = sizeIdx < 0 ? ["One size"] : [...new Set(avail.map((v) => v[`option${sizeIdx + 1}`]).filter(Boolean))];
  let image = p.featured_image ?? p.images?.[0] ?? null;
  if (image?.startsWith("//")) image = `https:${image}`;
  if (image) image += image.includes("?") ? "&width=600" : "?width=600";
  return {
    host,
    handle,
    title: tidyName(p.title),
    price: avail.length ? Math.min(...avail.map((v) => v.price)) / 100 : p.price / 100,
    available: avail.length > 0,
    sizes: sizes.slice(0, 14),
    image,
    url: `https://${host}/products/${handle}`,
  };
}
