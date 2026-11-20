# Black Friday launch plan (joinswarm.ai)

> **Dropped on November 20, 2026.** Jesus: "Pricing is to be decided so leave it blank for now, put the newsletter there instead ur email", then "Drop it, no prices: remove every price and the Black Friday bar, buttons and share image. Buttons point to the newsletter signup instead." The sale never went live (main still shows the old founding offer). The page now has no prices, no Black Friday bar and no checkout; every gold button and the nav button go to the Swarm updates sign-up on Keychain (https://keychain.club/jesusmartinez/GETSWARMUPDATES). The build's Black Friday checks, the `?bf` / `?bfnow` previews and their noindex header are removed, and `black-friday/ship-ended.mjs` no longer applies (do not run it). The share image is archived in `black-friday/` and no longer published. What changed: `a-core-glow/NOTES.md`, "No pricing, Keychain updates". The plan below is kept as a record only.

Written November 19, 2026 (UTC 22:20) by the lead designer pass. Nothing on the live site or in `public/swarm-site/` was changed. This file is the build spec; the lab files it names are edited by the build session, then `node scripts/build-swarm-site.mjs` is run.

Read before writing this: `a-core-glow/index.html`, `page.js`, `core-glow.css`, `terms.html`, `refunds.html`, `privacy.html`, `404.html`, `swarm-site/*`, `scripts/build-swarm-site.mjs`, `next.config.ts`, `SWARM-BRIEF.md`, `ANTI-SLOP.md`, `docs/swarm-brand.md`, `LAUNCH-CHECKLIST.md`, `SEO-PLAN.md` (1.2, 1.14), `RESEARCH-NOTES.md` (Whop), and the live page at https://www.joinswarm.ai measured in Chrome at 1440x900, 1024x768 and 390x844.

Files made for this plan, all in `design-lab/landing/black-friday/` (lab only, nothing served):

| File | What it is |
| --- | --- |
| `swarm-og-black-friday-1200x630.png` | The Black Friday share image, rendered from HTML in Chrome with the kit fonts. |
| `share-og.html`, `render.mjs` | Its source and the render script (`node design-lab/landing/black-friday/render.mjs`). |
| `card-mock.html`, `mock-shots.mjs` | A static layout mock of the top bar and the rebuilt pricing card in all three states, used to prove the height targets. Open with `?bf=teaser`, `?bf=sale` or `?bf=ended`. |
| `shots/` | Mock screenshots: `mock-sale-1440.png`, `mock-sale-1024.png`, `mock-sale-390.png`, `mock-teaser-1440.png`, `mock-teaser-390.png`, `mock-ended-1440.png`, `mock-ended-390.png`, `mock-bar-1440.png`, `mock-bar-1024.png`, `mock-bar-390.png`. |

## 0. The decisions this builds on, and one date problem

Jesus's message: "were gonna launch at this 49.99 price only for the black friday holidays, maybe a week or two?" The workflow brief turns that into these working decisions, which this plan follows:

- $49.99 a month. Anyone who joins during the window keeps $49.99 a month for as long as they stay subscribed; cancel and rejoin later and you pay the price at that time.
- The 50 founding seats are gone. The deadline is the only limit. No seat counts anywhere.
- After the window: Standard $99 a month, Yearly $990 a year. Yearly's tag is "2 months free vs Standard".
- Everything else in `SWARM-BRIEF.md` still holds (tools in development, prices rise as they are completed, weekly calls with no day or time, Discord, at most six FAQs, no martinezaccess.com, no pause buttons, motion settles within 5 s, contact JMCrypto@wealthgardenent.com).

**The date problem (open question 1, blocking the copy).** The brief says the window "starts Monday November 24, 2026" and "ends Monday December 1, 2026", and that "Cyber Monday is December 1". In 2026 those weekdays are wrong:

| Date (2026) | Weekday | Note |
| --- | --- | --- |
| November 19 | Thursday | Today (the brief says Wednesday). |
| November 23 | Monday | |
| November 24 | Tuesday | The brief's start date. |
| November 26 | Thursday | Thanksgiving (fourth Thursday). |
| November 27 | Friday | Black Friday. Correct in the brief. |
| November 30 | Monday | Cyber Monday 2026. |
| December 1 | Tuesday | The brief's end date. |

This plan keeps the exact UTC instants the brief gives (start 2026-11-24T05:00:00Z, end 2026-12-02T04:59:59Z, which are Nov 24 12:00 AM ET and Dec 1 11:59 PM ET; DST ended November 1, so ET is UTC-5 for the whole window) and **prints no weekday names anywhere**, so every line on the page is true for those instants. If Jesus meant Monday to Cyber Monday instead (Nov 23 to Nov 30), only the two constants in section 1 and the date strings in section 2 change; the layout does not. His own words were "maybe a week or two", so the length is his call too.

## 1. The three states and how JavaScript switches them

### Instants

| Name | UTC | Eastern Time | Meaning |
| --- | --- | --- | --- |
| `BF_START` | 2026-11-24T05:00:00Z | Nov 24, 12:00 AM ET | Sale starts (inclusive). |
| last sale second | 2026-12-02T04:59:59Z | Dec 1, 11:59:59 PM ET | Still the sale. |
| `BF_END` (exclusive) | 2026-12-02T05:00:00Z | Dec 2, 12:00 AM ET | First moment of ENDED. Code compares `now < BF_END`, so all of 04:59:59Z counts as the sale. |

States, decided on the visitor's clock:

- **TEASER**: `now < BF_START`. Announces the window and the price. Nothing can be bought.
- **SALE**: `BF_START <= now < BF_END`. $49.99 a month, $99 struck through and muted, the deadline in plain words, one countdown (top bar only).
- **ENDED**: `now >= BF_END`. Standard $99/mo and Yearly $990/yr, no countdown, one plain line that the Black Friday price ended December 1, nothing that says $49.99 is available.

### Where the decision runs

The head already has one inline script (it sets `js`, `reduce`, `frozen` and `window.SWARM`). Extend it, so the state is on `<html>` before the first paint and nothing jumps:

```js
// Black Friday: state from the visitor's clock against fixed UTC instants. Review overrides: ?bf=teaser|sale|ended
// forces a state; ?bfnow=<ISO time> fakes the clock (state and countdown). Either one marks the page as a preview.
var BF_START = Date.parse('2026-11-24T05:00:00Z'), BF_END = Date.parse('2026-12-02T05:00:00Z'); // END is exclusive
var bfo = q.get('bf'), bfn = q.has('bfnow') ? Date.parse(q.get('bfnow')) : NaN;
var now = isNaN(bfn) ? Date.now() : bfn;
var bf = /^(teaser|sale|ended)$/.test(bfo) ? bfo : now < BF_START ? 'teaser' : now < BF_END ? 'sale' : 'ended';
var bfPreview = !!bfo || !isNaN(bfn);
d.setAttribute('data-bf', bf);
try { if (localStorage.getItem('swarm-bf-bar-' + bf) === 'off') d.classList.add('bf-bar-off'); } catch (e) {}
if (bfPreview) { var nm = document.createElement('meta'); nm.name = 'robots'; nm.content = 'noindex'; document.head.appendChild(nm); }
// added to the existing window.SWARM object:
//   bf: { state: bf, start: BF_START, end: BF_END, now: isNaN(bfn) ? null : bfn, preview: bfPreview },
//   bfApply: function (root) { ...see "Text swaps" below... }
```

The two date constants live only here. `page.js` reads them from `window.SWARM.bf`.

### The preview override

- `?bf=teaser`, `?bf=sale`, `?bf=ended` force a state for review and screenshots. `?bfnow=2026-11-28T15:00:00Z` sets the clock (useful for exact countdown captures). Both compose with the existing `?reduce=1`, `?t=` and `?lock=`.
- Never the default: with no parameter the clock decides.
- Never indexed: the canonical already points to `https://www.joinswarm.ai/` without a query, the head script adds `<meta name="robots" content="noindex">` when either parameter is present, and the analytics `beforeSend` already strips the query. Never link a `?bf=` URL anywhere public.
- Preview never sells: when `SWARM.bf.preview` is true, the card shows its checkout state but the gold button's `href` stays `#join` and the line under it reads "Preview: checkout is off." So a preview link can never start a real purchase before the window.

### No-JS default (crawlers and visitors without JavaScript)

The static HTML is the SALE text with the static deadline. It is safe during the teaser too, because every SALE line carries its dates ("Nov 24 to Dec 1", "Ends Dec 1, 11:59 PM ET"). Without JS the bar has no countdown (the element is empty), the Hide button is not shown (`html:not(.js) .bf-x { display: none }`), and the card's button keeps `href="#join"` with a `<noscript>` line under it: "Checkout runs on Whop and needs JavaScript." (Whop's own checkout needs JavaScript, so this is honest, not a dead end.)

