# PROGRESS — leviacore.com Migration

**Read this first. Every session starts here.**

Governing plan: `../../leviacore-build-plan.md` · Rationale doc: `../../leviacore-site-migration-plan.md`

---

## Re-entry protocol

If you are starting a session cold, or recovering from a context compaction, read in this order:

1. **This file** — where the build is
2. **`OPEN.md`** — what is blocked and on whom
3. **Only the artifacts named in your phase's reading list below** — nothing else

Total re-hydration cost: ~2–5k tokens. **Do not re-read the Webflow export to "get oriented."** Everything durable has already been distilled into `build-context/`. If something you need is missing from these artifacts, that is a bug in the artifact — fix the artifact, don't work around it by re-reading source.

## Hard context rules

Violating these is how a session dies mid-phase.

| Never read | Why | Use instead |
|---|---|---|
| `_webflow-export/js/webflow.js` | 2MB / ~500k tokens | `interactions.md` — already fully extracted |
| `_webflow-export/css/*.css` | 110KB + 39KB | `tokens.md` — already fully extracted |
| `checkout.html`, `paypal-checkout.html`, `order-confirmation.html`, `detail_sku.html`, `detail_product.html`, `detail_category.html`, `detail_blog-category.html`, `detail_project-category.html`, `template-info/*`, `gcx.html` | Not migrated. Out of scope by direction | — |

**One exception:** `detail_post.html` is read exactly once, by the Phase D3 blog agent, to derive the article layout. No other phase opens it.

---

## Phase ledger

| Phase | Work | Model | Status |
|---|---|---|---|
| — | Recon: export inspected, interactions inventoried, font risk closed | Opus 5 | ✅ Complete |
| **A** | Scaffold, token/component/interaction extraction, asset localization | Opus 5 + 3 subagents | 🔄 **In progress** |
| B | Layout shell and components | Sonnet 5 | ⬜ Not started |
| C1 | Static pages — home, services, projects shell, team, contact | Sonnet 5 | ⬜ Not started |
| C2 | Legal and utility pages — privacy, CCPA, notice-at-collection, 404, 401 | Sonnet 5 | ⬜ Not started |
| D1 | Case study system — collection, schema, `/project/[slug]` template | Sonnet 5 | ⬜ Not started |
| D2 | Content migration — 11 bios, 5 case studies, alt text | Haiku 4.5 ×2 | ⬜ Blocked on CSV (content only) |
| D3 | Blog structure, **shipped disabled** | Sonnet 5 | ⬜ Not started |
| E | Interactions — the 19 action lists | Opus 5 | ⬜ Not started |
| F | SEO, structured data, redirects, CI gates | Sonnet 5 | ⬜ Not started |
| G | Visual fidelity convergence | Opus 5 + auditor | ⬜ Not started |
| H | Handoff — README, docs, final review | Opus 5 | ⬜ Not started |

## Reading list per phase

| Phase | Read |
|---|---|
| B | `tokens.md`, `components.md` |
| C1 | `tokens.md`, `components.md`, the 5 static page HTMLs |
| C2 | `tokens.md`, `components.md`, legal page HTMLs |
| D1 | `components.md` (CMS placeholder section), `content-map.md` |
| D2 | `content-map.md`, `assets.md`, `components.md` (team section) |
| D3 | `tokens.md`, `components.md`, `detail_post.html` (once) |
| E | `interactions.md` |
| F | `content-map.md`, `PROGRESS.md` |
| G | `fidelity.md`, `tokens.md` |
| H | everything in `build-context/` |

---

## Current status — Phase A

**Done:**
- Astro scaffolded (minimal template, strict TypeScript, static output). Node v24.14.0, npm 11.9.0.
- Git repo initialized at `site/`.
- Directory skeleton: `build-context/`, `src/{assets,components,layouts,content,styles}`, `scripts/`, `docs/`.
- **Assets localized** via `scripts/localize-assets.mjs` (re-runnable): 34 originals copied, 17 Webflow responsive variants deliberately skipped — Astro regenerates those with AVIF/WebP and correct `srcset`. Manifest written to `assets.md`.
- `Satoshi-Regular.woff` copied to `public/fonts/`.

**In flight — three subagents running in parallel:**
- `token-extractor` (Opus 5) → `tokens.md`
- `component-mapper` (Sonnet 5) → `components.md`
- `ix-decoder` (Opus 5) → `interactions.md`

**Cross-checks run in the main thread (findings that no single subagent could see):**

- **`Accordion [Open]` and `Accordion [Close]` are DEAD.** The IX2 data defines both, but `grep -i accordion` returns **zero matches** across `index`, `services`, `team`, `projects`, `contact`, and `detail_project`. They are residue from the purchased template, bound to pages we are not migrating. **Phase E scope drops from 19 action lists to 17.** The block `component-mapper` initially read as an accordion (site values) is a static list with no expand/collapse markup — confirmed independently from both sides.
- **`Blog Post Image Parallax` is dormant, not dead** — it belongs to the article template built in D3 and shipped disabled. Reimplement it in E only if it shares the `Image Parallax` primitive (it should); do not build it standalone.

**Component-mapper gotchas to carry into later phases:**

| Finding | Bites in |
|---|---|
| Contact form field `name` casing diverges: `Name`/`Email` in `contact.html` vs `name`/`email` on other pages | C1 — normalize to one casing before wiring the endpoint, or submissions split into two shapes |
| `services.html` section IDs don't match their content — Legal sits under `id="video"`, Finance under `id="content"` | C1 — any anchor link or nav jump inherits the mismatch. Fix the IDs, but check for inbound deep links first |
| Team image `JordiChapdelanie-FINAL.jpg` misspells "Chapdelaine" | D2 — the *filename* stays as-is (renaming breaks nothing but gains nothing); the *displayed name* must be spelled correctly |
| Homepage has two divergent CMS placeholder lists (likely featured + grid), both empty | D1 — the split can't be confirmed until the CSV arrives |
| "We're Hiring" card is structurally identical to a real team card | D2 — a boolean toggle on the same component, not a separate one |

**Remaining in Phase A:**
- Confirm Satoshi weight coverage (answered by `token-extractor`); self-host Syne + Roboto Mono, subset, preload, drop the render-blocking WebFont.js
- Astro config: static output, site URL, image service
- Verify dev server renders a shell using extracted tokens

## Handoff note

*Written at each phase exit for a reader with no memory of the session.*

**Phase A (in progress):** Scaffold and asset localization are complete and idempotent — re-running `node scripts/localize-assets.mjs` is safe. The three extraction subagents own `tokens.md`, `components.md`, and `interactions.md` respectively; if any of those files is missing or thin, re-run that single agent rather than extracting inline, or the context cost lands in the main thread. Phase A does not exit until all four artifacts (including `assets.md`, already written) are non-trivial.
