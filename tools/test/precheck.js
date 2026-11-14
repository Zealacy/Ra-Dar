// Preseason "coming" snow by elevation: the deterministic model total, precipitation, the 82-run range and what the
// page shows per zone. Usage: MTNS=alpental,stevens node precheck.js (local server)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  for (const m of (process.env.MTNS || 'alpental').split(',')) {
    const p = await b.newPage();
    await p.goto(`http://localhost:8765/?mtn=${m}`, { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => /Updated/.test(document.querySelector('#updated')?.textContent || ''), null, { timeout: 120000 }).catch(() => {});
    const r = await p.evaluate(() => {
      const P = state.pre; if (!P) return 'no pre';
      const now = Date.now(), in7 = now + 7 * 864e5;
      const det = P.map((z) => z.times.reduce((a, t, k) => a + (t > now && t <= in7 ? z.snow[k] : 0), 0));
      const pr = P.map((z) => z.times.reduce((a, t, k) => a + (t > now && t <= in7 ? (z.precip[k] || 0) : 0), 0) / 25.4);
      const w = ensNext7(); const c = computePreseason();
      return { det: det.map((x) => +x.toFixed(2)), precipIn: pr.map((x) => +x.toFixed(2)), ens: w && { p10: +w.p10.toFixed(1), p50: +w.p50.toFixed(1), p90: +w.p90.toFixed(1) }, coming: c?.zones?.map((z) => +(z.next7 ?? 0).toFixed(1)) };
    });
    console.log(m, JSON.stringify(r)); await p.close();
  }
  await b.close();
})();
