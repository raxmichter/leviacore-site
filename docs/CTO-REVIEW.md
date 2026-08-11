# CTO Review Guide

Orientation for reviewing this migration — written to be worked through by a person, an AI agent, or a fleet of them.

**Read this before reviewing any code.** A significant amount of what looks wrong in this repository is deliberate, and reproduces the live site on purpose. §4 lists those explicitly. Correcting them would be a regression.

---

## 1. What this is

`www.leviacore.com`, rebuilt off Webflow as a static Astro site. Content lives in this repo as Markdown and YAML. No CMS, no database, no admin login, no server.

**Scope was replication, not redesign.** Where the live site has a defect that costs nothing to fix during migration, it was fixed and recorded. Everything else was reproduced as-is, including things that look like mistakes.

| | |
|---|---|
| Routes | 15 (5 static, 5 case studies, 3 legal, 404, dev gallery) |
| Tracked files | ~140 |
| Commits | 20 |
| Runtime dependencies | Astro, two font packages, js-yaml |
| Third-party scripts in output | GA4 only |

---

## 2. Verify the claims — don't take them on faith

Every claim below is reproducible. Run these rather than trusting the summary.

```bash
npm ci
npm run build:verify      # build + all four gates
```

| Claim | Command |
|---|---|
| Four quality gates pass | `npm run build:verify` |
| No internal 404s | `npm run check:links` |
| WCAG 2.2 AA clean | `npm run check:a11y` |
| Performance / vitals | `npm run check:lighthouse` |
| Visual diff vs live | `npm run check:visual` ⚠️ *requires the Webflow site still up* |
| Blog emits nothing | `npm run build && ls dist/blog` → must not exist |
| No `.html` internal links | `grep -rn 'href="[^"]*\.html' dist --include='*.html'` |
| Case study URLs preserved | `ls dist/project/` |

**The most valuable review artifact in this repo is `git log`.** Every non-obvious decision is a commit message explaining what was found, what was done, and why. Several document mistakes that were caught and reverted.

```bash
git log --stat
git log --grep="revert\|corrected\|wrong"   # decisions that changed mid-build
```

---

## 3. Suggested review order

For a multi-agent review, these are independent and can run in parallel.

| # | Area | Start at |
|---|---|---|
| 1 | **Architecture & build** | `astro.config.mjs`, `package.json`, `src/content.config.ts` |
| 2 | **Content model & schemas** | `src/content.config.ts`, `src/content/`, `src/data/team.yaml` |
| 3 | **Components & layout** | `src/components/`, `src/layouts/BaseLayout.astro`, `src/styles/` |
| 4 | **Interactions** | `src/scripts/`, `build-context/interactions.md` |
| 5 | **SEO & headers** | `BaseLayout.astro` head, `public/_headers`, `public/_redirects`, `public/robots.txt` |
| 6 | **Quality gates** | `scripts/*.mjs`, `.github/workflows/ci.yml` |
| 7 | **Accessibility** | run `check:a11y`, then audit its thresholds in `scripts/check-a11y.mjs` |
| 8 | **Visual fidelity** | `build-context/fidelity.md` |

### ⚠️ The one architectural weakness worth your attention

**Nine of the eleven visual defects found in Phase G share a single root cause.** A class name styled inside an Astro component's scoped `<style>` compiles to `.foo[data-astro-cid-XXX]`, so the *same class name* used by another component — or written directly in a page — receives no styling at all. Markup looks correct, element counts match, the element is simply invisible or unsized.

`.line`, `.badge`, `.page-padding` and `.container-xxlarge` all failed exactly this way. They are now global primitives in `src/styles/global.css`.

**About a dozen class names are still declared in two or more scoped blocks** — `.button`, `.text-meta`, the triplicated `.legal-*` rules. Nothing is broken today (`node scripts/audit-unstyled.mjs` reports zero elements matching no rule), but it is the same loaded gun. Consolidating them is deliberately left for you: it touches many files for zero visible change, which is a poor diff to land immediately before review.

Three audit scripts exist to re-check this class of problem at any time:

```bash
node scripts/audit-unstyled.mjs      # elements matching no CSS rule
node scripts/audit-breakpoints.mjs   # source wide-breakpoint rules we don't implement
node scripts/audit-combos.mjs        # two-class override traps
```

### Context for reviewers

`build-context/` holds the migration's reasoning, and is the difference between reviewing this repo and guessing at it:

- **`DECISIONS.md`** — every non-obvious choice with its rationale. **Check here first when something looks wrong.**
- **`PROGRESS.md`** — phase record, verification results, and the traps found along the way
- **`fidelity.md`** — visual comparison against live, honest about what has not converged
- **`OPEN.md`** — outstanding items and who owns them
- `tokens.md`, `components.md`, `interactions.md` — extracted from the Webflow source

---

## 4. ⚠️ Deliberate — do NOT "fix" these

Each is either a faithful reproduction of the live site or an explicit instruction. Changing them causes a regression.

