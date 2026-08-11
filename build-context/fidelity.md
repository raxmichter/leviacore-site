# Phase G — Visual fidelity

Measured against the live Webflow site, 2026-08-10/11. Rerun with `npm run check:visual`.

> ⚠️ **This measurement stops being possible once Webflow is wound down.** The numbers below are the record.

---

## Headline

**The rebuild is structurally correct and measurably better on every objective metric, but it is NOT yet pixel-identical.** Convergence is incomplete and the remaining gaps are enumerated below, largest first.

| | Live Webflow | Rebuild |
|---|---|---|
| Lighthouse performance | 73 | **87–90** |
| Lighthouse accessibility | 86 | **100** |
| Best practices / SEO | 100 / 100 | 100 / 100 |
| LCP | 2.55s ⚠️ *(over the 2.5s threshold)* | **1.88s** |
| CLS | 0.009 | **0.000** |
| Page weight (homepage) | 2,965 KB | **803 KB** |
| axe violations (WCAG 2.2 AA) | — | **0** |
| Images without alt text | all of them | **0** |

---

## What was fixed during Phase G

Found by comparing **computed layout values**, not by eye — `scripts/compare-metrics.mjs` exists because a pixel percentage tells you *that* something is wrong, never *what*.

| # | Defect | Impact |
|---|---|---|
| 1 | **`.page-padding` and `.container-xxlarge` were declared only inside SectionShell's *scoped* CSS.** Astro compiled them to `.page-padding[data-astro-cid-…]`, so sections were laid out correctly while the header and footer — which use the same class names — got **no horizontal padding and no max-width at all** | Header logo sat 48px too far left and the content column was ~100px too wide on **every page**. The single largest source of drift |
| 2 | **`.padding-vertical.padding-xlarge` is a combo override** — a flat `2rem`, verified not restated in any media query — but was implemented as `var(--space-xl)` (4rem→3rem→2rem) | Every `xlarge` section 2rem too tall at desktop. Same trap class as the documented `.margin-bottom.margin-*` issue; the earlier assumption that it didn't apply here was wrong |
| 3 | Footer nav links rendered as sentence-case body text | Live sets them uppercase Roboto Mono with 1px tracking. Visible on every page |
| 4 | Form inputs rendered as fully bordered boxes with visible labels | Live is underline-only with no labels. **Resolved by keeping the labels for screen readers and hiding them visually** — pixel-identical to live, strictly more accessible than live |
| 5 | `.badge` had no global sizing | Social pills rendered ~68px instead of 40px/32px |
| 6 | Case study service tags stacked vertically | Live renders them inline on one wrapping row |
| 7 | Case study website link showed the raw URL | Live shows "SPIRITFARER WEBSITE" |

---

## Remaining gaps, largest first

### 1. `/team` at ≤767 — the biggest single gap
`Δ-4231px` at 375, `Δ-5063px` at 767 (live 7,596px vs ours 3,365px). **Our team page is roughly half the height of live at mobile widths**, while matching within 316px at 1280.

**Already ruled out** — don't re-check these:
- Not the page wrappers. `.page-padding`, `.container-xxlarge`, `main` and `section` all match live within 1px at 375.
- Not the column count. The first team card measures 349px live vs 351px local — both effectively full-width at 375.

**So the difference is inside the card**: almost certainly headshot rendering height. Live loads 11 large images on this page; the rebuild loads a different count at a different size, which at ~400px each across 11 cards accounts for the entire delta. Start by comparing the computed height of one `TeamMemberCard`'s `<img>` between live and local at 375.

**Highest-value next fix** — it is one component, and it is the worst number on the site.

### 2. `/` and `/projects` — 21–48%
Both render the case study grid. Height deltas are large at every width. Related to #1: card grids differ responsively. `/projects` at 767 is the worst single number on the site (48%).

### 3. Case study detail pages — 14–26%
Structural, and known: **the live layout puts the hero image in a right-hand column beside the Challenge text with a decorative icon; the rebuild renders a full-width banner below the metadata block.** This came from Phase D1 building against `detail_project.html`, where Webflow had stripped the CMS content so the real layout was not visible. Heights are now close (Δ29–123px at most widths) — the mismatch is placement, not volume.

### 4. Legal pages — 4–11%
The best-converged section. At 1280/1920 the deltas are **positive** (`+391px`), meaning ours is slightly *taller* — expected, since restored visible link styling and promoted headings add height. Largely intentional.

### 5. A fixed floor of ~4–6% everywhere
Even the closest pages hold ~4–6%. This is text antialiasing and sub-pixel reflow between two independent renders, not a defect. **Do not chase this to zero** — a threshold near 3–4% is the realistic target for a text-heavy site.

---

## Deliberate differences — do NOT "fix" these

They will show in any future diff. Each is an improvement or a directive.

| Difference | Why |
|---|---|
| In-body legal links are visible (coloured/underlined) | The live site's global `a { color: inherit; text-decoration: inherit }` made every in-body legal link invisible, including working `mailto:` contact links |
| Legal pages have heading structure | Live has none at all — a screen-reader user cannot navigate those documents |
| Form labels exist (visually hidden) | Live has none; placeholders are not labels |
| Every image has alt text | Live has `alt=""` everywhere |
| `services.html` renders one `<h1>` | Live ships two |
| No `"No items found."` | Live prints it on all five case studies |
| No empty `<a>` to webflow.com | Live has one in every footer |
| Mobile menu panel is 375px at a 375px viewport | Live's `.navbar-dropdown { width: 390px }` overflows |
| Custom cursor on five pages only | Matches live exactly — it is absent from case studies, legal pages and 404 |
| Bold text is browser-synthesised | Matches live. Real Satoshi weights would *change* the design |

---

## How to continue

```bash
npm run check:visual                              # all pages, all widths
node scripts/compare-metrics.mjs /team 375        # WHY it differs — start here
node scripts/compare-shots.mjs /team 375          # look at both
```

**Work in this order:** `/team` at 375 → `/projects` at 767 → case study hero placement. Fix the computed-value difference, not the pixels; #1 and #2 above were each a single CSS rule that moved multiple pages at once.
