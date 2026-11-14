// Ski-day window per mountain at chosen clock times (Playwright fake clock), ski-day view. Local server.
// Open-Meteo is blocked in this test to save the daily allowance; only the labels are checked.
const { chromium } = require('playwright');
const cases = [
  ['skibowl', '2026-11-13T14:00:00-08:00', 'Fri 2pm: today 3–10pm'],
  ['skibowl', '2026-11-13T21:30:00-08:00', 'Fri 9:30pm: tomorrow (Sat) 9am–10pm'],
  ['skibowl', '2026-11-15T21:30:00-08:00', 'Sun 9:30pm: tomorrow (Mon) 3–10pm'],
  ['bachelor', '2026-11-13T14:00:00-08:00', 'Fri 2pm: today 9am–4pm'],
  ['bachelor', '2026-11-13T15:30:00-08:00', 'Fri 3:30pm: tomorrow 9am–4pm'],
  ['appalachian', '2026-11-13T22:30:00-05:00', 'Fri 10:30pm ET: today 9am–midnight'],
  ['appalachian', '2026-11-12T21:30:00-05:00', 'Thu 9:30pm ET: tomorrow (Fri) 9am–midnight'],
];
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  for (const [m, t, expect] of cases) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.clock.setFixedTime(new Date(t));
    await p.addInitScript((k) => { try { localStorage.setItem('radar-view:' + k, 'season'); localStorage.setItem('radar-view', 'season'); } catch {} }, m);
    await p.route(/open-meteo\.com/, (r) => r.abort());
    await p.goto(`http://localhost:8765/?mtn=${m}`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => /Updated/.test(document.querySelector('#updated')?.textContent || ''), null, { timeout: 90000 }).catch(() => {});
    const r = await p.evaluate(() => ({ day: document.querySelector('#call-day')?.textContent, hrs: document.querySelector('#call-hours')?.textContent, to: document.querySelector('#snowF-to')?.textContent, wind: document.querySelector('#wind-cap')?.textContent, when: document.querySelector('#brief-when')?.textContent }));
    console.log(`${m.padEnd(11)} ${expect.padEnd(42)} -> ${r.day} | ${r.hrs} | ${r.to} | ${r.wind} | errors ${errs.length}`);
    await ctx.close();
  }
  await b.close();
})();
