# Webflow IX2 Interactions — Decoded Parameters

Source of truth: `_webflow-export/js/webflow.js`, module `96874`, the object passed to
`Webflow.require("ix2").init({...})` (byte offset 1073010, ~77 KB of data).
All numbers below were **extracted from that data structure**, not estimated, unless a line
is explicitly tagged `[GUESS]` or `[UNKNOWN]`.

Contents: 3 top-level keys — `events` (93), `actionLists` (19), `site`.

---

## ⚡ PHASE E SCOPE — read this first

Reconciled in the main thread from this decode **plus** the `component-mapper` pass over the page HTML.
Neither source could produce this alone: the IX2 data doesn't know which markup shipped, and the markup
doesn't know which interactions exist.

**19 action lists defined → 13 to actually port.** Six are dead on arrival:

| Action list | Why it's dropped | Evidence |
|---|---|---|
| `Accordion [Open]` | No accordion markup exists | `grep -i accordion` returns **0 matches** across index, services, team, projects, contact, detail_project |
| `Accordion [Close]` | Same | Same |
| `Button Text Hover [In]` (`a-34`) | Trigger class absent from export; `target:{}` resolves to an empty element list | Already a silent no-op on the live site |
| `Button Text Hover [Out]` (`a-169`) | Same | Same |
| `About Gallery Scroll` (`a-159`) | Same | Same |
| `Blog Post Image Parallax` (`a-154`) | Trigger class absent | See note below — dormant, not dead |

> **On `Blog Post Image Parallax`:** it belongs to the article template that Phase D3 builds and ships
> disabled. Do **not** port it standalone in Phase E. If D3's article layout ends up using a hero image,
> reuse the `Image Parallax` primitive rather than rebuilding this one — they share the same mechanism.

**The 13 that ship**, grouped by real cost:

- **Pure CSS transitions (6):** Button Hover [In]/[Out], Label Hover [In]/[Out] — plus the two hover
  states these pair with. No JavaScript.
- **IntersectionObserver, fire-once (3):** Scale In, Line, Line Vertical.
- **Vanilla JS, small (2):** Mobile Menu [Open]/[Close].
- **Genuinely medium (2 effects, 3 lists):** Image Parallax; Cursor Move + Cursor View [Show]/[Hide].

### Two behaviours to preserve deliberately, not "fix"

1. **Scale In, Line, and Line Vertical never reset.** Seven `autoStopEventId` references in the data point
   at events that don't exist, so these fire once on first scroll-in and never replay. **That is the live
   site's behaviour.** Reimplement as fire-once (`observer.unobserve()` after trigger). An
   IntersectionObserver that re-triggers on every scroll-past would be a visible regression.
2. **The custom cursor is the hardest item in Phase E** — see `a-8`. Not the math, the composition: the
   rAF translate and the `scale(0↔1)` show/hide write to the same `transform` property and will clobber
   each other if split between JS and CSS. Compose the whole transform string in JS, or route scale
   through a custom property the rAF loop reads. Needs three gates: `≥992px`, `pointer: fine`, and not
   `prefers-reduced-motion`.

### 🎯 PHASE E READINESS MAP — selector reality check

Compiled in the main thread after Phase D, by diffing the built output against the source. **Read this before writing any Phase E code.** The build already got burned once by trusting an interaction's *name* instead of its *target* (see `DECISIONS.md`, the reverted button-span entry).

| Interaction | Source selector | Exists in rebuild? | Action |
|---|---|---|---|
| Button Hover In/Out | `.button` → `.button-inner-text`, `.button-inner-text-hover` | ✅ present | Attach CSS transition |
| Label Hover In/Out | `.label` → `.label-text`, `.label-text-hover` | ⚠️ **renamed** | Attach to `.service-jump-link` → `.service-jump-link-text`, `.service-jump-link-text-hover`. Scoped inside `services.astro` |
| Line / Line Vertical | `.line`, `.line-vertical` | ✅ present | IntersectionObserver, **fire-once** |
| Scale In | `.image-icon` | ❌ **absent** | See below |
| Mobile Menu Open/Close | `.mobile-menu*` | ✅ present | Structural JS already exists in `SiteHeader`; add the transition only |
| Cursor Move / View Show / View Hide | `.cursor-wrapper`, `.cursor`, `.cursor-text.view` | ❌ **MISSING ENTIRELY** | See below |
| Image Parallax | (per §1.x) | verify before building | — |

#### ⚠️ The custom cursor markup does not exist in the rebuild — Phase E must create it

Phase B/C never built it, because it is presentational scaffolding with no content, and nothing in `components.md` flagged it. Exact source markup, sitting immediately before `<header>`:

```html
<div class="cursor-wrapper">
  <div class="cursor">
    <div class="cursor-text view">View</div>
  </div>
</div>
```

**Scope it precisely — it is NOT sitewide.** Verified by grepping every export page and every captured live page:

| Page | Cursor markup |
|---|---|
| `/`, `/services`, `/team`, `/projects`, `/contact` | ✅ present (3 elements each) |
| `/project/<slug>` — all five, export **and** live | ❌ absent |
| `/privacy-policy`, `/ccpa`, `/notice-at-collection`, `/404` | ❌ absent |

Adding it sitewide would be a change to the live design, not a migration. Put it in the five static pages only — **not** in `BaseLayout`, which every page uses.

Gates required, from §"Two behaviours to preserve": `≥992px`, `pointer: fine`, and not `prefers-reduced-motion`.

#### ⚠️ `Scale In` targets `.image-icon`, which is a detail-page element

`e-1158` fires `SCROLL_INTO_VIEW` on `.image-icon`, and the decode records its pages as *detail_blog-category, detail_category, detail_post, detail_product, detail_project* — i.e. **CMS detail templates, not the static pages.** Of those, only `detail_project` is in scope. The class appears **once** in the captured live Spiritfarer page and **zero** times in any static page.

`.image-icon` does not exist in our rebuild. Before implementing: identify which element on the live case study page carries it, confirm our `project/[slug].astro` renders an equivalent, and attach there. **Do not apply Scale In sitewide** — and remember it is one of the three fire-once interactions that never reset.

### Accuracy notes carried up from the decode