### Text swaps (no flash, no layout shift)

- Every element whose text differs by state holds the SALE text as its content and the other states' text in `data-bf-teaser` and `data-bf-ended` attributes (plain text; crawlers do not index attribute values).
- `SWARM.bfApply(root)` replaces the text of `root` and its descendants that carry `data-bf-<state>` for the current state, and marks them done. It runs:
  1. in an inline `<script>SWARM.bfApply(document.getElementById('bf-bar'))</script>` right after the bar,
  2. in an inline `<script>SWARM.bfApply(document.querySelector('.hero-copy'))</script>` right after the hero copy (chips, button label, line under it),
  3. from `page.js` for the rest of the page (below the first screen, so no visible swap).
  Inline scripts run before the parser continues, so the first screen is painted in the right state.
- The pricing card is rendered by `page.js` from the `PLANS` and `OFFER` tables (section 5), not from attributes.
- CSS hides what a state does not use: `html[data-bf="ended"] .bf-bar { display: none }`, `html[data-bf="teaser"] .bf-cd { display: none }`, `html.bf-bar-off .bf-bar { display: none }`.

### Flipping while the page is open

`page.js` sets one timeout to the next boundary (`BF_START` in TEASER, `BF_END` in SALE; both under the 24.8-day `setTimeout` limit from today). At the boundary it sets `data-bf` again, runs `bfApply(document)`, re-renders the card, and starts or stops the countdown. No reload.

### The Dec 2 rebuild (static parts)

JavaScript cannot change what crawlers and share cards read: the meta description, og and twitter tags, JSON-LD and the static HTML text. So the morning of December 2 (ET) a prepared "ended" change ships: static ENDED text, Black Friday layer removed (bar, attributes, sale plan in `PLANS`), og:image back to the brand image, meta description and JSON-LD to the ENDED text in section 8. Prepare it on a branch during the sale. Guard: `index.html` gets `data-bf-default="sale"` on `<html>`, and the build fails when it runs at or after `BF_END` with that attribute still present (section 10), so a forgotten switch cannot ship again.

## 2. Every place the offer appears, with the new text

Dates follow section 0 (no weekday names). "Same" means the SALE text stays. Current text is quoted from the lab copy.

### Head (`a-core-glow/index.html`)

| # | Where | Now | SALE (static, also TEASER) | ENDED (Dec 2 rebuild) |
| --- | --- | --- | --- | --- |
| H1 | `<title>` | Swarm: AI Crypto Trading Community by JM Crypto | Same (no change helps enough to touch the ranking title) | Same |
| H2 | `meta name="description"` | ...weekly live calls. Founding seats $49/mo. | Swarm is an AI crypto trading community on Discord by Jesus Martinez of JM Crypto: custom AI tools, his watch list, weekly live calls. Black Friday: $49.99/mo. (159 characters) | Swarm is an AI crypto trading community on Discord by Jesus Martinez of JM Crypto: custom AI tools, his watch list, weekly live calls. $99/mo or $990/yr. (153) |
| H3 | `og:title` | Swarm: AI Crypto Trading Community | Same | Same |
| H4 | `og:description` | ...I want to get you there in one. Pre-launch, 50 founding seats. | Most people need three cycles and a lot of pain to get there. I want to get you there in one. Black Friday launch: $49.99/mo locked in, Nov 24 to Dec 1. (152) | Most people need three cycles and a lot of pain to get there. I want to get you there in one. Custom AI tools, my watch list and weekly live calls, on Discord. (159) |
| H5 | `twitter:title`, `twitter:description` | Not present (X falls back to og) | Not added; X shows only the image and domain on link cards | Same |
| H6 | `og:image`, `twitter:image` | `https://www.joinswarm.ai/brand/swarm/social/swarm-og-1200x630.png` | `https://www.joinswarm.ai/swarm-site/img/swarm-og-black-friday-1200x630.png` | Back to the brand image |
| H7 | `og:image:alt`, `twitter:image:alt` | The Swarm wordmark and the words AI crypto trading beside one glowing gold hexagon in a dark honeycomb | Swarm Black Friday launch: $49.99 a month, locked in for as long as you stay subscribed, November 24 to December 1. One glowing gold hexagon in a dark honeycomb. | Back to the current alt |
| H8 | `<html>` | `lang="en"` | add `data-bf-default="sale"` (build guard) | remove it |

### Structured data (`swarm-site/structured-data.json`)

| # | Field | SALE | ENDED |
| --- | --- | --- | --- |
| J1 | WebPage `description` | Exactly H2 SALE (the build fails on any difference) | Exactly H2 ENDED |
| J2 | WebPage `name` | Unchanged (matches the title) | Unchanged |
| J3 | Organization `description`, `image` | Unchanged (no price; keep the brand image on the organization) | Unchanged |
| J4 | Offer or Service node | Do not add during the sale: a dated price in static JSON-LD outlives the window and would need `priceValidUntil`; the build already bans Product, Review and AggregateRating. Revisit after Dec 2 with SEO-PLAN 1.14's Service node minus the Founding offer. | Optional then |

### Top bar (new, section 3 has the spec)

| # | Element | SALE | TEASER | ENDED |
| --- | --- | --- | --- | --- |
| B1 | Bar text | Black Friday launch · $49.99/mo locked in · Ends Dec 1, 11:59 PM ET | Black Friday launch · $49.99/mo locked in · Checkout opens Nov 24, 12:00 AM ET | Bar not shown |
| B2 | Countdown | e.g. "4d 23h 41m left" (minute steps) | Not shown | Not shown |
| B3 | Link | See the price | See the price | Not shown |
| B4 | Hide button label (screen readers) | Hide the Black Friday bar | Same | Not shown |

### Nav and hero

| # | Where | Now | SALE | TEASER | ENDED |
| --- | --- | --- | --- | --- | --- |
| N1 | Nav `.btn-line` | Join Swarm (href `#join`) | Join Swarm (href `#join`, now the card) | See the price | Join Swarm |
| C1 | Hero chip 1 | Pre-launch | Black Friday | Opens Nov 24 | Weekly live calls |
| C2 | Hero chip 2 | $49/mo · 50 founding seats | $49.99/mo locked in | $49.99/mo · Black Friday | $99/mo or $990/yr |
| C3 | Hero chip 3 (`f-wide`, hidden on phones) | On Discord | Ends Dec 1, 11:59 PM ET | Nov 24 to Dec 1 | On Discord |
| C4 | Hero chip 4 (`f-wide`) | Card or ACH through Whop | Same | Same | Same |
| C5 | Hero gold button | Join Swarm | Join Swarm | See the Black Friday price | Join Swarm |
| C6 | Line under the hero button | Cancel anytime. | Black Friday price ends December 1 at 11:59 PM ET. Cancel anytime. | Checkout opens November 24 at 12:00 AM ET. | Cancel anytime. |
| C7 | Hero sub, hero note, quote cards | (no offer text) | Unchanged | Unchanged | Unchanged |

### Mid-page CTAs and sections

| # | Where | Now | SALE | TEASER | ENDED |
| --- | --- | --- | --- | --- | --- |
| M1 | Gold buttons after the curve, the founder and the members grid | Join Swarm, href `#join` | Join Swarm (href unchanged, lands on the card) | See the Black Friday price | Join Swarm |
| M2 | The line under each of those three | Cancel anytime. | Cancel anytime. | Checkout opens November 24. | Cancel anytime. |
| M3 | Members, Discord mock, `.rm-h` | Founding members | Members (all states; there are no founding seats) | Members | Members |
| M4 | Members, Discord mock `aria-label` | ...open places for multi-cycle traders and founding members. Not live data. | ...open places for multi-cycle traders and members. Not live data. | Same | Same |
| M5 | AI tools card `.mdev` | I'm still building them. Join early and you get each one as it's finished. Prices for new members go up as they're completed. | Unchanged | Unchanged | Unchanged |

