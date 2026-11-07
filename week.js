// Ra-Dar: 7-day forecast ("Week ahead" strip + "Next 7 days" tab).
// Loaded before app.js. Contains only functions; they use app.js globals when called.
//
// Accuracy approach:
//   - Official: National Weather Service gridpoint forecast (hourly numbers) + written periods.
//   - Models compared: GFS (US), ECMWF (Europe), GEM (Canada), ICON (Germany), via Open-Meteo.
//   - Ensembles for ranges and confidence: GEFS (31 runs) + ECMWF ENS (51 runs), via Open-Meteo.
// All snow totals are per *ski day*: 4pm the day before to 4pm that day.

const WEEK_MODELS = [
  { key: 'ecmwf_ifs025', name: 'European (ECMWF)' },
  { key: 'gfs_seamless', name: 'American (GFS)' },
  { key: 'gem_seamless', name: 'Canadian (GEM)' },
  { key: 'icon_seamless', name: 'German (ICON)' },
];
const WEEK_ENSEMBLES = ['gfs025', 'ecmwf_ifs025'];
const WEEK_DAYS = 7;
let weekSel = 0;

// ---------------------------------------------------------------- loading
async function loadWeek() {
  const midZone = M.zones.find((z) => z.key === 'mid') || M.zones[1];
  const elevM = Math.round(midZone.ft / 3.28084);
  const common = `latitude=${M.lat}&longitude=${M.lon}&elevation=${elevM}&temperature_unit=fahrenheit&precipitation_unit=inch&wind_speed_unit=mph&timezone=${encodeURIComponent(TZ)}&forecast_days=8`;
  const modelsUrl = `https://api.open-meteo.com/v1/forecast?${common}&hourly=snowfall,temperature_2m,wind_gusts_10m&models=${WEEK_MODELS.map((m) => m.key).join(',')}`;
  const ensUrl = `https://ensemble-api.open-meteo.com/v1/ensemble?${common}&hourly=snowfall,temperature_2m,wind_gusts_10m&models=${WEEK_ENSEMBLES.join(',')}`;
  const textUrl = `https://api.weather.gov/gridpoints/${M.nws.office}/${M.nws.x},${M.nws.y}/forecast`;
  const [models, ens, text] = await Promise.all([
    getJSONCached(modelsUrl, 30000).catch((e) => { console.warn('models', e); return null; }),
    getJSONCached(ensUrl, 40000, 90).catch((e) => { console.warn('ensemble', e); return null; }),
    getJSON(textUrl, 30000).catch((e) => { console.warn('nws text', e); return null; }),
  ]);
  if (!models && !ens && !text) throw new Error('No 7-day sources available');
  return { models, ens, text, midZone };
}

