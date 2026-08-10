# Leviathan Core — Component Inventory & Build Map

Source: static Webflow export (`_webflow-export/index.html`, `services.html`, `projects.html`, `team.html`, `contact.html`) as published 2026-08-10. This document is the single input Phase B should build the Astro component tree from — no need to reopen the export HTML.

---

## 1. Component Inventory

### Layout / chrome

**1. `SiteHeader`** — sticky site header with logo, primary nav, CTA button, social icons, and hamburger trigger.
- Wraps: `header.header` > `.navbar-wrapper` > `.navbar` > `.page-padding` > `.container-xxlarge` > `header.navbar-inner` (yes, nested `<header>` tags in source) + a `.line` divider below it.
- Slots/props: `currentPath` (to compute active state), logo image (`images/LC-SITE-NAV.png`, 250w, has `p-500`/`p-800` responsive variants).
- Classes: `navbar-left`, `navbar-logo`, `navbar-logo-image`, `navbar-right`, `navbar-menu`, `navbar-menu-item-link`, `navbar-right-inner`, `navbar-right-button`, `navbar-right-social`, `mobile-menu-toggle` (contains 3 `mobile-menu-toggle-line` divs, `_01/_02/_03`, the hamburger bars), `line-vertical hide-mobile-landscape`.
- Used on: all 5 pages, identical structure everywhere; only the `w--current`/`aria-current="page"` placement changes per page (see §3).

**2. `MobileMenu`** — full nav panel shown at mobile widths, sibling of `SiteHeader`'s inner navbar (both live inside `header.header`).
- Wraps: `.mobile-menu` > `.page-padding` > `.container-xxlarge` > `.mobile-menu-wrapper` > `.mobile-menu-nav`.
- Contains: nav links (`mobile-menu-nav-link` / `mobile-menu-nav-text`) separated by `.line` dividers, then a primary CTA button ("Let's talk" → contact.html).
- Props: `currentPath` for active state; toggle open/closed state is driven in the original by `data-w-id` + webflow.js (excluded) — Phase B must reimplement the open/close interaction from scratch (no JS logic to port).
- **Flag:** includes two links to pages outside migration scope: `template-info/blog.html` (link has class `hide` — entire `<a>` is hidden) and `template-info/shop.html` (link itself is visible but its label span carries class `hide`, so it renders as an empty visible link — looks like a Webflow authoring artifact/bug, not intentional). Recommend dropping both from the rebuilt mobile menu since Blog/Shop templates are excluded from this migration.

**3. `SiteFooter`**
- Wraps: `.footer` > `.page-padding` > `.container-xxlarge`, preceded by a `.line`.
- Sections: `footer-grid-left` (logo `images/LC-SITE-NAV.png` @333w, tagline text, `subnav small` social badges with `target="_blank"`), `footer-grid-right` containing two `footer-column` blocks ("Pages" and "Legal" nav lists), then a `.line` and `footer-bottom` copyright bar.
- Identical across all 5 pages except which footer-nav link carries `w--current`.
- **Flag:** Legal column links to `privacy-policy.html`, `ccpa.html`, `notice-at-collection.html` — none of these files are among the 5 source files provided to this agent; their existence/content is unverified and out of scope for this inventory, but the footer must still emit these hrefs for URL parity.

**4. `Button`** (aka `ButtonPrimary`) — the site's only button style, used for every CTA.
- Markup: `a.button.primary.w-inline-block > .button-inner > (.button-inner-text, .button-inner-text-hover)`. The duplicated text span is a Webflow hover-swap animation pattern (text slides/crossfades on hover) — reimplement with CSS only, both spans should contain identical text.
- A `.button` (no `.primary`) variant also exists — used for the projects.html "View Project" card CTA. Same `button-inner` / hover-swap structure, different visual treatment (secondary/outline style, inferred from class absence — actual visual styling lives in the excluded CSS file, so Phase B must decide the treatment, not read it from here).
- Props: `href`, `text`, `variant` ("primary" | "secondary").
- Used on: header (nav CTA, mobile CTA), homepage hero-adjacent sections, services.html (4x, one per service block), projects.html card, all contact-form submit buttons use a plain `<input type="submit">` styled as `.button.primary.w-button` — NOT the same DOM shape as the link-based button (no `button-inner` wrapper, no hover-swap span). Treat the submit control as a separate small variant or just style `<button type="submit">` to match.

