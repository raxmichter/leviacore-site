/**
 * compare-metrics.mjs — diff COMPUTED LAYOUT VALUES between the live site and the
 * local build for one page/width: element positions, widths, padding, max-width.
 *
 * More useful than a pixel diff for diagnosis. A pixel diff says "18% of pixels
 * differ"; this says ".page-padding has padding-left 48px live and 0px local" —
 * which is how the single largest fidelity bug in Phase G was found.
 *
 * Usage: node scripts/compare-metrics.mjs /contact 1280
 * On Git Bash prefix with MSYS_NO_PATHCONV=1.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { chromium } from 'playwright'
const DIST=join(process.cwd(),'dist'); const PORT=4404
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'}
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(req.url.split('?')[0]);let file=join(DIST,p);let body;if(extname(file))body=await readFile(file);else{try{body=await readFile(join(DIST,p,'index.html'));file=join(DIST,p,'index.html')}catch{file=join(DIST,`${p.replace(/\/$/,'')}.html`);body=await readFile(file)}}res.writeHead(200,{'Content-Type':MIME[extname(file)]??'application/octet-stream'});res.end(body)}catch{res.writeHead(404);res.end('nf')}})
await new Promise(r=>server.listen(PORT,r))
const path=process.argv[2]||'/contact'; const width=Number(process.argv[3]||1280)
const browser=await chromium.launch(); const ctx=await browser.newContext(); const page=await ctx.newPage()
const probe = async (url) => {
  await page.setViewportSize({width,height:900})
  await page.goto(url,{waitUntil:'networkidle',timeout:60000})
  return page.evaluate(() => {
    const g = (sel) => { const e=document.querySelector(sel); if(!e) return null; const r=e.getBoundingClientRect(); const c=getComputedStyle(e);
      return {left:Math.round(r.left),right:Math.round(r.right),w:Math.round(r.width),pt:c.paddingTop,pl:c.paddingLeft,mw:c.maxWidth,fs:c.fontSize} }
    const bodyCS = getComputedStyle(document.body)
    return {
      bodyPad: bodyCS.padding, bodyBg: bodyCS.backgroundColor, bodyFs: bodyCS.fontSize,
      header: g('header'), nav: g('nav'),
      pagePadding: g('.page-padding'),
      container: g('.container-xxlarge') || g('[class*="container"]'),
      main: g('main') || g('.main-wrapper'),
      footer: g('footer'),
      firstSection: g('section'),
    }
  })
}
const live = await probe(`https://www.leviacore.com${path}`)
const local = await probe(`http://localhost:${PORT}${path}`)
const keys = new Set([...Object.keys(live), ...Object.keys(local)])
console.log(`${path} @ ${width}\n`)
for (const k of keys) {
  const a=live[k], b=local[k]
  if (a && typeof a === 'object') {
    const diff = ['left','right','w','pt','pl','mw','fs'].filter(f => String(a?.[f]) !== String(b?.[f]))
    if (diff.length) console.log(`${k.padEnd(14)} ${diff.map(f=>`${f}: live=${a?.[f]} local=${b?.[f]}`).join('  ')}`)
  } else if (String(a) !== String(b)) console.log(`${k.padEnd(14)} live=${a} local=${b}`)
}
await browser.close(); server.close()
