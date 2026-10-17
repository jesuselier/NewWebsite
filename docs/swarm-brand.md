# Swarm brand: handoff for the site

Swarm is Jesus's paid AI crypto trading community ("Swarm: AI Crypto Trading Community"). This branch adds its approved brand assets. It only adds files under `public/brand/swarm/` and this doc; nothing existing is touched. The martinezaccess.com site keeps its own look everywhere else; apply Swarm styling only on Swarm pages and sections.

Full brand guidelines (tokens, logo rules, social specs): https://claude.ai/artifact/4ShuoHYudKYHa2uGXoMmQb (private to Jesus's account).

## The logo: Hive Core

Seven pointy-top hexagon cells: six outlined in grey (`--swarm-hive`) around one glowing gold core cell. The swarm converges on one signal. Use the SVG files as they are; never rebuild the mark, re-type `SWARM`, or light a second cell. The type in every SVG is outlined, so no fonts are needed to render them.

| File (`/brand/swarm/logo/`) | Use |
| --- | --- |
| `swarm-horizontal-for-dark-bg.svg` | Default lockup (mark + SWARM + AI CRYPTO TRADING). Hero, footer. |
| `swarm-horizontal-compact-for-dark-bg.svg` | Nav bars, anywhere under 240px wide. |
| `swarm-stacked-for-dark-bg.svg` | Square or vertical spaces. |
| `swarm-mark.svg` | Mark alone, with glow. Dark grounds only. |
| `swarm-mark-flat.svg` | Mark without glow: small sizes (< 48px), over photos. |
| `*-for-light-bg.svg`, `swarm-mark-on-light.svg` | Only if a section must be light (`#F3F0E8`). |
| `swarm-mark-white.svg`, `swarm-mark-black.svg` | Single-colour uses. |

- Clear space: a quarter of the mark's height on every side (already baked into every file).
- Minimum size: mark 24px tall, horizontal lockup 160px wide, compact 120px, stacked 96px.
- `alt` text: "Swarm" for the lockups, "" (decorative) when the word Swarm is already next to the mark.

## Colour, type, spacing

All tokens are in `/brand/swarm/swarm-tokens.css` as `--swarm-*` custom properties scoped to a `.swarm` wrapper. Port them to Tailwind theme values if that fits the codebase better; keep the hex values exact.

- Ink-first: background `#0B0B0D`, text `#EEEBE4`, muted `#8E8A80`.
- Gold `#F5C542` is the signal: the core cell, ONE primary button per view, one highlighted number. Text on gold is `#141416`. Never a gold section background.
- Grey `#55555B` is for hex outlines only, never text.
- No gradients except the core cell's radial gradient and its soft glow. No drop shadows; borders are 1px `#232328`.
- Fonts (all Google Fonts):
  - Unbounded 600 for headlines (uppercase only for short title cards; +0.06em tracking when uppercase).
  - JetBrains Mono 500 for labels, tickers, prices and percentages (labels uppercase, +0.32em tracking).
  - Hanken Grotesk 400 for paragraphs. Never set paragraphs in Unbounded.
- Radius: 28px panels, 18px buttons and inputs, 10px chips. Page padding 56px desktop, 16px gutters on mobile.
- No emoji in Swarm UI.

## Pattern

The only decorative pattern is a honeycomb field: pointy-top hex outlines in `#1C1C21` fading toward the edges, with exactly one gold lit cell and its six neighbours outlined in `#55555B` (see `social/swarm-x-header-1500x500.png`). Keep text off the lit cell.

## Social and meta

- `og:image` / Twitter card for Swarm pages: `/brand/swarm/social/swarm-og-1200x630.png` (1200x630).
- Swarm page icons (only on Swarm routes, not the site-wide favicon): `/brand/swarm/icons/favicon.ico`, `favicon-32.png`, `apple-touch-icon-180.png`.
- `social/swarm-x-pfp-1000.png` and `social/swarm-x-header-1500x500.png` are the X profile and header images; they're here for reference and press use.
