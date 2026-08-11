/**
 * audit-unstyled.mjs — find elements that match NO CSS rule.
 *
 * Written after the same bug produced four separate visual defects: a class
 * declared inside an Astro component's scoped <style> compiles to
 * `.foo[data-astro-cid-XXX]`, so the SAME class name used by a different
 * component — or written directly in a page — receives no styling at all.
 *
 * Element counts and markup look perfect; the element is simply invisible or
 * unsized. `.line`, `.badge`, `.page-padding` and `.container-xxlarge` all
 * failed exactly this way.
 *
 * This checks the real rendered result: for every element carrying a class, it
 * asks whether ANY loaded CSS rule matches it. Anything that matches nothing is
 * either dead markup or an unstyled element.
 *
 * A hit is not automatically a bug — some classes are semantic hooks or JS
 * targets with no styling by design. Cross-check each against the source CSS.
 *
 * Usage: node scripts/audit-unstyled.mjs
 */
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
import { join, extname, relative, sep } from 'node:path'
import { chromium } from 'playwright'

const DIST = join(process.cwd(), 'dist')
const PORT = 4407

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.woff': 'font/woff', '.woff2': 'font/woff2',
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

async function routes(dir = DIST) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await routes(full)))
    else if (e.name.endsWith('.html')) {
      const rel = relative(DIST, full).split(sep).join('/')
      out.push('/' + rel.replace(/index\.html$/, '').replace(/\.html$/, ''))
    }
  }
  return [...new Set(out)].sort()
}

await new Promise((r) => server.listen(PORT, r))

const browser = await chromium.launch()
const context = await browser.newContext()
const page = await context.newPage()

const agg = {}
const all = (await routes()).filter((r) => !r.startsWith('/dev'))

for (const route of all) {
  await page.goto(`http://localhost:${PORT}${route || '/'}`, { waitUntil: 'networkidle', timeout: 60000 })
  const unstyled = await page.evaluate(() => {
    const selectors = []
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText) selectors.push(rule.selectorText)
          else if (rule.cssRules) for (const inner of rule.cssRules) if (inner.selectorText) selectors.push(inner.selectorText)
        }
      } catch { /* cross-origin sheet */ }
    }
    const flat = selectors.join(',').split(',').map((s) => s.trim()).filter(Boolean)
    const found = new Set()
    for (const el of document.querySelectorAll('[class]')) {
      let matched = false
      for (const s of flat) { try { if (el.matches(s)) { matched = true; break } } catch { /* :where etc */ } }
      if (!matched) for (const cls of el.classList) found.add(cls)
    }
    return [...found]
  })
  for (const cls of unstyled) (agg[cls] ||= new Set()).add(route || '/')
}

await browser.close()
server.close()

const rows = Object.entries(agg).sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
console.log(`Audited ${all.length} route(s).`)
console.log(`${rows.length} class name(s) appear on elements matching NO css rule:\n`)
for (const [cls, pages] of rows) {
  console.log(`  .${cls.padEnd(34)} ${String(pages.size).padStart(2)} page(s)  ${[...pages].slice(0, 5).join(' ')}`)
}
