// Ra-Dar: preseason mode. Before Opening Day nobody is skiing, so the page leads with snowpack
// and future snowpack, and hides ski-day cards (wind, sky, lifts...). Switches off by itself on
// Opening Day (season.openingDay in mountains.js). Loaded before app.js; functions only.
//
// Data: there is no public snow-depth sensor on the mountain. Open-Meteo's modeled snow DEPTH
// is not used: on 2026-11-07 it read 0" at every elevation while the stake cam and the resort's
// own sensor showed snow on the ground. Snowfall (since Oct 1 and forecast) is a MODEL estimate,
// labeled as such; the snow stake cam is shown beside it as the measured view of the ground.
// Week ranges come from the 82-run ensembles.

const PRE_KEY = 'radar-view';

function preseasonActive() {
  const open = M.season?.openingDay;
  return !!open && localParts(new Date()).date < open;
}
// The viewer can switch to the ski-day view; the choice is remembered until Opening Day.
function viewMode() {
  if (!preseasonActive()) return 'season';
  try {
    const v = JSON.parse(localStorage.getItem(PRE_KEY) || 'null');
    if (v && v.until === M.season.openingDay && v.mode === 'season') return 'season';
  } catch { /* storage unavailable */ }
  return 'preseason';
}
function setViewMode(mode) {
  try { localStorage.setItem(PRE_KEY, JSON.stringify({ mode, until: M.season.openingDay })); } catch { /* ignore */ }
  applyViewMode();
}
function applyViewMode() {
  const mode = viewMode();
  document.documentElement.dataset.mode = mode;
  const jump = document.querySelector('.jump a[href="#call"], .jump a[href="#pre"]');
  if (jump) { jump.href = mode === 'preseason' ? '#pre' : '#call'; jump.textContent = mode === 'preseason' ? 'Snowpack' : 'Today'; }
  const btn = $('view-toggle');
  if (btn) {
    btn.hidden = !preseasonActive();
    btn.textContent = mode === 'preseason' ? 'Show ski-day view' : 'Show preseason view';
  }
  return mode;
}

