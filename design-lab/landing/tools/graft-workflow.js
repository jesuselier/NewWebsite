export const meta = {
  name: 'swarm-graft-and-verify',
  description: 'Graft the bake-off winners into Core Glow, then four independent reviews and a fix round',
  phases: [
    { title: 'Review', detail: 'reference judge, motion and craft judge, buyer judge, code auditor' },
    { title: 'Fix', detail: 'apply all findings, QA, re-capture, re-record' },
  ],
}

const SP = '/tmp/claude-0/-home-user/fdc58892-55e5-54b6-a74d-8da9a91cd372/scratchpad'
const REPO = '/home/user/NewWebsite'
const LAB = REPO + '/design-lab/landing'
const TOOLS = SP + '/tools'
const d = args.dir
const CD = args.cdNotes
const MAX_ROUNDS = args.maxRounds || 3
const PASS = 8.5

const BRIEF_FILES = `${LAB}/SWARM-BRIEF.md, ${LAB}/DIRECTIONS.md (shared architecture and direction ${d.key}), ${LAB}/ANTI-SLOP.md, ${LAB}/FOUNDER-DOSSIER.md (sections 2, 3, 5, 8, 9 and 10: story beats, the verbatim quote bank which is the authority for every quote and timestamp, conflicts, founder drafts, do-not-say, and the Unverified list that must never be used), ${LAB}/swarm-intro-transcript.md, ${REPO}/docs/swarm-brand.md`
const REF_SHOTS = `${SP}/taste/asym-tile0.png to asym-tile5.png and ${SP}/taste2/cta-d.png, cta-p.png`

const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    scores: { type: 'object', additionalProperties: { type: 'number' } },
    average: { type: 'number' },
    gateFails: { type: 'array', items: { type: 'string' } },
    fixes: { type: 'array', items: { type: 'string' }, description: 'ranked, max 8, concrete and checkable' },
    verdict: { type: 'string', description: 'two sentences: what would make this outstanding' },
  },
  required: ['scores', 'average', 'gateFails', 'fixes', 'verdict'],
}
const AUDIT_SCHEMA = {
  type: 'object',
  properties: {
    blocking: { type: 'array', items: { type: 'string' }, description: 'must-fix violations with file:line' },
    fixes: { type: 'array', items: { type: 'string' } },
    checked: { type: 'string', description: 'what was checked' },
  },
  required: ['blocking', 'fixes', 'checked'],
}

function shotsList(dir) {
  return `Screenshots in ${dir}/ (LOOK at them with Read; list the folder first): settled-desktop-fold.png and settled-phone-fold.png (page at rest), t1500/t3000/t4800-*-fold.png (hero motion frames), reduced-*-fold.png (reduced-motion still), d-NN.png (whole page on desktop in order) and p-NN.png (whole page on phone in order), motion-desktop-NN.png and motion-phone-NN.png (frames every 0.5s from the hero recording; the recorder runs on software rendering, so judge composition and choreography, not frame rate), report.txt (console and overflow report).`
}

const CONTEXT = `The page: direction ${d.key}, "${d.name}", of the launch page for Swarm, Jesus Martinez's pre-launch AI crypto trading community (joinswarm.ai), sold to men around 40, many first-time investors, some burned last cycle. Jesus wants it to look and flow like joinasymmetric.xyz (reference: ${REF_SHOTS}) inside the Swarm brand kit, with original 2D and 3D motion that makes the agentic idea feel alive, and he said this is the most important launch of his life: it has to look outstanding, not just correct.`

