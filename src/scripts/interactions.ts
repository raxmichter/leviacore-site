/**
 * Site-wide scroll interactions — Phase E.
 *
 *   • `a-175` Line          (interactions.md §1.14)
 *   • `a-176` Line Vertical (§1.15)
 *   • `a-174` Scale In      (§1.13)
 *   • `a-139` Image Parallax (§1.10)
 *
 * Loaded once from `BaseLayout`, because `.line` / `.line-vertical` live in the header and
 * footer chrome and the source binds them on all 15 chrome-bearing pages. The custom cursor
 * is deliberately NOT here — it ships on five pages only and is wired per page.
 *
 * ── Everything is written as inline style, not CSS ────────────────────────────────────
 * The elements involved are styled by six different components' scoped `<style>` blocks
 * (`Divider`, `SectionShell`, `SiteHeader`, `SiteFooter`, `MobileMenu`, `[slug].astro`), so
 * there is no single stylesheet these rules could live in that this phase owns. Driving the
 * initial and final states from JS keeps the whole feature in one file, wins the cascade
 * unconditionally, and mirrors what Webflow itself did (`useFirstGroupAsInitialState`
 * stamps group 0 onto the DOM at load from JS — it was never CSS on the live site either).
 * It also degrades correctly: with JS off, every element renders at its final state.
 *
 * ── Fire-once is a requirement, not an optimisation ───────────────────────────────────
 * interactions.md §4 note 5: all three reveals carry an `autoStopEventId` pointing at an
 * event that does not exist in the IX2 data, so on the live site they play once on first
 * scroll-in and never replay or reverse. `observer.unobserve()` after the first fire
 * reproduces that. A re-triggering observer would be a visible regression.
 *
 * ── Why no reveal shrinks its own border box ──────────────────────────────────────────
 * An IntersectionObserver measures the target's *transformed* box. Stamping `scaleX(0)` on
 * a `.line` collapses that box to zero area before the observer ever sees it, and a
 * zero-area target is not reliably reported as intersecting — the reveal would arm itself
 * and then never fire, leaving the rule permanently invisible. So the initial states below
 * are chosen to leave the box intact: the rules clip rather than scale, and `Scale In` is
 * held by `opacity` at load and only scaled once it is already on screen.
 */
import { onPage, whenMatches, NO_REDUCED_MOTION, type Teardown } from './lifecycle'

/* ────────────────────────────── Scroll reveals ────────────────────────────── */

interface Reveal {
  selector: string
  /**
   * Style stamped at load. Must not change the element's border box — see the file header.
   * `null` means "don't animate this at all", used for the reduced-motion variants.
   */
  armed: Partial<CSSStyleDeclaration> | null
  /**
   * Style applied on first intersection, after `armed`'s frame has been flushed. Applied in
   * two beats: `hold` (if present) is stamped with transitions off and forced through a
   * style recalc, then `transition` + `release` play the animation.
   */
  hold?: Partial<CSSStyleDeclaration>
  transition: string
  release: Partial<CSSStyleDeclaration>
}

/**
 * Durations are exact (`1500` / `700`). The bezier equivalents of Webflow's Penner curves —
 * `cubic-bezier(.645,.045,.355,1)` for inOutCubic, `cubic-bezier(.77,0,.175,1)` for
 * inOutQuart — are APPROXIMATE, as interactions.md §0.2 labels them; error is <1% of travel.
 */
const LINE_EASE = 'cubic-bezier(.645,.045,.355,1)'
const SCALE_IN_EASE = 'cubic-bezier(.77,0,.175,1)'

function lineReveal(selector: string, closed: string): Reveal {
  return {
    selector,
    // The source animated `width` / `height` 0%→100%. A `clip-path` inset reproduces that
    // literally — the rule is a solid 1px block, so clipping it and growing it are visually
    // the same thing — while costing no layout and, unlike `scaleX`, leaving the border box
    // measurable for the observer. It also retires interactions.md §4 note 7, which flagged
    // `transform-origin: left` as a `[GUESS]`: an inset clipped from the trailing edge is
    // unambiguously a left- (resp. top-) anchored growth, with no origin to guess at.
    armed: { clipPath: closed },
    transition: `clip-path 1.5s ${LINE_EASE}`,
    release: { clipPath: 'inset(0 0 0 0)' },
  }
}