// ---------------------------------------------------------------- data
function seasonStartDate() {
  const { date } = localParts(new Date());
  const [y, m] = date.split('-').map(Number);
  return `${m >= 8 ? y : y - 1}-10-01`; // season snowfall counted from Oct 1
}
async function loadPreseason() {
  const start = seasonStartDate();
  const today = localParts(new Date()).date;
  const past = clamp(Math.round((Date.parse(today) - Date.parse(start)) / 864e5) + 1, 1, 92);
  const n = M.zones.length;
  const rep = (v) => Array(n).fill(v).join(',');
  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${rep(M.lat)}&longitude=${rep(M.lon)}&elevation=${M.zones.map((z) => Math.round(z.ft / 3.28084)).join(',')}`
    + `&hourly=snowfall&past_days=${past}&forecast_days=8&precipitation_unit=inch&timezone=${encodeURIComponent(TZ)}`;
  const data = await getJSONCached(url, 30000, 180);
  const arr = Array.isArray(data) ? data : [data];
  return arr.map((d, i) => {
    const off = (d.utc_offset_seconds || 0) * 1000;
    const times = d.hourly.time.map((t) => new Date(Date.parse(t + ':00Z') - off));
    const unit = d.hourly_units?.snow_depth;
    const toIn = (v) => (v == null ? null : unit === 'm' ? v * 39.3701 : unit === 'ft' ? v * 12 : unit === 'cm' ? v / 2.54 : v);
    return { zone: M.zones[i], times, keys: d.hourly.time, depth: (d.hourly.snow_depth || []).map(toIn), snow: d.hourly.snowfall.map((v) => v ?? 0), start };
  });
}

function computePreseason() {
  const P = state.pre;
  if (!P) return null;
  const now = Date.now();
  const in7 = now + 7 * 864e5;
  const zones = P.map((z) => {
    let nowIdx = -1, futIdx = -1;
    z.times.forEach((t, k) => {
      if (t <= now && z.depth[k] != null) nowIdx = k;
      if (t <= in7 && z.depth[k] != null) futIdx = k;
    });
    const seasonSnow = z.times.reduce((a, t, k) => a + (t >= Date.parse(z.start + 'T00:00:00') && t <= now ? z.snow[k] : 0), 0);
    const next7 = z.times.reduce((a, t, k) => a + (t > now && t <= in7 ? z.snow[k] : 0), 0);
    const last7 = z.times.reduce((a, t, k) => a + (t <= now && t > now - 7 * 864e5 ? z.snow[k] : 0), 0);
    // Daily samples at noon for charts
    const daily = [];
    z.keys.forEach((key, k) => { if (key.endsWith('T12:00')) daily.push({ date: key.slice(0, 10), t: z.times[k], depth: z.depth[k], snow: 0 }); });
    const byDate = new Map(daily.map((d) => [d.date, d]));
    z.keys.forEach((key, k) => { const d = byDate.get(key.slice(0, 10)); if (d) d.snow += z.snow[k]; });
    return {
      ...z.zone,
      depthNow: nowIdx >= 0 ? z.depth[nowIdx] : null,
      depth7: futIdx >= 0 ? z.depth[futIdx] : null,
      seasonSnow, next7, last7, daily,
    };
  });
  const open = M.season.openingDay;
  const today = localParts(new Date()).date;
  const daysToOpen = Math.round((Date.parse(open) - Date.parse(today)) / 864e5);
  return { zones, daysToOpen, open, week: state.weekView?.weekEns || null, start: P[0]?.start };
}

// ---------------------------------------------------------------- summary card
function renderPreseason() {
  const box = $('pre');
  if (!box || document.documentElement.dataset.mode !== 'preseason') return;
  const p = computePreseason();
  const openNice = new Date(M.season.openingDay + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  // The countdown only needs the calendar, not the model data.
  const daysToOpen = Math.round((Date.parse(M.season.openingDay) - Date.parse(localParts(new Date()).date)) / 864e5);
  $('pre-count').textContent = daysToOpen;
  $('pre-open').textContent = `days to Opening Day · ${openNice} (scheduled)`;
  $('pre-stake').src = camUrl(M.snowStake.src);
  // Right now: measured readings, so nobody mistakes a forecast for the current temperature.
  const live = (state.stations || []).filter((st) => st.stats.fresh && st.stats.temp != null);
  $('pre-now').innerHTML = live.length
    ? `<span class="pn-h">Right now <span class="src m">Measured</span></span>${live.map((st) => `<span class="pn"><b>${r0(st.stats.temp)}°F</b> ${esc(st.name)} · ${ftFmt(st.ft)} ft${st.offSite ? ` · <b class="off">${esc(st.offSite)}</b>` : ''} · ${ageText(st.stats.tempAgeH ?? st.stats.ageH)}</span>`).join('')}`
    : '<span class="pn-h">Right now</span><span class="pn">No live station readings available.</span>';
  const fig = document.querySelector('.pre-fig');
  if (!p) {
    $('pre-depth-svg').innerHTML = '';
    fig.classList.add('empty');
    fig.dataset.msg = "Snowfall model data couldn't load right now. Refresh to try again. The stake cam is live.";
    renderPreTiles(null);
    return;
  }
  fig.classList.remove('empty');
  renderSnowfallBars(p);
  renderPreTiles(p);
}

function renderPreTiles(p) {
  const w = state.weekView?.weekEns || null;
  const sinceNice = new Date(seasonStartDate() + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const tile = (k, v, s) => `<div class="pre-tile"><span class="pk">${k}</span><span class="pv">${v}</span><span class="ps">${s}</span></div>`;
  $('pre-tiles').innerHTML = [
    p ? tile('Snowfall last 7 days · 7,800 ft', `${r1(p.zones[1]?.last7 ?? p.zones[0].last7)}"`, `model · since ${sinceNice}: ${r0((p.zones[1] || p.zones[0]).seasonSnow)}"`) : tile('Snowfall last 7 days', '–', 'model data unavailable right now'),
    tile('Snow next 7 days', w ? `${Math.floor(w.p10)}–${Math.ceil(w.p90)}"` : p ? `~${r0(p.zones[1]?.next7)}"` : '–', w ? `likely range at 7,800 ft (82 runs) · middle ${r1(w.p50)}"` : p ? 'model, 7,800 ft' : 'forecast data unavailable right now'),
    tile('Chance this week', w ? `${w.chance[6]}% <small>≥6"</small> · ${w.chance[12]}% <small>≥12"</small>` : '–', w ? `${w.chance[1]}% chance of at least 1"` : ''),
  ].join('');
}

