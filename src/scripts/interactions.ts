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
 * is deliberately NOT here — it ships on five pages only and is wired per-page.
 *
 * ── Everything is written as inline style, not CSS ────────────────────────────────────
 * The elements involved are styled by four different components' scoped `<style>` blocks
 * (`Divider`, `SectionShell`, `SiteHeader`, `SiteFooter`, `MobileMenu`, `[slug].astro`), so
 * there is no single stylesheet these rules could live in that this phase owns. Driving the
 * initial and final states from JS keeps the whole feature in one file, wins the cascade
 * unconditionally, and mirrors what Webflow itself did (`useFirstGroupAsInitialState`
 * stamps group 0 onto the DOM at load from JS — it was never CSS on the live site either).
 *
 * ── Fire-once is a requirement, not an optimisation ───────────────────────────────────
 * interactions.md §4 note 5: all three reveals carry an `autoStopEventId` pointing at an
 * event that does not exist in the IX2 data, so on the live site they play once on first
 * scroll-in and never replay or reverse. `observer.unobserve()` after the first fire
 * reproduces that. A re-triggering observer would be a visible regression.
 */
import { onPage, whenMatches, NO_REDUCED_MOTION, type Teardown } from './lifecycle'

/* ────────────────────────────── Scroll reveals ────────────────────────────── */

interface RevealVariant {
  from: string
  to: string
  transition: string
  /** `a-174` is the only reveal that animates opacity; `a-175`/`a-176` animate size alone. */
  fade: boolean
}

interface Reveal extends RevealVariant {
  selector: string
  origin: string
  /** Softened form used under `prefers-reduced-motion: reduce`; `null` = don't animate at all. */
  reduced: RevealVariant | null
}

/**
 * `.line` / `.line-vertical`: the source animated `width`/`height` 0%→100% over 1500ms
 * inOutCubic. Ported as `scaleX`/`scaleY` — visually identical for a 1px rule, but
 * compositor-only, so 15 simultaneous reveals cost no layout. interactions.md §4 note 7
 * flags `transform-origin: left` / `top` as an inference from the base CSS's unexercised
 * `transform-origin: 50%`; it is the only reading under which a growing rule looks right.
 *
 * `1500` / `700` and `cubic-bezier(.645,.045,.355,1)` (inOutCubic) /
 * `cubic-bezier(.77,0,.175,1)` (inOutQuart) are exact durations with the APPROXIMATE bezier
 * equivalents interactions.md §0.2 labels as such — Webflow uses Penner polynomials, and the
 * bezier error is <1% of travel.
 */
const REVEALS: Reveal[] = [
  {
    selector: '.line',
    origin: 'left center',
    from: 'scaleX(0)',
    to: 'scaleX(1)',
    transition: 'transform 1.5s cubic-bezier(.645,.045,.355,1)',
    fade: false,
    // §3: "Soften: instant." A 1.5s growing rule is pure decoration.
    reduced: null,
  },
  {
    selector: '.line-vertical',
    origin: 'center top',
    from: 'scaleY(0)',
    to: 'scaleY(1)',
    transition: 'transform 1.5s cubic-bezier(.645,.045,.355,1)',
    fade: false,
    reduced: null,
  },
  {
    /**
     * `a-174` Scale In. The source selector `.image-icon` does not exist in the rebuild.
     * Resolved from the captured live case study (`_case-study-source/pages/spiritfarer.html`):
     * `.image-icon` is the decorative `icon-02.svg` sitting inside `.cta-contact-grid-left`,
     * directly after the "It's time to find your fandom" heading, in the closing CTA of the
     * case-study template. `[slug].astro` renders exactly that element — same asset, same
     * position, same parent — as `.cta-icon`. That class exists nowhere else in the repo, so
     * this stays scoped to the case-study pages as in the source (the static pages' own
     * ContactCTA block carries no icon and never fired this interaction).
     */
    selector: '.cta-icon',
    origin: 'center center',
    from: 'scale(0)',
    to: 'scale(1)',
    transition: 'transform .7s cubic-bezier(.77,0,.175,1), opacity .7s cubic-bezier(.77,0,.175,1)',
    fade: true,
    // §3: "Soften: opacity-only." Scale-from-zero is motion; a fade is the accessible substitute.
    reduced: { from: 'none', to: 'none', transition: 'opacity .2s linear', fade: true },
  },
]

