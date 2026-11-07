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

const $ = (id) => document.getElementById(id);
const state = { snotel: null, nws: null, elev: null };
const charts = {};

// ---------------------------------------------------------------- helpers
async function getJSON(url, timeoutMs = 20000) {
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

const r0 = (v) => (v == null || Number.isNaN(v) ? '–' : Math.round(v).toString());
const r1 = (v) => (v == null || Number.isNaN(v) ? '–' : (Math.round(v * 10) / 10).toString());
const signed = (v, dp = 0) => (v == null ? '–' : (v > 0 ? '+' : '') + (dp ? r1(v) : r0(v)));
const ftFmt = (v) => (v == null ? '–' : Math.round(v).toLocaleString('en-US'));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Unit conversion from WMO unit codes (NWS) to imperial.
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

const partsFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
function localParts(d) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
}
const fmtTime = (d, opts) => d.toLocaleString('en-US', { timeZone: TZ, ...opts });
const hourLabel = (d) => fmtTime(d, { weekday: 'short', hour: 'numeric' });

function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

// ---------------------------------------------------------------- SNOTEL (measured)
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
      series[el.stationElement.elementCode] = el.values
        .filter((v) => v.value != null)
        .map((v) => ({ t: parseAwdb(v.date), v: v.value }));
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

function latest(arr) { return arr && arr.length ? arr[arr.length - 1] : null; }
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
    time: ref,
    depth: dNow?.v ?? null,
    d24: delta(s.SNWD, dNow, 24), d48: delta(s.SNWD, dNow, 48), d72: delta(s.SNWD, dNow, 72),
    swe: wNow?.v ?? null,
    w24: delta(s.WTEQ, wNow, 24), w72: delta(s.WTEQ, wNow, 72),
    temp: tNow?.v ?? null,
    hi24: temps24.length ? Math.max(...temps24) : null,
    lo24: temps24.length ? Math.min(...temps24) : null,
    p24: delta(s.PREC, pNow, 24), p72: delta(s.PREC, pNow, 72),
  };
  out.density72 = out.d72 >= 2 && out.w72 > 0 ? (out.w72 / out.d72) * 100 : null;
  out.density24 = out.d24 >= 2 && out.w24 > 0 ? (out.w24 / out.d24) * 100 : null;
  return out;
}

function renderSnotel(stations) {
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

  const p = stations[0];
  $('snotel-primary').textContent = `${p.name} (${ftFmt(p.ft)} ft)`;
  const temps = p.series.TOBS || [];
  const depthMap = new Map((p.series.SNWD || []).map((x) => [x.t.getTime(), x.v]));
  const sweMap = new Map((p.series.WTEQ || []).map((x) => [x.t.getTime(), x.v]));
  drawChart('chart-snotel', {
    type: 'line',
    data: {
      labels: temps.map((x) => hourLabel(x.t)),
      datasets: [
        { label: 'Snow depth (in)', data: temps.map((x) => depthMap.get(x.t.getTime()) ?? null), borderColor: cssVar('--accent'), yAxisID: 'y', spanGaps: true, pointRadius: 0, borderWidth: 2 },
        { label: 'SWE (in ×10)', data: temps.map((x) => (sweMap.has(x.t.getTime()) ? sweMap.get(x.t.getTime()) * 10 : null)), borderColor: cssVar('--m'), yAxisID: 'y', spanGaps: true, pointRadius: 0, borderWidth: 2, borderDash: [4, 3] },
        { label: 'Air temp (°F)', data: temps.map((x) => x.v), borderColor: cssVar('--bad'), yAxisID: 'y2', pointRadius: 0, borderWidth: 1.5 },
      ],
    },
    options: dualAxis('Snow (in)', '°F', 32),
  });
}

