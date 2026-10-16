# Direction C: Three Cycles

## The idea

His story is the motion: three honeycomb planes labelled 2021, 2023 and NOW hang in depth, agents scan each one and fall through toward NOW, then a dolly zoom with a crane to top-down collapses the parallax until the three lattices register into one field and the official Hive Core lands on the lit cell. Three cycles become one view, which is the promise in the headline, "I want to get you there in one", and the rest of the page is founder-led: the crowd under the curve labelled by cycle, a transcript card with a three-node timeline as the centerpiece, and quote cards as pull quotes between sections.

## Files

- `index.html`: the page (structure follows the shared architecture in `DIRECTIONS.md`, flow and density modelled on joinasymmetric.xyz).
- `c.css`: all styles, kit tokens only.
- `hero.js`: the hero (ES module). One simulation and one camera drive two renderers: Canvas 2D from first paint, then Three.js r160 (3 draw calls) fades in over it when the CDN module arrives. No WebGL means the 2D renderer keeps going. `?t=<ms>` freezes a frame, `?reduce=1` forces the reduced-motion still, `?gl=0` forces the 2D renderer.
- `page.js`: crowd under the curve, the YOU tick, founder timeline, agent swimlanes, watch list, live call level strip, plan switch, and the Whop stub (`PLANS` map with `whopPlanId: null` and `mountCheckout(planKey)`).
- `media/`: `fold-desktop.png`, `fold-phone.png`, `hero-desktop.mp4`, `hero-phone.mp4`, `scroll-desktop.mp4`.

## Placeholders and data needed

Visible on the page as small mono chips:

- `[DATA NEEDED: Whop plan IDs]` in the checkout slot. The slot is a dashed placeholder; no Whop script loads in the preview. Swapping in the IDs is one line per plan in `PLANS` in `page.js`, then replace the stub body of `mountCheckout`.
- `[DATA NEEDED: day and time]` on the live call mock, and `[DATA NEEDED: call day and time]` in the FAQ.
- `[DATA NEEDED: guest names]` on the traders room mock. Names and messages are redaction bars; the `TRADER · 3 CYCLES` tags are illustrative.
- `[DATA NEEDED: where Swarm lives]` in How joining works and the FAQ.
- `[DATA NEEDED: refund policy]` in the FAQ.
- `[CONFIRM: the tools do not place trades]` in FAQ 1.
- `[CONFIRM: what happens if a founder cancels and rejoins]` in the "$49 forever" answer.
- `[DATA NEEDED: Terms, Privacy and Refund policy links, legal entity name]` in the footer.

Not shown as chips, but placeholders all the same:

- The watch list contents are redaction bars, because the list is members only and was not provided.
- The swimlane, watch list, live call and traders mocks are illustrations, each labelled `ILLUSTRATION · NOT LIVE DATA`. The swimlane time axis is the visitor's own time on the page.
- The video is a composed poster panel that opens https://youtu.be/n15W6X84IGg in a new tab. Production should embed it with youtube-nocookie, click to load.
- The footer disclosure leaves out the two unconfirmed lines (registered adviser status, and Jesus holding assets discussed in Swarm) until Jesus confirms them.
- Footer links use https://x.com/JesusMartinez and https://www.youtube.com/@jm_crypto, the handles already used in the site code.

Every quote with quotation marks or a timestamp is verbatim from `swarm-intro-transcript.md` with its real timestamp, and links to that moment on YouTube. The only numbers are the brief's prices, 50 seats, 2 months free, 2021, 2023, 4:05, the video timestamps and publish date, and "2020", which sits in the Why now paragraph with a source line (intro video, 0:40 to 2:15).

## Known issues

- All motion was measured in headless Chrome with software GL (SwiftShader), not on a phone. There the desktop hero draws about 9 frames a second (phone about 17), so `hero-desktop.mp4` looks steppy and reaches the lit core near the end of the 7 second clip. The simulation keeps real time by taking more steps per frame, so the story still settles about 4.7 seconds after it starts. Check on an iPhone 12 class device before launch.
- The hero needs the Unbounded headline font to place the core between the two headline lines. It waits up to 600 ms for it; if the font arrives later, the field and agents shift to the new core position mid-animation instead of rebuilding.
- After the core lands, a few scouts keep patrolling at low opacity (rendered at about 30 fps). They pause offscreen, when the tab is hidden, and with the visible Pause motion control. The chips marquee, crowd, swimlanes, live call level strip and typing dots follow the same pause control and stop offscreen.
- The floating quote cards beside the hero headline only show at 1180px and wider. Between 641px and 1179px they are hidden, and those tablet widths were not reviewed in detail.
- The page is about 12,900px tall on desktop (about 14 viewports), longer than the 7 to 10 viewport target in `RESEARCH-NOTES.md`, mostly from the founder centerpiece and the members grid. Asymmetric itself is about 14,600px.
- The live call photo (`jesus-studio-arms.jpg`) has a yellow JM Crypto sign in the background. It is part of the photo, not UI gold, but it adds a warm spot in the members section.
- Full-page screenshots for review were stitched from viewport captures (the stock full-page capture repeated the hero on this page), so the sticky nav appears only in the first chunk.
