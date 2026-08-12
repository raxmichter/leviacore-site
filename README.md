# leviacore.com

Static site for [www.leviacore.com](https://www.leviacore.com), migrated off Webflow.

Built with [Astro](https://astro.build). Content lives in this repository as Markdown and YAML — there is no CMS, no database, no admin login, and no server.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:4321
```

```bash
npm run build:verify # production build + all four quality gates
```

Requires Node 22+.

---

## What's here

```
src/
  pages/           routes — one file per URL
  components/      16 reusable components
  layouts/         BaseLayout — <head>, header, footer, SEO
  content/         Markdown content, schema-validated
    projects/        5 case studies
    legal/           privacy policy
    blog/            built, SHIPPED DISABLED — see docs/enable-blog.md
  data/team.yaml   team roster
  styles/          tokens.css (design tokens), global.css, fonts.css
  assets/images/   images, optimized at build time
  config.ts        feature flags
  content.config.ts  content schemas (Zod)

scripts/           quality gates + build tooling
docs/              how-to guides
build-context/     migration record — see below
public/            files served verbatim: robots.txt, _redirects, _headers, fonts
```

### `build-context/` — read this before changing anything non-obvious

This directory is the reasoning behind the build, not incidental notes. It exists because a lot of what looks wrong in this codebase is deliberate, and reproduces the live site on purpose.

| File | What it holds |
|---|---|
| `PROGRESS.md` | Phase-by-phase record, verification results, context rules |
| `DECISIONS.md` | Every non-obvious choice and why. **Check here before "fixing" something odd** |
| `OPEN.md` | Outstanding items and who owns them |
| `tokens.md` | Design tokens extracted from the original compiled CSS |
| `components.md` | Component inventory and page composition |
| `interactions.md` | All 19 Webflow interactions, decoded with real values |
| `assets.md` | Asset manifest |

**Three things that look like bugs and are not:**

1. **Bold text is browser-synthesised.** Satoshi ships only Regular; the live site has always rendered `<strong>` as faux-bold. Adding real weights would change the design. (`OPEN.md` item 6)
2. **The blog is disabled on purpose.** It is complete, not unfinished. (`docs/enable-blog.md`)
3. **The type scale gets larger below 479px** and the `.margin-bottom.margin-*` combos don't match the nominal spacing scale. Both are properties of the original design, reproduced deliberately. (`tokens.md`)

---

## Quality gates

Four gates, run by `npm run build:verify` and by CI on every push. A failing gate blocks the deploy.

| Command | Gate |
|---|---|
| `npm run build` | **Schema validation** — malformed content fails the build with a named error |
| `npm run check:structure` | **Structural checks** — 13 assertions, see below |
| `npm run check:links` | **Link checker** — no internal 404s |
| `npm run check:a11y` | **Accessibility** — axe, WCAG 2.2 AA |

`check:structure` enforces, among others: exactly one `<h1>` per page; no internal `.html` links; non-empty `alt` on every image; no duplicate element ids; every `label[for]` and `href="#fragment"` resolves; canonical/noindex consistency; `og:image` on our own origin. Each check maps to a specific defect found on the live site — they exist so those defects cannot silently return.

Visual regression runs separately, because it depends on the live Webflow site being up:

```bash
npm run check:visual              # all pages, 5 breakpoints
node scripts/visual-regression.mjs /team 1280   # one page, one width
```

> ⚠️ **This stops working once Webflow is wound down.** Capture results before cutover. Findings are recorded in `build-context/fidelity.md`.

---

## Editing content

Full guide: **[docs/editing-content.md](docs/editing-content.md)**. Reviewing this migration? Start at **[docs/CTO-REVIEW.md](docs/CTO-REVIEW.md)**. In brief:

| To change | Edit |
|---|---|
| A case study | `src/content/projects/<slug>.md` — template + guide: `docs/case-study-template.md`, `docs/adding-a-case-study.md` |
| Team roster | `src/data/team.yaml` |
| Legal pages | `src/content/legal/*.md` |
| Enable the blog | `docs/enable-blog.md` — **follow the doc, do not just flip the flag** |

⚠️ **A case study's filename is its live URL.** Renaming `borderlands3.md` changes `/project/borderlands3` and breaks an indexed URL. URL parity is this migration's one non-negotiable rule.

---

## Deployment

Static output. Any static host works; `public/_redirects` and `public/_headers` use the Netlify/Cloudflare Pages format.

**Before first deploy:**

1. **Contact form has no endpoint.** It ships with a placeholder `action` and will not deliver. See `../optional-phase-contact-form.md` and `OPEN.md` item 2. **If you point it at a third-party endpoint, add that origin to `form-action` in `public/_headers` or the browser will silently block submissions.**
2. **Verify `_headers` at the edge.** CSP and HSTS syntax is host-specific and a misapplied CSP breaks the site for users while looking fine to whoever deployed it.
3. **HSTS is preload-eligible and hard to reverse.** Confirm HTTPS on every subdomain first.
4. **Do not delete the Webflow site until cutover is verified.** It is the visual-regression reference, and case study images were sourced from its CDN.

---

## Analytics

GA4 `G-EG4F7ZLTZQ`, ported from the original site and present on every page. The only third-party script; allowlisted in the CSP.
