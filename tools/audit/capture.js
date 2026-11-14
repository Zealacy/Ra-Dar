// Audit capture: loads each mountain, saves every raw data response the page received and a snapshot
// of what the page computed from them. Usage: node capture.js <outDir> [mtn,mtn...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const out = process.argv[2];
const mtns = (process.argv[3] ? process.argv[3].split(',') : require('../test/keys.js')());
const HOSTS = /api\.weather\.gov|open-meteo\.com|wcc\.sc\.egov\.usda\.gov|api\.weather\.gc\.ca/;

(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } });
  for (const m of mtns) {
    const dir = path.join(out, m);
    fs.mkdirSync(dir, { recursive: true });
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    const p = await ctx.newPage();
    const index = [];
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e)));
    p.on('response', async (r) => {
      const u = r.url();
      if (!HOSTS.test(u) || r.request().method() !== 'GET' || r.status() !== 200) return;
      try {
        const body = await r.text();
        const f = `r${index.length}.json`;
        fs.writeFileSync(path.join(dir, f), body);
        index.push({ url: u, file: f, at: new Date().toISOString() });
      } catch { /* body unavailable */ }
    });
    await p.goto(`http://localhost:8765/?mtn=${m}`);
    await p.waitForFunction(() => /Updated/.test(document.getElementById('updated').textContent), null, { timeout: 120000 });
    await p.waitForTimeout(2000);
    const snap = await p.evaluate(() => {
      const P = state.pre ? computePreseason() : null;
      const est = typeof modelNow === 'function' && M.nowModel ? modelNow() : null;
      return {
        capturedAt: new Date().toISOString(),
        updated: document.getElementById('updated').textContent,
        M: { lat: M.lat, lon: M.lon, tz: M.timezone, zones: M.zones, nws: M.nws || null, stations: M.stations, snotel: M.snotel, snowSensor: M.snowSensor || null, snowDaily: M.snowDaily || null, season: M.season, skiHours: M.skiHours || null, maxAge: M.stationMaxAgeHours, snowZone: M.snowZone },
        nws: state.nws ? { elevFt: state.nws.elevFt, model: !!state.nws.model, rows: state.nws.rows } : null,
        stations: (state.stations || []).map((s) => ({ id: s.id, stats: s.stats, n: s.obs.length })),
        snotel: (state.snotel || []).map((s) => ({ id: s.id, onSite: !!s.onSite, stats: s.stats })),
        daily: state.daily || null,
        elev: (state.elev || []).map((z) => ({ zone: z.zone.key, ft: z.zone.ft, times: z.times, temp: z.hourly.temperature_2m, precip: z.hourly.precipitation, snow: z.hourly.snowfall, rain: z.hourly.rain, fl: z.flFt, dailyTime: z.daily.time, dailySnow: z.daily.snowfall_sum, dailyRain: z.daily.rain_sum, dailyHi: z.daily.temperature_2m_max, dailyLo: z.daily.temperature_2m_min, pastSnow: z.pastSnow })),
        call: state.call,
        week: state.weekView ? { weekEns: state.weekView.weekEns, days: state.weekView.days.map((d) => ({ date: d.date, name: d.name, ens: d.ens, nwsSnow: d.nwsSnow, snow: d.snow, snowSource: d.snowSource, models: d.models, zones: d.zones, freezing: d.freezing, gust: d.gust, sky: d.sky, wetIn: d.wetIn, rainCls: d.rainCls, conf: d.conf, closed: d.closed, rows: d.rows.length })) } : null,
        pre: P ? { zones: P.zones.map((z) => ({ key: z.key, ft: z.ft, seasonSnow: z.seasonSnow, next7: z.next7, last7: z.last7 })), week: P.week, start: P.start, daysToOpen: P.daysToOpen } : null,
        preRaw: (state.pre || []).map((z) => ({ zone: z.zone.key, ft: z.zone.ft, times: z.times, keys: z.keys, precip: z.precip, temp: z.temp, snow: z.snow })),
        modelNow: est,
        text: {
          chips: [...document.querySelectorAll('#call-chips .chip')].map((c) => c.textContent),
          brief: [...document.querySelectorAll('#brief-lines li')].map((l) => l.textContent),
          preNow: document.getElementById('pre-now').innerText,
          preTiles: document.getElementById('pre-tiles').innerText,
          nowList: document.getElementById('now-list').innerText,
          snowNums: ['snow24', 'snow72', 'snowF'].map((id) => document.getElementById(id).textContent),
          windCap: document.getElementById('wind-cap').textContent,
          skySub: document.getElementById('sky-sub').textContent,
          mtnSvg: [...document.querySelectorAll('#mtn-svg text')].map((t) => t.textContent),
          preSvg: [...document.querySelectorAll('#pre-depth-svg text')].map((t) => t.textContent),
          weekStrip: [...document.querySelectorAll('#week-strip .day')].map((d) => d.innerText.replace(/\s+/g, ' ')),
        },
        errs: [],
      };
    });
    snap.errs = errs;
    fs.writeFileSync(path.join(dir, 'snapshot.json'), JSON.stringify(snap));
    fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index, null, 1));
    console.log(m, '| responses', index.length, '|', snap.updated, '| page errors', errs.length);
    await ctx.close();
  }
  await b.close();
})();
