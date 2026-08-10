/**
 * Site-wide feature flags.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE BLOG IS DISABLED ON PURPOSE. THIS IS NOT UNFINISHED WORK.
 *
 *  To enable it correctly, follow docs/enable-blog.md — do NOT simply flip the
 *  boolean below. One flag gates SIX things (nav link, footer link, /blog index
 *  route, /blog/<slug> routes, sitemap entries, RSS feed), and the doc includes
 *  the checklist that verifies all six.
 *
 *  Flipping this without checking the gates can publish crawlable, indexable
 *  /blog/* routes while the site still looks blog-free to a human — which is
 *  worse than not having built the blog at all.
 *
 *  Background: build-context/DECISIONS.md, entry "Blog is built and
 *  DELIBERATELY DISABLED".
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const features = {
  /** Master switch for all blog output. See docs/enable-blog.md before changing. */
  blog: false,
} as const

export type Features = typeof features
