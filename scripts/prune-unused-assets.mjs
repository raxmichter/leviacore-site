/**
 * prune-unused-assets.mjs — remove unreferenced files from dist/_astro.
 *
 * Astro's content layer emits the ORIGINAL of every image declared with the
 * `image()` schema helper, in addition to the optimized WebP it actually serves.
 * For the five case studies that is ~4.4MB of full-size PNG/JPG that no page,
 * stylesheet or script ever references — roughly three quarters of the build.
 *
 * It costs visitors nothing (nobody downloads an unreferenced file), but it
 * bloats every deploy and makes the artifact confusing to hand over.
 *
 * SAFETY: a file is deleted only if its exact hashed filename appears in NO
 * .html, .css, .js, .xml, .json or .txt file anywhere in dist. Astro's filenames
 * are content-hashed and unique, so a substring match is reliable here. The
 * script reports everything it removes; run `npm run build` to restore.
 *
 * Usage: node scripts/prune-unused-assets.mjs [--dry-run]
 */
import { readdir, readFile, stat, unlink } from 'node:fs/promises'
import { join, relative, extname } from 'node:path'

const DIST = join(process.cwd(), 'dist')
const ASTRO = join(DIST, '_astro')
const DRY = process.argv.includes('--dry-run')

/** File types that can contain a reference to an asset. */
const TEXTUAL = new Set(['.html', '.css', '.js', '.mjs', '.xml', '.json', '.txt', '.map'])

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else out.push(full)
  }
  return out
}

const all = await walk(DIST)

// Concatenate every textual file once, rather than re-reading per candidate.
let haystack = ''
for (const f of all) {
  if (TEXTUAL.has(extname(f))) haystack += await readFile(f, 'utf8')
}

let assets = []
try {
  assets = (await readdir(ASTRO)).map((n) => join(ASTRO, n))
} catch {
  console.log('No dist/_astro directory — nothing to prune.')
  process.exit(0)
}

const removed = []
let freed = 0

for (const file of assets) {
  const name = relative(ASTRO, file)
  // Never touch the CSS/JS the site actually loads, even if a reference scan
  // somehow missed it — those are cheap and load-bearing.
  if (['.css', '.js'].includes(extname(name))) continue
  if (haystack.includes(name)) continue

  const { size } = await stat(file)
  removed.push({ name, size })
  freed += size
  if (!DRY) await unlink(file)
}

if (!removed.length) {
  console.log('✓ No unreferenced assets in dist/_astro.')
  process.exit(0)
}

console.log(`${DRY ? '[dry run] would remove' : 'Removed'} ${removed.length} unreferenced asset(s), freeing ${(freed / 1024 / 1024).toFixed(2)} MB:\n`)
for (const r of removed.sort((a, b) => b.size - a.size)) {
  console.log(`  ${(r.size / 1024).toFixed(0).padStart(6)} KB  ${r.name}`)
}