async function round(r, dir) {
  const S = shotsList(dir)
  const judges = await parallel([
    () => agent(`${CONTEXT}\n\nYou are judging REFERENCE FIT AND ENERGY from screenshots only. Do not open any code. Compare against the reference screenshots. ${S}\nRead ${LAB}/ANTI-SLOP.md and the taste section of ${LAB}/SWARM-BRIEF.md. Score 0 to 10: flow (section order and pacing like the reference), density (as rich as the reference without clutter), energy (does the first screen grab you like the reference), premium (would this pass for a top studio), conversion (is Join Swarm unmissable and repeated well). average = mean. List ANTI-SLOP violations, then up to 8 ranked fixes, each concrete (what, where, to what) and checkable on a screenshot.`,
      { label: `r${r}:ref`, phase: 'Review', schema: JUDGE_SCHEMA }),
    () => agent(`${CONTEXT}\n\nYou are judging MOTION AND CRAFT from screenshots and frame sequences only. Do not open any code. ${S}\nRead ${LAB}/ANTI-SLOP.md and ${REPO}/docs/swarm-brand.md. Score 0 to 10: motion drama (is the hero motion a memorable, cinematic moment that fills the first screen, or a timid band), agentic read (does it read as many independent agents sensing, deciding and converging on one signal within 3 seconds), legibility (no motion over glyphs at any frame, text always readable, reduced still complete), typography and spacing craft (scale, rhythm, alignment, consistency across sections), mock craft (do the product mocks look like real, dense, beautiful product UI). average = mean. List violations, then up to 8 ranked fixes with exact numbers (sizes, counts, opacities, timings, positions).`,
      { label: `r${r}:motion`, phase: 'Review', schema: JUDGE_SCHEMA }),
    () => agent(`${CONTEXT}\n\nYou are a 42-year-old who got burned in 2021 and is wary of crypto gurus. You found this page from Jesus's YouTube video. Judge from screenshots only (do not open code). ${S}\nRead the facts in ${LAB}/FOUNDER-DOSSIER.md sections 2, 3 and 9 and the pricing in ${LAB}/SWARM-BRIEF.md so you know what is true and allowed. Score 0 to 10: clarity (in 10 seconds, do I know what Swarm is, what I get, what it costs), trust (does it feel honest, no hype, no fake proof, real person), founder (does his story land and feel real), objections (are my worries answered: is this advice, will AI trade for me, what if I cancel, is it for beginners), desire (do I want to join). average = mean. List anything that feels fake, confusing, repetitive or salesy, then up to 8 ranked copy or layout fixes. Copy fixes may only use facts in the dossier, the transcript and the brief.`,
      { label: `r${r}:buyer`, phase: 'Review', schema: JUDGE_SCHEMA }),
    () => agent(`${CONTEXT}\n\nYou are the CODE AUDITOR. Read the page source: ${LAB}/${d.slug}/ (index.html and every .js and .css there). Read ${BRIEF_FILES}, ${REPO}/public/brand/swarm/swarm-tokens.css and ${LAB}/RESEARCH-NOTES.md. Check and report with file:line:\n1. Brand kit: logo SVGs from ../brand/swarm/logo used as they are (no redraw, recolor, crop or mask of the mark; the honeycomb field pattern with one lit cell is allowed, but the mark itself may not be altered); gold only as the core cell, one primary button per view and one number per view; kit fonts only; radii 28/18/10; no box-shadow, text-shadow, filter glow or gradients except the core cell's glow; #55555B never used for text.\n2. Honesty: every quote, quote card and timestamp matches FOUNDER-DOSSIER.md section 3 word for word (or swarm-intro-transcript.md); nothing from the dossier's Unverified section; "It wasn't luck" only inside the full transcript card; no numbers beyond those allowed in ANTI-SLOP.md; no testimonials, counts, results; every mock labelled as an illustration; [DATA NEEDED] and [CONFIRM] chips present where facts are missing.\n3. Tech: only allowed hosts (jsdelivr, cdnjs, unpkg scripts; Google Fonts); Three.js loaded after first paint with a fallback; rAF paused offscreen and when hidden; DPR capped; agent counts within RESEARCH-NOTES budgets; prefers-reduced-motion and ?reduce=1 give the settled still with no loops; no text drawn into canvas or WebGL; semantic headings in order; visible focus; alt text; FAQ as <details>; no em or en dashes in visible text or JS strings.\nAlso read ${dir}/report.txt for console errors and overflow. Put must-fix items in blocking; improvements in fixes.`,
      { label: `r${r}:audit`, phase: 'Review', schema: AUDIT_SCHEMA }),
  ])
  return { ref: judges[0], motion: judges[1], buyer: judges[2], audit: judges[3] }
}

