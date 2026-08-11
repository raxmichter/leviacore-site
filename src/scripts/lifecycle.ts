/**
 * Shared lifecycle + media-gate plumbing for the Phase E interaction scripts.
 *
 * Two jobs, both about not leaking:
 *
 * 1. `onPage` — Astro `<script>` modules execute exactly once per document. Without
 *    `<ClientRouter>` that is also once per navigation, so a bare module body would be
 *    fine; *with* it, the module is never re-executed but the DOM it bound to is swapped
 *    out from under it. `onPage` therefore re-runs the feature on `astro:after-swap` and
 *    releases the previous instance on `astro:before-swap`. Both listeners are inert when
 *    view transitions aren't in use, so this costs nothing today and cannot rot later.
 *    The `started` guard makes double-import a no-op.
 *
 * 2. `whenMatches` — mounts a feature only while a media query matches and unmounts when
 *    it stops matching, so a mid-session change (resize, plugging in a mouse, flipping
 *    "reduce motion" in the OS) is honoured rather than frozen at page load. This is how
 *    `prefers-reduced-motion` is enforced for the cursor and the parallax: those two are
 *    *suppressed*, never merely shortened, and suppression has to be a JS gate because a
 *    CSS `animation: none` cannot stop a rAF loop.
 */

export type Teardown = () => void

const started = new Set<string>()

export function onPage(key: string, start: () => Teardown): void {
  if (started.has(key)) return
  started.add(key)

  let teardown: Teardown | null = null

  const run = () => {
    teardown?.()
    teardown = start()
  }
  const stop = () => {
    teardown?.()
    teardown = null
  }

  run()
  document.addEventListener('astro:before-swap', stop)
  document.addEventListener('astro:after-swap', run)
}

export function whenMatches(query: string, mount: () => Teardown): Teardown {
  const mq = window.matchMedia(query)
  let active: Teardown | null = null

  const sync = () => {
    if (mq.matches && !active) {
      active = mount()
    } else if (!mq.matches && active) {
      active()
      active = null
    }
  }

  mq.addEventListener('change', sync)
  sync()

  return () => {
    mq.removeEventListener('change', sync)
    active?.()
    active = null
  }
}

/**
 * Motion is suppressed unless the user has expressed no preference.
 * `no-preference` (rather than `not (prefers-reduced-motion: reduce)`) is used because the
 * negated form needs Media Queries Level 4 boolean syntax; a browser that fails to parse
 * it drops the whole query, and a dropped query on a compound gate silently changes which
 * branch mounts. `no-preference` degrades in the safe direction: no motion.
 */
export const NO_REDUCED_MOTION = '(prefers-reduced-motion: no-preference)'