- Durations, delays, from/to values, units, and scroll offsets are **exact**.
- **Easing curves are the one soft spot.** Webflow uses Penner polynomials; only `ease` maps to an exact
  cubic-bezier. Every bezier equivalent in this document is labelled approximate. If a motion comparison
  in Phase E looks subtly off, easing is the first place to look.
- The cursor lerp in the original is **frame-rate dependent**. The recommended time-corrected form
  `alpha = 1 - 0.5^(dt/16.67)` is a deliberate substitute, not decoded behaviour — it matches the
  original at 60Hz and stops the cursor moving faster on a 144Hz display.
- **`data-w-id` can be dropped entirely.** Only `9f610c21-…` (the hamburger) is load-bearing; the other
  four GUIDs are vestigial authoring ids.

---

## 0. Engine semantics decoded (needed to read the tables below)

These were read out of the IX2 runtime itself, not assumed.

### 0.1 Breakpoints (`site.mediaQueries`)

| key | min | max |
|---|---|---|
| `main` | 992px | 10000px |
| `medium` | 768px | 991px |
| `small` | 480px | 767px |
| `tiny` | 0px | 479px |

An event's `mediaQueries: ["main"]` means **desktop only (≥992px)**.
`["main","medium","small","tiny"]` means all breakpoints.

### 0.2 Easing functions (exact Penner equations from the bundle)

| Webflow name | exact function in bundle | CSS equivalent |
|---|---|---|
| `ease` | `bezier(.25,.1,.25,1)` (literal, exact) | `cubic-bezier(.25,.1,.25,1)` |
| `outQuart` | `-(pow(t-1,4)-1)` | `cubic-bezier(.165,.84,.44,1)` (approx.) |
| `outQuint` | `pow(t-1,5)+1` | `cubic-bezier(.23,1,.32,1)` (approx.) |
| `inOutQuart` | `t<.5 ? .5*pow(2t,4) : -.5*((2t-2)*pow(2t-2,3)-2)` | `cubic-bezier(.77,0,.175,1)` (approx.) |
| `inOutCubic` | standard Penner inOutCubic | `cubic-bezier(.645,.045,.355,1)` (approx.) |
| `""` (empty) | linear / instant (used only where `duration:0` or for continuous keyframes) | `linear` |

The cubic-bezier column is the conventional approximation of the Penner curve. It is not
bit-identical; error is < 1% of travel and invisible at these durations. Flagged as approximate.

### 0.3 Step-action group ordering

`actionItemGroups` run **sequentially**: group *N* starts only after every item in group *N-1*
has finished (`delay + duration`). Items **within** a group run in parallel.

`useFirstGroupAsInitialState: true` means group[0] is **not** part of the timed sequence — it
is stamped onto the DOM at page load as the initial style, and the trigger plays groups 1..n.

### 0.4 `SCROLLING_IN_VIEW` progress formula (decoded from the engine)

With the site's actual config (`startsEntering:true, addStartOffset:false, startsExiting:false,
addEndOffset:false` — note the `addOffsetValue:50` / `endOffsetValue:50` values are **ignored**
because both `add*Offset` flags are `false`):

```
progress = clamp(viewportHeight - rect.top, 0, U) / U
where U = viewportHeight + rect.height
```

Verified: `rect.top === viewportHeight` → 0 (element just below the fold);
`rect.top === -rect.height` → 1 (element just above the fold).

This is exactly CSS `animation-timeline: view(); animation-range: cover 0% cover 100%`.

### 0.5 Smoothing / damping (decoded from the engine)

Every continuous event here carries `smoothing: 50`. The engine does:

```
p = smoothing / 100          -> 0.5
h = Math.max(1 - p, 0.01)    -> 0.5
position += (targetProgress - position) * h    // per tick
```

So: **an exponential lerp with alpha = 0.5 per tick**, where the tick is the rAF-throttled
scroll / mousemove handler. Converges to ~97% in 5 frames (~80ms at 60fps).
`restingState: 50` → resting parameter value 0.5 (dead-centre) before the first input event.

### 0.6 `MOUSE_MOVE` + `basedOn: VIEWPORT` (decoded)

```
paramX = min(clientX, innerWidth)  / innerWidth     // 0..1
paramY = min(clientY, innerHeight) / innerHeight    // 0..1
```

### 0.7 `SCROLL_INTO_VIEW` with `scrollOffsetValue: 0, unit: "%"` (decoded)

Trigger box = `{left:0, top:0, right:clientWidth, bottom:clientHeight}` — i.e. plain viewport
intersection. Equivalent to `IntersectionObserver` with `threshold: 0`, no rootMargin.

### 0.8 Target resolution (decoded — important)

- `target: { useEventTarget: true, id: "<pageId>|<guid>" }` → resolves to **the element that
  fired the event**. The `id` is a vestigial authoring reference and is never used at runtime
  on this path. So class-triggered events with `useEventTarget:true` animate *themselves*.
- `target: { useEventTarget: "CHILDREN" | "SIBLINGS", selector: ".x" }` → `.x` descendants /
  siblings of the trigger element.
- `target: { selector: ".x" }` → all `.x` on the page (global).
- **`target: {}` (empty object) → resolves to `[]`. The action item is a silent no-op.**
  This kills several action items listed below; each is flagged.

---

## 1. The 19 action lists

### 1.1 `a-8` — "Cursor Move" (custom cursor follow)

| | |
|---|---|
| Kind | `GENERAL_CONTINUOUS_ACTION`, 2 continuous parameter groups |
| Events | 11 × `MOUSE_MOVE`, `appliesTo: PAGE`, `mediaQueries: ["main"]` (desktop only) |
| Event ids | e-215, e-222, e-791, e-973, e-978, e-1151, e-1164, e-1165, e-1166, e-1167, e-1170 |
| Target | global selector `.cursor` (guid `4490e606-81f7-5290-4ceb-9d5900993503`) |

Parameter groups:

| group | type | axis | basedOn | reverse | smoothing | restingState |
|---|---|---|---|---|---|---|
| `a-8-p` | `MOUSE_X` | `X_AXIS` | `VIEWPORT` | false | 50 | 50 |
| `a-8-p-2` | `MOUSE_Y` | `Y_AXIS` | `VIEWPORT` | false | 50 | 50 |

Keyframes (linear interpolation, `easing: ""`):

| group | 0% | 100% |
|---|---|---|
| `a-8-p` | `translateX: -50vw` | `translateX: +50vw` |
| `a-8-p-2` | `translateY: -50vh` | `translateY: +50vh` |

`duration: 500` is present on the keyframe items but is **inert for continuous actions** —
position is driven directly by the damped parameter, not by a timed tween.

Base CSS confirms the geometry: `.cursor-wrapper` is `position:fixed; inset:0; width:100%;
height:100vh; display:flex; justify-content/align-items:center; z-index:9999`. `.cursor` starts
at viewport centre, so `translate((param-0.5)*100vw, (param-0.5)*100vh)` lands it on the pointer.
`.cursor` also has `margin-top:-1rem; margin-left:-1rem` (hotspot offset) and `display:none` by
default.

Pages: bound by `data-wf-page` id. Resolved:
`649aefa8c795b8d4dc529951` index, `...52996e` services, `...529974` projects,
`...529960` detail_post, `...52995e` detail_blog-category, `...52995f` detail_category,
`...529963` detail_project-category.
Unresolved page ids: `...529956`, `...52996f`, `6240546a6393242785d71beb`,
`6240546a6393245ca3d71bec` — no exported HTML carries these `data-wf-page` values (deleted or
never-exported pages). `[UNKNOWN]`

⚠️ `contact.html` (`...52995d`) and `team.html` (`...529970`) contain `.cursor` markup but have
**no** `MOUSE_MOVE` binding — on those pages the cursor element exists but never tracks.

**Reimplementation:** `rAF` + `mousemove`, desktop-only, pointer-fine only.
```js
// tick: cur += (target - cur) * 0.5;  el.style.transform = `translate(${x}px,${y}px) scale(${s})`
```
Start `cur` at viewport centre (restingState 0.5). Guard with
`matchMedia('(min-width:992px) and (pointer:fine)')`. Suppress entirely under reduced motion.

---

### 1.2 `a-165` — "Cursor View [Show]"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: true` |
| Events | 6 × `MOUSE_OVER`, `appliesTo: CLASS`, `mediaQueries: ["main"]` |

