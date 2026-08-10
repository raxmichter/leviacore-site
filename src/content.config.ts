// Content collections config — Astro 7 content layer (glob loader + Zod schema).
//
// One collection today: `legal` (privacy-policy, ccpa, notice-at-collection — Phase C2a).
// See build-context/OPEN.md item 5 for the link-audit spec these three documents were
// converted against, and build-context/PROGRESS.md Phase C2 for scope.
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

export const collections = { legal }