const REVEALS: Reveal[] = [
  // a-175 Line — §3: "Soften: instant" under reduced motion, hence `armed: null` there.
  lineReveal('.line', 'inset(0 100% 0 0)'),
  // a-176 Line Vertical
  lineReveal('.line-vertical', 'inset(0 0 100% 0)'),
  {
    /**
     * `a-174` Scale In. The source selector `.image-icon` does not exist in the rebuild.
     * Resolved from the captured live case study (`_case-study-source/pages/spiritfarer.html`):
     * `.image-icon` is the decorative `icon-02.svg` sitting inside `.cta-contact-grid-left`,
     * directly after the "It's time to find your fandom" heading, in the closing CTA of the
     * case-study template. `[slug].astro` renders exactly that element — same asset, same
     * position, same parent — as `.cta-icon`. That class exists nowhere else in the repo, so
     * this stays scoped to the case-study pages as in the source. The static pages' own
     * `ContactCTA` block carries no icon and never fired this interaction; `.image-icon`'s
     * other four pages are blog/shop templates that are not migrated.
     */
    selector: '.cta-icon',
    // Held by opacity alone at load: the box stays full-size so the observer can see it.
    armed: { opacity: '0' },
    // Once on screen and already invisible, collapse to scale(0) with transitions off — the
    // intermediate frame is never seen — then play both properties out together.
    hold: { transform: 'scale(0)', transition: 'none' },
    transition: `transform .7s ${SCALE_IN_EASE}, opacity .7s ${SCALE_IN_EASE}`,
    release: { transform: 'scale(1)', opacity: '1' },
  },
]

/** §3 softening: lines snap to their final state; Scale In drops to an opacity-only fade. */
const REVEALS_REDUCED: Reveal[] = [
  { ...REVEALS[0]!, armed: null },
  { ...REVEALS[1]!, armed: null },
  {
    ...REVEALS[2]!,
    hold: undefined,
    transition: 'opacity .2s linear',
    release: { opacity: '1' },
  },
]

const TOUCHED = ['clipPath', 'transform', 'transition', 'opacity'] as const

function mountReveals(): Teardown {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const reveals = reduce ? REVEALS_REDUCED : REVEALS
  const observers: IntersectionObserver[] = []
  const touched: HTMLElement[] = []

  for (const reveal of reveals) {
    if (!reveal.armed) continue

    const elements = Array.from(document.querySelectorAll<HTMLElement>(reveal.selector)).filter(
      // Not rendered right now — the `.line` separators inside the closed mobile menu, and
      // the `hide-tablet` / `show-tablet` divider pairs at the wrong breakpoint. An element
      // with no box never intersects, so arming it would leave it permanently hidden if it
      // later became visible. Leaving them untouched means they render normally, minus a
      // decorative reveal they could not have shown at this breakpoint anyway.
      (element) => element.getClientRects().length > 0
    )
    if (elements.length === 0) continue

    for (const element of elements) {
      Object.assign(element.style, reveal.armed)
      touched.push(element)
    }

    // §0.7: `scrollOffsetValue: 0` resolves to plain viewport intersection —
    // `threshold: 0`, no rootMargin.
    const observer = new IntersectionObserver(
      (entries, self) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const element = entry.target as HTMLElement
          if (reveal.hold) {
            Object.assign(element.style, reveal.hold)
            void element.offsetWidth // force the held state through a style recalc
          }
          element.style.transition = reveal.transition
          Object.assign(element.style, reveal.release)
          self.unobserve(element) // fire-once — see file header
        }
      },
      { threshold: 0 }
    )
    observers.push(observer)

    for (const element of elements) {
      element.style.transition = reveal.transition
      observer.observe(element)
    }
  }

  return () => {
    for (const observer of observers) observer.disconnect()
    for (const element of touched) {
      for (const property of TOUCHED) element.style[property] = ''
    }
  }
}

/* ────────────────────────────── Image parallax ────────────────────────────── */

/**
 * `a-139`. Source selectors `.image-cover` (index, projects, team, detail_project) and
 * `.post-preview-image` (blog templates only, shipped disabled — never emitted, so never
 * bound). `.image-cover` survives verbatim into the rebuild: the homepage hero, every
 * `ProjectCard` cover, every `TeamMemberCard` headshot, the `ValuesList` portrait, and the
 * case-study hero and gallery images. Every one of those already sits in a wrapper with
 * `overflow: hidden`, which this effect requires — no layout change was needed.
 */
const PARALLAX_SELECTOR = '.image-cover'

