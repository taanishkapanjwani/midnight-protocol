// $59.99 stays $59.99; $79 stays $79 (no trailing .00).
export const money = (x: number) => `$${Number.isInteger(x) ? x.toLocaleString("en-US") : x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const niceDate = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// Retailer names in feeds are sometimes ALL CAPS; show them in title case.
export const titleCase = (s: string) => (s === s.toUpperCase() ? s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bH2o\b/g, "H2O") : s);
