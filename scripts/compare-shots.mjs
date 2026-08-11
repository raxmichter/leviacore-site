/**
 * compare-shots.mjs — save side-by-side screenshots of the live site and the local
 * build for one page/width, into tests/visual/__shots__/.
 *
 * The companion to visual-regression.mjs: that tells you WHICH pages differ and by
 * how much; this lets you look at them. Animations are frozen and lazy images forced
 * to load, so two runs of the same page are comparable.
 *
 * Usage: node scripts/compare-shots.mjs /project/spiritfarer 1280 [full]
 * On Git Bash prefix with MSYS_NO_PATHCONV=1 or the leading slash is mangled.
 */
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { chromium } from 'playwright'
const DIST=join(process.cwd(),'dist'); const PORT=4403
const OUT=join(process.cwd(),'tests','visual','__shots__')
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff':'font/woff','.woff2':'font/woff2'}
const server=createServer(async(req,res)=>{try{const p=decodeURIComponent(req.url.split('?')[0]);let file=join(DIST,p);let body;if(extname(file))body=await readFile(file);else{try{body=await readFile(join(DIST,p,'index.html'));file=join(DIST,p,'index.html')}catch{file=join(DIST,`${p.replace(/\/$/,'')}.html`);body=await readFile(file)}}res.writeHead(200,{'Content-Type':MIME[extname(file)]??'application/octet-stream'});res.end(body)}catch{res.writeHead(404);res.end('nf')}})
await new Promise(r=>server.listen(PORT,r)); await mkdir(OUT,{recursive:true})
const path=process.argv[2]||'/'; const width=Number(process.argv[3]||1280); const full=process.argv[4]==='full'
const browser=await chromium.launch(); const ctx=await browser.newContext(); const page=await ctx.newPage()
async function shot(url,name){
  await page.setViewportSize({width,height:900})
  await page.goto(url,{waitUntil:'networkidle',timeout:60000})
  await page.addStyleTag({content:'*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}.cursor-wrapper{display:none!important}'})
  await page.evaluate(async()=>{await new Promise(r=>{let y=0;const s=()=>{window.scrollTo(0,y);y+=window.innerHeight;if(y<document.body.scrollHeight)requestAnimationFrame(s);else{window.scrollTo(0,0);r()}};s()})})
  await page.waitForTimeout(400)
  await writeFile(join(OUT,name), await page.screenshot({fullPage:full}))
  console.log(name)
}
const slug=(path==='/'?'root':path.replace(/\//g,'_'))
await shot(`https://www.leviacore.com${path}`,`${slug}-${width}-LIVE.png`)
await shot(`http://localhost:${PORT}${path}`,`${slug}-${width}-LOCAL.png`)
await browser.close(); server.close()
