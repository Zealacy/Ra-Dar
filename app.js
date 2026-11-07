// Ra-Dar ski weather. Runs entirely in the browser. Every source used here allows
// browser requests (CORS) and needs no API key.
//   Measured: NRCS SNOTEL (snow depth, SWE, temp, precip), RainViewer radar,
//             Mt. Bachelor webcams + lift-top station graphic.
//   Forecast: National Weather Service gridpoint data, Open-Meteo by elevation.

const M = MOUNTAINS[new URLSearchParams(location.search).get('mtn')] || MOUNTAINS.bachelor;
const TZ = M.timezone;
const AWDB = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1';
const DATA_REFRESH_MS = 10 * 60 * 1000;
const CAM_REFRESH_MS = 5 * 60 * 1000;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SVGNS = 'http://www.w3.org/2000/svg';

const $ = (id) => document.getElementById(id);
const state = { snotel: null, nws: null, elev: null, call: null };
const charts = {};
let activeTab = 'measured';

// ================================================================ device detection
// Sets <html data-device="mobile|tablet|desktop"> from screen width + input type,
// so layouts, chart density and animations fit the platform.
function detectDevice() {
  const w = window.innerWidth;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const device = w < 640 ? 'mobile' : w < 1024 || (coarse && w < 1200) ? 'tablet' : 'desktop';
  const changed = document.documentElement.dataset.device !== device;
  document.documentElement.dataset.device = device;
  document.documentElement.dataset.touch = coarse ? 'yes' : 'no';
  return changed;
}
const isMobile = () => document.documentElement.dataset.device === 'mobile';

// ================================================================ helpers
async function getJSON(url, timeoutMs = 20000, retries = 1) {
  try { return await fetchJSON(url, timeoutMs); }
  catch (e) {
    if (retries <= 0) throw e;
    await new Promise((r) => setTimeout(r, 1500));
    return getJSON(url, timeoutMs, retries - 1);
  }
}
async function fetchJSON(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json, application/geo+json' } });
    if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
const r0 = (v) => (v == null || Number.isNaN(v) || !Number.isFinite(v) ? '–' : Math.round(v).toString());
const r1 = (v) => (v == null || Number.isNaN(v) || !Number.isFinite(v) ? '–' : (Math.round(v * 10) / 10).toString());
const signed = (v, dp = 0) => (v == null ? '–' : (v > 0 ? '+' : '') + (dp ? r1(v) : r0(v)));
const ftFmt = (v) => (v == null || !Number.isFinite(v) ? '–' : Math.round(v).toLocaleString('en-US'));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function toImperial(v, uom) {
  if (v == null) return null;
  switch (uom) {
    case 'wmoUnit:degC': return v * 9 / 5 + 32;
    case 'wmoUnit:km_h-1': return v / 1.609344;
    case 'wmoUnit:m_s-1': return v * 2.236936;
    case 'wmoUnit:mm': return v / 25.4;
    case 'wmoUnit:m': return v * 3.28084;
    default: return v;
  }
}
function compass(deg) {
  if (deg == null) return '–';
  return ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'][Math.round(deg / 22.5) % 16];
}
// Circular mean of wind directions.
function meanDir(dirs) {
  if (!dirs.length) return null;
  const s = dirs.reduce((a, d) => a + Math.sin(d * Math.PI / 180), 0);
  const c = dirs.reduce((a, d) => a + Math.cos(d * Math.PI / 180), 0);
  return (Math.atan2(s, c) * 180 / Math.PI + 360) % 360;
}

const partsFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
function localParts(d) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}
const fmtTime = (d, opts) => d.toLocaleString('en-US', { timeZone: TZ, ...opts });
const hourLabel = (d) => fmtTime(d, { weekday: 'short', hour: 'numeric' });

// Animated count-up for a number in an element.
function countUp(el, to, dp = 0, ms = 1100) {
  if (to == null || !Number.isFinite(to)) { el.textContent = '–'; return; }
  const from = Number(el.dataset.v || 0);
  el.dataset.v = to;
  if (REDUCED) { el.textContent = to.toFixed(dp); return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = clamp((t - t0) / ms, 0, 1);
    const e = 1 - Math.pow(1 - k, 4);
    el.textContent = (from + (to - from) * e).toFixed(dp);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function svgEl(tag, attrs = {}, parent) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent?.appendChild(el);
  return el;
}

// Grow an SVG shape from one edge with a transform (works in every browser).
function grow(el, origin, dur, delay) {
  if (REDUCED) return;
  el.style.transformBox = 'fill-box';
  el.style.transformOrigin = origin;
  el.style.transform = 'scaleY(0)';
  el.style.transition = `transform ${dur}s cubic-bezier(.22,1,.36,1) ${delay}s`;
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = 'scaleY(1)'; }));
}

// Tooltip shared by the SVG widgets.
const tip = $('tip');
function bindTip(el, text) {
  const show = (e) => {
    tip.textContent = typeof text === 'function' ? text() : text;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    tip.style.left = `${clamp(x + 12, 8, innerWidth - 230)}px`;
    tip.style.top = `${y + 14}px`;
    tip.classList.add('show');
  };
  el.addEventListener('pointerenter', show);
  el.addEventListener('pointermove', show);
  el.addEventListener('pointerleave', () => tip.classList.remove('show'));
  el.style.cursor = 'help';
}

// ================================================================ SNOTEL (measured)
// AWDB timestamps are local standard time (UTC-8) all year.
const awdbDate = (d) => new Date(d.getTime() - 8 * 3600e3).toISOString().slice(0, 16).replace('T', ' ');
const parseAwdb = (s) => new Date(s.replace(' ', 'T') + (s.length > 10 ? ':00' : 'T00:00:00') + '-08:00');

async function loadSnotel() {
  const ids = M.snotel.map((s) => s.id).join(',');
  const now = new Date();
  const begin = new Date(now.getTime() - 8 * 864e5);
  const end = new Date(now.getTime() + 2 * 3600e3);
  const hourlyUrl = `${AWDB}/data?stationTriplets=${ids}&elements=SNWD,WTEQ,TOBS,PREC&duration=HOURLY`
    + `&beginDate=${encodeURIComponent(awdbDate(begin))}&endDate=${encodeURIComponent(awdbDate(end))}&periodRef=END&returnFlags=false`;
  const dayBegin = awdbDate(new Date(now.getTime() - 3 * 864e5)).slice(0, 10);
  const dayEnd = awdbDate(end).slice(0, 10);
  const dailyUrl = `${AWDB}/data?stationTriplets=${ids}&elements=WTEQ,SNWD&duration=DAILY&beginDate=${dayBegin}&endDate=${dayEnd}&centralTendencyType=MEDIAN`;
  const [hourly, daily] = await Promise.all([getJSON(hourlyUrl), getJSON(dailyUrl).catch(() => [])]);

  return M.snotel.map((cfg) => {
    const st = hourly.find((s) => s.stationTriplet === cfg.id);
    const series = {};
    (st?.data || []).forEach((el) => {
      series[el.stationElement.elementCode] = el.values.filter((v) => v.value != null).map((v) => ({ t: parseAwdb(v.date), v: v.value }));
    });
    const dSt = daily.find((s) => s.stationTriplet === cfg.id);
    const dailyEl = {};
    (dSt?.data || []).forEach((el) => {
      const last = [...el.values].reverse().find((v) => v.value != null);
      dailyEl[el.stationElement.elementCode] = { last, peak: el.timingCentralTendencies?.medianPeak };
    });
    return { ...cfg, series, daily: dailyEl, stats: snotelStats(series) };
  });
}
const latest = (arr) => (arr && arr.length ? arr[arr.length - 1] : null);
function valueAt(arr, t, tolH = 2) {
  if (!arr) return null;
  let best = null, bestDiff = Infinity;
  for (const p of arr) {
    const diff = Math.abs(p.t - t);
    if (diff < bestDiff) { bestDiff = diff; best = p; }
  }
  return best && bestDiff <= tolH * 3600e3 ? best.v : null;
}
function snotelStats(s) {
  const dNow = latest(s.SNWD), wNow = latest(s.WTEQ), tNow = latest(s.TOBS), pNow = latest(s.PREC);
  const ref = (dNow || wNow || tNow)?.t || new Date();
  const ago = (h) => new Date(ref.getTime() - h * 3600e3);
  const delta = (arr, now, h) => (now && valueAt(arr, ago(h)) != null ? now.v - valueAt(arr, ago(h)) : null);
  const temps24 = (s.TOBS || []).filter((p) => p.t >= ago(24)).map((p) => p.v);
  const out = {
    time: ref, depth: dNow?.v ?? null,
    d24: delta(s.SNWD, dNow, 24), d48: delta(s.SNWD, dNow, 48), d72: delta(s.SNWD, dNow, 72),
    swe: wNow?.v ?? null, w24: delta(s.WTEQ, wNow, 24), w72: delta(s.WTEQ, wNow, 72),
    temp: tNow?.v ?? null, hi24: temps24.length ? Math.max(...temps24) : null, lo24: temps24.length ? Math.min(...temps24) : null,
    p24: delta(s.PREC, pNow, 24), p72: delta(s.PREC, pNow, 72),
  };
  out.density72 = out.d72 >= 2 && out.w72 > 0 ? (out.w72 / out.d72) * 100 : null;
  out.density24 = out.d24 >= 2 && out.w24 > 0 ? (out.w24 / out.d24) * 100 : null;
  return out;
}

function renderSnotelTable(stations) {
  const head = ['Station', 'Elev ft', 'Miles', 'Depth "', '24h Δ"', '48h Δ"', '72h Δ"', 'SWE "', '24h ΔSWE', '72h ΔSWE', 'SWE % med', 'Density 72h', 'Temp °F', '24h Hi/Lo', 'Precip 24h"', 'Reported'];
  const rows = stations.map((s) => {
    const x = s.stats;
    const med = s.daily.WTEQ?.last;
    const pct = med && med.median > 0 ? `${r0((med.value / med.median) * 100)}%` : med && med.median === 0 ? 'n/a' : '–';
    const cls = (v) => (v >= 2 ? ' class="hi"' : '');
    return `<tr><td><a href="https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=${s.id.split(':')[0]}" target="_blank" rel="noopener">${esc(s.name)}</a></td>
      <td>${ftFmt(s.ft)}</td><td>${s.mi}</td><td>${r0(x.depth)}</td>
      <td${cls(x.d24)}>${signed(x.d24)}</td><td${cls(x.d48)}>${signed(x.d48)}</td><td${cls(x.d72)}>${signed(x.d72)}</td>
      <td>${r1(x.swe)}</td><td>${signed(x.w24, 1)}</td><td>${signed(x.w72, 1)}</td><td>${pct}</td>
      <td>${x.density72 != null ? r0(x.density72) + '%' : '–'}</td><td>${r0(x.temp)}</td>
      <td>${r0(x.hi24)} / ${r0(x.lo24)}</td><td>${r1(x.p24)}</td>
      <td>${fmtTime(x.time, { month: 'short', day: 'numeric', hour: 'numeric' })}</td></tr>`;
  });
  $('snotel-table').innerHTML = `<thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody>`;
  $('snotel-primary').textContent = `${stations[0].name}, ${ftFmt(stations[0].ft)} ft`;
}

// ================================================================ NWS (forecast)
function parseDuration(iso) {
  const m = /P(?:(\d+)D)?(?:T(?:(\d+)H)?)?/.exec(iso);
  return (Number(m?.[1] || 0) * 24) + Number(m?.[2] || 0) || 1;
}
function expand(layer, accumulate = false) {
  const out = new Map();
  if (!layer?.values) return out;
  for (const { validTime, value } of layer.values) {
    const [start, dur] = validTime.split('/');
    const hours = parseDuration(dur);
    const t0 = new Date(start).getTime();
    const v = toImperial(value, layer.uom);
    for (let h = 0; h < hours; h++) out.set(t0 + h * 3600e3, accumulate && v != null ? v / hours : v);
  }
  return out;
}
async function loadNws() {
  const { office, x, y } = M.nws;
  const grid = await getJSON(`https://api.weather.gov/gridpoints/${office}/${x},${y}`);
  const p = grid.properties;
  const L = {
    temp: expand(p.temperature), chill: expand(p.windChill), dew: expand(p.dewpoint), rh: expand(p.relativeHumidity),
    wind: expand(p.windSpeed), gust: expand(p.windGust), dir: expand(p.windDirection), sky: expand(p.skyCover),
    pop: expand(p.probabilityOfPrecipitation), qpf: expand(p.quantitativePrecipitation, true),
    snow: expand(p.snowfallAmount, true), snowLevel: expand(p.snowLevel), vis: expand(p.visibility),
  };
  const startHour = Math.floor(Date.now() / 3600e3) * 3600e3;
  const rows = [];
  for (let i = 0; i < 96; i++) {
    const t = startHour + i * 3600e3;
    if (!L.temp.has(t)) continue;
    const g = (k) => L[k].get(t) ?? null;
    rows.push({
      t: new Date(t), temp: g('temp'), chill: g('chill'), dew: g('dew'), rh: g('rh'), wind: g('wind'), gust: g('gust'),
      dir: g('dir'), sky: g('sky'), pop: g('pop'), qpf: g('qpf'), snow: g('snow'), snowLevel: g('snowLevel'),
      vis: g('vis') != null ? g('vis') / 5280 : null,
    });
  }
  return { rows, elevFt: toImperial(p.elevation?.value, 'wmoUnit:m'), updated: new Date(p.updateTime) };
}
function renderNwsTable(nws) {
  $('nws-meta').textContent = `National Weather Service forecast for the ski area. This forecast area averages ${ftFmt(nws.elevFt)} ft, so expect stronger wind at the summit. Issued ${fmtTime(nws.updated, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}.`;
  const head = ['Time', 'Temp °F', 'Wind chill', 'Dewpt', 'RH %', 'Wind', 'Gust mph', 'Sky %', 'Precip %', 'Precip "', 'Snow "', 'Snow level ft', 'Vis mi'];
  let lastDay = '';
  const body = nws.rows.map((r) => {
    const day = localParts(r.t).date;
    const brk = lastDay && day !== lastDay ? ' class="day-break"' : '';
    lastDay = day;
    const rainy = r.qpf > 0.005 && r.snowLevel != null && r.snowLevel > M.zones[0].ft;
    return `<tr${brk}><td>${hourLabel(r.t)}</td><td>${r0(r.temp)}</td><td>${r0(r.chill)}</td><td>${r0(r.dew)}</td><td>${r0(r.rh)}</td>
      <td>${compass(r.dir)} ${r0(r.wind)}</td><td${r.gust >= 40 ? ' class="warn"' : ''}>${r0(r.gust)}</td><td>${r0(r.sky)}</td><td>${r0(r.pop)}</td>
      <td>${r.qpf != null ? r.qpf.toFixed(2) : '–'}</td><td${r.snow >= 0.5 ? ' class="hi"' : ''}>${r1(r.snow)}</td>
      <td${rainy ? ' class="warn"' : ''}>${ftFmt(r.snowLevel)}</td><td>${r1(r.vis)}</td></tr>`;
  });
  $('nws-table').innerHTML = `<thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${body.join('')}</tbody>`;
}