// ---------------------------------------------------------------- helpers
const localKey = (d) => { const p = localParts(d); return `${p.date}T${String(p.hour).padStart(2, '0')}:00`; };
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function pct(sorted, p) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
const dayName = (date, i) => (i === 0 && date === localParts(new Date()).date ? 'Today' : new Date(date + 'T12:00').toLocaleDateString('en-US', { weekday: 'short' }));
const dayLong = (date) => new Date(date + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
const snowWindow = (date) => [`${addDays(date, -1)}T16:00`, `${date}T16:00`]; // [start, end)
const inSki = (key, date) => key.slice(0, 10) === date && +key.slice(11, 13) >= 9 && +key.slice(11, 13) < 16;

// Collect member series from an Open-Meteo ensemble response: { var: [[...member values]] }
function ensembleMembers(ens, variable) {
  const out = [];
  if (!ens?.hourly) return out;
  for (const [k, arr] of Object.entries(ens.hourly)) {
    if (k === variable || k.startsWith(variable + '_')) {
      // e.g. snowfall_ncep_gefs025 (control) or snowfall_member07_ecmwf_ifs025_ensemble
      const rest = k.slice(variable.length);
      if (rest === '' || /^_(member\d+_)?[a-z]/.test(rest)) out.push(arr);
    }
  }
  return out;
}

// ---------------------------------------------------------------- building the week
function buildWeek() {
  const W = state.week;
  if (!W) return null;
  const start = state.call?.win?.date || localParts(new Date()).date;
  const dates = Array.from({ length: WEEK_DAYS }, (_, i) => addDays(start, i));
  const nws = state.nws;
  const nwsByKey = new Map((nws?.rows || []).map((r) => [localKey(r.t), r]));
  const elev = state.elev;
  const ensTimes = W.ens?.hourly?.time || [];
  const ensSnow = ensembleMembers(W.ens, 'snowfall');
  const ensTemp = ensembleMembers(W.ens, 'temperature_2m');
  const ensGust = ensembleMembers(W.ens, 'wind_gusts_10m');
  const mTimes = W.models?.hourly?.time || [];

  const days = dates.map((date, i) => {
    const [ws, we] = snowWindow(date);
    const d = { date, i, name: dayName(date, i), long: dayLong(date) };

    // Official NWS: hourly rows for this ski day + written periods
    const skiRows = [];
    let nwsSnow = 0, nwsSnowHours = 0;
    for (const [k, r] of nwsByKey) {
      if (k >= ws && k < we) { nwsSnow += r.snow || 0; nwsSnowHours++; }
      if (inSki(k, date)) skiRows.push(r);
    }
    d.nwsCovered = skiRows.length >= 6 && nwsSnowHours >= 18;
    d.nwsSnow = d.nwsCovered ? nwsSnow : null;
    d.rows = skiRows;
    const periods = W.text?.properties?.periods || [];
    d.dayText = periods.find((p) => p.isDaytime && localParts(new Date(p.startTime)).date === date) || null;
    d.nightText = periods.find((p) => !p.isDaytime && localParts(new Date(p.startTime)).date === date) || null;
    d.prevNightText = periods.find((p) => !p.isDaytime && localParts(new Date(p.startTime)).date === addDays(date, -1)) || null;

    // Ensemble: per-member snow for the ski day, high temp, peak ski-hour gust
    const idxSnow = [], idxDay = [], idxSki = [];
    ensTimes.forEach((t, k) => {
      if (t >= ws && t < we) idxSnow.push(k);
      if (t.slice(0, 10) === date) idxDay.push(k);
      if (inSki(t, date)) idxSki.push(k);
    });
    // Today's window has partly passed, so accept the remaining hours for day 0.
    const complete = idxSnow.length >= (i === 0 ? 6 : 20);
    const snowM = complete ? ensSnow.map((m) => idxSnow.reduce((a, k) => a + (m[k] || 0), 0)).sort((a, b) => a - b) : [];
    const hiM = idxDay.length >= 20 ? ensTemp.map((m) => Math.max(...idxDay.map((k) => m[k] ?? -99))).sort((a, b) => a - b) : [];
    const gustM = idxSki.length ? ensGust.map((m) => Math.max(...idxSki.map((k) => m[k] ?? 0))).sort((a, b) => a - b) : [];
    d.ens = snowM.length ? {
      n: snowM.length,
      p10: pct(snowM, 0.1), p50: pct(snowM, 0.5), p90: pct(snowM, 0.9),
      chance: Object.fromEntries([1, 3, 6, 12].map((th) => [th, Math.round(100 * snowM.filter((v) => v >= th).length / snowM.length)])),
      hiSpread: hiM.length ? pct(hiM, 0.9) - pct(hiM, 0.1) : null,
      gust50: gustM.length ? pct(gustM, 0.5) : null, gust10: gustM.length ? pct(gustM, 0.1) : null, gust90: gustM.length ? pct(gustM, 0.9) : null,
    } : null;

    // Deterministic models: snow for the ski day
    d.models = WEEK_MODELS.map((m) => {
      const arr = W.models?.hourly?.[`snowfall_${m.key}`];
      if (!arr) return { ...m, snow: null };
      let s = 0, n = 0;
      mTimes.forEach((t, k) => { if (t >= ws && t < we && arr[k] != null) { s += arr[k]; n++; } });
      return { ...m, snow: n >= (i === 0 ? 6 : 20) ? s : null };
    });

    // Temperatures by elevation (Open-Meteo, adjusted to each zone)
    d.zones = (elev || []).map((z) => {
      const vals = z.times.map((t, k) => [t, z.hourly.temperature_2m[k]]).filter(([t]) => localParts(t).date === date).map(([, v]) => v).filter((v) => v != null);
      return { ...z.zone, hi: vals.length ? Math.max(...vals) : null, lo: vals.length ? Math.min(...vals) : null };
    });
    const fl = elev?.[0] ? elev[0].times.map((t, k) => [t, elev[0].flFt[k]]).filter(([t]) => inSki(localKey(t), date)).map(([, v]) => v) : [];
    d.freezing = fl.length ? avg(fl) : null;

    // Best single snow number: official NWS where it covers the day, else ensemble median.
    d.snow = d.nwsSnow ?? d.ens?.p50 ?? null;
    d.snowSource = d.nwsSnow != null ? 'NWS' : d.ens ? 'ensemble median' : null;

    // Ski-hour conditions: NWS where covered, else models
    if (skiRows.length >= 6) {
      d.gust = Math.max(...skiRows.map((r) => r.gust ?? 0));
      d.sky = avg(skiRows.map((r) => r.sky ?? 0));
      const wet = skiRows.filter((r) => r.qpf > 0.005);
      d.wetIn = wet.reduce((a, r) => a + (r.qpf || 0), 0);
      d.snowLevel = wet.length ? Math.max(...wet.map((r) => r.snowLevel ?? 0)) : null;
      d.condSource = 'NWS';
    } else if (elev?.[1]) {
      const z = elev[1], b = elev[0];
      const idx = z.times.map((t, k) => [localKey(t), k]).filter(([k]) => inSki(k, date)).map(([, k]) => k);
      d.gust = d.ens?.gust50 ?? (idx.length ? Math.max(...idx.map((k) => z.hourly.wind_gusts_10m[k] ?? 0)) : null);
      d.sky = idx.length && z.hourly.cloud_cover ? avg(idx.map((k) => z.hourly.cloud_cover[k] ?? 0)) : null;
      const baseRain = idx.reduce((a, k) => a + (b.hourly.rain?.[k] || 0), 0);
      const midRain = idx.reduce((a, k) => a + (z.hourly.rain?.[k] || 0), 0);
      d.wetIn = baseRain + midRain;
      d.snowLevel = midRain > 0.02 ? M.zones[1].ft + 500 : baseRain > 0.02 ? M.zones[0].ft + 500 : null;
      d.condSource = 'models';
    }
    d.rainCls = d.snowLevel == null || !(d.wetIn > 0.02) ? 'good' : d.snowLevel > M.zones[1].ft ? 'bad' : d.snowLevel > M.zones[0].ft ? 'ok' : 'good';

    // Confidence from how much the 82 ensemble runs and the 4 models disagree, and lead time
    const spread = d.ens ? d.ens.p90 - d.ens.p10 : null;
    const modelSnow = d.models.map((m) => m.snow).filter((v) => v != null);
    const modelRange = modelSnow.length >= 2 ? Math.max(...modelSnow) - Math.min(...modelSnow) : null;
    let conf = 'med';
    if (spread != null) {
      if (spread <= 1.5 && (d.ens.hiSpread ?? 0) <= 6 && (modelRange ?? 0) <= 2 && i <= 3) conf = 'high';
      else if (spread >= 6 || (d.ens.hiSpread ?? 0) >= 12 || (modelRange ?? 0) >= 6 || (i >= 5 && spread >= 3)) conf = 'low';
    } else conf = 'low';
    if (i >= 5 && conf === 'high') conf = 'med';
    d.conf = conf;
    d.modelRange = modelRange;

    d.score = dayScore(d);
    d.icon = dayIcon(d);
    return d;
  });

  const open = M.season?.openingDay;
  days.forEach((d) => { d.closed = open ? d.date < open : false; });
  const ranked = days.filter((d) => d.score != null).sort((a, b) => b.score - a.score || a.i - b.i);
  // Flag the snowiest day only when it clearly leads (a calculated fact, not a recommendation).
  const mid = (d) => d.ens?.p50 ?? d.snow ?? 0;
  const bySnow = [...days].sort((a, b) => mid(b) - mid(a));
  const snowiest = bySnow[0] && mid(bySnow[0]) >= 1 && mid(bySnow[0]) - mid(bySnow[1] || { snow: 0 }) >= 1 ? bySnow[0] : null;
  if (snowiest) snowiest.mostSnow = true;
  return { days, snowiest, ranked };
}

function dayScore(d) {
  if (d.snow == null && d.gust == null) return null;
  let s = 5;
  const snow = d.snow || 0;
  s += Math.min(4, snow / 2);
  if (d.rainCls === 'bad' && d.wetIn > 0.1) s -= 3;
  else if (d.rainCls === 'ok' && d.wetIn > 0.1) s -= 2;
  if (d.gust >= 55) s -= 3; else if (d.gust >= 40) s -= 1.5; else if (d.gust >= 25) s -= 0.5;
  if (d.sky != null) {
    if (d.sky >= 80 && snow < 3) s -= 1;
    if (d.sky < 30 && snow >= 4) s += 1;
  }
  const baseHi = d.zones?.[0]?.hi;
  if (baseHi != null && baseHi >= 40 && snow < 2) s -= 0.5;
  return Math.round(clamp(s, 1, 10));
}

function dayIcon(d) {
  const t = (d.dayText?.shortForecast || '').toLowerCase();
  if (/rain and snow|rain\/snow|sleet|wintry|freezing/.test(t)) return 'mix';
  if (/snow/.test(t)) return 'snow';
  if (/rain|showers/.test(t)) return 'rain';
  if (/fog/.test(t)) return 'fog';
  if (/sunny|clear/.test(t)) return /partly|mostly sunny/.test(t) ? 'partly' : 'sun';
  if (/cloudy/.test(t)) return /partly/.test(t) ? 'partly' : 'cloud';
  // No written forecast that far out: decide from the numbers
  if ((d.snow || 0) >= 0.5) return d.rainCls === 'good' ? 'snow' : 'mix';
  if (d.rainCls !== 'good') return 'rain';
  if (d.sky == null) return 'cloud';
  return d.sky < 30 ? 'sun' : d.sky < 70 ? 'partly' : 'cloud';
}

function iconSvg(kind) {
  const sun = `<circle cx="20" cy="18" r="8" fill="var(--warning)"/>`;
  const cloud = (x = 0, y = 0, op = 1) => `<path transform="translate(${x} ${y})" d="M14 34 a8 8 0 0 1 1-15.9 a11 11 0 0 1 21 3 a7 7 0 0 1 0 12.9 Z" fill="var(--rock)" opacity="${op}"/>`;
  const flakes = `<g fill="var(--s1)"><circle cx="16" cy="40" r="2.2"/><circle cx="25" cy="43" r="2.2"/><circle cx="34" cy="40" r="2.2"/></g>`;
  const drops = `<g stroke="var(--s1)" stroke-width="2.2" stroke-linecap="round"><path d="M16 38 l-2 5"/><path d="M25 38 l-2 5"/><path d="M34 38 l-2 5"/></g>`;
  const mix = `<g stroke="var(--s1)" stroke-width="2.2" stroke-linecap="round"><path d="M17 38 l-2 5"/><path d="M33 38 l-2 5"/></g><circle cx="25" cy="41" r="2.2" fill="var(--s1)"/>`;
  const fog = `<g stroke="var(--rock)" stroke-width="2.5" stroke-linecap="round"><path d="M8 20h32"/><path d="M12 27h28"/><path d="M8 34h30"/></g>`;
  const body = { sun, partly: sun + cloud(4, 4, 0.9), cloud: cloud(0, 0), snow: cloud(0, -4) + flakes, rain: cloud(0, -4) + drops, mix: cloud(0, -4) + mix, fog }[kind] || cloud();
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
}

function snowRangeText(d) {
  if (d.ens) {
    const lo = Math.floor(d.ens.p10), hi = Math.ceil(d.ens.p90);
    if (d.ens.p90 < 0.5) return 'None';
    if (hi <= 1) return '<1"';
    return `${lo}–${hi}"`;
  }
  if (d.snow != null) return d.snow < 0.5 ? 'None' : `~${r0(d.snow)}"`;
  return '–';
}
const confWord = { high: 'High confidence', med: 'Medium confidence', low: 'Low confidence' };

// ---------------------------------------------------------------- easy-access strip
function renderWeekStrip(week) {
  const box = $('week-strip');
  if (!week) { box.innerHTML = '<div class="lbl">7-day forecast unavailable right now.</div>'; return; }
  box.innerHTML = week.days.map((d, k) => {
    const sc = d.score == null ? '' : d.score >= 7 ? 'good' : d.score >= 4 ? 'ok' : 'bad';
    const base = d.zones[0], top = d.zones[d.zones.length - 1];
    const dots = { high: 3, med: 2, low: 1 }[d.conf];
    return `<button class="day ${d.mostSnow ? 'best' : ''}" type="button" data-i="${k}" style="animation-delay:${k * 0.05}s" aria-label="${esc(d.long)}: score ${d.score ?? 'n/a'} of 10, snow ${snowRangeText(d)}, ${confWord[d.conf]}">
      ${d.mostSnow ? '<span class="best-tag">Most snow</span>' : ''}
      <span class="dn">${esc(d.name)}</span><span class="dd">${new Date(d.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      <span class="di">${iconSvg(d.icon)}</span>
      <span class="ds ${sc}" title="Ski score out of 10">${d.score ?? '–'}<small>/10</small></span>
      <span class="dsnow"><b>${snowRangeText(d)}</b><small>likely snow</small></span>
      <span class="dt"><small>high</small> ${r0(base?.hi)}° <small>base</small> · ${r0(top?.hi)}° <small>top</small></span>
      <span class="dw ${d.gust >= 40 ? 'warn' : ''}">Gusts ${r0(d.gust)} mph</span>
      <span class="dc c-${d.conf}" title="How much the 82 model runs agree">${{ high: 'High', med: 'Medium', low: 'Low' }[d.conf]} confidence</span>
      ${d.closed ? '<span class="dclosed">Lifts closed</span>' : ''}
    </button>`;
  }).join('');
  box.querySelectorAll('.day').forEach((b) => b.addEventListener('click', () => {
    weekSel = Number(b.dataset.i);
    document.querySelector('[data-tab="week"]')?.click();
    document.getElementById('data')?.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
  }));
  const W = state.week || {};
  const missing = [
    !state.nws && 'NWS hourly forecast', !W.text && 'NWS written forecast', !state.elev && 'elevation temperatures',
    !W.models && 'model comparison', !W.ens && 'ensemble ranges',
  ].filter(Boolean);
  $('week-summary').textContent = weekSummary(week) + (missing.length ? ` Heads up: couldn't load the ${missing.join(', ')}, so some scores and ranges are less reliable right now. Refresh to try again.` : '');
}

function weekSummary(week) {
  // Facts only: scores, snow, rain, wind. The reader decides what's worth it.
  const ds = week.days.filter((d) => d.score != null);
  if (!ds.length) return '';
  const parts = [];
  const hi = Math.max(...ds.map((d) => d.score)), lo = Math.min(...ds.map((d) => d.score));
  const names = (arr) => arr.map((d) => d.name).join(', ');
  parts.push(hi === lo ? `Scores: ${hi}/10 every day.` : `Scores: ${hi}/10 ${names(ds.filter((d) => d.score === hi))}; ${lo}/10 ${names(ds.filter((d) => d.score === lo))}.`);
  const mid = (d) => d.ens?.p50 ?? d.snow ?? 0;
  const total = ds.reduce((a, d) => a + mid(d), 0);
  const snowy = ds.filter((d) => mid(d) >= 1);
  if (snowy.length) parts.push(`Snow: ${snowy.map((d) => `${d.name} ${snowRangeText(d)}`).join(', ')}.`);
  else {
    const outside = ds.filter((d) => d.ens).sort((a, b) => b.ens.chance[3] - a.ens.chance[3])[0];
    parts.push(outside && outside.ens.chance[3] >= 10 ? `Snow: little expected; ${outside.name} has a ${outside.ens.chance[3]}% chance of 3"+.` : 'Snow: none of note.');
  }
  parts.push(`Week total ~${r1(total)}" (middle estimate).`);
  const rainy = ds.filter((d) => d.rainCls !== 'good');
  if (rainy.length) parts.push(`Rain on the mountain: ${names(rainy)}.`);
  const windy = ds.filter((d) => d.gust >= 40);
  if (windy.length) parts.push(`Gusts 40+ mph: ${windy.map((d) => `${d.name} ${r0(d.gust)}`).join(', ')}.`);
  const warm = ds.filter((d) => (d.zones?.[0]?.hi ?? 0) >= 40);
  if (warm.length) parts.push(`Base above 40°F: ${names(warm)}.`);
  if (week.days.some((d) => d.closed)) parts.push(`Lifts open ${new Date(M.season.openingDay + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`);
  return parts.join(' ');
}

// ---------------------------------------------------------------- in-depth tab
function drawWeekTab() {
  const week = state.weekView;
  if (!week) { $('wk-detail').innerHTML = '<p class="lead">7-day forecast unavailable right now.</p>'; return; }
  weekSel = clamp(weekSel, 0, week.days.length - 1);
  const pick = $('wk-pick');
  pick.innerHTML = week.days.map((d, k) => `<button type="button" role="tab" aria-selected="${k === weekSel}" data-i="${k}">${esc(d.name)}<small>${new Date(d.date + 'T12:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</small></button>`).join('');
  pick.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { weekSel = Number(b.dataset.i); drawWeekTab(); }));
  renderDayDetail(week.days[weekSel]);
  drawWeekCharts(week);
  renderWeekTables(week);
}

