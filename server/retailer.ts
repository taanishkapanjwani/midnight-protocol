// Live product checks against the retailer's public Shopify product data (/products/<handle>.js).
// Used for "Check stock now" in Shop the Royal Look. Results are cached briefly to be polite.
export interface LiveStatus {
  id: string;
  price: number | null;
  available: boolean;
  sizes: string[];
  checkedAt: string; // ISO timestamp
  error?: string;
}

const cache = new Map<string, { at: number; value: Omit<LiveStatus, "id"> }>();
const TTL_MS = 10 * 60 * 1000;

export async function checkLive(id: string, url: string): Promise<LiveStatus> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return { id, ...hit.value };
  try {
    const res = await fetch(`${url}.js`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh) MidnightProtocol/1.0 (student project)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`retailer returned HTTP ${res.status}`);
    const p = await res.json();
    const names: string[] = (p.options ?? []).map((o: unknown) => (typeof o === "string" ? o : (o as { name: string }).name));
    const sizeIdx = names.findIndex((n) => /size/i.test(n));
    const avail = (p.variants ?? []).filter((v: { available: boolean }) => v.available);
    const value = {
      price: avail.length ? Math.min(...avail.map((v: { price: number }) => v.price)) / 100 : null,
      available: avail.length > 0,
      sizes: sizeIdx < 0 ? (avail.length ? ["One size"] : []) : [...new Set<string>(avail.map((v: Record<string, string>) => v[`option${sizeIdx + 1}`]).filter(Boolean))],
      checkedAt: new Date().toISOString(),
    };
    cache.set(url, { at: Date.now(), value });
    return { id, ...value };
  } catch (e) {
    return { id, price: null, available: false, sizes: [], checkedAt: new Date().toISOString(), error: (e as Error).message };
  }
}