// ================================================================ Open-Meteo by elevation (forecast)
async function loadElevation() {
  const n = M.zones.length;
  const rep = (v) => Array(n).fill(v).join(',');
  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${rep(M.lat)}&longitude=${rep(M.lon)}&elevation=${M.zones.map((z) => Math.round(z.ft / 3.28084)).join(',')}`
    + '&hourly=temperature_2m,apparent_temperature,snowfall,rain,freezing_level_height,wind_gusts_10m'
    + '&daily=temperature_2m_max,temperature_2m_min,snowfall_sum,rain_sum,wind_speed_10m_max,wind_gusts_10m_max'
    + `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=${encodeURIComponent(TZ)}&forecast_days=7`;
  const data = await getJSON(url);
  return (Array.isArray(data) ? data : [data]).map((d, i) => {
    // Open-Meteo returns local wall-clock times for the requested zone; convert using its offset.
    const off = d.utc_offset_seconds * 1000;
    const times = d.hourly.time.map((t) => new Date(Date.parse(t + ':00Z') - off));
    const flFt = d.hourly_units?.freezing_level_height === 'm' ? d.hourly.freezing_level_height.map((v) => v * 3.28084) : d.hourly.freezing_level_height;
    return { zone: M.zones[i], ...d, times, flFt };
  });
}
function renderElevTable(zones) {
  const days = zones[0].daily.time;
  const head = ['Day', ...zones.flatMap((z) => [`${z.zone.name} Hi/Lo °F`, 'Snow "', 'Rain "', 'Gust mph'])];
  const body = days.map((day, i) => {
    const label = new Date(day + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const cells = zones.flatMap((z) => {
      const d = z.daily;
      return [`${r0(d.temperature_2m_max[i])} / ${r0(d.temperature_2m_min[i])}`, r1(d.snowfall_sum[i]), d.rain_sum[i]?.toFixed(2) ?? '–', r0(d.wind_gusts_10m_max[i])];
    });
    return `<tr><td>${label}</td>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
  });
  $('elev-table').innerHTML = `<thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body.join('')}</tbody>`;
}

// ================================================================ The Call: scoring
function skiWindow() {
  const now = new Date();
  const { date, hour } = localParts(now);
  const target = hour < 15 ? date : localParts(new Date(now.getTime() + 864e5)).date;
  return { date: target, today: target === date };
}

function computeCall() {
  const { snotel, nws, elev } = state;
  const win = skiWindow();
  const inWindow = (t) => { const p = localParts(t); return p.date === win.date && p.hour >= 9 && p.hour < 16; };
  const c = { win, why: [], chips: [] };
  let score = 5;

  // Fresh snow (measured)
  const pri = snotel?.[0]?.stats;
  if (pri) {
    const d24 = pri.d24 != null ? Math.max(0, pri.d24) : null;
    const d72 = pri.d72 != null ? Math.max(0, pri.d72) : null;
    c.snow = { d24, d72, density: pri.density24 ?? pri.density72, station: snotel[0].name, others: snotel.slice(1).map((s) => ({ name: s.name, d24: s.stats.d24 })) };
    score += Math.min(4, (d24 || 0) / 2) + Math.min(1.5, Math.max(0, (d72 || 0) - (d24 || 0)) / 6);
    if (d24 >= 2) c.why.push(`${r0(d24)}" of new snow was measured in the last 24 hours`);
    const med = snotel[0].daily.WTEQ?.last;
    c.pack = { depth: pri.depth, swe: pri.swe, median: med?.median ?? null, peak: snotel[0].daily.WTEQ?.peak?.value ?? null, station: snotel[0].name, ft: snotel[0].ft };
    c.pack.pct = c.pack.median > 0 ? Math.round((pri.swe / c.pack.median) * 100) : null;
    c.pack.cls = pri.depth != null && pri.depth < 6 ? 'bad' : pri.depth >= 36 ? 'good' : 'ok';
    if (c.pack.cls === 'bad') { score -= 2; c.why.push('the measured snowpack is still thin'); }
  }

  const winRows = nws?.rows.filter((r) => inWindow(r.t)) || [];
  if (nws && winRows.length) {
    const lastT = winRows.at(-1).t;
    const snowNow = nws.rows.filter((r) => r.t <= lastT).reduce((a, r) => a + (r.snow || 0), 0);
    const snow48 = nws.rows.slice(0, 48).reduce((a, r) => a + (r.snow || 0), 0);
    c.snow = { ...(c.snow || {}), forecast: snowNow, f48: snow48 };
    score += Math.min(1, snowNow / 4);

    // Rain / snow line
    const wet = winRows.filter((r) => r.qpf > 0.005);
    const wetIn = wet.reduce((a, r) => a + (r.qpf || 0), 0);
    const base = M.zones[0].ft, mid = M.zones[1].ft;
    const snowLevel = wet.length ? Math.max(...wet.map((r) => r.snowLevel ?? 0)) : null;
    c.rain = { wet: wet.length > 0, wetIn, snowLevel, cls: 'good' };
    if (wet.length && snowLevel > mid) c.rain.cls = 'bad';
    else if (wet.length && snowLevel > base) c.rain.cls = 'ok';
    if (c.rain.cls !== 'good' && wetIn > 0.1) { score -= snowLevel > mid ? 3 : 2; c.why.push('rain is in the forecast'); }

    // Wind
    const gust = Math.max(...winRows.map((r) => r.gust ?? 0));
    const wind = Math.max(...winRows.map((r) => r.wind ?? 0));
    const dir = meanDir(winRows.map((r) => r.dir).filter((d) => d != null));
    c.wind = { gust, wind, dir, elevFt: nws.elevFt, cls: 'good', text: 'Lifts should run normally.' };
    if (gust >= 55) { Object.assign(c.wind, { cls: 'bad', text: 'Widespread wind holds are likely, especially Summit and Northwest.' }); score -= 3; c.why.push('strong gusts may close lifts'); }
    else if (gust >= 40) { Object.assign(c.wind, { cls: 'bad', text: 'Upper lifts (Summit, Northwest) could go on wind hold.' }); score -= 1.5; c.why.push('gusty wind up high'); }
    else if (gust >= 25) { Object.assign(c.wind, { cls: 'ok', text: 'Breezy. Expect wind-affected snow up top.' }); score -= 0.5; }

    // Sky
    const sky = avg(winRows.map((r) => r.sky ?? 0));
    const vis = Math.min(...winRows.map((r) => r.vis ?? 10));
    c.sky = { avg: sky, vis, hours: winRows.map((r) => ({ t: r.t, sky: r.sky, snow: r.snow, pop: r.pop })) };
    c.sky.label = sky >= 80 ? 'Overcast' : sky >= 50 ? 'Mostly cloudy' : sky >= 25 ? 'Partly sunny' : 'Sunny';
    c.sky.cls = sky >= 80 ? 'bad' : sky >= 50 ? 'ok' : 'good';
    const d24 = c.snow?.d24 || 0;
    if (sky >= 80 && d24 < 3) score -= 1;
    if (sky < 30 && d24 >= 4) { score += 1; c.why.push('blue skies on top of fresh snow'); }

    // Temperatures by zone during the window (Open-Meteo), plus NWS wind chill
    const chill = Math.min(...winRows.map((r) => r.chill ?? r.temp ?? 99));
    c.temp = { chill, zones: [], cls: 'good', text: 'Comfortable, and the snow should stay wintry.' };
    if (elev) {
      c.temp.zones = elev.map((z) => {
        const vals = z.times.map((t, i) => [t, z.hourly.temperature_2m[i]]).filter(([t]) => inWindow(t)).map(([, v]) => v);
        return { ...z.zone, avg: avg(vals), max: vals.length ? Math.max(...vals) : null, min: vals.length ? Math.min(...vals) : null };
      });
      const fl = elev[0].times.map((t, i) => [t, elev[0].flFt[i]]).filter(([t]) => inWindow(t)).map(([, v]) => v);
      c.temp.freezing = avg(fl);
    }
    const baseMax = c.temp.zones[0]?.max;
    if (chill <= -5) { Object.assign(c.temp, { cls: 'bad', text: 'Bitter wind chill. Cover exposed skin.' }); score -= 1; c.why.push('bitter cold'); }
    else if (baseMax != null && baseMax >= 40) { Object.assign(c.temp, { cls: 'ok', text: 'Warm down low. The snow will turn soft and slushy in the afternoon.' }); if (d24 < 2) score -= 0.5; }
    else if (pri && pri.hi24 > 34 && (pri.lo24 ?? 99) < 30 && d24 < 2) { Object.assign(c.temp, { cls: 'ok', text: 'It thawed and refroze, so expect firm or icy snow early that softens later.' }); score -= 0.5; }
  }

  c.score = Math.round(clamp(score, 1, 10));
  const d24 = c.snow?.d24 || 0;
  c.headline = 'Firm, mixed conditions';
  if (d24 >= 8) c.headline = 'Powder day';
  else if (c.rain?.cls === 'bad') c.headline = 'Rain on the mountain';
  else if (c.wind?.gust >= 55) c.headline = 'Wind hold risk';
  else if (d24 >= 3) c.headline = 'Fresh snow on top';
  else if (c.snow?.forecast >= 3) c.headline = 'Snow is on the way';
  else if (c.pack?.cls === 'bad') c.headline = 'Early season, thin cover';
  else if (c.wind?.gust >= 40) c.headline = 'Windy up top';
  else if (c.sky?.cls === 'good') c.headline = 'Sunny groomer day';

  // Status chips (icon + label, never color alone)
  const icon = { good: '✓', ok: '!', bad: '✕', neutral: '•' };
  const push = (cls, label) => c.chips.push({ cls, label, icon: icon[cls] });
  if (c.snow) push(d24 >= 6 ? 'good' : d24 >= 2 ? 'ok' : 'neutral', d24 >= 2 ? `${r0(d24)}" new` : 'No new snow');
  if (c.rain) push(c.rain.cls, c.rain.cls === 'good' ? (c.rain.wet ? 'Snow to the base' : 'Dry') : 'Rain risk');
  if (c.wind) push(c.wind.cls, c.wind.cls === 'good' ? 'Calm lifts' : c.wind.cls === 'ok' ? 'Breezy' : 'Wind holds');
  if (c.sky) push(c.sky.cls, c.sky.label);
  if (c.temp) push(c.temp.cls, c.temp.cls === 'good' ? 'Good temps' : c.temp.chill <= -5 ? 'Bitter cold' : 'Soft / icy snow');
  return c;
}

