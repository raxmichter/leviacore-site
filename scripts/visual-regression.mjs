/**
 * visual-regression.mjs — pixel-diff the rebuild against the live Webflow site.
 *
 * Phase G's measurement instrument. Captures each page at five breakpoints from
 * both www.leviacore.com and the local build, and reports the mismatch percentage.
 *
 * Deliberately NOT part of the per-commit CI gates: it depends on the live site
 * being up and unchanged, which makes it non-deterministic in a way a blocking
 * gate must not be. Run it on demand; record results in build-context/fidelity.md.
 *
 * ⚠️ It also stops being meaningful the moment Webflow is wound down. Capture and
 * record results BEFORE cutover.
 *
 * Usage:
 *   node scripts/visual-regression.mjs              # all pages, all widths
 *   node scripts/visual-regression.mjs /team        # one page
 *   node scripts/visual-regression.mjs /team 375    # one page, one width
 *
 * Output: tests/visual/__diffs__/<page>-<width>.png for anything over threshold,
 * plus a summary table. Diff images are gitignored — fidelity.md holds the results.
 */
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

const DIST = join(process.cwd(), 'dist')
const OUT = join(process.cwd(), 'tests', 'visual', '__diffs__')
const LIVE = 'https://www.leviacore.com'
const PORT = 4400

const WIDTHS = [375, 767, 768, 1280, 1920]

/**
 * Pages to compare. Local path first; the live URL is the same path.
 * /404 is excluded — Webflow serves its own error page shell, so a diff there
 * compares two deliberately different pages.
 */
const PAGES = [
  '/',
  '/services',
  '/projects',
  '/team',
  '/contact',
  '/privacy-policy',
  '/ccpa',
  '/notice-at-collection',
  '/project/return-to-aeternum',
  '/project/warframe',
  '/project/legends-of-lost-ark',
  '/project/spiritfarer',
  '/project/borderlands3',
]

/** Mismatch above this is reported as a finding. */
const THRESHOLD_PCT = 1.0

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
      try {
        body = await readFile(join(DIST, p, 'index.html'))
        file = join(DIST, p, 'index.html')
      } catch {
        file = join(DIST, `${p.replace(/\/$/, '')}.html`)
        body = await readFile(file)
      }
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404); res.end('Not found')
  }
})

/**
 * Freeze everything that would make two captures of the same page differ:
 * CSS animations/transitions, the custom cursor (position depends on pointer),
 * and caret blink. Also scrolls the page to force lazy images to load, then
 * returns to the top.
 */
async function prepare(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
      .cursor-wrapper { display: none !important; }
    `,
  })
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0
      const step = () => {
        window.scrollTo(0, y)
        y += window.innerHeight
        if (y < document.body.scrollHeight) requestAnimationFrame(step)
        else { window.scrollTo(0, 0); resolve() }
      }
      step()
    })
  })
  await page.waitForTimeout(400)
}

async function capture(page, url, width) {
  await page.setViewportSize({ width, height: 900 })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await prepare(page)
  return PNG.sync.read(await page.screenshot({ fullPage: true }))
}

const argPage = process.argv[2]
const argWidth = process.argv[3] ? Number(process.argv[3]) : null
const pages = argPage ? PAGES.filter((p) => p === argPage) : PAGES
const widths = argWidth ? WIDTHS.filter((w) => w === argWidth) : WIDTHS

if (!pages.length) {
  console.error(`Unknown page "${argPage}". Known: ${PAGES.join(', ')}`)
  process.exit(1)
}

await mkdir(OUT, { recursive: true })
await new Promise((r) => server.listen(PORT, r))

const browser = await chromium.launch()
const context = await browser.newContext({ deviceScaleFactor: 1 })
const page = await context.newPage()

const rows = []

for (const path of pages) {
  for (const width of widths) {
    let row = { path, width, pct: null, note: '' }
    try {
      const live = await capture(page, `${LIVE}${path}`, width)
      const local = await capture(page, `http://localhost:${PORT}${path}`, width)

      // Full-page heights differ whenever content differs at all. Compare the
      // overlapping region and report the height delta separately rather than
      // failing outright — a height difference is a finding, not an error.
      const w = Math.min(live.width, local.width)
      const h = Math.min(live.height, local.height)
      const diff = new PNG({ width: w, height: h })

      const crop = (src) => {
        const out = new PNG({ width: w, height: h })
        PNG.bitblt(src, out, 0, 0, w, h, 0, 0)
        return out
      }
      const a = crop(live)
      const b = crop(local)

      const mismatched = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.1 })
      const pct = (mismatched / (w * h)) * 100
      row.pct = pct
      if (live.height !== local.height) {
        row.note = `height ${live.height} live vs ${local.height} local (Δ${local.height - live.height}px)`
      }
      if (pct >= THRESHOLD_PCT) {
        await writeFile(join(OUT, `${path.replace(/\//g, '_') || '_root'}-${width}.png`), PNG.sync.write(diff))
      }
    } catch (err) {
      row.note = `ERROR: ${err.message.split('\n')[0]}`
    }
    rows.push(row)
    const pctStr = row.pct === null ? '  —  ' : `${row.pct.toFixed(2)}%`.padStart(7)
    console.log(`${path.padEnd(34)} ${String(width).padStart(5)}  ${pctStr}  ${row.note}`)
  }
}

await browser.close()
server.close()

const over = rows.filter((r) => r.pct !== null && r.pct >= THRESHOLD_PCT)
const errored = rows.filter((r) => r.note.startsWith('ERROR'))
console.log(`\n${rows.length} comparison(s). ${over.length} at or above ${THRESHOLD_PCT}% mismatch. ${errored.length} errored.`)
if (over.length) console.log(`Diff images: tests/visual/__diffs__/`)