function renderDayDetail(d) {
  const per = (p) => p ? `<div class="wk-period"><h4>${esc(p.name)}</h4><p>${esc(p.detailedForecast)}</p></div>` : '';
  const official = d.dayText || d.nightText
    ? `${per(d.prevNightText)}${per(d.dayText)}${per(d.nightText)}`
    : '<p class="fine">The National Weather Service\'s written forecast doesn\'t reach this far out yet. The numbers below come from the computer models.</p>';
  const z = d.zones;
  const chance = d.ens ? [1, 3, 6, 12].map((th) => `<span class="ch"><b>${d.ens.chance[th]}%</b> ≥${th}"</span>`).join('') : '<span class="fine">No ensemble data</span>';
  const models = d.models.map((m) => `<span>${esc(m.name.split(' ')[0])} <b>${m.snow == null ? '–' : r1(m.snow) + '"'}</b></span>`).join('');
  $('wk-detail').innerHTML = `
    <div class="wk-head">
      <div class="wk-icon">${iconSvg(d.icon)}</div>
      <div><h3>${esc(d.long)}</h3><div class="lbl">${d.dayText ? esc(d.dayText.shortForecast) : 'Model forecast'} · <span class="st ${d.conf === 'high' ? 'good' : d.conf === 'med' ? 'ok' : 'bad'}"><i aria-hidden="true">${d.conf === 'high' ? '✓' : d.conf === 'med' ? '!' : '?'}</i>${confWord[d.conf]}</span>${d.closed ? ' · Lifts not open yet' : ''}</div></div>
      <div class="wk-score ${d.score >= 7 ? 'good' : d.score >= 4 ? 'ok' : 'bad'}">${d.score ?? '–'}<small>/10</small></div>
    </div>
    <div class="wk-grid">
      <div class="wk-stat"><span class="wk-k">Snow (4pm–4pm)</span><span class="wk-v">${snowRangeText(d)}</span><span class="wk-s">${d.snowSource === 'NWS' ? `NWS: ${r1(d.nwsSnow)}"` : d.ens ? `Middle estimate ${r1(d.ens.p50)}"` : ''}</span></div>
      <div class="wk-stat"><span class="wk-k">Chance of at least</span><span class="chances">${chance}</span></div>
      <div class="wk-stat"><span class="wk-k">Models (mid-mountain)</span><span class="models">${models}</span></div>
      <div class="wk-stat"><span class="wk-k">Temps (high / low)</span><span class="wk-v sm">${z.map((x) => `${esc(x.name.replace(' (mid)', '').replace(' base', ''))} ${r0(x.hi)}° / ${r0(x.lo)}°`).join('<br>')}</span></div>
      <div class="wk-stat"><span class="wk-k">Freezing level, ski hours</span><span class="wk-v">${ftFmt(d.freezing)} ft</span><span class="wk-s">${d.rainCls === 'bad' ? 'Rain likely up past mid-mountain' : d.rainCls === 'ok' ? 'Rain possible at the base' : d.wetIn > 0.02 ? 'Snow to the base' : 'Dry'}</span></div>
      <div class="wk-stat"><span class="wk-k">Peak gusts, ski hours</span><span class="wk-v ${d.gust >= 40 ? 'warn' : ''}">${r0(d.gust)} mph</span><span class="wk-s">${d.ens?.gust10 != null ? `Range ${r0(d.ens.gust10)}–${r0(d.ens.gust90)} mph` : ''}${d.gust >= 40 ? ' · upper-lift holds possible' : ''}</span></div>
    </div>
    <div class="wk-official"><h4 class="sec-h">Official forecast <span class="src f">National Weather Service</span></h4>${official}</div>`;

  // Hour-by-hour for the chosen day (NWS), single-axis charts
  const rows = (state.nws?.rows || []).filter((r) => localParts(r.t).date === d.date && localParts(r.t).hour >= 6 && localParts(r.t).hour <= 20);
  const hb = $('wk-hourly');
  if (rows.length >= 6) {
    hb.hidden = false;
    const labels = rows.map((r) => fmtTime(r.t, { hour: 'numeric' }));
    drawChart('c-wk-temp', { type: 'line', data: { labels, datasets: [lineDs('Temperature', rows.map((r) => r.temp), '--s1'), lineDs('Wind chill', rows.map((r) => r.chill), '--s2')] }, options: chartOpts({ refLines: [{ y: 32, label: '32°F' }], xTicks: 8 }) });
    drawChart('c-wk-snow', { type: 'bar', data: { labels, datasets: [barDs('Snowfall', rows.map((r) => r.snow), '--s1')] }, options: chartOpts({ legend: false, yMin: 0, xTicks: 8 }) });
  } else {
    hb.hidden = true;
  }
}