function mountReveals(): Teardown {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const observers: IntersectionObserver[] = []
  const restore: Array<() => void> = []
  let cancelled = false

  for (const reveal of REVEALS) {
    const variant = reduce ? reveal.reduced : reveal
    if (!variant) continue

    const elements = Array.from(document.querySelectorAll<HTMLElement>(reveal.selector)).filter(
      // Not rendered right now — the `.line` separators inside the closed mobile menu, and
      // the `hide-tablet` / `show-tablet` divider pairs at the wrong breakpoint. An
      // IntersectionObserver on a zero-box element is unreliable, and stamping scale(0) onto
      // one risks it staying invisible when it does become visible. Leaving them untouched
      // means they render normally, minus a decorative reveal they could not have shown anyway.
      (element) => element.getClientRects().length > 0
    )
    if (elements.length === 0) continue

    for (const element of elements) {
      element.style.transformOrigin = reveal.origin
      element.style.transform = variant.from
      if (variant.fade) element.style.opacity = '0'
      element.style.transition = variant.transition
      restore.push(() => {
        element.style.transformOrigin = ''
        element.style.transform = ''
        element.style.opacity = ''
        element.style.transition = ''
      })
    }

    // §0.7: `scrollOffsetValue: 0` resolves to plain viewport intersection —
    // `threshold: 0`, no rootMargin.
    const observer = new IntersectionObserver(
      (entries, self) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const element = entry.target as HTMLElement
          element.style.transform = variant.to
          if (variant.fade) element.style.opacity = '1'
          self.unobserve(element) // fire-once — see file header
        }
      },
      { threshold: 0 }
    )
    observers.push(observer)

    // One frame between stamping the initial state and observing, so the browser has a
    // recalculated style to transition *from* for elements already in the viewport at load.
    requestAnimationFrame(() => {
      if (cancelled) return
      for (const element of elements) observer.observe(element)
    })
  }

  return () => {
    cancelled = true
    for (const observer of observers) observer.disconnect()
    for (const undo of restore) undo()
  }
}

/* ────────────────────────────── Image parallax ────────────────────────────── */

/**
 * `a-139`. Source selectors `.image-cover` (index, projects, team, detail_project) and
 * `.post-preview-image` (blog templates only, shipped disabled — not emitted, so not bound).
 * `.image-cover` survives verbatim into the rebuild: the homepage hero, every `ProjectCard`
 * cover, every `TeamMemberCard` headshot, the `ValuesList` portrait, and the case-study hero
 * and gallery images. Every one of those wrappers already has `overflow: hidden`, which this
 * effect requires — no layout change was needed.
 */
const PARALLAX_SELECTOR = '.image-cover'
const PARALLAX_FROM = 'translateY(-7%) scale(1.1)'
const PARALLAX_TO = 'translateY(7%) scale(1.1)'

/**
 * Two implementations, chosen at runtime.
 *
 * Preferred: a native scroll-driven animation via `ViewTimeline` + WAAPI. interactions.md
 * §0.4 proves Webflow's decoded progress formula is *exactly* `animation-timeline: view();
 * animation-range: cover 0% cover 100%`, so this is a direct translation, runs off the main
 * thread, and needs no scroll listener. It is driven from JS rather than CSS only because
 * this phase owns no stylesheet the rule could live in (see file header) — the semantics are
 * identical to the CSS form.
 *
 * Fallback (Safari <26, Firefox <144): one shared rAF loop over the elements currently in
 * view, applying the §0.4 formula with the §0.5 damping.
 *
 * The §0.5 smoothing is dropped on the native path. interactions.md §1.10 explicitly permits
 * this: scroll-driven animations are already frame-synced, so the damping has nothing to
 * smooth over.
 */
function mountParallax(): Teardown {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(PARALLAX_SELECTOR))
  if (elements.length === 0) return () => {}

  // `ViewTimeline` and the `rangeStart`/`rangeEnd` animation options are newer than the
  // TypeScript DOM lib this project builds against, hence the narrow local typings.
  type ViewTimelineCtor = new (options: { subject: Element; axis?: 'block' | 'inline' }) => AnimationTimeline
  const ViewTimelineImpl = (window as unknown as { ViewTimeline?: ViewTimelineCtor }).ViewTimeline

  if (ViewTimelineImpl) {
    const animations = elements.map((element) =>
      element.animate([{ transform: PARALLAX_FROM }, { transform: PARALLAX_TO }], {
        timeline: new ViewTimelineImpl({ subject: element, axis: 'block' }),
        rangeStart: 'cover 0%',
        rangeEnd: 'cover 100%',
        easing: 'linear',
        fill: 'both',
      } as unknown as KeyframeAnimationOptions)
    )
    return () => {
      for (const animation of animations) animation.cancel()
    }
  }

  const visible = new Set<HTMLElement>()
  const damped = new WeakMap<HTMLElement, number>()
  let raf = 0
  let last = 0

  const tick = (now: number) => {
    const dt = last ? Math.min(now - last, 100) : 1000 / 60
    last = now
    // Same time-corrected substitute as the cursor — see interactions.md §3 note 3.
    // The original's `pos += (target - pos) * 0.5` per tick is frame-rate dependent.
    const alpha = 1 - Math.pow(0.5, dt / 16.67)

    for (const element of visible) {
      const rect = element.getBoundingClientRect()
      // §0.4, decoded: progress = clamp(viewportHeight - rect.top, 0, U) / U,
      // where U = viewportHeight + rect.height.
      const span = window.innerHeight + rect.height
      const target = span > 0 ? Math.min(Math.max(window.innerHeight - rect.top, 0), span) / span : 0
      const previous = damped.get(element) ?? target
      const position = previous + (target - previous) * alpha
      damped.set(element, position)
      element.style.transform = `translateY(${(-7 + 14 * position).toFixed(3)}%) scale(1.1)`
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
 * phase is meant to prevent. They are also *softened*, not suppressed (§3), so a stale
 * reading costs at most one decorative transition. The cursor and the parallax, which are
 * suppressed and continuous, do watch for changes.
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
