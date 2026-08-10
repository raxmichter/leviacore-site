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

---

## Needs a decision — George (and possibly counsel)

### 5. 🆕 Four broken cross-reference links inside the legal pages
**Gates:** Phase C2. Found during Phase A, not previously known.

`privacy-policy.html` and `ccpa.html` contain four links that are **broken in two ways at once**:

| Link | Page |
|---|---|
| `https://about:blank/#SD_ChangesPrivacyPolicy` → "Changes to Our Privacy Policy" | privacy-policy |
| `https://about:blank/#SD_ChoicesAboutUse` → "Choices About How We Use and Disclose Your Information" | privacy-policy |
| `https://about:blank/#a585939` ×2 | privacy-policy, ccpa |

1. The `href` is `https://about:blank/#…`, which is not a valid destination — these were meant to be same-page fragment links and go nowhere. They also carry `target="_blank"`, which is wrong for a same-page anchor.
2. **The anchor targets do not exist.** `SD_ChangesPrivacyPolicy`, `SD_ChoicesAboutUse`, and `a585939` appear as no `id` or `name` on either page. So even with the href repaired there is nothing to land on.

This is boilerplate legal text carried in from a template whose internal cross-references were never wired up.

**Why this is not being fixed silently:** the mechanical repair is to add `id`s to the sections these phrases name and point the links at them. But this is a **compliance document**, and the sections referenced may not exist under those names — or at all. Rewriting or deleting links inside a privacy policy is not a developer's call.

**Options for George:**
- **(a)** Point each link at the matching existing section, adding `id`s — a real fix if the sections exist under different wording. Recommended if they do.
- **(b)** Strip the link, keep the text as a plain cross-reference in prose. Safe, minimal, defensible.
- **(c)** Leave as-is. Not recommended — the link checker CI gate (Phase F) will fail on these, which is exactly what that gate is for.

> Related context: the migration was prompted in part by the privacy policy being out of date because updating it was too cumbersome. This is the same problem showing up a second way. Whichever option is chosen, it is worth asking counsel whether the policy needs a content review at the same time — the cost of editing it after this migration is a text file edit.

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
