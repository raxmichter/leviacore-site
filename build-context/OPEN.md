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

### 5. 🆕 Broken and wrong links throughout the legal pages — full audit
**Gates:** Phase C2 (Tiers 1 & 3 need a decision; Tiers 2 & 4 are mechanical). Found during Phase A.

Full link audit of `privacy-policy.html`, `ccpa.html`, `notice-at-collection.html`.

#### Tier 1 — genuinely broken (4 links) ⚠️ NEEDS A DECISION

Invalid `href` **and** a non-existent anchor target. Broken twice over.

| Page | Link text | href |
|---|---|---|
| privacy-policy | "Changes to Our Privacy Policy" | `https://about:blank/#SD_ChangesPrivacyPolicy` |
| privacy-policy | "Choices About How We Use and Disclose Your Information" | `https://about:blank/#SD_ChoicesAboutUse` |
| ccpa | "Exercising Your Rights to Know or Delete" | `https://about:blank/#a585939` |
| ccpa | "Exercising Your Rights to Know or Delete" (2nd instance) | `https://about:blank/#a585939` |

`about:blank` is not a valid destination. Separately, `SD_ChangesPrivacyPolicy`, `SD_ChoicesAboutUse`, and `a585939` exist as **no `id` or `name` on either page** — so even a repaired href lands nowhere. All four also carry `target="_blank"`, wrong for a same-page jump. `notice-at-collection` is clean.

Boilerplate legal text carried from a template whose internal cross-references were never wired up.

#### Tier 2 — wrong destination (4 links) — mechanical, will be fixed in C2/F

| Page | Link text | href | Problem |
|---|---|---|---|
| ccpa | `https://leviacore.com/privacy-policy` | `…/privacy-policy.html` | **Text and href disagree**; `.html` extension the live site doesn't use |
| ccpa | `https://leviacore.com/privacy-policy.html` | same | Same, with the `.html` visible in the copy |
| privacy-policy | `https://leviacore.com/ccpa` | `https://leviacore.com/ccpa` | Non-`www`; canonical host is `www.leviacore.com` |
| privacy-policy | `www.leviacore.com` | `http://www.leviacore.com/` | Plain `http://` |

The `.html` links would 404 on the new site unless the Phase F redirect map catches them.

#### Tier 3 — dead external references (2 links) ⚠️ CONTENT ISSUE, NEEDS A DECISION

Both in privacy-policy, both `http://`:

- `http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager07.html` — **Macromedia ceased to exist in 2005 (acquired by Adobe); Flash Player reached end-of-life in December 2020.** The policy still carries a Flash cookies section pointing here.
- `http://www.networkadvertising.org/managing/opt_out.asp` — NAI opt-out moved years ago; legacy `.asp` path.

#### Tier 4 — hygiene (all three pages) — mechanical

- **Empty anchor in every footer:** `<a href="https://www.webflow.com" target="_blank" class="text-style-link"></a>` — no link text. **Fails the axe gate** (link with no accessible name), and an outbound Webflow link has no reason to survive the migration. Remove.
- `target="_blank"` with no `rel="noopener"`: 12 / 8 / 4 across the three pages. Add for correctness — modern browsers imply `noopener`, so this is tidiness, not a live vulnerability.

---

**Why Tiers 1 and 3 are not being fixed silently:** repairing Tier 1 means deciding which sections those cross-references point at, and the referenced sections may not exist under those names or at all. Tier 3 touches policy substance. Neither is a developer's call inside a compliance document.

**Options for George — Tier 1:**
- **(a)** Point each link at the matching existing section, adding `id`s. The real fix, if those sections exist under different wording.
- **(b)** Strip the link, keep the text as plain prose. Safe, minimal, defensible.
- **(c)** Leave as-is. Not recommended — the Phase F link-checker gate will fail on these, which is what that gate is for.

---

## ✅ RESOLVED — George, 2026-08-10. This supersedes the recommendation below.

### 🔑 Root cause found: **every in-body link in the legal pages is invisible**

The site's global CSS applies `a { color: inherit; text-decoration: inherit; font-size: inherit; }`, and **none of the in-body legal links carry a class**. There is no `.text-rich-text a` rule restoring link styling. They render with no color and no underline — visually identical to surrounding body text.

This is why the broken links were never noticed. It affects the *working* links equally: the three `mailto:development@leviacore.com` contact links and the Google privacy policy link are all invisible too.

**Action (Phase C2):** restore visible link styling inside rich-text content. This is a deliberate visual change from the live site — **flag it in `fidelity.md` during Phase G so it does not read as a regression.**

### Tier 1 → **mechanical, no counsel needed. Do it in C2.**

The target sections **exist**; they are pseudo-headings, not real headings:

