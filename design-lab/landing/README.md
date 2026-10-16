# Landing page design lab

Working folder for the Swarm offer landing page (domain joinswarm.ai, bought October 16, 2026): three distinct style directions inside the Swarm brand kit, each with hand-built 3D and 2D motion that amplifies the agentic feel and introduces Jesus as the founder, with a Whop checkout. Nothing here is served by the live site.

- `assets/`: web-sized copies of the portraits in `public/media/`, re-encoded with all EXIF metadata (including GPS) removed.
- `brand`: a link to `public/brand`, so prototypes load the Swarm kit (`../brand/swarm/...`) exactly as the site will.
- `SWARM-BRIEF.md`: what Swarm is, from the intro video, plus the binding rules from the Swarm brand kit (`docs/swarm-brand.md`).

The Swarm intro video ("Swarm Intro - Finance Edit.mp4", about 4 minutes) lives in Jesus's Google Drive. It will be hosted as an unlisted YouTube embed plus a short muted loop cut for the page, never committed to this repo. It is now on YouTube: https://youtu.be/n15W6X84IGg

## Status and how to resume (October 16, 2026)

- Three directions are built and reviewed once: `a-core-glow/`, `b-landing/`, `c-three-cycles/`. Each folder's `NOTES.md` has the review history and open items. `index.html` is the comparison page published to Jesus as a private artifact (https://claude.ai/artifact/HMMSbU5c4MjW4SibaJoQAJ).
- The polish rounds (four reviewers per round, then a fixer, until every score is 8.5 or higher, up to three rounds) were paused to save usage before any fixes ran. The plan is to resume them on the direction Jesus picks, with the creative director notes recorded in the polish run's arguments: make the hero motion own the whole first screen, a bigger core with a real glow from above, verbatim quotes from `FOUNDER-DOSSIER.md`, and product mocks that look like real product.
- `tools/` holds the helpers: `shot.mjs` (desktop and phone screenshots), `rec.mjs` (MP4 recording), `tiles.py`, `shootall.sh` (a full review capture for one direction) and `polish-workflow.js` (the polish loop script). They expect Chrome at `$CHROME_PATH` and Playwright from the global Node modules; in `shootall.sh`, set the tools path to this folder.
- After the pick, the chosen direction is ported into `app/(swarm)/swarm/`, which already serves joinswarm.ai with tested host routing.
