// Browser test for Ra-Dar: each mountain, desktop + phone, preseason then ski-day view.
// Usage: MTNS=a,b VIEWS=desktop,phone TABS=1 node test.js <baseUrl> <outDir>
// Defaults: every mountain in mountains.js, both views, http://localhost:8765/, screenshots in ./shots.
// Prints a JSON report: look at errors, failedRequests, sec.csp and the loaded flags, then at the screenshots.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const base = process.argv[2] || 'http://localhost:8765/';
const out = process.argv[3] || path.join(__dirname, 'shots');
fs.mkdirSync(out, { recursive: true });
const isLocal = /localhost|127\.0\.0\.1/.test(base);

const mountains = (process.env.MTNS ? process.env.MTNS.split(',') : require('./keys.js')());
const viewportsAll = [
  ['desktop', { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 }],
  ['phone', { ...devices['iPhone 13'] }],
];
const viewports = viewportsAll.filter(([n]) => !process.env.VIEWS || process.env.VIEWS.split(',').includes(n));
const shootTabs = !!process.env.TABS;

(async () => {
  const browser = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  const results = [];
  for (const mtn of mountains) {
    for (const [vname, vopts] of viewports) {
      const ctx = await browser.newContext({ ...vopts });
      const page = await ctx.newPage();
      const errors = [], failed = [], consoleErr = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => { if (m.type() === 'error') consoleErr.push(m.text().slice(0, 160)); });
      page.on('requestfailed', (r) => failed.push(`${r.failure()?.errorText} ${r.url().slice(0, 110)}`));
      if (process.env.BLOCK_ELEV) await page.route((u) => u.href.includes('elevation=1255,1855,2080&hourly=temperature_2m,apparent'), (r) => r.abort());
      if (process.env.BLOCK_GEM) await page.route((u) => u.href.includes('models=gem_seamless&hourly=temperature_2m,dew_point'), (r) => r.abort());
      await page.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)); });
      const url = `${base}?mtn=${mtn}${isLocal ? '' : '&t=' + Date.now()}`;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      try {
        await page.waitForFunction(() => /Updated/.test(document.getElementById('updated')?.textContent || ''), null, { timeout: 90000 });
      } catch (e) { errors.push('TIMEOUT waiting for #updated'); }
      await page.waitForTimeout(3000);
      const T = (sel) => page.evaluate((s) => document.querySelector(s)?.innerText.trim().replace(/\s+/g, ' ') ?? null, sel);
      const info = await page.evaluate(() => ({
        updated: document.getElementById('updated').textContent.trim(),
        mode: document.documentElement.dataset.mode,
        loaded: {
          elev: !!state.elev, nws: !!state.nws, nwsRows: state.nws?.rows?.length, models: !!state.week?.models, ens: !!state.week?.ens, pre: !!state.pre,
          stations: Array.isArray(state.stations) ? state.stations.length : state.stations, daily: state.daily ? state.daily.map((s) => `${s.id}:${s.last ? s.last.date : 'none'}/${s.lastReport}`) : null,
        },
        split: state.pre ? state.pre.map((z) => `${z.zone.short || z.zone.name} ${z.snow.reduce((x, y) => x + y, 0).toFixed(1)}"`).join(' / ') : null,
        elevDaily: state.elev ? state.elev.map((z) => `${z.zone.short || z.zone.name} snow ${z.daily.snowfall_sum.reduce((x, y) => x + y, 0).toFixed(1)}" rain ${z.daily.rain_sum.reduce((x, y) => x + y, 0).toFixed(2)}"`).join(' / ') : null,
        sourcesRows: [...document.querySelectorAll('#sources tbody tr')].map((tr) => [...tr.children].slice(0, 3).map((td) => td.textContent).join(' | ')),
        weekSrc: document.getElementById('week-src')?.textContent,
        footer: document.querySelector('footer')?.innerText.replace(/\s+/g, ' '),
        switcher: [...document.querySelectorAll('#mtn-switch a')].map((a) => a.textContent),
      }));
      info.preNow = await T('#pre-now');
      info.preTiles = await T('#pre-tiles');
      await page.screenshot({ path: `${out}/${mtn}-${vname}-preseason.png` });
      // Cams: does the main image load?
      info.cam = await page.evaluate(() => { const i = document.getElementById('cam-main'); return { title: document.getElementById('cam-title').textContent, w: i.naturalWidth, src: i.src.slice(0, 100) }; });
      info.heroCam = await page.evaluate(() => { const i = document.getElementById('pre-stake'); return { w: i.naturalWidth, cap: document.getElementById('pre-stake-cap').textContent }; });
      // Tabs
      const tabs = ['snowpack', 'measured', 'forecast', 'week', 'elevation', 'lifts', 'radar', 'discussion'];
      info.tabs = {};
      for (const t of tabs) {
        const b = await page.$(`button[data-tab="${t}"]`);
        if (!b || !(await b.isVisible())) continue;
        await b.click();
        await page.waitForTimeout(1500);
        const panel = await page.$(`.tab-panel[data-panel="${t}"]`);
        info.tabs[t] = (await panel.innerText()).replace(/\s+/g, ' ').slice(0, 260);
        if (shootTabs) await panel.screenshot({ path: `${out}/${mtn}-${vname}-tab-${t}.png` }).catch(() => {});
      }
      // Ski-day view
      const toggle = await page.$('#view-toggle:not([hidden])');
      if (toggle) {
        await toggle.click();
        await page.waitForTimeout(2500);
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(600);
        info.skiDay = await page.evaluate(() => ({
          mode: document.documentElement.dataset.mode || '(none)',
          chips: [...document.querySelectorAll('#call-chips .chip')].map((c) => `${c.className.replace('chip ', '')}: ${c.textContent}`),
          nowSrc: document.getElementById('now-src')?.textContent,
          nowList: document.getElementById('now-list')?.innerText.replace(/\s+/g, ' '),
          nowCap: document.getElementById('now-cap')?.innerText,
          snowSrc: document.getElementById('snow-src')?.textContent,
          snowMeasured: document.getElementById('snow-measured')?.hidden ? '(hidden)' : document.getElementById('snow-measured')?.innerText.replace(/\s+/g, ' '),
          windCap: document.getElementById('wind-cap')?.textContent,
          sky: document.getElementById('sky-sub')?.textContent,
          brief: [...document.querySelectorAll('#brief-lines li')].map((l) => l.textContent),
        }));
        await page.screenshot({ path: `${out}/${mtn}-${vname}-skiday.png` });
        const brief = await page.$('#brief');
        if (brief) await brief.screenshot({ path: `${out}/${mtn}-${vname}-brief.png` }).catch(() => {});
      } else info.skiDay = 'no view toggle';
      // Live video (YouTube) where a mountain has it, then the security checks.
      const play = await page.$('#cam-play:not([hidden])');
      if (play) { await page.evaluate(() => document.getElementById('cams').scrollIntoView()); await play.click().catch(() => {}); await page.waitForTimeout(2500); }
      info.sec = await page.evaluate(() => ({ csp: window.__csp, leaflet: !!window.L, chart: !!window.Chart, radarTiles: document.querySelectorAll('#map img.leaflet-tile').length, radarText: document.getElementById('radar-time')?.textContent, liftFrame: !!document.querySelector('#board-frame iframe'), ytFrame: !!document.querySelector('#cam-frame iframe') }));
      info.errors = errors;
      info.consoleErrors = consoleErr;
      info.failedRequests = failed.filter((f) => !/ERR_ABORTED/.test(f));
      results.push({ mtn, vname, ...info });
      await ctx.close();
    }
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})();
