# Condense plan: the Swarm page (joinswarm.ai), November 20, 2026

**The ask (Jesus):** "I think there's WAY too much text all over this website. We need to condense certain cards & give more space for the website to breathe"

**Scope:** the lab copy `design-lab/landing/a-core-glow/` only: `index.html` (body copy and markup) and `core-glow.css` (one block appended at the end). `page.js`, `hero.js`, `lattice.js`, `crowd.js` and `tools3d.js` are **not edited**. Out of scope, unchanged: everything in `<head>` (meta tags, JSON-LD, both head scripts, `CHECKOUT`), the H1, the section ids, the footer disclosure, and the legal pages. Then rebuild `public/swarm-site/` with `node scripts/build-swarm-site.mjs` (never edit it by hand).

**Status:** a decision for the builder. This plan was prototyped end to end on a throwaway copy (nothing in the repo was changed except this file); the numbers and checks below come from that prototype. Some items need Jesus's yes before shipping (section 7).

---

## 1. The decision

**Base: the Editor proposal.** It keeps all eleven blocks, in order, and Jesus's earlier structural decisions (the hero ends on the "Inside Swarm" rail so the first screen never ends in an empty band, the floating cards beside the hero, the 2 x 2 member grid with four working mocks, the "How joining works" strip he asked for in round 5). It cuts the words inside each block, says each thing once, and gives the space back as air. Its first screen was the best of the three: headline, one sentence, the gold button with its price line, the intro video chip on the left and Scout 03 on the right, then the rail. It is also the lowest risk for the scripts and the Black Friday states.