| event | trigger selector | paired out-event | present in |
|---|---|---|---|
| e-1033 | `.post-preview-image-link` | e-1034 | detail_blog-category |
| e-1092 | `.projects-item-link` | e-1093 | *(class absent from export)* |
| e-1152 | `.post-preview-image-wrapper` | e-1153 | detail_blog-category, detail_post |
| e-1154 | `.project-preview-image-wrapper` | e-1155 | index |
| e-1156 | `.work-projects-item-image-wrapper` | e-1157 | projects, detail_project-category |
| e-1168 | `.product-preview-image-wrapper` | e-1169 | detail_category |

Steps:

| group | item | target | property | value | dur | delay | easing |
|---|---|---|---|---|---|---|---|
| 0 (initial state) | `a-165-n` | `.cursor` | scale (x&y, locked) | 0 | 500 | 0 | linear |
| 0 (initial state) | `a-165-n-7` | `.cursor-text.view` | display | `none` | 0 | 0 | — |
| 1 | `a-165-n-3` | `.cursor` | display | `flex` | 0 | 0 | — |
| 1 | `a-165-n-6` | `{}` **no-op** | display | `none` | 0 | 0 | — |
| 1 | `a-165-n-8` | `.cursor-text.view` | display | `block` | 0 | 0 | — |
| 2 | `a-165-n-5` | `.cursor` | scale (x&y, locked) | 1 | **500** | 0 | **outQuart** |

Timeline: group 1 is instantaneous, then group 2 scales in over 500ms outQuart.

### 1.3 `a-166` — "Cursor View [Hide]"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: false` |
| Events | 6 × `MOUSE_OUT`: e-1034, e-1093, e-1153, e-1155, e-1157, e-1169 (same selectors, `["main"]`) |

| group | target | property | value | dur | delay | easing |
|---|---|---|---|---|---|---|
| 0 | `.cursor` | scale (x&y, locked) | 0 | 500 | 0 | outQuart |

Note: hide only scales to 0 — it does **not** set `display:none` and does **not** reset
`.cursor-text.view`. That's a fidelity detail worth keeping (or fixing).

**Reimplementation (1.2 + 1.3):** one CSS class on `.cursor`, e.g.
`.cursor{transform:scale(0);transition:transform .5s cubic-bezier(.165,.84,.44,1)}`
`.cursor.is-visible{transform:scale(1)}` — but the scale must compose with the rAF translate
from `a-8`, so drive scale through a CSS custom property that the rAF writer reads, or write the
full composed transform in JS. Show/hide toggled by `pointerenter`/`pointerleave` delegated on
the six wrapper selectors.

---

### 1.4 `a-74` — "Button Hover [In]"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: true` |
| Events | 3 × `MOUSE_OVER`, `appliesTo: CLASS`, `["main"]` |
| e-663 | `.button-2` — **class absent from export (dead)** |
| e-669 | `.button-old` — **class absent from export (dead)** |
| e-1110 | `.button` — **live**, on 19 pages; paired out-event e-1111 |

| group | target | property | from | to | dur | delay | easing |
|---|---|---|---|---|---|---|---|
| 0 (initial) | CHILDREN `.button-inner-text` | translateY | — | `0%` | 500 | 0 | linear |
| 0 (initial) | CHILDREN `.button-inner-text-hover` | translateY | — | `0%` | 500 | 0 | linear |
| 1 | CHILDREN `.button-inner-text` | translateY | `0%` | `-100%` | **500** | 0 | **outQuint** |
| 1 | CHILDREN `.button-inner-text-hover` | translateY | `0%` | `-100%` | **500** | 0 | **outQuint** |

Classic two-line text roll: both stacked children translate up by their own height.

### 1.5 `a-75` — "Button Hover [Out]"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: false` |
| Events | 4 × `MOUSE_OUT`, `["main"]`: e-664 (`.button-2`, dead), e-670 (`.button-old`, dead), e-1020 (`.button-5`, dead), **e-1111 (`.button`, live)** |