// ---------------------------------------------------------------- NWS (forecast)
function parseDuration(iso) {
  const m = /P(?:(\d+)D)?(?:T(?:(\d+)H)?)?/.exec(iso);
  return (Number(m?.[1] || 0) * 24) + Number(m?.[2] || 0) || 1;
}
// Expands NWS "start/PTnH" series into an hourly Map (ms -> value). Accumulations are split evenly.
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
  const layers = {
    temp: expand(p.temperature), chill: expand(p.windChill), dew: expand(p.dewpoint), rh: expand(p.relativeHumidity),
    wind: expand(p.windSpeed), gust: expand(p.windGust), dir: expand(p.windDirection), sky: expand(p.skyCover),
    pop: expand(p.probabilityOfPrecipitation), qpf: expand(p.quantitativePrecipitation, true),
    snow: expand(p.snowfallAmount, true), ice: expand(p.iceAccumulation, true), snowLevel: expand(p.snowLevel),
    vis: expand(p.visibility),
  };
  const startHour = Math.floor(Date.now() / 3600e3) * 3600e3;
  const rows = [];
  for (let i = 0; i < 96; i++) {
    const t = startHour + i * 3600e3;
    if (!layers.temp.has(t)) continue;
    const g = (k) => layers[k].get(t) ?? null;
    rows.push({
      t: new Date(t), temp: g('temp'), chill: g('chill'), dew: g('dew'), rh: g('rh'), wind: g('wind'), gust: g('gust'),
      dir: g('dir'), sky: g('sky'), pop: g('pop'), qpf: g('qpf'), snow: g('snow'), ice: g('ice'), snowLevel: g('snowLevel'),
      vis: g('vis') != null ? g('vis') / 5280 : null,
    });
  }
  return { rows, elevFt: toImperial(p.elevation?.value, 'wmoUnit:m'), updated: new Date(p.updateTime) };
}

function renderNws(nws) {
  $('nws-meta').textContent = `Gridded forecast for the ski area. This grid cell averages ${ftFmt(nws.elevFt)} ft, so expect stronger wind at the summit. Issued ${fmtTime(nws.updated, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}.`;
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

  const rows = nws.rows.slice(0, 72);
  drawChart('chart-nws', {
    data: {
      labels: rows.map((r) => hourLabel(r.t)),
      datasets: [
        { type: 'bar', label: 'Snowfall (in/hr)', data: rows.map((r) => r.snow), backgroundColor: cssVar('--accent'), yAxisID: 'y' },
        { type: 'line', label: 'Wind gust (mph)', data: rows.map((r) => r.gust), borderColor: cssVar('--bad'), yAxisID: 'y', pointRadius: 0, borderWidth: 1.5 },
        { type: 'line', label: 'Snow level (ft)', data: rows.map((r) => r.snowLevel), borderColor: cssVar('--f'), yAxisID: 'y2', pointRadius: 0, borderWidth: 2 },
        { type: 'line', label: 'Base elevation', data: rows.map(() => M.zones[0].ft), borderColor: cssVar('--muted'), borderDash: [5, 4], yAxisID: 'y2', pointRadius: 0, borderWidth: 1 },
      ],
    },
    options: dualAxis('Snow in/hr · gust mph', 'ft'),
  });
}

// ---------------------------------------------------------------- Open-Meteo by elevation (forecast)
async function loadElevation() {
  const n = M.zones.length;
  const rep = (v) => Array(n).fill(v).join(',');
  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${rep(M.lat)}&longitude=${rep(M.lon)}&elevation=${M.zones.map((z) => Math.round(z.ft / 3.28084)).join(',')}`
    + '&hourly=temperature_2m,apparent_temperature,snowfall,rain,freezing_level_height,wind_gusts_10m'
    + '&daily=temperature_2m_max,temperature_2m_min,snowfall_sum,rain_sum,wind_speed_10m_max,wind_gusts_10m_max'
    + `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=${encodeURIComponent(TZ)}&forecast_days=7`;
  const data = await getJSON(url);
  return (Array.isArray(data) ? data : [data]).map((d, i) => ({ zone: M.zones[i], ...d }));
}

function renderElevation(zones) {
  const days = zones[0].daily.time;
  const head = ['Day', ...zones.flatMap((z) => [`${z.zone.name} Hi/Lo °F`, 'Snow "', 'Rain "', 'Gust mph'])];
  const body = days.map((day, i) => {
    const label = new Date(day + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const cells = zones.flatMap((z) => {
      const d = z.daily;
      return [`${r0(d.temperature_2m_max[i])} / ${r0(d.temperature_2m_min[i])}`,
        `<span class="${d.snowfall_sum[i] >= 2 ? 'hi' : ''}">${r1(d.snowfall_sum[i])}</span>`,
        `<span class="${d.rain_sum[i] >= 0.1 ? 'warn' : ''}">${d.rain_sum[i]?.toFixed(2) ?? '–'}</span>`,
        r0(d.wind_gusts_10m_max[i])];
    });
    return `<tr><td>${label}</td>${cells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
  });
  $('elev-table').innerHTML = `<thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body.join('')}</tbody>`;

  const now = Date.now();
  const idx = zones[0].hourly.time.map((t, i) => [t, i]).filter(([t]) => new Date(t + ':00').getTime() >= now - 3600e3).slice(0, 72);
  const colors = [cssVar('--good'), cssVar('--ok'), cssVar('--bad')];
  const fl = zones[0].hourly.freezing_level_height;
  const flUnit = zones[0].hourly_units?.freezing_level_height;
  drawChart('chart-elev', {
    type: 'line',
    data: {
      labels: idx.map(([t]) => hourLabel(new Date(t + ':00'))),
      datasets: [
        ...zones.map((z, k) => ({ label: `${z.zone.name} temp (°F)`, data: idx.map(([, i]) => z.hourly.temperature_2m[i]), borderColor: colors[k % 3], yAxisID: 'y', pointRadius: 0, borderWidth: 2 })),
        { label: 'Freezing level (ft)', data: idx.map(([, i]) => (flUnit === 'm' ? fl[i] * 3.28084 : fl[i])), borderColor: cssVar('--f'), borderDash: [5, 4], yAxisID: 'y2', pointRadius: 0, borderWidth: 2 },
      ],
    },
    options: dualAxis('°F', 'Freezing level ft', 32),
  });
}

