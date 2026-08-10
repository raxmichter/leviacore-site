# Design Tokens — leviacore.com Webflow → Astro

Derived by static analysis of the compiled Webflow export. Every value below is quoted verbatim
from source; nothing is inferred or rounded unless explicitly labelled as a *proposal*.

**Sources analysed (in full):**
- `_webflow-export/css/leviathan-core-2023-r1.webflow.css` — 5,999 lines (site stylesheet, authoritative)
- `_webflow-export/css/webflow.css` — 1,824 lines (framework boilerplate; only breakpoints, container
  and grid defaults are load-bearing)
- Cross-referenced against the 24 exported `.html` files for real class usage counts.

**Custom properties that exist in source:** exactly two.
```css
:root { --white: white; --black: black; }
```
Neither is referenced anywhere else in either stylesheet. Every other value is a repeated literal.
The token set below is therefore **derived**, not extracted.

**Root font size:** never overridden. `1rem = 16px` throughout. px equivalents in this document
assume that.

---

## 1. Color palette

28 distinct color literals. Normalised to lowercase hex. Counts are literal-occurrence counts across
the site stylesheet (both files' shared values are noted).

Webflow writes alpha as 4- and 8-digit hex. Expansions:
`#0000` = `rgba(0,0,0,0)`; `#0009` = `rgba(0,0,0,0.6)`; `#0000000d` = `rgba(0,0,0,0.051)`;
`#ffffff1a` = `rgba(255,255,255,0.102)`; `#19191999` = `rgba(25,25,25,0.6)`.

### 1a. Site / brand layer

| Hex | Count | Role in source | Representative selectors | Proposed token |
|---|---|---|---|---|
| `#191919` | 56 | The site's ink. Body text, **every** hairline border, primary/inverted surfaces, dividers, the mobile hamburger bars | `.body` (color), `a`, `.button` border, `.card`, `.page-wrapper`, `.line`, `.line-vertical`, `.background-color-primary`, `.label`, `.badge`, `.cart-header`, `.checkout-block`, `.mobile-menu-toggle-line`, `.navbar-dropdown-inner`, `.form-input:focus` | `--color-ink` |
| `#fdfbf5` | 5 | Page background — warm off-white | `.body` (background-color), `.cart-container`, `.navbar-dropdown-inner`, `.mobile-menu-wrapper`, `.badge.link:hover` (as text color) | `--color-bg` |
| `#fff` | 21 | Text on dark/primary surfaces; `.buy-badge` background. Also heavily used by the ecommerce boilerplate | `.button.primary`, `.label.primary`, `.badge.primary`, `.card.primary`, `.accordion-icon`, `.cursor`, `.button-old`, `.button-5`, `.buy-badge` | `--color-on-ink` |
| `#0000` | 19 | Transparent. Used to *erase* borders on `.primary` variants and to null out Webflow's default form/checkout backgrounds | `.button`, `.form-input`, `.button.primary` (border-color), `.label.primary`, `.badge.primary`, `.card.primary`, `.checkout-*`, `.navbar-dropdown`, `.empty-state` | `--color-transparent` |
| `#000` | 16 | Pure black. Appears *instead of* `#191919` in a handful of places | `.text-color-default`, `.label-2` (color + border), `.form-input` border-bottom + `border: 0 #000`, `.form-checkbox-icon.w--redirected-focus`, `.block-quote` border-left, `.text-rich-text blockquote` border-left, `.checkout-block-content` `border: 0 solid #000` | see NEAR-DUPE-1 |
| `#121416` | 3 | `.button` default text color and both `.button:hover` / `.button.primary:hover` border colors | `.button`, `.button:hover`, `.button.primary:hover` | see NEAR-DUPE-1 |
| `#1a191e` | 2 | Hover border on two (unused) button variants | `.button-old:hover`, `.button-5:hover` | see NEAR-DUPE-1 |
| `#333` | 1 | Bare `body` element color — immediately overridden by `.body` class on every page | `body` | see NEAR-DUPE-1 (dead) |
| `#19191999` | 1 | Muted text = ink at 60% | `.text-color-muted` | `--color-text-muted` |
| `#ffffff1a` | 3 | White at ~10%. Nav hover wash + one button border | `.navbar-menu-item-link:hover`, `.navbar-menu-item-link.w--current`, `.navbar-menu-cart-link:hover`, `.button-5` border | `--color-overlay-hover` |
| `#0009` | 1 | Black at 60% — cart drawer scrim | `.cart-wrapper` | `--color-scrim` |
| `#0000000d` | 1 | Black at ~5% — focused input fill | `.form-input:focus`, `.form-input.-wfp-focus` | `--color-field-focus-bg` |
| `#d3d3d3` | 6 | Table borders (the comparison-table component) | `.table-wrapper`, `.table-row`, `.cell.border-right`, `.header-cell.border-right` (incl. two `@479` rules) | `--color-border-table` |
| `#f3f3f3` | 1 | Table zebra stripe | `.table-row-group.alt` | `--color-surface-alt` |
| `#e8e8e8` | 2 | Two inert side borders on the cart quantity input (`border-color: #e8e8e8 #e8e8e8 #191919`) | `.cart-item-quantity` | `--color-border-subtle` |
| `#5bb5a2` | 1 | **The only chromatic (non-neutral) color in the entire site layer.** Teal. Class is unused in all 24 HTML files | `.button-text-4` | *dead — do not port* |
| `#e2ebf0` | 1 | Pale blue button fill. Class unused in HTML | `.button-2` | *dead — do not port* |
| `#d1dfe4` | 1 | Pale blue button border. Class unused in HTML | `.button-2` | *dead — do not port* |

### 1b. Webflow ecommerce / form boilerplate layer

These only matter if `checkout.html`, `detail_product.html`, `paypal-checkout.html`,
`order-confirmation.html` are migrated. They are Webflow defaults, not design decisions.

| Hex | Count | Role | Proposed token |
|---|---|---|---|
| `#3898ec` | 28 | Webflow's stock blue: input `:focus` border, focus rings (`box-shadow`), checked checkbox/radio, `.w-commerce-commercecheckoutplaceorderbutton`, `.w-button` default | `--wf-blue` (quarantine) |
| `#ddd` | 20 | Default input border; `.w-commerce-commerceaddtocartoutofstock` bg | `--wf-input-border` |
| `#fafafa` | 19 | Default input fill | `--wf-input-bg` |
| `#999` | 19 | `::placeholder` color on every commerce input | `--wf-placeholder` |
| `#e6e6e6` | 17 | Checkout block borders; disabled pill/button fills | `--wf-block-border` |
| `#f5f5f5` | 3 | Checkout page container background | `--wf-page-bg` |
| `#ffdede` | 3 | Error state background (`commercecheckouterrorstate`, `commerceaddtocarterror`, `paypalcheckouterrorstate`) | `--wf-error-bg` |
| `#666` | 3 | Disabled button/pill text | `--wf-disabled-fg` |
| `#ccc` | 2 | Custom checkbox/radio border | `--wf-control-border` |
| `#0000001a` | 2 | `.buy-badge` shadow (black @10%), used twice in one `box-shadow` | `--shadow-color` |

`webflow.css` additionally hardcodes `#fff` (body bg), `#333` (body color), `#3898EC` (`.w-button`),
`#cccccc` (`.w-file-upload-label`), `#dddddd` (`.w-dyn-empty`), `#aaadb0` (`.w-webflow-badge`).

### 1c. Near-duplicates — FLAGGED, NOT COLLAPSED

**NEAR-DUPE-1 — the dark-ink cluster (five values that all read as "black"):**
```
#191919   (56×)  rgb(25,25,25)    ← dominant, unambiguously the brand ink
#000      (16×)  rgb(0,0,0)
#333       (1×)  rgb(51,51,51)    ← dead: overridden by .body on every page
#121416    (3×)  rgb(18,20,22)    ← .button text + hover borders only
#1a191e    (2×)  rgb(26,25,30)    ← two hover states, both on unused classes
```
`#121416` and `#1a191e` are visually indistinguishable from `#191919` at any realistic size
(ΔE well under 1). They are almost certainly Webflow color-picker drift. `#000` is a *deliberate-
looking* but inconsistent choice: it appears on `.text-color-default`, `.label-2`, and the
`.form-input` bottom border while every sibling border in the file uses `#191919`.
**Recommendation for Phase B: collapse `#121416`, `#1a191e`, `#333` into `--color-ink`; raise `#000`
with the design owner before collapsing — it may be intentional on form fields.** Do not collapse
silently; the `.form-input` border-bottom is directly adjacent to `#191919` borders in the contact
form and the difference is potentially visible.

**NEAR-DUPE-2 — light neutrals:**
```
#fdfbf5   (5×)  warm off-white — the real page background
#fff     (21×)  pure white — inverse text + .buy-badge
#fafafa  (19×)  Webflow input fill
#f5f5f5   (3×)  Webflow checkout page bg
#f3f3f3   (1×)  table zebra
```
`#fafafa` / `#f5f5f5` / `#f3f3f3` are three near-identical greys serving three different components.
`#f3f3f3` (table zebra) is site-authored; the other two are Webflow defaults.

**NEAR-DUPE-3 — grey borders:**
```
#e6e6e6  (17×)  Webflow checkout blocks
#e8e8e8   (2×)  cart quantity input sides
#ddd     (20×)  Webflow inputs
#d3d3d3   (6×)  site comparison table
#ccc      (2×)  Webflow custom controls
```
`#e6e6e6` vs `#e8e8e8` differ by 2/255 and sit in the same cart/checkout view.

---

## 2. Typography

### 2a. Families

Four families are referenced. Only three are actually provisioned.

**Font delivery (from `<head>` of every page):**
```html
<script>WebFont.load({ google: { families: ["Roboto Mono:400","Syne:400,500"] }});</script>
```
```css
/* leviathan-core-2023-r1.webflow.css, lines 1–7 AND lines 5993–5999 — declared twice, identically */
@font-face { font-family: Satoshi; src: url('../fonts/Satoshi-Regular.woff') format("woff");
             font-weight: 400; font-style: normal; font-display: swap; }
```
`_webflow-export/fonts/` contains exactly one file: `Satoshi-Regular.woff` (33,024 bytes).

---

#### Syne — 16 `font-family` declarations
Declared as `font-family: Syne, sans-serif`. **Only weight 400 is ever declared in CSS.**
Google Fonts is asked for `Syne:400,500`; the 500 is loaded but never used — a wasted request.

Selectors: `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `.heading-xlarge`, `.heading-large`,
`.heading-medium`, `.heading-small`, `.heading-h1`, `.heading-h2`, `.heading-h3`, `.heading-h4`,
`.heading-h5`, `.heading-h6`.

Role: every display/heading surface. Nothing else.

#### Roboto Mono — 23 `font-family` declarations
Declared as `font-family: Roboto Mono, sans-serif`. **Only weight 400.** Google request matches.

Selectors: `.text-meta`, `.text-meta-small`, `.text-meta-link`, `.button`, `.button-text`, `.label`,
`.form-label`, `.form-input`, `.cursor`, `.footer-nav-item-link`, `.navbar-menu-item-link`,
`.navbar-menu-cart-link`, `.navbar-menu-cart-quantity`, `.navbar-dropdown-nav-item-link`,
`.mobile-menu-nav-link`, `.cart-item-quantity`, `.cart-item-remove-text`, `.cart-item-price`,
`.cart-item-price-compare`, `.product-preview-price`, `.product-preview-price-compare`,
`.product-price`, `.product-price-compare`.

Role: the entire "UI chrome" voice — nav, buttons, labels, eyebrows, prices. Almost always paired
with `letter-spacing: 1px` + `text-transform: uppercase`.

#### Satoshi — 4 explicit `font-family` declarations, but effectively the whole document
`.body` sets `font-family: Satoshi, sans-serif`, and **every** exported page carries
`<body class="body">`. So Satoshi is the inherited default for all body copy, list items,
paragraphs, `<strong>`, `<label>`, and anything that does not explicitly claim Syne or Roboto Mono.

Explicit declarations:

| Selector | Line | Weight declared |
|---|---|---|
| `.body` | 1709 | 400 |
| `.text-rich-text blockquote` | 1198 | **500** |
| `.block-quote` | 2185 | **500** |
| `.button-old` | 1812 | **500** |

#### Zodiak — 1 declaration, NOT PROVISIONED
```css
.italic { font-family: Zodiak; font-weight: 400; }   /* line 2646 */
```
There is no `@font-face` for Zodiak, no Google Fonts request, no file in `fonts/`, and no fallback
in the stack (`font-family: Zodiak` — bare, no `sans-serif`). `.italic` appears 0 times in the 24
HTML files. **Dead. Do not port.** If it were used it would silently render in the browser's
default serif.

---

### 2b. ⚠️ CRITICAL: Satoshi weight audit — VERDICT

> **YES. Satoshi weights other than 400 ARE used, in eleven places, and several of them are live on
> shipped pages. Only `Satoshi-Regular.woff` (weight 400) exists in the export. This is a confirmed
> build blocker.**

---

> ### ✅ CORRECTION — main thread, 2026-08-10. **NOT a build blocker. Do not act on the line above.**
>
> The weight data below is correct and valuable — keep using it. The *conclusion* is wrong, and a later
> phase acting on it would introduce a visual regression rather than fix one.
>
> **What was verified:** `css/leviathan-core-2023-r1.webflow.css` contains exactly **two `@font-face`
> blocks for Satoshi** (lines 1–7 and 5993–5999). They are duplicates of each other, both point at the
> same `Satoshi-Regular.woff`, and **both declare `font-weight: 400`.** There is no other Satoshi source
> anywhere — not in the CSS, not in the HTML, not loaded from a CDN.
>
> **Therefore the live site has exactly the same gap.** Every `font-weight: 300/500/600/700` against
> Satoshi on www.leviacore.com today is resolved by the browser from the single 400 file — synthesized
> emboldening for 500/600/700, and plain 400 for 300. Those 57 `<strong>` tags are already rendering as
> faux-bold in production. This is a **pre-existing condition of the live design, not a missing asset.**
>
> **Consequence for the rebuild — this is the important part:** to be pixel-identical we must
> **replicate** the single-weight setup, which `src/styles/fonts.css` already does (one `@font-face`,
> weight 400, faux weights left to the browser). **Adding real Satoshi 300/500/600/700 would make the
> rebuild differ from the live reference and fail the Phase G visual regression gate.** It would be an
> unrequested design change, and this migration is explicitly not a redesign.
>
> **Net effect: nothing is blocked, and no font needs to be sourced.** Whether to license the real
> weights is a genuine question, but it is a *redesign* question — logged in `OPEN.md` as a
> non-blocking decision for George, defaulting to "match the live site."
>
> One free cleanup this does enable: the duplicate `@font-face` (see LOW-3) collapses to one.

Weights **300, 500, 600, and 700** are all requested against a family that ships only 400.

**Explicit Satoshi + non-400 weight:**

| Selector | Line | Weight | Live in HTML? |
|---|---|---|---|
| `.text-rich-text blockquote` | 1198–1201 | **500** | Yes — `text-rich-text` appears 9× (CMS rich-text bodies) |
| `.block-quote` | 2185–2188 | **500** | No — 0 occurrences |
| `.button-old` | 1812–1814 | **500** | No — 0 occurrences |

**Inherited Satoshi (from `.body`) + non-400 weight** — these do not declare a family, so they
inherit Satoshi and then ask for a weight that does not exist:

| Selector | Line | Weight | Live in HTML? |
|---|---|---|---|
| `strong` | 988–990 | `bold` (**700**) | **Yes — 57 `<strong>` tags across the export** |
| `.text-rich-text strong` | 1204–1206 | **600** | **Yes** — rich-text bodies |
| `label` | 983–986 | **500** | **Yes — 27 `<label>` tags** |
| `.form-radio-label` | 1117–1120 | **300** | Contact/checkout forms |
| `.button-5` | 2441–2451 | **500** | No — 0 occurrences |
| `.button-text-4` | 2834–2840 | **500** | No — 0 occurrences |
| `.cell-text.strong` | 3966–3968 | **700** | No — `.cell-text` is used 36× but never with `.strong` |
| `.mobile-menu-nav-text` (`@max-width: 767px`) | 5305–5308 | **500** | **Yes — mobile nav** |
| `.w-commerce-commerceboldtextblock` | 271–273 | **700** | Commerce pages only |
| `.w-commerce-commercecheckoutsummarytotal` | 592–594 | **700** | Commerce pages only |

**Consequence in the current Webflow build:** the browser synthesises the missing faces. Weights
500/600/700 render as *faux bold* (a geometric smear of the 400 outlines) and weight 300 renders
identically to 400 (browsers do not synthesise lighter). So the live site is already visually wrong
for `<strong>` and `<label>`; a faithful Astro rebuild will reproduce that wrongness unless the real
faces are obtained.

**Required action before Phase B ships:**
1. Obtain `Satoshi-Medium` (500), `Satoshi-Bold` (700) at minimum; `Satoshi-Light` (300) and
   `Satoshi-Semibold` (600) if `.form-radio-label` and rich-text `<strong>` are kept. Prefer `.woff2`
   — the export only ships `.woff`, which is ~30% larger and has been universally superseded.
2. **Or** decide the design intent is 400-only and rewrite `strong`, `label`,
   `.text-rich-text strong`, `.text-rich-text blockquote`, and `.mobile-menu-nav-text` to use 400
   plus a non-weight emphasis mechanism. This is a design decision, not a build decision.
3. Whichever path: add explicit `@font-face` blocks per weight so the browser stops synthesising.

**Note on Syne 500:** the inverse problem. `Syne:400,500` is downloaded on every page; weight 500 is
never referenced by any selector. Drop `:500` from the request — free bytes.

---

### 2c. Full type scale (base / desktop, ≥992px)

28 distinct `font-size` values. Sorted large → small. `LH` = line-height, `LS` = letter-spacing,
`W` = font-weight. "—" means not declared at that selector (inherits).

| Size | px | Family | LH | LS | W | Selector(s) | HTML uses |
|---|---|---|---|---|---|---|---|
| `10rem` | 160 | Syne | 90% | — | 400 | `.heading-xlarge` @≥1440 | 0 |
| `8rem` | 128 | Syne | 90% | — | 400 | `.heading-xlarge`; `.heading-large` @≥1440 | 0 / 6 |
| `6rem` | 96 | Syne | 100% | — | 400 | `.heading-large`; `.heading-medium` @≥1440 | 6 / 19 |
| `5rem` | 80 | Syne | 100% | — | 400 | `.heading-medium`; `.heading-small` @≥1440 | 19 / 4 |
| `4.5rem` | 72 | Syne | 110% | — | 400 | `.heading-small` | 4 |
| `4rem` | 64 | Syne | 120% | — | 400 | `h1`, `.heading-h1`, `.text-rich-text h1` | 10 |
| `3rem` | 48 | Syne | 120% (`h2`) / **110%** (`.heading-h2`) | — | 400 | `h2`, `.heading-h2`, `.text-rich-text h2` | 1 |
| `2rem` | 32 | Syne | 120% | — | 400 | `h3`, `.heading-h3`, `.text-rich-text h3` | 2 |
| `2rem` | 32 | **Satoshi** | 140% | — | **500** | `.block-quote`, `.text-rich-text blockquote` | 0 / 9 |
| `1.75rem` | 28 | inherit (Satoshi) | 150% | — | — | `.text-size-xlarge`, `.accordion-title` | 13 |
| `1.5rem` | 24 | Syne | 130% | — | 400 | `h4`, `.heading-h4`, `.text-rich-text h4` | 49 |
| `1.4rem` | 22.4 | inherit | 160% | — | — | `.text-size-large` (also `margin-bottom: 10px`, `text-align: center`) | 6 |
| `1.375rem` | 22 | Syne | 130% | — | 400 | `h5` | — |
| `1.25rem` | 20 | Syne | 130% | — | 400 | `.heading-h5` | 2 |
| `1.25rem` | 20 | inherit | 160% | — | — | `.text-size-medium` (**declared twice**, lines 1126 & 1746) | 4 |
| `1.25rem` | 20 | Roboto Mono | 150% | — | 400 | `.form-input.is-newsletter` | — |
| `1.125rem` | 18 | Syne | 130% | — | 400 | `h6`, `.heading-h6` | 1 |
| `1.125rem` | 18 | inherit | 120% | — | 500 | `.button-text-4` | 0 |
| `18px` | 18 | **Satoshi** | **170%** | — | 400 | `.body` — the document default | all pages |
| `1.75rem`… | | | | | | | |
| `1rem` | 16 | Roboto Mono | 120% | **1px** | 400 | `.button-text` (+ `text-transform: uppercase`) | — |
| `1rem` | 16 | Satoshi | — | **1px** | **500** | `.button-old` (uppercase) | 0 |
| `1rem` | 16 | inherit | 160% | — | — | `.text-size-regular`, `.text-size-small` | 0 / 3 |
| `1rem` | 16 | inherit | 140% | — | 400 | `.form-checkbox-label` | — |
| `1rem` | 16 | inherit | — | — | 300 | `.form-radio-label` | — |
| `1rem` | 16 | inherit | — | **.5px** | 500 | `.button-5` (uppercase) | 0 |
| `1rem` | 16 | inherit | — | — | — | `.cart-item-option`, `.cell-text` | 36 |
| `1rem` | 16 | `body` element | 1.5 | — | — | bare `body` (superseded by `.body`) | — |
| `16px` | 16 | Roboto Mono | 150% | — | 400 | `.form-input`, `.cart-item-quantity` | — |
| `15px` | 15 | Roboto Mono | varies | **1px** | 400 | **`.text-meta` (140%)**, `.text-meta-link` (130%), `.button` (110%), `.cursor` (120%), `.footer-nav-item-link`, `.navbar-menu-item-link` (120%), `.navbar-menu-cart-link` (120%), `.navbar-menu-cart-quantity` (120%), `.navbar-dropdown-nav-item-link`, `.mobile-menu-nav-link`, `.product-price` (130%), `.product-price-compare` (130%), `.product-preview-price` (130%), `.product-preview-price-compare` (130%) | text-meta 125× |
| `14px` | 14 | Roboto Mono | 150% | — | 400 | `.cart-item-remove-text` | — |
| `13px` | 13 | Roboto Mono | varies | **1px** | 400 | `.form-label` (160%), `.label` (110%), `.text-meta-small` (130%) | text-meta-small 76× |
| `13px` | 13 | inherit | 120% | — | — | `.label-2` (lowercase, not uppercase) | 0 |
| `.875rem` | 14 | inherit | — | — | — | `.text-rich-text figcaption`, `.cart-close-button`, `.cart-item-price`, `.cart-item-price-compare`, `.button-2` | — |
| `.75rem` | 12 | inherit | 160% | — | — | `.text-size-tiny` | 0 |

**Line-height inventory:** `90%` (1), `100%` (4), `110%` (5), `120%` (12), `130%` (12), `140%` (5),
`150%` (3), `160%` (6), `170%` (1), `1.5` (1, bare `body`), `20px` (19, all Webflow commerce inputs),
`normal` (1). Note the file uses **percentages**, not unitless numbers, everywhere except the two
Webflow-default rules.

**Letter-spacing inventory:** `1px` (14 occurrences — always with `text-transform: uppercase` on a
Roboto Mono selector), `.5px` (1 — `.button-5`, unused). That is the entire set.

### 2d. Responsive type overrides

| Selector | ≥1920 | ≥1440 | base (992–1439) | ≤991 | ≤767 | ≤479 |
|---|---|---|---|---|---|---|
| `h1` | — | — | `4rem` | `3.5rem` | `3rem` | `3rem` |
| `h2` | — | — | `3rem` | `3rem` | `2.5rem` | — |
| `h3` | — | — | `2rem` | — | `1.75rem` | — |
| `h4` / `h5` / `h6` | — | — | `1.5` / `1.375` / `1.125rem` | — | — | — |
| `.heading-xlarge` | — | `10rem` | `8rem` | `8rem` | `5.5rem` | `5rem` |
| `.heading-large` | — | `8rem` | `6rem` | `5rem` | `4rem` | `3.5rem` |
| `.heading-medium` | — | `6rem` | `5rem` | `4rem` | `3rem` | `3rem` |
| `.heading-small` | — | `5rem` | `4.5rem` | `4rem` | `3.125rem` | **`3.25rem`** ⚠ |
| `.heading-h1` | — | — | `4rem` | `3rem` | `3rem` | — |
| `.heading-h2` | — | — | `3rem` | `3rem` | `2.5rem` | `2.25rem` |
| `.heading-h3` | — | — | `2rem` | — | `1.75rem` | — |
| `.heading-h4` | — | — | `1.5rem` | — | `1.5rem` (redundant) | — |
| `.text-size-xlarge` | — | — | `1.75rem` | `1.5rem` | `1.4rem` | — |
| `.text-size-large` | — | — | `1.4rem` | — | `1.25rem` | — |
| `.text-size-medium` | — | — | `1.25rem` | — | — | `1.25rem` (redundant) |
| `.body` | — | — | `18px` | `16px` | — | — |
| `.text-rich-text blockquote` | — | — | `2rem` | `2rem` | `1.5rem` | **`1.75rem`** ⚠ |
| `.block-quote` | — | — | `2rem` | — | `1.5rem` | — |
| `.navbar-menu-item-text` | — | — | — | `.875rem` | — | — |
| `.mobile-menu-nav-text` | — | — | — | — | `1rem` / w500 | — |

⚠ Two selectors get **larger** on the narrowest breakpoint than on the one above it
(`.heading-small` 3.125 → 3.25rem, `.text-rich-text blockquote` 1.5 → 1.75rem). See Anomalies.

---

## 3. Spacing scale

### 3a. The utility system

Webflow's "client-first" utilities. `.margin-*` / `.padding-*` set the **shorthand** (all four sides);
`.margin-top` / `.margin-bottom` / `.margin-left` / `.margin-right` / `.margin-vertical` /
`.margin-horizontal` (and padding equivalents) zero out the sides you don't want. They are meant to
be combined: `class="margin-bottom margin-medium"`.

| Utility | base | ≤991 | ≤767 | ≤479 | HTML uses |
|---|---|---|---|---|---|
| `-tiny` | `.125rem` (2px) | — | — | — | 9 |
| `-xxsmall` | `.25rem` (4px) | — | — | — | 0 |
| `-xsmall` | `.5rem` (8px) | — | — | — | 53 |
| `-small` | `1rem` (16px) | — | — | — | 40 |
| `-medium` | `2rem` (32px) | `1.5rem` | `1.25rem` | — | 79 |
| `-large` | `3rem` (48px) | `2.5rem` | `1.5rem` | — | 14 |
| `-xlarge` | `4rem` (64px) | `3rem` | `2rem` | — | 8 |
| `-xxlarge` | `5rem` (80px) | `4rem` | `3rem` | — | 0 |
| `-huge` | `6rem` (96px) | `5rem` | `3.5rem` | — | 6 |
| `-xhuge` | `8rem` (128px) | `6rem` | `4rem` | — | 5 |
| `-xxhuge` | `12rem` (192px) | `8rem` | `4.5rem` | — | 12 |

Directional utility usage in HTML: `margin-bottom` 223, `padding-vertical` 60, `padding-xlarge` 52,
`padding-top` 3, `padding-bottom` 2, `margin-vertical` 3, `padding-huge` 3, `padding-large` 3,
`padding-xhuge` 4, `padding-xxhuge` 1.

### 3b. Is there a coherent scale?

**At base: yes.** `.125 / .25 / .5 / 1 / 2 / 3 / 4 / 5 / 6 / 8 / 12 rem`
= `2 / 4 / 8 / 16 / 32 / 48 / 64 / 80 / 96 / 128 / 192 px`. Below 16px it doubles (2→4→8→16); above
16px it is a clean 16px-multiple scale. Every step is a multiple of 4. This is a real, usable system.

**At ≤991 and ≤767: no.** The scale compresses non-uniformly and the top of the range collapses:

```
≤767:  medium 20px | large 24px | xlarge 32px | xxlarge 48px | huge 56px | xhuge 64px | xxhuge 72px
```
`xlarge` through `xxhuge` — five nominally distinct steps spanning 64→192px at desktop — squeeze
into a 32→72px band on mobile, with only 8px between the top three. `huge`, `xhuge` and `xxhuge`
become nearly interchangeable. Any rebuild that treats these as five semantic levels will look
identical on mobile.

### 3c. Raw value frequency (all `margin*` / `padding*` declarations, site stylesheet)

```
0        258     2rem      46     8px       32     1rem      32     1.5rem    32
3rem      28     16px      26     4rem      24     12px      24     20px      23
.5rem     23     10px      13     6rem       8     2.5rem     7     1.25rem    7
15px       6     .75rem     6     -3rem      6     5rem       5     -2rem      5
8rem       4     4px        4     3.5rem     4     .25rem     4     9px        3
6px        2     5px        2     4.5rem     2     1em        2     12rem      2
.6rem      2     .125rem    2     -8px       2     -20px      2     -1rem      2
-1px       2     64px       1     2px        1     21px       1     1.875rem   1
1.2rem     1     .875rem    1     .33em      1     -2px       1
```
The px values (`8/10/12/15/16/20/64px`, `9px`, `21px`, `6px`, `4px`) are overwhelmingly from the
`w-commerce-*` boilerplate. Site-layer px offenders: `.line { margin-bottom: 20px }`,
`.button { margin: 5px 0 0 }`, `.body { padding: 12px }` @≤479, `.header-cell.border-right
{ padding-right: 21px }`, `.cell.border-right { padding-left/right: 10px }`, `.container
{ padding-left/right: 20px }`, `.html-embed { margin-top: 20px }`.

Site-layer off-scale rem values: `.6rem` (`.label` and `.button` horizontal padding),
`1.2rem` (`.cart-inner` @≤479), `1.875rem` (`.button-2`, dead), `.875rem` (form-checkbox focus box).

### 3d. Negative margins — structural, not decorative

`-3rem` (6×) and `-2rem` (5×) are load-bearing: the card grids
(`.blog-posts-grid`, `.blog-posts-featured-grid`, `.shop-products-grid`, `.home-news-grid`,
`.post-related-grid`, `.home-project-preview-grid`) apply `margin-left: -3rem` to cancel the
`padding-left: 3rem` + `border-left: 1px solid #191919` that each child carries. This is how the
vertical hairline dividers between cards are drawn. `:first-child` / `:nth-child(odd)` rules then
remove the border on the leading column. **Do not "clean up" these negatives — they are the divider
mechanism.** They step to `-2rem` @≤991 and `0` @≤479.

Also: `.navbar-dropdown { margin-top: -2px }`, `.mobile-menu { margin-top: -1px }`,
`.mobile-menu-toggle-line._02 { margin-top: -1px }` — 1–2px seam-closers against adjacent borders.

### 3e. Grid gaps

`grid-column-gap` / `grid-row-gap` frequency (Webflow emits the legacy longhands, not `gap`):
```
2rem 117 | 3rem 85 | 1rem 62 | 4rem 41 | 1.5rem 30 | .5rem 26 | .75rem 12
0px 6 | 2.5rem 5 | 0rem 5 | 1.25rem 4 | 6rem 3 | 6px 2 | 4px 2 | 2px 2 | 16px 1
```
Plus one `column-gap: 3rem` (`.services-branding-text`, a 2-column text flow).
`0px` and `0rem` are both used to mean zero — cosmetic inconsistency.

---

## 4. Breakpoints

### 4a. Exact media queries in source

**`leviathan-core-2023-r1.webflow.css`** (11 `@media` blocks — some breakpoints appear more than once
because the `#w-node-*` grid-placement rules are emitted in a separate trailing section):

| Query | Blocks | Purpose |
|---|---|---|
| `@media screen and (min-width: 1920px)` | 2 | Hero grid ratios, `.services-branding-text` column-count, `.div-block` max-width; one `#w-node` block |
| `@media screen and (min-width: 1440px)` | 1 | Display-heading upsizing, `.home-hero-grid` gap, hero grid ratios |
| `@media screen and (max-width: 991px)` | 2 | The big tablet reflow — grids to 1 column, spacing scale step-down, `.mobile-menu-toggle` appears, nav links hide |
| `@media screen and (max-width: 767px)` | 3 | Mobile landscape — further type + spacing reduction |
| `@media screen and (max-width: 479px)` | 3 | Mobile portrait — single column everywhere, dividers removed |

**`webflow.css`** (8 blocks): `max-width: 991px` ×2, `max-width: 767px` ×2, `max-width: 479px` ×3,
`min-width: 768px` ×1 (lightbox sizing only — the sole `min-width` in the framework file).

### 4b. Effective bands

```
        0 ──────── 479 │ 480 ──── 767 │ 768 ──── 991 │ 992 ──── 1439 │ 1440 ── 1919 │ 1920+
        mobile portrait│ mobile land.  │ tablet       │ DESKTOP BASE  │ large        │ xl
```
The base (unqualified) rules are authored for the 992–1439 band. Everything else is an override.

### 4c. Against the target verification breakpoints — 375 / 768 / 1280 / 1920

| Target | Falls in | Which `@media` blocks apply | Note |
|---|---|---|---|
| **375** | mobile portrait | `≤991`, `≤767`, `≤479` all cascade | Deepest override stack. Also the width at which `.navbar-dropdown { width: 390px }` overflows — see Anomalies. |
| **768** | tablet | `≤991` only | ⚠ **768 is NOT in the `≤767` block.** One pixel narrower and the layout changes materially. Verifying at exactly 768 tests the tablet band, not mobile landscape. Add 767 (or 767.98) as a companion check. |
| **1280** | desktop base | **none** | Pure base stylesheet. Good — this is the authored design. |
| **1920** | xl | `≥1440` **and** `≥1920` (both min-width blocks apply, 1920 wins on source order) | Verify that `.heading-xlarge: 10rem` / `.heading-large: 8rem` from the 1440 block are still intended at 1920 — the 1920 block does not restate them. |

No `@media` uses `1280px`, `1024px`, or `1920px` as a *max*. There is no container query, no
`prefers-reduced-motion`, no `prefers-color-scheme`, and no `print` stylesheet anywhere.

---

## 5. Other primitives

### 5a. Border radii — 17 distinct values

| Value | Count | Where |
|---|---|---|
| `3px` | 21 | Webflow commerce inputs/buttons, `.buy-badge` |
| `1rem` | 11 | **The site's real card/image radius** — `.image-wrapper`, `.post-preview-image-wrapper`, `.product-preview-image-wrapper`, `.project-preview-image-wrapper`, `.home-hero-image-wrapper`, `.studio-hero-image-wrapper`, `.studio-team-image-wrapper`, `.services-image-wrapper`, `.work-projects-item-image-wrapper`, `.post-image-wrapper`, `.product-lightbox-item` |
| `0` | 6 | Resets (`.form-input`, `.form-checkbox-icon`, `.cart-item-quantity`, Webflow buttons) |
| `500px` | 5 | Pill — `.button-old`, `.button-5`, `.label-2`, `.navbar-menu-item-link`, `.navbar-menu-cart-link` |
| `50%` | 3 | Circle — `.badge`, `.accordion-icon`, `.w-form-formradioinput` |
| `3rem` | 3 | `.main-wrapper` @≤767, `.product-lightbox-image` @≤991 |
| `2px` | 3 | Webflow apple-pay / quick-checkout buttons, custom checkbox |
| `1.5rem` | 3 | `.about-gallery` @≤479, `.navbar-dropdown-inner` @≤479, `.product-lightbox-image` @≤479 |
| `6px` | 2 | `.label`, `.button` — the two live UI chips |
| `4rem` | 2 | `.main-wrapper` @≤991, `.about-gallery` @≤991 |
| `2rem` | 2 | `.main-wrapper` @≤479, `.navbar-dropdown-inner` @≤991 |
| `8px` | 1 | `.cursor` |
| `6rem` | 1 | `.about-gallery` base |
| `2.5rem` | 1 | `.product-lightbox-image` @≤767 |
| `100px` | 1 | `.button-2` (dead) |
| `.5rem` | 1 | `.cart-item-image` |
| `.125rem` | 1 | `.form-checkbox-icon.w--redirected-focus` |

`.main-wrapper` radius is fully responsive: no radius at base → `4rem` @≤991 → `3rem` @≤767 →
`2rem` @≤479. Note the base has **no** `border-radius` on `.main-wrapper` at all — the rounding only
appears below 992px.

### 5b. Shadows — 4 total

```css
.w-checkbox-input--inputType-custom.w--redirected-focus { box-shadow: 0 0 3px 1px #3898ec; }
.w-form-formradioinput--inputType-custom.w--redirected-focus { box-shadow: 0 0 3px 1px #3898ec; }
.form-radio-icon.w--redirected-focus { box-shadow: 0 0 .25rem 0 #3898ec; }
.form-checkbox-icon.w--redirected-focus { box-shadow: none; }
.buy-badge { box-shadow: 0 1px 3px #0000001a, 0 0 0 1px #0000001a; }
```
Three are Webflow focus rings in the stock blue. `.buy-badge` is the Webflow template's own
"buy this template" chip and should be deleted, not ported. **The site design uses no shadows.**
Depth is expressed entirely through 1px `#191919` hairlines. Preserve that.

`.form-checkbox-icon.w--redirected-focus { box-shadow: none }` removes the focus ring without
replacing it — an accessibility regression to fix, not reproduce.

### 5c. Transitions, durations, easings

```css
.form-input   { transition: background-color .2s, border .2s; }
.badge        { transition: background-color .2s, border .2s; }
.button-old   { transition: all .2s; }
.button       { transition: border .3s; }
.button-5     { transition: border-color .3s; }
.navbar-menu-item-link { transition: background-color .3s; }
.navbar-menu-cart-link { transition: background-color .3s; }
.cursor-wrapper        { transition: opacity .3s; }
```
**Two durations only: `.2s` and `.3s`. Zero custom easings** — every transition uses the CSS default
`ease`. No `cubic-bezier`, no `transition-delay`, no `@keyframes` in the site stylesheet
(`webflow.css` has one: `@keyframes spin` for the lightbox loader).

`transition: all .2s` on `.button-old` is a performance smell but the class is unused.

Motion beyond this is driven by Webflow Interactions in `js/webflow.js` (inline transforms), not CSS
— out of scope for this document but relevant to Phase B parity.

### 5d. z-index layers

| Value | Selectors |
|---|---|
| `0` | `.footer` |
| `1` | `.main-wrapper`, `.z1`, `.section-home-hero`, `.section-services-hero`, `.section-studio-hero`, `.section-work-hero`, `.section-project-hero`, `.section-home-contact`, `.post-preview-image-link` |
| `2` | `.z2`, `.navbar-inner` |
| `6` | `.button-inner` |
| `10` | `.button-2` (dead), `.navbar` @≤767 |
| `15` | `.projects-item-link` |
| `100` | `.header`, `.mobile-menu` (and `.mobile-menu` restated as `100` @≤767) |
| `1000` | `.navbar` |
| `9999` | `.navbar-wrapper`, `.navbar-menu`, `.navbar-dropdown`, `.cursor-wrapper`, `.buy-badge` |

⚠ `.navbar` drops from `1000` to `10` at `≤767` while `.mobile-menu` stays at `100` — deliberate
(the menu must paint over the bar) but fragile. `.header` (100) is lower than `.navbar` (1000)
despite being the outer element. Five separate things share `9999`, so their order is decided purely
by DOM position.

### 5e. Container max-widths

| Class | max-width | px | HTML uses |
|---|---|---|---|
| `.container-xsmall` | `37.5rem` | 600 | 0 |
| `.container-small` | `50rem` | 800 | 6 |
| `.container-medium` | `62.5rem` | 1000 | 0 |
| `.container-default` | `75rem` | 1200 | 7 |
| `.container-large` | `87.5rem` | 1400 | 0 |
| `.container-xlarge` | `100rem` | 1600 | 0 |
| `.container-xxlarge` | `112.5rem` | 1800 | **80** ← the workhorse |
| `.container` | `1200px` + `20px` h-padding | 1200 | table pages |
| `.navbar-dropdown-inner` | `1800px` | 1800 | — |
| `.w-container` (webflow.css) | `940px`, `728px` @≤991 | — | legacy |

All `.container-*` use `width: 100%; margin-left: auto; margin-right: auto`. The 1800px
(`112.5rem`) container is the real page shell — matched by `.navbar-dropdown-inner`'s hardcoded
`1800px` (same value, different unit).

**Content max-width utilities:**
`.max-width-xxsmall 12rem` · `.max-width-xsmall 16rem` · `.max-width-small 22rem` ·
`.max-width-large 40rem` · `.max-width-xxlarge 80rem` · `.max-width-full { max-width: none }`
plus per-breakpoint `.max-width-full-tablet` / `-mobile-landscape` / `-mobile-portrait`.

⚠ `.max-width-xlarge, .max-width-medium { width: 100%; }` — **declared with no `max-width` at all.**
Two rungs are missing from the ladder. See Anomalies.

**Page gutters:** `.page-padding` `3rem` → `2.5rem` @≤991 → `2rem` @≤767 → `1.5rem` @≤479.
`.body` adds an outer frame: `padding: 1rem` → `padding-top/left/right: 12px` @≤479 (bottom stays
`1rem` — asymmetric).

### 5f. Grid definitions

`webflow.css` default:
```css
.w-layout-grid { display: grid; grid-auto-columns: 1fr;
                 grid-template-columns: 1fr 1fr; grid-template-rows: auto auto;
                 grid-row-gap: 16px; grid-column-gap: 16px; }
```
Every site grid overrides all five properties, so the 16px default never renders.

**The dominant structural pattern — the 1px divider track.** Roughly 25 grids include a literal
`1px` column or row track that is filled by a `.line-vertical` / `.line` element:
```css
.footer-grid              { grid-template-columns: .45fr 1px 1fr; }
.home-clients-grid        { grid-template-columns: auto 1px 1fr; }
.home-services-grid       { grid-template-columns: .46fr 1px 1fr; }
.home-projects-grid       { grid-template-columns: .47fr 1px 1fr; }
.home-values-grid         { grid-template-columns: 1fr 1px 2fr; }
.cta-contact-grid         { grid-template-columns: 1fr 1px .45fr; }
.services-grid            { grid-template-columns: .45fr 1px 1fr; }
.studio-values-grid       { grid-template-columns: 1fr 1px .45fr; }
.studio-team-grid         { grid-template-columns: .45fr 1px 1fr; }
.contact-offices-grid     { grid-template-columns: .46fr 1px 1fr; }
.project-content-grid     { grid-template-columns: .45fr 1px 1fr; }
.product-hero-grid        { grid-template-columns: 1fr 1px 1fr; }
.post-hero-grid,
.post-content-grid        { grid-template-columns: .33fr 1fr 1px .33fr; }
.navbar-right-inner       { grid-template-columns: auto 1px auto; }
.home-how-grid            { grid-template-columns: 2.25fr 1px; }
```
At `≤991` most flip the 1px from a column to a **row** (`grid-template-rows: auto 1px auto;
grid-template-columns: 1fr`) so the divider becomes horizontal. This is the single most important
layout idiom in the file and must survive the rebuild intact.

**Fractional ratios in use:** `.25 · .33 · .4 · .45 · .46 · .47 · .5 · .75 · 1 · 1.25 · 1.5 · 1.75 ·
2 · 2.25 fr`. The `.45 / .46 / .47` triple is Webflow drag-resize drift — three values that render
within ~4px of each other at 1800px. Candidates for normalising to a single `.45fr`.

**Fixed-px tracks:** `.checkout-grid 1fr 400px` (`1fr 300px` @≤991), `.licensing-inner-grid 160px 1fr`,
`.contact-offices-item 170px 1fr` (`200px` @≤991, `180px` @≤767, `1fr` @≤479),
`.home-clients-logos` 8 columns at base → 2 columns @≤991.

**Aspect/height primitives (viewport-relative with px caps):**
```
.studio-team-image-wrapper       height 18vw, max-height 300px  → 25vw @≤991 → 50vw @≤767
.services-image-wrapper          height 30vw, max-height 600px  → 25vw @≤991 → 45vw @≤767
.work-projects-item-image-wrapper height 32vw, max-height 660px → 45vw @≤991
.home-hero-image-wrapper         (no height at base)            → 50vw @≤991
.studio-hero-image-wrapper       (no height at base)            → 50vw @≤991
.about-gallery                   height 800px (fixed)           → 50vw @≤991
.section-404, .utility-component height 97vh
.cursor-wrapper                  height 100vh
```

---

## 6. Ready-to-paste custom property block

Drop-in for Phase B. Values are verbatim from source; **names are proposals**. Near-duplicates are
kept as distinct properties (per the brief) with a comment marking the collapse candidate — resolve
them deliberately, don't let the cascade decide.

```css
/* =========================================================================
   leviacore.com — design tokens
   Derived from leviathan-core-2023-r1.webflow.css. Values verbatim.
   1rem = 16px (root never overridden).
   ========================================================================= */
:root {
  /* ---------- Color: core ---------- */
  --color-ink:              #191919;  /* 56 uses — text, ALL hairlines, primary surfaces */
  --color-bg:               #fdfbf5;  /* warm off-white page background */
  --color-on-ink:           #fff;     /* text on primary/dark surfaces */
  --color-transparent:      #0000;    /* rgba(0,0,0,0) — border/bg resets */
  --color-text-muted:       #19191999;/* ink @60% — .text-color-muted */
  --color-overlay-hover:    #ffffff1a;/* white @10% — nav hover wash */
  --color-scrim:            #0009;    /* black @60% — cart drawer backdrop */
  --color-field-focus-bg:   #0000000d;/* black @5% — .form-input:focus */

  /* ---------- Color: near-duplicates of --color-ink (DO NOT auto-collapse) ---------- */
  --color-ink-pure:         #000;     /* 16× .text-color-default, .label-2, form borders */
  --color-ink-button:       #121416;  /*  3× .button text + hover borders */
  --color-ink-hover-alt:    #1a191e;  /*  2× hover borders on unused button variants */
  /* --color-ink-legacy:    #333;  — bare <body>, dead: .body class always wins */

  /* ---------- Color: table component ---------- */
  --color-border-table:     #d3d3d3;
  --color-surface-alt:      #f3f3f3;  /* zebra row */
  --color-border-subtle:    #e8e8e8;  /* cart qty input sides */

  /* ---------- Color: Webflow commerce boilerplate (quarantine) ---------- */
  --wf-blue:                #3898ec;
  --wf-input-bg:            #fafafa;
  --wf-input-border:        #ddd;
  --wf-placeholder:         #999;
  --wf-block-border:        #e6e6e6;
  --wf-page-bg:             #f5f5f5;
  --wf-error-bg:            #ffdede;
  --wf-disabled-fg:         #666;
  --wf-control-border:      #ccc;
  --shadow-color:           #0000001a;

  /* ---------- Typography: families ---------- */
  --font-display:  Syne, sans-serif;         /* headings only — weight 400 */
  --font-mono:     "Roboto Mono", sans-serif;/* nav, buttons, labels, meta — weight 400 */
  --font-body:     Satoshi, sans-serif;      /* everything else */

  /* ---------- Typography: weights ---------- */
  --fw-light:     300;  /* ⚠ Satoshi 300 NOT SHIPPED — .form-radio-label */
  --fw-regular:   400;  /*   the only Satoshi weight that exists */
  --fw-medium:    500;  /* ⚠ Satoshi 500 NOT SHIPPED — blockquote, label, mobile nav */
  --fw-semibold:  600;  /* ⚠ Satoshi 600 NOT SHIPPED — .text-rich-text strong */
  --fw-bold:      700;  /* ⚠ Satoshi 700 NOT SHIPPED — <strong> (57 in export) */

  /* ---------- Typography: display scale (Syne) ---------- */
  --fs-display-3xl:  8rem;    /* .heading-xlarge  (10rem @>=1440) */
  --fs-display-2xl:  6rem;    /* .heading-large   ( 8rem @>=1440) */
  --fs-display-xl:   5rem;    /* .heading-medium  ( 6rem @>=1440) */
  --fs-display-lg:   4.5rem;  /* .heading-small   ( 5rem @>=1440) */
  --fs-h1:           4rem;
  --fs-h2:           3rem;
  --fs-h3:           2rem;
  --fs-h4:           1.5rem;
  --fs-h5-tag:       1.375rem; /* <h5> element */
  --fs-h5-class:     1.25rem;  /* .heading-h5 — NOTE: differs from <h5> */
  --fs-h6:           1.125rem;

  /* ---------- Typography: body scale ---------- */
  --fs-body:         18px;    /* .body — 16px @<=991 */
  --fs-xl:           1.75rem; /* .text-size-xlarge, .accordion-title */
  --fs-lg:           1.4rem;  /* .text-size-large */
  --fs-md:           1.25rem; /* .text-size-medium */
  --fs-base:         1rem;    /* .text-size-regular, .text-size-small */
  --fs-sm:           .875rem;
  --fs-xs:           .75rem;  /* .text-size-tiny */

  /* ---------- Typography: mono / UI scale (px in source — kept verbatim) ---------- */
  --fs-mono-lg:      16px;  /* .form-input, .cart-item-quantity */
  --fs-mono-md:      15px;  /* .text-meta, .button, nav links — 14 uses, the UI default */
  --fs-mono-sm:      14px;  /* .cart-item-remove-text */
  --fs-mono-xs:      13px;  /* .text-meta-small, .label, .form-label */

  /* ---------- Typography: line heights (source uses %) ---------- */
  --lh-tightest: 90%;   /* .heading-xlarge */
  --lh-tighter:  100%;  /* .heading-large, .heading-medium, .badge, .accordion-icon */
  --lh-tight:    110%;  /* .heading-small, .heading-h2, .label, .button */
  --lh-snug:     120%;  /* h1-h3, .heading-h1/h3, nav links, .button-text */
  --lh-normal:   130%;  /* h4-h6, .heading-h4/h5/h6, .text-meta-small, prices */
  --lh-relaxed:  140%;  /* .text-meta, blockquotes, .form-checkbox-label */
  --lh-loose:    150%;  /* .text-size-xlarge, .form-input */
  --lh-looser:   160%;  /* .text-size-large/medium/regular/small/tiny, .form-label */
  --lh-body:     170%;  /* .body */

  /* ---------- Typography: letter spacing ---------- */
  --ls-wide:  1px;   /* every uppercase Roboto Mono selector (14 uses) */
  --ls-tight: .5px;  /* .button-5 only (unused) */

  /* ---------- Spacing scale (base / >=992px) ---------- */
  --space-tiny:     .125rem; /*   2px */
  --space-xxs:      .25rem;  /*   4px */
  --space-xs:       .5rem;   /*   8px */
  --space-sm:       1rem;    /*  16px */
  --space-md:       2rem;    /*  32px */
  --space-lg:       3rem;    /*  48px */
  --space-xl:       4rem;    /*  64px */
  --space-2xl:      5rem;    /*  80px */
  --space-3xl:      6rem;    /*  96px */
  --space-4xl:      8rem;    /* 128px */
  --space-5xl:      12rem;   /* 192px */

  /* ---------- Gutters ---------- */
  --page-padding:   3rem;    /* .page-padding */
  --frame-padding:  1rem;    /* .body outer frame */

  /* ---------- Radii ---------- */
  --radius-xs:      .125rem;
  --radius-sm:      6px;     /* .label, .button */
  --radius-md:      8px;     /* .cursor */
  --radius-card:    1rem;    /* every image/media wrapper — 11 uses */
  --radius-shell:   4rem;    /* .main-wrapper @<=991 (none at base) */
  --radius-gallery: 6rem;    /* .about-gallery */
  --radius-pill:    500px;
  --radius-circle:  50%;

  /* ---------- Motion ---------- */
  --duration-fast:  .2s;
  --duration-base:  .3s;
  --ease-default:   ease;    /* source declares NO custom easing anywhere */

  /* ---------- Elevation ---------- */
  --z-below:      0;
  --z-base:       1;
  --z-raised:     2;
  --z-sticky:     15;
  --z-header:     100;
  --z-navbar:     1000;   /* becomes 10 @<=767 */
  --z-overlay:    9999;   /* navbar-wrapper, menu, dropdown, cursor */

  /* ---------- Containers ---------- */
  --container-xs:   37.5rem;  /*  600px */
  --container-sm:   50rem;    /*  800px */
  --container-md:   62.5rem;  /* 1000px */
  --container-lg:   75rem;    /* 1200px */
  --container-xl:   87.5rem;  /* 1400px */
  --container-2xl:  100rem;   /* 1600px */
  --container-3xl:  112.5rem; /* 1800px — the page shell, 80 uses */

  /* ---------- Content widths ---------- */
  --width-xxs:  12rem;
  --width-xs:   16rem;
  --width-sm:   22rem;
  --width-lg:   40rem;
  --width-2xl:  80rem;
  /* NOTE: .max-width-medium and .max-width-xlarge declare NO max-width in source. */

  /* ---------- Structure ---------- */
  --divider-width:  1px;       /* the 1px grid track / hairline border */
  --divider-color:  #191919;   /* == --color-ink */
}

/* ---------- Responsive scale overrides ---------- */
@media screen and (max-width: 991px) {
  :root {
    --fs-body:      16px;
    --page-padding: 2.5rem;
    --space-md: 1.5rem; --space-lg: 2.5rem; --space-xl: 3rem;
    --space-2xl: 4rem; --space-3xl: 5rem; --space-4xl: 6rem; --space-5xl: 8rem;
    --radius-shell: 4rem; --radius-gallery: 4rem;
  }
}
@media screen and (max-width: 767px) {
  :root {
    --page-padding: 2rem;
    --space-md: 1.25rem; --space-lg: 1.5rem; --space-xl: 2rem;
    --space-2xl: 3rem; --space-3xl: 3.5rem; --space-4xl: 4rem; --space-5xl: 4.5rem;
    --radius-shell: 3rem;
  }
}
@media screen and (max-width: 479px) {
  :root {
    --page-padding:  1.5rem;
    --frame-padding: 12px;   /* top/left/right only; bottom stays 1rem in source */
    --radius-shell:  2rem;
    --radius-gallery: 1.5rem;
  }
}
@media screen and (min-width: 1440px) {
  :root {
    --fs-display-3xl: 10rem;
    --fs-display-2xl:  8rem;
    --fs-display-xl:   6rem;
    --fs-display-lg:   5rem;
  }
}
```

---

## 7. Anomalies

Ordered by how much they will hurt a rebuild.

### ~~BLOCKER-1~~ → **RESOLVED, NOT A BLOCKER** — Satoshi ships one weight, four are requested
Covered in full in §2b, **including the correction — read it before acting on this entry.**

`Satoshi-Regular.woff` (400) is the only font file in the export, yet weights **300, 500, 600, 700**
are requested. Live instances include 57 `<strong>` tags (700), 27 `<label>` tags (500),
`.text-rich-text strong` (600), `.text-rich-text blockquote` (500), `.mobile-menu-nav-text` (500).

**The live site renders all of these as browser-synthesised faux weights today** — both of its
`@font-face` blocks declare `font-weight: 400` and point at the same single file. So this is a
property of the existing design, not a missing asset.

**Correct action: replicate it.** `src/styles/fonts.css` already declares one `@font-face` at weight
400 and lets the browser synthesise the rest, which reproduces the live rendering exactly. **Do not
source and add real Satoshi weights** — that would change the design, diverge from the visual
regression reference, and exceed the scope of this migration.

### BLOCKER-2 — `.margin-bottom.margin-*` combos silently destroy the spacing scale
```css
.margin-medium { margin: 2rem; }
.margin-large  { margin: 3rem; }
.margin-xlarge { margin: 4rem; }
.margin-xhuge  { margin: 8rem; }
.margin-xxhuge { margin: 12rem; }
/* …then, later in the file: */
.margin-bottom.margin-small  { margin-bottom: 1rem; }
.margin-bottom.margin-large  { margin-bottom: 2rem; display: block; }
.margin-bottom.margin-xhuge  { margin-bottom: 2rem; }
.margin-bottom.margin-xlarge,
.margin-bottom.margin-xxhuge { margin-bottom: 1rem; }
```
`margin-bottom` is by far the most-used utility in the export (**223 occurrences**). In that context:
`margin-large` yields **2rem instead of 3rem**, `margin-xlarge` yields **1rem instead of 4rem**,
`margin-xhuge` yields **2rem instead of 8rem**, and `margin-xxhuge` yields **1rem instead of 12rem**.
`margin-xxhuge` (12 HTML uses) ends up *smaller* than `margin-small`.

Worse: these two-class rules have specificity `(0,2,0)` and are **never restated inside any media
query**, while the single-class rules they override *are*. So `margin-bottom margin-large` is
frozen at 2rem at every viewport — the responsive spacing step-down does nothing for it.

Anyone porting the token table in §3a and applying it literally will get a materially different
layout. **Port the resolved values, not the nominal scale.**

### HIGH-1 — Type scale inverts at the narrowest breakpoints
```
.heading-small:            4.5rem (base) → 4rem (≤991) → 3.125rem (≤767) → 3.25rem (≤479)
.text-rich-text blockquote:  2rem (base) → 2rem (≤991) →   1.5rem (≤767) → 1.75rem (≤479)
```
Both get **larger** on the smallest screens than on the band above. And at ≤767/≤479
`.heading-small` (3.125/3.25rem) exceeds `.heading-medium` (3rem), inverting the semantic ordering
that holds at every other breakpoint. Almost certainly hand-tuning that was never reconciled.
Decide the intended values rather than reproducing the inversion.

### HIGH-2 — Fixed-px widths that overflow at the 375px target
```css
.navbar-dropdown { width: 660px; }              /* @≤991 */
.navbar-dropdown { width: 390px; }              /* @≤767 — exceeds a 375px viewport */
.cart-container  { max-width: 360px; }          /* @≤479 — ok */
.about-gallery   { height: 800px; }             /* base, fixed */
.checkout-grid   { grid-template-columns: 1fr 400px; }   /* 1fr 300px @≤991 */
.contact-offices-item { grid-template-columns: 170px 1fr; }
```
`.navbar-dropdown` at `390px` is 15px wider than the 375px verification viewport and is positioned
`absolute; right: 0`. Combined with `.body { padding: 12px }` @≤479 the effective content box is
351px. **Verify this at 375 specifically.**

### HIGH-3 — 768 sits on the wrong side of the tablet boundary
The stylesheet breaks at `767`/`991`, not `768`/`992`. The verification target **768** therefore
exercises the `≤991` tablet rules, *not* the `≤767` mobile-landscape rules. Testing at 768 alone
leaves the entire `≤767` block (three separate `@media` bodies, including all the mobile type
reductions and `.navbar-dropdown { width: 390px }`) unverified. Add **767** to the matrix.

### MEDIUM-1 — `.max-width-medium` and `.max-width-xlarge` have no max-width
```css
.max-width-xlarge, .max-width-medium { width: 100%; }
```
Two rungs of the width ladder are declared but empty — they behave as `max-width: none`. If HTML
relies on them for measure control, text will run the full 1800px container. The neighbouring
utilities (`xxsmall 12rem`, `xsmall 16rem`, `small 22rem`, `large 40rem`, `xxlarge 80rem`) suggest
the missing values were meant to be roughly `28–32rem` (medium) and `60rem` (xlarge), but **the
source does not say** — do not guess; ask the design owner.

### MEDIUM-2 — `.text-size-medium` declared twice with different bodies
```css
/* line 1126 */ .text-size-medium { font-size: 1.25rem; }
/* line 1746 */ .text-size-medium { font-size: 1.25rem; line-height: 160%; }
```
Same font-size, second adds line-height. Harmless as-is (later wins) but it is the only duplicated
top-level selector in the file and signals the stylesheet was assembled from two sources.

### MEDIUM-3 — Heading *tags* and heading *classes* disagree
| | tag | class |
|---|---|---|
| level 2 | `h2` — `3rem` / **120%** | `.heading-h2` — `3rem` / **110%** |
| level 5 | `h5` — **`1.375rem`** / 130% | `.heading-h5` — **`1.25rem`** / 130% |

Everything else matches. Since content mixes bare tags (in `.text-rich-text` bodies) with explicit
classes (in page markup), the same visual level renders two different ways depending on origin.
Pick one source of truth in the rebuild.

### MEDIUM-4 — `!important` distribution
**Site stylesheet: 0 occurrences.** Clean.
**`webflow.css`: 49 occurrences**, all framework:
- 26 in `.w-webflow-badge` (the "Made in Webflow" chip — delete the badge, delete the rule)
- ~20 `display: …!important` on `.w-hidden-*`, `.w-dyn-hide`, `.w-dyn-bind-empty`,
  `.w-condition-invisible`, `.w-hidden-main/medium/small/tiny`
- 1 `font-family: 'webflow-icons' !important` on `[class^="w-icon-"]`
- 1 `background-attachment: scroll !important` on `html.w-mod-touch *`
- 1 `cursor: default!important` (note: no space) in the richtext figure rules

Only the `.w-dyn-*` / `.w-condition-invisible` ones matter if CMS collection lists are reimplemented;
everything else can be dropped with the framework.

### MEDIUM-5 — px font sizes defeat user font-size preferences
`.body 18px`, `.form-input 16px`, `.text-meta 15px`, `.text-meta-small 13px`, `.form-label 13px`,
`.label 13px`, `.button 15px`, `.cart-item-remove-text 14px`, `.cart-item-quantity 16px` and all
14 mono selectors are **absolute px**. Everything else in the file is rem. A user who raises their
browser's default font size gets a document where the headings scale and the nav/meta/body do not.
`.body` also only steps 18px→16px once (@≤991) and never again. Converting these to rem is a
behaviour change (they'd start scaling) — flag it as a decision, not a silent fix.

### MEDIUM-6 — vw heights with no lower bound
`18vw / 25vw / 30vw / 32vw / 45vw / 50vw` heights on the image wrappers, with `max-height` caps at
the top end only (`300px`, `600px`, `660px`). At 375px viewport, `50vw` = 187px — image wrappers
collapse to letterbox strips. `.about-gallery` is worse: a hard `height: 800px` at base that only
becomes `50vw` @≤991.

### LOW-1 — Dead classes (0 occurrences across all 24 HTML files)
`.heading-xlarge` · `.text-size-regular` · `.text-size-tiny` · `.block-quote` · `.button-old` ·
`.button-2` · `.button-5` · `.button-text-4` · `.label-2` · `.italic` · `.container-xsmall` ·
`.container-medium` · `.container-large` · `.container-xlarge` · `.cell-text.strong` ·
`.margin-xxsmall` · all `.styleguide-*` (`-3-col`, `-2-col`, `-flex`, `-right`, `-classes`,
`-color-palette`) · `.section-styleguide` · `.licensing-*` · `.changelog-*`.

Notable casualties of deleting these: `#5bb5a2` (the only non-neutral color in the site layer),
`#e2ebf0`, `#d1dfe4`, `letter-spacing: .5px`, `border-radius: 100px`, `transition: all .2s`, and the
entire Zodiak reference — all become unreferenced. **`.heading-xlarge` is worth confirming before
deletion**: it carries the largest type in the system (8rem → 10rem @≥1440) and its absence from the
markup may be an oversight rather than a decision.

### LOW-2 — Zodiak font referenced with no provisioning
```css
.italic { font-family: Zodiak; font-weight: 400; }
```
No `@font-face`, no webfont request, no file, no fallback in the stack. Would render as the
browser's default serif. Class unused. Delete.

### LOW-3 — Duplicate `@font-face` for Satoshi
Identical block at lines 1–7 and lines 5993–5999 (one uses `format("woff")`, the other
`format('woff')`). Harmless, but do not copy both forward.

### LOW-4 — Unused Google Fonts weight
`WebFont.load({ google: { families: ["Roboto Mono:400","Syne:400,500"] }})` — **Syne 500 is
downloaded on every page and referenced by zero selectors.** Free bytes on every page load.

### LOW-5 — Focus ring removed without replacement
```css
.form-checkbox-icon.w--redirected-focus { box-shadow: none; border-color: #000; }
```
Suppresses the visible focus indicator on custom checkboxes, leaving only a 1px border-color shift
(`#191919` → `#000`) — a contrast delta of essentially zero. WCAG 2.4.7 failure. Fix in the
rebuild rather than reproduce.

### LOW-6 — Conflicting positioning on `.navbar-dropdown`
```css
.navbar-dropdown { position: absolute; width: 100%; min-width: 0;
                   left: 0; right: 2rem; padding-left: 4rem; padding-right: 4rem; }
```
`width: 100%` together with both `left` and `right` offsets: the width declaration wins and `right`
is ignored, so the `2rem` is dead. Combined with 4rem symmetric padding and `box-sizing: border-box`
(set globally by `webflow.css`), the effective content width is `100% − 8rem`. Overridden entirely
at `≤991` (`width: 660px; left: auto; right: 0`).

### LOW-7 — Zero written two ways; `0px` vs `0rem` in gaps
`grid-column-gap: 0px` (6×) and `grid-column-gap: 0rem` (5×) both appear, sometimes in adjacent
rules (`.services-hero-grid` uses `0px`, `.studio-hero-grid` uses `0rem`). Cosmetic.

### LOW-8 — Vendor prefixes
**Site stylesheet: none.** `webflow.css` carries `-webkit-box-sizing`/`-moz-box-sizing` (obsolete —
drop), `-webkit-tap-highlight-color` (×5, keep for iOS), `-webkit-font-smoothing` /
`-moz-osx-font-smoothing` (keep — affects rendering weight, relevant given the Satoshi issue),
`-webkit-appearance` (×3, keep for form resets), `-webkit-transform`, `-webkit-transition`,
`-webkit-animation`, `-webkit-overflow-scrolling`, `-webkit-user-select`/`-moz-user-select`,
`-webkit-media-controls-start-playback-button`. Only the font-smoothing and appearance ones need to
survive.

### LOW-9 — ~900 lines of ecommerce boilerplate
Lines 14–896 of the site stylesheet are `w-commerce-*`, `.w-checkbox*` and `.w-form-*` rules —
roughly 15% of the file, serving `checkout.html`, `paypal-checkout.html`,
`order-confirmation.html`, `detail_product.html`, `detail_sku.html`. They contribute 10 of the 28
colors, the `20px` line-height, `38px` input heights and the `3px`/`2px` radii. **If commerce is out
of scope for the rebuild, dropping this block removes most of the palette noise flagged in §1b and
§1c.** Confirm scope before porting.

### LOW-10 — Empty responsive utility repetition
`.margin-top`, `.margin-bottom`, `.margin-left`, `.margin-right`, `.margin-vertical`,
`.margin-horizontal` and the six padding equivalents are restated **verbatim and unchanged**
(all zeros) inside the `≤991`, `≤767` and `≤479` blocks — 12 selectors × 3 breakpoints = 36 rules
that do nothing. Pure Webflow export noise; drop them.
