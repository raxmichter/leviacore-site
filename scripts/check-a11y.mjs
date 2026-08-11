/**
 * check-a11y.mjs — axe-core accessibility audit over the built site.
 *
 * CI gate 4 of 4 (migration plan §8), targeting WCAG 2.2 AA. This is also the
 * systematic fix for the missing alt text that motivated part of this migration:
 * relying on anyone to remember is what produced `alt=""` on every image of the
 * live site in the first place.
 *
 * Serves dist/ over a real HTTP server rather than file:// so that root-relative
 * URLs, the sitemap and redirects behave as they will in production.
 *
 * Usage: node scripts/check-a11y.mjs
 * Exits non-zero on any violation at the configured impact levels.
 */
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { join, extname, relative } from 'node:path'
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const DIST = join(process.cwd(), 'dist')
const PORT = 4399

/** Fail the build on these. 'minor' is reported but does not fail. */
const FAILING_IMPACTS = new Set(['critical', 'serious', 'moderate'])

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}

async function htmlRoutes(dir = DIST) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await htmlRoutes(full)))
    else if (entry.name.endsWith('.html')) {
      const rel = relative(DIST, full).replace(/\\/g, '/')
      out.push('/' + rel.replace(/index\.html$/, '').replace(/\.html$/, ''))
    }
  }
  return [...new Set(out)].sort()
}

const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0])
    let body
    let file = join(DIST, p)
    if (extname(file)) {
      body = await readFile(file)
    } else {
      // Astro's directory build format: /foo -> dist/foo/index.html.
      // But 404 is emitted as a bare dist/404.html, so fall back to <path>.html —
      // without this the server 404s on it and the audit grades the error response
      // rather than the page.
      try {
        file = join(DIST, p, 'index.html')
        body = await readFile(file)
      } catch {
        file = join(DIST, `${p.replace(/\/$/, '')}.html`)
        body = await readFile(file)
      }
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  }
})

await new Promise((r) => server.listen(PORT, r))

const routes = await htmlRoutes()
const browser = await chromium.launch()
// @axe-core/playwright requires an explicit context — browser.newPage() creates an
// implicit one it refuses to work with.
const context = await browser.newContext()
const page = await context.newPage()

let totalViolations = 0
const report = []

for (const route of routes) {
  await page.goto(`http://localhost:${PORT}${route || '/'}`, { waitUntil: 'networkidle' })
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()

  const failing = results.violations.filter((v) => FAILING_IMPACTS.has(v.impact))
  const minor = results.violations.filter((v) => !FAILING_IMPACTS.has(v.impact))

  if (failing.length || minor.length) {
    report.push({ route, failing, minor })
    totalViolations += failing.length
  }
}

await browser.close()
server.close()

console.log(`axe: audited ${routes.length} route(s) against WCAG 2.2 AA\n`)

for (const { route, failing, minor } of report) {
  console.log(`${route}`)
  for (const v of failing) {
    console.log(`  ✗ [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s))`)
    v.nodes.slice(0, 3).forEach((n) => console.log(`      ${n.target.join(' ')}`))
  }
  for (const v of minor) {
    console.log(`  · [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node(s)) [not failing]`)
  }
  console.log('')
}

if (totalViolations > 0) {
  console.error(`✗ ${totalViolations} accessibility violation(s) at critical/serious/moderate impact.`)
  process.exit(1)
}
console.log('✓ No accessibility violations at critical, serious or moderate impact.')