// ---------------------------------------------------------------- Charts
function dualAxis(leftTitle, rightTitle, refLine) {
  const grid = cssVar('--line'), text = cssVar('--muted');
  return {
    responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
    plugins: { legend: { labels: { color: text, boxWidth: 12, font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: text, maxRotation: 0, autoSkip: true, maxTicksLimit: 8, font: { size: 10 } }, grid: { color: grid } },
      y: { position: 'left', title: { display: true, text: leftTitle, color: text }, ticks: { color: text }, grid: { color: (c) => (refLine != null && c.tick?.value === refLine ? text : grid) } },
      y2: { position: 'right', title: { display: true, text: rightTitle, color: text }, ticks: { color: text }, grid: { drawOnChartArea: false } },
    },
  };
}
function drawChart(id, config) {
  if (!window.Chart) return;
  charts[id]?.destroy();
  charts[id] = new Chart($(id), config);
}

// ---------------------------------------------------------------- The Call (summary)
function skiWindow() {
  const now = new Date();
  const { date, hour } = localParts(now);
  const target = hour < 15 ? date : localParts(new Date(now.getTime() + 864e5)).date;
  return { date: target, today: target === date };
}

function buildCall() {
  const { snotel, nws, elev } = state;
  const win = skiWindow();
  const inWindow = (t) => { const p = localParts(t); return p.date === win.date && p.hour >= 9 && p.hour < 16; };
  const factors = [];
  let score = 5;
  const why = [];

  // 1. Fresh snow (measured)
  const pri = snotel?.[0]?.stats;
  const d24 = pri?.d24 != null ? Math.max(0, pri.d24) : null;
  const d72 = pri?.d72 != null ? Math.max(0, pri.d72) : null;
  if (pri) {
    const others = snotel.slice(1).map((s) => `${s.name} ${signed(s.stats.d24)}"`).join(', ');
    const dens = pri.density24 ?? pri.density72;
    factors.push({
      label: 'New snow (24h / 72h)', kind: 'm', value: `${r0(d24)}" / ${r0(d72)}"`,
      cls: d24 >= 6 ? 'good' : d24 >= 2 ? 'ok' : '',
      detail: `${snotel[0].name} SNOTEL depth change.${dens ? ` Density ${r0(dens)}% (${dens < 7 ? 'light, dry' : dens <= 12 ? 'medium' : 'heavy, wet'}).` : ''} ${others ? 'Others: ' + others + '.' : ''} Check the stake cam too.`,
    });
    score += Math.min(4, (d24 || 0) / 2) + Math.min(1.5, Math.max(0, (d72 || 0) - (d24 || 0)) / 6);
    if (d24 >= 2) why.push(`${r0(d24)}" of new snow was measured in the last 24 hours`);
  }

  // Forecast-derived factors
  const winRows = nws?.rows.filter((r) => inWindow(r.t)) || [];
  const untilEnd = nws?.rows.filter((r) => r.t <= (winRows.at(-1)?.t || 0)) || [];
  if (nws && winRows.length) {
    // 2. Snow on the way
    const snowNow = untilEnd.reduce((a, r) => a + (r.snow || 0), 0);
    const snow48 = nws.rows.slice(0, 48).reduce((a, r) => a + (r.snow || 0), 0);
    factors.push({
      label: 'Snow forecast', kind: 'f', value: `${r1(snowNow)}"`,
      cls: snowNow >= 3 ? 'good' : snowNow >= 0.5 ? 'ok' : '',
      detail: `Expected between now and lifts closing ${win.today ? 'today' : 'tomorrow'}. Next 48 hours: ${r1(snow48)}".`,
    });
    score += Math.min(1, snowNow / 4);

    // 3. Rain risk
    const wetHrs = winRows.filter((r) => r.qpf > 0.005);
    const maxLevel = wetHrs.length ? Math.max(...wetHrs.map((r) => r.snowLevel ?? 0)) : null;
    const wetIn = wetHrs.reduce((a, r) => a + (r.qpf || 0), 0);
    const base = M.zones[0].ft, mid = M.zones[1].ft;
    let rainCls = 'good', rainVal = 'None expected', rainDetail = 'No precipitation forecast during ski hours.';
    if (wetHrs.length) {
      rainVal = `Snow level ${ftFmt(maxLevel)} ft`;
      if (maxLevel > mid) { rainCls = 'bad'; rainDetail = `Rain is likely up past mid-mountain (${ftFmt(mid)} ft). Wet, heavy snow.`; }
      else if (maxLevel > base) { rainCls = 'bad'; rainDetail = `Rain is possible at the base (${ftFmt(base)} ft), with snow higher up.`; }
      else { rainCls = 'good'; rainDetail = `Snow all the way to the base. ${wetIn.toFixed(2)}" of water is forecast during ski hours.`; }
      if (rainCls === 'bad' && wetIn > 0.1) { score -= maxLevel > mid ? 3 : 2; why.push('rain is in the forecast'); }
    }
    factors.push({ label: 'Rain / snow line', kind: 'f', value: rainVal, cls: rainCls, detail: rainDetail });

    // 4. Wind / lift holds
    const gust = Math.max(...winRows.map((r) => r.gust ?? 0));
    const wind = Math.max(...winRows.map((r) => r.wind ?? 0));
    const dirs = winRows.map((r) => r.dir).filter((d) => d != null);
    let windCls = 'good', windDetail = 'Lifts should run normally.';
    if (gust >= 55) { windCls = 'bad'; windDetail = 'Widespread wind holds are likely, especially Summit and Northwest.'; score -= 3; why.push('strong gusts may close lifts'); }
    else if (gust >= 40) { windCls = 'bad'; windDetail = 'Upper-mountain lifts (Summit, Northwest) could go on wind hold.'; score -= 1.5; why.push('gusty wind up high'); }
    else if (gust >= 25) { windCls = 'ok'; windDetail = 'Breezy. Expect wind-affected snow up top.'; score -= 0.5; }
    factors.push({
      label: 'Wind (peak in ski hours)', kind: 'f', value: `${r0(gust)} mph gusts`, cls: windCls,
      detail: `Sustained up to ${r0(wind)} mph from the ${compass(dirs[Math.floor(dirs.length / 2)])} at about ${ftFmt(nws.elevFt)} ft. ${windDetail}`,
    });

    // 5. Visibility / light
    const sky = winRows.reduce((a, r) => a + (r.sky ?? 0), 0) / winRows.length;
    const vis = Math.min(...winRows.map((r) => r.vis ?? 10));
    let skyCls = 'good', skyVal = 'Sunny';
    if (sky >= 80) { skyCls = 'bad'; skyVal = 'Overcast / flat light'; }
    else if (sky >= 50) { skyCls = 'ok'; skyVal = 'Mostly cloudy'; }
    else if (sky >= 25) { skyCls = 'good'; skyVal = 'Partly sunny'; }
    if (sky >= 80 && !(d24 >= 3)) score -= 1;
    if (sky < 30 && d24 >= 4) { score += 1; why.push('blue skies on top of fresh snow'); }
    factors.push({ label: 'Visibility', kind: 'f', value: skyVal, cls: skyCls, detail: `${r0(sky)}% average cloud cover. Lowest visibility ${r1(vis)} mi.` });

    // 6. Temperature & snow surface
    const chill = Math.min(...winRows.map((r) => r.chill ?? r.temp ?? 99));
    let baseMax = null, summitMin = null;
    if (elev) {
      const pick = (z, f) => z.hourly.time.map((t, i) => [new Date(t + ':00'), z.hourly.temperature_2m[i]]).filter(([t]) => inWindow(t)).map(([, v]) => v);
      const b = pick(elev[0]), s = pick(elev[elev.length - 1]);
      if (b.length) baseMax = Math.max(...b);
      if (s.length) summitMin = Math.min(...s);
    }
    let tCls = 'good', tDetail = 'Comfortable, and the snow should stay wintry.';
    if (chill <= -5) { tCls = 'bad'; tDetail = 'Bitter wind chill. Cover exposed skin.'; score -= 1; why.push('bitter cold'); }
    else if (baseMax != null && baseMax >= 40) { tCls = 'ok'; tDetail = 'Warm down low. The snow will turn soft and slushy in the afternoon.'; if (!(d24 >= 2)) score -= 0.5; }
    else if (pri && pri.hi24 > 34 && (pri.lo24 ?? 99) < 30 && !(d24 >= 2)) { tCls = 'ok'; tDetail = 'It thawed and refroze, so expect firm or icy snow early that softens later.'; score -= 0.5; }
    factors.push({
      label: 'Temperature', kind: 'f', value: `${r0(summitMin)}° summit · ${r0(baseMax)}° base`, cls: tCls,
      detail: `Summit low and base high during ski hours. Lowest wind chill ${r0(chill)}°F (at about ${ftFmt(nws.elevFt)} ft). ${tDetail}`,
    });
  }

  // 7. Snowpack (measured)
  if (pri) {
    const med = snotel[0].daily.WTEQ?.last;
    const pct = med && med.median > 0 ? Math.round((med.value / med.median) * 100) : null;
    const thin = pri.depth != null && pri.depth < 6;
    if (thin) { score -= 2; why.push('the measured snowpack is still thin'); }
    factors.push({
      label: 'Snowpack depth', kind: 'm', value: `${r0(pri.depth)}" depth · ${r1(pri.swe)}" SWE`, cls: thin ? 'bad' : pri.depth >= 36 ? 'good' : 'ok',
      detail: `At ${snotel[0].name} (${ftFmt(snotel[0].ft)} ft, below the base).${pct != null ? ` Water content is ${pct}% of median for the date.` : ''} Check the resort report for the base depth on the mountain.`,
    });
  }

  score = Math.max(1, Math.min(10, Math.round(score)));
  const gustF = factors.find((f) => f.label.startsWith('Wind'));
  const gustV = gustF ? parseInt(gustF.value, 10) : 0;
  const rainBad = factors.find((f) => f.label.startsWith('Rain'))?.cls === 'bad';
  const snowSoon = parseFloat(factors.find((f) => f.label === 'Snow forecast')?.value) || 0;
  const skyGood = factors.find((f) => f.label === 'Visibility')?.cls === 'good';
  let headline = 'Firm, mixed conditions';
  if (d24 >= 8) headline = 'Powder day';
  else if (rainBad) headline = 'Rain at the base';
  else if (gustV >= 55) headline = 'Wind hold risk';
  else if (d24 >= 3) headline = 'Fresh snow on top';
  else if (snowSoon >= 3) headline = 'Snow is on the way';
  else if (pri && pri.depth != null && pri.depth < 6) headline = 'Early season / thin cover';
  else if (gustV >= 40) headline = 'Windy up top';
  else if (skyGood) headline = 'Sunny groomer day';

  $('call-day').textContent = `The Call · ${win.today ? 'Today' : 'Tomorrow'} ${new Date(win.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}, 9am–4pm`;
  $('call-headline').textContent = headline;
  $('call-text').textContent = why.length ? `Mainly because ${why.join(', ')}.` : 'No single factor stands out. See the details below.';
  const sc = $('call-score');
  sc.textContent = factors.length ? score : '–';
  sc.style.background = score >= 7 ? cssVar('--good') : score >= 4 ? cssVar('--ok') : cssVar('--bad');
  $('factors').innerHTML = factors.map((f) => `<div class="factor ${f.cls}"><div class="label"><span>${esc(f.label)}</span><span class="tag ${f.kind}">${f.kind === 'm' ? 'Measured' : 'Forecast'}</span></div>
    <div class="value">${esc(f.value)}</div><div class="detail">${esc(f.detail)}</div></div>`).join('');
}

