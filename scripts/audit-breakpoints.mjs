/**
 * audit-breakpoints.mjs — find wide-breakpoint (min-width) rules present in the
 * original Webflow CSS that the rebuild does not implement.
 *
 * Written after `/projects` was found stacking its hero at every width: the source
 * `.work-hero-grid` switches to two columns at min-width 1440 and again at 1920,
 * and the rebuild only ever had the base rule. The verification matrix jumped
 * 1280 -> 1920, so the boundary itself was never captured and nothing flagged it.
 *
 * min-width rules are the easiest kind to miss. Most of a migration is exercised
 * at ordinary laptop widths, where these never fire.
 *
 * Reports, per class: which min-width breakpoints the source overrides it at,
 * whether the class appears in our markup, and whether our own CSS has any
 * min-width rule for it. A class used in our markup, overridden wide in source,
 * with no wide rule of ours, is a probable defect.
 *
 * Usage: node scripts/audit-breakpoints.mjs
 */
import { readFile, readdir } from 'node:fs/promises'
import { join, extname, sep } from 'node:path'

const SOURCE = join(process.cwd(), '..', '_webflow-export', 'css', 'leviathan-core-2023-r1.webflow.css')
const DIST = join(process.cwd(), 'dist')

/** Pull `@media ... (min-width: N)` blocks and the class selectors inside each. */
function minWidthBlocks(css) {
  const out = []
  // Astro/Lightning CSS rewrites `min-width: 1440px` into the modern range form
  // `width>=1440px`. Both spellings must be recognised, or our own rules look absent
  // and every class reports as a false positive.
  const re = /@media[^{]*(?:\(min-width:\s*(\d+)px\)|width\s*>=\s*(\d+)px)[^{]*\{/g
  let m
  while ((m = re.exec(css))) {
    const width = Number(m[1] ?? m[2])
    let depth = 1
    let i = re.lastIndex
    const start = i
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') depth--
      i++
    }
    const body = css.slice(start, i - 1)
    const classes = new Set()
    for (const sel of body.matchAll(/(^|\n)\s*([^{}\n][^{}]*)\{/g)) {
      for (const c of sel[2].matchAll(/\.([a-zA-Z][\w-]*)/g)) classes.add(c[1])
    }
    out.push({ width, classes })
  }
  return out
}

async function walk(dir, ext) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(full, ext)))
    else if (extname(e.name) === ext) out.push(full)
  }
  return out
}

const src = await readFile(SOURCE, 'utf8')
const blocks = minWidthBlocks(src)

// Everything our pages actually render.
let markup = ''
for (const f of await walk(DIST, '.html')) markup += await readFile(f, 'utf8')
const used = new Set()
for (const m of markup.matchAll(/class="([^"]+)"/g)) for (const c of m[1].split(/\s+/)) if (c) used.add(c)

// Every min-width rule WE ship.
let ourCss = ''
for (const f of await walk(join(DIST, '_astro'), '.css')) ourCss += await readFile(f, 'utf8')
// Astro inlines small page stylesheets into <style> in the HTML rather than emitting
// a file, so scanning _astro/ alone misses page-scoped rules entirely.
ourCss += markup
const ourWide = new Set()
for (const b of minWidthBlocks(ourCss)) for (const c of b.classes) ourWide.add(c)

const byClass = new Map()
for (const b of blocks) {
  for (const c of b.classes) {
    if (!used.has(c)) continue
    if (!byClass.has(c)) byClass.set(c, new Set())
    byClass.get(c).add(b.width)
  }
}

const missing = [...byClass.entries()].filter(([c]) => !ourWide.has(c)).sort()
const covered = [...byClass.entries()].filter(([c]) => ourWide.has(c))

console.log(`Source min-width breakpoints found: ${[...new Set(blocks.map((b) => b.width))].sort((a, b) => a - b).join(', ')}`)
console.log(`Classes overridden at a wide breakpoint AND used in our markup: ${byClass.size}`)
console.log(`  ${covered.length} have a wide rule of our own`)
console.log(`  ${missing.length} do NOT — listed below\n`)

for (const [cls, widths] of missing) {
  console.log(`  .${cls.padEnd(32)} source overrides at ${[...widths].sort((a, b) => a - b).join(', ')}`)
}
