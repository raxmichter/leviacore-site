/**
 * audit-combos.mjs — find two-class "combo overrides" in the original Webflow CSS
 * that the rebuild may be resolving from the nominal scale instead.
 *
 * Webflow authoring produces rules like:
 *
 *   .margin-xxhuge                    { margin: 12rem }     <- nominal
 *   .margin-bottom.margin-xxhuge      { margin-bottom: 1rem }  <- what actually applies
 *
 * The combo silently wins wherever both classes are present, and these combos are
 * frequently NOT restated in any media query, so they stay frozen while the
 * single-class rule scales. Reading the token table instead of the resolved value
 * produces spacing that is wrong nearly everywhere.
 *
 * Two defects of this exact shape have already been found (`.margin-bottom.margin-*`
 * and `.padding-vertical.padding-xlarge`). This lists every remaining combo whose
 * BOTH classes co-occur on a real element in our built markup.
 *
 * A hit is not automatically a bug — it means "check that the rebuild used the
 * combo's resolved value, not the nominal one".
 *
 * Usage: node scripts/audit-combos.mjs
 */
import { readFile, readdir } from 'node:fs/promises'
import { join, extname } from 'node:path'

const SOURCE = join(process.cwd(), '..', '_webflow-export', 'css', 'leviathan-core-2023-r1.webflow.css')
const DIST = join(process.cwd(), 'dist')

async function walk(dir, ext) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(full, ext)))
    else if (extname(e.name) === ext) out.push(full)
  }
  return out
}

const css = await readFile(SOURCE, 'utf8')

/** Top-level `.a.b { ... }` rules — two classes, no descendant combinator. */
const combos = []
for (const m of css.matchAll(/(^|\})\s*(\.[a-zA-Z][\w-]*\.[a-zA-Z][\w-]*)\s*\{([^}]*)\}/g)) {
  const sel = m[2]
  const parts = sel.slice(1).split('.')
  combos.push({ sel, parts, body: m[3].trim().replace(/\s+/g, ' ') })
}

// Class combinations that actually co-occur on one element in our output.
let markup = ''
for (const f of await walk(DIST, '.html')) markup += await readFile(f, 'utf8')
const elementClassSets = [...markup.matchAll(/class="([^"]+)"/g)].map((m) => new Set(m[1].split(/\s+/)))

const live = combos.filter((c) => elementClassSets.some((set) => c.parts.every((p) => set.has(p))))

// Is the same class ALSO defined standalone? That's what makes the combo a trap.
const standalone = new Set()
for (const m of css.matchAll(/(^|\})\s*\.([a-zA-Z][\w-]*)\s*\{/g)) standalone.add(m[2])

console.log(`${combos.length} two-class combo rule(s) in source.`)
console.log(`${live.length} of them apply to a real element in our markup:\n`)

for (const c of live) {
  const shadowed = c.parts.filter((p) => standalone.has(p))
  const flag = shadowed.length ? `  ⚠ also defined standalone: ${shadowed.map((s) => '.' + s).join(', ')}` : ''
  console.log(`  ${c.sel}`)
  console.log(`      ${c.body}${flag}`)
}
