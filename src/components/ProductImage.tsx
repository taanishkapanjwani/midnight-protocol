import { useState } from "react";
import type { CatalogItem } from "../../shared/types";
import { ItemArt } from "./Art";

// Retailer product photo. While it loads (slow phone connections), a soft illustrated placeholder
// shows instead of an empty white box; if the photo fails, the illustration stays.
export function ProductImage({ item, className = "", fit = "cover" }: { item: Pick<CatalogItem, "image" | "name" | "category" | "colorHex" | "heel" | "retailer">; className?: string; fit?: "cover" | "contain" }) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">(item.image ? "loading" : "failed");
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: "radial-gradient(circle at 50% 35%, #fff, var(--accent-soft))" }}>
      {state !== "loaded" && <ItemArt item={item} className={`absolute inset-0 m-auto h-full w-full p-4 ${state === "loading" ? "animate-pulse opacity-60" : ""}`} />}
      {item.image && state !== "failed" && (
        <img
          src={item.image}
          alt={`${item.name} from ${item.retailer}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setState("loaded")}
          onError={() => setState("failed")}
          className={`absolute inset-0 h-full w-full bg-white transition-opacity duration-500 ${state === "loaded" ? "opacity-100" : "opacity-0"} ${fit === "cover" ? "object-cover" : "object-contain"}`}
        />
      )}
    </div>
  );
}