// ================================================================ The Call: visuals
function statusColor(cls) { return cls === 'good' ? cssVar('--good') : cls === 'ok' ? cssVar('--warning') : cls === 'bad' ? cssVar('--critical') : cssVar('--muted'); }

function renderCall(c) {
  const dayName = new Date(c.win.date + 'T12:00').toLocaleDateString('en-US', isMobile() ? { weekday: 'short', month: 'short', day: 'numeric' } : { weekday: 'long', month: 'short', day: 'numeric' });
  $('call-day').textContent = `${isMobile() ? '' : 'The Call · '}${c.win.today ? 'Today' : 'Tomorrow'}, ${dayName} · 9am–4pm`;
  $('call-headline').textContent = c.headline;
  $('call-text').textContent = c.why.length ? `Mainly because ${c.why.join(', ')}.` : 'No single factor stands out. Tap any card for details.';
  $('call-chips').innerHTML = c.chips.map((ch, i) => `<span class="chip ${ch.cls}" style="animation-delay:${0.15 + i * 0.08}s"><i aria-hidden="true">${ch.icon}</i>${esc(ch.label)}</span>`).join('');

  const scoreCls = c.score >= 7 ? 'good' : c.score >= 4 ? 'ok' : 'bad';
  const fill = $('g-fill');
  fill.style.stroke = statusColor(scoreCls);
  requestAnimationFrame(() => { fill.style.strokeDashoffset = 100 - c.score * 10; });
  countUp($('score'), c.score);

  renderMountain(c);
  renderSnow(c);
  renderWind(c);
  renderSky(c);
  renderPack(c);
}

// --- Mountain profile: temperatures at each elevation + snow line
function renderMountain(c) {
  const svg = $('mtn-svg');
  svg.innerHTML = '';
  const W = 400, H = 230, LO = 4500, HI = 10000;
  const y = (ft) => H - 12 - ((ft - LO) / (HI - LO)) * (H - 30);
  const summit = M.zones[M.zones.length - 1].ft;
  const peak = { x: 228, y: y(summit) };
  const leftFoot = { x: 6, y: H - 12 }, rightFoot = { x: 396, y: H - 22 };
  const onLeft = (ft) => { const yy = y(ft); return { x: leftFoot.x + ((leftFoot.y - yy) / (leftFoot.y - peak.y)) * (peak.x - leftFoot.x), y: yy }; };
  const shape = `M${leftFoot.x},${H} L${leftFoot.x},${leftFoot.y} L70,${y(6000)} L120,${y(6900)} L150,${y(7400)} L182,${y(8300)} L${peak.x},${peak.y} L250,${y(8800)} L282,${y(8000)} L330,${y(7200)} L${rightFoot.x},${rightFoot.y} L${rightFoot.x},${H} Z`;

  const defs = svgEl('defs', {}, svg);
  const sky = svgEl('linearGradient', { id: 'skyg', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  svgEl('stop', { offset: '0', 'stop-color': cssVar('--sky-1') }, sky);
  svgEl('stop', { offset: '1', 'stop-color': cssVar('--sky-2') }, sky);
  const clip = svgEl('clipPath', { id: 'mclip' }, defs);
  svgEl('path', { d: shape }, clip);
  svgEl('rect', { x: 0, y: 0, width: W, height: H, rx: 10, fill: 'url(#skyg)' }, svg);
  // Distant ridge
  svgEl('path', { d: `M0,${y(6400)} L60,${y(7000)} L110,${y(6600)} L170,${y(7300)} L210,${y(6900)} L300,${y(7600)} L360,${y(6800)} L400,${y(7100)} L400,${H} L0,${H} Z`, fill: cssVar('--rock'), opacity: 0.25 }, svg);

  const g = svgEl('g', { 'clip-path': 'url(#mclip)' }, svg);
  svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: cssVar('--snow') }, g);
  // Tree line along the lower slopes
  for (let tx = 4; tx < W; tx += 9) {
    const ty = H - 6 - (Math.sin(tx * 0.7) + 1) * 6;
    svgEl('path', { d: `M${tx},${ty} l5,-14 l5,14 Z`, fill: cssVar('--forest'), opacity: 0.85 }, g);
  }
  // Tint the part of the mountain that is above freezing (or getting rain).
  const lineFt = c.rain?.wet ? c.rain.snowLevel : c.temp?.freezing;
  const lineY = lineFt != null ? clamp(y(lineFt), -10, H) : H;
  const warm = svgEl('rect', { x: 0, y: Math.max(0, lineY), width: W, height: Math.max(0, H - lineY), fill: color(cssVar(c.rain?.wet ? '--s1' : '--serious'), 0.38) }, g);
  grow(warm, 'bottom', 1.6, 0.2);
  svgEl('path', { d: shape, fill: 'none', stroke: cssVar('--rock'), 'stroke-width': 1.5, opacity: 0.7 }, svg);

  // Snow / freezing line
  if (lineFt != null && lineY > 0 && lineY < H - 4) {
    const ln = svgEl('g', { class: 'snowline' }, svg);
    svgEl('line', { x1: 0, x2: W, y1: lineY, y2: lineY, stroke: cssVar('--s1'), 'stroke-width': 2, 'stroke-dasharray': '6 5' }, ln);
    const label = `${c.rain?.wet ? 'Snow line' : 'Freezing level'} ${ftFmt(lineFt)} ft`;
    const ly = lineY < 30 ? lineY + 6 : lineY - 21;
    svgEl('rect', { x: W - 154, y: ly, width: 150, height: 17, rx: 8, fill: cssVar('--surface'), opacity: 0.92 }, ln);
    const t = svgEl('text', { x: W - 79, y: ly + 12, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: cssVar('--text') }, ln);
    t.textContent = label;
    bindTip(ln, c.rain?.wet ? 'Highest forecast snow level during precipitation. Above it is snow, below it is rain.' : 'Average forecast freezing level during ski hours. Above it stays frozen, below it can soften.');
  } else if (lineFt != null && lineY <= 0) {
    svgEl('rect', { x: W / 2 - 130, y: 6, width: 260, height: 18, rx: 9, fill: cssVar('--surface'), opacity: 0.92 }, svg);
    const t = svgEl('text', { x: W / 2, y: 19, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: cssVar('--text') }, svg);
    t.textContent = `${c.rain?.wet ? 'Rain to the summit' : 'Above freezing to the summit'} · ${c.rain?.wet ? 'snow line' : 'freezing level'} ${ftFmt(lineFt)} ft`;
  } else if (lineFt != null) {
    svgEl('rect', { x: W / 2 - 100, y: 6, width: 200, height: 18, rx: 9, fill: cssVar('--surface'), opacity: 0.92 }, svg);
    const t = svgEl('text', { x: W / 2, y: 19, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: cssVar('--text') }, svg);
    t.textContent = `Below freezing top to bottom (${ftFmt(lineFt)} ft)`;
  }
  // Key
  const key = svgEl('g', {}, svg);
  svgEl('rect', { x: 4, y: H - 26, width: c.rain?.wet ? 82 : 158, height: 20, rx: 10, fill: cssVar('--surface'), opacity: 0.92 }, key);
  svgEl('rect', { x: 8, y: H - 22, width: 12, height: 12, rx: 3, fill: color(cssVar(c.rain?.wet ? '--s1' : '--serious'), 0.6) }, key);
  const kt = svgEl('text', { x: 25, y: H - 12, 'font-size': 10, 'font-weight': 600, fill: cssVar('--text') }, key);
  kt.textContent = c.rain?.wet ? 'Rain zone' : 'Above freezing (softening)';

  // Zone markers with temperatures
  const zones = c.temp?.zones?.length ? c.temp.zones : M.zones;
  zones.forEach((z, i) => {
    const p = i === zones.length - 1 ? peak : onLeft(z.ft);
    const grp = svgEl('g', { class: 'zone', opacity: 0 }, svg);
    grp.style.transition = `opacity .6s ease ${0.4 + i * 0.2}s`;
    svgEl('circle', { cx: p.x, cy: p.y, r: 5, fill: cssVar('--text'), stroke: cssVar('--surface'), 'stroke-width': 2 }, grp);
    const bw = 108;
    const bx = i === zones.length - 1 ? p.x + 12 : clamp(p.x - bw - 12, 2, W);
    const by = p.y - (i === zones.length - 1 ? 22 : 17);
    svgEl('rect', { x: bx, y: by, width: bw, height: 34, rx: 8, fill: cssVar('--surface'), stroke: cssVar('--line') }, grp);
    const tt = svgEl('text', { x: bx + 8, y: by + 15, 'font-size': 14, 'font-weight': 800, fill: cssVar('--text') }, grp);
    tt.textContent = z.avg != null ? `${r0(z.avg)}°F` : '–';
    const tn = svgEl('text', { x: bx + 8, y: by + 28, 'font-size': 9.5, fill: cssVar('--text-2') }, grp);
    tn.textContent = `${z.name.replace(' base', '').replace(' (mid)', '')} · ${ftFmt(z.ft)}′`;
    bindTip(grp, `${z.name} (${ftFmt(z.ft)} ft): average ${r0(z.avg)}°F during ski hours, range ${r0(z.min)}–${r0(z.max)}°F.`);
    requestAnimationFrame(() => requestAnimationFrame(() => grp.setAttribute('opacity', 1)));
  });

  const rain = c.rain;
  let cap = c.temp ? c.temp.text : '';
  if (rain?.wet) cap = rain.cls === 'bad' ? `Rain likely up past mid-mountain. ${cap}` : rain.cls === 'ok' ? `Rain possible at the base, snow higher up. ${cap}` : `Snow all the way to the base (${rain.wetIn.toFixed(2)}" of water). ${cap}`;
  if (c.temp?.chill != null && Number.isFinite(c.temp.chill)) cap += ` Lowest wind chill ${r0(c.temp.chill)}°F.`;
  $('mtn-cap').textContent = cap;
}

