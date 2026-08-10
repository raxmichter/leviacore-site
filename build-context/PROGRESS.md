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
| B | Layout shell and components | Sonnet 5 ×3 | ✅ **Complete** |
| C1 | Static pages — home, services, projects shell, team, contact | Sonnet 5 ×2 | ✅ **Complete** |
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

---

## Phase B — COMPLETE. Verification results

**16 components + BaseLayout + global.css.** Gallery at `/dev/components` renders every one in isolation (`noindex`, not linked from nav).

### Breakpoint verification — all five pass, zero horizontal overflow

Measured in-browser against the running dev server, not eyeballed.

| Width | Overflow | Offending elements | `--page-padding` | `--space-lg` | `--radius-shell` | `--fs-body` |
|---|---|---|---|---|---|---|
| 375 | none | 0 | 1.5rem | — | 2rem | 16px |
| 767 | none | 0 | 2rem | 1.5rem | 3rem | 16px |
| 768 | none | 0 | **2.5rem** | **2.5rem** | **4rem** | 16px |
| 1280 | none | 0 | 3rem | 3rem | 0 | 18px |
| 1920 | none | 0 | 3rem | 3rem | 0 | 18px |

**767 vs 768 resolve to different token bands** — this is the empirical confirmation that the 4-breakpoint matrix in the original plan would have left the mobile-landscape block untested. At 1920, `--fs-display-3xl` correctly bumps to `10rem` (the ≥1440 tier), and `--radius-shell: 0` confirms the base-value correction.

### Accessibility baseline (gallery page)

| Check | Result |
|---|---|
| Images with missing `alt` | **0 / 17** |
| Images with empty `alt` | **0 / 17** |
| Links with no accessible name | **0 / 38** |
| `<label for>` that resolves to a real input | **100%** |
| Console errors | none |

The live site has empty `alt` on every image and an unnamed footer anchor on every page. Both are gone.

### Mobile menu
Opens, `aria-expanded` toggles, Escape closes and restores focus. **Panel is 375px at a 375px viewport — the source's `.navbar-dropdown { width: 390px }` overflow bug is NOT reproduced.** Phase G will see this as a diff; it is an intentional improvement, not a regression.

### Defects found and fixed during verification

1. **`ContactForm` hardcoded its ids** (`contact-form`, `name`, `email`, `message`). `ContactCTA` embeds `ContactForm`, so any page rendering both emitted duplicate ids — and since `<label for>` binds by id, **the second form's labels silently pointed at the first form's inputs.** A real accessibility break, not cosmetic. Fixed with an `idPrefix` prop (default `contact`); `ContactCTA` forwards `formIdPrefix` (default `cta-contact`).
2. **`BaseLayout` had no way to emit `<meta name="robots">`** — a page could not opt out of indexing without editing the layout. Added a `noindex` prop that emits the robots tag and suppresses the canonical link. Phase F will want this for utility routes.

### Known, accepted
- `id="mobile-menu"` appears twice **on the gallery page only**, because the gallery instantiates `MobileMenu` directly in addition to the one `SiteHeader` renders. Production renders it once. Not a component defect.
- ⚠️ **Phase F must delete `src/pages/dev/components.astro` or confirm it is excluded from the sitemap.** It is `noindex` today, but it should not ship.

---

## Phase C1 — COMPLETE

Five pages: `/`, `/services`, `/projects`, `/team`, `/contact`. Six routes built including the dev gallery. **`npm run build:verify` passes all structural checks.**

Two agents ran in parallel with **asymmetric component-edit rights** to prevent write collisions:
- **C1a** — `index.astro`, `projects.astro`. Held exclusive component-edit rights; changes had to be strictly additive.
- **C1b** — `services.astro`, `team.astro`, `contact.astro`, `src/data/team.yaml`. No component edits — reported instead.

That split worked: zero collisions, and the one shared need (`ContactCTA` needing a `headingLevel`) was implemented once by C1a and reconciled into C1b's page afterwards.

### 🆕 `npm run verify` — structural gate

`scripts/verify-pages.mjs` runs over `dist/` and fails the build on any of these. **This is the Phase F link/structure gate in embryo — extend it rather than starting over.**

| # | Check |
|---|---|
| 1 | Exactly one `<h1>` per page (dev pages exempt) |
| 2 | No internal `.html` links — protects URL parity, the one non-negotiable rule |
| 3 | Every `<img>` has non-empty `alt` |
| 4 | The Webflow `"No items found."` artifact never appears |
| 5 | No empty `<a>` to webflow.com |
| 6 | No duplicate element ids |
| 7 | Every `label[for]` resolves to a real id |
| 8 | Title + meta description present; **fails if the bare `"Leviathan Core"` homepage title returns** |
| 9 | Canonical on indexable pages; noindex pages carry no canonical |
| 10 | *(warn)* contact form still on the placeholder endpoint |
| 11 | *(warn)* GA4 tag missing |

Currently: **0 failures, 4 warnings** — all four are the known placeholder contact endpoint, which stays a warning until the CTO supplies a real one (`OPEN.md` item 2).

### Reconciliations applied by the main thread

