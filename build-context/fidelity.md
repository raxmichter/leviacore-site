# Phase G — Visual fidelity

Measured against the live Webflow site. **Last full run: 2026-08-11**, 91 comparisons (13 pages × 7 widths). Rerun with `npm run check:visual`.

> ⚠️ **This measurement becomes impossible once Webflow is wound down.** The numbers below are the record.

---

## Headline

**Structurally correct and measurably better on every objective metric. Not pixel-identical.** Convergence is incomplete; the remaining gaps are enumerated below, largest first.

| | Live Webflow | Rebuild |
|---|---|---|
| Lighthouse performance | 73 | **87–90** |
| Lighthouse accessibility | 86 | **100** |
| Best practices / SEO | 100 / 100 | 100 / 100 |
| LCP | 2.55s ⚠️ *(over the 2.5s threshold)* | **1.88s** |
| CLS | 0.009 | **0.000** |
| Page weight (homepage) | 2,965 KB | **803 KB** |
| axe violations (WCAG 2.2 AA) | — | **0** |
| Images without alt text | all | **0** |

## Current mismatch by page

Lowest value across the seven widths, as a rough "best case" per page.

| Page | Best | Worst | Notes |
|---|---|---|---|
| `/privacy-policy` | **4.1%** | 11.0% | Best-converged section |
| `/ccpa` | **3.9%** | 9.5% | |
| `/notice-at-collection` | **4.0%** | 9.9% | |
| `/contact` | **5.1%** | 6.7% | Tightest spread on the site |
| `/project/spiritfarer` | **6.1%** | 12.4% | |
| `/services` | **7.8%** | 10.0% | |
| `/project/borderlands3` | **9.3%** | 14.7% | |
| `/project/legends-of-lost-ark` | **8.5%** | 13.5% | |
| `/project/return-to-aeternum` | **7.3%** | 14.8% | |
| `/project/warframe` | **10.8%** | 15.4% | |
| `/` | **18.5%** | 44.1% | |
| `/team` | **19.5%** | 46.9% | See gap 1 |
| `/projects` | **23.9%** | 47.5% | See gap 2 |

**Verification widths: 375 / 767 / 768 / 1280 / 1439 / 1440 / 1920.** The pairs straddle breakpoint boundaries deliberately — 767/768 and 1439/1440 sit either side of layout changes, and that is where defects hide. The original 4-width matrix jumped 1280 → 1920 and missed three of them.

---

## Fixed during Phase G

Found by comparing **computed layout values**, not pixels — `scripts/compare-metrics.mjs` exists because a percentage tells you *that* something is wrong, never *what*.

| # | Defect | Impact |
|---|---|---|
| 1 | **`.page-padding` / `.container-xxlarge` declared only in SectionShell's *scoped* CSS** | Header and footer got no padding and no max-width. Logo 48px off, content column 100px too wide, **every page** |
| 2 | **`.line` declared in five separate scoped styles** | Every page-rendered divider was invisible. Element counts matched live exactly — they were simply unstyled |
| 3 | **`.badge` re-declared in four components, three at wrong sizes** | Scoped rules beat the global one; social pills rendered 44–64px instead of 40/32px |
| 4 | **`.padding-vertical.padding-xlarge` combo override** | Implemented as the responsive token instead of the source's flat 2rem |
| 5 | **`.subnav` gap** | Source is 1rem with `.small` at 0.5rem; both were 0.5rem, halving the footer copyright row spacing |
| 6 | **`.home-hero-grid`** | Wrong columns (`1fr 1fr` vs `1fr .75fr`), wrong gap, and the ≥1440 doubling missing |
| 7 | **`.services-hero-grid`** | Wrong columns, spurious gap, and both wide overrides missing |
| 8 | **`.work-hero-grid`** | Built as a single-column stack; source goes two-column at ≥1440 |
| 9 | **Case study layout** | Full-width hero banner replaced by live's images-right / text-left; grid ratio inverted; section icons restored |
| 10 | **Homepage featured projects** | Rebuilt as live's intro \| divider \| cards grid with a lead project and a two-up row |
| 11 | Footer link typography, form input styling, service tag inlining, per-project website labels | Assorted |