### Pricing section head (`#pricing`, was `#join`)

| # | Where | Now | SALE | TEASER | ENDED |
| --- | --- | --- | --- | --- | --- |
| P1 | Pill | Pre-launch · Join the swarm | Black Friday launch · Nov 24 to Dec 1 | Same as SALE | Join the swarm |
| P2 | h2 first line (`.m`, muted) | 50 founding seats. | Join by December 1, keep $49.99 a month. | Join from November 24, keep $49.99 a month. | The AI tools are still being built. |
| P3 | h2 second line (`.b`) | Early on purpose. | Early on purpose. | Early on purpose. | Early on purpose. |
| P4 | Lede | The first 50 founding seats keep $49 a month for as long as they stay subscribed. After that it's $99 a month, and prices rise as the tools are completed. | Join by December 1 at 11:59 PM ET and you keep $49.99 a month for as long as you stay subscribed. After that it's $99 a month, and prices rise as the tools are completed. | Checkout opens November 24 at 12:00 AM ET. Join by December 1 at 11:59 PM ET and you keep $49.99 a month for as long as you stay subscribed. After that it's $99 a month, and prices rise as the tools are completed. | Swarm is $99 a month, or $990 a year. Prices rise as the tools are completed. |

### Pricing card (the `PLANS` table in `page.js` plus the markup; full spec in section 5)

| # | Element | Now | SALE (Black Friday selected) | TEASER | ENDED (Standard selected) |
| --- | --- | --- | --- | --- | --- |
| K1 | Label (top left) | Founding monthly | Black Friday launch (phones: Black Friday) | Same as SALE | Swarm membership |
| K2 | Chip (top right) | Founding seat | Ends Dec 1 | Opens Nov 24 | Renews monthly |
| K3 | Plan switch | Founding $49/mo · Standard $99/mo · Yearly $990/yr (tag "2 months free") | Black Friday $49.99/mo · Yearly $990/yr | Same as SALE | Standard $99/mo · Yearly $990/yr |
| K4 | Price | $49 /mo (gold) | $49.99 /mo (gold) | $49.99 /mo (gold) | $99 /mo (ink, not gold) |
| K5 | Struck price | none | ~~$99/mo~~ with the label "After Dec 1"; screen readers hear "Standard price after December 1: $99 a month." | Same as SALE | none |
| K6 | Note | Forever, while you stay subscribed. Cancel whenever. 50 seats only. | Locked in while you stay subscribed. | Same | Renews monthly. Cancel anytime. |
| K7 | Deadline row | none | Ends December 1 at 11:59 PM ET. | Runs Nov 24, 12:00 AM ET to Dec 1, 11:59 PM ET. | Replaced by the plain line: The Black Friday price ended December 1. |
| K8 | Sub line | Cancel and rejoin after prices go up, and you pay the price at that time. | Cancel and rejoin later, and you pay the price at that time. | Same | none |
| K9 | Ladder | Now: Founding price · After 50 seats: Standard · $99/mo · Then: Rises as the tools are completed | Now through Dec 1: $49.99/mo, locked in · After Dec 1: $99/mo or $990/yr · Then: Prices rise as the tools are completed | Nov 24 to Dec 1: $49.99/mo, locked in · After Dec 1: $99/mo or $990/yr · Then: Prices rise as the tools are completed | Now: $99/mo or $990/yr · Then: Prices rise as the tools are completed |
| K10 | Checklist | Everything inside Swarm + 4 lines | Unchanged (phones use the short labels: Custom AI tools, My watch list, Weekly live calls, Multi-cycle traders) | Same | Same |
| K11 | Gold button | Join Swarm (button, opens the stub) | Join Swarm, a link to the Whop checkout of the selected plan | No gold button. A status row: Checkout opens Nov 24, 12:00 AM ET | Join Swarm, link to the selected plan |
| K12 | Line under the button | Card or ACH through Whop. Cancel anytime. | Same | Same | Same |
| K13 | Whop slot | Checkout · Founding monthly / Opens here soon, through Whop. / [Data needed: Whop plan IDs] | Removed (hosted checkout; section 6) | Removed | Removed |
| K14 | Yearly selected (any state where offered) | $990 /yr, "2 months free." | Chip: 2 months free vs Standard. Price $990 /yr (ink). Note: Paid once a year: twelve months of Standard for the price of ten. Deadline row: The Black Friday monthly price ends December 1 at 11:59 PM ET. Sub: Renews yearly. Cancel anytime. | Same, deadline row as K7 TEASER | Chip, price and note as SALE; no deadline row; the plain line from K7 stays |
| K15 | Click message (`#whop-status`) | Checkout for the founding monthly plan opens here soon. | Removed | Removed | Removed |

### How joining works (moves out of the card, directly under it)

| # | Where | Now | SALE | TEASER | ENDED |
| --- | --- | --- | --- | --- | --- |
| W1 | Steps | 01 Pick your plan · 02 Check out through Whop, by card or ACH · 03 Get access to the Swarm Discord | Unchanged | 02 becomes: Check out through Whop from November 24, by card or ACH | Unchanged |
| W2 | Note | Discord access comes right after checkout. The AI tools arrive one by one as I finish them. Founding members get each one as it's completed. | Discord access comes right after checkout. The AI tools arrive one by one as I finish them, and you get each one as it's completed. | Same | Same |
| W3 | Risk line under the section | Swarm is education and research, not financial advice. Crypto is volatile and you can lose money, including all of it. | Unchanged | Unchanged | Unchanged |

### FAQ (stays at six questions)

| # | Question | SALE | TEASER | ENDED |
| --- | --- | --- | --- | --- |
| F1 to F4 | Advice; who it's for; where and what; are the tools ready | Unchanged | Unchanged | Unchanged |
| F5 summary | What does "$49 forever" mean? | What does "locked in" mean? | Same | What happened to the Black Friday price? |
| F5 answer | A founding seat keeps $49 a month... | Join by December 1 at 11:59 PM ET and you keep $49.99 a month for as long as you stay subscribed, even as the price for new members goes up. If you cancel and rejoin later, you pay the price at that time. | Join between November 24 at 12:00 AM ET and December 1 at 11:59 PM ET and you keep $49.99 a month for as long as you stay subscribed, even as the price for new members goes up. If you cancel and rejoin later, you pay the price at that time. | It ended December 1. Anyone who joined during it keeps $49.99 a month while they stay subscribed. New members pay $99 a month or $990 a year, and prices rise as the tools are completed. |
| F6 answer | Pick a plan above and check out through Whop... | Unchanged | Checkout opens November 24 at 12:00 AM ET. Then pick a plan above and check out through Whop, by card or bank transfer (ACH). Every plan includes everything inside Swarm, and you can cancel anytime. The details are in the refund policy. (keep the link) | Unchanged |

### Final CTA and footer

| # | Where | Now | SALE | TEASER | ENDED |
| --- | --- | --- | --- | --- | --- |
| E1 | Final h2 | Be on the right side of this cycle. I'll see you inside. | Unchanged (his line) | Unchanged | Unchanged |
| E2 | Final gold button | Join Swarm | Join Swarm | See the Black Friday price | Join Swarm |
| E3 | Line under it | Cancel anytime. | Black Friday price ends December 1 at 11:59 PM ET. Cancel anytime. | Checkout opens November 24 at 12:00 AM ET. | Cancel anytime. |
| E4 | Footer disclosure, links, contact | (no offer text) | Unchanged | Unchanged | Unchanged |

### Legal pages and 404

| # | Page | Change |
| --- | --- | --- |
| L1 | `terms.html` | Summary bullet, contents entry, section 07 plan list, section 08 rewritten; "Last updated" to the ship date (section 7). |
| L2 | `refunds.html` | Summary bullet, section 03 rewritten, section 04 first line; "Last updated" to the ship date (section 7). |
| L3 | `privacy.html` | No change: it names no price ("price changes" only). Its date stays, so its sitemap lastmod stays true. |
| L4 | `404.html` | No change: no offer text, and it stays noindex. |

### Code and docs that carry the old offer