// ---------------------------------------------------------------- Forecast discussion
async function loadAfd() {
  const list = await getJSON(`https://api.weather.gov/products/types/AFD/locations/${M.nws.office}`);
  const first = list['@graph']?.[0];
  if (!first) return;
  const prod = await getJSON(first['@id']);
  $('afd-summary').textContent = `Area Forecast Discussion, issued ${fmtTime(new Date(prod.issuanceTime), { weekday: 'short', hour: 'numeric', minute: '2-digit' })}. Tap to read`;
  $('afd').textContent = prod.productText;
}

// ---------------------------------------------------------------- Webcams
function camUrl(src) { return `${src}${src.includes('?') ? '&' : '?'}t=${Math.floor(Date.now() / 60000)}`; }
function renderCams() {
  $('stake').src = camUrl(M.snowStake.src);
  $('stake-link').href = M.snowStake.src;
  $('stake-note').textContent = `${M.snowStake.name}, ${ftFmt(M.snowStake.ft)} ft. ${M.snowStake.note}`;
  $('stations').src = camUrl(M.stationGraphic);
  $('stations-link').href = M.stationGraphic;
  const grid = $('cam-grid');
  if (!grid.children.length) {
    grid.innerHTML = M.cams.map((c, i) => `<figure class="cam"><a href="${esc(c.src)}" target="_blank" rel="noopener">
      <img class="cam-img" data-i="${i}" alt="${esc(c.name)} webcam" loading="lazy"></a>
      <figcaption><strong>${esc(c.name)}</strong><span>${esc(c.why)}</span></figcaption></figure>`).join('');
    grid.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', () => img.closest('.cam').classList.add('broken'));
      img.addEventListener('load', () => img.closest('.cam').classList.remove('broken'));
    });
  }
  grid.querySelectorAll('img').forEach((img) => { img.src = camUrl(M.cams[img.dataset.i].src); });
  $('cams-updated').textContent = `Refreshed ${fmtTime(new Date(), { hour: 'numeric', minute: '2-digit' })}`;
}