function drawWeekCharts(week) {
  const labels = week.days.map((d) => d.name);
  const opts = (o) => chartOpts({ ...o, xTicks: 7 });
  // A. Ensemble snow range per day (floating bar 10th–90th percentile) + median and NWS
  const rangeColor = color(cssVar('--s1'), 0.35);
  drawChart('c-wk-range', {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Likely range (80% of runs)', data: week.days.map((d) => (d.ens ? [d.ens.p10, d.ens.p90] : null)), backgroundColor: rangeColor, borderRadius: 4, borderSkipped: false, maxBarThickness: 24 },
        { type: 'line', label: 'Middle estimate', data: week.days.map((d) => d.ens?.p50 ?? null), borderColor: cssVar('--s1'), backgroundColor: cssVar('--s1'), showLine: false, pointRadius: 5, pointHoverRadius: 7, pointBorderColor: cssVar('--surface'), pointBorderWidth: 2 },
        { type: 'line', label: 'NWS official', data: week.days.map((d) => d.nwsSnow), borderColor: cssVar('--s2'), backgroundColor: cssVar('--s2'), showLine: false, pointStyle: 'rectRot', pointRadius: 6, pointHoverRadius: 8, pointBorderColor: cssVar('--surface'), pointBorderWidth: 2 },
      ],
    },
    options: { ...opts({ yMin: 0 }), interaction: { mode: 'index', intersect: false } },
  });
  // B. Cumulative snow by model
  const vars = ['--s1', '--s2', '--s3', '--s4'];
  const cum = (vals) => { let a = 0; return vals.map((v) => (v == null ? null : (a += v))); };
  drawChart('c-wk-models', {
    type: 'line',
    // Running totals can only rise, so use monotone smoothing (no fake dips).
    data: { labels, datasets: WEEK_MODELS.map((m, k) => ({ ...lineDs(m.name, cum(week.days.map((d) => d.models[k].snow)), vars[k]), cubicInterpolationMode: 'monotone' })) },
    options: opts({ yMin: 0 }),
  });
  // C. Highs and lows at base and summit (floating bars)
  const z0 = 0, zt = Math.max(0, (state.elev?.length || 1) - 1);
  drawChart('c-wk-temps', {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: `${M.zones[z0].name} low–high`, data: week.days.map((d) => (d.zones[z0] ? [d.zones[z0].lo, d.zones[z0].hi] : null)), backgroundColor: cssVar('--s1'), borderRadius: 4, borderSkipped: false, maxBarThickness: 18 },
        { label: `${M.zones[zt].name} low–high`, data: week.days.map((d) => (d.zones[zt] ? [d.zones[zt].lo, d.zones[zt].hi] : null)), backgroundColor: cssVar('--s2'), borderRadius: 4, borderSkipped: false, maxBarThickness: 18 },
      ],
    },
    options: opts({ refLines: [{ y: 32, label: '32°F' }] }),
  });
  // D. Peak gusts in ski hours: best estimate + ensemble range
  drawChart('c-wk-gust', {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Likely range', data: week.days.map((d) => (d.ens?.gust10 != null ? [d.ens.gust10, d.ens.gust90] : null)), backgroundColor: color(cssVar('--s1'), 0.35), borderRadius: 4, borderSkipped: false, maxBarThickness: 24 },
        { type: 'line', label: 'Best estimate', data: week.days.map((d) => d.gust), borderColor: cssVar('--s2'), backgroundColor: cssVar('--s2'), showLine: false, pointRadius: 5, pointBorderColor: cssVar('--surface'), pointBorderWidth: 2 },
      ],
    },
    options: opts({ yMin: 0, refLines: [{ y: 40, label: '40 mph upper-lift holds' }] }),
  });
}

