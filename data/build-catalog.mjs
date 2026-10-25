// Generates data/catalog.json from the compact table below.
// Run: node data/build-catalog.mjs
// All products are DEMONSTRATION items with illustrative prices; they are not sold by any real retailer.
import { writeFileSync } from "node:fs";

const P = { c: "cinderella", b: "belle", a: "aurora", r: "rapunzel", s: "snowwhite", o: "ariel" };
const O = { G: "gala", C: "college", R: "romantic", W: "wedding", B: "birthday", P: "garden", X: "casual" };
const S = { m: "minimal", r: "romantic", d: "dramatic", v: "vintage", n: "modern" };
const W = { w: "warm", c: "cold", r: "rainy" };
const CAT = { D: "dress", T: "top", S: "skirt", P: "trousers", H: "shoes", B: "bag", J: "jewelry", O: "outerwear" };

// code | name | price | color | hex | styles | princesses | occasions | formality | heel | walkable | weather | modest | available
const rows = `
D01|Moonlit Satin Slip Gown|68|Powder blue|#AFC8E0|mr|c|GWR|4|-|1|w|0|1
D02|Glass Ballroom Midi Dress|54|Pearl white|#F3EEE6|rn|co|WRBG|4|-|1|w|1|1
D03|Silver Mist Tulle Gown|96|Silver|#C9CDD3|dr|ca|GW|5|-|1|w|1|1
D04|Library Gold Tea Dress|46|Champagne|#EED9A0|vr|b|PRBCW|3|-|1|w|1|1
D05|Ballroom Gold Off-Shoulder Gown|88|Warm gold|#D4B26A|dv|b|GW|5|-|1|w|0|1
D06|Rose Tulle Ballet Midi|58|Dusty pink|#D9A5B3|r|a|BWPRG|4|-|1|w|1|1
D07|Blush Ribbon-Strap Mini|38|Blush|#F4DCE4|rn|a|BCXR|2|-|1|w|0|1
D08|Lilac Floral Wrap Dress|42|Lilac|#DCCDEA|r|r|PBCXW|2|-|1|w|1|1
D09|Lavender Pleated Maxi|64|Lavender|#C3B1DA|rd|r|WGRP|4|-|1|w|1|1
D10|Ruby Velvet Fit-and-Flare|62|Ruby red|#9E2B3A|vd|s|GRWB|4|-|1|wc|1|1
D11|Navy Collared Shirt Dress|44|Navy|#283A5E|vm|s|CXBP|2|-|1|wc|1|1
D12|Seafoam Bias-Cut Slip|52|Seafoam|#A9D8C8|mn|o|RWB|3|-|1|w|0|1
D13|Turquoise Draped Column Gown|92|Turquoise|#4FA7A5|dn|o|GW|5|-|1|w|1|1
D14|Ivory Corset Midi|74|Ivory|#FFF5EC|vr|sbc|GWR|4|-|1|w|0|1
D15|Champagne Pleated Midi|36|Champagne|#E9D6AE|m|ba|WBPRC|3|-|1|w|1|1
D16|Pearl Knit Day Dress|29|Pearl|#EDE6DD|mn|cob|XCP|1|-|1|wc|1|1
D17|Midnight Blue Velvet Gown|118|Midnight blue|#2E3A66|d|cs|G|5|-|1|wc|1|1
D18|Sea-Glass Smocked Sundress|34|Sea glass|#BFE3D8|rn|or|PXBC|2|-|1|w|1|1
D19|Blush Satin Cocktail Dress|48|Blush rose|#E7B9C6|rd|ac|RBWG|4|-|1|w|1|0
T01|Pearl-Button Cardigan|28|Pearl|#EFE7DC|vm|cbs|CXPB|2|-|1|wc|1|1
T02|Puff-Sleeve Blouse|26|Blush|#F4DCE4|r|ar|CXBPR|2|-|1|w|1|1
T03|Ballet Wrap Top|24|Dusty pink|#D9A5B3|rn|a|XCB|1|-|1|w|1|1
T05|Ruby Bow Blouse|32|Ruby red|#9E2B3A|v|s|CRBX|3|-|1|wc|1|1
T06|Lilac Embroidered Peasant Top|27|Lilac|#DCCDEA|r|r|XPC|1|-|1|w|1|1
T07|Seafoam Silk Shell|30|Seafoam|#A9D8C8|mn|o|RCBW|3|-|1|w|1|1
T09|Powder-Blue Satin Blouse|34|Powder blue|#AFC8E0|mr|c|RWBC|3|-|1|w|1|1
S01|Tulle Ballet Midi Skirt|36|Blush|#F4DCE4|r|ac|BPRWC|3|-|1|w|1|1
S02|Champagne Satin Midi Skirt|34|Champagne|#E9D6AE|mr|bc|RWBG|4|-|1|w|1|1
S03|Pleated Navy Skirt|30|Navy|#283A5E|v|s|CXB|2|-|1|wc|1|1
S04|Floral Lilac Midi Skirt|32|Lilac|#DCCDEA|r|r|PBXC|2|-|1|w|1|1
S05|Seafoam Satin Slip Skirt|38|Seafoam|#A9D8C8|mn|o|RWB|3|-|1|w|1|1
S06|Ruby Velvet Midi Skirt|40|Ruby red|#9E2B3A|vd|s|GRB|4|-|1|wc|1|1
P01|Ivory Wide-Leg Trousers|44|Ivory|#FBF3EA|mn|cob|CXRB|3|-|1|wc|1|1
P02|Camel Tailored Trousers|39|Camel|#C8A27A|vm|bs|CX|2|-|1|c|1|1
P03|Navy Sailor Trousers|36|Navy|#283A5E|vn|so|CXP|2|-|1|wc|1|1
H01|Crystal Glass Heels|64|Silver crystal|#DDE3EA|dr|c|GWR|5|high|0|w|1|1
H02|Silver Ballet Flats|29|Silver|#C9CDD3|mr|ca|WRBCXP|3|flat|1|w|1|1
H03|Pearl-Embellished Ballet Flats|38|Pearl|#F3EEE6|rv|caob|GWRBP|4|flat|1|w|1|1
H04|Blush Satin Pointe-Style Flats|34|Blush|#F4DCE4|r|a|BWRPC|3|flat|1|w|1|1
H05|Rose Kitten Heels|42|Rose|#D9A5B3|rv|ab|WRGB|4|low|1|w|1|1
H06|Gold Block-Heel Mary Janes|46|Gold|#C6A66B|v|bs|WRGBC|4|low|1|wc|1|1
H07|Gold Strappy Stilettos|58|Gold|#C6A66B|d|b|GRW|5|high|0|w|1|1
H08|Lilac Embroidered Espadrilles|32|Lilac|#DCCDEA|r|r|PXCB|2|flat|1|w|1|1
H09|Ruby Patent Mary Janes|44|Ruby red|#9E2B3A|v|s|GRWBC|4|low|1|wc|1|1
H10|Navy Pointed Pumps|52|Navy|#283A5E|mv|s|GWR|5|high|0|wc|1|1
H11|Seafoam Strappy Sandals|36|Seafoam|#A9D8C8|n|o|WRBP|3|flat|1|w|1|1
H12|Pearl Strap Heeled Sandals|49|Pearl|#F3EEE6|dn|oc|GWR|5|high|0|w|1|1
H13|Ivory Leather Ankle Boots|58|Ivory|#EFE4D6|mv|sb|CXBPR|2|low|1|cr|1|1
H14|Blush Rain-Ready Ballet Loafers|44|Blush|#F4DCE4|mn|acr|CXBPWR|3|flat|1|wcr|1|1
H16|Pearl Satin Weatherproof Flats|56|Pearl|#F3EEE6|rd|caob|GWRB|4|flat|1|wcr|1|1
H17|Navy Velvet Block-Heel Boots|68|Navy|#283A5E|vd|s|GRWB|4|low|1|cr|1|1
B01|Ivory Pearl Mini Bag|19|Ivory|#FFF5EC|rm|cabo|GCRWBPX|4|-|1|wcr|1|1
B02|Silver Crystal Clutch|34|Silver|#C9CDD3|d|c|GWR|5|-|1|wcr|1|1
B03|Gold Book Clutch|28|Gold|#C6A66B|vd|b|GWRB|4|-|1|wcr|1|1
B04|Blush Bow Shoulder Bag|26|Blush|#F4DCE4|r|a|BCRPXW|3|-|1|wcr|1|1
B05|Lilac Woven Basket Bag|24|Lilac|#DCCDEA|r|r|PXC|1|-|1|wcr|1|1
B06|Ruby Structured Top-Handle Bag|38|Ruby red|#9E2B3A|v|s|GRWBC|4|-|1|wcr|1|1
B07|Seashell Pearl Clutch|32|Pearl|#EAF2F0|nd|o|GWRB|4|-|1|wcr|1|1
B09|Satin Ribbon Wristlet|16|Blush|#F4DCE4|rm|acr|BWRCP|3|-|1|wcr|1|1
B10|Gilded Mirror Minaudiere|72|Gold|#C6A66B|d|cb|G|5|-|1|wcr|1|0
J01|Pearl Drop Earrings|12|Pearl|#F3EEE6|mr|caob|GCRWBPX|4|-|1|wcr|1|1
J02|Crystal Tiara Headband|24|Crystal|#DDE3EA|dr|ca|GWB|5|-|1|wcr|1|1
J03|Gold Rose Pendant|22|Gold|#C6A66B|rv|ba|RBWPG|3|-|1|wcr|1|1
J04|Lilac Flower Hair Clips|10|Lilac|#DCCDEA|r|r|PBCX|1|-|1|wcr|1|1
J05|Ruby Crystal Studs|18|Ruby red|#9E2B3A|v|s|GRWB|4|-|1|wcr|1|1
J06|Seafoam Shell Necklace|16|Seafoam|#A9D8C8|n|o|PXBR|2|-|1|wcr|1|1
J07|Blush Satin Hair Bow|9|Blush|#F4DCE4|r|ac|BCPXR|2|-|1|wcr|1|1
J08|Antique Gold Locket|28|Gold|#C6A66B|v|bs|RWGB|4|-|1|wcr|1|1
J09|Pearl Collar Necklace|34|Pearl|#F3EEE6|dv|cos|GWR|5|-|1|wcr|1|1
J10|Iridescent Pearl Hair Comb|14|Iridescent|#EAF2F0|rn|oc|WGRB|4|-|1|wcr|1|1
O01|Powder-Blue Wool Cape|72|Powder blue|#AFC8E0|dv|c|GWR|5|-|1|c|1|1
O02|Ivory Water-Resistant Satin Trench|68|Ivory|#FBF3EA|mn|cboa|CXRBWG|4|-|1|wcr|1|1
O03|Blush Cropped Cardigan|28|Blush|#F4DCE4|r|a|CXBP|2|-|1|c|1|1
O04|Camel Wool Coat|84|Camel|#C8A27A|mv|b|CXRGW|4|-|1|c|1|1
O05|Lilac Clear Rain Cape|26|Lilac|#DCCDEA|nr|ra|XCPBW|2|-|1|r|1|1
O06|Navy Double-Breasted Coat|78|Navy|#283A5E|v|s|GRWC|4|-|1|cr|1|1
O07|Seafoam Light Trench|48|Seafoam|#A9D8C8|n|o|XCRBP|3|-|1|wr|1|1
O08|Ivory Faux-Fur Stole|38|Ivory|#FFF5EC|d|cbso|GWR|5|-|1|c|1|1
O09|Pearl-Button Velvet Bolero|42|Dusty rose|#B98598|vr|sbc|GWR|4|-|1|c|1|1
`;

