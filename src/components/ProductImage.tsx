import { useState } from "react";
import type { CatalogItem } from "../../shared/types";
import { ItemArt } from "./Art";

// Retailer product photo with a graceful fallback to our own illustration if it fails to load.
export function ProductImage({ item, className = "", fit = "cover" }: { item: Pick<CatalogItem, "image" | "name" | "category" | "colorHex" | "heel" | "retailer">; className?: string; fit?: "cover" | "contain" }) {
  const [failed, setFailed] = useState(false);
  if (!item.image || failed) return <ItemArt item={item} className={`${className} p-3`} />;
  return (
    <img
      src={item.image}
      alt={`${item.name} from ${item.retailer}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} ${fit === "cover" ? "object-cover" : "object-contain"}`}
    />
  );
}