function renderWeekTables(week) {
  // Chance-of-snow grid
  const ths = [1, 3, 6, 12];
  const cell = (v) => {
    if (v == null) return '<td>–</td>';
    const a = 0.08 + (v / 100) * 0.6;
    return `<td class="pc" style="background:${color(cssVar('--s1'), a)}">${v}%</td>`;
  };
  $('wk-chance').innerHTML = `<thead><tr><th>Snow for the ski day</th>${week.days.map((d) => `<th>${esc(d.name)}</th>`).join('')}</tr></thead><tbody>${ths.map((t) => `<tr><td>At least ${t}"</td>${week.days.map((d) => cell(d.ens?.chance[t] ?? null)).join('')}</tr>`).join('')}</tbody>`;
  // Full table
  const head = ['Day', 'Score', 'Confidence', 'Snow range', 'NWS snow', 'Middle est.', ...WEEK_MODELS.map((m) => m.name.split(' ')[0]), ...M.zones.map((z) => `${z.name.replace(' (mid)', '')} hi/lo`), 'Freezing lvl ft', 'Gusts mph', 'Cloud %', 'Official forecast'];
  $('wk-table').innerHTML = `<thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${week.days.map((d) => `<tr>
    <td>${esc(d.long)}</td><td>${d.score ?? '–'}</td><td>${confWord[d.conf].replace(' confidence', '')}</td><td>${snowRangeText(d)}</td>
    <td>${d.nwsSnow == null ? '–' : r1(d.nwsSnow)}</td><td>${d.ens ? r1(d.ens.p50) : '–'}</td>
    ${d.models.map((m) => `<td>${m.snow == null ? '–' : r1(m.snow)}</td>`).join('')}
    ${d.zones.map((z) => `<td>${r0(z.hi)} / ${r0(z.lo)}</td>`).join('')}
    <td>${ftFmt(d.freezing)}</td><td${d.gust >= 40 ? ' class="warn"' : ''}>${r0(d.gust)}</td><td>${r0(d.sky)}</td>
    <td style="white-space:normal;text-align:left;min-width:220px">${esc(d.dayText?.shortForecast || '–')}</td></tr>`).join('')}</tbody>`;
}