// --- Snow stake meter
function renderSnow(c) {
  const s = c.snow || {};
  const svg = $('stake-svg');
  svg.innerHTML = '';
  const max = Math.max(12, Math.ceil(((s.d72 || 0) + (s.forecast || 0)) / 6) * 6);
  const top = 10, bot = 160, x = 46, w = 28;
  const yv = (v) => bot - (v / max) * (bot - top);
  // Ticks
  for (let v = 0; v <= max; v += max / 6) {
    svgEl('line', { x1: x - 6, x2: x, y1: yv(v), y2: yv(v), stroke: cssVar('--muted'), 'stroke-width': 1 }, svg);
    const t = svgEl('text', { x: x - 9, y: yv(v) + 3.5, 'text-anchor': 'end', 'font-size': 10, fill: cssVar('--text-2') }, svg);
    t.textContent = v;
  }
  svgEl('rect', { x, y: top, width: w, height: bot - top, rx: 4, fill: color(cssVar('--s1'), 0.12) }, svg);
  const bars = [
    { v: (s.d72 || 0) + (s.forecast || 0), base: s.d72 || 0, fill: 'none', dash: true },
    { v: s.d72 || 0, fill: color(cssVar('--s1'), 0.45) },
    { v: s.d24 || 0, fill: cssVar('--s1') },
  ];
  bars.forEach((b, i) => {
    if (b.dash) {
      if (!(s.forecast > 0.2)) return;
      const r = svgEl('rect', { x: x + 1, y: yv(b.v), width: w - 2, height: Math.max(0, yv(b.base) - yv(b.v)), rx: 4, fill: 'none', stroke: cssVar('--s1'), 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, svg);
      r.style.opacity = 0; r.style.transition = 'opacity .6s ease 1.2s';
      requestAnimationFrame(() => requestAnimationFrame(() => { r.style.opacity = 1; }));
      return;
    }
    if (!(b.v > 0)) return;
    const r = svgEl('rect', { x, width: w, rx: 4, fill: b.fill, y: yv(b.v), height: bot - yv(b.v) }, svg);
    grow(r, 'bottom', 1.3, i * 0.15);
  });
  svgEl('line', { x1: x - 8, x2: x + w + 8, y1: bot, y2: bot, stroke: cssVar('--text-2'), 'stroke-width': 1.5 }, svg);
  bindTip(svg, `Solid: 24 hours (${r0(s.d24)}"). Light: 72 hours (${r0(s.d72)}"). Dashed: forecast before lifts close (${r1(s.forecast)}").`);

  countUp($('snow24'), s.d24 ?? null);
  countUp($('snow72'), s.d72 ?? null);
  countUp($('snowF'), s.forecast ?? null, 1);
  const dens = s.density;
  const quality = dens == null ? '' : dens < 7 ? ' Light, dry powder.' : dens <= 12 ? ' Medium-density snow.' : ' Heavy, wet snow.';
  const others = (s.others || []).map((o) => `${o.name} ${signed(o.d24)}"`).join(', ');
  $('snow-cap').textContent = `Measured at the ${s.station || 'SNOTEL'} station.${quality}${others ? ` Others: ${others}.` : ''} Check the stake cam for the on-mountain total.`;

  // Falling snowflakes when it is snowing or about to.
  const flakes = $('flakes');
  flakes.innerHTML = '';
  const intensity = clamp(Math.round((s.forecast || 0) * 6 + (s.d24 || 0)), 0, 26);
  if (!REDUCED && intensity > 0) {
    for (let i = 0; i < intensity; i++) {
      const f = document.createElement('span');
      const size = 3 + Math.random() * 4;
      f.style.cssText = `left:${Math.random() * 100}%;width:${size}px;height:${size}px;animation-duration:${4 + Math.random() * 5}s;animation-delay:${-Math.random() * 8}s;--dx:${(Math.random() * 30 - 15).toFixed(0)}px`;
      flakes.appendChild(f);
    }
  }
}

// --- Wind compass + gust dial
function renderWind(c) {
  const w = c.wind;
  const svg = $('wind-svg');
  svg.innerHTML = '';
  const cx = 100, cy = 100, R = 82;
  if (!w) return;
  const maxG = 70;
  const arc = (r, f) => {
    const a0 = -220 * Math.PI / 180, a1 = a0 + f * 260 * Math.PI / 180;
    const p = (a) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    return `M${p(a0)} A${r},${r} 0 ${f * 260 > 180 ? 1 : 0} 1 ${p(a1)}`;
  };
  // Gust track and zones
  svgEl('path', { d: arc(R, 1), fill: 'none', stroke: cssVar('--line'), 'stroke-width': 10, 'stroke-linecap': 'round' }, svg);
  const gustArc = svgEl('path', { d: arc(R, clamp(w.gust / maxG, 0.001, 1)), fill: 'none', stroke: statusColor(w.cls), 'stroke-width': 10, 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': 100, 'stroke-dashoffset': 100 }, svg);
  gustArc.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)';
  requestAnimationFrame(() => requestAnimationFrame(() => gustArc.setAttribute('stroke-dashoffset', 0)));
  // 40 mph hold-risk tick
  const holdA = (-220 + (40 / maxG) * 260) * Math.PI / 180;
  svgEl('line', { x1: cx + (R - 9) * Math.cos(holdA), y1: cy + (R - 9) * Math.sin(holdA), x2: cx + (R + 9) * Math.cos(holdA), y2: cy + (R + 9) * Math.sin(holdA), stroke: cssVar('--text'), 'stroke-width': 2 }, svg);
  // Compass
  svgEl('circle', { cx, cy, r: 52, fill: cssVar('--surface'), stroke: cssVar('--line') }, svg);
  ['N', 'E', 'S', 'W'].forEach((d, i) => {
    const a = (i * 90 - 90) * Math.PI / 180;
    const t = svgEl('text', { x: cx + 41 * Math.cos(a), y: cy + 41 * Math.sin(a) + 4, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: cssVar('--text-2') }, svg);
    t.textContent = d;
  });
  // Arrow points downwind (wind blows FROM w.dir).
  const g = svgEl('g', { class: 'wind-arrow' }, svg);
  svgEl('path', { d: `M${cx},${cy - 30} L${cx + 9},${cy - 12} L${cx + 3},${cy - 12} L${cx + 3},${cy + 28} L${cx - 3},${cy + 28} L${cx - 3},${cy - 12} L${cx - 9},${cy - 12} Z`, fill: cssVar('--s1') }, g);
  g.style.transform = 'rotate(0deg)';
  const rot = ((w.dir ?? 0) + 180) % 360;
  requestAnimationFrame(() => requestAnimationFrame(() => { g.style.transform = `rotate(${rot}deg)`; }));
  const num = svgEl('text', { x: cx, y: cy + 80, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: cssVar('--text') }, svg);
  num.textContent = `${r0(w.gust)}`;
  const unit = svgEl('text', { x: cx, y: cy + 94, 'text-anchor': 'middle', 'font-size': 10, fill: cssVar('--text-2') }, svg);
  unit.textContent = 'mph gusts';
  bindTip(svg, `Peak gust ${r0(w.gust)} mph, sustained up to ${r0(w.wind)} mph from the ${compass(w.dir)}, at about ${ftFmt(w.elevFt)} ft. The black tick marks 40 mph, where upper lifts start to risk wind holds.`);
  $('wind-cap').innerHTML = `<span class="st ${w.cls}"><i aria-hidden="true">${w.cls === 'good' ? '✓' : w.cls === 'ok' ? '!' : '✕'}</i>${w.cls === 'good' ? 'Lifts OK' : w.cls === 'ok' ? 'Breezy' : 'Hold risk'}</span> From the ${compass(w.dir)}, up to ${r0(w.wind)} mph. ${esc(w.text)}`;
}

// --- Sky icon + hourly ribbon
function renderSky(c) {
  const s = c.sky;
  const svg = $('sky-icon');
  svg.innerHTML = '';
  if (!s) return;
  const cover = clamp(s.avg / 100, 0, 1);
  const sun = svgEl('g', {}, svg);
  svgEl('circle', { cx: 44, cy: 38, r: 18, fill: cssVar('--warning') }, sun);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    svgEl('line', { x1: 44 + 24 * Math.cos(a), y1: 38 + 24 * Math.sin(a), x2: 44 + 31 * Math.cos(a), y2: 38 + 31 * Math.sin(a), stroke: cssVar('--warning'), 'stroke-width': 3, 'stroke-linecap': 'round' }, sun);
  }
  if (!REDUCED) { sun.style.transformOrigin = '44px 38px'; sun.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 40000, iterations: Infinity }); }
  sun.setAttribute('opacity', (1 - cover * 0.75).toFixed(2));
  const cloud = svgEl('path', { d: 'M40 78 a18 18 0 0 1 4-35 a24 24 0 0 1 45 6 a15 15 0 0 1 2 29 Z', fill: cssVar('--rock'), opacity: (0.25 + cover * 0.75).toFixed(2) }, svg);
  if (!REDUCED) cloud.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }], { duration: 3500, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' });
  if ((c.snow?.forecast || 0) > 0.2) {
    for (let i = 0; i < 3; i++) svgEl('circle', { cx: 52 + i * 14, cy: 86, r: 2.5, fill: cssVar('--s1') }, svg);
  }
  $('sky-label').textContent = s.label;
  $('sky-sub').textContent = `${r0(s.avg)}% cloud · ${r1(s.vis)} mi visibility`;

  const rib = $('ribbon');
  const sky1 = cssVar('--s1');
  rib.innerHTML = s.hours.map((h, i) => {
    const a = clamp((h.sky ?? 0) / 100, 0, 1);
    return `<div style="background:${color(sky1, 0.08 + a * 0.5)};animation-delay:${i * 0.05}s" data-i="${i}">${h.snow > 0.05 ? '<b>❄</b>' : ''}${isMobile() ? fmtTime(h.t, { hour: 'numeric' }).split(' ')[0] : fmtTime(h.t, { hour: 'numeric' }).replace(' ', '').toLowerCase()}</div>`;
  }).join('');
  rib.querySelectorAll('div').forEach((d) => {
    const h = s.hours[d.dataset.i];
    bindTip(d, `${fmtTime(h.t, { hour: 'numeric' })}: ${r0(h.sky)}% cloud cover, ${r0(h.pop)}% chance of precipitation${h.snow > 0.05 ? `, ${r1(h.snow)}" snow` : ''}.`);
  });
  $('sky-cap').innerHTML = `<span class="st ${s.cls}"><i aria-hidden="true">${s.cls === 'good' ? '✓' : s.cls === 'ok' ? '!' : '✕'}</i>${s.cls === 'bad' ? 'Flat light' : s.cls === 'ok' ? 'Mixed light' : 'Good light'}</span> Darker blocks mean more cloud.`;
}

// --- Snowpack meter (SWE vs median peak)
function renderPack(c) {
  const p = c.pack;
  if (!p) return;
  countUp($('pack-depth'), p.depth ?? null);
  $('pack-sub').textContent = `depth · ${r1(p.swe)}" water`;
  const peak = p.peak || Math.max(p.swe || 0, 1);
  requestAnimationFrame(() => {
    $('pack-fill').style.width = `${clamp((p.swe || 0) / peak, 0, 1) * 100}%`;
    $('pack-mark').style.left = `${clamp((p.median || 0) / peak, 0, 1) * 100}%`;
  });
  $('pack-peak').textContent = `${r1(peak)}" typical peak`;
  bindTip($('pack-meter'), `Bar: water content now (${r1(p.swe)}"). Black mark: typical for this date (${r1(p.median)}"). Full width: typical seasonal peak (${r1(peak)}").`);
  const pct = p.pct != null ? `${p.pct}% of normal for the date. ` : '';
  $('pack-cap').innerHTML = `<span class="st ${p.cls}"><i aria-hidden="true">${p.cls === 'good' ? '✓' : p.cls === 'ok' ? '!' : '✕'}</i>${p.cls === 'bad' ? 'Thin' : p.cls === 'ok' ? 'Building' : 'Deep'}</span> ${pct}At ${esc(p.station)} (${ftFmt(p.ft)} ft, below the base).`;
}

// hex + alpha -> rgba
function color(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// ================================================================ Charts (one axis each, small multiples)
const refLinePlugin = {
  id: 'refLines',
  afterDatasetsDraw(chart, _args, opts) {
    const lines = opts?.lines || [];
    const { ctx, chartArea, scales } = chart;
    lines.forEach((l) => {
      const yy = scales.y.getPixelForValue(l.y);
      if (yy < chartArea.top || yy > chartArea.bottom) return;
      ctx.save();
      ctx.strokeStyle = l.color || cssVar('--text-2');
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(chartArea.left, yy); ctx.lineTo(chartArea.right, yy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cssVar('--text-2');
      ctx.font = '600 10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(l.label, chartArea.right - 4, yy - 4);
      ctx.restore();
    });
  },
};
if (window.Chart) {
  Chart.register(refLinePlugin);
  Chart.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
}

function chartOpts({ legend = true, refLines = [], yMin, stacked = false, xTicks } = {}) {
  const grid = cssVar('--grid'), text = cssVar('--text-2');
  const mobile = isMobile();
  return {
    responsive: true, maintainAspectRatio: false,
    animation: REDUCED ? false : { duration: 900, easing: 'easeOutQuart' },
    animations: REDUCED ? {} : { y: { from: (ctx) => (ctx.type === 'data' ? ctx.chart.chartArea?.bottom : undefined), duration: 900, easing: 'easeOutQuart' } },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: legend, align: 'start', labels: { color: text, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'rectRounded', font: { size: 11 } } },
      tooltip: { backgroundColor: cssVar('--text'), titleColor: cssVar('--surface'), bodyColor: cssVar('--surface'), padding: 10, cornerRadius: 8, boxPadding: 4, usePointStyle: true },
      refLines: { lines: refLines },
    },
    elements: { line: { borderWidth: 2, tension: 0.35, borderCapStyle: 'round', borderJoinStyle: 'round' }, point: { radius: 0, hoverRadius: 5, hitRadius: 12, hoverBorderWidth: 2, hoverBorderColor: cssVar('--surface') } },
    scales: {
      x: { stacked, ticks: { color: text, maxRotation: 0, autoSkip: true, maxTicksLimit: xTicks || (mobile ? 4 : 7), font: { size: 10 } }, grid: { display: false }, border: { color: grid } },
      y: { stacked, min: yMin, ticks: { color: text, font: { size: 10 }, maxTicksLimit: mobile ? 5 : 6 }, grid: { color: grid }, border: { display: false } },
    },
  };
}
function lineDs(label, data, colorVar, fill = false) {
  const c = cssVar(colorVar);
  return { label, data, borderColor: c, backgroundColor: fill ? color(c, 0.1) : c, fill: fill ? 'origin' : false, pointBackgroundColor: c, spanGaps: true };
}
function barDs(label, data, colorVar) {
  const c = cssVar(colorVar);
  return { label, data, backgroundColor: c, borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'start', maxBarThickness: 24, categoryPercentage: 0.8, barPercentage: 0.9 };
}
function drawChart(id, config) {
  if (!window.Chart) return;
  const el = $(id);
  if (!el || el.offsetParent === null) return; // only draw visible charts
  charts[id]?.destroy();
  charts[id] = new Chart(el, config);
}

function drawMeasuredCharts() {
  const st = state.snotel;
  if (!st) return;
  const p = st[0];
  const temps = p.series.TOBS || [];
  const depth = p.series.SNWD || [];
  drawChart('c-depth', { type: 'line', data: { labels: depth.map((x) => hourLabel(x.t)), datasets: [lineDs('Snow depth', depth.map((x) => x.v), '--s1', true)] }, options: chartOpts({ legend: false, yMin: 0 }) });
  drawChart('c-temp7', { type: 'line', data: { labels: temps.map((x) => hourLabel(x.t)), datasets: [lineDs('Air temp', temps.map((x) => x.v), '--s2')] }, options: chartOpts({ legend: false, refLines: [{ y: 32, label: '32°F freezing' }] }) });
  drawChart('c-newsnow', {
    type: 'bar',
    data: {
      labels: st.map((s) => s.name),
      datasets: [
        barDs('24 hrs', st.map((s) => Math.max(0, s.stats.d24 ?? 0)), '--s1'),
        barDs('48 hrs', st.map((s) => Math.max(0, s.stats.d48 ?? 0)), '--s2'),
        barDs('72 hrs', st.map((s) => Math.max(0, s.stats.d72 ?? 0)), '--s3'),
      ],
    },
    options: { ...chartOpts({ yMin: 0 }), interaction: { mode: 'nearest', intersect: true } },
  });
}

function drawForecastCharts() {
  const nws = state.nws;
  if (!nws) return;
  const rows = nws.rows.slice(0, 72);
  const labels = rows.map((r) => hourLabel(r.t));
  drawChart('c-snowfall', { type: 'bar', data: { labels, datasets: [barDs('Snowfall', rows.map((r) => r.snow), '--s1')] }, options: chartOpts({ legend: false, yMin: 0 }) });
  drawChart('c-ftemp', { type: 'line', data: { labels, datasets: [lineDs('Temperature', rows.map((r) => r.temp), '--s1'), lineDs('Wind chill', rows.map((r) => r.chill), '--s2')] }, options: chartOpts({ refLines: [{ y: 32, label: '32°F' }] }) });
  drawChart('c-wind', { type: 'line', data: { labels, datasets: [lineDs('Sustained', rows.map((r) => r.wind), '--s1', true), lineDs('Gusts', rows.map((r) => r.gust), '--s2')] }, options: chartOpts({ yMin: 0, refLines: [{ y: 40, label: '40 mph hold risk' }] }) });
  const lv = rows.map((r) => r.snowLevel);
  const zoneLines = M.zones.filter((z) => z.key !== 'mid').map((z) => ({ y: z.ft, label: `${z.name} ${ftFmt(z.ft)}′` }));
  drawChart('c-snowlevel', { type: 'line', data: { labels, datasets: [lineDs('Snow level', lv, '--s1', true)] }, options: { ...chartOpts({ legend: false, refLines: zoneLines }), scales: { ...chartOpts().scales, y: { ...chartOpts().scales.y, suggestedMin: 4000, suggestedMax: 10000 } } } });
}

function drawElevationCharts() {
  const z = state.elev;
  if (!z) return;
  const now = Date.now();
  const idx = z[0].times.map((t, i) => [t, i]).filter(([t]) => t.getTime() >= now - 3600e3).slice(0, 72);
  const labels = idx.map(([t]) => hourLabel(t));
  const vars = ['--s1', '--s2', '--s3'];
  drawChart('c-etemp', { type: 'line', data: { labels, datasets: z.map((zz, k) => lineDs(`${zz.zone.name}`, idx.map(([, i]) => zz.hourly.temperature_2m[i]), vars[k % 3])) }, options: chartOpts({ refLines: [{ y: 32, label: '32°F' }] }) });
  const days = z[0].daily.time.map((d) => new Date(d + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' }));
  drawChart('c-esnow', { type: 'bar', data: { labels: days, datasets: z.map((zz, k) => barDs(zz.zone.name, zz.daily.snowfall_sum, vars[k % 3])) }, options: { ...chartOpts({ yMin: 0 }), interaction: { mode: 'index', intersect: false } } });
  const zoneLines = M.zones.map((zz) => ({ y: zz.ft, label: `${zz.name} ${ftFmt(zz.ft)}′` }));
  drawChart('c-freeze', { type: 'line', data: { labels, datasets: [lineDs('Freezing level', idx.map(([, i]) => z[0].flFt[i]), '--s1', true)] }, options: chartOpts({ legend: false, refLines: zoneLines, xTicks: isMobile() ? 4 : 10 }) });
}

function drawActiveTab() {
  if (activeTab === 'measured') drawMeasuredCharts();
  if (activeTab === 'forecast') drawForecastCharts();
  if (activeTab === 'elevation') drawElevationCharts();
  if (activeTab === 'radar') { initRadar(); setTimeout(() => map?.invalidateSize(), 50); }
}

// ================================================================ Tabs
function setupTabs() {
  const btns = [...document.querySelectorAll('.tabs [role="tab"]')];
  const ink = $('tab-ink');
  const moveInk = () => {
    const b = btns.find((x) => x.dataset.tab === activeTab);
    ink.style.left = `${b.offsetLeft}px`;
    ink.style.width = `${b.offsetWidth}px`;
  };
  btns.forEach((b) => b.addEventListener('click', () => {
    activeTab = b.dataset.tab;
    btns.forEach((x) => x.setAttribute('aria-selected', x === b));
    document.querySelectorAll('.tab-panel').forEach((p) => { p.hidden = p.dataset.panel !== activeTab; });
    moveInk();
    b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
    drawActiveTab();
  }));
  window.addEventListener('resize', moveInk);
  requestAnimationFrame(moveInk);
}

// ================================================================ Forecast discussion
async function loadAfd() {
  const list = await getJSON(`https://api.weather.gov/products/types/AFD/locations/${M.nws.office}`);
  const first = list['@graph']?.[0];
  if (!first) return;
  const prod = await getJSON(first['@id']);
  $('afd-summary').textContent = `Area Forecast Discussion from NWS ${M.nws.office === 'PDT' ? 'Pendleton' : M.nws.office}, issued ${fmtTime(new Date(prod.issuanceTime), { weekday: 'short', hour: 'numeric', minute: '2-digit' })}. This is the forecasters' own write-up of what they expect and why.`;
  $('afd').textContent = prod.productText;
}

// ================================================================ Webcams
let camIndex = 0;
const camUrl = (src) => `${src}${src.includes('?') ? '&' : '?'}t=${Math.floor(Date.now() / 60000)}`;
function swapImg(img, src) {
  if (REDUCED) { img.src = src; return; }
  const pre = new Image();
  pre.onload = () => { img.classList.add('fading'); setTimeout(() => { img.src = src; img.classList.remove('fading'); }, 250); };
  pre.onerror = () => { img.src = src; };
  pre.src = src;
}
function showCam(i, fromUser) {
  camIndex = i;
  const cam = M.cams[i];
  swapImg($('cam-main'), camUrl(cam.src));
  $('cam-main').alt = `${cam.name} webcam`;
  $('cam-main-link').href = cam.src;
  $('cam-title').textContent = cam.name;
  $('cam-why').textContent = cam.why;
  document.querySelectorAll('#thumbs button').forEach((b, k) => b.setAttribute('aria-selected', k === i));
  if (fromUser) document.querySelectorAll('#thumbs button')[i]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}
function renderCams() {
  swapImg($('stake'), camUrl(M.snowStake.src));
  $('stake-link').href = M.snowStake.src;
  $('stake-note').textContent = `${M.snowStake.name}, ${ftFmt(M.snowStake.ft)} ft. ${M.snowStake.note}`;
  $('stations').src = camUrl(M.stationGraphic);
  $('stations-link').href = M.stationGraphic;
  const thumbs = $('thumbs');
  if (!thumbs.children.length) {
    thumbs.innerHTML = M.cams.map((c, i) => `<button role="tab" type="button" aria-selected="${i === 0}" data-i="${i}"><img alt="" loading="lazy"><span>${esc(c.name)}</span></button>`).join('');
    thumbs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => showCam(Number(b.dataset.i), true)));
  }
  thumbs.querySelectorAll('button').forEach((b) => { b.querySelector('img').src = camUrl(M.cams[b.dataset.i].src); });
  showCam(camIndex);
  $('cams-updated').textContent = `Refreshed ${fmtTime(new Date(), { hour: 'numeric', minute: '2-digit' })}`;
}

// ================================================================ Radar (animated loop)
let map, radarFrames = [], radarLayers = [], radarPos = 0, radarTimer = null, radarPlaying = true;
async function initRadar() {
  if (map) return;
  map = L.map('map', { scrollWheelZoom: false, zoomControl: !isMobile() }).setView([M.lat, M.lon], 7);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  L.circleMarker([M.lat, M.lon], { radius: 7, color: '#fff', weight: 2, fillColor: cssVar('--s2'), fillOpacity: 1 }).addTo(map).bindPopup(M.name);
  try {
    const data = await getJSON('https://api.rainviewer.com/public/weather-maps.json');
    radarFrames = data.radar.past;
    radarLayers = radarFrames.map((f) => L.tileLayer(`${data.host}${f.path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: 0, maxNativeZoom: 7, maxZoom: 12, attribution: 'Radar &copy; RainViewer' }).addTo(map));
    radarPos = radarFrames.length - 1;
    showRadarFrame(radarPos);
    if (!REDUCED) startRadar(); else { radarPlaying = false; $('radar-play').textContent = 'Play'; }
  } catch (e) { console.warn('Radar unavailable', e); $('radar-time').textContent = 'Radar unavailable right now.'; }
  $('radar-play').addEventListener('click', () => {
    radarPlaying = !radarPlaying;
    $('radar-play').textContent = radarPlaying ? 'Pause' : 'Play';
    radarPlaying ? startRadar() : clearInterval(radarTimer);
  });
}
function showRadarFrame(i) {
  radarLayers.forEach((l, k) => l.setOpacity(k === i ? 0.7 : 0));
  const f = radarFrames[i];
  if (f) $('radar-time').textContent = `${fmtTime(new Date(f.time * 1000), { weekday: 'short', hour: 'numeric', minute: '2-digit' })}${i === radarFrames.length - 1 ? ' · latest' : ''}`;
}
function startRadar() {
  clearInterval(radarTimer);
  radarTimer = setInterval(() => {
    radarPos = (radarPos + 1) % radarFrames.length;
    showRadarFrame(radarPos);
  }, radarPos === radarFrames.length - 1 ? 700 : 500);
}

// ================================================================ Reveal-on-scroll
function setupReveal() {
  const els = document.querySelectorAll('.reveal');
  if (REDUCED || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: 0.08 });
  els.forEach((e) => io.observe(e));
}

// ================================================================ Main
async function refreshData() {
  $('updated').textContent = 'Updating…';
  $('refresh').classList.add('spin');
  const errors = [];
  const run = async (name, loader, render) => {
    try { state[name] = await loader(); render?.(state[name]); }
    catch (e) { errors.push(name); console.error(name, e); }
  };
  await Promise.all([
    run('snotel', loadSnotel, renderSnotelTable),
    run('nws', loadNws, renderNwsTable),
    run('elev', loadElevation, renderElevTable),
    loadAfd().catch((e) => console.error('afd', e)),
  ]);
  state.call = computeCall();
  renderCall(state.call);
  drawActiveTab();
  const names = { snotel: 'SNOTEL', nws: 'NWS', elev: 'Open-Meteo' };
  $('updated').textContent = `Updated ${fmtTime(new Date(), { hour: 'numeric', minute: '2-digit' })}` + (errors.length ? ` · no ${errors.map((e) => names[e]).join(', ')}` : '');
  setTimeout(() => $('refresh').classList.remove('spin'), 600);
}

function init() {
  detectDevice();
  document.title = `${M.name} · Ra-Dar Ski Weather`;
  $('mtn-name').textContent = M.name;
  $('links').innerHTML = M.links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('');
  setupReveal();
  setupTabs();
  renderCams();
  refreshData();
  $('refresh').addEventListener('click', () => { renderCams(); refreshData(); });
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (detectDevice()) { if (state.call) renderCall(state.call); drawActiveTab(); } }, 200);
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (state.call) renderCall(state.call); drawActiveTab(); });
  setInterval(refreshData, DATA_REFRESH_MS);
  setInterval(renderCams, CAM_REFRESH_MS);
}
init();
