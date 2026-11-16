// Fresh visit to the LIVE site on a simulated 4G phone: when the main picture appears vs. when everything is in.
// Usage: MTNS=bachelor,skibowl node firstdraw.js
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  for (const m of (process.env.MTNS || 'bachelor').split(',')) {
    const ctx = await b.newContext(devices['iPhone 13']); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
    await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 85, downloadThroughput: 9e6 / 8, uploadThroughput: 1.5e6 / 8 });
    const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    const t0 = Date.now(); let firstCam = null;
    p.on('request', (r) => { if (!firstCam && /ytimg|ozolio|brownrice|resortcams|wsdot|tripcheck|dot\.ca|sunpeaksresort|mtbachelor\.com\/.*(cam|weather)/.test(r.url())) firstCam = Date.now() - t0; });
    await p.goto(`https://ra-dar-alpha.vercel.app/?mtn=${m}`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.querySelector('.pre-fig') && !document.querySelector('.pre-fig').classList.contains('empty'), null, { timeout: 60000 }).catch(() => {});
    const chart = Date.now() - t0;
    await p.waitForFunction(() => /Updated/.test(document.querySelector('#updated')?.textContent || ''), null, { timeout: 120000 }).catch(() => {});
    const all = Date.now() - t0;
    console.log(`${m.padEnd(11)} main chart ${chart} ms | everything ${all} ms | first cam request ${firstCam} ms | ${await p.$eval('#updated', (e) => e.textContent)} | errors ${errs.length}`);
    await ctx.close();
  }
  await b.close();
})();