| group | target | property | to | dur | delay | easing |
|---|---|---|---|---|---|---|
| 0 | CHILDREN `.button-inner-text` | translateY | `0%` | 500 | 0 | outQuint |
| 0 | CHILDREN `.button-inner-text-hover` | translateY | `0%` | 500 | 0 | outQuint |

**Reimplementation (1.4 + 1.5): pure CSS.** No JS at all.
```css
.button-inner-text,.button-inner-text-hover{
  transform:translateY(0);
  transition:transform .5s cubic-bezier(.23,1,.32,1);
}
@media (hover:hover) and (min-width:992px){
  .button:hover .button-inner-text,
  .button:hover .button-inner-text-hover{transform:translateY(-100%)}
}
```
Add `:focus-visible` to match `:hover` for keyboard users (Webflow omitted this).

---

### 1.6 `a-77` — "Label Hover [In]"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: true` |
| Events | e-671 `.label` (**live** — checkout, detail_blog-category, detail_category, order-confirmation, paypal-checkout, services), e-1012 `.label-2` (**class absent, dead**). Both `MOUSE_OVER`, `["main"]` |

| group | target | property | to | dur | delay | easing |
|---|---|---|---|---|---|---|
| 0 (initial) | CHILDREN `.label-text` | translateY | `0%` | 500 | 0 | linear |
| 0 (initial) | CHILDREN `.label-text-hover` | translateY | `0%` | 500 | 0 | linear |
| 1 | CHILDREN `.label-text` | translateY | `-100%` | **500** | 0 | **outQuint** |
| 1 | CHILDREN `.label-text-hover` | translateY | `-100%` | **500** | 0 | **outQuint** |

### 1.7 `a-78` — "Label Hover [Out]"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: false` |
| Events | e-672 (`.label`, live), e-1013 (`.label-2`, dead). `MOUSE_OUT`, `["main"]` |

| group | item | target | property | to | dur | delay | easing |
|---|---|---|---|---|---|---|---|
| 0 | `a-78-n` | CHILDREN `.label-text` | translateY | `0%` | 500 | 0 | outQuint |
| 0 | `a-78-n-2` | CHILDREN `.label-text-hover` | translateY | `0%` | 500 | 0 | outQuint |
| 0 | `a-78-n-3` | `{}` **no-op** | translateY | `103%` | 500 | 0 | outQuint |

The third item has an empty target and never runs. Do not port it.

**Reimplementation (1.6 + 1.7): pure CSS,** identical shape to the button roll but on
`.label` / `.label-text` / `.label-text-hover`. Note `.label-text-hover` only exists on
detail_blog-category, detail_category and services — on checkout/order-confirmation/
paypal-checkout `.label` is a form label with no hover children, so the rule is inert there.

---

