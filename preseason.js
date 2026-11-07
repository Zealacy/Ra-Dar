// Ra-Dar: preseason mode. Before Opening Day nobody is skiing, so the page leads with snowpack
// and future snowpack, and hides ski-day cards (wind, sky, lifts...). Switches off by itself on
// Opening Day (season.openingDay in mountains.js). Loaded before app.js; functions only.
//
// Data: there is no public snow-depth sensor on the mountain, so snow depth and season snowfall
// are MODEL estimates (Open-Meteo, adjusted to each elevation), labeled as such. The snow stake
// cam is shown beside them as the measured check. Week ranges come from the 82-run ensembles.

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
    + `&hourly=snow_depth,snowfall&past_days=${past}&forecast_days=8&precipitation_unit=inch&timezone=${encodeURIComponent(TZ)}`;
  const data = await getJSONCached(url, 30000, 180);
  const arr = Array.isArray(data) ? data : [data];
  return arr.map((d, i) => {
    const off = (d.utc_offset_seconds || 0) * 1000;
    const times = d.hourly.time.map((t) => new Date(Date.parse(t + ':00Z') - off));
    const unit = d.hourly_units?.snow_depth;
    const toIn = (v) => (v == null ? null : unit === 'm' ? v * 39.3701 : unit === 'ft' ? v * 12 : unit === 'cm' ? v / 2.54 : v);
    return { zone: M.zones[i], times, keys: d.hourly.time, depth: d.hourly.snow_depth.map(toIn), snow: d.hourly.snowfall.map((v) => v ?? 0), start };
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
    // Daily samples at noon for charts
    const daily = [];
    z.keys.forEach((key, k) => { if (key.endsWith('T12:00')) daily.push({ date: key.slice(0, 10), t: z.times[k], depth: z.depth[k], snow: 0 }); });
    const byDate = new Map(daily.map((d) => [d.date, d]));
    z.keys.forEach((key, k) => { const d = byDate.get(key.slice(0, 10)); if (d) d.snow += z.snow[k]; });
    return {
      ...z.zone,
      depthNow: nowIdx >= 0 ? z.depth[nowIdx] : null,
      depth7: futIdx >= 0 ? z.depth[futIdx] : null,
      seasonSnow, next7, daily,
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
  $('pre-count').textContent = p ? p.daysToOpen : '–';
  $('pre-open').textContent = `days to Opening Day · ${openNice} (scheduled)`;
  $('pre-stake').src = camUrl(M.snowStake.src);
  if (!p) {
    $('pre-depth-svg').innerHTML = '';
    $('pre-tiles').innerHTML = '<div class="lbl">Snowpack model data unavailable right now. Refresh to try again.</div>';
    return;
  }
  renderDepthStakes(p);
  const w = p.week;
  const sinceNice = new Date(p.start + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const tile = (k, v, s) => `<div class="pre-tile"><span class="pk">${k}</span><span class="pv">${v}</span><span class="ps">${s}</span></div>`;
  $('pre-tiles').innerHTML = [
    tile(`Season snowfall since ${sinceNice} · summit`, `${r0(p.zones.at(-1).seasonSnow)}"`, `model · ${p.zones.slice(0, -1).map((z) => `${z.name.replace(' (mid)', '').replace('West Village base', 'Base')} ${r0(z.seasonSnow)}"`).join(' · ')}`),
    tile('Snow next 7 days', w ? `${Math.floor(w.p10)}–${Math.ceil(w.p90)}"` : `~${r0(p.zones[1]?.next7)}"`, w ? `likely range at 7,800 ft (82 runs) · middle ${r1(w.p50)}"` : 'model, 7,800 ft'),
    tile('Chance this week', w ? `${w.chance[6]}% <small>≥6"</small> · ${w.chance[12]}% <small>≥12"</small>` : '–', w ? `${w.chance[1]}% chance of at least 1"` : ''),
  ].join('');
}

// Three stakes (base, mid, summit): modeled depth now (solid) and in 7 days (dashed outline).
function renderDepthStakes(p) {
  const svg = $('pre-depth-svg');
  svg.innerHTML = '';
  const W = 360, H = 230, top = 28, bot = 196;
  const maxV = Math.max(12, ...p.zones.map((z) => Math.max(z.depthNow || 0, z.depth7 || 0)));
  const max = Math.ceil(maxV / 12) * 12;
  const yv = (v) => bot - (clamp(v, 0, max) / max) * (bot - top);
  const T = (a, t) => { const e = svgEl('text', { 'font-size': 10, fill: cssVar('--text-2'), ...a }, svg); e.textContent = t; return e; };
  // axis + grid
  for (let v = 0; v <= max; v += max / 4) {
    svgEl('line', { x1: 40, x2: W - 6, y1: yv(v), y2: yv(v), stroke: cssVar('--grid'), 'stroke-width': 1 }, svg);
    T({ x: 34, y: yv(v) + 3.5, 'text-anchor': 'end' }, `${v}"`);
  }
  T({ x: 40, y: 14, 'font-weight': 700 }, 'Snow depth (inches)');
  const keyY = 14;
  svgEl('rect', { x: 186, y: keyY - 9, width: 11, height: 11, rx: 2, fill: cssVar('--s1') }, svg); T({ x: 201, y: keyY }, 'now');
  svgEl('rect', { x: 236, y: keyY - 9, width: 11, height: 11, rx: 2, fill: 'none', stroke: cssVar('--s1'), 'stroke-width': 1.5, 'stroke-dasharray': '3 2' }, svg); T({ x: 251, y: keyY }, 'in 7 days (model)');
  const colW = (W - 60) / p.zones.length;
  p.zones.forEach((z, i) => {
    const cx = 52 + colW * i + colW / 2;
    const bw = 34;
    // in 7 days (outline)
    if (z.depth7 != null) svgEl('rect', { x: cx - bw / 2 + 10, y: yv(z.depth7), width: bw, height: bot - yv(z.depth7), rx: 4, fill: color(cssVar('--s1'), 0.08), stroke: cssVar('--s1'), 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
    // now (solid)
    if (z.depthNow != null && z.depthNow > 0) {
      const r = svgEl('rect', { x: cx - bw / 2 - 10, y: yv(z.depthNow), width: bw, height: bot - yv(z.depthNow), rx: 4, fill: cssVar('--s1') }, svg);
      grow(r, 'bottom', 1.2, 0.1 + i * 0.12);
    }
    T({ x: cx - 10, y: Math.min(yv(z.depthNow || 0), bot) - 5, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 800, fill: cssVar('--text') }, z.depthNow == null ? '–' : `${r0(z.depthNow)}"`);
    if (z.depth7 != null) T({ x: cx + 10 + bw / 2 - bw / 2, y: Math.min(yv(z.depth7), bot) - 5, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: cssVar('--s1') }, `${r0(z.depth7)}"`);
    T({ x: cx, y: bot + 15, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: cssVar('--text') }, z.name.replace(' (mid)', '').replace('West Village base', 'West Village'));
    T({ x: cx, y: bot + 28, 'text-anchor': 'middle', 'font-size': 9.5 }, `${ftFmt(z.ft)} ft`);
  });
  svgEl('line', { x1: 40, x2: W - 6, y1: bot, y2: bot, stroke: cssVar('--text-2'), 'stroke-width': 1.2 }, svg);
  bindTip(svg, 'Model estimate of snow on the ground at each elevation: solid is now, dashed outline is 7 days from now. No public sensor measures depth on the mountain; compare with the stake cam.');
}

// ---------------------------------------------------------------- in-depth tab
function drawSnowpackTab() {
  const p = computePreseason();
  if (!p) { $('sp-lead').textContent = 'Snowpack model data unavailable right now.'; return; }
  const today = localParts(new Date()).date;
  const days = p.zones[0].daily.filter((d) => d.date >= addDays(today, -30) && d.date <= addDays(today, 7));
  const labels = days.map((d) => new Date(d.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const todayIdx = days.findIndex((d) => d.date >= today);
  const vars = ['--s1', '--s2', '--s3'];
  const pick = (z, key) => days.map((d) => z.daily.find((x) => x.date === d.date)?.[key] ?? null);
  const future = (ctx) => (todayIdx >= 0 && ctx.p0DataIndex >= todayIdx ? [5, 4] : undefined);
  drawChart('c-sp-depth', {
    type: 'line',
    data: { labels, datasets: p.zones.map((z, k) => ({ ...lineDs(`${z.name} ${ftFmt(z.ft)}′`, pick(z, 'depth'), vars[k]), segment: { borderDash: future } })) },
    options: chartOpts({ yMin: 0, xTicks: 8 }),
  });
  const mid = p.zones[1] || p.zones[0];
  const snowVals = pick(mid, 'snow');
  drawChart('c-sp-daily', {
    type: 'bar',
    data: { labels, datasets: [{ ...barDs(`Daily snowfall at ${ftFmt(mid.ft)} ft`, snowVals, '--s1'), backgroundColor: days.map((d) => (d.date >= today ? color(cssVar('--s1'), 0.4) : cssVar('--s1'))) }] },
    options: chartOpts({ legend: false, yMin: 0, xTicks: 8 }),
  });
  // Season cumulative snowfall by elevation (since Oct 1)
  const all = p.zones[0].daily.filter((d) => d.date <= addDays(today, 7));
  const cum = (z) => { let a = 0; return all.map((d) => { a += z.daily.find((x) => x.date === d.date)?.snow || 0; return a; }); };
  drawChart('c-sp-season', {
    type: 'line',
    data: { labels: all.map((d) => new Date(d.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })), datasets: p.zones.map((z, k) => ({ ...lineDs(`${z.name}`, cum(z), vars[k]), cubicInterpolationMode: 'monotone' })) },
    options: chartOpts({ yMin: 0, xTicks: 8 }),
  });
  $('sp-lead').textContent = `Model estimates for each elevation (no public sensor measures snow depth on the mountain). Dashed and lighter parts are forecasts. Season snowfall is counted from ${new Date(p.start + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`;
  const head = ['Date', ...p.zones.map((z) => `${z.name.replace(' (mid)', '')} depth "`), ...p.zones.map((z) => `${z.name.replace(' (mid)', '')} snowfall "`)];
  $('sp-table').innerHTML = `<thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${days.slice().reverse().map((d) => `<tr${d.date > today ? ' class="fc"' : ''}><td>${esc(new Date(d.date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))}${d.date > today ? ' (forecast)' : ''}</td>${p.zones.map((z) => `<td>${r1(z.daily.find((x) => x.date === d.date)?.depth)}</td>`).join('')}${p.zones.map((z) => `<td>${r1(z.daily.find((x) => x.date === d.date)?.snow)}</td>`).join('')}</tr>`).join('')}</tbody>`;
}
