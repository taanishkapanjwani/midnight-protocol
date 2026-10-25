// Builds data/catalog.json from the hand-curated list of REAL products (curation.mjs).
// Every product is verified against the retailer's live Shopify product endpoint at build time:
// name, price, stock, sizes, image and URL all come from the retailer - nothing is invented.
// Run: node data/shop/fetch-feeds.mjs   (only needed to resolve "host?title" keys)
//      node data/shop/build-catalog.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { CURATION } from "./curation.mjs";
import { fetchLive, RETAILER_NAMES } from "./verify.mjs";

const P = { c: "cinderella", b: "belle", a: "aurora", r: "rapunzel", s: "snowwhite", o: "ariel" };
const S = { m: "minimal", r: "romantic", d: "dramatic", v: "vintage", n: "modern" };
const W = { w: "warm", c: "cold", r: "rainy" };
const CODES = { dress: "D", top: "T", skirt: "S", trousers: "P", shoes: "H", bag: "B", jewelry: "J", outerwear: "O" };
// Occasions follow formality (documented rule): a 5 is for galas and weddings; a 1 is casual.
export const OCCASIONS_BY_FORMALITY = {
  5: ["gala", "wedding", "romantic"],
  4: ["gala", "wedding", "romantic", "birthday"],
  3: ["romantic", "birthday", "wedding", "garden", "college"],
  2: ["college", "garden", "casual", "birthday"],
  1: ["casual", "college", "garden"],
};
const SECTION = (i) => {
  const ix = CURATION.indexOf(i);
  const cut = (s) => CURATION.findIndex((r) => r[0].startsWith(s));
  if (ix < cut("us.princesspolly.com/kinnedie")) return "dress";
  if (ix < cut("us.princesspolly.com/sidori")) return "top";
  if (ix < cut("us.princesspolly.com/syrena")) return "skirt";
  if (ix < cut("dolcevita.com/brevel")) return "trousers";
  if (ix < cut("jwpei.com/abacus-faux-ostrich")) return "shoes";
  if (ix < cut("ettika.com/pearl-studded")) return "bag";
  if (ix < cut("us.princesspolly.com/eldora")) return "jewelry";
  return "outerwear";
};

const raw = existsSync(new URL("./raw.json", import.meta.url)) ? JSON.parse(readFileSync(new URL("./raw.json", import.meta.url), "utf8")).products : [];
function resolve(key) {
  if (key.includes("/")) {
    const [host, handle] = key.split("/");
    return { host, handle };
  }
  const [host, title] = key.split("?");
  const p = raw.find((x) => x.host === host && x.title.trim() === title.trim());
  if (!p) throw new Error(`Could not resolve "${key}" - run fetch-feeds.mjs first`);
  return { host, handle: p.handle };
}

const items = [];
const dropped = [];
const counters = {};
const checkedAt = new Date().toISOString().slice(0, 10);
for (const row of CURATION) {
  const [key, princesses, styles, formality, heel, weather, modest, colorName, colorHex] = row;
  const cat = SECTION(row);
  let live;
  try {
    const { host, handle } = resolve(key);
    live = await fetchLive(host, handle);
  } catch (e) {
    dropped.push(`${key}: ${e.message}`);
    continue;
  }
  if (!live.available) {
    dropped.push(`${key}: out of stock`);
    continue;
  }
  const n = (counters[cat] = (counters[cat] ?? 0) + 1);
  items.push({
    id: `RP-${CODES[cat]}${String(n).padStart(2, "0")}`,
    name: live.title,
    category: cat,
    price: live.price,
    color: colorName,
    colorHex,
    styleTags: [...styles].map((k) => S[k]),
    princessTags: [...princesses].map((k) => P[k]),
    occasions: OCCASIONS_BY_FORMALITY[formality],
    formality,
    heel: heel === "-" ? null : heel,
    walkable: cat !== "shoes" || heel !== "high",
    weather: [...weather].map((k) => W[k]),
    modest: Boolean(modest),
    available: true,
    sizes: live.sizes,
    image: live.image,
    retailer: RETAILER_NAMES[live.host] ?? live.host,
    url: live.url,
    checkedAt,
  });
  await new Promise((r) => setTimeout(r, 150)); // be polite to retailers
}

writeFileSync(
  new URL("../catalog.json", import.meta.url),
  JSON.stringify(
    {
      notice: `Real products from ${new Set(items.map((i) => i.retailer)).size} retailers, hand-curated and verified against each retailer's own product data on ${checkedAt}. Prices and stock change - the retailer's page is the source of truth. Purchases happen on the retailer's website.`,
      currency: "USD",
      checkedAt,
      items,
    },
    null,
    1,
  ),
);
const by = {};
for (const i of items) by[i.category] = (by[i.category] ?? 0) + 1;
console.log(`Wrote ${items.length} verified products`, by);
if (dropped.length) console.log(`Dropped ${dropped.length}:\n  ${dropped.join("\n  ")}`);
