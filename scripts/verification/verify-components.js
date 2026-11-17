/*
 * Component verification harness — headless puppeteer-core against the built app
 * (vite preview / vite dev on PORT 4199).
 *
 * For every non-math branch it: asserts the sidebar covers all authored content,
 * clicks every component by its display label, verifies the active pill matches,
 * screenshots the canvas region, checks non-blank pixels, and collects console/
 * page/GLB errors. Exit code 1 on any failure.
 *
 * Usage:
 *   cd quantaora-app && npm run build && npx vite preview --port 4199 --strictPort &
 *   node scripts/verification/verify-components.js
 * Requires puppeteer-core + pngjs in a node_modules reachable from this script.
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/ahmedjawed/Documents/Kids Learning app';
const BASE = `http://localhost:4199/app/labs/branch/`;
const SHOTS = '/var/folders/rg/807ryhwn6sn7s4cn7_87mp_40000gn/T/opencode/shots-sci';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/-+/g, '-');

function listBranches() {
  const { readdirSync, existsSync } = fs;
  const out = [];
  for (const subject of readdirSync(path.join(ROOT, 'content/subjects'))) {
    for (const b of readdirSync(path.join(ROOT, 'content/subjects', subject))) {
      const dir = path.join(ROOT, 'content/subjects', subject, b);
      const comps = readdirSync(dir)
        .filter((id) => existsSync(path.join(dir, id, 'module.json')))
        .sort()
        .map((id) => {
          const mod = JSON.parse(fs.readFileSync(path.join(dir, id, 'module.json'), 'utf8'));
          const hasMeta = existsSync(path.join(dir, id, 'model-metadata.json'));
          let visual = null, glb = false;
          if (hasMeta) {
            const v = JSON.parse(fs.readFileSync(path.join(dir, id, 'model-metadata.json'), 'utf8'));
            visual = v?.visual?.shape ?? null;
            glb = typeof v?.url === 'string' && /\.glb?$/.test(v.url);
          } else {
            visual = 'NO-METADATA';
          }
          return { id, title: mod.title ?? mod.name ?? id, visual, glb, hasMeta };
        });
      if (comps.length) out.push({ subject, branch: b, comps });
    }
  }
  return out;
}

const BRANCHES = listBranches().filter((b) =>
  !['number-and-arithmetic', 'fractions-and-ratios', 'algebra', 'geometry', 'data-and-statistics'].includes(b.branch),
);

const fail = [];
const stats = { checked: 0, glb: 0, proc: 0, distinctLow: [] };
let prevBuf = null;

function variance(buf) {
  let same = 0, total = 0;
  for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i], g = buf[i + 1], b = buf[i + 2];
    if (Math.abs(r - g) < 4 && Math.abs(g - b) < 4) same++;
    total++;
  }
  return 1 - same / total;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  fs.mkdirSync(SHOTS, { recursive: true });
  const consoleErrors = [], pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 160)));
  page.on('requestfailed', (r) => {
    if (/\.(glb|gltf)/.test(r.url())) pageErrors.push(`GLB FAIL: ${r.url().split('/').pop()} → ${r.failure()?.errorText ?? '?'}`);
  });

  const pill = () => page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter((e) => e.children.length === 0 && e.textContent.includes('· drag to rotate'));
    return els.length ? els[0].textContent.trim().split('·')[0].trim() : '';
  });

  for (const { subject, branch, comps } of BRANCHES) {
    consoleErrors.length = 0
    pageErrors.length = 0
    console.log(`=== ${subject} / ${branch} (${comps.length}) ===`);
    await page.goto(`${BASE}${branch}`, { waitUntil: 'networkidle2', timeout: 90000 });
    await sleep(4500);

    const labels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('aside button span.text-sm')).map((e) => (e.textContent || '').trim()),
    );
    const missing = comps.filter((c) => !labels.includes(c.title));
    if (missing.length) fail.push(`[${branch}] content absent from sidebar: ${missing.map((m) => `${m.id}("${m.title}")${m.hasMeta ? '' : ' [no-model-metadata]'}`).join(', ')}`);
    console.log(`  sidebar: ${labels.length} items, content: ${comps.length}`);

    prevBuf = null;
    for (const c of comps) {
      if (!labels.includes(c.title)) continue;
      const clicked = await page.evaluate((want) => {
        const btn = Array.from(document.querySelectorAll('aside button')).find((b) => {
          const nameEl = b.querySelector('span.text-sm');
          return nameEl && (nameEl.textContent || '').trim() === want;
        });
        if (!btn) return false;
        btn.scrollIntoView({ block: 'center' });
        btn.click();
        return true;
      }, c.title);
      if (!clicked) { fail.push(`[${branch}/${c.id}] no sidebar button for "${c.title}"`); continue; }
      await sleep(2600);

      const p = await pill();
      const pOk = p === c.title;

      const box = await page.evaluate(() => {
        const canvas = Array.from(document.querySelectorAll('canvas')).find((x) => x.width > 100 && x.height > 100);
        if (!canvas) return null;
        const r = canvas.getBoundingClientRect();
        return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, 1440 - r.x), height: Math.min(r.height, 1000 - r.y) };
      });
      let var_ = 0;
      if (box) {
        const img = await page.screenshot({ clip: box, type: 'png' });
        const { PNG } = require('pngjs');
        const pngObj = PNG.sync.read(img);
        var_ = variance(new Uint8Array(pngObj.data));
        const key = `${branch}/${c.title}`;
        fs.writeFileSync(`${SHOTS}/${branch}-${c.id}.png`, img);
        if (prevBuf && !c.glb) {
          let diff = 0, n = 0;
          for (let i = 0; i < Math.min(prevBuf.length, img.length); i += 32) { if (Math.abs(prevBuf[i] - img[i]) > 8) diff++; n++; }
          const pct = n ? diff / n : 1;
          if (pct < 0.01) stats.distinctLow.push(`${key} diff=${(pct * 100).toFixed(1)}%`);
        }
        prevBuf = img;
      }

      const errs = [...consoleErrors.splice(0), ...pageErrors.splice(0)];
      if (!pOk) fail.push(`[${branch}/${c.id}] pill mismatch after click: got "${p || '(empty)'}" want "${c.title}"`);
      if (!box) fail.push(`[${branch}/${c.id}] no canvas found`);
      else if (var_ < 0.005) fail.push(`[${branch}/${c.id}] blank/solid canvas (var=${var_.toFixed(4)})`);
      if (errs.length) fail.push(`[${branch}/${c.id}] ${errs.join(' | ')}`);
      stats.checked++;
      if (c.glb) stats.glb++; else stats.proc++;
    }
    await sleep(600);
  }

  await browser.close();
  console.log(`\n\nchecked=${stats.checked} (glb=${stats.glb}, proc=${stats.proc})`);
  console.log(`FAILURES: ${fail.length}`);
  for (const f of fail) console.log('  ✗', f);
  console.log(`suspicious low-diff: ${stats.distinctLow.length}`);
  for (const s of stats.distinctLow) console.log('  ~', s);
  process.exit(fail.length ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });