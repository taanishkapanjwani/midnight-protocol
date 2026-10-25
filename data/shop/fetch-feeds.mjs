// Snapshot public Shopify product feeds from real retailers (no invented data).
// Run: node data/shop/fetch-feeds.mjs   -> writes data/shop/raw.json (gitignored)
import { writeFileSync } from "node:fs";

export const RETAILERS = {
  "us.princesspolly.com": "Princess Polly",
  "petalandpup.com": "Petal & Pup",
  "selkiecollection.com": "Selkie",
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
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh) MidnightProtocolCatalog/1.0 (student project)" };

const out = [];
for (const [host, retailer] of Object.entries(RETAILERS)) {
  let count = 0;
  for (let page = 1; page <= 4; page++) {
    const res = await fetch(`https://${host}/products.json?limit=250&page=${page}`, { headers: UA, signal: AbortSignal.timeout(20000) });
    if (!res.ok) break;
    const { products } = await res.json();
    if (!products?.length) break;
    for (const p of products) {
      out.push({
        host, retailer, handle: p.handle, title: p.title, type: p.product_type, tags: p.tags,
        url: `https://${host}/products/${p.handle}`,
        image: p.images?.[0]?.src ?? null,
        options: p.options?.map((o) => o.name),
        variants: p.variants.map((v) => ({ title: v.title, price: Number(v.price), available: v.available, o1: v.option1, o2: v.option2 })),
      });
      count++;
    }
    await new Promise((r) => setTimeout(r, 400)); // be polite
  }
  console.log(retailer.padEnd(16), count);
}
writeFileSync(new URL("./raw.json", import.meta.url), JSON.stringify({ fetchedAt: new Date().toISOString(), products: out }));
console.log("total", out.length);