// Snowfall by elevation: since Oct 1 (solid) with the next 7 days stacked on top (dashed).
function renderSnowfallBars(p) {
  const svg = $('pre-depth-svg');
  svg.innerHTML = '';
  const W = 360, H = 230, top = 30, bot = 196;
  const maxV = Math.max(6, ...p.zones.map((z) => z.seasonSnow + z.next7)) * 1.3; // headroom for the labels
  const step = maxV <= 12 ? 3 : maxV <= 24 ? 6 : maxV <= 48 ? 12 : 24;
  const max = Math.ceil(maxV / step) * step;
  const yv = (v) => bot - (clamp(v, 0, max) / max) * (bot - top);
  const T = (a, t) => { const e = svgEl('text', { 'font-size': 10, fill: cssVar('--text-2'), ...a }, svg); e.textContent = t; return e; };
  for (let v = 0; v <= max; v += step) {
    svgEl('line', { x1: 40, x2: W - 6, y1: yv(v), y2: yv(v), stroke: cssVar('--grid'), 'stroke-width': 1 }, svg);
    T({ x: 34, y: yv(v) + 3.5, 'text-anchor': 'end' }, `${v}"`);
  }
  const since = new Date(p.start + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  T({ x: 40, y: 13, 'font-weight': 700, fill: cssVar('--text') }, `Snowfall since ${since} (inches, model)`);
  svgEl('rect', { x: 40, y: 18, width: 11, height: 9, rx: 2, fill: cssVar('--s1') }, svg); T({ x: 55, y: 26 }, 'so far');
  svgEl('rect', { x: 98, y: 18, width: 11, height: 9, rx: 2, fill: 'none', stroke: cssVar('--s1'), 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }, svg); T({ x: 113, y: 26 }, '+ next 7 days');
  const colW = (W - 60) / p.zones.length;
  p.zones.forEach((z, i) => {
    const cx = 52 + colW * i + colW / 2, bw = 46;
    const so = z.seasonSnow, nx = z.next7;
    if (so > 0) { const r = svgEl('rect', { x: cx - bw / 2, y: yv(so), width: bw, height: bot - yv(so), rx: 4, fill: cssVar('--s1') }, svg); grow(r, 'bottom', 1.2, 0.1 + i * 0.12); }
    if (nx >= 0.1) svgEl('rect', { x: cx - bw / 2, y: yv(so + nx), width: bw, height: Math.max(2, yv(so) - yv(so + nx)), rx: 4, fill: color(cssVar('--s1'), 0.08), stroke: cssVar('--s1'), 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
    T({ x: cx, y: yv(so + nx) - (nx >= 0.1 ? 16 : 5), 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, fill: cssVar('--text') }, `${r0(so)}"`);
    if (nx >= 0.1) T({ x: cx, y: yv(so + nx) - 4, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: cssVar('--s1') }, `+${r1(nx)}" coming`);
    T({ x: cx, y: bot + 15, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: cssVar('--text') }, z.name.replace(' (mid)', '').replace('West Village base', 'West Village'));
    T({ x: cx, y: bot + 28, 'text-anchor': 'middle', 'font-size': 9.5 }, `${ftFmt(z.ft)} ft`);
  });
  svgEl('line', { x1: 40, x2: W - 6, y1: bot, y2: bot, stroke: cssVar('--text-2'), 'stroke-width': 1.2 }, svg);
  bindTip(svg, `Model snowfall at each elevation since ${since} (solid), plus the model forecast for the next 7 days (dashed). This is snow that fell, not snow on the ground: melting and wind are not counted. The stake cam shows the ground.`);
}

// ---------------------------------------------------------------- in-depth tab
function drawSnowpackTab() {
  const p = computePreseason();
  if (!p) { $('sp-lead').textContent = 'Snowfall model data unavailable right now.'; return; }
  const today = localParts(new Date()).date;
  const vars = ['--s1', '--s2', '--s3'];
  const nice = (d) => new Date(d + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  // Season snowfall by elevation, with the forecast continuing as dashes
  const all = p.zones[0].daily.filter((d) => d.date <= addDays(today, 7));
  const tIdx = all.findIndex((d) => d.date > today);
  const cum = (z) => { let a = 0; return all.map((d) => { a += z.daily.find((x) => x.date === d.date)?.snow || 0; return a; }); };
  drawChart('c-sp-depth', {
    type: 'line',
    data: { labels: all.map((d) => nice(d.date)), datasets: p.zones.map((z, k) => ({ ...lineDs(`${z.name} ${ftFmt(z.ft)}′`, cum(z), vars[k]), cubicInterpolationMode: 'monotone', segment: { borderDash: (ctx) => (tIdx >= 0 && ctx.p1DataIndex >= tIdx ? [5, 4] : undefined) } })) },
    options: chartOpts({ yMin: 0, xTicks: 8 }),
  });
  // Daily snowfall at mid-mountain, last 30 days + next 7
  const days = p.zones[0].daily.filter((d) => d.date >= addDays(today, -30) && d.date <= addDays(today, 7));
  const mid = p.zones[1] || p.zones[0];
  drawChart('c-sp-daily', {
    type: 'bar',
    data: { labels: days.map((d) => nice(d.date)), datasets: [{ ...barDs(`Daily snowfall at ${ftFmt(mid.ft)} ft`, days.map((d) => mid.daily.find((x) => x.date === d.date)?.snow ?? null), '--s1'), backgroundColor: days.map((d) => (d.date > today ? color(cssVar('--s1'), 0.4) : cssVar('--s1'))) }] },
    options: chartOpts({ legend: false, yMin: 0, xTicks: 8 }),
  });
  $('sp-lead').textContent = `Model snowfall at each elevation since ${nice(p.start)}: snow that fell, not snow on the ground (melting and wind aren't counted). Dashed and lighter parts are forecasts. No public sensor measures snow depth on the mountain; the stake cam and the resort's West Village sensor (Live readings tab) show the ground.`;
  const head = ['Date', ...p.zones.map((z) => `${z.name.replace(' (mid)', '')} snowfall "`)];
  $('sp-table').innerHTML = `<thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${days.slice().reverse().map((d) => `<tr${d.date > today ? ' class="fc"' : ''}><td>${esc(new Date(d.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))}${d.date > today ? ' (forecast)' : ''}</td>${p.zones.map((z) => `<td>${r1(z.daily.find((x) => x.date === d.date)?.snow)}</td>`).join('')}</tr>`).join('')}</tbody>`;
}