**5. `SocialBadge`** — small square icon-badge link for Twitter/LinkedIn.
- Markup: `a.badge.small.link.w-inline-block > div.text-meta-small` with text "Tw"/"IN" (header, contact-hero social row) or "TW"/"IN" (footer — capitalization differs, note it but it's cosmetic).
- Props: `platform`, `href`, `target` (footer sets `target="_blank"`, header/contact-hero rows do not).
- Used on: `SiteHeader` (`navbar-right-social`), `SiteFooter`, and inline in every "Contact" hero block (`subnav small`) on index/services/contact pages.
- **Flag (real links vs placeholders):** Twitter is consistently `https://twitter.com/leviacore`. LinkedIn is `https://www.linkedin.com/company/leviathan-core/` in the header and footer, but is a bare `href="#"` placeholder in every hero "Contact" block's social row (index, services, contact.html) — LinkedIn was apparently never wired up in those inline spots. Index's hero also has Twitter correct but LinkedIn as `#`; services.html and contact.html have BOTH social links as `#` in that spot. Needs real URLs supplied during rebuild.

**6. `SectionShell`** — the universal outer wrapper nearly every `<section>` uses.
- Pattern: `section.<section-name> > .page-padding > .container-xxlarge > [.line] > .padding-vertical.padding-{large|xlarge}`.
- Props: `sectionClass` (unique per-section modifier, e.g. `section-home-hero`), `padding` size, `withTopDivider` (boolean — whether a `.line` precedes the padded content; most sections have one, but the very first section on every page (the hero) never does, and `contact.html`'s single section omits it too — see §7 divergence notes).
- This is the backbone layout primitive; nearly every other component nests inside it.

**7. `Divider`** — `div.line` (horizontal) and `div.line-vertical` (vertical, often with `hide-mobile-landscape`/`hide-tablet`/`show-tablet` responsive-visibility modifiers). Purely decorative rule, no content/props beyond orientation + responsive-hide variant.

**8. `Cursor`** (optional/low-priority) — `.cursor-wrapper > .cursor > .cursor-text.view` ("View") — a custom cursor-follower used for hover states over project images, entirely driven by `webflow.js` (excluded from migration). Identical markup on all 5 pages. Recommend either dropping it or reimplementing the hover-cursor behavior natively in Astro/JS if the "View" cursor-follow effect on project cards is wanted; no source logic is available since webflow.js was excluded from this inventory.

### Text / heading primitives

**9. `Eyebrow`** — small uppercase label text, class `text-meta`, used standalone as section labels (e.g. "brands we've helped", "Contact", "How we work"). Not a distinct component structurally (just a styled `<div>`/`<h2>`), but call out as a reusable text style token.

**10. `SectionHeading`** — `h1`/`h2` with classes `heading-large`, `heading-medium`, `heading-small`, `heading-h1` (often combined with `text-uppercase`), `heading-h4`. Treat as a typographic scale, not a component with logic — but Phase B should define these as named heading style variants since they recur constantly.

### Homepage-specific

**11. `HomeHero`** — `section-home-hero`: `h1.heading-medium` (2-line, `<br>`-separated headline) + `.text-size-xlarge` intro paragraph, plus a large image (`home-hero-image-wrapper`, `LC-Team-Final.jpg`). Single-page-only, not reused — could stay inline in the page rather than becoming a generic component.

**12. `ClientLogoStrip`** — `section-home-clients`: eyebrow "brands we've helped" + `.home-clients-logos` flex row of 8 `<img>` client logos (no links, no captions).
- Props: `logos: {src, alt}[]`.
- Logos in order: `amazon_games.png`, `bungie.png` (has p-500 srcset), `thunder_lotus.png`, `digital_extremes.png` (has p-500 srcset), `grinding_gear.png`, `north_beach.png`, `2K_2021_Logo.png` (has p-500 srcset, width 475), `private_division.png`.
- Used on: index.html only (once).

**13. `ServiceSummaryGrid` / `ServiceSummaryItem`** — `section-home-services`: intro copy on the left, a 2x2 icon-grid on the right (`home-services-grid-right`, two `.home-services-grid-right-row` rows separated by a `.line`, each row split by a `.line-vertical`/`.line` responsive divider).
- Item markup: `img` (icon svg) + `h3.text-uppercase` (title) + plain description `<div>`.
- 4 items, in order: Consulting (`icon-01.svg`), Campaigns (`icon-02.svg`), Legal (`icon-03.svg`), Finance (`icon-04.svg`).
- Used on: index.html only. Note the same 4 icon SVGs (`icon-01..04.svg`) and same 4 topic names (Consulting/Campaigns/Legal/Finance) are reused as the anchor-link set in the services.html hero and as the 4 `ServiceDetailBlock`s on services.html — a content model of "4 core service pillars" should be shared/sourced once, not hand-typed 3 times.

**14. `FeaturedProjectsTeaser`** — `section-home-projects`: heading "Featured projects" + copy + `Button` ("See more" → projects.html) on the left; on the right, **two side-by-side CMS-bound lists** (see §6 CMS placeholders) separated by a `.line.hide-tablet`. This is the homepage's compact project-card component, distinct from the full `ProjectCard` used on projects.html.

**15. `HowWeWork`** — `section-home-how`: eyebrow "How we work" + `h2.heading-medium` + a full-width paragraph below the grid. Single-use, page-specific.

**16. `ValuesList`** — `section-home-values`: centered `h2.heading-small.text-uppercase` "the values at our core." above a `.line`, then `.home-values-grid`: a portrait image (`LC-Head.png`) on the left + `.home-values-grid-right`, a **static vertical list** of 4 `.home-values-item` rows separated by `.line`.
- Item markup: `.badge > div.text-meta` (2-digit number "01"–"04") + `h3.text-uppercase` (title) + description `<div>`.
- **Note:** the task brief calls this an "accordion" but the exported markup shows no expand/collapse affordance, no `<details>`, no toggle classes, and no interactive JS hooks — it renders as a plain static numbered list. If accordion behavior is desired in the rebuild it will be new interaction design, not a port of existing behavior.
- Items, in order: 01 AUTHENTICITY, 02 TRANSPARENCY, 03 ADAPTIVITY, 04 TEAMWORK (identical copy on both index.html and team.html — this whole block is byte-for-byte duplicated between those two pages, differing only in Webflow's auto-generated `w-node-*` ids, which are not meaningful and can be discarded).
- Used on: index.html and team.html (verbatim duplicate — should become one shared component, not two separate builds).

**17. `ContactCTA`** (the "Contact" hero-style block that recurs at the bottom/top of several pages — not the full-page contact.html layout, see below) — eyebrow "Contact" + `h1.heading-medium` headline + tagline text + `SocialBadge` row + `ContactForm`.
- Wraps: `.contact-hero-grid` (two columns: `contact-hero-grid-left` copy, `contact-hero-grid-right` form).
- Used on: index.html (as the page's final section, inside `section-home-contact`), services.html (as the page's final section, same `section-home-contact` class), and contact.html (as its *only* section, same `section-home-contact` class again). See §7 for exact copy/structural divergence across the three instances.

### Services page-specific

**18. `ServiceDetailBlock`** — the repeating unit that makes up 80% of services.html, used 4x with an anchor `id`.
- Wraps: `.services-grid` (two columns, `.line-vertical`/`.line` divider between): left = `.services-grid-left-inner` (icon `<img>`, `h2.text-uppercase` title, `.service-list` of `text-meta` tag chips, `Button` primary "let's make it happen" → contact.html); right = `.services-grid-right` (`h3.heading-h1` headline + `.services-branding-text` body paragraph).
- Props: `id` (anchor target), `icon`, `title`, `tags: string[]`, `ctaText`, `headline`, `body`.
- The 4 instances (section id → title → tag list → cta label → headline):
  1. `id="branding"`, class `section-services-branding` — **Consulting** (`icon-01.svg`) — tags: influencer trends / Creator programs / patterns of success / activation strategies — CTA "let's make it happen" (lowercase) — headline "Whether you're seasoned veterans or relative noobs to influencer marketing, expert guidance always helps."
  2. `id="design"`, class `section-services-design` — **campaigns** (`icon-02.svg`) — tags: paid & organic / Creator collaborations / logistics & event coordination / early access planning — CTA "Let's make it happen" — headline "Influencer campaigns should influence. We make sure they do."
  3. `id="video"`, class `section-services-video` — **legal** (`icon-03.svg`) — tags: negotiations / contracts / compliance — CTA "Let's make it happen" — headline "Mistakes are costly in this game. We help brands minimize risk and plan ahead."
  4. `id="content"`, class `section-services-content` — **finance** (`icon-04.svg`) — tags: Creator payments / budget planning & Forecasting / creator tax forms — CTA "Let's Make it happen" (capital M) — headline "If you want influencer marketing that pays off, make sure it pays out, too."
- **Flag:** the anchor `id`s (`branding`, `design`, `video`, `content`) and the CSS section-name classes (`section-services-branding`, `-design`, `-video`, `-content`) are legacy/mismatched leftovers from an earlier template — they do **not** describe the current content (e.g. `id="video"` holds the Legal block, `id="content"` holds Finance). The services-hero's jump-nav (`Label` links, see #19) correctly targets these ids by position, so the mismatch is invisible to users, but Phase B should rename ids/classes sensibly (e.g. `consulting`, `campaigns`, `legal`, `finance`) rather than preserving the confusing legacy names — just make sure the hero's 4 anchor links are updated to match whatever new ids are chosen.

**19. `Label`** — pill-style jump-link used only in the services.html hero subnav.
- Markup: `a.label.w-inline-block > .label-inner > (.label-text, .label-text-hover)` (same hover-swap text-duplication pattern as `Button`).
- 4 instances: "Consulting" → `#branding`, "Campaigns" → `#design`, "Legal" → `#video`, "Finance" → `#content`.

### Team page-specific

**20. `TeamMemberCard`** — see full roster in §5 below. Markup: `.studio-team-image-wrapper > img.image-cover` + `h3.heading-h4` (name) + `div.text-meta` (role). No bio text, no social links, no CTA — just image + name + role, full stop.

**21. `ProjectCard`** (projects.html) and **22. `ProjectPreviewCard`** (index.html teaser, two sub-variants) — see §6 CMS placeholders for full field/markup breakdown; these are the two card templates bound to the (currently empty) 5-case-study collection.

**23. `ContactForm`** — see §4 for full field-level breakdown.

**Component count: ~23** distinct reusable units identified above (some very small/token-like, like `Divider` and `Eyebrow`), comfortably inside the "roughly 10–20" estimate once trivial style-token entries (`Divider`, `Eyebrow`, `SectionHeading`) are folded into a shared typography/layout primitives file rather than counted as standalone components. Treat items 1–8 plus 17, 18, 20, 21/22, 23 (13 items) as the "real" component build list; 9–10, 16 as shared layout/typography primitives; 11–16, 19 as page-specific or small reusable blocks.

---

## 2. Page Composition Map

### `index.html`
1. `SiteHeader` (+ `MobileMenu`)
2. `HomeHero` — h1 "You can't buy hype,<br>But you can earn it." + intro + hero image
3. `ClientLogoStrip` — "brands we've helped" + 8 logos
4. `ServiceSummaryGrid` — "Services that stand out" + 4 `ServiceSummaryItem`s (Consulting/Campaigns/Legal/Finance)
5. `FeaturedProjectsTeaser` — "Featured projects" + See more button + 2x CMS-bound `ProjectPreviewCard` lists (empty)
6. `HowWeWork` — "How we work" / "PEOPLE SHARE WHAT THEY LOVE..." + paragraph
7. `ValuesList` — "the values at our core." + 4 values
8. `ContactCTA` (`section-home-contact`) — "IT'S TIME TO FIND YOUR FANDOM" + `ContactForm`
9. `SiteFooter`

### `services.html`
1. `SiteHeader` (+ `MobileMenu`)
2. Services hero — h1 "We Help Brands Stand Out" + 4x `Label` jump-nav + intro paragraph
3. `ServiceDetailBlock` #1 — Consulting (`id="branding"`)
4. `ServiceDetailBlock` #2 — Campaigns (`id="design"`)
5. `ServiceDetailBlock` #3 — Legal (`id="video"`)
6. `ServiceDetailBlock` #4 — Finance (`id="content"`)
7. `ContactCTA` (`section-home-contact`) — "It's time to find your fandom." + `ContactForm`
8. `SiteFooter`

### `projects.html`
1. `SiteHeader` (+ `MobileMenu`)
2. Projects hero — h1 "Driving Results That Matter" + intro paragraph (no `SectionShell` divider line before it, same as every page's first section)
3. `section-work-projects` — single CMS-bound list of `ProjectCard`s (empty, "No items found." shown)
4. `SiteFooter`

Note: **no `ContactCTA` / contact form section on this page.**

### `team.html`
1. `SiteHeader` (+ `MobileMenu`)
2. Studio hero — h1 "Meet the team that makes it happen." + intro paragraph + an **empty** `.studio-hero-image-wrapper` div (no `<img>` inside it at all — dead markup, safe to drop or repurpose)
3. `section-studio-team` — "Our Team" heading/intro + 6 rows × 2 `TeamMemberCard`s (11 real members + 1 "We're Hiring" card) = §5
4. `ValuesList` — "the values at our core." + 4 values (verbatim duplicate of index.html's block)
5. `SiteFooter`

Note: **no `ContactCTA` / contact form section on this page either.**

### `contact.html`
1. `SiteHeader` (+ `MobileMenu`)
2. `ContactCTA` (`section-home-contact`) — the page's only section: "It's time to find your fandom." + `ContactForm`. **Structural divergence:** this instance omits the `.line` divider that precedes `.padding-vertical` in the index.html/services.html copies of this same section class — go straight from `.container-xxlarge` to `.padding-vertical.padding-xlarge`.
3. `SiteFooter`

---

## 3. Nav & Footer Link Structure

### Header primary nav (`navbar-menu`), identical set/order on every page:
| Text | href | `w--current` applies on |
|---|---|---|
| Services | `services.html` | services.html |
| Projects | `projects.html` | projects.html |
| Team | `team.html` | team.html |

- Logo (`navbar-logo` link) → `index.html`; only carries `w--current`/`aria-current="page"` on index.html itself.
- CTA button ("Let's make it happen") → `contact.html`; only carries `w--current`/`aria-current="page"` on contact.html itself.
- Social: Twitter → `https://twitter.com/leviacore`; LinkedIn → `https://www.linkedin.com/company/leviathan-core/`. Neither ever carries a current state (external).

### Mobile menu (`mobile-menu-nav`), identical set/order on every page:
Services (`services.html`) → Projects (`projects.html`) → Team (`team.html`) → *Blog (`template-info/blog.html`, hidden, out of scope)* → *Shop (`template-info/shop.html`, visually broken/hidden label, out of scope)* → Contact (`contact.html`) → CTA button "Let's talk" (`contact.html`).
`w--current`/`aria-current="page"` applies to whichever of Services/Projects/Team/Contact matches the current page, and to the CTA button specifically on contact.html (it duplicates the current-state onto the button too, only on contact.html).

### Footer "Pages" column, identical set on every page, **different order from the header nav**:
Home (`index.html`) → Services (`services.html`) → Team (`team.html`) → Projects (`projects.html`) → Contact us (`contact.html`).
`w--current` applies to whichever link matches the current page (on index.html it's the only place `w--current` appears for "Home" — the header nav has no Home link at all, only the logo).

### Footer "Legal" column, identical on every page, never gets a current state (none of these pages are in our source set):
Privacy Policy (`privacy-policy.html`) → CCPA (`ccpa.html`) → California notice at collection (`notice-at-collection.html`).

### Footer social (`subnav small`, `target="_blank"`), identical on every page:
TW → `https://twitter.com/leviacore`; IN → `https://www.linkedin.com/company/leviathan-core/`.

### Footer bottom bar: 
"© Leviathan Core, LLC 2025" + "- ALL RIGHTS RESERVED" (the latter has a trailing empty `<a href="https://www.webflow.com" target="_blank" class="text-style-link">` with no text content — Webflow's "made in Webflow" credit link, rendered empty/invisible; safe to drop entirely).

---

## 4. Contact Form

The form markup is **identical in shape** on index.html, services.html, and contact.html, but field `name` attributes differ between the index/services copies and the contact.html copy. All three:

- `<form>` attributes: `id="contact-form"`, `name="wf-form-Contact-Form"`, `data-name="Contact Form"`, `method="get"`, class `form`, plus Webflow-internal `data-wf-page-id` / `data-wf-element-id` (discard both — no functional meaning outside Webflow).
- **No `action` attribute anywhere.** This is a Webflow-native form: Webflow's own backend intercepted `POST`s to `/wf-form-Contact-Form` via `webflow.js` and its own submission handler (excluded from this migration). **This must be replaced entirely** — there is no working submit endpoint in the exported markup. Phase B/whoever wires this up needs a real handler (e.g. an Astro API route, a form service like Formspree/Basin, or serverless function) and must add a real `action`/`method="post"`/`fetch` submit handler.

### Fields (index.html / services.html version):
| Field | Input | `name` | `id` | `maxlength` | `placeholder` | required? | label |
|---|---|---|---|---|---|---|---|
| Name | `<input type="text">` | `name` | `name` | 256 | "Your Name" | not marked required in markup | none (placeholder-only, no visible `<label>`) |
| Email | `<input type="email">` | `email` | `email` | 256 | "Your Email" | not marked required | none |
| Message | `<textarea>` | `Message` | `Message` | 5000 | "Your Message" | not marked required | none |

### Fields (contact.html version — capitalization differs):
| Field | Input | `name` | `id` | `maxlength` | `placeholder` | required? | label |
|---|---|---|---|---|---|---|---|
| Name | `<input type="text">` | **`Name`** (capital) | `name` | 256 | "Your Name" | not required | none |
| Email | `<input type="email">` | **`Email`** (capital) | `email` | 256 | "Your Email" | not required | none |
| Message | `<textarea>` | `Message` | **`Message-2`** (different id) | 5000 | "Your Message" | not required | none |

**Flag:** none of the three field types have HTML `required` attributes or visible `<label>` elements anywhere in the export — only `placeholder` text stands in for labels. Accessibility-wise, Phase B should add real `<label>`s (visually-hidden if the placeholder-only look is to be preserved) and decide on required-field validation, since none exists in the source. Also standardize the field `name` casing (pick one of `name`/`Name`, `email`/`Email` — recommend lowercase to match 2 of the 3 instances) since the export is inconsistent.

### Submit button:
`<input type="submit" data-wait="Please wait..." class="button primary w-button" value="Submit">` — text "Submit", with a Webflow-native `data-wait` loading-state swap ("Please wait...") that has no functional wiring without webflow.js; must be reimplemented (e.g. disable + swap label on submit).

### Success message:
`<div class="form-message-success w-form-done"><div>Thank you! Your submission has been received!</div></div>` — identical on all 3 pages.

### Error message:
`<div class="form-message-error w-form-fail"><div>Oops! Something went wrong while submitting the form.</div></div>` — identical on all 3 pages.

Both message blocks exist in the static markup already (Webflow normally toggles their visibility via inline styles/JS on submit) — Phase B needs to reimplement the show/hide logic for both states.

---

## 5. Team Page Specifics (team.html — static, not CMS)

`section-studio-team` contains 6 rows (`studio-team-grid-right-row`), 2 cards each, 12 slots total = **11 real team members + 1 "We're Hiring" placeholder card**. Every card uses the identical DOM shape (`.studio-team-image-wrapper > img.image-cover`, `h3.heading-h4` name, `div.text-meta` role) — the hiring card is **not structurally different**, it's the exact same component with different content, which is worth calling out explicitly since the brief expected a structural difference and there isn't one in the markup.

No bio text and no social links exist on any card, for any member — name + role + photo only.

| # | Name | Role / Title | Image filename | Notes |
|---|---|---|---|---|
| 1 | George DePree | Founder & Chief Executive Officer | `images/GeorgeDePree-FINAL.jpg` | |
| 2 | Colin Fisher | Chief Marketing Officer | `images/ColinFisher-FINAL.jpg` | |
| 3 | Jordi Chapdelaine | Chief revenue Officer | `images/JordiChapdelanie-FINAL.jpg` | **Filename is misspelled** ("Chapdelanie" vs the displayed name "Chapdelaine") — keep the filename exactly as-is when copying the asset, don't "fix" it and break the reference. Also note role text is lowercase "revenue" mid-sentence in source ("Chief revenue Officer") — likely an authoring typo; consider normalizing to "Chief Revenue Officer" during rebuild. |
| 4 | Alex Owen | General Counsel | `images/AlexOwen-FINAL.jpg` | |
| 5 | Max Richter | Chief Technology Officer | `images/MaxRichter-FINAL.jpg` | |
| 6 | Audrey Lennon | Operations manager | `images/AudreyLennon-FINAL.jpg` | |
| 7 | Isa Yusuf | Finance & accounting lead | `images/IsaYusuf-FINAL.jpg` | |
| 8 | Sonia Pearson | Assistant Project Manager | `images/sonia.jpg` (has responsive `srcset`: `sonia-p-500.jpg` 500w, `sonia-p-800.jpg` 800w, `sonia.jpg` 1056w) | role div has a trailing empty `<br>` in source markup |
| 9 | Miko Riva | Project lead | `images/MikoRiva-FINAL.jpg` | |
| 10 | Edward Revill-Johnson | Project lead | `images/Edshot.remini-enhanced.png` (srcset: `-p-500`, `-p-800`, `-p-1080`, full 1160w) | role div has a trailing empty `<br>`; filename doesn't match displayed name at all ("Edshot" vs "Edward Revill-Johnson") |
| 11 | Susan Flynn | Accounts receivable | `images/SusanHeadshot-modified.remini-enhanced.png` (srcset: `-p-500`, `-p-800`, `-p-1080`, full 1160w) | |

### "We're Hiring!" block (occupies row 3, slot 2 — between Max Richter and Audrey Lennon):
- Same card markup as everyone else: `images/were-hiring.jpg` + `h3` "We're Hiring!" + `div.text-meta` "Director of business development".
- No link/CTA anywhere in the card despite being a job posting — it's a static, non-interactive placeholder image+text, exactly like every real member card. If Phase D2 wants it to link to a job posting/application, that's new functionality, not present in the source.

---

## 6. CMS Placeholders (empty `w-dyn-list` blocks)

Both index.html and projects.html contain Webflow CMS Collection List bindings with zero items in the export (all show a "No items found." `w-dyn-empty` fallback). The 5 real case studies are missing from the export; below is the exact template shape each card would repeat, and the fields each binds.

### `index.html` — `FeaturedProjectsTeaser` (two side-by-side lists inside `.home-projects-grid-right`, separated by `.line.hide-tablet`)

**List A** (plain, `w-dyn-items`, item class `w-dyn-item`):
```
div.margin-bottom.margin-small
  a.project-preview-image-wrapper.w-inline-block
    img.image-cover.w-dyn-bind-empty   ← bound: project thumbnail (src empty, alt empty)
div.project-preview-content
  a.w-inline-block
    h3.heading-h4.w-dyn-bind-empty     ← bound: project title (also the link's href target)
  div.text-meta.w-dyn-bind-empty       ← bound: category/client meta label
```

**List B** (`w-dyn-items` additionally classed `home-project-preview-grid`, item additionally classed `home-project-preview-item`): identical field shape to List A, but the `<img>` carries explicit `height="500" width="500"` attributes. Same 3 bound fields: thumbnail image, title+link, meta label.

**Divergence:** two separate collection-list bindings render side by side with slightly different item classes/image sizing — most likely a "1 featured item + N grid items" pattern from the original CMS setup (e.g. List A = first/featured project styled larger, List B = the remaining projects in a tighter grid). Since both are empty in the export, the exact count-per-list split (e.g. limit 1 vs limit 4) can't be confirmed from markup alone — flag for whoever has Webflow CMS/dashboard access to confirm the original item-count/filter settings before building the Astro content collection query.

### `projects.html` — `ProjectCard` (single list, `.work-projects-list.w-dyn-items`, item class `work-projects-item.w-dyn-item`)

```
div.padding-vertical
  div.work-projects-item-grid
    div.work-projects-item-grid-left
      div
        div.margin-bottom.margin-medium
          div.max-width-small
            a.w-inline-block
              h2.heading-h1.text-uppercase.w-dyn-bind-empty   ← bound: project title (+ link href)
            div.w-dyn-bind-empty                              ← bound: subtitle/description text
        div.w-dyn-list  (nested inner collection list)
          div.work-projects-item-services.w-dyn-items
            div.w-dyn-item
              a.text-meta-link                                ← bound: repeating "service" tag(s), each its own link/label
      a.button.w-inline-block                                 ← static CTA label "View Project" (href bound to project detail page)
    a.work-projects-item-image-wrapper.w-inline-block
      img.image-cover.w-dyn-bind-empty                        ← bound: project hero/cover image
```

Fields per card: **title** (h2 + link target), **subtitle/description** (plain text div), **services/tags** (a nested repeating collection of text links — i.e. each project can have multiple tags, not just one), **cover image**, and an implicit **detail-page link** (both the title and the whole right-side image are wrapped in links pointing at a project detail page; the "View Project" button is a third link to the same destination). 

**Flag:** the actual detail pages this would link to (`detail_*.html` in the export folder) are explicitly excluded from this migration per your instructions — so the "View Project" / title-link / image-link destinations have no corresponding page in scope yet. Confirm with the team whether detail pages are being rebuilt in a later phase or whether these cards should link elsewhere (e.g. an external case-study PDF, or just be non-clickable) before wiring up hrefs.

This `ProjectCard` (projects.html) is visually/structurally a different, larger template than the `ProjectPreviewCard` used in the homepage teaser — treat them as two separate components bound to the same underlying 5-case-study content, not one component reused twice.

---

## 7. Repetition Notes

**Verbatim duplicates (should become exactly one shared component):**
- `SiteHeader` + `MobileMenu` — identical on all 5 pages (only active-state classing differs, which is data-driven from current path, not markup difference).
- `SiteFooter` — identical on all 5 pages (same caveat).
- `ValuesList` ("the values at our core.") — byte-identical content and structure on index.html and team.html.
- `ContactForm` — same shape on index.html and services.html (field names match exactly); contact.html shares the shape but diverges on field `name` casing and the `Message` textarea's `id` (see §4) — still one component, but its field-name prop needs to be parameterized or normalized, not silently unified without deciding which casing wins.
- `ServiceDetailBlock` — 4 near-identical instances on services.html; genuinely one component with per-instance content props (icon/title/tags/CTA-label/headline/body) — see §1 item 18 and §7 CTA-label capitalization inconsistency ("let's make it happen" vs "Let's make it happen" vs "Let's Make it happen" — 3 different capitalizations of the same phrase across the 4 blocks; pick one for the rebuild rather than preserving the inconsistency).
- The 4-service topic set (Consulting/Campaigns/Legal/Finance with `icon-01..04.svg`) is defined independently in 3 places: index.html's `ServiceSummaryGrid`, services.html's hero jump-nav `Label`s, and services.html's `ServiceDetailBlock`s. Same icons, same 4 names, different copy per context — model as one shared "services" content list (icon + short name) that each of the 3 presentations pulls from, rather than typing the 4 names out 3 separate times.

**Near-duplicates that diverge — do not silently unify:**
- `ContactCTA` (`section-home-contact`) appears on index.html, services.html, and contact.html with the **same wrapper class** but real differences: (a) contact.html omits the `.line` divider the other two have before `.padding-vertical`; (b) tagline copy differs — index.html and contact.html both say "We can help. With PLANNING, NEGOTIATIONS, execution – the works." while services.html instead says "FOLLOW US on social for the latest."; (c) social row hrefs differ — index.html has a real Twitter link + placeholder `#` LinkedIn, while services.html and contact.html both use `#` for *both* socials in this specific block (even though the header/footer socials on those same pages are correctly linked). Build `ContactCTA` with `tagline` and `socialLinks` as props rather than hardcoding index.html's version everywhere.
- The homepage's two side-by-side `ProjectPreviewCard` lists (§6, List A vs List B) share ~95% of their markup but diverge in wrapper/item class names and explicit image dimensions — likely intentional "featured vs grid" layout, not an accident, so keep them as two variants of one card component (a `variant="featured" | "grid"` prop) rather than merging into a single shape.
- `Button` text-case inconsistency shows up repeatedly (see `ServiceDetailBlock` CTA labels above, and "See more" vs "let's make it happen" vs "Let's make it happen" vs "Let's talk" vs "Submit" as the different literal button texts used site-wide) — these are legitimately different buttons with different labels, not a bug, just noting so no one tries to "fix" them into one shared string.
- Footer nav order (Home, Services, Team, Projects, Contact us) does not match header nav order (Services, Projects, Team, [Contact via CTA button]) — both are correct/intentional per the source, just inconsistent with each other; preserve both orders exactly as documented in §3 rather than reconciling them.
- `home-services-item` (homepage summary grid) and `services-grid-left` (services.html detail block) both reuse the exact same 4 icon assets (`icon-01.svg`..`icon-04.svg`) at different sizes/contexts — same asset, different component, don't assume they need identical markup just because the icon matches.
