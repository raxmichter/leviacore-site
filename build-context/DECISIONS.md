# DECISIONS

**Append-only.** Every non-obvious choice, with a one-line why. Newest at the bottom.

Purpose: an agent or developer who encounters something surprising in this repo should find the reason here, rather than "fixing" a deliberate choice. Several entries below exist specifically to prevent that.

---

### 2026-08-10 · Migrate off Webflow to Astro + Markdown in git
Content is locked in a proprietary system with per-seat cost, and structural edits are slow enough that they don't get done — the out-of-date privacy policy is the evidence. Static output, no CMS licensing, content portable into any future system.

### 2026-08-10 · No CMS UI layer (Decap / Pages CMS removed)
Removed by direction (George). The CTO owns any further consideration of a form-based editing UI. Consequence: no `/admin` route, no `config.yml`, no OAuth proxy, no second auth surface. Nothing forecloses adding one later — the content model is plain Markdown + YAML frontmatter, which every git-backed CMS reads natively.

### 2026-08-10 · `gcx.html` not migrated
Dropped by direction (George). A dated event landing page ("GCX, Orlando, Aug 4–5") that was never in the site inventory. Because the URL is live today, `/gcx` gets a **301 to the homepage** in Phase F rather than being left to 404.

### 2026-08-10 · ⚠️ Blog is built and DELIBERATELY DISABLED
**This is not unfinished work. Do not enable it.** By direction (George): the structure ships now — collection, schema, index, article template — but nothing blog-related renders until the flag in `src/config.ts` is deliberately flipped. Built now because the article template is the case study layout minus a block and the index is the Projects grid, both already rendering against extracted tokens; building it cold later costs meaningfully more. To enable it correctly, follow `docs/enable-blog.md` — flipping the flag without checking all six gates can publish crawlable `/blog/*` routes.

### 2026-08-10 · E-commerce and template scaffolding excluded at scaffold time
The Webflow export ships `checkout`, `paypal-checkout`, `order-confirmation`, `detail_sku`, `detail_product`, `detail_category`, `detail_blog-category`, `detail_project-category`, and `template-info/*`. None of this functionality exists on the live site — it is unremoved purchased-template residue. Excluded from the working tree so no agent ever spends context reading it.

### 2026-08-10 · Webflow responsive image variants discarded
`scripts/localize-assets.mjs` copies only originals and skips the 17 `-p-500` / `-p-800` / `-p-1080` files Webflow generated. Astro's image pipeline regenerates these as AVIF/WebP with correct `srcset` at build time; shipping Webflow's copies would be redundant weight in the repo and in the bundle.

### 2026-08-10 · Fonts self-hosted; WebFont.js dropped
The export loads Syne and Roboto Mono through Google's WebFont.js (a render-blocking third-party script) and self-hosts Satoshi. All three become self-hosted, subset, and preloaded. **No Adobe Fonts / Typekit exist anywhere in the export** — verified during recon. This closed the migration plan's single highest-rated fidelity risk.

### 2026-08-10 · Design tokens derived, not copied
The compiled Webflow CSS defines only two custom properties (`--black`, `--white`). Every other token in `tokens.md` is derived by observing repeated literal values across 110KB of compiled CSS. Values there are extracted, not estimated — but the *grouping* into semantic names is a judgment call, and near-duplicate colors are listed rather than silently collapsed.
