/**
 * check-lighthouse.mjs — Lighthouse audit over the built site.
 *
 * Migration plan §8 targets: 95+ across all four categories, and Core Web Vitals
 * green (LCP < 2.5s, CLS < 0.1, INP < 200ms).
 *
 * Runs against the production build served over local HTTP, using the Chromium
 * that Playwright already installed rather than requiring a system Chrome.
 *
 * NOT a per-commit CI gate: Lighthouse scores vary with machine load, so a hard
 * threshold makes CI flaky. Run on demand; record results in build-context/fidelity.md.
 *
 * Usage:
 *   node scripts/check-lighthouse.mjs            # representative pages
 *   node scripts/check-lighthouse.mjs /team      # one page
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { chromium } from 'playwright'
import lighthouse from 'lighthouse'

const DIST = join(process.cwd(), 'dist')
const PORT = 4401

/** One of each page type — auditing all 15 adds minutes and little signal. */
const PAGES = process.argv[2] ? [process.argv[2]] : ['/', '/services', '/team', '/project/spiritfarer', '/privacy-policy']

const TARGET = 95

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.xml': 'application/xml', '.txt': 'text/plain',
}

const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0])
    let file = join(DIST, p)
    let body
    if (extname(file)) body = await readFile(file)
    else {
      try { body = await readFile(join(DIST, p, 'index.html')); file = join(DIST, p, 'index.html') }
      catch { file = join(DIST, `${p.replace(/\/$/, '')}.html`); body = await readFile(file) }
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch { res.writeHead(404); res.end('Not found') }
})

await new Promise((r) => server.listen(PORT, r))

// Lighthouse drives Chrome over the DevTools protocol; Playwright's chromium
// exposes one on --remote-debugging-port.
const browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] })

const rows = []
for (const path of PAGES) {
  const result = await lighthouse(
    `http://localhost:${PORT}${path}`,
    { port: 9222, output: 'json', logLevel: 'error', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1 }, formFactor: 'desktop' }
  )
  const c = result.lhr.categories
  const a = result.lhr.audits
  rows.push({
    path,
    perf: Math.round(c.performance.score * 100),
    a11y: Math.round(c.accessibility.score * 100),
    bp: Math.round(c['best-practices'].score * 100),
    seo: Math.round(c.seo.score * 100),
    lcp: a['largest-contentful-paint']?.numericValue ?? 0,
    cls: a['cumulative-layout-shift']?.numericValue ?? 0,
    tbt: a['total-blocking-time']?.numericValue ?? 0,
  })
}

await browser.close()
server.close()

console.log('\nLighthouse (desktop)\n')
console.log('page                          perf  a11y   bp   seo    LCP     CLS    TBT')
console.log('─'.repeat(78))
for (const r of rows) {
  console.log(
    `${r.path.padEnd(28)} ${String(r.perf).padStart(4)} ${String(r.a11y).padStart(5)} ${String(r.bp).padStart(4)} ${String(r.seo).padStart(5)}` +
    `  ${(r.lcp / 1000).toFixed(2)}s  ${r.cls.toFixed(3)}  ${Math.round(r.tbt)}ms`
  )
}

const below = rows.flatMap((r) =>
  ['perf', 'a11y', 'bp', 'seo'].filter((k) => r[k] < TARGET).map((k) => `${r.path} ${k}=${r[k]}`)
)
const badVitals = rows.filter((r) => r.lcp > 2500 || r.cls > 0.1)

console.log('')
if (below.length) console.log(`⚠ below the ${TARGET} target: ${below.join(', ')}`)
else console.log(`✓ all categories at or above ${TARGET}`)
if (badVitals.length) console.log(`⚠ Core Web Vitals outside target on: ${badVitals.map((r) => r.path).join(', ')}`)
else console.log('✓ LCP < 2.5s and CLS < 0.1 everywhere audited')