| # | File | Change |
| --- | --- | --- |
| X1 | `page.js` header comment, `lockMoment` comment ("the founding $49 turns gold") | "$49.99 turns gold (TEASER and SALE; no gold number in ENDED)". |
| X2 | `page.js` `PLANS`, `mountCheckout`, `showPlan`, Join click handler | Replaced by section 5 and 6. |
| X3 | `core-glow.css` comments at lines 698 to 700 | "Black Friday price" instead of "founding price". |
| X4 | `index.html` comment above section 8 | Describe the two-column card and the $49.99. |
| X5 | `LAUNCH-CHECKLIST.md` item 1 | "Whop plan IDs and checkout links for Black Friday Monthly ($49.99), Standard Monthly ($99) and Yearly ($990), pasted into `CHECKOUT` in the head script of `a-core-glow/index.html`." (Built there, not in `page.js`, so the card is right on first paint; see "Implemented".) |
| X6 | `ANTI-SLOP.md` allowed numbers | Replace "$49, ... 50 seats, 2 months free" with "$49.99, $99, $990, 2 months free vs Standard, Nov 24, Nov 27, Dec 1, 12:00 AM ET, 11:59 PM ET". |
| X7 | `SWARM-BRIEF.md` Pricing | Add the Black Friday decision block; mark the founding-seat block as replaced. |
| X8 | `SEO-PLAN.md` 1.14 | Founding offer and "If the 50 founding seats fill" notes are obsolete; point to this file. |

## 3. Component: the top announcement bar

Purpose: the one place with a live countdown. It is not essential (the deadline is stated as static text everywhere else) and it can be hidden, which meets WCAG 2.2.2 (Pause, Stop, Hide) for auto-updating content. It is a Hide control, not a pause button, so it keeps Jesus's "no pause buttons" rule.

Markup (first child of `<body>`, before the skip link's target and before the nav):

```html
<aside class="bf-bar" id="bf-bar" aria-label="Black Friday launch">
  <div class="bf-in">
    <p class="bf-t"><span class="bf-a">Black Friday<span class="bf-long"> launch</span></span><span class="bf-sep" aria-hidden="true">·</span><span class="bf-b">$49.99/mo locked in</span><span class="bf-sep bf-sep2" aria-hidden="true">·</span><span class="bf-br"></span><span class="bf-c" data-bf-teaser="Checkout opens Nov 24, 12:00 AM ET">Ends Dec 1, 11:59 PM ET</span></p>
    <span class="bf-cd" id="bf-cd" aria-hidden="true"></span>
    <a class="bf-go" href="#join">See the price</a>
    <button class="bf-x" type="button" aria-label="Hide the Black Friday bar"></button>
  </div>
</aside>
<script>SWARM.bfApply(document.getElementById('bf-bar'))</script>
```

Layout (measured in `card-mock.html`, screenshots `shots/mock-bar-*.png`):

| Width | Height | Layout |
| --- | --- | --- |
| 1240 and up | 40px + 1px border | One centered line: hex, BLACK FRIDAY LAUNCH · $49.99/MO LOCKED IN · ENDS DEC 1, 11:59 PM ET, the countdown chip, "See the price", Hide at the right edge. |
| 641 to 1239 | 40px + 1px | Same line without the word "launch"; tracking .12em. Fits 1024 with room. |
| 640 and down | 56px + 1px | Two lines, left aligned: line 1 BLACK FRIDAY · $49.99/MO LOCKED IN; line 2 the deadline (muted) and the countdown chip. "See the price" hidden. Hide (44x44) on the right across both lines. |

Style, kit only: background `--swarm-surface`, 1px `--swarm-line` bottom border, JetBrains Mono 500 12px uppercase (11px on phones), text `--swarm-text`, separators and phone deadline `--swarm-text-muted`, the kit's outlined hex before "Black Friday". Countdown chip: 1px `--swarm-line` border, radius 10, `tabular-nums`. The link is Hanken Grotesk 600 14px, underlined. No gold anywhere in the bar (the gold number of every view stays $49.99 in the card), no shadow, no gradient, no slide-in animation.

Behavior:

- In flow, not fixed: it scrolls away with the page, so it never covers the pricing card. The nav changes from `position: fixed` to `position: sticky; top: 0; margin-bottom: -68px` (-60px on phones), so it sits under the bar at the top and sticks at 0 once the bar has scrolled away, still overlaying the hero as today. `body { overflow-x: clip }` does not break sticky (clip is not a scroll container).
- The hero keeps one screen: `--bf-bar-h` is 41px (57px on phones) when the bar shows and 0 otherwise, set by CSS from `html[data-bf]` and `.bf-bar-off`. `.hero { min-height: max(760px, calc(100svh - var(--bf-bar-h))) }` and the wide-screen `--vs` becomes `clamp(-140px, calc(100svh - var(--bf-bar-h) - 900px), 300px)`, so the rail still closes the first screen at 1440x900. From the live page measurements plus the bar height, the hero's gold button bottom moves from 690 to about 731 at 1440x900 and from 599 to about 656 at 390x844: still in the first screen. Re-measure after the build, because the shorter hero also shrinks the core slightly through `--vs`.
- Countdown (SALE only, JS only): text is `Xd HHh MMm left`, dropping leading zero units ("06h 41m left", then "41m left", then "less than 1m left"). Rounded down, so it never overstates. It updates on minute boundaries only: one `setTimeout` to the next whole minute of `BF_END - now`, then every 60 s; it stops while the tab is hidden and resyncs on `visibilitychange`; at zero it flips the page to ENDED. It is `aria-hidden`, because the static sentence already gives screen readers the deadline. Under `?t=` captures it freezes at `?bfnow` or at the frozen time.
- Hide: adds `bf-bar-off` to `<html>`, stores `localStorage['swarm-bf-bar-<state>'] = 'off'` (in try/catch; a hidden TEASER bar comes back once when the sale starts, a hidden SALE bar stays hidden), stops the countdown, and moves focus to the nav logo link. The hero growing by 41px after a click is user-initiated, so it does not count toward CLS.
- TEASER: no countdown, the deadline slot reads "Checkout opens Nov 24, 12:00 AM ET". ENDED: no bar.

## 4. Hero chip changes

Four chips stay four; the text changes per state (table C1 to C4). Widths were checked against the chip style (JetBrains Mono 12px, .2em tracking; 11px, .08em on phones):

- 1024 to 1239: the four SALE chips are about 900px wide, inside the 960px row, so they stay on one line (the "launch" word is only on the bar, not on chip 1, for this reason).
- 390: phones show chips 1 and 2 only: "Black Friday" + "$49.99/mo locked in" (about 290px), "Opens Nov 24" + "$49.99/mo · Black Friday" (about 330px), "Weekly live calls" + "$99/mo or $990/yr" (about 310px). All one line inside 358px.
- No chip is gold, none says "sale", none counts anything. The chips keep `data-avoid` so hero.js routes agents around them as it does now.
- The deadline on phones is in the bar and in the line under the hero button (C6), so dropping chip 3 on phones loses nothing.

## 5. The rebuilt pricing card

### What changes and why

The October 20 review measured the live card at 1069px tall (1100px on phones) and every Join link landing with the card's own button 1104px down a 900px screen (1118px on 844, 1074px on 768). The checkout slot dead-ends in "Opens here soon", and "2 months free" next to a cheaper monthly misleads. The rebuilt card keeps the offer, the ladder, the checklist and the button, moves "How joining works" out of the card, drops the Whop slot (hosted checkout), and goes two columns from 1024px.

### Anchoring every Join

- The section's id becomes `pricing`; the card element gets `id="join"` (and loses `id="pcard"`; in `page.js` replace the three `#pcard` lookups with `#join`). Every existing `href="#join"` (nav, hero, three mid-page buttons, final CTA, the bar's link, and any outside link to `/#join`) now lands on the card itself. `aria-labelledby="join-h"` on the section stays.
- `#join { scroll-margin-top: 16px }` (8px on phones). With the page's `scroll-padding-top: 76px` the card's top lands at 92px on desktop and 84px on phones, under the nav, with the price and the button in view.
- The card's own Join is a link to Whop (section 6), so there is no second scroll inside the page.

### Layout

| Width | Card | Columns |
| --- | --- | --- |
| 1024 and up | `max-width: 960px`, padding 28px, radius 28, 1px `--swarm-line`, `--swarm-surface` | Two equal columns, 36px gap, 1px `--swarm-line` divider on the right column's left edge. Left: the offer. Right: the ladder, the checklist, the button. |
| 641 to 1023 | `max-width: 480px`, padding 22px 20px 20px | One column, same order. |
| 640 and down | Full width inside the 16px gutters (358px at 390), padding 22px 20px 20px | One column; price 50px; checklist as a 2x2 grid of short labels; ladder key column 124px. |