1. **`services.astro` now uses `<ContactCTA headingLevel="h2">`.** C1b hand-built that block because the prop didn't exist yet; C1a added it mid-flight for the homepage. Duplicate markup removed, unused imports cleaned.
2. **`js-yaml` promoted to an explicit dependency.** `team.astro` loads `team.yaml` via `?raw` + `js-yaml`, which resolved only as a transitive dependency of Astro — a silent build break waiting to happen on a fresh install. Now `js-yaml@^5.2.3` + `@types/js-yaml`. Build verified against the pinned version.
3. **Dev gallery no longer re-instantiates `MobileMenu`.** It produced a duplicate `id="mobile-menu"` (SiteHeader already renders one), which the new gate correctly caught. The gallery now directs reviewers to exercise the real instance via the header hamburger — which is also the only way to test its actual behaviour.

### Services section IDs renamed (source IDs did not match content)

`branding → consulting`, `design → campaigns`, `video → legal`, `content → finance`. The hero jump-nav was updated to match. **Verified no cross-page breakage:** those anchors are only linked from services' own hero, and the homepage's service cards use the source's own `href="#"` placeholders.

### ⚠️ Phase E note — where the Label hover lives

`a-77`/`a-78` "Label Hover [In]/[Out]" are **live** and target `.label` → children `.label-text` / `.label-text-hover`, `translateY 0% → -100%`, 500ms, outQuint.

`.label` appears on **`services.html` only** among migrated pages (4 jump-nav links; the other pages carrying it are all out of scope). So it was correctly built page-local rather than promoted to a component. **The class names differ from the source** — attach to these:

| Source | Rebuild |
|---|---|
| `.label` | `.service-jump-link` |
| `.label-inner` | `.service-jump-link-inner` |
| `.label-text` | `.service-jump-link-text` |
| `.label-text-hover` | `.service-jump-link-text-hover` |

The dual-span structure is present and the hover copy carries `aria-hidden="true"`. Styles are scoped inside `services.astro`, so Phase E edits that file for this one.

### Other C1 decisions
- **Service CTA button text normalized** to "Let's make it happen". The source had three different capitalizations of the same phrase across the four blocks; `components.md` flagged this as inconsistency to resolve, not preserve.
- **`services.html` ships two `<h1>`s on the live site** (hero + contact block). The rebuild emits one. Deliberate fix, not a preserved bug.
- **Homepage `<title>`** is now `"Influencer Marketing Agency for Gaming Brands | Leviathan Core"`, replacing the bare `"Leviathan Core"`. Check 8 above prevents regression.

### 📌 Scope change: team bios move from D2 → C1b

The plan assigned the 11 team bios to Phase D2. C1b now transcribes them into `src/data/team.yaml` as part of building `team.astro`, because it is already reading `team.html` — doing it in D2 would mean reading that file a second time for no benefit.

**D2's remaining scope is therefore: the 5 case studies (blocked on CSV) + alt text for the ~34 non-headshot images + the OG image localization.** Team alt text is written by C1b at transcription time.

## Phase B follow-ups (main thread — do not lose these)

**1. The link reset needs a prose exception.** The export's global styles carry:

```css
a { color: inherit; text-decoration: inherit; font-size: inherit; }
```

This is *correct* for nav, buttons, and footer links, which are styled by class — keep it. But it is why **every in-body link in the legal pages is invisible** (`OPEN.md` item 5). `global.css` must add a rule restoring link affordance (color + underline) inside rich-text / prose contexts only. Neither B1 nor B2 was briefed on this; apply it after B1 lands. Registers as an intentional diff in Phase G.

**2. Verify the two agents' output doesn't overlap.** B1 owns `BaseLayout`, `SiteHeader`, `MobileMenu`, `SiteFooter`, `global.css`. B2 owns the 13 content components. File ownership was disjoint by brief, but confirm before committing.

## Handoff note

*Written at each phase exit for a reader with no memory of the session.*

**Phase B — COMPLETE.** 16 components, layout shell, verified at all five breakpoints with zero overflow and a clean accessibility baseline. Full results above. Two real defects were found by the gallery and fixed (`ContactForm` id collisions, `BaseLayout` noindex gap). One correction was applied to B1's output — see the reverted entry in `DECISIONS.md` about `.button-inner-text-hover`; the lesson generalizes: **Webflow interaction names do not reliably describe what they target, so check the selector list in `interactions.md`, never the title.** That will matter again in Phase E.

**Starting Phase C1?** Read `tokens.md`, `components.md`, and the five static page HTMLs. Compose pages from the existing components — do not write new markup for anything the component library already covers. The gallery at `/dev/components` shows what exists.

---

**Phase A — COMPLETE.** All five artifacts exist and are substantial: `tokens.md`, `components.md`, `interactions.md`, `assets.md`, plus this ledger, `DECISIONS.md`, and `OPEN.md`. Scaffold builds clean (`npm run build`). Asset localization is idempotent — re-running `node scripts/localize-assets.mjs` is safe.

**Two artifact corrections were applied in the main thread; both are marked inline. Trust the corrections over the original text.**
1. `tokens.md` §2b and BLOCKER-1 declared the Satoshi weight gap a "confirmed build blocker." **It is not.** Both `@font-face` blocks in the source CSS declare weight 400 against one file, so the live site already renders faux-bold. The rebuild replicates it. Sourcing real weights would *cause* a regression, not fix one.
2. `interactions.md` now opens with a reconciled Phase E scope: **13 lists to port, not 19.**

**Starting Phase B?** Read `tokens.md` and `components.md`. Do not open the export's CSS or `webflow.js` — everything needed is already distilled. The single most important thing to get right is the resolved-vs-nominal spacing issue in the table above; it silently affects 223 call sites.
