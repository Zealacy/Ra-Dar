// Ra-Dar: preseason mode. Before Opening Day nobody is skiing, so the page leads with snowpack
// and future snowpack, and hides ski-day cards (wind, sky, lifts...). Switches off by itself on
// Opening Day (season.openingDay in mountains.js). Loaded before app.js; functions only.
//
// Data: Open-Meteo's modeled snow DEPTH is not used: on 2026-11-07 it read 0" at every elevation
// at Mt. Bachelor while the stake cam and the resort's own sensor showed snow on the ground.
// Snowfall (since Oct 1 and forecast) is a MODEL estimate, labeled as such. Beside it sits the
// measured view of the ground: the snow stake cam, or the mountain's snow sensor and base cam.
// Week ranges come from the 82-run ensembles.

// The view choice is remembered per mountain, because their seasons differ.
const preKey = () => `radar-view:${MTN_KEY}`;
// What the remembered choice is tied to: this season's Opening Day, or "not announced yet".
const seasonTag = () => M.season?.openingDay || 'tba';

function preseasonActive() {
  const open = M.season?.openingDay;
  // A resort that is closed with no date announced stays in preseason until a date is set.
  if (!open) return !!M.season?.closed;
  return localParts(new Date()).date < open;
}
// The viewer can switch to the ski-day view; the choice is remembered until Opening Day.
function viewMode() {
  if (!preseasonActive()) return 'season';
  try {
    const v = JSON.parse(localStorage.getItem(preKey()) || 'null');
    if (v && v.until === seasonTag() && v.mode === 'season') return 'season';
  } catch { /* storage unavailable */ }
  return 'preseason';
}
function setViewMode(mode) {
  try { localStorage.setItem(preKey(), JSON.stringify({ mode, until: seasonTag() })); } catch { /* ignore */ }
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
    + `&hourly=precipitation,temperature_2m&past_days=${past}&forecast_days=8&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=${encodeURIComponent(TZ)}`;
  const data = await getJSONCached(url, 30000, 180);
  const arr = Array.isArray(data) ? data : [data];
  return arr.map((d, i) => {
    const off = (d.utc_offset_seconds || 0) * 1000;
    const times = d.hourly.time.map((t) => new Date(Date.parse(t + ':00Z') - off));
    const unit = d.hourly_units?.snow_depth;
    const toIn = (v) => (v == null ? null : unit === 'm' ? v * 39.3701 : unit === 'ft' ? v * 12 : unit === 'cm' ? v / 2.54 : v);
    // Snow at this elevation: its precipitation split by its own model temperature (see splitPrecip in app.js).
    return { zone: M.zones[i], times, keys: d.hourly.time, depth: (d.hourly.snow_depth || []).map(toIn), snow: splitPrecip(d.hourly.precipitation, d.hourly.temperature_2m).snow, start };
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
  const daysToOpen = open ? Math.round((Date.parse(open) - Date.parse(today)) / 864e5) : null;
  return { zones, daysToOpen, open, week: state.weekView?.weekEns || null, start: P[0]?.start };
}

// ---------------------------------------------------------------- summary card
function renderPreseason() {
  const box = $('pre');
  if (!box || document.documentElement.dataset.mode !== 'preseason') return;
  const p = computePreseason();
  // The countdown only needs the calendar, not the model data. With no date announced it says so.
  const open = M.season.openingDay;
  if (open) {
    const openNice = new Date(open + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    $('pre-count').textContent = Math.round((Date.parse(open) - Date.parse(localParts(new Date()).date)) / 864e5);
    $('pre-open').textContent = `days to Opening Day · ${openNice} (scheduled)`;
  } else {
    const checked = M.season.checked ? new Date(M.season.checked + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
    $('pre-count').textContent = 'TBA';
    $('pre-open').textContent = `Opening Day not announced yet${checked ? ` · checked ${checked}` : ''}`;
  }
  // The measured view of the ground: the snow stake cam, or the first cam where there is no stake.
  const hero = heroCam();
  $('pre-stake').src = camUrl(camStill(hero));
  $('pre-stake').alt = `${hero.name} webcam`;
  $('pre-stake-cap').textContent = hero.caption || hero.name;
  // Right now: measured readings, so nobody mistakes a forecast for the current temperature. Where nothing
  // on the mountain is measured and the owner allowed it, labeled model estimates for this hour instead.
  const live = (state.stations || []).filter((st) => st.stats.fresh && st.stats.temp != null);
  const sn = snowSensor(), snOk = !!sn?.stats.fresh;
  const snowNow = snOk ? `<span class="pn"><b>${r0(sn.stats.depth)}" snow on the ground</b> ${esc(sn.name)} snow station · ${ftFmt(sn.ft)} ft · ${esc(sn.where)} · ${ageText(sn.stats.depthAgeH)}</span>` : '';
  const est = !live.length && !snOk && useModelNow() ? modelNow() : null;
  $('pre-now').innerHTML = live.length || snOk
    ? `<span class="pn-h">Right now <span class="src m">Measured</span></span>${snowNow}${live.map((st) => `<span class="pn"><b>${r0(st.stats.temp)}°F</b> ${esc(st.name)} · ${ftFmt(st.ft)} ft${st.offSite ? ` · <b class="off">${esc(st.offSite)}</b>` : ''} · ${ageText(st.stats.tempAgeH ?? st.stats.ageH)}</span>`).join('')}`
    : est?.zones.some((z) => z.temp != null)
      ? `<span class="pn-h">Right now <span class="src e" title="Model: a computer-model estimate for this hour, not a measurement">${esc(NOW_MODEL_TAG)}</span></span>${est.zones.filter((z) => z.temp != null).map((z) => `<span class="pn"><b>${r0(z.temp)}°F</b> ${esc(zShort(z))} · ${ftFmt(z.ft)} ft</span>`).join('')}<span class="pn">No public station on the mountain reports in winter.</span>`
      : '<span class="pn-h">Right now</span><span class="pn">No live station readings available.</span>';
  const fig = document.querySelector('.pre-fig');
  if (!p) {
    $('pre-depth-svg').innerHTML = '';
    fig.classList.add('empty');
    fig.dataset.msg = `Snowfall model data couldn't load right now. Refresh to try again. ${M.snowStake ? 'The stake cam is live.' : M.stations.length || M.snowSensor ? 'The cam and the measured readings are live.' : 'The cams are live.'}`;
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
  const midFt = ftFmt(midZone().ft);
  const tile = (k, v, s) => `<div class="pre-tile"><span class="pk">${k}</span><span class="pv">${v}</span><span class="ps">${s}</span></div>`;
  $('pre-tiles').innerHTML = [
    p ? tile(`Snowfall last 7 days · ${midFt} ft`, `${r1(p.zones[1]?.last7 ?? p.zones[0].last7)}"`, `model · since ${sinceNice}: ${r0((p.zones[1] || p.zones[0]).seasonSnow)}"`) : tile('Snowfall last 7 days', '–', 'model data unavailable right now'),
    tile('Snow next 7 days', w ? `${Math.floor(w.p10)}–${Math.ceil(w.p90)}"` : p ? `~${r0(p.zones[1]?.next7)}"` : '–', w ? `likely range at ${midFt} ft (82 runs) · middle ${r1(w.p50)}"` : p ? `model, ${midFt} ft` : 'forecast data unavailable right now'),
    tile('Chance this week', w ? `${w.chance[6]}% <small>≥6"</small> · ${w.chance[12]}% <small>≥12"</small>` : '–', w ? `${w.chance[1]}% chance of at least 1"` : ''),
    // Measured snow on the ground from the daily climate stations, with its date (where a mountain has them).
    M.snowDaily && (() => {
      const d = dailyLatest();
      return d
        ? tile(`Measured on the ground · ${ftFmt(d.ft)} ft`, `${r0(d.last.depth)}"`, `${esc(d.name)} · daily report, ${esc(dayNice(d.last.date))}`)
        : tile('Measured on the ground', '–', state.daily ? `Daily snow reports: ${esc(dailyNone())}` : 'Daily snow reports unavailable right now');
    })(),
  ].filter(Boolean).join('');
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
    T({ x: cx, y: bot + 15, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: cssVar('--text') }, zShort(z));
    T({ x: cx, y: bot + 28, 'text-anchor': 'middle', 'font-size': 9.5 }, `${ftFmt(z.ft)} ft`);
  });
  svgEl('line', { x1: 40, x2: W - 6, y1: bot, y2: bot, stroke: cssVar('--text-2'), 'stroke-width': 1.2 }, svg);
  bindTip(svg, `Model snowfall at each elevation since ${since} (solid), plus the model forecast for the next 7 days (dashed). This is snow that fell, not snow on the ground: melting and wind are not counted. ${M.snowSensor ? `The ${M.snowSensor.name} snow station measures the ground.` : M.snowStake ? 'The stake cam shows the ground.' : M.snowDaily ? 'The daily climate-station reports measure the ground, in season.' : 'The cams show the ground.'}`);
}

// ---------------------------------------------------------------- in-depth tab
// Measured snow depth for the season, from the mountain's own snow sensor (where it has one).
function drawMeasuredSeason() {
  if (!M.snowSensor && M.snowDaily) { drawDailySeason(); return; }
  const sn = snowSensor(), pts = sn?.season?.SNWD || [];
  if (!M.snowSensor || !pts.length) return;
  const o = chartOpts({ legend: false, yMin: 0, xTicks: 8 });
  o.scales.y.suggestedMax = 6; // bare ground still gets a readable scale
  drawChart('c-sp-measured', {
    type: 'line',
    data: { labels: pts.map((d) => new Date(d.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })), datasets: [{ ...lineDs('Snow depth', pts.map((d) => d.v), '--s3', true), tension: 0 }] },
    options: o,
  });
}

// Measured snow on the ground this season from the daily climate stations, one line per station, with
// gaps left as gaps (they're hand-read and skip days). Until they report, the slot says so.
function drawDailySeason() {
  const fig = $('fig-sp-measured'), note = $('sp-measured-note');
  const sts = (state.daily || []).filter((s) => s.rows.some((r) => r.depth != null));
  fig.classList.toggle('empty', !sts.length);
  if (!sts.length) {
    charts['c-sp-measured']?.destroy();
    note.textContent = state.daily ? `${dailyNone()}. These stations are read by hand once a day, in season only.` : 'Daily snow reports unavailable right now.';
    return;
  }
  note.textContent = 'Read by hand once a day; gaps are days without a report.';
  const dates = [...new Set(sts.flatMap((s) => s.rows.filter((r) => r.depth != null).map((r) => r.date)))].sort();
  const vars = ['--s1', '--s2', '--s3'];
  const o = chartOpts({ yMin: 0, xTicks: 8 });
  o.scales.y.suggestedMax = 12;
  drawChart('c-sp-measured', {
    type: 'line',
    data: { labels: dates.map((d) => new Date(d + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: sts.map((s, k) => ({ ...lineDs(`${s.name} ${ftFmt(s.ft)}′`, dates.map((d) => s.rows.find((r) => r.date === d)?.depth ?? null), vars[k % 3]), tension: 0, spanGaps: false, pointRadius: 2 })) },
    options: o,
  });
}

function drawSnowpackTab() {
  drawMeasuredSeason();
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
  $('sp-lead').textContent = `Model snowfall at each elevation since ${nice(p.start)}: snow that fell, not snow on the ground (melting and wind aren't counted). Dashed and lighter parts are forecasts. ${M.text.snowDepthNote}`;
  const head = ['Date', ...p.zones.map((z) => `${zShort(z)} snowfall "`)];
  $('sp-table').innerHTML = `<thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${days.slice().reverse().map((d) => `<tr${d.date > today ? ' class="fc"' : ''}><td>${esc(new Date(d.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))}${d.date > today ? ' (forecast)' : ''}</td>${p.zones.map((z) => `<td>${r1(z.daily.find((x) => x.date === d.date)?.snow)}</td>`).join('')}</tr>`).join('')}</tbody>`;
}
