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

### 2026-08-10 · Phase B1 — invalid nested `<header>` corrected
The export nests `<header class="navbar-inner">` inside `<header class="header">`. A `<header>` cannot be a descendant of another `<header>` — invalid HTML and an axe landmark failure. The inner element is rebuilt as a `<div>`. No visual change.

### 2026-08-10 · Phase B1 — mobile menu uses `--z-overlay` (9999), not the source's literal `100`
The source relies on a navbar z-index that flips 1000 → 10 at `≤767`, which only works given exact stacking-context and positioning details not captured in the extracted docs. Using `--z-overlay` makes the open panel paint above the navbar reliably at every breakpoint. **Functional correctness choice, not a redesign — confirm visually in Phase G.**

### ~~2026-08-10 · Phase B1 — `button-inner-text` duplicate-span pattern dropped~~ ❌ **REVERTED — the reasoning was wrong**
B1 removed the `.button-inner-text` / `.button-inner-text-hover` span pair from the header and mobile-menu CTAs, on the grounds that "Button Text Hover" is dead. **That conflated two different interactions:**

| Interaction | Targets | Status |
|---|---|---|
| `a-34` / `a-169` "Button Text Hover" | `.button-text`, `.button-text-4`, `.arrow-right` | **Dead** — those classes exist nowhere in the export, *and* both have `target: {}`. An arrow-nudge effect, unrelated to the spans |
| `a-74` / `a-75` "Button Hover [In]/[Out]" | `.button` | **LIVE on 19 pages.** `translateY` on **both** inner-text spans, `0% → -100%`, 500ms, outQuint — the text slide-swap |

`.button-inner-text-hover` appears **16 times across 5 exported pages**. It is live markup driving a live interaction.

**Corrected:** `SiteHeader` and `MobileMenu` now render their CTAs through the shared `Button` component, which keeps the span pair. Left unfixed, those two CTAs would have been the only buttons on the site without a hover swap, and Phase E would have found nothing to attach to. B2's `Button` was right all along; it also sets `aria-hidden="true"` on the hover span so the duplicated text is not announced twice.

**Lesson for later phases:** interaction *names* in the Webflow data do not reliably describe what they target. Check the selector list in `interactions.md`, not the title.

### 2026-08-10 · Phase B1 — Blog and Shop dropped from the mobile menu
Both point at `template-info/*` pages that are out of scope, and one was already visually broken on the live site.

> ⚠️ **Phase D3 depends on this.** The blog nav item must be re-added **conditionally, behind the `features.blog` flag** — that is gate 1 of the six-gate enablement checklist. Do not add an unconditional Blog link.

### 2026-08-10 · Phase B1 — `.text-rich-text a` link affordance restored
Color + underline for links inside rich-text prose. The sitewide `a { color: inherit; text-decoration: inherit }` reset is kept (correct for nav, buttons, footer, which are styled by class), but it made every in-body legal-page link invisible — including the working `mailto:` contact links. **This is a deliberate visual diff from the live site; flag it in `fidelity.md` during Phase G so it does not read as a regression.**

### 2026-08-10 · Phase B — `--radius-shell` base value corrected to `0`
Token extraction emitted `--radius-shell: 4rem` at `:root` while its own comment read "none at base." The rounding is a tablet/mobile treatment only; above 991px there is no radius. Base corrected to `0` so the max-width overrides supply the real values.

### 2026-08-10 · Design tokens derived, not copied
The compiled Webflow CSS defines only two custom properties (`--black`, `--white`). Every other token in `tokens.md` is derived by observing repeated literal values across 110KB of compiled CSS. Values there are extracted, not estimated — but the *grouping* into semantic names is a judgment call, and near-duplicate colors are listed rather than silently collapsed.