// ---------------------------------------------------------------- Radar
let map;
async function initRadar() {
  map = L.map('map', { scrollWheelZoom: false }).setView([M.lat, M.lon], 7);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
  L.marker([M.lat, M.lon]).addTo(map).bindPopup(M.name);
  try {
    const data = await getJSON('https://api.rainviewer.com/public/weather-maps.json');
    const frame = data.radar.past.at(-1);
    L.tileLayer(`${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, { opacity: 0.65, maxNativeZoom: 7, maxZoom: 12, attribution: 'Radar &copy; RainViewer' }).addTo(map);
  } catch (e) { console.warn('Radar unavailable', e); }
}

// ---------------------------------------------------------------- Main
async function refreshData() {
  $('updated').textContent = 'Updating…';
  const errors = [];
  const run = async (name, loader, render) => {
    try { state[name] = await loader(); render?.(state[name]); }
    catch (e) { errors.push(name); console.error(name, e); }
  };
  await Promise.all([
    run('snotel', loadSnotel, renderSnotel),
    run('nws', loadNws, renderNws),
    run('elev', loadElevation, renderElevation),
    loadAfd().catch((e) => console.error('afd', e)),
  ]);
  buildCall();
  const names = { snotel: 'SNOTEL', nws: 'NWS', elev: 'Open-Meteo' };
  $('updated').textContent = `Updated ${fmtTime(new Date(), { hour: 'numeric', minute: '2-digit' })}`
    + (errors.length ? ` · couldn't load ${errors.map((e) => names[e]).join(', ')}` : '');
}

function init() {
  document.title = `${M.name} · Ra-Dar Ski Weather`;
  $('mtn-name').textContent = M.name;
  $('mtn-region').textContent = `${M.region} · ${M.zones.map((z) => `${z.name} ${ftFmt(z.ft)} ft`).join(' · ')}`;
  $('links').innerHTML = M.links.map((l) => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a></li>`).join('');
  renderCams();
  initRadar();
  refreshData();
  $('refresh').addEventListener('click', () => { renderCams(); refreshData(); });
  setInterval(refreshData, DATA_REFRESH_MS);
  setInterval(renderCams, CAM_REFRESH_MS);
}
init();
