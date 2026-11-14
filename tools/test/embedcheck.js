// Skibowl's cams: the no-still live player shows a dark panel and a play button; tapping loads Nest's player.
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  for (const [n, o] of [['desktop', { viewport: { width: 1280, height: 900 } }], ['phone', devices['iPhone 13']]]) {
    const ctx = await b.newContext(o); const p = await ctx.newPage(); const errs = [], csp = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (/Content Security Policy|Refused to/.test(m.text())) csp.push(m.text().slice(0, 140)); });
    await p.route(/open-meteo\.com/, (r) => r.abort());
    await p.goto('http://localhost:8765/?mtn=skibowl', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => /Updated/.test(document.querySelector('#updated')?.textContent || ''), null, { timeout: 90000 }).catch(() => {});
    await p.waitForTimeout(4500);
    const names = await p.$$eval('#thumbs button', (bs) => bs.map((x) => x.querySelector('span').textContent + (x.classList.contains('no-still') ? ' [no still]' : '')));
    await p.click('#thumbs button:nth-child(2)'); await p.waitForTimeout(500);
    const before = await p.evaluate(() => ({ frame: document.querySelector('#cam-frame').className, play: !document.querySelector('#cam-play').hidden, label: document.querySelector('#cam-play-label').textContent, why: document.querySelector('#cam-why').textContent.slice(0, 80) }));
    await p.locator('#cam-frame').scrollIntoViewIfNeeded(); await p.screenshot({ path: `embed-${n}.png` }); // in the current folder
    await p.click('#cam-play'); await p.waitForTimeout(2500);
    const after = await p.evaluate(() => document.querySelector('#cam-frame iframe')?.src);
    console.log(n, JSON.stringify({ names, before, iframe: after }), 'errors', errs.length, 'csp', csp);
    await ctx.close();
  }
  await b.close();
})();
