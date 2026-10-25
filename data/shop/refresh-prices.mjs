// Re-verifies every product in data/catalog.json against the retailer's live product data.
// Updates price, stock and sizes, and stamps today's date. Sold-out items are kept but marked
// unavailable, so the agents cannot recommend them and "Find My Glass Slipper" offers alternatives.
// Run: npm run shop:refresh
import { readFileSync, writeFileSync } from "node:fs";
import { fetchLive } from "./verify.mjs";

const file = new URL("../catalog.json", import.meta.url);
const catalog = JSON.parse(readFileSync(file, "utf8"));
const today = new Date().toISOString().slice(0, 10);
let changed = 0;
let soldOut = 0;
for (const item of catalog.items) {
  const { host, pathname } = new URL(item.url);
  const handle = pathname.split("/products/")[1];
  try {
    const live = await fetchLive(host, handle);
    if (live.price !== item.price || live.available !== item.available) changed++;
    if (!live.available) soldOut++;
    Object.assign(item, { price: live.price, available: live.available, sizes: live.available ? live.sizes : [], image: live.image ?? item.image, checkedAt: today });
  } catch (e) {
    item.available = false;
    item.checkedAt = today;
    soldOut++;
    console.log(`  ${item.id} ${item.name}: ${e.message} - marked unavailable`);
  }
  await new Promise((r) => setTimeout(r, 150));
}
catalog.checkedAt = today;
catalog.notice = catalog.notice.replace(/on \d{4}-\d{2}-\d{2}/, `on ${today}`);
writeFileSync(file, JSON.stringify(catalog, null, 1));
console.log(`Re-verified ${catalog.items.length} products on ${today}: ${changed} changed, ${soldOut} unavailable.`);