**Grafted in:**
- *From the Strategist:* the mocks drop the labels that repeat their card (the console's event log, the watch list's public "why" column, the focus line on every portfolio row except the live one), by CSS only so `page.js` keeps writing to them. On phones both hero cards step out, so the phone hero is copy, button and rail. The founder's audience line moves into the transcript card as its footer, which fills the card instead of leaving a hollow band. The curve's gold button goes (the curve is the problem statement; the sticky nav button is always there). The FAQ keeps "Where does Swarm happen, and what do I get?" (the SEO plan relies on the FAQ to carry "Discord"). The risk line under the card keeps its original wording. The checklist uses its short labels in the HTML, not hidden spans.
- *From the Art Director:* the right-curve line "Knows what it's buying, why, and when to get out." (closest to the video's own definition), and keeping "Prices for new members go up as they're completed." on the tools card (Jesus's October 16 note: say it on the AI tools card, in pricing and in the FAQ). The "Illustration · ..." honesty captions on the two diagrams stay.

**Rejected, and why:**
- *Art Director:* removing both hero cards and the rail (the rail is Jesus's round-3 fix for the empty band; the brief's taste notes ask for floating cards beside the hero), the zig-zag member rows (a stock SaaS feature-row pattern, +842px on desktop, and the brief asks for a 2 x 2 grid of mock cards), removing "How joining works" (Jesus asked for it, round 5 note 6), keeping the second-cycle quote in "Who it's for" (not in dossier section 3), 136px section padding and a larger type scale (desktop got taller and sparser; the approved type scale stays).
- *Strategist:* removing the Swarm Discord mock and merging calls and traders into one wide card (the only picture of where Swarm happens; breaks the 2 x 2 grid), keeping the Q09 quote card and three fact chips in the hero (text in the first screen), keeping the whole 3:02 row (its last sentence is not in section 3), keeping both "Who it's for" quotes (the second is not in section 3), removing the founder's button, moving sentences into FAQ answers (changes answers Jesus approved), removing the mini curves, the 6:5 phone photo (round-3 note: the lower thirds must not cover his face).
- *Editor:* dropping the price-rise sentence from the tools card (Jesus's note), the shorter risk line (the one short line by the card keeps "education and research"), rewriting FAQ question 1 and removing "Where does Swarm happen" (approved copy, Discord for SEO), keeping the two Discord mock messages (attributed words not in dossier section 3, see below), removing the two diagram captions, changing the pricing pill, the photo card's sub-line, the call card line ("every week" is Jesus's round-5 wording) and the TEASER hero line, and keeping the curve's button.

**A rule the base got wrong, fixed here:** the two messages from "Jesus · Host" in the Swarm Discord mock ("You get weekly calls where I do live portfolio reviews." and "And of course, we have traders who have made it through several cycles sharing how they see the market right now.") are attributed words that are not in FOUNDER-DOSSIER.md section 3 (the first is in section 1, T67; the second is in no section). They are removed. The pinned note "I show my work; always do your own research." is Q20 (section 3) and stays.

**Quote check (done word for word against FOUNDER-DOSSIER.md section 3):** every line in quotation marks, on a quote card, or with a timestamp that remains on the page:
| Where | Text | Section 3 |
|---|---|---|
| Founder pull quote, 3:02 | I stayed through the bear market when everyone else left. | Q05, LV 3:02, `?t=182` |
| Why this cycle | "They want real things." "They want real revenue." "They want real users." | Q04, LV 2:23, `?t=143` |
| Before you join | "These moves are violent in both directions and anyone selling you the first half without the second half is selling you something." | Q15, ARTICLE III, Aug 7, 2026 |
| Discord mock pin, FAQ answer 1 | I show my work; always do your own research. | Q20 |
Headlines that echo his lines (H1, "Crypto cycles aren't really about crypto. They're about attention.", "I'll see you inside.") are unchanged and not presented as quotes. Nothing from section 10 (Unverified) is used.

---

## 2. Target numbers

Measured on the merged prototype the same way as the brief (visible words of `document.body.innerText`, `documentElement.scrollHeight`, `?t=99`, deviceScaleFactor 1, clock faked per state). The lab copy counts 8 more words than production (production rewrites some screen-reader link text), so production should land about 8 under the lab figures. Heights are the same in both.

| State, device | Before (lab) | **Target (lab)** | Change |
|---|---|---|---|
| SALE, 1440x900 | 1,849 words, 9,980px | **994 words, 9,031px** | words -46%, height -10% |
| SALE, 390x844 | 1,752 words, 14,378px | **928 words, 10,864px** | words -47%, height -24% |
| TEASER, 1440x900 | 1,883 words, 10,078px | **1,013 words, 9,099px** | -46% |
| TEASER, 390x844 | 1,789 words, 14,507px | **950 words, 10,915px** | -47% |
| ENDED, 1440x900 | 1,734 words, 9,915px | **904 words, 8,994px** | -48% |
| ENDED, 390x844 | 1,641 words, 14,141px | **843 words, 10,685px** | -49% |

Accept the build if each figure is within 3% of its target. Desktop height falls less than the words on purpose: sections get 112px of padding instead of 80px (that is the "breathe" half of the ask). The pricing card moves from 8.73 to 7.83 screens down on desktop and from 13.55 to 9.64 on phone.

Per section, SALE (words / height in px, before to after):
| Section | Desktop words | Desktop height | Phone words | Phone height |
|---|---|---|---|---|
| bar + nav | 19 to 19 | 41 + 68 | 15 to 15 | 57 + 60 |
| hero `#top` | 225 to **95** | 859 to **859** | 216 to **64** | 1,495 to **762** |
| `#curve` | 91 to **56** | 1,023 to **958** | 94 to **59** | 1,179 to **1,014** |
| `#founder` | 281 to **91** | 1,236 to **972** | 281 to **91** | 1,931 to **1,226** |
| `#why` | 106 to **65** | 987 to **976** | 106 to **65** | 1,009 to **919** |
| `#members` | 506 to **273** | 2,076 to **1,892** | 434 to **240** | 3,799 to **2,751** |
| `#who` | 92 to **32** | 822 to **741** | 92 to **32** | 1,067 to **862** |
| `#honest` | 87 to **42** | 445 to **346** | 87 to **42** | 522 to **303** |
| `#pricing` | 235 to **156** | 1,043 to **851** | 220 to **155** | 1,384 to **1,179** |
| `#faq` | 89 to **47** | 639 to **566** | 89 to **47** | 848 to **696** |
| `#final` | 30 to **30** | 509 to **525** | 30 to **30** | 472 to **480** |
| footer | 85 to **85** | 302 to **302** | 85 to **85** | 614 to **614** |

Repetition, desktop SALE, before to after: "Cancel anytime" 6 to 2 (the card line and the final line), "financial advice" 5 to 3 (the risk line under the card, the FAQ heading, FAQ question 1; the footer disclosure says it in full in its own words), "Welcome to Swarm" 8 to 3, "Card or ACH" 3 to 1, "Jesus Martinez" 8 to 4, quotation marks 22 to 10. Visible gold buttons 5 to 4 (hero, founder, members, final; the card's button is hidden while it shows "Coming soon").

---

## 3. Section by section: the exact final copy

Notation: SALE is the element's text in the HTML. *teaser* / *ended* / *nolink* are its `data-bf-teaser` / `data-bf-ended` / `data-bf-nolink` attributes. `&nbsp;` stays wherever the original has it. Anything not listed is unchanged, word for word and attribute for attribute. Every element that carries state words stays a **leaf element** (text only, no child elements); the prototype has 25 of 25.

The shared gold button markup (`<a class="btn-gold" href="#join"><span class="ring" ...>...</span><span class="bl" data-bf-teaser="See the Black Friday price" data-bf-nolink="See the Black Friday price">Join Swarm</span></a>`) is unchanged wherever a button stays.

### Bar and nav: unchanged
The bar ("Black Friday launch · $49.99/mo locked in · Ends Dec 1, 11:59 PM ET", *teaser* "Checkout opens Nov 24, 12:00 AM ET", See the price, Hide) and the nav button (Join Swarm, *teaser* / *nolink* "See the price") stay exactly as they are. "Ends Dec 1, 11:59 PM ET" is a build-guard string.

### 1. Hero `#top`
| Element | Final copy |
|---|---|
| H1 | Unchanged: Most people need three cycles. / I want to get you there in one. |
| `p.hero-sub` | **I'm Jesus Martinez of JM Crypto. Swarm is my AI crypto trading community on Discord.** |
| `.btn-hero .bl` | Unchanged: Join Swarm; *teaser* and *nolink* "See the Black Friday price" |
| `.hero .cancel` | SALE unchanged (build guard): **$49.99 a month, locked in. Black Friday price ends December&nbsp;1 at 11:59&nbsp;PM&nbsp;ET.** *teaser* unchanged: "$49.99 a month, locked in. Checkout opens November&nbsp;24 at 12:00&nbsp;AM&nbsp;ET, and the price ends December&nbsp;1 at 11:59&nbsp;PM&nbsp;ET." *ended* **changed**: "**$99/mo or $990/yr. Cancel anytime.**" (it takes over the ENDED price the removed chip carried) |
| Left card `.q1` | Becomes the intro video only: **Why I built Swarm** / **Intro video · 4:05** (the existing `a.watch`, unchanged) |
| Scout 03 card `#scout-card` | Unchanged except the definition line goes: Scout 03 / Scanning / Scanning the market / Scan, Analyze, Report / Illustration · not live data |
| Rail | "Inside Swarm", then titles only: **01 Custom AI tools**, **02 My watch list**, **03 Weekly live calls**, **04 Multi-cycle traders** (hrefs unchanged: `#m-tools`, `#m-watch`, `#m-calls`, `#m-traders`) |

Remove:
- `ul.facts` with its four chips (On Discord / Weekly live calls, *ended* "$99/mo or $990/yr" / Cancel anytime, *ended* "Weekly live calls" / Card or ACH through Whop).
- The end of the sub: ", built to get you to the right curve: knowing what you're buying, why, and when to get out" (the curve section says it next).
- `p.hero-note` ("Education and research, not financial advice. The AI tools help you research the market, and every decision stays yours.").
- From `.q1`: the Q09 blockquote ("Being early and being wrong...") and its figcaption (Jesus Martinez, Welcome to Swarm · 3:51 link).
- `p.sc-def` ("Each scout is one of my AI tools: ...").
- The four `span.hr-s` sub-lines.
- On phones (640px and under) both hero cards are hidden by CSS (`.qcards { display: none }`); they stay in the DOM.

The left card becomes exactly:
```html
    <figure class="qcard q1 qvid">
      <a class="watch" href="https://youtu.be/n15W6X84IGg" target="_blank" rel="noopener"><span class="w-thumb face-city" aria-hidden="true"><span class="w-play"></span></span><span class="w-txt"><span class="w-t">Why I built Swarm</span><span class="w-s">Intro video · <span class="dur">4:05</span></span></span><span class="sr-only"> (a video, opens YouTube in a new tab)</span></a>
    </figure>
```
A rail item becomes, for example: `<a class="hr-it" href="#m-tools" data-avoid><span class="hr-n">01</span><span class="hr-t">Custom AI tools</span></a>`

At 1440x900 the hero is still exactly one screen (859px) and ends on the rail. The first gold button's bottom edge sits at y 598 at 1280x800, 783 at 1920x1080, 580 at 1024x768, 578 at 768x1024, 596 at 390x844 and 522 at 360x640: always inside the first screen.

### 2. The curve `#curve`
| Element | Final copy |
|---|---|
| Pill, H2 | Unchanged: The crypto curve / Every cycle has three kinds of people. Only one knows when to get out. |
| Zone titles | Unchanged: Left curve · First cycle / Mid curve · Second cycle / Right curve · Third cycle |
| Left `p` | **Buys because everyone is buying.** |
| Mid `p` | **Got burned. Sells too early.** |
| Right `p` | **Knows what it's buying, why, and when to get out.** |
| `figcaption.fig-foot` | **Illustration · each agent is one person** (centered, alone) |

Remove: `span.fig-you` ("You: first cycle to right curve"), and the whole `div.cta` after the figure (the gold button and "Cancel anytime.", *teaser* "Checkout opens November&nbsp;24."). The crowd canvas, the You tag, `[data-zone]` and `[data-ztag]` stay for `crowd.js`.

### 3. The founder `#founder`
| Element | Final copy |
|---|---|
| Pill | **The founder** (was "The founder · Welcome to Swarm") |
| H2 | Unchanged: Two cycles behind me. / This one is my third. |
| Photo card `a.vcard` | Unchanged: Jesus Martinez / Founder · JM Crypto / Why I built Swarm / Welcome to Swarm · 4:05 |
| Transcript header | Unchanged: Welcome to Swarm · Transcript / JM Crypto · Oct 16, 2026 |
| Transcript body | One row, `3:02` (link `https://youtu.be/n15W6X84IGg?t=182`, unchanged), set as a pull quote: **I stayed through the bear market when everyone else left.** (Q05, verbatim; no `<strong>` now, the whole line is the quote) |
| Cycles | Unchanged: 2021 1st cycle / 2023 2nd cycle / Now 3rd cycle |
| Card footer | **323,452 followers on X and 41.1K subscribers on JM Crypto, as of October 16, 2026.** (the dossier's safe form; both links and their sr-only "(opens in a new tab)" unchanged) |
| Button | Gold button unchanged; no line under it |

Remove: the 2:33 row (server, his brother, three Axies, "tens of thousands of dollars"), the 2:48 row ("It wasn't luck..."), the rest of the 3:02 row after Q05, the old footer ("My story, not a typical result and not a promise of yours." and the source line `Jesus Martinez, "Welcome To Swarm", ...`), "On YouTube since August 2021. Full time in finance for five years.", the `p.proof` below the card (it moves into the card), and the "Cancel anytime." line under the button. **Rule for later: if the 2:33 row (or any money outcome) ever comes back, "My story, not a typical result and not a promise of yours." comes back with it.**

The body and footer become exactly:
```html
        <div class="tr-body">
          <div class="tr-row tr-one">
            <a class="ts" href="https://youtu.be/n15W6X84IGg?t=182" target="_blank" rel="noopener" aria-label="3:02 in the video, opens YouTube in a new tab">3:02</a>
            <p>I stayed through the bear market when everyone else left.</p>
          </div>
        </div>
        <ol class="cycles" aria-label="My cycles"> ...unchanged... </ol>
        <footer class="tr-foot">
          <p class="proof"><a href="https://x.com/JesusMartinez" target="_blank" rel="noopener">323,452 followers on X<span class="sr-only"> (opens in a new tab)</span></a> and <a href="https://www.youtube.com/@jm_crypto" target="_blank" rel="noopener">41.1K subscribers on JM Crypto<span class="sr-only"> (opens in a new tab)</span></a>, as of October 16, 2026.</p>
        </footer>
      </article>
    </div>
    <div class="cta">
      (gold button, unchanged)
    </div>
```

### 4. Why this cycle `#why`
| Element | Final copy |
|---|---|
| Pill, H2 | Unchanged: Why this cycle / Crypto cycles aren't really about crypto. They're about attention. |
| Lede (`div.lede > p`) | **The crowd's money goes to the riskiest bet on whatever everyone is excited about.** |
| Figure | Unchanged: 2021 Games, Since 2023 AI, the three Q04 chips, "Illustration · where the crowd's attention went", "Jesus Martinez · Welcome to Swarm · 2:23" |

Remove from the lede: "In my first cycle, that was games. Since 2023, it's been AI, and the crowd coming back has spent that stretch learning about it. It isn't looking for dog coins. It wants the crypto version of what it already believes in." (the figure shows games then AI; his three lines say what the crowd wants). `#attn`, `.attn-stage`, `.attn-l.a1`, `.attn-l.a2` and `.attn-arrow` stay for `page.js`.

### 5. Members get `#members`
Same 7/5 then 7/5 grid, same four mocks, same ids (`#m-tools`, `#m-watch`, `#m-calls`, `#m-traders`, `#tools-mock`, `#watch-mock`, `#calls-mock`, `#room-mock`). Each card is now its mock, a title and one line.

| Card | Final copy (`div.mtext`) |
|---|---|
| Pill, H2 | Unchanged: Members get / No more believing and hoping. Here's what you get instead. |
| Custom AI tools | chip **In active development** (`span.mchip.mchip-dev`), h3 **Custom AI tools**, p **Built and maintained by me. Join early and you get each one as it's finished. Prices for new members go up as they're completed.** |
| My watch list | h3 **My watch list**, p **So you always know what I'm looking at. Not buy or sell calls.** |
| Weekly live calls | h3 **Weekly live calls**, p **Live portfolio reviews, every week.** (unchanged line) |
| Multi-cycle traders | h3 **Multi-cycle traders**, p **Traders who have made it through several cycles, sharing how they see the market now.** |
| Button | Gold button unchanged; no line under it |

The tools card's text becomes a plain `div.mtext` (the `mtext-2`, `mt-a`, `mt-b` wrappers go):
```html
        <div class="mtext">
          <span class="mchip mchip-dev">In active development</span>
          <h3>Custom AI tools</h3>
          <p>Built and maintained by me. Join early and you get each one as it's finished. Prices for new members go up as they're completed.</p>
        </div>
```

Remove:
- The chips "Always current", "Every week", "Several cycles"; all twelve `ul.mchecks` bullets; `p.mdev`, `p.mdef` ("Each scout is one of my AI tools..."), `p.mwarn` ("AI tools can be wrong...", which stays word for word in the footer disclosure); the "Cancel anytime." line under the button.
- In the tools mock: `span.field-cap` ("Scout field").
- In the Swarm Discord mock: both `div.msg` messages. Keep the empty container as `<div class="msgs"></div>`. Keep the pinned note ("Pinned · Jesus · I show my work; always do your own research."), the channels, the voice channel, the member column and the composer. Update the mock's `aria-label` to: **Illustration of the members-only Swarm Discord: text channels for the market, the watch list, live calls and questions, a weekly live call voice channel, a pinned note from Jesus, and open places for multi-cycle traders and members. Not live data.**

Shown less, by CSS only (the DOM stays, so `page.js` keeps animating it unseen): the console's event log (`.con-loghead`, `.con-log`; `pushLog` still writes `#con-log`), the watch list's public "Why it's on the list" column (`.wl-why`; the locked "Jesus's note · Why it's on the list · Members only" row still says reasons are for members), and the focus line on every portfolio row except the live one (`.cs-sub`). Every mock keeps its "Illustration · not live data" tag (ANTI-SLOP fails a mock without it).

### 6. Who it's for `#who`
| Element | Final copy |
|---|---|
| Pill, H2 | Unchanged: Who it's for / Your first cycle or your second. Either way, this is where you start. |
| Left column | mini curve with "You", eyebrow **First cycle**, h3 **Skip the expensive lesson** |
| Right column | mini curve with "You", eyebrow **Second cycle**, h3 **Get back in with a plan** |

The h3s are the video's own on-screen words. `<article class="who-card" aria-label="From the Welcome to Swarm transcript, 3:39">` becomes `<div class="who-card">` (no transcript is shown any more). Remove: `header.tr-head` (Welcome to Swarm · Transcript, 3:39 link), both `p.who-q` quotes (Q08 and the second-cycle line, which is not in section 3), and `footer.tr-foot`.

### 7. Before you join `#honest`
Keep the sr-only h2 and the pill "Before you join", and the first figure unchanged: **"These moves are violent in both directions and anyone selling you the first half without the second half is selling you something."** Jesus Martinez · The Attention Cycle, Aug 7, 2026 (X link unchanged). Remove `figure.honest-2` (Q14, "I am not going to give you a date...").

### 8. Pricing `#pricing` and the card `#join`
| Element | Final copy |
|---|---|
| Pill | Unchanged: Black Friday · Nov&nbsp;24 to Dec&nbsp;1; *ended* "Join the swarm" |
| H2 | Unchanged: Join by December&nbsp;1, keep $49.99 a month. (*teaser* "Join from November&nbsp;24, keep $49.99 a month.", *ended* "The AI tools are still being built.") / Early on purpose. |
| The card | **Every string unchanged**, with every variant: name, chip, switch, $49.99 /mo, struck $99/mo After Dec&nbsp;1 (`data-bf-sale-only`), "Locked in while you stay subscribed.", "Cancel and rejoin later, and you pay the price at that time." (`#pc-sub` stays: PLANS writes the Yearly renewal line into it), "Ends December&nbsp;1 at 11:59&nbsp;PM&nbsp;ET." (build guard), the three-row ladder (row 1 `data-bf-sale-only`, "$99/mo or $990/yr", "Prices rise as the tools are completed"), "Everything inside Swarm", the hidden `#join-btn`, `#pc-open` ("Coming soon" / "Checkout opens Nov 24, 12:00 AM ET"), `#pc-cancel` "Card or ACH through Whop. Cancel anytime." `page.js` PLANS and `SWARM.bfCard` need no change. |
| Checklist | Short labels in the HTML, two columns: **Custom AI tools / My watch list / Weekly live calls / Multi-cycle traders** (each `<li>` holds just its label; the `ck-s` / `ck-l` spans go) |
| How joining works | Label **How joining works**; **01 Pick your plan**; **02 Check out through Whop** (*teaser* "**Check out through Whop from November&nbsp;24**"); **03 Get access to the Swarm Discord** |
| Risk line `.risk` | Unchanged: **Swarm is education and research, not financial advice. Crypto is volatile and you can lose money, including all of it.** (the one short not-financial-advice line by the card) |

Remove: `p.lede.join-line` with all three variants (each fact in it is on the card in every state: the deadline box, "Locked in while you stay subscribed.", the ladder's "$99/mo or $990/yr" and "Prices rise as the tools are completed"), and `p.how-note` ("Discord access comes right after checkout..."; the FAQ answer says Discord access comes after checkout through Whop). Step 2 loses ", by card or ACH" (the card line says it).

Step 2 becomes: `<li><span class="st-n">02</span><span class="st-t" data-bf-teaser="Check out through Whop from November&nbsp;24">Check out through Whop</span></li>`

### 9. FAQ `#faq`
Pill and H2 unchanged ("Not financial advice. Not a promise. / Here's exactly what you're joining."). **Every question starts closed** (the first `<details open>` loses `open`). Five questions, every question, answer and variant unchanged word for word:
1. Is this financial advice? Who makes the decisions?
2. Where does Swarm happen, and what do I get?
3. Are the AI tools ready?
4. What does "locked in" mean? (*ended* "What happened to the Black Friday price?", a build-guard string)
5. How do I pay, and can I cancel?

Remove: "I'm new, or I got burned last cycle. Is this for me?" and its answer (a near-duplicate of "Who it's for", which Jesus's FAQ rule forbids).

### 10. Final `#final`: unchanged
H2, button and line stay as they are: "Black Friday price ends December&nbsp;1 at 11:59&nbsp;PM&nbsp;ET. Cancel anytime." (*teaser* "Checkout opens November&nbsp;24 at 12:00&nbsp;AM&nbsp;ET.", *ended* "Cancel anytime."). It is the last reason to act and the last reassurance.

### 11. Footer: unchanged
The disclosure stays in full ("Swarm is an educational community. Nothing here is financial ... Payments are processed by Whop."), with the YouTube and X links, Terms, Privacy, Refund policy and the contact address.

---

## 4. CSS: append this block to the end of `core-glow.css`

Overrides only, verified on the prototype. A builder may fold rules into their sections instead; the values are final.

```css
/* ==========================================================================================================
   CONDENSE (design-lab/landing/CONDENSE-PLAN.md, November 2026). Every section stays; each card is a title and one
   line, and the space the cuts free goes back to the page as air. Overrides only, appended after every rule above.
   ========================================================================================================== */

/* ---------- rhythm: more air between sections ---------- */
:root { --sec: 112px; }                                   /* was 80px */
@media (max-width: 1023px) { :root { --sec: 96px; } }
@media (max-width: 640px) { :root { --sec: 64px; } }      /* was 48px */
.cta { margin-top: 56px; }
.lede { margin-top: 28px; }
@media (max-width: 640px) { .cta { margin-top: 40px; } }

/* ---------- 1. hero: no chip row, a one-line sub, the left card is the intro video, the rail is titles only ---------- */
.hero h1 { margin-top: 40px; }
.hero .cta { margin-top: 32px; }
.hero-sub { margin-top: 22px; }
@media (min-width: 1240px) {
  .hero h1 { margin-top: calc(40px + var(--vs) * .05); }
  .hero-sub { margin-top: calc(22px + var(--vs) * .04); }
  .hero .cta { margin-top: calc(32px + var(--vs) * .07); }
  /* the cards still line up with the headline's first line (no chip row above it now) */
  .q1, .q2 { top: calc(var(--core-y) + 2.69 * var(--R) + 18px + 40px + var(--vs, 0px) * .05); }
}
.qcard.qvid { width: auto; padding: 0; background: none; border: 0; }
.qvid .watch { margin-top: 0; gap: 14px; padding: 7px 20px 7px 7px; background: var(--swarm-surface); border-radius: 18px; }
.qvid .w-thumb { width: 56px; height: 56px; }
.qvid .w-t { font-size: 16px; }
.scard .sc-steps { margin-top: 16px; }
.scard figcaption { margin-top: 14px; }
.hr-it { min-height: 76px; align-content: center; row-gap: 0; }
.hr-n { grid-row: auto; padding-top: 0; }
.hr-t { font-size: 17px; }
@media (min-width: 641px) and (max-width: 1239px) { .hr-it { min-height: 68px; align-content: center; } .hr-t { font-size: 15.5px; } .qcards { width: 100%; } }
@media (max-width: 640px) {
  .hero h1 { margin-top: 26px; }
  .hero .cta { margin-top: 26px; }
  /* phones: the two floating cards step out (the founder card is the video, the tools mock has the scouts) */
  .qcards { display: none; }
  .hero { padding-bottom: 8px; }
  .hero-rail { margin-top: 28px; }
  .hr-it, .hr-it:first-of-type { min-height: 60px; padding: 14px 12px; align-content: center; align-items: baseline; }
}

/* ---------- 2. the curve: one short line per zone; the figure closes the section (no CTA) ---------- */
.crowd { margin-top: 56px; }
.zones { margin-top: 8px; }
.zone { padding-top: 24px; }
.zone p { margin-top: 10px; font-size: 18px; }
.fig-foot { justify-content: center; }
@media (max-width: 640px) {
  .crowd { margin-top: 44px; }
  .zone p { font-size: 17px; }
}

/* ---------- 3. founder: one line from the transcript as a pull quote, the cycles, the audience line as the footer ---------- */
.founder-grid .transcript { min-height: 452px; }          /* was 560px; the photo beside it follows the card */
.tr-body { padding: 40px 34px 8px; }
.tr-one { grid-template-columns: 64px 1fr; align-items: start; padding-bottom: 28px; }
.tr-one p { font: 600 clamp(22px, 2vw, 28px)/1.32 var(--swarm-font-body); letter-spacing: -.01em; color: var(--swarm-text); text-wrap: balance; }
.founder .cycles { margin-top: auto; margin-left: 34px; margin-right: 34px; }
.founder .tr-foot { margin-top: 0; padding: 18px 34px 20px; }
.tr-foot .proof { max-width: none; margin: 0; text-align: left; font: 400 15px/1.55 var(--swarm-font-body); color: var(--swarm-text-muted); text-wrap: pretty; }
@media (max-width: 1023px) { .founder-grid .transcript { min-height: 0; } }
@media (max-width: 640px) {
  .tr-body { padding: 26px 18px 4px; }
  .tr-one p { font-size: 21px; }
  .founder .cycles { margin-left: 18px; margin-right: 18px; }
  .founder .tr-foot { padding: 14px 18px 18px; }
  .tr-foot .proof { font-size: 14.5px; }
}

/* ---------- 4. why this cycle ---------- */
.attn-fig { margin-top: 48px; }

/* ---------- 5. members: a title and one line per card; the mocks drop the labels that repeat their card ---------- */
.mg { gap: 24px; margin-top: 64px; }
.mtext { padding: 28px 32px 32px; }
.mtext > h3:first-child { margin-top: 0; }
.mtext h3 { margin-top: 18px; font-size: 26px; }
.mtext > p { margin-top: 10px; max-width: 48ch; color: var(--swarm-text-muted); }
/* agent console: the event log steps out and the four scouts share the console's height (page.js still writes it) */
.con-loghead, .con-log { display: none; }
.console .con-rows { flex: 1; display: flex; flex-direction: column; }
.console .crow { flex: 1; align-content: center; padding: 10px 16px; }
/* watch list: the public "why" column steps out; the locked "Jesus's note" row says the reasons are for members */
.mock-watch .wl-why { display: none !important; }
.mock-watch .wl-head, .mock-watch .wl-row { grid-template-columns: minmax(0, 1fr) 132px; }
/* live call: only the live portfolio keeps its focus line */
.cs-row:not([data-st="LIVE"]) .cs-sub { display: none; }
.cs-row { height: 42px; }
.cs-row[data-st="LIVE"] { height: 50px; }
/* the Discord channel holds the pinned note only: where the card has its own row, the mock is shorter */
@media (min-width: 641px) and (max-width: 1239px) { .c-traders .mock { height: 340px; } }
@media (max-width: 640px) {
  .mg { margin-top: 44px; }
  .mtext { padding: 22px 20px 26px; }
  .mtext h3 { font-size: 22px; }
  .console .crow { padding: 5px 16px 6px; }
  .mock-watch { height: 454px; }                          /* was 484px */
  .mock-watch .wl-row { height: 46px; }
  .mock-watch .wl-head, .mock-watch .wl-row { grid-template-columns: minmax(0, 1fr) 104px; }
  .cs-row, .cs-row[data-st="LIVE"] { height: 38px; }
  .c-traders .mock { height: 256px; }                     /* was 480px: the channel holds the pinned note only */
}

/* ---------- 6. who it's for: the video's two on-screen lines, bigger, with room ---------- */
.who-card { margin-top: 64px; }
.who { padding: 36px 40px 40px; }
.mini { margin-bottom: 28px; }
.who h3 { margin-top: 14px; font-size: clamp(26px, 2.3vw, 32px); }
@media (max-width: 640px) { .who-card { margin-top: 44px; } .who { padding: 26px 22px 30px; } .who h3 { font-size: 24px; } }

/* ---------- 7. before you join: one quote, a little larger ---------- */
.honest-fig blockquote p { font-size: clamp(22px, 2.3vw, 32px); }

/* ---------- 8. pricing: no lede (the card says it); short checklist in two columns; three short steps ---------- */
.checks { grid-template-columns: 1fr 1fr; gap: 9px 16px; }
.how { margin-top: 28px; }
.risk { margin-top: 28px; }
@media (min-width: 1024px) { .how { grid-template-columns: auto minmax(0, 1fr); gap: 32px; } }
@media (max-width: 640px) { .checks { gap: 7px 12px; } }

/* ---------- 9. FAQ: every question starts closed ---------- */
.faq summary { min-height: 66px; }
```

Kept from the kit: gold only on the buttons, the core and $49.99; Unbounded, Hanken Grotesk and JetBrains Mono at their existing weights; radii 28 / 18 / 10; no new glows, shadows or gradients. New classes `qvid` and `tr-one` do not collide with `swarm-site.css` (`.sv-*` only).

**Optional cleanup after it ships** (CSS now unused; leaving it is harmless): `.facts*`, `.hero-note`, `.qcard blockquote`, `.qc-who`, `.qc-ts`, `.qc-av`, `.sc-def`, `.hr-s`, `.fig-you`, `.curve .cta` (and the `@media (min-width: 1240px) and (min-height: 1160px)` rule for it), `.tr-row strong`, `.tr-foot p` / `.tr-src` (the founder footer now holds `.proof`), `.mtext-2`, `.mt-a`, `.mt-b`, `.mdef`, `.mdev`, `.mwarn`, `.mchecks` (keep the shared `.checks li::before`), `.field-cap`, `.who-q`, `.who-card .tr-head .ts`, `.honest-2`, `.join-line`, `.how-note`, `.ck-s`, `.ck-l`. Do not delete `.msg*` (page.js still selects `#room-mock .msg`, harmlessly empty) or anything a script queries.

---

## 5. Why the scripts stay safe (checked on the prototype)

- **hero.js** measures `.hero-copy [data-avoid]` and `.qcard` in loops and skips anything with `offsetParent === null`, so the removed chips and note, and the cards hidden on phones, simply add no boxes. Kept: `#scout-card`, `#sc-state`, `#sc-verb`, `#sc-obj`, `.sc-steps li`, `.spin`, `.hero-sub`, `.hero-rail .hr-in`, `.btn-hero`, `#hero-field`, `#hero-agents`, `#hero-mark`, `#core-anchor`. Scout 03 is still the relay at 1240px and up (it is absolute there); phones never used a relay. `.sc-def` was never read.
- **page.js**: kept `#console .crow`, `#console .con-seg i`, `#con-log` (pushLog still fills it, hidden), `#tools-mock`, `#tools-3d`, `#tools-still`, `#tools-lead path`, `.slabel`, `#tools-replay`, `#watch-mock .wl-row`, `#calls-mock .cs-row`, `#calls-mock .cs-detail`, `#calls-mock .bars i`, `#room-mock`, `#attn` and its labels, every `#pc-*` id, `.seg-switch`, `#join`, `#join-btn`, `#lock-stage`, `#join-field`, `#join-agents`, `#final` with its `.h2 span, .btn-gold, .cancel`, `#final-*`, `#bf-cd`, `#bf-cd-t`, `.bf-x`, `#nav`, `.nav-logo`. `$$('#room-mock .msg')` is now an empty list: `playRoom` iterates nothing and returns. `$$('.btn-gold')` finds one button fewer (the curve's). The removed `.field-cap`, `.mdef`, `.how-note`, `.join-line`, `.who-q`, `.honest-2` and the removed FAQ entry are not queried by any script.
- **crowd.js**: `#crowd`, `#crowd-canvas`, `#crowd-you`, `.yl`, `.yt`, `[data-zone]`, `[data-ztag]` all kept. **tools3d.js**, **lattice.js**: no DOM lookups touched.
- **swarm-site.js** (production) rewires every `https://youtu.be/n15W6X84IGg` link into its player; the hero chip, the photo card, the 3:02 and the 2:23 links all still match.
- **SWARM.bfApply**: every element with `data-bf-*` is still a leaf (25 of 25).
- **Build no-JS guard** (`blackFridayChecks` in `scripts/build-swarm-site.mjs`), replicated on the prototype's static HTML: SALE has all four required strings ("Ends Dec 1, 11:59 PM ET", "Ends December 1 at 11:59 PM ET.", "$49.99 a month, locked in. Black Friday price ends December 1 at 11:59 PM ET.", "$49.99") and none of the forbidden ones. **No guard string changed, so the guard in the build script needs no edit.** No em or en dashes, no martinezaccess, no `$49` without `.99`, no internal notes.
- **ship-ended.mjs**, run with `--early --root` on a copy: "16 words swapped, 3 sale-only elements removed" (bar, struck price, ladder row: its required count of 3 holds), and the ENDED guard then passes ("The Black Friday price ended December 1.", "$99/mo or $990/yr", "What happened to the Black Friday price?" present; none of the ENDED forbidden strings).
- **Live runs** (no `?t=`, full scroll, Yearly tab and back, every FAQ opened) in TEASER, SALE and ENDED at 1440x900, 390x844 and 1440 with reduced motion: no page errors. The only console line is headless Chrome's WebGL "GPU stall due to ReadPixels" warning, which the untouched page prints too.
- **Join links**: the hero, founder, members and final buttons, the nav button and the bar's "See the price" (desktop; the bar hides that link on phones, as before) all land on `#join` with the whole card in view (card top 92px, bottom 501px at 1440x900; 84 to 753px at 390x844), and $49.99 turns gold after the dock. The rail's 04 lands on `#m-traders`.
- No horizontal scroll at 320, 360, 390, 768, 1024, 1280 or 1920 wide.

---

## 6. Builder checklist (verify every line before calling it done)

**Apply**
- [ ] Every HTML change in section 3, and nothing else, in `design-lab/landing/a-core-glow/index.html`. Section ids unchanged: `#top #curve #founder #why #members #who #honest #pricing #join #faq #final`, plus `#m-tools #m-watch #m-calls #m-traders`. `<head>`, the H1, the footer and the legal pages untouched.
- [ ] The CSS block in section 4 appended to the end of `core-glow.css`.
- [ ] No script edited (`git diff --stat` shows only `index.html`, `core-glow.css`, the docs below and the rebuilt `public/swarm-site/`).

**Copy and honesty**
- [ ] Every remaining quote matches FOUNDER-DOSSIER.md section 3 word for word (table in section 1); no other attributed line is left anywhere, including inside mocks (the two Discord messages are gone).
- [ ] "Swarm is education and research, not financial advice..." is under the card; the FAQ heading and answer 1 still say not financial advice; the footer disclosure is complete.
- [ ] Pricing terms intact in all three states: Nov 24 12:00 AM ET, Dec 1 11:59 PM ET, $49.99 locked in while subscribed, cancel and rejoin pays the price at that time, $99/mo, $990/yr, "Prices rise as the tools are completed", "Card or ACH through Whop. Cancel anytime."
- [ ] With "Coming soon" on the card, no new line implies checkout is open ("Check out through Whop" is a step description, as before).
- [ ] No em or en dashes, no martinezaccess, no `$49` without `.99` (the build fails on each of these), and no new numbers or claims.
- [ ] Every mock still shows "Illustration · not live data".

**Scripts and states**
- [ ] `node scripts/build-swarm-site.mjs` passes (its no-JS guard checks the SALE strings in the static page); `npm run lint`, `npm test` and `npm run build` pass.
- [ ] Serve with `next start` and open it as www.joinswarm.ai (Chrome `--host-resolver-rules=MAP www.joinswarm.ai 127.0.0.1:<PORT>`), clock faked to 2026-11-21 (TEASER), 2026-11-25 (SALE) and 2026-12-05 (ENDED), at 1440x900 and 390x844, live and with reduced motion: no page errors; hero, curve crowd, attention band, tools console, watch list, call, Discord and the pricing dock all settle within 5 seconds; no pause buttons.
- [ ] TEASER: the card shows "Checkout opens Nov 24, 12:00 AM ET", step 2 reads "Check out through Whop from November 24", the hero line ends "...and the price ends December 1 at 11:59 PM ET."
- [ ] SALE: the card shows "Coming soon", buttons read "See the Black Friday price", the bar shows "Ends Dec 1, 11:59 PM ET".
- [ ] ENDED: $99 /mo, "Renews monthly until you cancel.", "The Black Friday price ended December 1.", the ladder reads Now $99/mo or $990/yr, the hero line reads "$99/mo or $990/yr. Cancel anytime.", FAQ 4 reads "What happened to the Black Friday price?"
- [ ] On a scratch copy: `node design-lab/landing/black-friday/ship-ended.mjs --early --root <copy>` reports 3 sale-only elements removed, and the ENDED build guard passes on the result. Do not run it on the real repo before Dec 2.
- [ ] Every Join link (hero, founder, members, final, nav, and the bar's link on desktop) lands on `#join` with the price and the button row in view at 1440x900 and 390x844, and $49.99 turns gold.
- [ ] First gold button inside the first screen at 1440x900, 1280x720, 1920x1080, 390x844 and 360x640; at 1440x900 the hero ends on the rail with no empty band; no horizontal scroll at 320 to 1920.
- [ ] Words and heights within 3% of section 2 in all three states.

**Records** (CLAUDE.md: capture as you go, keep failures)
- [ ] Update `a-core-glow/NOTES.md`: the copy inventory (hero sub, hero note gone, scout definition gone, curve lines, founder transcript and proof line, tools / watch / traders lines, Discord messages gone, who quotes gone, Q14 gone, pricing lede gone, joining note gone, five FAQs, all closed) and the Discord mock note at line 55.
- [ ] Update `BLACK-FRIDAY-PLAN.md`: the hero chips' ENDED variants are gone, the hero's ENDED line is now "$99/mo or $990/yr. Cancel anytime.", the "Cancel anytime." / "Checkout opens November 24." lines under the curve, founder and members buttons are gone, the curve button is gone, the pricing lede rows are gone, step 2's text changed.
- [ ] Before and after full-page shots (desktop and phone) kept with the build; nothing committed or deployed without Jesus's go.

---

## 7. For Jesus to approve before this ships

Copy that leaves the page (none of it is replaced by a new claim):
1. **The founder's origin story**: the 2:33 row (server, his brother, three Axies, "two months later they were worth tens of thousands of dollars") and the 2:48 row ("It wasn't luck..."). It stays in the 4:05 video, linked from the photo and the hero. With no outcome left on the page, "My story, not a typical result and not a promise of yours." goes too.
2. **Two credibility lines**: "On YouTube since August 2021." and "Full time in finance for five years." (the 2021 / 2023 / Now timeline and the follower line stay).
3. **Quotes**: Q09 in the hero card ("Being early and being wrong..."), Q06 and the rest of the 3:02 row ("2023 was my second cycle and this is my third..."), Q08 and the second-cycle line in "Who it's for", Q14 ("I am not going to give you a date..."). The second-cycle line and "And so that's why I built Swarm, an AI crypto trading community for the new era." are not in section 3, so they would have to go under the quote rule anyway.
4. **The two Discord mock messages from him** (verbatim from the video at 3:18, but not in section 3). The channel now shows only his pinned note. If he wants a message from him in it, it has to be a section-3 line; Q07 ("You get custom AI tools that, you know, I build and maintain myself to trade the markets.") is the closest fit. His call.
5. **No not-financial-advice line in the first screen.** It is under the pricing card, in the FAQ heading and first answer, and in the full footer. If he or counsel want it up top, the cheapest fix is the old hero note as one 14px line under the price line (about 20 words, 20px).
6. **The hero chip strip** (On Discord, Weekly live calls, Cancel anytime, Card or ACH through Whop), a piece of the joinasymmetric reference. Discord is in the sub; the rest is on the card. In ENDED the price moves into the hero line.
7. **Phones lose the hero cards** (the intro video chip and Scout 03); the founder card is the video, three screens down.
8. **One gold button fewer**: the curve's (his revolving highlight stays on the other four and on the card's).
9. **FAQ**: "I'm new, or I got burned last cycle. Is this for me?" goes (he approved six; "Who it's for" says the same), and every answer starts closed.
10. **Other cuts**: the scout definition, the twelve member bullets, "AI tools can be wrong..." on the tools card (word for word in the footer), the pricing lede, "Discord access comes right after checkout. The AI tools arrive one by one...", the curve caption "You: first cycle to right curve", Q14.
11. **Lines rewritten around his words** (not quotes, no new claims): the hero sub (shortened), the three curve lines, the why-now lede (shortened to its first sentence), the tools, watch list and traders card lines, and the joining steps.

---

## 8. A pre-existing issue, not part of this build

In ENDED with no Standard checkout link, the nav and every gold button read "Join Swarm" while the card shows "Coming soon", because `SWARM.bfApply` uses `data-bf-nolink` only during SALE (second head script of `index.html`, line 99). The untouched page does the same. It brushes against "nothing may imply checkout is open while the card shows Coming soon". If the Standard Whop link is still missing on Dec 2, fix it in its own change: in ENDED without the Standard link, the gold buttons should read "See the price" (the gold buttons' existing nolink text names the Black Friday price, so ENDED needs its own wording, for example a `data-bf-endednolink` attribute or one rule in `bfApply`). Raise it with Jesus; it touches the head script, which this plan leaves alone.

---

## Reference: the prototype

Throwaway, in the session scratchpad (it may be cleared): `/tmp/claude-0/-home-user/fdc58892-55e5-54b6-a74d-8da9a91cd372/scratchpad/condense/final/`, with `landing/a-core-glow/` (the merged page), `edit_html.py` (applies every HTML change above; each replacement must match exactly once, so it also proves the lab copy has not drifted: `python3 -I edit_html.py <path to index.html>`), `condense.css` (the block in section 4), `index.html.diff`, `core-glow.css.diff`, `desktop-full.png`, `phone-full.png`, `desktop-overview.png`, `views/` (first screens at nine sizes, the pricing card in all three states at 1440 and 390) and `work/metrics-*.json`. The three source proposals are next to it in `editor/`, `art-director/` and `strategist/`.