| Looks like a bug | Actually |
|---|---|
| **The contact block has no social badges, but live does** | The footer renders the same TW/IN pair immediately below it, so live shows two identical rows stacked. Removed by direction; the space belongs to the form |
| **Homepage project cards show no campaign year, but live does** | Omitted by direction. `year` is still in the schema and still drives sort order — it is simply not rendered |
| Bold text is browser-synthesised, not a real font weight | The live site ships only Satoshi Regular and always has. Adding real weights **changes the design** |
| Type scale gets *larger* below 479px | Property of the live design |
| `.margin-bottom.margin-*` and `.padding-vertical.padding-xlarge` use literal values, not tokens | These are combo overrides in the source that are frozen across all breakpoints. Using the nominal scale is wrong — see `tokens.md` BLOCKER-2 |
| The blog appears unfinished | Complete and **deliberately disabled**. See `docs/enable-blog.md`. Do not flip the flag |
| Legal pages state "Last modified: November 9, 2021" | Truthful. Deliberately **not** git-derived — an automatic date would claim the policy was reviewed today |
| A sentence in the privacy policy reads "…see this website" with no link | Dead Flash-era link removed by direction; **rewording it is not authorised**. The policy is being replaced wholesale |
| Case study metrics disagree with their infographics | Pre-existing on the live site, ported verbatim, **under review by George. Do not adjust** |
| `alt=""` on some icons | Correct for decorative images. The gate requires `aria-hidden="true"` alongside it |
| No 401 page | Webflow's password form posted to `/.wf_auth`, which does not exist on a static host, for content that is not protected |
| `/gcx` redirects to `/` | Dated event page, dropped by direction |
| `JordiChapdelanie-FINAL.jpg` misspells the surname | Filename kept intentionally; the displayed name is correct |

---

## 5. Needs your decision

| # | Item | Blocks |
|---|---|---|
| 1 | **Contact form endpoint.** Ships with a placeholder `action` and will not deliver. See `../optional-phase-contact-form.md` — recommendation is a host-native handler, not Astro Actions | Launch |
| 2 | ⚠️ **If you choose a third-party endpoint, add its origin to `form-action` in `public/_headers`** or the browser blocks submissions silently — the form looks fine and never delivers | Launch |
| 3 | **Verify `_headers` at the edge.** CSP/HSTS syntax is host-specific; a misapplied CSP breaks the site for users while looking fine to whoever deployed it | Launch |
| 4 | **HSTS is preload-eligible and hard to reverse.** Confirm HTTPS on every subdomain first | Launch |
| 5 | **Google Search Console baseline.** ~10 minutes, and it must happen **before** cutover — afterwards it is unrecoverable and there is no way to distinguish a migration-caused ranking change from noise | Post-cutover diagnosis |
| 6 | **Do not delete the Webflow site until cutover is verified.** It is the visual-regression reference, and case study imagery came from its CDN | Everything |
| 7 | Whether `dist/dev/components` (the gallery) should ship. Currently `noindex` and excluded from the sitemap | Nothing |

---

## 6. Known gaps — stated plainly

**Visual fidelity is not complete.** `build-context/fidelity.md` has per-page, per-breakpoint numbers. Ranked:

1. `/team` at ≤767 — the worst page on the site; wrappers and column count already ruled out as causes
2. `/projects` at 767, and the homepage featured-projects grid (a simpler teaser than live's hero-plus-two-up)
3. A ~4–6% floor everywhere, which is text antialiasing between two independent renders and should not be chased

**Lighthouse performance is 87–90 against a 95 target.** The whole gap is GA4 — third-party scripts are 167KB of a 172KB script budget. Deferring it was rejected deliberately: it would confound the traffic measurements needed to detect migration problems at cutover. Revisit once cutover is stable.

For context, against the live site: performance 73→87, accessibility 86→100, LCP 2.55s→1.88s (live exceeds the 2.5s threshold; this does not), page weight 2,965KB→803KB.

---

## 7. What was fixed versus live

Defects corrected during migration, each at effectively zero marginal cost:

- Homepage `<title>` was the bare "Leviathan Core" — the weakest SEO on the highest-value page
- Every image lacked `alt` text; now none do, enforced by a gate
- Legal pages had **no heading structure at all** — unnavigable by screen reader
- Four "jump to section" links in the legal pages pointed at `about:blank` anchors that did not exist
- Seven self-referencing URLs used the wrong host or a `.html` extension that will 404 on the new site
- In-body legal links were **invisible** — including the working contact email
- An empty `<a>` to webflow.com in every footer (a link with no accessible name)
- `"No items found."` printed on all five case studies
- `services.html` shipped two `<h1>`s
- Section IDs did not match content (Legal under `#video`, Finance under `#content`)
- Invalid nested `<header>`
- Contact form used `method="get"`, putting message bodies in URLs and server logs
- Social preview image was hosted on a third-party imgur URL nobody controls
- No structured data anywhere; JSON-LD Organization added

---

## 8. Out of scope

Not omissions — explicit decisions.

- **Redesign of any kind.** Replication only.
- **A CMS UI layer.** Removed by direction; yours to consider. The content model is plain Markdown + YAML, which every git-backed CMS reads natively.
- **E-commerce, auth, search.** None has ever existed; the export's scaffolding was excluded.
- **Frameworks.** No React, no Tailwind, no state library. Astro components and plain CSS, so this is auditable without a tour.
