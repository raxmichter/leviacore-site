/**
 * verify-pages.mjs — structural checks over the built output in dist/.
 *
 * Catches the specific defect classes this migration exists to fix, so they cannot
 * silently return. Run after `npm run build`. Exits non-zero on failure, which is
 * what makes it usable as a CI gate in Phase F.
 *
 * Deliberately dependency-free and regex-based: these are coarse structural
 * assertions, not a DOM audit. The axe and link-checker gates in Phase F do the
 * rigorous version. This one is fast enough to run on every save.
 *
 * Usage: node scripts/verify-pages.mjs
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const DIST = join(process.cwd(), 'dist')

/** Pages under these paths are dev-only and exempt from the one-h1 rule. */
const DEV_PATHS = ['dev/']

const failures = []
const warnings = []
let pagesChecked = 0

async function htmlFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)))
    else if (entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

const count = (html, re) => (html.match(re) || []).length

function check(file, html) {
  const rel = relative(DIST, file).replace(/\\/g, '/')
  const isDev = DEV_PATHS.some((p) => rel.startsWith(p))
  const fail = (msg) => failures.push(`${rel}: ${msg}`)
  const warn = (msg) => warnings.push(`${rel}: ${msg}`)

  // 1. Exactly one <h1>. Multiple h1s are an axe finding and muddy the SEO signal.
  const h1s = count(html, /<h1[\s>]/g)
  if (!isDev && h1s !== 1) fail(`expected exactly 1 <h1>, found ${h1s}`)

  // 2. URL parity: no .html in internal hrefs. The live site serves extensionless
  //    URLs; emitting .html would 404 and break the migration's one hard rule.
  const htmlLinks = [...html.matchAll(/href="(?!https?:)([^"]*\.html[^"]*)"/g)].map((m) => m[1])
  if (htmlLinks.length) fail(`internal .html link(s): ${[...new Set(htmlLinks)].join(', ')}`)

  // 3. Every <img> needs a non-empty alt — UNLESS it is explicitly marked decorative.
  //    The live site ships alt="" on meaningful images (headshots, client logos),
  //    which is the defect this catches. But alt="" is the CORRECT markup for a
  //    genuinely decorative image, so an empty alt is only accepted when paired with
  //    aria-hidden="true" or role="presentation" — an explicit statement of intent,
  //    rather than something that could equally be an oversight.
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
  //    Note: Astro serialises an empty alt as the bare attribute `alt`, not `alt=""`,
  //    so both spellings have to be accepted here.
  const hasEmptyAlt = (t) => /\balt(=""|(?=[\s>]))/.test(t)
  const isDecorative = (t) => hasEmptyAlt(t) && /aria-hidden="true"|role="presentation"/.test(t)
  const badAlt = imgs.filter((t) => !/\balt="[^"]+"/.test(t) && !isDecorative(t))
  if (badAlt.length)
    fail(
      `${badAlt.length}/${imgs.length} <img> with missing or empty alt ` +
        `(decorative images need alt="" AND aria-hidden="true")`
    )

  // 4. The Webflow empty-collection artifact. Visible on the live Spiritfarer page.
  if (/No items found\./i.test(html)) fail('renders the Webflow "No items found." artifact')

  // 5. The empty footer anchor to webflow.com — a link with no accessible name.
  if (/<a[^>]+webflow\.com[^>]*>\s*<\/a>/i.test(html)) fail('empty <a> to webflow.com (no accessible name)')

  // 6. Duplicate element ids break label[for] association and are invalid HTML.
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
  if (dupes.length) fail(`duplicate id(s): ${dupes.join(', ')}`)

  // 7. Every label[for] must resolve to a real element id.
  const fors = [...html.matchAll(/<label[^>]+for="([^"]+)"/g)].map((m) => m[1])
  const unresolved = fors.filter((f) => !ids.includes(f))
  if (unresolved.length) fail(`label[for] with no matching id: ${unresolved.join(', ')}`)

  // 8. Same-page fragment links must resolve to an id that exists on the page.
  //    This is the defect that shipped on the live legal pages for years: four
  //    "jump to section" links pointing at anchors that were never created. The
  //    hrefs were also `https://about:blank/#...`, so check for that shape too.
  if (/href="https?:\/\/about:blank/i.test(html)) fail('href="https://about:blank/..." — invalid link')
  const fragments = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1])
  const unresolvedFragments = [...new Set(fragments)].filter((f) => !ids.includes(f))
  if (unresolvedFragments.length)
    fail(`fragment link(s) with no matching id: ${unresolvedFragments.map((f) => '#' + f).join(', ')}`)

  // 9. Title and description must exist and be non-trivial.
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || ''
  if (!title.trim()) fail('missing <title>')
  else if (!isDev && title.trim() === 'Leviathan Core')
    fail('bare "Leviathan Core" title — the original homepage SEO defect has returned')
  if (!/<meta name="description" content="[^"]+"/.test(html)) fail('missing or empty meta description')

  // 10. Canonical on indexable pages; noindex pages must not carry one.
  const hasCanonical = /rel="canonical"/.test(html)
  const hasNoindex = /name="robots"[^>]*noindex/.test(html)
  if (!hasCanonical && !hasNoindex) fail('no canonical link and no noindex')
  if (hasCanonical && hasNoindex) fail('has both a canonical link and noindex')

  // 11. og:image / twitter:image must be absolute AND on our own origin. The export
  //      served the site's primary social card from i.imgur.com — a third-party host
  //      nobody here controls. If it rotted, every share of every page would silently
  //      lose its preview. Localized in Phase D2; this stops it coming back.
  for (const m of html.matchAll(/(?:property|name)="(og:image|twitter:image)" content="([^"]+)"/g)) {
    const [, prop, url] = m
    if (!url.startsWith('https://www.leviacore.com/'))
      fail(`${prop} is not on our own origin: ${url}`)
  }

  // 12. The placeholder contact endpoint must never reach production.
  if (/contact-form-endpoint-todo/.test(html))
    warn('contact form still points at the placeholder endpoint (OPEN.md item 2)')

  // 13. GA4 must survive the migration.
  if (!isDev && !/G-EG4F7ZLTZQ/.test(html)) warn('GA4 tag missing')

  pagesChecked++
}

const files = await htmlFiles(DIST)
for (const f of files) check(f, await readFile(f, 'utf8'))

console.log(`Checked ${pagesChecked} page(s) in dist/\n`)
if (warnings.length) {
  console.log(`⚠ ${warnings.length} warning(s):`)
  warnings.forEach((w) => console.log(`  - ${w}`))
  console.log('')
}
if (failures.length) {
  console.error(`✗ ${failures.length} failure(s):`)
  failures.forEach((f) => console.error(`  - ${f}`))
  process.exit(1)
}
console.log('✓ All structural checks passed.')
