# The Midnight Protocol 👑

**Your Fairytale. Your Wardrobe. Your Happily Ever After.**

A multi-agent AI stylist that builds a princess-inspired outfit from **real products sold by 14 real retailers**, within a real budget. Then it lets an adversarial agent throw a realistic problem at it (sold-out gown, rain, a 20-minute walk, a budget cut), repairs only what broke, and ends in **Shop the Royal Look**, where each piece links to its retailer's product page. Every price and rule is checked by code before the user sees it.

![The Midnight Protocol](docs/screenshots/01-landing.png)

**Live app: https://midnight-protocol-jm71.onrender.com**
(Hosted on Render's free plan. If it has been idle, the first visit takes about 30–60 seconds to wake up.)

---

## Run it locally (under 5 minutes)

Requirements: **Node.js 18.18 or newer** (check with `node -v`). Nothing else.

```bash
git clone <this-repo-url> midnight-protocol
cd midnight-protocol
npm install
npm start
```

Then open **http://localhost:8787**.

`npm start` builds the website and starts the server. The terminal prints which mode is running and which `.env` file was found.

### API key

The app looks for a `.env` file **in the repo folder first, then in the folder one level above it**. Only one key is needed:

```
PORTKEY_API_KEY=...        # Portkey gateway key, uses gpt-6-luna
```

`.env.example` lists every optional setting: model name, token prices, safety caps and port. If no key is found, the app still runs in a clearly labeled **Demo mode**. In demo mode, rule-based agents stand in for the AI, and the interface says so on every screen. Demo output is never presented as live AI.

### Other commands

| Command | What it does |
|---|---|
| `npm start` | Build and serve the app on port 8787 |
| `npm run dev` | Development mode with hot reload (web app on :5173, API on :8787) |
| `npm run eval` | **Royal Laboratory**: 20 scenarios, Royal Council vs single-agent baseline, writes `eval/results/latest.json` |
| `npm run eval -- --limit 5` | Quick evaluation on the first 5 scenarios |
| `npm run test:safety` | Runs the 8 safety-defense tests (no API key needed) |
| `npm run shop:refresh` | Re-checks every product's price, stock and sizes on the retailer's site and stamps today's date |
| `npm run shop:build` | Rebuilds the catalog from `data/shop/curation.mjs` (snapshots retailer feeds, then verifies each product live) |

Screenshots of every screen from a live run are in [`docs/screenshots/`](docs/screenshots/).

---

## How it works

```
User preferences ─► Fairy Godmother (LLM) ─► Royal Treasurer (code) ──► approved outfit
                         ▲                        │ rejects with itemized feedback
                         └──── revise (≤ 2) ──────┘   (≤ 2 revisions, then labeled fallback)

approved outfit ─► Wicked Stepmother (code) ─► crisis + new constraints
                                                     │
                     impact analysis (code): which pieces broke? what must be added?
                                                     ▼
                         Midnight Guardian (LLM) ─► validator (code) ─► rescued outfit
                                 ▲                       │ rejects (≤ 2 attempts)
                                 └───────────────────────┘  or honest "no feasible outfit"
```

| Agent | Type | Responsibility |
|---|---|---|
| **Fairy Godmother** | LLM (gpt-6-luna) | Interprets the princess aesthetic and preferences. Picks catalog IDs only from a deterministic shortlist. Returns JSON with reasons. |
| **Royal Treasurer** | Deterministic code | Prices, availability, budget math, dress code and comfort rules. Sends itemized feedback and cheaper alternatives to the Godmother. |
| **Wicked Stepmother** | Deterministic scenarios | 8 reproducible crises. Proposes the one that actually threatens *this* outfit, or picks a seeded random one. |
| **Midnight Guardian** | LLM + validator | Changes only the affected pieces (plus budget-forced swaps), keeps the aesthetic, explains the trade-offs, and refuses when no valid outfit exists. |

Agents pass **structured JSON** that is validated with `zod` schemas. The UI's "Council Chamber" streams the real server events (NDJSON) as they happen, so every status message is an actual workflow step.

### Why two agents are code, not LLMs

Budget arithmetic and availability are facts, not opinions. Keeping them in code makes them exact, free, instant and impossible to talk into a wrong answer. The language model handles only the creative, judgment-heavy parts: choosing pieces that look right together and explaining them.

---

## Shop the Royal Look

**Journey:** Choose Your Princess → Enter Preferences → Generate Outfit → Validate Budget → Resolve Fashion Crisis → **Shop the Royal Look**

- **Product cards.** Each card shows the retailer's photo, retailer name, recorded price, in-stock sizes (selectable) and the date they were checked. A **Shop at [Retailer]** button opens the real product page in a new tab.
- **Check stock & prices now.** This asks each retailer for current price and stock, and flags anything that's sold out or has changed price.
- **Find My Glass Slipper.** Suggests alternatives (most similar, cheaper, or easier to walk in) when a piece is sold out, unsuitable or over budget. Every suggestion is re-validated, so the whole outfit still passes budget, dress code, comfort and weather. **Swap in** updates the look, and the Treasurer re-checks the total.
- **Royal Checkout List.** Lists the outfit grouped by retailer with subtotals and the total recorded cost against your budget. You can copy it or download it as a CSV.
- **Budget guidance.** The invitation shows what the cheapest complete look actually costs from these retailers for your occasion and comfort needs.

## Midnight Survival Score (rubric)

Each outfit is scored 0–100 on four dimensions at three moments: before the crisis, at midnight, and after the rescue.

| Dimension | How it's computed | Type |
|---|---|---|
| Princess aesthetic | Per item: 1.0 if tagged for the princess *and* matches the preferred style; 0.85 if princess only; 0.6 if style only; 0.3 otherwise. Averaged. | Rule-based |
| Budget compliance | 100 if total ≤ budget; otherwise ≤ 60, scaled by budget ÷ total | Hard rule |
| Occasion suitability | Clothing and shoes: 1.0 if tagged for the occasion, else 0.4; −25 per dress-code violation | Rule-based |
| Practicality & comfort | Share of active comfort and weather checks passed (no heels, walkable, modest, rain or cold ready) | Hard rules |

**Hard constraints override everything.** An invalid ID, an unavailable item, going over budget, a missing role, the wrong dress code or a failed comfort or weather rule marks the outfit **FAIL** and caps the overall score at 49. The AI's own aesthetic ratings are shown separately and labeled as *AI opinion*.

---

## Safety defenses

| Risk | Defense | Proof |
|---|---|---|
| Prompt injection / data leaks | Free-text wardrobe notes are sanitized, scanned for instruction patterns and withheld if flagged. Notes are passed as delimited *untrusted data*. The API key stays on the server only. | `npm run test:safety`, Laboratory page |
| Invented products, prices or links | The LLM outputs only IDs. Names, prices, product links, photos and sizes come from the retailers' own product data, never from the model. Unknown IDs are rejected. | Same |
| Unsupported stock claims | Prices and stock are shown as **recorded on a date**. "Check stock & prices now" asks the retailer directly but is labeled as no inventory guarantee. Sold-out items are excluded by code. | Shop page, `npm run shop:refresh` |
| Wrong actions (over budget, sold out) | The deterministic validator gates every outfit, and a failure triggers revision or an honest refusal | Same |
| Fake success | The Guardian proves infeasibility with an exact cheapest-outfit calculation and shows "Even magic has its limits" | Same |
| Infinite loops / runaway spending | Max 6 LLM calls per request, ≤ 2 revisions per agent, 60 s timeout per call, daily spend cap (`DAILY_SPEND_CAP_USD`), per-IP rate limit | Same |
| Malformed output | `zod` schema validation, and the error is fed back for one retry | Ledger shows `Valid JSON: no` attempts |

---

## Tokenomics

Every LLM call is appended to `logs/usage.jsonl` with the **API-reported** `prompt_tokens`, `cached_tokens` and `completion_tokens`, plus latency and cost. The **Royal Treasury** page shows per-agent costs, cost per journey, per user per month, and projections for 100 and 10,000 users. Prices are configurable in `.env` (`PRICE_*`). Set them to your model's published prices; the page shows where the prices came from.

Cost-cutting built in:
- **Deterministic shortlist.** Code filters the 133-product catalog down to the 30–45 items that fit the user's rules, and the agent only sees those IDs.
- **Prompt caching.** Every agent call starts with the same fixed catalog message, so repeat calls are billed at the cached-input rate. In the live 20-scenario run, about 5,800 of 6,400 styling input tokens (91%) were cached. The Laboratory and Treasury pages show the measured counts. Turn it off with `PROMPT_CACHE=off` to compare.
- **Two of four agents cost nothing** because they're code.
- The Guardian sees **only candidates for the broken roles**.
- **Infeasible rescues are detected in code**, without spending an LLM call.

---

## Data

`data/catalog.json` holds **133 real products from 14 retailers**: Princess Polly, Petal & Pup, Hill House Home, Akira, White Fox, Steve Madden, Dolce Vita, Birdies, Hunter, JW PEI, BaubleBar, Ettika, Gorjana and Lele Sadoughi. They cover 8 categories: dresses, tops, skirts, trousers, shoes, bags, jewelry and outerwear.

**How it was built:**
1. `data/shop/fetch-feeds.mjs` snapshots each retailer's public Shopify product feed (13,000+ products).
2. I hand-picked products for each princess palette and occasion in `data/shop/curation.mjs`. That file holds only styling judgments: palette, style, formality, heel height, weather and modesty.
3. `data/shop/build-catalog.mjs` verifies every product against the retailer's live product data. Name, price, product URL, photo and in-stock sizes are copied from the retailer, never typed by hand, and each item gets the date it was checked. Out-of-stock items are dropped.

**What it does and doesn't claim:**
- **Prices and stock are recorded on a date, not live.** `npm run shop:refresh` re-checks them.
- **Purchases happen on the retailers' websites.**
- **This project is not affiliated with any retailer.**
- **Photos load from the retailers' own image servers,** with an illustrated fallback if one fails.

**Small test dataset:** to try the app without network access to retailer images, it still works; cards fall back to illustrations. To swap catalogs, replace `data/catalog.json` with a file using the same fields.

## Project structure

```
server/           Express API, agents, rules engine, LLM client, ledger, safety, shop (alternatives, live stock check)
  agents/         godmother.ts · treasurer.ts · stepmother.ts · guardian.ts · baseline.ts
  rules.ts        validation, survival score, exact solver
  crises.ts       the 8 reproducible crises
  orchestrator.ts the Royal Council workflow
shared/           zod schemas, types, princess definitions (used by server + UI)
src/              React + TypeScript + Tailwind + Framer Motion UI
data/             real-product catalog + data/shop/ build, curation and refresh scripts
eval/             scenarios.json, run.ts (Royal Laboratory), safety.test.ts, results/
```

## Limitations

- **Recorded prices, not a live feed.** Prices and stock are recorded snapshots. There's no partner retailer API or affiliate integration, so checkout happens on each retailer's site.
- **Hand-labeled styling attributes.** Formality and other styling attributes were assigned by hand from product names and photos.
- **Sizes aren't a styling constraint.** In-stock sizes are shown and selectable in the shop, but agents don't style by size yet.
- Aesthetic scoring is rule-based (tags). It doesn't judge real visual harmony.
- Crises are predefined, not open-ended.

## Accessibility

Keyboard navigable, semantic roles and labels, visible focus rings, `prefers-reduced-motion` respected (animations off), color is never the only signal, and layouts are tested from 320 px phones to 1536 px desktops (two independent responsive audits). Add `?instant` to the URL to turn off animations for testing.
