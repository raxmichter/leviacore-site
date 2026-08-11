/**
 * check-links.mjs — internal link checker over dist/.
 *
 * CI gate 2 of 4 (migration plan §8). Every internal link must resolve to a real
 * built file, or to a rule in public/_redirects. No internal 404s.
 *
 * Why this matters here specifically: the one non-negotiable rule of this migration
 * is URL parity. A broken internal link is the earliest visible symptom of a URL
 * having drifted.
 *
 * External links are NOT fetched — that turns a deterministic gate into a flaky one
 * that fails when someone else's server is down. They are only counted and listed.
 *
 * Usage: node scripts/check-links.mjs
 */
import { readdir, readFile, access } from 'node:fs/promises'
import { join, relative, posix } from 'node:path'

const DIST = join(process.cwd(), 'dist')
const REDIRECTS = join(process.cwd(), 'public', '_redirects')

const failures = []
const external = new Set()
let linksChecked = 0

async function htmlFiles(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)))
    else if (entry.name.endsWith('.html')) out.push(full)
  }
  return out
}

/** Parse _redirects into matchers. Supports exact paths and a trailing /*. */
async function loadRedirects() {
  try {
    const raw = await readFile(REDIRECTS, 'utf8')
    return raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => l.split(/\s+/)[0])
      .filter(Boolean)
  } catch {
    return []
  }
}

const redirectMatches = (rules, path) =>
  rules.some((rule) =>
    rule.endsWith('/*') ? path.startsWith(rule.slice(0, -1)) : rule === path
  )

const exists = async (p) => {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

/** Resolve an internal path to the file that would be served for it. */
async function resolves(path) {
  if (path === '/') return exists(join(DIST, 'index.html'))
  const clean = path.replace(/^\//, '')
  // Astro's directory build format: /foo -> dist/foo/index.html
  if (await exists(join(DIST, clean, 'index.html'))) return true
  // A literal file, e.g. /og-image.png or /sitemap-index.xml
  if (await exists(join(DIST, clean))) return true
  return false
}

const rules = await loadRedirects()
const files = await htmlFiles(DIST)

for (const file of files) {
  const rel = relative(DIST, file).replace(/\\/g, '/')
  const html = await readFile(file, 'utf8')
  const hrefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1])

  for (const href of hrefs) {
    if (!href || href.startsWith('#') || href.startsWith('data:')) continue
    if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:') || href.startsWith('tel:')) {
      external.add(href)
      continue
    }
    if (!href.startsWith('/')) {
      failures.push(`${rel}: relative link "${href}" — use root-relative paths so links survive being moved`)
      continue
    }
    linksChecked++
    const path = href.split('#')[0].split('?')[0]
    if (path === '') continue
    if (await resolves(path)) continue
    if (redirectMatches(rules, path)) continue
    failures.push(`${rel}: internal link "${href}" resolves to nothing (no file, no redirect rule)`)
  }
}

console.log(`Checked ${linksChecked} internal link(s) across ${files.length} page(s).`)
console.log(`${external.size} distinct external/mailto link(s) found (not fetched — see script header).\n`)

if (failures.length) {
  console.error(`✗ ${failures.length} broken internal link(s):`)
  ;[...new Set(failures)].forEach((f) => console.error(`  - ${f}`))
  process.exit(1)
}
console.log('✓ No broken internal links.')