const history = []
const START = args.startRound || 1
let dir = `${SP}/polish/${d.slug}/r${START}`
if (args.graft) {
  // Apply the owner's notes first, then review the result.
  phase('Fix')
  const pre = await agent(`${CONTEXT}\n\nYou are the lead developer and designer. A creative bake-off in ${LAB}/a-lab/ built four hero concepts (h1 Rising Routes, h2 Signal Handoff, h3 Push-in, h4 Scroll Convergence) and two signature moments (m1 The Crowd, m2 Lock In Your Seat) as copies of this page, and blind judges picked what to keep. Your job: GRAFT the winners into ${LAB}/${d.slug}/ exactly as ${LAB}/a-lab/GRAFT-PLAN.md says. Read GRAFT-PLAN.md first, then each winning concept's folder and CONCEPT.md, then ${BRIEF_FILES}, ${LAB}/RESEARCH-NOTES.md and ${LAB}/${d.slug}/NOTES.md.\n\nIMPORTANT: ${LAB}/${d.slug}/ has moved on since the lab copied it (a-lab/_base is the old copy): it now carries all of Jesus's notes (weekly calls with no day or time, Discord, the founding price policy, the "Why I built Swarm" caption, at most six FAQs, the legal footer links, support@joinswarm.ai, no martinezaccess.com anywhere, hexagonal crowd nodes with real spacing, the fluid attention band with a clean end state, no pause buttons, his photos, Asset rows, the revolving Join Swarm highlight, Scanning / Analyzing / Reporting, AI tools in active development with prices rising as they are completed) plus later review fixes. Port the winning code INTO the current page; never copy a lab folder over it, and never undo any of those notes. If the plan conflicts with Jesus's notes or the brief, the notes and the brief win; record the call in NOTES.md. Do not touch terms.html, privacy.html, refunds.html or legal.css.\n${args.preFix ? `\nExtra notes:\n${args.preFix}\n` : ''}\nKeep the technical contract: standalone page with the CSP meta, kit tokens via ../brand/swarm/swarm-tokens.css, class="swarm" on body, Google Fonts, Three.js r160 via the import map, ?t=<ms> freeze and ?reduce=1 still, window.__heroSeek(ms) if the hero has it, every animation plays once and settles within 5 seconds, pause offscreen and when hidden, all words in the DOM, no em or en dashes, no hosts beyond the allowlist, no git commits, do not edit shared files, the a-lab folders or other directions' folders.\n\nVerify with renders until the graft is right and nothing regressed: bash ${TOOLS}/shootall.sh ${d.slug} ${dir}-pre 8820, LOOK at the folds, the t1500/t3000/t4800 frames, the reduced still and every tile; compare against the winning concept's captures; fix and repeat. Then re-record: node ${TOOLS}/rec.mjs http://127.0.0.1:8820/${d.slug}/index.html ${LAB}/${d.slug}/media/hero-desktop.mp4 8 desktop 0, hero-phone.mp4 8 phone 0, scroll-desktop.mp4 28 desktop 1; and regenerate ${LAB}/${d.slug}/media/hero-desktop-frames.mp4 and hero-phone-frames.mp4 with node ${LAB}/tools/frames.mjs (see its header). Final capture for review: bash ${TOOLS}/shootall.sh ${d.slug} ${dir} 8820, and copy ${dir}/settled-desktop-fold.png and settled-phone-fold.png to ${LAB}/${d.slug}/media/fold-desktop.png and fold-phone.png. Add a "Graft" entry to NOTES.md (what was grafted from where, what was left out and why). Return a short summary.`,
    { label: `graft`, phase: 'Fix' })
  history.push({ round: 'graft', fix: pre })
}
for (let r = START; r < START + MAX_ROUNDS; r++) {
  phase('Review')
  const rv = await round(r, dir)
  const avgs = ['ref', 'motion', 'buyer'].map(k => rv[k] ? rv[k].average : 0)
  const blocking = rv.audit ? rv.audit.blocking.length : 99
  const gates = ['ref', 'motion', 'buyer'].reduce((n, k) => n + (rv[k] ? rv[k].gateFails.length : 0), 0)
  history.push({ round: r, ref: avgs[0], motion: avgs[1], buyer: avgs[2], blocking, gates })
  log(`${d.key} round ${r}: ref ${avgs[0]}, motion ${avgs[1]}, buyer ${avgs[2]}, blocking ${blocking}, gates ${gates}`)
  if (Math.min(...avgs) >= PASS && blocking === 0 && gates === 0) { log(`${d.key} passed at round ${r}`); break }
  if (r === START + MAX_ROUNDS - 1) { log(`${d.key} reached the round limit; last findings are left in NOTES.md`) }
  phase('Fix')
  const next = `${SP}/polish/${d.slug}/r${r + 1}`
  const fix = await agent(`${CONTEXT}\n\nYou are the lead developer and designer finishing this direction. The page is ${LAB}/${d.slug}/index.html with its .js and .css files in ${LAB}/${d.slug}/. Read ${BRIEF_FILES}, ${LAB}/RESEARCH-NOTES.md and ${LAB}/${d.slug}/NOTES.md first, and look at the reference (${REF_SHOTS}) and the current screenshots in ${dir}/.\n\nRound ${r} reviews (JSON):\n${JSON.stringify(rv, null, 1)}\n\n${r === 1 ? `Creative director notes (apply these too; they take priority over a reviewer when they conflict):\n${CD}\n\n` : ''}Apply every blocking item, every gate failure and the ranked fixes; where reviewers conflict, choose what makes the page more outstanding and stays inside the brief and the kit, and note the call in NOTES.md. Make the motion and the product mocks genuinely impressive: this is the bar.\n\nKeep the technical contract: standalone page with the CSP meta, kit tokens via ../brand/swarm/swarm-tokens.css, class="swarm" on body, Google Fonts for the kit fonts, Three.js r160 via the import map from cdn.jsdelivr.net, ?t=<ms> freeze and ?reduce=1 still, pause offscreen and when hidden, all words in the DOM, no em or en dashes, no external hosts beyond the allowlist, no git commits, do not edit shared files or other directions' folders.\n\nVerify before you finish:\n1. Serve the lab if needed (cd ${LAB} && (npx --yes http-server -p 8820 -c-1 -s . > /dev/null 2>&1 &)) and run: bash ${TOOLS}/shootall.sh ${d.slug} ${next}-pre 8820. LOOK at the fold shots, the t3000 frames, the reduced still and every tile; fix what is wrong; repeat until it is right.\n2. Re-record motion: node ${TOOLS}/rec.mjs http://127.0.0.1:8820/${d.slug}/index.html ${LAB}/${d.slug}/media/hero-desktop.mp4 8 desktop 0, then hero-phone.mp4 8 phone 0, then scroll-desktop.mp4 28 desktop 1 (each under 8 MB).\n3. Final capture for the next review round: bash ${TOOLS}/shootall.sh ${d.slug} ${next} 8820, and copy ${next}/settled-desktop-fold.png and settled-phone-fold.png to ${LAB}/${d.slug}/media/fold-desktop.png and fold-phone.png.\n4. Update ${LAB}/${d.slug}/NOTES.md: a "Round ${r}" entry with the review averages, what you changed, and anything you skipped and why.\nReturn a short summary of what changed.`,
    { label: `r${r}:fix`, phase: 'Fix' })
  history[history.length - 1].fix = fix
  dir = next
}
return { slug: d.slug, history }