Left column, top to bottom: label + chip row; plan switch (two tabs, 56px tall, 4px inset, radius 18 outer, 10 inner, the selected tab raised with a `--swarm-hive` border as now); price row (JetBrains Mono 500, 76px desktop and 50px phones, `/mo` 18px muted; the struck $99 right-aligned on the same row); the note; then, pushed to the bottom of the column on desktop (`margin-top: auto`), the deadline row; then the sub line. On desktop the deadline row is a 54px box (1px `--swarm-line`, radius 18, `--swarm-ground`, Hanken 600 15px, a filled ink hex before the text) that lines up with the gold button across the divider, and the sub line lines up with the "Card or ACH" line: deadline next to action. On phones it is a plain line with the hex.

Right column: "How the price moves" label and the ladder as three ruled rows (key in JetBrains Mono 11.5px uppercase, 150px column; value in Hanken 14.5px; the current row in `--swarm-text`, the rest muted; the "Then" row keeps today's dashed hex marker idea as its key style). Then "Everything inside Swarm" and the four checks (full sentences at 1024 and up, short labels on phones). Then the gold Join Swarm button (full width, 54px, 52px on phones, with the existing revolving ring) or the status row, and the "Card or ACH through Whop. Cancel anytime." line.

"How joining works" sits directly under the card, outside it: at 1024 and up one row (label, the three numbered steps, the note); below that the label, the three steps in three columns, and the note. The risk line stays under it.

### Gold, exactly

- SALE and TEASER: the price $49.99 is the one gold number (it turns gold at the end of the existing lock moment, as $49 does now). In SALE the Join button is the one gold button. In TEASER there is no gold button in the card (nothing can be bought); the status row is a dashed `--swarm-hive` box with ink text.
- ENDED: the price is ink; the only gold in the card is the button.
- Yearly selected in any state: $990 is ink.
- The struck $99 is `--swarm-text-muted` with a 1.5px muted line-through; its label "After Dec 1" is JetBrains Mono 11px muted. It is never gold, never red, never "was", never a percentage.

### The struck-through $99

Markup: `<p class="was"><s><span class="sr-only">Standard price after December 1: </span>$99/mo</s><span>After Dec 1</span></p>`. Many screen readers do not announce `<s>`, so the hidden prefix carries the meaning. The visible "After Dec 1" label matters for honesty: $99 has never been charged (checkout never opened), so the strike must read as the price that applies after the window, not as a former price. This is also why there is no "save" or "% off" line.

### The deadline line and the ladder

- SALE: "Ends December 1 at 11:59 PM ET." (static text; the countdown is only in the bar).
- TEASER: "Runs Nov 24, 12:00 AM ET to Dec 1, 11:59 PM ET." and the status row "Checkout opens Nov 24, 12:00 AM ET".
- ENDED: the plain line "The Black Friday price ended December 1." in muted 14.5px where the deadline row was.
- Ladder: SALE "Now through Dec 1 | $49.99/mo, locked in", "After Dec 1 | $99/mo or $990/yr", "Then | Prices rise as the tools are completed". TEASER's first key is "Nov 24 to Dec 1" and no row is marked current. ENDED has two rows: "Now | $99/mo or $990/yr", "Then | Prices rise as the tools are completed".

### The Yearly tag

The tabs carry only name and price (a 25-character tag does not fit a 150px phone tab). When Yearly is selected, the chip reads "2 months free vs Standard" and the note reads "Paid once a year: twelve months of Standard for the price of ten." (the brief's confirmed meaning of "2 months free"). The old "2 months free" badge on the tab is removed.

### Data in `page.js`

```js
// What each plan shows. Prices and words only; checkout links live in CHECKOUT (section 6).
const PLANS = {
  blackfriday: { tab: 'Black Friday', tabPrice: '$49.99/mo', price: '$49.99', unit: '/mo', was: '$99/mo', chip: 'Ends Dec 1', chipTeaser: 'Opens Nov 24', note: 'Locked in while you stay subscribed.', sub: 'Cancel and rejoin later, and you pay the price at that time.', gold: true },
  standard:    { tab: 'Standard', tabPrice: '$99/mo', price: '$99', unit: '/mo', chip: 'Renews monthly', note: 'Renews monthly. Cancel anytime.', sub: '', gold: false },
  yearly:      { tab: 'Yearly', tabPrice: '$990/yr', price: '$990', unit: '/yr', chip: '2 months free vs Standard', note: 'Paid once a year: twelve months of Standard for the price of ten.', sub: 'Renews yearly. Cancel anytime.', gold: false }
};
// Which plans each state offers, first one selected.
const OFFER = { teaser: ['blackfriday', 'yearly'], sale: ['blackfriday', 'yearly'], ended: ['standard', 'yearly'] };
```

`showPlan(key)` fills the card from these and from the state (deadline row, ladder, label, button or status row). The radio inputs are rebuilt from `OFFER[state]` on load and on a state flip; the static HTML has the SALE pair (Black Friday checked, Yearly).

### Height targets and what the mock measured

Landing view = after following any `#join` link. Targets keep the whole card plus its button on one screen.

| Viewport | Target card height | Mock SALE | Mock TEASER | Mock ENDED | Button bottom after landing (SALE) |
| --- | --- | --- | --- | --- | --- |
| 1440x900 | 480px or less | 474 | 474 | 435 | 507 of 900 |
| 1024x768 | 520px or less | 495 | 495 | 456 | 528 of 768 |
| 390x844 | 740px or less | 705 | 725 | 607 | 739 of 844 |

Today: 1069, 1069 and 1100. The mock is a static approximation (no lock canvas, kit fonts, the exact strings above); the build must re-measure on the real page with `?bf=` in all three states and keep these targets.

### Motion

The lock moment stays as it is (plays once when the price row is 75% in view, settles by about 3.4 s, honeycomb routes to sockets on the card's edge). It measures the card at run time, so the wider card needs no new code, only a check that the sockets sit on the new edges at 1024 and 1440. It ends with $49.99 turning gold in TEASER and SALE and with no gold turn in ENDED. Nothing new animates; the countdown is a text change once a minute, not motion.

## 6. Whop checkout wiring

### What the Whop docs say (read November 19, 2026)

- A plan (Whop now calls plans "variants"; IDs keep the `plan_` prefix) has a `purchase_url`, "URL where customers can purchase this variant directly", example `https://whop.com/pickaxe-analytics/checkout/plan_xxxxxxxxxxxxx`. Source: https://docs.whop.com/api-reference/plans/retrieve-plan and https://docs.whop.com/api-reference/beta/plans/plan.md
- A checkout configuration has a `purchase_url`, "Checkout URL you can send to customers", example `https://whop.com/checkout/plan_xxxxxxxxxxxxx/?session=ch_xxxxxxxxxxxxxx`. Source: https://docs.whop.com/api-reference/beta/checkout-configurations/checkout-configuration.md
- Checkout links are made in Dashboard > Checkout links; leaving "Show on store page" unchecked keeps a link off the store page, and it "will still work when you share it directly". Source: https://docs.whop.com/manage-your-business/payment-processing/create-checkout-link . A Whop blog post says each link has a copy button in that list: https://whop.com/blog/create-checkout-links-whop/
- Plan visibility can be `visible`, `hidden`, `archived` or `quick_link`; the plan object has no sale-window or scheduled-availability field. Source: https://docs.whop.com/api-reference/beta/plans/plan.md

**Conclusion.** The docs show two different URL shapes (one with the company's slug, one with a `?session=` checkout configuration), so a checkout URL cannot be built from a plan ID alone without guessing. The site therefore keeps the full checkout URL per plan, copied from Whop, next to its plan ID. The plan ID is kept for checks and for a later embedded checkout.

### The one config place (built in the head script of `a-core-glow/index.html`, not `page.js`)

```js
/* ---------- checkout: the ONE place for Whop ----------
   For each plan, paste its plan ID (plan_...) and its checkout link, both copied from Whop (Dashboard > Checkout
   links, the link's copy button; the same URL is the plan's purchase_url in Whop's API). A plan goes live on the card
   when its link is an https://whop.com/ URL. Until then the card shows an honest "Checkout opens ..." row, never a
   dead button. Then run: node scripts/build-swarm-site.mjs */
const CHECKOUT = {
  blackfriday: { whopPlanId: null, checkoutUrl: null }, // $49.99/mo, Nov 24 to Dec 1 only (direct link, not on the store page)
  standard:    { whopPlanId: null, checkoutUrl: null }, // $99/mo
  yearly:      { whopPlanId: null, checkoutUrl: null }  // $990/yr
};
const checkoutLive = k => { const c = CHECKOUT[k]; return !!(c && /^https:\/\/(www\.)?whop\.com\/\S+$/.test(c.checkoutUrl || '')); };
```

Behavior of the card's gold button (an `<a id="join-btn" class="btn-gold">`, same tab):

| State | Selected plan's link | What the card shows |
| --- | --- | --- |
| TEASER | any | Status row "Checkout opens Nov 24, 12:00 AM ET". No gold button. |
| SALE or ENDED | live | Gold "Join Swarm", `href` = that plan's `checkoutUrl`. Switching plans swaps the `href`. |
| SALE or ENDED | missing | Status row "Coming soon" (Jesus, November 20: ship without the links, with this placeholder). The build prints a notice per missing link and does not fail. |
| Any preview (`?bf=` or `?bfnow=`) | any | What a visitor would see in that state with the links as they are now ("Coming soon" while a link is missing), but a live button gets `href="#join"` and the line under reads "Preview: checkout is off." |
| No JavaScript | n/a | SALE text, `href="#join"`, plus `<noscript>` "Checkout runs on Whop and needs JavaScript." |

The old Whop Elements stub (`mountCheckout`, `#whop-checkout`, `#whop-status`, the "Opens here soon" copy and its `[Data needed]` chip) is removed. A hosted link is the most reliable launch path: no third-party script on the page, no CSP or domain verification for wallets, no 560px iframe inside the card. If an on-page checkout is wanted later, mount Whop Elements in a `<dialog>` opened by the card's button, not inside the card (RESEARCH-NOTES.md has the Elements notes).

### What Jesus does in Whop

1. Create three plans on the Swarm product: "Black Friday Monthly" $49.99 per month, "Standard Monthly" $99 per month, "Yearly" $990 per year. Untick "Show on store page" for Black Friday Monthly.
2. Copy each plan's checkout link and plan ID into `CHECKOUT` (or send them; it is a one-line change each), rebuild, and open each link once to check the plan name and price on Whop's page. One real purchase of the Black Friday plan (refunded after) is the end-to-end test, including Discord access.
3. At December 1, 11:59 PM ET, set Black Friday Monthly to hidden or archived in Whop, because Whop has no scheduled end for a plan and the site's clock lives in the visitor's browser. First confirm with Whop that archiving a plan keeps existing subscriptions renewing at $49.99 (open question 6).
4. Publish Swarm's Terms and Refund policy in Whop (Whop shows seller policies under its pay button).

## 7. Legal text changes

Rewrite only these sentences. `[CONFIRM: ...]` notes follow complete sentences and never stand in for a value (the build checks this). Set each page's "Last updated" to the day the change ships (for example "Last updated November 21, 2026"); the build turns it into the sitemap date.

### `terms.html`

Summary bullet (replaces "Founding members keep $49 a month..."):

```html
<li>If you join during the Black Friday launch, from 12:00 AM Eastern Time on November 24, 2026 to 11:59 PM Eastern Time on December 1, 2026, you keep $49.99 a month for as long as you stay subscribed. If you cancel and rejoin later, you pay the price at that time.</li>
```

Contents entry: `<li><a href="#prices">Black Friday price and price changes</a></li>`

Section 07 plan list (replaces the three `<div>` rows):

```html
<div><dt>Black Friday Monthly</dt><dd>$49.99 a month</dd><dd class="lg-note">Only for people who join from 12:00 AM Eastern Time on November 24, 2026 to 11:59 PM Eastern Time on December 1, 2026.</dd></div>
<div><dt>Standard Monthly</dt><dd>$99 a month</dd></div>
<div><dt>Yearly</dt><dd>$990 a year</dd><dd class="lg-note">Two months free compared with twelve months of Standard Monthly at $99.</dd></div>
```

Section 08 (heading and body):

```html
<h2 id="prices-h"><span class="n">08</span>Black Friday price and price changes</h2>
<p>Prices will go up as the AI tools are completed. A price change never affects a period you have already paid for.</p>
<p><strong>If you join during the Black Friday launch, you keep $49.99 a month for as long as you stay subscribed</strong>, even after prices go up.</p>
<p>The Black Friday launch runs from 12:00 AM Eastern Time on November 24, 2026 to 11:59 PM Eastern Time on December 1, 2026. What counts is the time Whop completes your checkout. <span class="cf">[CONFIRM: Whop's checkout time decides whether someone joined in time]</span></p>
<p>If you cancel and rejoin later, you pay the price at that time, not $49.99. <span class="cf">[CONFIRM: does a failed payment that Whop recovers in its retry period keep the $49.99 price?]</span></p>
<p>If you are on Standard Monthly or Yearly, we will tell you before a new price applies to your next renewal. <span class="cf">[CONFIRM: do existing Standard and Yearly members keep their price?]</span></p>
```

Everything else in the Terms stays, including the open [CONFIRM] notes.

### `refunds.html`

Summary bullet (replaces "Founding members keep $49 a month..."):

```html
<li>If you join during the Black Friday launch (November 24 to December 1, 2026, until 11:59 PM Eastern Time), you keep $49.99 a month for as long as you stay subscribed. If you cancel and rejoin later, you pay the price at that time.</li>
```

Section 03 (replaces "Founding members"; no page links to `#founding`):

```html
<section class="lg-sec" id="black-friday" aria-labelledby="black-friday-h">
  <h2 id="black-friday-h"><span class="n">03</span>Black Friday members</h2>
  <p>If you join from 12:00 AM Eastern Time on November 24, 2026 to 11:59 PM Eastern Time on December 1, 2026, you pay $49.99 a month. <strong>As long as you don't cancel, you keep $49.99 a month</strong>, even after prices go up.</p>
  <p>If you cancel and rejoin later, you pay the price at that time, not $49.99.</p>
</section>
```

Section 04 first line: `<p>This covers Black Friday Monthly ($49.99) and Standard Monthly ($99).</p>` and after the existing second paragraph add `<p>The same rules apply to every monthly plan. <span class="cf">[CONFIRM: the Black Friday plan has the same refund rules as the other monthly plans]</span></p>`.

### `privacy.html`, `404.html`

No change (L3, L4).

## 8. SEO text

| Tag | SALE (ships now, also true during TEASER) | ENDED (Dec 2 rebuild) |
| --- | --- | --- |
| `<title>` | Swarm: AI Crypto Trading Community by JM Crypto (unchanged) | Unchanged |
| meta description | Swarm is an AI crypto trading community on Discord by Jesus Martinez of JM Crypto: custom AI tools, his watch list, weekly live calls. Black Friday: $49.99/mo. | Swarm is an AI crypto trading community on Discord by Jesus Martinez of JM Crypto: custom AI tools, his watch list, weekly live calls. $99/mo or $990/yr. |
| JSON-LD WebPage `description` | Identical to the meta description | Identical to the meta description |
| `og:title` | Swarm: AI Crypto Trading Community (unchanged) | Unchanged |
| `og:description` | Most people need three cycles and a lot of pain to get there. I want to get you there in one. Black Friday launch: $49.99/mo locked in, Nov 24 to Dec 1. | Most people need three cycles and a lot of pain to get there. I want to get you there in one. Custom AI tools, my watch list and weekly live calls, on Discord. |
| `og:image`, `twitter:image` | `https://www.joinswarm.ai/swarm-site/img/swarm-og-black-friday-1200x630.png` | `https://www.joinswarm.ai/brand/swarm/social/swarm-og-1200x630.png` |
| `og:image:alt`, `twitter:image:alt` | H7 SALE | The current alt |

The meta description keeps the keyword order the SEO plan chose and only swaps its last sentence (159 characters, inside Google's snippet width). The title stays: the offer is temporary and the title is the page's ranking anchor. No twitter title or description is added (X shows only the image and domain on link cards; other apps read og).

## 9. Black Friday share image

`design-lab/landing/black-friday/swarm-og-black-friday-1200x630.png` (1200x630, 155 KB), rendered from `share-og.html` by `render.mjs` in Chrome at device scale 1 with the self-hosted kit fonts (Unbounded 600, JetBrains Mono 500); the script fails if the fonts do not load. No image model touched it; every letter is HTML text.

What is on it: the Swarm wordmark SVG top left; a pill "BLACK FRIDAY LAUNCH"; "$49.99" in JetBrains Mono 128px gold with "/mo" muted (the one gold number); the two-tone Unbounded line "Locked in for as long / as you stay subscribed."; two mono lines "NOV 24 TO DEC 1 · ENDS 11:59 PM ET" and "AFTER DEC 1: $99/MO OR $990/YR"; "JOINSWARM.AI" bottom right; on the right the official `swarm-mark.svg` as the only lit cell, inside a honeycomb of #1C1C21 outlines on the mark's own grid, fading toward the edges and away from the copy. No struck price on the image (out of context a strike reads as a former price), no weekday, no "sale", no red, no shadow.

To ship it: copy the PNG to `design-lab/landing/assets/swarm-og-black-friday-1200x630.png` and use the og URL in section 8. The build copies any `/swarm-site/img/<file>` that the built HTML names from `assets/`, so it is served at that URL. Use it only during TEASER and SALE; the Dec 2 rebuild points back to the brand image. If the window changes, edit the two mono lines in `share-og.html` and run `node design-lab/landing/black-friday/render.mjs`.

## 10. Build and guard changes (`scripts/build-swarm-site.mjs`)

Keep every existing guard. Add:

1. **Stale sale guard.** Fail when `Date.now() >= Date.parse('2026-12-02T05:00:00Z')` and the lab `index.html` still has `data-bf-default="sale"`: "the Black Friday window has ended; ship the ENDED text (BLACK-FRIDAY-PLAN.md section 1)". Read the end instant from the head script with a strict regex so the two never disagree.
2. **Checkout links.** Parse the `CHECKOUT` block in the head script of `index.html` with a strict regex. Fail if a set `checkoutUrl` is not `https://(www.)whop.com/...` or contains whitespace, or a set `whopPlanId` does not match `^plan_\w+$`. Warn if a link does not contain its plan ID. List every missing link under "Open items" (the build already prints that list).
3. **No founding seats.** Fail if any built HTML or JS matches `/\b50 (?:founding )?seats\b|founding seat|\$49(?!\.99)\b/i`.
4. **No em or en dashes.** Fail if any built HTML contains U+2013 or U+2014.
5. **Share image exists.** For `og:image` and `twitter:image` on the site's origin, check the file exists under `public/` after the copy step (today only `href`, `src` and JSON-LD URLs are checked).
6. Existing JSON-LD check stays: H2 and J1 must match exactly.

New classes use the `bf-` prefix and live in `core-glow.css`, so the production class-clash guard (which only checks `swarm-site.css`) is not affected. `lib/swarm-pages.json` lastmod updates itself from the legal pages' new dates.

## 11. Test plan before shipping

- `?bf=teaser`, `?bf=sale`, `?bf=ended` at 1440x900, 1024x768, 390x844 and 360x640: first screen complete, gold CTA in the first screen, bar layout, chips on one line, then click each Join (nav, hero, three mid-page, final, the bar's link) and check the card's price and button are in view after the scroll; record the card heights against the targets in section 5.
- `?bfnow=2026-11-24T04:59:00Z` then wait one minute: the page flips to SALE in place. `?bfnow=2026-12-02T04:58:30Z`: countdown "1m left", then "less than 1m left", then ENDED.
- No JavaScript (Chrome with JS off): SALE text, no countdown, no Hide button, the noscript line.
- Hide the bar, reload: stays hidden in that state; with storage blocked the page still works.
- Screen reader pass on the bar (static deadline read, countdown silent), the struck price, the plan switch.
- `node scripts/build-swarm-site.mjs` passes; `npm run lint`, `npm test`, `next build`; a Vercel preview at `/swarm`.
- Paste the preview URL into an X draft and a Discord message to see the new card.
- With real links: each plan link opens the right Whop plan; one real Black Friday purchase reaches the Discord.

## 12. Runbook

| When (ET) | What |
| --- | --- |
| Nov 19 to 21 | Jesus answers the open questions (at least 1, 2, 4, 5, 6) and creates the three Whop plans. |
| By Nov 22 | Build, review with `?bf=`, deploy. TEASER shows to visitors automatically. |
| Nov 23 | Paste the checkout links if not in yet; rebuild; test each link. |
| Nov 24, 12:00 AM | The page flips to SALE on its own. Check the live page at 12:05 AM (phone and desktop) and one purchase path. |
| Dec 1, 11:59 PM | Hide or archive the Black Friday plan in Whop. The page flips to ENDED on its own at 12:00 AM. |
| Dec 2 morning | Merge the prepared ENDED change (section 1), rebuild, deploy, recheck share cards. The build fails if this is skipped and someone builds after the end. |

## 13. Open questions for Jesus

1. **Dates.** You wrote "maybe a week or two?". The brief says Monday November 24 to Monday December 1 with December 1 as Cyber Monday, but in 2026 November 24 and December 1 are Tuesdays and Cyber Monday is November 30. Which window: (a) Tue Nov 24 12:00 AM ET to Tue Dec 1 11:59 PM ET (what this plan builds, with no weekday names on the page), (b) Mon Nov 23 to Mon Nov 30 (Cyber Monday), (c) something longer? Only two constants and the date strings change.
2. **The old $49 founding promise.** The live page has said "$49/mo, 50 founding seats" since October 17. Nobody could pay (no checkout), but did you promise $49 founding seats anywhere else (videos, X, Discord, email)? If so, do those people get anything, and should the page say so?
3. **The struck $99.** $99 has never been charged. The plan labels it "After Dec 1" and never says "was" or shows a percentage. OK, or would you rather show "$99/mo after Dec 1" without the strike?
4. **Yearly during the sale.** Yearly ($990) costs more than twelve months at $49.99 ($599.88). Keep it as decided with "2 months free vs Standard", hide it until Dec 2, or make a Black Friday yearly price?
5. **TEASER button label.** Before Nov 24 nobody can buy, so the plan changes the gold buttons to "See the Black Friday price" and removes the card's gold button until checkout opens. OK, or keep "Join Swarm"?
6. **Whop end of sale.** Who hides or archives the $49.99 plan at Dec 1 11:59 PM ET, and can you confirm with Whop that archiving a plan keeps the existing $49.99 subscriptions renewing?
7. **Nothing sells before Nov 24.** The plan opens no checkout at all (not even Standard or Yearly) until the window starts. OK?
8. **Whop links.** Please send the three plan IDs and checkout links by Nov 23, and make sure the Discord access through Whop is ready for Nov 24.
9. **Legal questions.** Two are [CONFIRM] notes on the pages: does a failed payment that Whop recovers in its retry period keep the $49.99 price (terms section 08), and does the Black Friday plan have the same refund rules as the other monthly plans (refunds section 04). One is an open question only, not on any page (the build removed the sentence because it went beyond your decisions): should the terms say which moment counts for joining in time, for example the time Whop completes checkout?
10. **AI tools for everyone.** The old copy said founding members get each tool as it is completed. With no founding seats, the plan says every member does. Right?
11. **The countdown bar.** One countdown in a top bar that visitors can hide (a Hide button, not a pause button; it is what makes a live countdown accessible). OK?
12. **Share image.** Approve `black-friday/swarm-og-black-friday-1200x630.png` for link previews; want the same image for an X post?
13. **Still open from before:** the thirteen legal questions in `OVERNIGHT.md`, sign-off on the disclaimer and copy, and the JMCrypto@wealthgardenent.com inbox being live.

## Implemented

Built November 19, 2026 from this plan, then corrected November 20 after a visual, an honesty and a QA review. Full notes, measurements and the reviewer corrections are in `a-core-glow/NOTES.md` ("Black Friday" and "Black Friday review fixes"). Nothing is committed yet; `public/swarm-site/` is rebuilt from the lab copy by `node scripts/build-swarm-site.mjs`.

### Jesus's first action

**The three Whop links, when they exist (November 20: Jesus chose "Coming soon" in their place until then).** The page flips to SALE by itself at Nov 24, 12:00 AM ET, whether or not anyone rebuilds it. Steps: `LAUNCH-CHECKLIST.md` item 1. Until the Black Friday link is in, the sale shows no countdown, its gold buttons read "See the Black Friday price", and the card says "Coming soon" where Join Swarm would be. The build prints a **CHECKOUT COMING SOON** line per missing link; it does not fail.

### Where it lives

| What | Where |
| --- | --- |
| The two instants, the state (TEASER, SALE, ENDED), the preview switches, `SWARM.bfApply`, `SWARM.bfCard` | Second script in the head of `a-core-glow/index.html` |
| **`CHECKOUT`, the one place for the Whop plans** (`whopPlanId` and full `checkoutUrl` per plan) | Same head script (not `page.js`, so the card's button or status row is right on first paint) |
| Words per state | Leaf elements: SALE text as content, `data-bf-teaser`, `data-bf-ended`, and `data-bf-nolink` (SALE without its link) |
| The card per plan (label, chip, price, note, condition, deadline), flips at the boundaries, the countdown, Hide | `a-core-glow/page.js` (`PLANS`, `DEADLINE`, `showPlan`, `bfClock`) |
| Layout per state | `a-core-glow/core-glow.css`, keyed on `html[data-bf]` and `.pcard.is-gold` |
| Guards | `scripts/build-swarm-site.mjs` (`blackFridayChecks`) |
| The Dec 2 change to the static text | `black-friday/ship-ended.mjs` |
| Preview noindex header | `next.config.ts` (`?bf`, `?bfnow`; not on martinezaccess.com) |

Whop: the site links to Whop's hosted checkout and never builds a URL from a plan ID, because Whop's docs show more than one URL shape for a plan (`https://whop.com/<store>/checkout/plan_...` as a plan's `purchase_url`: https://docs.whop.com/api-reference/plans/retrieve-plan ; `https://whop.com/checkout/plan_.../?session=...` for a checkout configuration: https://docs.whop.com/api-reference/beta/checkout-configurations/checkout-configuration.md). The build accepts only `https://whop.com/` links without `?session=` and warns when a link does not contain its plan ID.

### What differs from the plan above

- **Hero.** Chips are evergreen in TEASER and SALE (On Discord, Weekly live calls, Cancel anytime, Card or ACH through Whop) instead of C1 to C3, because the bar already carries the offer; ENDED keeps C2's "$99/mo or $990/yr". The line under the gold button (C6) carries the price: SALE "$49.99 a month, locked in. Black Friday price ends December 1 at 11:59 PM ET.", TEASER "$49.99 a month, locked in. Checkout opens November 24 at 12:00 AM ET, and the price ends December 1 at 11:59 PM ET.", in ink.
- **Pill (P1)** "Black Friday · Nov 24 to Dec 1" (one line on phones).
- **Bar (B1 to B3).** No "See the price" link in TEASER. The countdown steps out under 360px; its last minute reads "under 1m left". No countdown while the sale has no checkout link.
- **Card.** K1 follows the plan, not the state: "Black Friday launch" only with the Black Friday plan, "Swarm membership" with Yearly or Standard. ENDED Standard: chip "Standard", note "Renews monthly until you cancel." K8 (the condition) sits right under the note; on wide screens the deadline box stays level with the button; in ENDED the plain line sits 12px under the note. TEASER with Yearly: "The Black Friday monthly price runs Nov 24, 12:00 AM ET to Dec 1, 11:59 PM ET." On short phones (up to 640 by 760) the button or status row moves up under the deadline (CSS order only).
- **Head.** Meta description and JSON-LD end "$49.99/mo to Dec 1." (154 characters). og:description no longer pairs Q01 with a price (FOUNDER-DOSSIER section 3): "Swarm Black Friday launch: $49.99/mo locked in, Nov 24 to Dec 1. Custom AI tools, Jesus Martinez's watch list and weekly live calls, on Discord."
- **Bar Hide** is stored in sessionStorage per state (for the visit only), so no privacy-page change was needed.
- **Legal.** The terms sentence "What counts is the time Whop completes your checkout" was not added; it is question 9 above.
- **Dec 2.** Instead of a hand-made branch, `black-friday/ship-ended.mjs` makes the change in one step: `<html data-bf-default="ended" data-bf="ended">`, the evergreen meta description ("...$99/mo or $990/yr."), og:description, share image and alt, the ENDED words as static text (SALE words kept in `data-bf-sale` for previews), the bar, the struck $99 and the ladder's Black Friday row removed (`data-bf-sale-only`), no gold card, and the JSON-LD description. It refuses to run before the end unless given `--early`.

### Guards added to the build

Stale sale (fails from 2026-12-02T05:00:00Z while `data-bf-default="sale"` or a Black Friday link remains), ENDED text before the end fails, a CHECKOUT COMING SOON notice per missing link (a failure from the sale's start was dropped November 20, when Jesus chose "Coming soon"), `CHECKOUT` value checks, no founding offer ("50 seats", "founding seat/member/price/monthly", "$49" without ".99") in any built page or script, no em or en dash in built HTML, no `?bf=` link, share images exist, and the no-JS text of the home page matches its `data-bf-default` state (SALE: the deadline and "$49.99 a month, locked in."; ENDED: "The Black Friday price ended December 1." and nothing that still offers $49.99).

### Measured (November 20, `next start`, real clock moved with fake Whop links where noted)

| Viewport | Card height (TEASER / SALE / ENDED) | After any Join: action bottom (TEASER / SALE / ENDED) |
| --- | --- | --- |
| 1440x900 | 468 / 468 / 431 | 501 / 501 / 465 of 900 |
| 1024x768 | 489 / 489 / 453 | 543 / 543 / 506 of 768 |
| 390x844 | 689 / 669 / 586 | 724 / 704 / 621 of 844 |
| 375x667 | 691 / 671 / 588 | 474 / 454 / 405 of 667 |
| 360x640 | 756 / 736 / 608 | 519 / 498 / 404 of 640 |

Both plan tabs pass at every size. Hero gold button in the first screen in every state (bottom 709 of 900, 615 of 768, 656 of 844, 568 of 640). Bar two lines or fewer from 320 to 960 and one line above, for every countdown value. Chips one line from 320 to 1440. Live call rows: no overlap at 320, 360, 375 and 390.

### Still open

- Jesus's answers to section 13 (dates and weekdays, the old $49 promise, the struck $99, Yearly during the sale, the TEASER labels, Whop archiving, the countdown bar, the share image, the legal questions) and the three Whop plans.
- `ANTI-SLOP.md` allowed numbers (row X6) and `SEO-PLAN.md` 1.14 (row X8) still describe the founding offer; the YouTube description and pinned comment texts are drafted in `a-core-glow/NOTES.md`.

### Condensed (November 20)

`CONDENSE-PLAN.md` cut the page's copy; the Black Friday parts it touched (details in `a-core-glow/NOTES.md`, "Condensed"):
- **Hero (C1 to C4).** The chip row is gone, with its ENDED variants. **C6** ENDED now reads "$99/mo or $990/yr. Cancel anytime."; SALE and TEASER are unchanged (the SALE line is still a build-guard string).
- **M1, M2.** The curve's gold button is gone; the founder and members buttons stay. The line under each of the three ("Cancel anytime." / TEASER "Checkout opens November 24.") is gone.
- **M4.** The Discord mock's label reads "...a pinned note from Jesus, and open places for multi-cycle traders and members. Not live data." (his two messages are gone). **M5.** The tools card says it in one line: "I build and maintain them myself. Join early and you get each one as it's finished. Prices for new members go up as the tools are completed." (review fix: was "Built and maintained by me. ... as they're completed.")
- **P4.** The pricing lede is gone in every state (the card carries each fact). **W1** step 2 reads "Check out through Whop" (TEASER "Check out through Whop from November 24"); card or ACH is on the card's line. **W2** (the joining note) is gone. **W3** and the card are unchanged.
- **FAQ.** Five questions, all closed; "What does "locked in" mean?" and its ENDED swap are unchanged.
- **Dec 2.** `black-friday/ship-ended.mjs` now swaps 16 words (was 19) and still removes exactly 3 sale-only elements; checked with `--early` on a throwaway copy, and the ENDED guard passes there with the clock after the end.
