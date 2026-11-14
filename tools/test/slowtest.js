// Scenarios: one source held back on purpose (in the test only). Records when each part of the page appears,
// what the slow note says, and when cam pictures start loading. Local server only.
// Usage: SCEN=normal,snow,ens,nws REQ=1 node slowtest.js
const { chromium } = require('playwright');
const scen = (process.env.SCEN || 'snow,ens').split(',').map((k) => ({
  normal: { name: 'normal (no delay)', mtn: 'stevens', delay: null },
  snow: { name: 'snow stations 9 s late', mtn: 'stevens', delay: /wcc\.sc\.egov\.usda\.gov/ },
  ens: { name: '82 model runs 9 s late', mtn: 'stevens', delay: /ensemble-api\.open-meteo\.com/ },
  nws: { name: 'NWS forecast 9 s late', mtn: 'stevens', delay: /api\.weather\.gov\/gridpoints/ },
}[k]));
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  for (const s of scen) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    if (s.delay) await p.route(s.delay, async (r) => { await new Promise((ok) => setTimeout(ok, 9000)); await r.continue().catch(() => {}); });
    const t0 = Date.now(); let firstCam = null;
    p.on('request', (r) => { if (!firstCam && /brownrice|images\.wsdot|ytimg/.test(r.url())) firstCam = Date.now() - t0; });
    const fin = []; p.on('requestfinished', (r) => { const u = r.url(); if (/weather\.gov|open-meteo|usda/.test(u)) fin.push(`${String(Date.now() - t0).padStart(6)} ms done ${u.replace(/^https:\/\//, '').slice(0, 70)}`); });
    await p.goto(`http://localhost:8765/?mtn=${s.mtn}`, { waitUntil: 'domcontentloaded' });
    const log = []; let last = {};
    for (let i = 0; i < 70; i++) {
      const st = await p.evaluate(() => ({
        now: (document.querySelector('#pre-now')?.innerText || '').replace(/\s+/g, ' ').slice(0, 90),
        fig: document.querySelector('.pre-fig')?.classList.contains('empty') ? (document.querySelector('.pre-fig').dataset.msg || '').slice(0, 40) : 'chart drawn',
        coming: /coming/.test(document.querySelector('#pre-depth-svg')?.textContent || '') ? 'coming bars' : 'no coming bars',
        tile: (document.querySelectorAll('#pre-tiles .pre-tile')[1]?.innerText || '').replace(/\s+/g, ' ').slice(0, 60),
        note: document.querySelector('#slow-note')?.hidden ? '' : (document.querySelector('#slow-note')?.innerText || '').replace(/\s+/g, ' ').slice(0, 120),
        upd: document.querySelector('#updated')?.textContent || '',
      }));
      const ms = Date.now() - t0;
      for (const k of Object.keys(st)) if (st[k] !== last[k]) log.push(`${String(ms).padStart(6)} ms ${k}: ${st[k]}`);
      last = st;
      if (/Updated/.test(st.upd) && ms > 1500) break;
      await p.waitForTimeout(250);
    }
    console.log(`\n== ${s.name} (${s.mtn}) | first cam request at ${firstCam} ms | page errors ${errs.length} ${errs.slice(0, 2)}`);
    log.forEach((l) => console.log(l)); if (process.env.REQ) fin.forEach((l) => console.log('   ' + l));
    await ctx.close();
  }
  await b.close();
})();