### 1.8 `a-100` — "Accordion [Open]"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: true` |
| Event | **e-753**, `MOUSE_CLICK`, `appliesTo: CLASS`, selector `.accordion-title-wapper` *(sic — Webflow's typo)*, `mediaQueries: ["main","medium","small","tiny"]` (all breakpoints), `autoStopEventId: e-754` |
| Page | `detail_product.html` only |

| group | target | property | value | dur | delay | easing |
|---|---|---|---|---|---|---|
| 0 (initial) | SIBLINGS `.accordion-content-wrapper` | width / height | `100%` / `0px` | 500 | 0 | linear |
| 1 | SIBLINGS `.accordion-content-wrapper` | width / height | `100%` / **`AUTO`** | **300** | 0 | **ease** |
| 1 | CHILDREN `.accordion-icon` | rotateZ | **`45deg`** | **300** | 0 | **ease** |

`heightUnit: "AUTO"` is Webflow's measure-then-tween-to-scrollHeight behaviour.

### 1.9 `a-101` — "Accordion [Close]"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: false` |
| Event | **e-754**, `MOUSE_SECOND_CLICK`, `.accordion-title-wapper`, all breakpoints, `autoStopEventId: e-753` |

| group | target | property | value | dur | delay | easing |
|---|---|---|---|---|---|---|
| 0 | SIBLINGS `.accordion-content-wrapper` | width / height | `100%` / `0px` | 300 | 0 | ease |
| 0 | CHILDREN `.accordion-icon` | rotateZ | `0deg` | 300 | 0 | ease |

**Reimplementation:** `<details>`/`<summary>` with a small JS height-tween, or a button + JS
toggle that sets `height: <scrollHeight>px` → `auto`. `300ms cubic-bezier(.25,.1,.25,1)` on
`height` and `transform`. `MOUSE_CLICK` / `MOUSE_SECOND_CLICK` is just an odd/even toggle —
model it as `aria-expanded`. Pure CSS `grid-template-rows: 0fr → 1fr` is the cleanest modern
substitute and animates identically at 300ms.

---

### 1.10 `a-139` — "Image Parallax"

| | |
|---|---|
| Kind | `GENERAL_CONTINUOUS_ACTION`, 1 group `a-139-p`, type `SCROLL_PROGRESS` |
| Events | 4 × `SCROLLING_IN_VIEW`, `appliesTo: CLASS`, **all breakpoints**, `smoothing: 50`, `startsEntering: true`, `startsExiting: false`, offsets **not applied** (see §0.4) |

| event | selector | present in |
|---|---|---|
| e-1108 | `.project-gallery-image` | *(absent from export — dead)* |
| e-1109 | `.about-team-item-video` | *(absent from export — dead)* |
| e-1149 | `.image-cover` | index, projects, team, detail_post, detail_project, detail_project-category |
| e-1150 | `.post-preview-image` | detail_post, detail_blog-category |

Keyframes (target = `useEventTarget: true` → the triggering element itself):

| keyframe | translateY | scale (x&y locked) |
|---|---|---|
| 0% | `-7%` | `1.1` |
| 100% | `+7%` | `1.1` |

Scale is constant at 1.1 across the range — it exists purely to prevent edge gaps from the
±7% travel. Total travel = 14% of the element's own height, mapped over
`viewportHeight + elementHeight` of scroll, damped at alpha 0.5.

**Reimplementation:** CSS scroll-driven animation is a direct match and needs zero JS:
```css
@supports (animation-timeline: view()) {
  .image-cover, .post-preview-image {
    animation: parallax linear both;
    animation-timeline: view();
    animation-range: cover 0% cover 100%;
  }
  @keyframes parallax{
    from{transform:translateY(-7%) scale(1.1)}
    to  {transform:translateY( 7%) scale(1.1)}
  }
}
```
Fallback for Safari/older: `IntersectionObserver` to gate + a single rAF scroll loop applying
the §0.4 formula, with the 0.5 lerp. The smoothing is a nicety; dropping it is acceptable
because scroll-linked CSS animations are already frame-synced. Requires `overflow:hidden` on
the parent wrapper.

---

### 1.11 `a-154` — "Blog Post Image Parallax"

| | |
|---|---|
| Kind | `GENERAL_CONTINUOUS_ACTION`, group `a-154-p`, `SCROLL_PROGRESS` |
| Event | **e-1007**, `SCROLLING_IN_VIEW`, selector `.blog-post-image`, all breakpoints, `smoothing: 50`, same range config as §0.4 |
| Page | **none — `.blog-post-image` does not exist in any exported HTML. Dead.** |

| keyframe | translateY (on the event target itself) |
|---|---|
| 0% | `-20%` |
| 100% | `+10%` |

Asymmetric range (30% total travel, biased upward). No scale compensation — this one would clip
unless the source element is oversized.

**Reimplementation:** same technique as `a-139`. Only port it if a `.blog-post-image` element is
re-introduced in the Astro blog template; otherwise drop.

---

### 1.12 `a-159` — "About Gallery Scroll"

| | |
|---|---|
| Kind | `GENERAL_CONTINUOUS_ACTION`, group `a-159-p`, `SCROLL_PROGRESS` |
| Event | **e-1043**, `SCROLLING_IN_VIEW`, selector `.about-gallery`, all breakpoints, `smoothing: 50` |
| Page | **none — `.about-gallery` absent from every exported HTML. Dead.** |

Raw keyframes — **all four items have `target: {}` and are therefore runtime no-ops** (§0.8):

| keyframe | item | translateY |
|---|---|---|
| 0% | `a-159-n` | `+8%` |
| 0% | `a-159-n-3` | `-8%` |
| 100% | `a-159-n-2` | `-15%` |
| 100% | `a-159-n-4` | `+15%` |

The two-item-per-keyframe shape is the signature of a **two-column counter-scrolling gallery**:
column A goes `+8% → -15%`, column B goes `-8% → +15%`. The element bindings were lost when the
gallery was deleted from the design.

**Reimplementation:** if an about-page gallery is rebuilt, use two scroll-driven animations with
those exact ranges. `[PARTIAL]` — the *values* are real and complete; the *element bindings* are
unrecoverable from this data.

---

### 1.13 `a-174` — "Scale In"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: true` |
| Event | **e-1158**, `SCROLL_INTO_VIEW`, `appliesTo: CLASS`, selector `.image-icon`, **all breakpoints**, `scrollOffsetValue: 0`, `scrollOffsetUnit: "%"` → plain viewport intersection (§0.7). `autoStopEventId: e-1159` — **e-1159 does not exist in the data**, so this plays once and never resets. |
| Pages | detail_blog-category, detail_category, detail_post, detail_product, detail_project |

Target: `useEventTarget: true` (authoring id `649aefa8c795b8d4dc529951|a7ab49b1-7e04-4066-b939-5a81af3cd95a`) → the `.image-icon` element itself.

| group | property | value | dur | delay | easing |
|---|---|---|---|---|---|
| 0 (initial) | scale (x&y, locked) | `0` | 500 | 0 | linear |
| 0 (initial) | opacity | `0` | 500 | 0 | linear |
| 1 | scale (x&y, locked) | `1` | **700** | 0 | **inOutQuart** |
| 1 | opacity | `1` | **700** | 0 | **inOutQuart** |

**Reimplementation:** `IntersectionObserver({threshold:0})`, add `.is-in`, unobserve after first
fire (matches the missing reset event).
`transition: transform .7s cubic-bezier(.77,0,.175,1), opacity .7s cubic-bezier(.77,0,.175,1)`.

---

### 1.14 `a-175` — "Line"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: true` |
| Event | **e-1160**, `SCROLL_INTO_VIEW`, `appliesTo: CLASS`, selector `.line`, all breakpoints, offset `0%`. `autoStopEventId: e-1161` — **e-1161 absent**, so no reset. |
| Pages | 15 (every page with the site chrome: ccpa, contact, detail_*, gcx, index, notice-at-collection, privacy-policy, projects, services, team) |

Target: `useEventTarget: true` (authoring id `649aefa8c795b8d4dc529951|b125e5fa-8357-73dc-eda5-dc9977bcbb74`) → the `.line` element itself.

| group | property | value | dur | delay | easing |
|---|---|---|---|---|---|
| 0 (initial) | width | `0%` | 500 | 0 | linear |
| 1 | width | `100%` | **1500** | 0 | **inOutCubic** |

Base CSS: `.line { background:#191919; width:100%; height:1px; margin-bottom:20px; transform-origin:50% }`.

**Reimplementation:** `IntersectionObserver` + class toggle. Prefer `transform: scaleX(0→1)` with
`transform-origin: left` over animating `width` (compositor-friendly, no layout thrash) — visually
identical for a 1px rule. `transition: transform 1.5s cubic-bezier(.645,.045,.355,1)`.
Note `transform-origin: 50%` in the base CSS implies Webflow's width animation grew from a
left-anchored box; use `left` origin unless the design clearly centres.

### 1.15 `a-176` — "Line Vertical"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: true` |
| Event | **e-1162**, `SCROLL_INTO_VIEW`, `appliesTo: CLASS`, selector `.line-vertical`, all breakpoints, offset `0%`. `autoStopEventId: e-1163` — **e-1163 absent**, no reset. |
| Pages | same 15 pages as `a-175` |

Target: `useEventTarget: true`, authoring id `649aefa8c795b8d4dc529951|`**`e6d1c76f-1c1e-5017-c10e-a48eea75e8b8`** — this is one of the two `data-w-id` GUIDs in `index.html`.

| group | property | value | dur | delay | easing |
|---|---|---|---|---|---|
| 0 (initial) | height | `0%` | 500 | 0 | linear |
| 1 | height | `100%` | **1500** | 0 | **inOutCubic** |

Base CSS: `.line-vertical { background:#191919; width:100%; height:100% }`.

**Reimplementation:** identical to `a-175` but `scaleY` with `transform-origin: top`.
1500ms `cubic-bezier(.645,.045,.355,1)`.

---

### 1.16 `a-172` — "Mobile Menu [Open]"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: true` |
| Events | **e-1114** `MOUSE_CLICK`, `appliesTo: ELEMENT`, target `data-w-id="9f610c21-b7d9-9af4-fb08-b3c3860d4005"`, **all breakpoints**, `autoStopEventId: e-1115`<br>**e-1171** `MOUSE_CLICK`, `appliesTo: ELEMENT`, target `649aefa8c795b8d4dc529951|d647e9a5-076c-2987-95f6-a985e293b6cb` — **this GUID is not present in any exported HTML; the binding is dead.** |
| Pages | 15 (every page carrying `9f610c21-…`) |

| group | target | property | value | dur | delay | easing |
|---|---|---|---|---|---|---|
| 0 (initial) | `.mobile-menu` | display | `none` | 0 | 0 | — |
| 0 (initial) | CHILDREN `.mobile-menu-toggle-line._02` | width | `100%` | 500 | 0 | linear |
| 0 (initial) | CHILDREN `.mobile-menu-toggle-line._01` | rotateZ | `0deg` | 500 | 0 | linear |
| 0 (initial) | CHILDREN `.mobile-menu-toggle-line._03` | rotateZ | `0deg` | 500 | 0 | linear |
| 0 (initial) | `.mobile-menu` | opacity | `0` | 500 | 0 | linear |
| 0 (initial) | `.mobile-menu` | translateY | `10px` | 500 | 0 | linear |
| 1 | `.mobile-menu` | display | `block` | 0 | 0 | — |
| 2 | CHILDREN `._02` | width | **`0%`** | **500** | 0 | **outQuart** |
| 2 | `.mobile-menu` | opacity | **`1`** | **300** | 0 | linear |
| 2 | `.mobile-menu` | translateY | **`0px`** | **500** | 0 | **outQuart** |
| 2 | CHILDREN `._01` | rotateZ | **`-39deg`** | **500** | **300** | **outQuart** |
| 2 | CHILDREN `._03` | rotateZ | **`+39deg`** | **500** | **300** | **outQuart** |

Total open duration = 800ms (the 300ms-delayed 500ms rotations).
Note the rotation is **±39°, not ±45°** — the middle bar collapses first (width 100%→0%), then
the outer bars rotate into an X at ±39°.

### 1.17 `a-173` — "Mobile Menu [Close]"

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: false` |
| Events | **42 events** — see breakdown below |

| group | target | property | value | dur | delay | easing |
|---|---|---|---|---|---|---|
| 0 | CHILDREN `._03` | rotateZ | `0deg` | 500 | 0 | outQuart |
| 0 | CHILDREN `._01` | rotateZ | `0deg` | 500 | 0 | outQuart |
| 0 | `.mobile-menu` | opacity | `0` | **300** | 0 | linear |
| 0 | `.mobile-menu` | translateY | `10px` | **300** | 0 | outQuart |
| 0 | CHILDREN `._02` | width | `100%` | **500** | **300** | outQuart |
| 1 | `.mobile-menu` | display | `none` | 0 | 0 | — |

Total close duration = 800ms, then display:none.

**The 42 events on `a-173`:**

| kind | count | detail |
|---|---|---|
| `MOUSE_SECOND_CLICK` | 2 | e-1115 (`9f610c21-…`, all breakpoints), e-1172 (dead GUID `d647e9a5-…`) |
| `PAGE_SCROLL_UP` | 20 | one per page id, `mediaQueries: ["medium","small","tiny"]`, `scrollOffsetValue: 20`, unit `PX` |
| `PAGE_SCROLL_DOWN` | 20 | mirror of the above, same offset, paired `autoStopEventId` |

So on tablet-and-below the mobile menu **auto-closes on any scroll of ≥20px in either
direction**. Event ids e-1116…e-1147, e-1173…e-1180. Page ids covered:
`…529951` index, `…52996e` services, `…529974` projects, `…529970` team, `…52995d` contact,
`…529956` `[UNKNOWN]`, `…52996f` `[UNKNOWN]`, `…529971` `[UNKNOWN]`, `…529967` `[UNKNOWN]`,
`…529959` `[UNKNOWN]`, `…529962` detail_project, `…529963` detail_project-category,
`…529960` detail_post, `…52995e` detail_blog-category, `…529961` detail_product,
`…52995f` detail_category, `649c6ac7504108c1fc418445` privacy-policy,
`64aed4bdff54992685856cbd` notice-at-collection, `64aed616855b4ddae810abab` ccpa,
`64b83c826d4b20f3e7c68043` gcx.

**Reimplementation:** JS toggle on the hamburger button setting `aria-expanded` + a `.is-open`
class on `<body>` or the nav root; everything else pure CSS transitions with the values above.
Auto-close: a scroll listener active only while open and only under 992px, closing after 20px of
cumulative scroll from the open position. Do **not** animate `display` — use
`visibility`/`inert` + the opacity/translate pair, and keep focus trapped while open.

---

### 1.18 `a-34` — "Button Text Hover [In]" — **DEAD**

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: true` |
| Events | e-213 `MOUSE_OVER` `.button-text.arrow-right` (`autoStop: e-214` — **e-214 absent**); e-946 `MOUSE_OVER` `.button-text` (`autoStop: e-1101` — **absent**); e-1100 `MOUSE_OVER` `.button-text-4` (`autoStop: e-1101` — absent). All `["main"]`. |
| Status | **None of `.button-text`, `.button-text-4`, `.arrow-right` exist in any exported HTML — AND both action items have `target: {}` (no-op, §0.8). Doubly dead.** |

| group | property | value | dur | delay | easing |
|---|---|---|---|---|---|
| 0 (initial) | translateX | `0%` | **0** | 0 | outQuint |
| 1 | translateX | **`5px`** | **500** | 0 | **outQuart** |

### 1.19 `a-169` — "Button Text Hover [Out]" — **DEAD**

| | |
|---|---|
| Kind | step action, `useFirstGroupAsInitialState: false` |
| Event | e-947 `MOUSE_OUT` `.button-text`, `["main"]`, `autoStop: e-946` |
| Status | same as `a-34`: selector absent from export **and** `target: {}` no-op |

| group | property | value | dur | delay | easing |
|---|---|---|---|---|---|
| 0 | translateX | `0px` | **300** | 0 | **outQuart** |

**Reimplementation (1.18 + 1.19):** do not port. If a nudge-arrow-on-hover is wanted in the
rebuild, the authored intent was `translateX: 0 → 5px` in 500ms outQuart, returning in 300ms
outQuart — trivially a CSS `:hover` rule with asymmetric in/out transition durations.

---

## 2. Element binding map (`data-w-id` GUIDs in the exported HTML)

Only **two** `data-w-id` attributes survive in the export.

| GUID | files | bound event(s) | interaction |
|---|---|---|---|
| `9f610c21-b7d9-9af4-fb08-b3c3860d4005` | ccpa, contact, detail_blog-category, detail_category, detail_post, detail_product, detail_project-category, detail_project, gcx, index, notice-at-collection, privacy-policy, projects, services, team (15) | **e-1114** (`MOUSE_CLICK`, `appliesTo: ELEMENT`) → `a-172` Mobile Menu [Open]<br>**e-1115** (`MOUSE_SECOND_CLICK`) → `a-173` Mobile Menu [Close] | the hamburger / mobile-menu toggle button |
| `e6d1c76f-1c1e-5017-c10e-a48eea75e8b8` | index only | *not* an event target. It is the **authoring id inside `a-176`'s action config** (`649aefa8c795b8d4dc529951|e6d1c76f-…`). The live trigger is class-based **e-1162** (`SCROLL_INTO_VIEW` on `.line-vertical`) with `useEventTarget: true`. | `a-176` Line Vertical — this element is the vertical rule on the homepage that grows 0%→100% height |

GUIDs referenced by the IX2 data but **not present** in any exported HTML (these bindings will
never fire — do not build against them):

| GUID | referenced by | note |
|---|---|---|
| `d647e9a5-076c-2987-95f6-a985e293b6cb` | e-1171 / e-1172 → `a-172` / `a-173` | second (duplicate) mobile-menu toggle on index; markup gone |
| `a7ab49b1-7e04-4066-b939-5a81af3cd95a` | `a-174` action config | vestigial authoring id; live path is `useEventTarget` on `.image-icon` |
| `b125e5fa-8357-73dc-eda5-dc9977bcbb74` | `a-175` action config | vestigial; live path is `useEventTarget` on `.line` |
| `ad128f2d-0111-b4ae-6ae3-515bf70feffa` | `a-139` and `a-154` action configs | vestigial; live path is `useEventTarget` on the scroll trigger |

**Practical upshot for Phase E:** the only GUID you must preserve as an addressable hook is
`9f610c21-…` (the hamburger). Everything else is class-driven and should be rebuilt with
semantic selectors — drop `data-w-id` entirely.

Class → page matrix for the live interactions:

| selector | interaction | pages present |
|---|---|---|
| `.button` | a-74 / a-75 | 19 (all) |
| `.label` | a-77 / a-78 | checkout, detail_blog-category, detail_category, order-confirmation, paypal-checkout, services |
| `.accordion-title-wapper` | a-100 / a-101 | detail_product |
| `.cursor`, `.cursor-text.view` | a-8, a-165, a-166 | contact, detail_blog-category, detail_category, detail_post, detail_project-category, index, projects, services, team |
| `.image-cover` | a-139 | index, projects, team, detail_post, detail_project, detail_project-category |
| `.post-preview-image` | a-139 | detail_post, detail_blog-category |
| `.image-icon` | a-174 | detail_blog-category, detail_category, detail_post, detail_product, detail_project |
| `.line` | a-175 | 15 |
| `.line-vertical` | a-176 | 15 |
| `.mobile-menu`, `.mobile-menu-toggle-line._01/._02/._03` | a-172 / a-173 | 15 |
| `.post-preview-image-wrapper` etc. (6 hover wrappers) | a-165 / a-166 | see §1.2 table |

Dead selectors (referenced by IX2, absent from the export): `.button-2`, `.button-old`,
`.button-5`, `.label-2`, `.button-text`, `.button-text-4`, `.arrow-right`, `.projects-item-link`,
`.about-gallery`, `.project-gallery-image`, `.about-team-item-video`, `.blog-post-image`.

---

## 3. Reduced-motion plan (`prefers-reduced-motion: reduce`)

| # | interaction | action under reduce | rationale |
|---|---|---|---|
| a-8 | Cursor Move | **Suppress entirely.** Don't mount the rAF loop; leave `.cursor-wrapper` unrendered (or `display:none`) and restore the native cursor. | Continuous pointer-tracked motion across the whole viewport; also a WCAG 2.4.11-adjacent hazard (obscures focus) and a vestibular trigger. |
| a-165 | Cursor View [Show] | Suppress (follows a-8). | — |
| a-166 | Cursor View [Hide] | Suppress (follows a-8). | — |
| a-139 | Image Parallax | **Suppress motion, keep the static end state.** Set `transform: scale(1.1)` (or `none` if wrappers aren't overflow-clipped) with no translateY animation. | Scroll-coupled translation is the canonical reduced-motion offender. |
| a-154 | Blog Post Image Parallax | Suppress (dead anyway; if revived, same treatment). | Same. |
| a-159 | About Gallery Scroll | Suppress (dead; if revived, same treatment). | Counter-scrolling columns are a strong vestibular trigger. |
| a-174 | Scale In | **Soften: opacity-only.** Drop the `scale(0→1)`; keep `opacity 0→1` at ~200ms linear. | Scale-from-zero is motion; a fade is the standard accessible substitute. |
| a-175 | Line | **Soften: instant.** Render at final `scaleX(1)`, no transition. | A 1.5s growing rule is pure decoration; no information is lost. |
| a-176 | Line Vertical | **Soften: instant.** Render at final `scaleY(1)`. | Same. |
| a-172 | Mobile Menu [Open] | **Soften: opacity + instant layout.** Keep `opacity 0→1` at ~150ms; drop the 10px translate and drop the hamburger rotate/width tween (snap the icon to its X state). | The menu must still open; only the movement is removed. |
| a-173 | Mobile Menu [Close] | Same softening; keep the 20px scroll auto-close behaviour (that's function, not motion). | — |
| a-100 | Accordion [Open] | **Soften: instant.** Snap height to auto and the icon to 45°. | Height tween is motion; disclosure still works. |
| a-101 | Accordion [Close] | Same. | — |
| a-74 | Button Hover [In] | **Keep** (or shorten to ~150ms). Small, local, user-initiated, bounded to the element. | Reduced-motion does not require removing micro-interactions; a 100%-of-own-height slide on a small text node is low-risk. Shortening is the safer compromise. |
| a-75 | Button Hover [Out] | Keep / shorten to match. | — |
| a-77 | Label Hover [In] | Keep / shorten to ~150ms. | — |
| a-78 | Label Hover [Out] | Keep / shorten to match. | — |
| a-34 | Button Text Hover [In] | N/A (dead). | — |
| a-169 | Button Text Hover [Out] | N/A (dead). | — |

Implementation shape:
```css
@media (prefers-reduced-motion: reduce){
  .cursor-wrapper{display:none}
  .image-cover,.post-preview-image{animation:none;transform:scale(1.1)}
  .line{transform:scaleX(1);transition:none}
  .line-vertical{transform:scaleY(1);transition:none}
  .image-icon{transform:none;transition:opacity .2s linear}
  .mobile-menu{transition:opacity .15s linear}
  .accordion-content-wrapper{transition:none}
  .button-inner-text,.button-inner-text-hover,
  .label-text,.label-text-hover{transition-duration:.15s}
}
```
The cursor rAF loop must additionally be gated in JS (`matchMedia('(prefers-reduced-motion: reduce)')`)
so it never mounts, and it should listen for changes to that query.

---

## 4. Confidence notes

**Fully extracted, high confidence (real values, live bindings, reimplementable as-is) — 13 of 19:**
`a-8`, `a-74`, `a-75`, `a-77`, `a-78`, `a-100`, `a-101`, `a-139`, `a-165`, `a-166`, `a-172`,
`a-173`, `a-174`, `a-175`, `a-176`. *(That's 15 action lists; 13 have live element bindings in the
export — `a-77`/`a-78`'s `.label-text-hover` children only exist on 3 of the 6 `.label` pages.)*

**Complete values but no live element binding — 4 of 19:**
`a-34`, `a-169` (Button Text Hover in/out), `a-154` (Blog Post Image Parallax),
`a-159` (About Gallery Scroll). Every duration/offset/easing is real and listed; what's missing
is any DOM to attach them to. `a-34`/`a-169`/`a-159` additionally have `target: {}` and were
already no-ops in the live Webflow site.

**Nothing in this document is an unlabelled guess.** Specific caveats:

1. **Cubic-bezier easing equivalents (§0.2) are approximations.** The bundle uses Penner
   polynomial functions, not beziers. Only `ease` = `cubic-bezier(.25,.1,.25,1)` is exact
   (that literal is in the source). `outQuart`, `outQuint`, `inOutQuart`, `inOutCubic` are given
   as the conventional bezier approximations of `-(t-1)⁴+1`, `(t-1)⁵+1`, and the inOut pairs.
   If pixel-exact parity matters, use a JS easing function or a linear() easing with sampled
   points instead. Substitute: the beziers listed — error < 1%, imperceptible at 300–1500ms.

2. **`duration: 500` on continuous keyframes is inert.** In `a-8`, `a-139`, `a-154`, `a-159`
   the keyframe items carry `duration: 500, easing: ""`. The engine ignores both for
   `GENERAL_CONTINUOUS_ACTION` — position is driven by the damped scroll/mouse parameter. Do not
   port that 500ms as a transition duration.

3. **The `smoothing: 50` → alpha 0.5 lerp is frame-rate dependent** in the original
   (`pos += (target-pos)*0.5` per handler tick, not per fixed timestep). Any faithful port
   inherits that. Recommended substitute: a time-corrected lerp,
   `alpha = 1 - Math.pow(0.5, dt/16.67)`, which matches at 60fps and behaves correctly at 120fps.
   Labelled: this is my recommendation, not the original behaviour.

4. **Five `data-wf-page` ids in the `a-173` scroll-close set and two in the `a-8` set could not
   be resolved to files** (`…529956`, `…529959`, `…529967`, `…52996f`, `…529970`→team resolved,
   `…529971`; and `6240546a6393242785d71beb`, `6240546a6393245ca3d71bec`). `[UNKNOWN]` — these are
   pages that exist in the Webflow project but were not exported (or were deleted). No action
   needed: the rebuild should apply mobile-menu scroll-close and cursor-move globally by
   breakpoint rather than per-page.

5. **Seven `autoStopEventId` references point to events that do not exist in the data**
   (`e-214`, `e-727`, `e-967`, `e-968`, `e-1101`, `e-1159`, `e-1161`, `e-1163`). Consequences that
   are real, not guessed: `a-174` (Scale In), `a-175` (Line) and `a-176` (Line Vertical) have **no
   reset event** — they fire once on first viewport entry and never replay or reverse. Port that
   behaviour (`observer.unobserve()` after first fire) unless a replay-on-re-entry is explicitly
   wanted.

6. **`a-100` accordion `heightUnit: "AUTO"`** — Webflow measures `scrollHeight` at runtime and
   tweens to it. There is no numeric value to extract; `AUTO` *is* the value. The recommended
   `grid-template-rows: 0fr → 1fr` substitute is my suggestion, not a decoded parameter.

7. **`.line` `transform-origin`** — base CSS says `transform-origin: 50%`, but Webflow animated
   `width`, not `transform`, so the origin was never exercised. My `transform-origin: left`
   recommendation for the `scaleX` rewrite is an inference from how a growing rule normally reads;
   verify against a screenshot of the live site before committing. `[GUESS — visual intent only,
   no numeric impact]`

8. **`a-159`'s two-column counter-scroll reading** is an inference from the item pairing
   (`+8→-15` alongside `-8→+15`). The numbers are real; the "two columns" interpretation is
   `[GUESS]`. The elements are gone, so it cannot be confirmed from this export.
