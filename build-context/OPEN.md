# OPEN ITEMS

**Read this second, right after `PROGRESS.md`.** What is blocked, on whom, and what it actually gates.

Last reviewed: 2026-08-10

---

## Blocking — CTO

### 1. Projects Collection CSV + 5 case study hero images ⛔ THE ONE HARD BLOCKER
**Gates:** Phase D2 content only — five Markdown files. Does **not** block D1 (schema + template), and does not block any other phase.

Webflow Collection content does not export. `projects.html`, `index.html`, and `detail_project.html` all contain empty `w-dyn-list` blocks where the five case studies would render. Needed: CSV export from the CMS panel, plus the five hero images.

> ⚠️ **DO NOT DELETE OR CANCEL THE WEBFLOW SITE.** CMS image fields export as URLs pointing at Webflow's CDN, not as files. Deleting the source site breaks them permanently. Sequence: export → download and localize → verify → cut over → *then* wind down. The live site is also the visual regression reference for Phase G.

### 2. Contact form recipient + endpoint choice
**Gates:** post-Phase-H cutover. Does not block the build.
Confirmed by inspection: the form has **no `action` attribute** — it was handled entirely by Webflow and will silently stop working at cutover. Fields are Name, Email, Message. Needs a destination (Netlify Forms / Formspree / other) and a recipient address.

### 3. DNS cutover window
**Gates:** post-Phase-H.

### 4. Google Search Console baseline ⏰ TIME-SENSITIVE
**Gates:** meaningful post-cutover verification.
Roughly ten minutes of work, and it **must happen before cutover**. Without a pre-migration snapshot of rankings and coverage there is no way to distinguish a migration-caused change from normal fluctuation. This is the difference between diagnosing a problem and arguing about one. It becomes unrecoverable the moment DNS flips.

---

## Resolved

| Item | Resolution |
|---|---|
| Adobe Fonts licensing risk | ✅ None in use. Google Fonts (Syne, Roboto Mono) + self-hosted Satoshi only |
| Interactions inventory and true scope | ✅ 19 action lists, 93 event bindings, 9 event types. 13 trivial-to-low, 4 medium. ~1 session |
| `gcx.html` — keep or drop | ✅ Dropped; 301 to homepage |
| Blog — build now or later | ✅ Build structure now, ship disabled, document enablement |
| CMS UI layer | ✅ Out of scope; CTO owns |

---

## Watch list

Not blocking, but will cause a defect if forgotten.

- **Satoshi weight coverage** — only `Satoshi-Regular.woff` (400) shipped. If the compiled CSS uses another weight, the source file must be found. Answered by `token-extractor` in Phase A.
- **OG/Twitter card image is hosted on `i.imgur.com`** — an external host for the site's primary social preview. Localize into the repo.
- **Footer reads "© Leviathan Core, LLC 2025"** — already stale. Make the year dynamic at build time.
- **GA4 tag `G-EG4F7ZLTZQ`** — present in every page head. Must survive migration.
- **Homepage `<title>` is only "Leviathan Core"** — weakest SEO on the highest-value page. Interior pages are correct (`Spiritfarer | Leviathan Core`). Fixed in D2.
- **`alt=""` sitewide** — present but empty on all meaningful images, including all 11 headshots and every client logo. Fixed systematically in D2 and enforced by the axe CI gate.
- **Five case study URLs must be preserved exactly** — `/project/<slug>`. URL parity is the single non-negotiable SEO rule. Slugs come from the CSV.