| Link text | Exists in source as |
|---|---|
| Changes to Our Privacy Policy | `<strong>Changes to Our Privacy Policy:</strong>` (privacy-policy) |
| Choices About How We Use and Disclose Your Information | `<strong>Choices About How We Use and Disclose Your Information:</strong>` (privacy-policy) |
| Exercising Your Rights to Know or Delete | `<strong><em>Exercising Your Rights to Know or Delete</em></strong>` (ccpa) |

**Fix:** promote every section title to a real `<h2>`/`<h3>` with a stable `id`, repoint the four links as same-page fragments, drop `target="_blank"`. **No policy text changes** — this is markup structure only, which is why it does not need counsel.

> Both documents currently have **zero heading structure** (only the page `<h1>`). Promoting section titles fixes a real accessibility defect and an axe failure for free — a screen reader user currently cannot navigate these documents.

### Tier 2 → confirmed **body text**, not footer. Mechanical, fix in C2.
Footer legal links are separate relative links and are correct.

> **⚠️ Corrected count: there are FIVE, not four.** `https://leviacore.com/` in `ccpa.html` was missed on the first pass. All five — with visible text, current href, correct value, and document location — are documented in **`../../legal-page-url-reference.md`**, a standing reference for future policy edits. Work from that file, not from the Tier 2 table above.

### Tier 3 → **remove the links, leave the prose. CLOSED.**

**George, 2026-08-10:** *"The text will be updated when we next update the policy (RE: Flash), disregard and proceed."*

- **Remove both links** — Macromedia/Flash Player settings, and the NAI opt-out.
- **Do not touch the surrounding prose.** Accepted consequence: the Flash sentence temporarily reads *"…see this website"* with no link. This is a known, deliberate state, to be resolved at the next policy revision. **Do not "fix" it by rewording — that is a content change to a compliance document and it is not ours to make.**
- Do not repoint the NAI link to its new URL either; the direction was to remove, and the same policy revision covers it.

### Tier 4 → **clean up. George: "we're moving off Webflow."**
Remove the empty `<a href="https://www.webflow.com">` from all three footers. Add `rel="noopener"` where `target="_blank"` remains.

---

*Superseded recommendation, kept for the record:* route Tiers 1 and 3 to counsel as one content review. This was written before it was established that the Tier 1 target sections exist in the document — which makes Tier 1 a markup fix, not a content decision.

> Related context: the migration was prompted in part by the privacy policy being out of date because updating it was too cumbersome. This is the same problem showing up a second way. Whichever option is chosen, it is worth asking counsel whether the policy needs a content review at the same time — the cost of editing it after this migration is a text file edit.

### 6. 🆕 Satoshi renders as faux-bold on the live site — replicate, or license the real weights?
**Gates:** nothing. **Default is already implemented.** This is a redesign question parked here so it isn't lost.

The compiled CSS requests Satoshi at weights **300, 500, 600, and 700** — 57 `<strong>` tags, 27 `<label>` tags, rich-text `strong` and `blockquote`, and the mobile menu among them. Only `Satoshi-Regular.woff` (400) exists, and **both** `@font-face` blocks in the source CSS declare `font-weight: 400` pointing at that one file.

**So the live site has never had real Satoshi bold.** Those `<strong>` tags are browser-synthesised faux-bold in production today.

**What the build does (default, already in place):** replicate it exactly — one `@font-face` at 400, synthesis left to the browser. This is what pixel-identical *means* here.

**The alternative:** license and self-host real Satoshi 300/500/600/700. Genuinely better typography — real bold is cleaner than synthesised bold. But it **changes the design**, would diverge from the Phase G visual-regression reference, and is out of scope for a migration that is explicitly not a redesign.

**Recommendation: keep the default and revisit at redesign time.** No action needed now. Flagged only because "the site's bold text isn't real bold" is the kind of thing that is invisible until someone notices it and assumes the migration caused it. It did not.

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

- ~~**Satoshi weight coverage**~~ ✅ **Resolved — see item 6 below.** Not a blocker.
- **OG/Twitter card image is hosted on `i.imgur.com`** — an external host for the site's primary social preview. Localize into the repo.
- **Footer reads "© Leviathan Core, LLC 2025"** — already stale. Make the year dynamic at build time.
- **GA4 tag `G-EG4F7ZLTZQ`** — present in every page head. Must survive migration.
- **Homepage `<title>` is only "Leviathan Core"** — weakest SEO on the highest-value page. Interior pages are correct (`Spiritfarer | Leviathan Core`). Fixed in D2.
- **`alt=""` sitewide** — present but empty on all meaningful images, including all 11 headshots and every client logo. Fixed systematically in D2 and enforced by the axe CI gate.
- **Five case study URLs must be preserved exactly** — `/project/<slug>`. URL parity is the single non-negotiable SEO rule. Slugs come from the CSV.
