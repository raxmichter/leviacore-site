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
| **A** | Scaffold, token/component/interaction extraction, asset localization | Opus 5 + 3 subagents | ✅ **Complete** |
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

- **Fonts self-hosted.** `src/styles/fonts.css` + `public/fonts/`. Syne (variable, 400–800 in one file), Roboto Mono 400, Satoshi 400. **WebFont.js dropped** — the render-blocking third-party loader is gone.
- **All three extraction artifacts delivered:** `tokens.md` (1000+ lines), `components.md` (~23 components), `interactions.md` (~500 lines, all 19 action lists decoded with real values).

### ⚠️ Verification matrix changed — 5 breakpoints, not 4

The plan specified 375 / 768 / 1280 / 1920. `tokens.md` found the site's real media queries break at max-width **479 / 767 / 991** and min-width **1440 / 1920**. **768 falls inside the `≤991` tablet band, not `≤767`** — so capturing at 768 leaves the entire mobile-landscape block untested.

**Phase G must capture at 375 / 767 / 768 / 1280 / 1920.** Keeping both 767 and 768 is deliberate: they sit on opposite sides of a breakpoint boundary, which is exactly where layout breaks.

Expect one pre-existing bug at the 375 capture: `.navbar-dropdown { width: 390px }` at `≤767` overflows a 375px viewport (effective content box is 351px after `.body` padding). **This is a live-site defect, so a faithful rebuild reproduces it.** Phase G decides whether to match it or fix it — fixing it will register as a visual diff.

**Cross-checks run in the main thread (findings that no single subagent could see):**

- **`Accordion [Open]` and `Accordion [Close]` are DEAD.** The IX2 data defines both, but `grep -i accordion` returns **zero matches** across `index`, `services`, `team`, `projects`, `contact`, and `detail_project`. They are residue from the purchased template, bound to pages we are not migrating. The block `component-mapper` initially read as an accordion (site values) is a static list with no expand/collapse markup — confirmed independently from both sides.

- **Phase E scope: 19 action lists → 13 to port.** The two dead accordions above, plus four more the `ix-decoder` found with values but no live DOM (`a-34`/`a-169` Button Text Hover, `a-159` About Gallery Scroll, `a-154` Blog Post Image Parallax — three of which resolve to an empty target list and were already silent no-ops on the live site). **Full breakdown and the two "preserve, don't fix" behaviours are at the top of `interactions.md` — read that before starting Phase E.**
- **`Blog Post Image Parallax` is dormant, not dead** — it belongs to the article template built in D3 and shipped disabled. Reimplement it in E only if it shares the `Image Parallax` primitive (it should); do not build it standalone.

**Component-mapper gotchas to carry into later phases:**

| Finding | Bites in |
|---|---|
| Contact form field `name` casing diverges: `Name`/`Email` in `contact.html` vs `name`/`email` on other pages | C1 — normalize to one casing before wiring the endpoint, or submissions split into two shapes |
| `services.html` section IDs don't match their content — Legal sits under `id="video"`, Finance under `id="content"` | C1 — any anchor link or nav jump inherits the mismatch. Fix the IDs, but check for inbound deep links first |
| Team image `JordiChapdelanie-FINAL.jpg` misspells "Chapdelaine" | D2 — the *filename* stays as-is (renaming breaks nothing but gains nothing); the *displayed name* must be spelled correctly |
| Homepage has two divergent CMS placeholder lists (likely featured + grid), both empty | D1 — the split can't be confirmed until the CSV arrives |
| "We're Hiring" card is structurally identical to a real team card | D2 — a boolean toggle on the same component, not a separate one |

**Token-extractor findings that change how Phase B must be built:**

| Finding | Why it matters |
|---|---|
| **`.margin-bottom.margin-*` combos break the spacing scale.** In that two-class context `margin-xxhuge` resolves to `1rem`, not `12rem`; `margin-xhuge` to `2rem`, not `8rem`. These rules are never restated in any media query, so they're frozen at every viewport while single-class rules scale. `margin-bottom` appears **223×** in the HTML | **Port resolved values, not the nominal scale table.** Building from the nominal table produces spacing that is wrong almost everywhere and wrong by a lot |
| Type scale **inverts** at narrow widths — `.heading-small` goes 3.125rem @≤767 → **3.25rem** @≤479, larger on smaller screens, and exceeds `.heading-medium` at both | Deliberate-looking or not, it is the live design. **Reproduce it.** Same pattern on `.text-rich-text blockquote` |
| `.max-width-medium` and `.max-width-xlarge` declare **no `max-width` at all** | Values are unrecoverable from source. If either is load-bearing in a layout, it needs the design owner — flag rather than invent |
| 5-value near-duplicate dark-ink cluster; 28 colors total (18 site-layer, 10 commerce residue) | Listed, **not** collapsed. Collapsing is a design decision, deferred |
| `Syne:500` is fetched on every page and never referenced | Already moot — the variable Syne file covers 400–800 in one request |
| Zero `!important` in the site CSS (all 49 are framework) | The cascade is clean. Good news for the rebuild |

## Handoff note

*Written at each phase exit for a reader with no memory of the session.*

**Phase A — COMPLETE.** All five artifacts exist and are substantial: `tokens.md`, `components.md`, `interactions.md`, `assets.md`, plus this ledger, `DECISIONS.md`, and `OPEN.md`. Scaffold builds clean (`npm run build`). Asset localization is idempotent — re-running `node scripts/localize-assets.mjs` is safe.

**Two artifact corrections were applied in the main thread; both are marked inline. Trust the corrections over the original text.**
1. `tokens.md` §2b and BLOCKER-1 declared the Satoshi weight gap a "confirmed build blocker." **It is not.** Both `@font-face` blocks in the source CSS declare weight 400 against one file, so the live site already renders faux-bold. The rebuild replicates it. Sourcing real weights would *cause* a regression, not fix one.
2. `interactions.md` now opens with a reconciled Phase E scope: **13 lists to port, not 19.**

**Starting Phase B?** Read `tokens.md` and `components.md`. Do not open the export's CSS or `webflow.js` — everything needed is already distilled. The single most important thing to get right is the resolved-vs-nominal spacing issue in the table above; it silently affects 223 call sites.
