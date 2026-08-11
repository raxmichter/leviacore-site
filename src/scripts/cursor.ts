/**
 * Custom cursor — Webflow `a-8` (Cursor Move) + `a-165`/`a-166` (Cursor View Show/Hide).
 * Spec: build-context/interactions.md §1.1–1.3. Every number below is extracted, not estimated.
 *
 * ── Why the whole transform is written from JS ────────────────────────────────────────
 * `a-8` drives `translate` from a damped pointer parameter on every frame; `a-165`/`a-166`
 * tween `scale` 0↔1 over 500ms. Both write `transform`. Splitting them — rAF owning the
 * translate, a CSS class owning the scale — means each write clobbers the other and the
 * cursor either stops following or never appears. interactions.md flags this as the hardest
 * part of Phase E. Resolution taken here: **one writer.** The scale tween is integrated in
 * the same rAF loop as the translate and the two are composed into a single transform
 * string. No CSS transition touches `.cursor`'s transform at all.
 *
 * A bonus of tweening scale in JS: the easing is the *exact* Penner `outQuart`
 * (`1 - (1-t)^4`) from the Webflow bundle, not the `cubic-bezier(.165,.84,.44,1)`
 * approximation interactions.md §0.2 labels as approximate.
 *
 * ── Gates ────────────────────────────────────────────────────────────────────────────
 * `≥992px` (IX2 `mediaQueries: ["main"]`), `pointer: fine`, and no reduced-motion
 * preference. All three live in one media query re-evaluated on change, so plugging in a
 * mouse or toggling the OS setting mid-session mounts/unmounts rather than sticking.
 *
 * ── Deliberate fidelity details preserved ────────────────────────────────────────────
 * - `a-166` (Hide) scales to 0 but does **not** restore `display:none` and does **not**
 *   re-hide `.cursor-text.view`. interactions.md §1.3 calls this out; it is reproduced.
 * - `restingState: 50` → both pointer parameters start dead-centre (0.5), i.e. the cursor
 *   rests at viewport centre until the first pointer event.
 * - The native cursor is never hidden: the source CSS has no `cursor: none`, so the
 *   follower is additive.
 */
import { onPage, whenMatches, NO_REDUCED_MOTION, type Teardown } from './lifecycle'

/**
 * The six `a-165`/`a-166` trigger selectors reduce to one in the rebuild.
 * Source: `.project-preview-image-wrapper` (index) and `.work-projects-item-image-wrapper`
 * (projects) — interactions.md §1.2. Both are the case-study cover-image link, which
 * Phase C1 unified into `ProjectCard`'s `.project-card-image-wrapper`. The other four
 * source selectors belong to blog/shop templates that are not migrated.
 */
const HOVER_SELECTOR = '.project-card-image-wrapper'

/** `a-165` group 2 / `a-166` group 0 — scale tween duration, exact. */
const SCALE_DURATION = 500

/** Exact Penner `outQuart` from the IX2 bundle: `-(pow(t-1,4)-1)`. */
const outQuart = (t: number) => 1 - Math.pow(1 - t, 4)

function mount(): Teardown {
  const cursor = document.querySelector<HTMLElement>('.cursor-wrapper .cursor')
  if (!cursor) return () => {}
  const viewText = cursor.querySelector<HTMLElement>('.cursor-text.view')

  // ── a-165 group 0 (useFirstGroupAsInitialState) — stamped at load ──
  let scale = 0
  let scaleFrom = 0
  let scaleTo = 0
  let scaleStart = 0
  cursor.style.display = 'none'
  if (viewText) viewText.style.display = 'none'

  // Pointer parameters, §0.6: paramX = min(clientX, innerWidth) / innerWidth.
  // Damped position (`pos`) and raw target (`want`) are both kept in 0..1 parameter space
  // so a window resize needs no correction — the pixel conversion happens per frame.
  let posX = 0.5
  let posY = 0.5
  let wantX = 0.5
  let wantY = 0.5

  let raf = 0
  let last = 0

  const write = () => {
    const x = (posX - 0.5) * window.innerWidth
    const y = (posY - 0.5) * window.innerHeight
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
  }

  /** Live while the cursor is visible or still tweening out. */
  const isAwake = () => scaleTo > 0 || scale !== scaleTo

  const tick = (now: number) => {
    const dt = last ? Math.min(now - last, 100) : 1000 / 60
    last = now

    // interactions.md §3 note 3 — DELIBERATE SUBSTITUTE, not decoded behaviour.
    // The original does `pos += (target - pos) * 0.5` once per handler tick (smoothing: 50
    // → alpha 0.5, §0.5), which is frame-rate dependent: it converges twice as fast on a
    // 144Hz display. The time-corrected form below is identical at 60Hz and correct above it.
    const alpha = 1 - Math.pow(0.5, dt / 16.67)
    posX += (wantX - posX) * alpha
    posY += (wantY - posY) * alpha

    if (scale !== scaleTo) {
      const t = Math.min((now - scaleStart) / SCALE_DURATION, 1)
      scale = t >= 1 ? scaleTo : scaleFrom + (scaleTo - scaleFrom) * outQuart(t)
    }

    write()

    if (isAwake()) {
      raf = requestAnimationFrame(tick)
    } else {
      raf = 0
      last = 0
    }
  }

  const wake = () => {
    if (!raf) {
      last = 0
      raf = requestAnimationFrame(tick)
    }
  }

  const onMove = (event: PointerEvent) => {
    wantX = Math.min(event.clientX, window.innerWidth) / window.innerWidth
    wantY = Math.min(event.clientY, window.innerHeight) / window.innerHeight
    // While the cursor is scaled to 0 the loop is parked, so keep the damped position
    // pinned to the pointer. Invisible either way, and it means the show tween starts
    // from under the pointer rather than easing in from wherever the pointer last was.
    if (!raf) {
      posX = wantX
      posY = wantY
    }
  }

  const tweenScale = (to: number) => {
    scaleFrom = scale
    scaleTo = to
    scaleStart = performance.now()
    wake()
  }

  // a-165 group 1 is instantaneous, group 2 is the 500ms outQuart scale-in.
  const show = () => {
    cursor.style.display = 'flex'
    if (viewText) viewText.style.display = 'block'
    tweenScale(1)
  }
  // a-166: scale only — display and `.cursor-text.view` are intentionally NOT reset.
  const hide = () => tweenScale(0)

  const triggers = Array.from(document.querySelectorAll<HTMLElement>(HOVER_SELECTOR))
  for (const trigger of triggers) {
    trigger.addEventListener('pointerenter', show)
    trigger.addEventListener('pointerleave', hide)
    trigger.addEventListener('pointercancel', hide)
  }
  document.addEventListener('pointermove', onMove, { passive: true })

  return () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    document.removeEventListener('pointermove', onMove)
    for (const trigger of triggers) {
      trigger.removeEventListener('pointerenter', show)
      trigger.removeEventListener('pointerleave', hide)
      trigger.removeEventListener('pointercancel', hide)
    }
    // Back to the base stylesheet's resting state, so an unmount (reduced motion turned
    // on, window narrowed below 992px) leaves nothing on screen.
    cursor.style.display = 'none'
    cursor.style.transform = ''
    if (viewText) viewText.style.display = ''
  }
}

onPage('cursor', () =>
  whenMatches(`(min-width: 992px) and (pointer: fine) and ${NO_REDUCED_MOTION}`, mount)
)
