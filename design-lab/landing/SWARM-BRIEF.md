# Swarm brief

## Decisions (October 16, 2026)

- **The page is 100% the Swarm offer.** It is the landing page for the agentic AI crypto trading community, not a personal site. Jesus appears as the founder (his story, his face, his voice) inside it. martinezaccess.com stays his personal site and links here.
- **Because the whole page is a Swarm page, the Swarm brand kit applies to the whole page:** the `.swarm` wrapper goes on the page root, the Swarm og:image and Swarm icons go in its head. The three style directions differ in composition, motion language, narrative and texture, all inside the kit's colors and fonts.
- **Domain:** `joinswarm.ai` is the recommended domain (not yet bought). Until it exists, previews live in the design lab.
- **Checkout:** Whop embedded checkout on the page. Whop plan IDs are `[DATA NEEDED]`.
- **Taste reference from Jesus:** https://www.joinasymmetric.xyz/ (a paid trading community page). Reference only, never copy its layout, copy, assets or code. See "Taste notes" below.
- **The graphics:** original 2D and 3D motion that amplifies the agentic feel: many independent agents sensing, deciding and converging on one signal, which is also the Hive Core logo's meaning.

## Pricing (from Jesus's pre-launch checkout screenshot, October 16, 2026)

- Eyebrow: `// PRE-LAUNCH · JOIN THE SWARM`. Headline: **Early on purpose.**
- "The first 50 founding seats lock in $49/month forever. After that it goes to $99/month. Cancel anytime."
- Plans, in this order:
  1. **Founding Monthly, $49/mo.** "Forever. Cancel whenever. 50 seats only." Renews at $49.00 per month.
  2. **Standard Monthly, $99/mo.**
  3. **Yearly, 2 months free.** The yearly price is not shown; on the $99 standard plan that would be $990/year. Show "2 months free" and mark the price `[CONFIRM: $990/yr?]` until Jesus confirms.
- Checkout takes card or ACH (Whop).
- Not provided, so never invented: how many founding seats are left, member count, testimonials, results, a launch date, a refund policy beyond "cancel anytime".
- The screenshot's checkout used a condensed italic display face. The brand kit's type (Unbounded, JetBrains Mono, Hanken Grotesk) wins on the page; the copy and prices above are what to follow.

## Taste notes: joinasymmetric.xyz (principles only)

What makes it feel good, as principles to learn from:
- Product mocks are the content: every benefit is shown as a working piece of the product (a live stream with chat, a vault of interviews, a tool mid-scan, a live position tracker), not described with icons.
- Proof is close to every claim, and every claim is concrete.
- The founder story is a personal, first-person piece set apart from the sales copy.
- One primary call to action, repeated at natural stopping points, with "Cancel anytime" under it.
- Atmosphere behind the hero (light and depth), very dark ground, one saturated accent.
- Pricing is laid out as an itemized reveal ending on one price.

What not to take: its blue light-beam hero, serif-italic accent words, tilted testimonial cards, email-format story, value-stack dollar figures, or any wording. Swarm has no testimonials, member counts or results yet, so none appear.

## The video

Source: Jesus's intro video "Welcome To Swarm | AI Agentic Trading", JM Crypto, published October 16, 2026, 4:05 long. https://youtu.be/n15W6X84IGg

The notes below come from a vidIQ watch-through of the video on October 16, 2026 (scene breakdown, near-verbatim transcript, on-screen text). Captions were not yet available from YouTube. Re-check the quotes against the official captions once they appear.

## What Swarm is

- **Name:** Swarm
- **Line under the logo:** "AI Crypto Trading Community" and "For The New Era"
- **What members get (his words, in order):**
  1. **Custom AI tools** that he builds and maintains himself to trade the markets
  2. **His watch list**, so you always know what he is looking at
  3. **Weekly live calls** with live portfolio reviews
  4. **Multi-cycle traders**: traders who have made it through several cycles sharing how they see the market now
- **Who it is for:**
  - First cycle: "this saves you from learning it the expensive way" (on screen: SKIP THE EXPENSIVE LESSON)
  - Second cycle, burned and waiting on the sideline: "this is how you get back in with a plan" (on screen: GET BACK IN WITH A PLAN)
- **Call to action:** "If you want to be on the right side of this cycle, hit the button below and join Swarm. I'll see you inside."
- **Not stated anywhere in the video:** price, launch date, member count, results, or the join link. On any page these are `[DATA NEEDED]`. Never invent them.

## The idea the video sells

- **The crypto curve.** Every cycle has three kinds of people. Left curve (first cycle): buys because everyone is buying, no idea when to sell. Mid curve (second cycle): got burned, overthinks, sells too early. Right curve (third cycle): looks like left curve from outside because both are buying, but knows what it is buying, why, and when to get out.
- **The promise:** "Most people need three cycles and a lot of pain to get there. I want to get you there in one."
- **The thesis:** cycles are about attention, not crypto. The crowd's money goes to the riskiest bet on whatever everyone is excited about. Since 2023 that is AI. The money coming back is a more informed crowd that wants "real things, real revenue, real users".
- **His cycles:** 2021 (first), 2023 (second), now (third). "I'm doing the same deep work on AI that I did on gaming."
- **Closing line worth reusing:** "Being early and being wrong feel the same. I want you to be early and actually know exactly why."

## His story as told in this video (use this version on Swarm-related copy)