**Nine of these trace to one root cause:** a class name styled inside an Astro component's scoped `<style>`, which compiles to `.foo[data-astro-cid-XXX]` and therefore does not apply to the same class used anywhere else. See `DECISIONS.md`.

---

## Remaining gaps, largest first

### 1. `/team` at ≤767 — the largest single gap
`Δ-4,233px` at 375, `Δ-5,063px` at 767 (live 7,596px vs ours 3,363px). Roughly half the height of live at mobile, while within 357px at 1280.

**Already ruled out** — do not re-check:
- Not the page wrappers. `.page-padding`, `.container-xxlarge`, `main`, `section` all match live within 1px at 375.
- Not the column count. First team card measures 349px live vs 351px local — both full-width.

**So the difference is inside the card**, almost certainly headshot render height across 11 cards. Start by comparing the computed height of one `TeamMemberCard` `<img>` between live and local at 375.

### 2. `/projects` — 23.9–47.5%
The hero now matches. The remaining mismatch is the project card list below it, which still differs structurally from live's arrangement. Worst single number on the site at 767.

### 3. `/` at ≤768 — 26.5–44.1%
Desktop is now 18.5%. The narrow widths are where it diverges, and the homepage stacks many sections, so this is likely several small responsive differences compounding rather than one cause.

### 4. Case studies — 6.1–15.4%
Substantially improved (were 14–26%). Heights now track live within ~200px at most widths, and Warframe hits Δ9px at 1439. Residual is spacing detail rather than structure.

### 5. A ~4–6% floor everywhere
Even the closest pages hold this. It is text antialiasing and sub-pixel reflow between two independent renders. **Do not chase it** — 4% is the realistic floor for a text-heavy site.

---

## Deliberate differences — do NOT "fix" these

Each is an improvement or an explicit instruction. They will show in any future diff.

| Difference | Why |
|---|---|
| **No social badges in the contact block** | The footer renders the same TW/IN pair directly below it. Live shows both, stacked. Removed 2026-08-11 per George — space kept for the form |
| In-body legal links are visible | Live's global `a { color: inherit; text-decoration: inherit }` made every in-body legal link invisible, including working `mailto:` links |
| Legal pages have heading structure | Live has none at all — unnavigable by screen reader |
| Form labels exist, visually hidden | Live has none; placeholders are not labels |
| Every image has alt text | Live has `alt=""` everywhere |
| No campaign year on homepage project cards | Live prints it; omitted per George. `year` still drives sort order |
| `/services` renders one `<h1>` | Live ships two |
| No `"No items found."` | Live prints it on all five case studies |
| No empty `<a>` to webflow.com | Live has one in every footer |
| Mobile menu panel is 375px at a 375px viewport | Live's `.navbar-dropdown { width: 390px }` overflows |
| Custom cursor on five pages only | Matches live exactly — absent from case studies, legal pages, 404 |
| Bold text is browser-synthesised | Matches live. Real Satoshi weights would *change* the design |
| Homepage project cards are equal width | Porting the source's `padding-left: 3rem` on the even card literally made its 16:9 image visibly smaller. Divider now sits in the gap |

---

## How to continue

```bash
npm run check:visual                              # all pages, all widths
node scripts/compare-metrics.mjs /team 375        # WHY it differs — start here
node scripts/compare-shots.mjs /team 375          # look at both side by side
node scripts/audit-breakpoints.mjs                # missing wide-breakpoint rules
node scripts/audit-combos.mjs                     # two-class override traps
node scripts/audit-unstyled.mjs                   # elements matching no rule
```

**Work in this order:** `/team` at 375 → `/projects` card list → `/` at narrow widths.

**Fix the computed-value difference, not the pixels.** Every defect above was a single CSS rule, and several moved multiple pages at once. Chasing percentages directly finds nothing.