/**
 * ── Why rAF rather than a CSS scroll-driven animation ─────────────────────────────────
 * `animation-timeline: view()` is the textbook match here: interactions.md §0.4 proves
 * Webflow's decoded progress formula is exactly `view()` over `cover 0% → cover 100%`.
 * It does not work for these elements, and this was verified in-browser, not assumed.
 *
 * `view()` resolves its scroller to the *nearest ancestor scroll container*, and
 * `overflow: hidden` makes an element a scroll container. Every `.image-cover` in this
 * rebuild is inside an `overflow: hidden` wrapper — that clipping is what makes the effect
 * possible at all — so the timeline binds to the wrapper, which never scrolls, and freezes
 * at a constant progress. Measured on `/projects`: subject = the image gave
 * `timeline.source = .project-card-image-wrapper` and a stuck `currentTime` of 49.996%,
 * while subject = the wrapper gave `source = documentElement` and a live 22.18%.
 *
 * Retargeting the timeline to the parent works, but it makes the native path depend on an
 * unstated invariant — "the animated element's parent is the clipping wrapper" — that no
 * type or test enforces and that silently freezes the effect again if any component's
 * markup gains a level. The rAF loop below states the same dependency explicitly, in one
 * place, and additionally implements the §0.5 damping that the native path has to drop.
 *
 * It is gated to elements currently on screen and parks itself when none are, so the loop
 * is idle for most of a page's lifetime.
 */
const PARALLAX_TRAVEL = 7 // ±7% of the element's own height — exact
const PARALLAX_SCALE = 1.1 // constant across the range; exists only to hide the edge gap

function mountParallax(): Teardown {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(PARALLAX_SELECTOR))
  if (elements.length === 0) return () => {}

  // Progress is measured from the clipping wrapper, never from the image. The image carries
  // the transform, so its own getBoundingClientRect() reflects the translate already applied
  // and feeding that back into the next frame's progress is a feedback loop. The wrapper is
  // untransformed and shares the image's position and height.
  const frameOf = (element: HTMLElement) => element.parentElement ?? element

  const visible = new Set<HTMLElement>()
  const damped = new WeakMap<HTMLElement, number>()
  let raf = 0
  let last = 0

  const tick = (now: number) => {
    const dt = last ? Math.min(now - last, 100) : 1000 / 60
    last = now
    // Same time-corrected substitute as the cursor — interactions.md §3 note 3, labelled
    // there as a recommendation rather than decoded behaviour. The original's
    // `pos += (target - pos) * 0.5` per tick (smoothing: 50, §0.5) is frame-rate dependent;
    // this matches it at 60Hz and stays correct above it.
    const alpha = 1 - Math.pow(0.5, dt / 16.67)

    for (const element of visible) {
      const rect = frameOf(element).getBoundingClientRect()
      // §0.4, decoded: progress = clamp(viewportHeight - rect.top, 0, U) / U,
      // where U = viewportHeight + rect.height.
      const span = window.innerHeight + rect.height
      if (span <= 0) continue
      const target = Math.min(Math.max(window.innerHeight - rect.top, 0), span) / span
      const previous = damped.get(element) ?? target
      const position = previous + (target - previous) * alpha
      damped.set(element, position)
      const shift = -PARALLAX_TRAVEL + 2 * PARALLAX_TRAVEL * position
      element.style.transform = `translateY(${shift.toFixed(3)}%) scale(${PARALLAX_SCALE})`
    }

    raf = visible.size > 0 ? requestAnimationFrame(tick) : 0
    if (!raf) last = 0
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const element = entry.target as HTMLElement
      if (entry.isIntersecting) visible.add(element)
      else visible.delete(element)
    }
    if (visible.size > 0 && !raf) {
      last = 0
      raf = requestAnimationFrame(tick)
    }
  })
  // Observed on the image itself: its box is never zero (the transform only ever scales it
  // up by 1.1 and shifts it), so unlike the reveals there is nothing to work around here.
  // Only the *measurement* has to come from the untransformed wrapper.
  for (const element of elements) observer.observe(element)

  return () => {
    observer.disconnect()
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    visible.clear()
    for (const element of elements) element.style.transform = ''
  }
}

/* ────────────────────────────────── Wiring ────────────────────────────────── */

/**
 * Reveals read the reduced-motion preference once at mount rather than through
 * `whenMatches`. Deliberate: these are fire-once, so re-mounting them on a mid-session
 * preference change would replay a reveal that already played — the exact re-trigger this
 * phase exists to prevent. They are also *softened*, not suppressed (§3), so a stale reading
 * costs at most one decorative transition. The cursor and the parallax, which are suppressed
 * and continuous, do watch for changes.
 */
onPage('reveals', mountReveals)

/**
 * Parallax is SUPPRESSED under reduced motion, not shortened — scroll-coupled translation is
 * the canonical vestibular trigger, and §3 lists it as suppress. Because the gate is a
 * `whenMatches`, turning the preference on mid-session tears the loop down and clears the
 * inline transform, leaving the images at their untouched static size. interactions.md §3
 * offers `scale(1.1)` as the alternative static rest state; `none` is used instead so that
 * suppression is also a no-op on layout, per this phase's "motion only" constraint.
 */
onPage('parallax', () => whenMatches(NO_REDUCED_MOTION, mountParallax))
