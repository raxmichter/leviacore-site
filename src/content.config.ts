// Content collections config — Astro 7 content layer (glob loader + Zod schema).
//
// Three collections:
//   legal    — privacy-policy (CCPA + Notice at Collection retired 2026-08-12)
//   projects — the five case studies (Phase D1 template, D2 content)
//   blog     — built in Phase D3, SHIPPED DISABLED behind src/config.ts
//
// These schemas are the contract. A malformed or incomplete content file fails the
// build with a named error rather than publishing something broken — which is the
// whole reason content lives in git rather than a CMS.
//
// See build-context/OPEN.md item 5 for the link-audit spec the legal documents were
// converted against, and build-context/PROGRESS.md for phase scope.
import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    /** Document heading text — rendered as the page's single <h1>. Not necessarily
     * identical to the SEO <title>, which pages pass to BaseLayout verbatim from the
     * export's own <head> (notice-at-collection's <title> and <h1> genuinely differ
     * in the source: "Notice at Collection | Leviathan Core" vs. the on-page heading
     * "California Residents - Notice at Collection"). */
    title: z.string(),
    /** Meta description. Verbatim from the export's <head> — identical site tagline
     * copy reused across privacy-policy, ccpa, and notice-at-collection in the source. */
    description: z.string(),
    /** The document's own "last modified" / "effective date" date, surfaced as a visible
     * UI element separate from the body's own inline statement of the same date (which
     * stays as prose, untouched). Must come from the document's own stated date — never
     * derived from git history or the build date. Omitted where the document states no
     * date of its own (notice-at-collection). */
    lastUpdated: z.date().optional(),
    /** Short label matching the footer "Legal" nav link text, for potential future nav
     * generation. Optional per the C2a brief; included here since it costs nothing and
     * already exists verbatim in the footer component. */
    navLabel: z.string().optional(),
  }),
})

/**
 * Case studies — `/project/<slug>`.
 *
 * ⚠️ URL PARITY: the slug IS the live URL. `/project/warframe` must stay
 * `/project/warframe`. Slugs come from the Webflow CSV and must not be "tidied".
 * Note the singular `/project/` — that is what the live site serves.
 *
 * Schema per the migration plan §5, derived from the consistent shape of all five
 * live case studies: client, year, timeline, services, website, then Challenge /
 * Solution / Metrics, hero image, CTA.
 *
 * `year` is retained deliberately. Removing it was discussed and explicitly
 * deferred to the future redesign — do not drop it here.
 */
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      /** Project/game title, e.g. "Warframe". Renders as the page <h1>. */
      title: z.string(),
      /** Client company, e.g. "Digital Extremes". */
      client: z.string(),
      /** Campaign year. Kept per the plan; removal is deferred to the redesign. */
      year: z.number().int(),
      /** Free text as it appears on the live site, e.g. "2 Months". */
      timeline: z.string(),
      /** Service tags, e.g. ["Campaigns", "Consulting", "Finance", "Legal"]. */
      services: z.array(z.string()).min(1),
      /** External project/game site. Optional — not every case study has one. */
      website: z.string().url().optional(),
      /** Visible text for the website link. This is per-project CMS copy on the
       *  live site, NOT derived from the title — the five real values are
       *  "Return to Aeternum Event", "warframe.com", "Event Website",
       *  "Spiritfarer Website" and "Borderlands 3". Deriving it got 4 of 5 wrong. */
      websiteLabel: z.string().optional(),
      heroImage: image(),
      /** Required, non-empty: every image on this site must have meaningful alt.
       *  The live site ships alt="" on all of them. */
      heroImageAlt: z.string().min(1),
      /** The three "Metrics that Matter" stats. Exactly the shape the live layout renders. */
      metrics: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional(),
      /**
       * Image gallery, rendered after the metrics block.
       *
       * ⚠️ Added after Phase D1. The template was first built against
       * `_webflow-export/detail_project.html`, where Webflow had stripped all CMS
       * content — so this gallery looked like an empty column and was repurposed for
       * the metrics cards. The LIVE pages show it holds real images: two for most
       * projects, one for Warframe. Captured in `_case-study-source/images/`.
       *
       * `alt` is required per image — the live site ships alt="" on all of them.
       */
      gallery: z
        .array(z.object({ src: image(), alt: z.string().min(1) }))
        .optional(),
      /** Meta description. Case study descriptions on the live site are well
       *  written — port them verbatim rather than writing new ones. */
      description: z.string(),
      /** Controls ordering on /projects. Lower sorts first. */
      order: z.number().int().optional(),
      draft: z.boolean().default(false),
    }),
})

/**
 * Blog — BUILT AND DELIBERATELY DISABLED. See docs/enable-blog.md.
 *
 * ⚠️ Defining this collection does NOT publish anything. Route generation is gated
 * on `features.blog` in src/config.ts, which is `false`. Do not flip it as a
 * cleanup task — the disabled state is intentional (build-context/DECISIONS.md).
 *
 * The schema doubles as the specification for AI-generated drafts: generation fills
 * these fields, and validation rejects anything malformed before it can ship.
 */
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.date(),
      author: z.string(),
      heroImage: image().optional(),
      /** Required whenever heroImage is set — enforced by the refine below. */
      heroImageAlt: z.string().min(1).optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(true),
    })
      .refine((d) => !d.heroImage || !!d.heroImageAlt, {
        message: 'heroImageAlt is required when heroImage is set',
        path: ['heroImageAlt'],
      }),
})

export const collections = { legal, projects, blog }