const SIZES = { dress: ["XS", "S", "M", "L", "XL"], top: ["XS", "S", "M", "L", "XL"], skirt: ["XS", "S", "M", "L", "XL"], trousers: ["XS", "S", "M", "L", "XL"], outerwear: ["S", "M", "L"], shoes: ["6", "7", "8", "9", "10"], bag: ["One size"], jewelry: ["One size"] };

const items = rows
  .trim()
  .split("\n")
  .map((line) => {
    const [code, name, price, color, hex, st, pr, oc, f, heel, walk, weather, modest, avail] = line.split("|");
    const category = CAT[code[0]];
    return {
      id: `MP-${code}`,
      name,
      category,
      price: Number(price),
      color,
      colorHex: hex,
      styleTags: [...st].map((k) => S[k]),
      princessTags: [...pr].map((k) => P[k]),
      occasions: [...oc].map((k) => O[k]),
      formality: Number(f),
      heel: heel === "-" ? null : heel,
      walkable: walk === "1",
      weather: [...weather].map((k) => W[k]),
      modest: modest === "1",
      available: avail === "1",
      sizes: SIZES[category],
      image: null,
    };
  });

const out = {
  notice: "Demonstration catalog for The Midnight Protocol. Products and prices are illustrative and not offered by any real retailer.",
  currency: "USD",
  items,
};
writeFileSync(new URL("./catalog.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(`Wrote ${items.length} items`);