In 2021 he was working as a server and studying economics. His brother had just lost everything trading. For his brother's birthday he gave him three Axies (Axie Infinity creatures); two months later they were worth tens of thousands of dollars, which helped his brother get back on his feet. "It wasn't luck. I grew up playing video games, so I understood how these game economies worked." He did the same with other crypto games, which started the channel. He stayed through the bear market.

The website's existing story ($700 into Axie Infinity, half of what he had in the bank, grown to mid-five figures through the breeding market) is also his own account. Both can stand; do not merge them into new numbers.

## Market figures in the video (do not use on the page without a source line)

The video cites Activision up about 2.5x in 2020, Axie Infinity up over 1,000x with over $4 billion in revenue in a calendar year, riskier AI stocks up 4x to 10x, and Robinhood crypto trading volume up 61% in August 2026 in one month. These have not been verified for the website. Leave them off the landing previews, or mark them `[SOURCE NEEDED]`.

## Swarm brand kit (binding for anything Swarm)

The approved kit lives at `public/brand/swarm/` with its handoff doc at `docs/swarm-brand.md` (from the `swarm-brand` branch, brought in on October 16, 2026). **Read `docs/swarm-brand.md` and follow it.** Where this brief or any direction disagrees with the kit, the kit wins. In the design lab, `design-lab/landing/brand` links to `public/brand`, so prototypes reference `../brand/swarm/...`.

The rules that matter most for the previews:

- **Logo: Hive Core.** Use the SVG files in `brand/swarm/logo/` as they are, in an `<img>`. Never rebuild the mark, re-type `SWARM`, recolor it, or light a second cell. Default lockup `swarm-horizontal-for-dark-bg.svg` (hero, footer); `swarm-horizontal-compact-for-dark-bg.svg` under 240px wide; `swarm-stacked-for-dark-bg.svg` for square spaces; `swarm-mark.svg` alone on dark; `swarm-mark-flat.svg` under 48px or over photos. Minimum sizes: mark 24px tall, horizontal 160px wide, compact 120px, stacked 96px. `alt="Swarm"` on lockups, `alt=""` when the word Swarm sits next to the mark.
- **Tokens are scoped.** Load `brand/swarm/swarm-tokens.css` and put every Swarm section inside a `.swarm` wrapper. The `--swarm-*` tokens and the Swarm fonts apply only inside that wrapper, never to the rest of the page, which keeps its own direction's look.
- **Color inside `.swarm`:** ink-first (`#0B0B0D` ground, `#EEEBE4` text, `#8E8A80` muted). Gold `#F5C542` is the signal: the core cell, ONE primary button per view, one highlighted number. Text on gold is `#141416`. Never a gold section background. Grey `#55555B` is for hex outlines only, never text. No gradients except the core cell's radial gradient and soft glow. No drop shadows; borders are 1px `#232328`.
- **Type inside `.swarm`:** Unbounded 600 headlines (uppercase only on short title cards, +0.06em tracking), JetBrains Mono 500 for labels and numbers (labels uppercase, +0.32em tracking), Hanken Grotesk 400 for paragraphs. Never paragraphs in Unbounded.
- **Shape inside `.swarm`:** radius 28px panels, 18px buttons and inputs, 10px chips. No emoji.
- **The only decorative pattern** is the honeycomb field: pointy-top hex outlines in `#1C1C21` fading toward the edges, exactly one gold lit cell and its six neighbours outlined in `#55555B` (see `brand/swarm/social/swarm-x-header-1500x500.png`). Keep text off the lit cell. Motion built for Swarm (3D or 2D) animates this field and the idea "the swarm converges on one signal"; it never builds a 3D or redrawn copy of the mark and never lights a second cell.
- **Meta:** Swarm pages use `brand/swarm/social/swarm-og-1200x630.png` as og:image and Twitter card, and the Swarm icons in `brand/swarm/icons/`. The landing page itself is a martinezaccess.com page, so it keeps the site's own og:image and favicon; a dedicated Swarm page gets the Swarm ones.

## Visual language in the video (secondary to the kit)

- The video's lower thirds use a condensed uppercase sans, mono eyebrow labels with `//` separators (`CASE STUDY // 2020`, `SWARM // MEMBERS GET`), and dark panels with thin gold borders. Its gold reads slightly warmer than the kit's; use the kit's `#F5C542`.
- Motion: technical HUD cards, line charts that plot themselves, a gold bell curve with left, mid and right zones lighting up.
- Frame `assets/swarm-intro-frame.jpg` is YouTube's auto thumbnail (Jesus at the mic with two lower thirds). The video's logo reveal is at 3:18; we cannot extract frames until we have the file. For a poster, prefer a composed panel with the kit lockup over the auto thumbnail.

## Video on the page

Artifact previews cannot embed YouTube, so the preview shows a designed poster with a play control that opens the video on YouTube. The production site will embed it inline (youtube-nocookie, click to load). A short muted loop needs the original file, shared from Google Drive with "Anyone with the link".

## Brand note

Swarm's kit is ink with a single gold signal. Gold on ink is also The Attention Cycle's palette, and the JM Crypto channel is cyan. Keep Swarm's gold inside the `.swarm` sections; the rest of the landing page carries its own direction's palette, so the page as a whole reads as Jesus's site with a Swarm section, not as a Swarm or Attention Cycle asset.
