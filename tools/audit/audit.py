"""Independent re-computation of every number Ra-Dar shows, from the raw responses the page received.
Usage: python3 -I audit.py <captureDir> [mtn ...]. Prints MISMATCH lines; anything else is informational."""
import json, sys, os, re, math, statistics as st
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

CAP = sys.argv[1]
MTNS = sys.argv[2:] or sorted(n for n in os.listdir(CAP) if os.path.isfile(os.path.join(CAP, n, 'snapshot.json')))
problems = []

def iso(s): return datetime.fromisoformat(s.replace('Z', '+00:00'))
def close(a, b, tol=0.05):
    if a is None or b is None: return a is None and b is None
    return abs(a - b) <= tol
def check(m, what, site, mine, tol=0.05):
    ok = close(site, mine, tol)
    if not ok:
        problems.append(f'{m}: {what}: site {site} vs recomputed {mine}')
        print(f'   MISMATCH {what}: site {site} vs recomputed {mine}')
    return ok
def pct(sorted_vals, p):
    if not sorted_vals: return None
    i = (len(sorted_vals) - 1) * p; lo = math.floor(i); hi = math.ceil(i)
    return sorted_vals[lo] + (sorted_vals[hi] - sorted_vals[lo]) * (i - lo)
def mi(a, b, c, d):
    R = 3958.8; p1, p2 = math.radians(a), math.radians(c); dl = math.radians(d - b)
    x = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))

UNIT = {'wmoUnit:degC': lambda v: v * 9 / 5 + 32, 'wmoUnit:km_h-1': lambda v: v / 1.609344, 'wmoUnit:m_s-1': lambda v: v * 2.236936,
        'wmoUnit:mm': lambda v: v / 25.4, 'wmoUnit:m': lambda v: v * 3.28084}
def conv(v, u): return None if v is None else UNIT.get(u, lambda x: x)(v)
def dur_hours(d):
    m = re.match(r'P(?:(\d+)D)?(?:T(?:(\d+)H)?)?', d)
    return (int(m.group(1) or 0) * 24 + int(m.group(2) or 0)) or 1
def expand(layer, acc=False):
    out = {}
    if not layer or 'values' not in layer: return out
    for v in layer['values']:
        s, d = v['validTime'].split('/'); h = dur_hours(d); t0 = iso(s); val = conv(v['value'], layer.get('uom'))
        for k in range(h): out[t0 + timedelta(hours=k)] = (val / h if (acc and val is not None) else val)
    return out

for m in MTNS:
    d = os.path.join(CAP, m)
    snap = json.load(open(os.path.join(d, 'snapshot.json')))
    idx = json.load(open(os.path.join(d, 'index.json')))
    def resp(pattern, all_=False):
        hits = [json.load(open(os.path.join(d, e['file']))) for e in idx if re.search(pattern, e['url'])]
        return hits if all_ else (hits[-1] if hits else None)
    M = snap['M']; TZ = ZoneInfo(M['tz']); now = iso(snap['capturedAt'])
    zones = M['zones']; midI = next(i for i, z in enumerate(zones) if z['key'] == 'mid')
    print(f'\n==================== {m}   (captured {now.astimezone(TZ):%a %b %d %I:%M %p})   {snap["updated"]}')

    # ---------- hourly forecast rows
    rows = snap['nws']['rows'] if snap['nws'] else []
    rowT = [iso(r['t']) for r in rows]
    if M['nws']:
        g = resp(r'/gridpoints/\w+/\d+,\d+$')['properties']
        L = {k: expand(g.get(src), acc) for k, src, acc in [('temp', 'temperature', 0), ('chill', 'windChill', 0), ('dew', 'dewpoint', 0), ('rh', 'relativeHumidity', 0),
             ('wind', 'windSpeed', 0), ('gust', 'windGust', 0), ('dir', 'windDirection', 0), ('sky', 'skyCover', 0), ('pop', 'probabilityOfPrecipitation', 0),
             ('qpf', 'quantitativePrecipitation', 1), ('snow', 'snowfallAmount', 1), ('snowLevel', 'snowLevel', 0), ('vis', 'visibility', 0)]}
        check(m, 'NWS cell elevation ft', snap['nws']['elevFt'], g['elevation']['value'] * 3.28084, 0.5)
        bad = 0
        for r, t in zip(rows, rowT):
            for k in L:
                mine = L[k].get(t)
                if k == 'vis' and mine is not None: mine = mine / 5280
                if not close(r[k], mine, 1e-6): bad += 1; problems.append(f'{m}: NWS {k} at {t}: site {r[k]} vs {mine}') if bad < 4 else None
        expected = [t for t in sorted(L['temp']) if t >= rowT[0] and t < rowT[0] + timedelta(hours=192)] if rowT else []
        print(f' NWS rows: {len(rows)} hours, {bad} field mismatches; hours with a temperature in the window: {len(expected)}')
        if len(expected) != len(rows): problems.append(f'{m}: NWS rows count {len(rows)} vs {len(expected)}')
    else:
        gm = resp(r'models=gem_seamless&hourly=temperature_2m,dew')
        h = gm['hourly']; off = timedelta(seconds=gm['utc_offset_seconds'])
        tm = {datetime.fromisoformat(t).replace(tzinfo=timezone.utc) - off: i for i, t in enumerate(h['time'])}
        bad = 0
        for r, t in zip(rows, rowT):
            i = tm[t]; T = h['temperature_2m'][i]; V = h['wind_speed_10m'][i]
            chill = 35.74 + 0.6215 * T - 35.75 * V ** 0.16 + 0.4275 * T * V ** 0.16 if (T <= 50 and V > 3) else None
            for k, mine in [('temp', T), ('wind', V), ('gust', h['wind_gusts_10m'][i]), ('dir', h['wind_direction_10m'][i]), ('sky', h['cloud_cover'][i]),
                            ('pop', h['precipitation_probability'][i]), ('qpf', h['precipitation'][i]), ('snow', h['snowfall'][i]), ('chill', chill)]:
                if not close(r[k], mine, 1e-6): bad += 1
        print(f' GEM rows: {len(rows)} hours, {bad} field mismatches')

    # ---------- stations
    maxAge = M['maxAge'] or 3
    for cfg, ss in zip(M['stations'], snap['stations']):
        fs = resp(rf'/stations/{cfg["id"]}/observations')
        obs = []
        for f in fs['features']:
            p = f['properties']
            o = {'t': iso(p['timestamp']), 'temp': conv(p['temperature']['value'], p['temperature']['unitCode']), 'wind': conv(p['windSpeed']['value'], p['windSpeed']['unitCode']),
                 'gust': conv((p.get('windGust') or {}).get('value'), (p.get('windGust') or {}).get('unitCode')), 'dir': p['windDirection']['value']}
            if o['temp'] is not None or o['wind'] is not None: obs.append(o)
        obs.sort(key=lambda o: o['t'])
        s = ss['stats']; last = obs[-1] if obs else None
        ageH = (now - last['t']).total_seconds() / 3600 if last else None
        tObs = next((o for o in reversed(obs) if o['temp'] is not None), None)
        temp = tObs['temp'] if tObs and (now - tObs['t']).total_seconds() / 3600 <= maxAge else None
        in24 = [o for o in obs if o['t'] >= now - timedelta(hours=24)]
        temps = [o['temp'] for o in in24 if o['temp'] is not None]
        g24 = [(o['gust'] if o['gust'] is not None else o['wind']) for o in in24]; g24 = [x for x in g24 if x is not None]
        lastHr = [o for o in obs if last and o['t'] >= last['t'] - timedelta(hours=1)]
        gnow = max([(o['gust'] if o['gust'] is not None else (o['wind'] or 0)) for o in lastHr] + [0]) if lastHr else None
        print(f' station {cfg["id"]} ({cfg["ft"]} ft): temp site {s["temp"]} mine {temp} | last report {ageH and round(ageH,2)} h ago | hi/lo site {s["hi24"]}/{s["lo24"]}')
        check(m, f'{cfg["id"]} temp', s['temp'], temp, 0.01)
        # hi/lo use the page's own clock (a few seconds earlier), so allow a boundary report to differ
        if temps: check(m, f'{cfg["id"]} 24h high', s['hi24'], max(temps), 0.6); check(m, f'{cfg["id"]} 24h low', s['lo24'], min(temps), 0.6)
        if g24: check(m, f'{cfg["id"]} 24h max gust', s['gust24'], max(g24), 0.6)
        check(m, f'{cfg["id"]} gust last hr', s['gustNow'], gnow, 0.01)
        check(m, f'{cfg["id"]} wind', s['wind'], last['wind'] if last else None, 0.01)

    # ---------- SNOTEL (hourly; AWDB reports Pacific standard time all year)
    hr = resp(r'awdbRestApi.*duration=HOURLY')
    for s in snap['snotel']:
        st_ = next((x for x in (hr or []) if x['stationTriplet'] == s['id']), None)
        if not st_: print(f' SNOTEL {s["id"]}: no hourly data'); continue
        ser = {}
        for el in st_['data']:
            ser[el['stationElement']['elementCode']] = [(datetime.fromisoformat(v['date']).replace(tzinfo=timezone(timedelta(hours=-8))), v['value']) for v in el['values'] if v.get('value') is not None]
        def at(arr, t):
            best = min(arr, key=lambda x: abs(x[0] - t)) if arr else None
            return best[1] if best and abs(best[0] - t) <= timedelta(hours=2) else None
        D = ser.get('SNWD', []); W = ser.get('WTEQ', []); T = ser.get('TOBS', [])
        ref = (D or W or T)[-1][0] if (D or W or T) else None
        dep = D[-1][1] if D else None
        d24 = (D[-1][1] - at(D, ref - timedelta(hours=24))) if D and at(D, ref - timedelta(hours=24)) is not None else None
        x = s['stats']
        print(f' SNOTEL {s["id"]} {"(on site)" if s["onSite"] else "(regional)"}: depth site {x["depth"]} mine {dep} | 24h change {x["d24"]}/{d24} | SWE {x["swe"]}/{W[-1][1] if W else None} | temp {x["temp"]}/{T[-1][1] if T else None}')
        check(m, f'SNOTEL {s["id"]} depth', x['depth'], dep, 0.01); check(m, f'SNOTEL {s["id"]} d24', x['d24'], d24, 0.01)
        check(m, f'SNOTEL {s["id"]} SWE', x['swe'], W[-1][1] if W else None, 0.01); check(m, f'SNOTEL {s["id"]} temp', x['temp'], T[-1][1] if T else None, 0.01)

    # ---------- elevation model: rain/snow split, temps in the ski window, past snow
    E = snap['elev']
    raw = resp(r'api\.open-meteo\.com/v1/forecast\?latitude=[-\d.,]+&longitude=[-\d.,]+&elevation=[\d,]+&hourly=temperature_2m,apparent')
    raw = raw if isinstance(raw, list) else [raw]
    levels = {iso(r['t']): r['snowLevel'] for r in rows if r.get('snowLevel') is not None}
    def split(t, p, T, ft):
        w = p or 0
        L_ = levels.get(t - timedelta(hours=1)); L_ = L_ if L_ is not None else levels.get(t)  # precip stamped t fell in the hour before
        if L_ is not None: share = min(1, max(0, (ft - (L_ - 500)) / 1000))
        elif T is None: share = 0
        else: share = min(1, max(0, (36 - T) / 4))
        return w * share * 7, w * (1 - share)
    local = now.astimezone(TZ)
    def hours_on(day):  # the mountain's ski hours (skiHours in mountains.js; JS day numbers, Sunday = 0)
        h = M.get('skiHours') or {}
        return tuple(h.get(str((day.weekday() + 1) % 7)) or h.get('default') or (9, 16))
    winDate = local.date() if local.hour < hours_on(local.date())[1] - 1 else (local + timedelta(days=1)).date()
    H0, H1 = hours_on(winDate)
    def inWin(t): l = t.astimezone(TZ); return l.date() == winDate and H0 <= l.hour < H1
    zt = []
    for i, (z, rz) in enumerate(zip(E, raw)):
        off = timedelta(seconds=rz['utc_offset_seconds'])
        times = [datetime.fromisoformat(t).replace(tzinfo=timezone.utc) - off for t in rz['hourly']['time']]
        tsite = [iso(t) for t in z['times']]
        if times != tsite: problems.append(f'{m}: elevation times differ for {z["zone"]}')
        sn, rn = zip(*[split(t, p, T, z['ft']) for t, p, T in zip(times, rz['hourly']['precipitation'], rz['hourly']['temperature_2m'])])
        bad = sum(1 for a, b in zip(z['snow'], sn) if abs(a - b) > 1e-9) + sum(1 for a, b in zip(z['rain'], rn) if abs(a - b) > 1e-9)
        ds = [sum(v for t, v in zip(rz['hourly']['time'], sn) if t.startswith(day)) for day in rz['daily']['time']]
        bad += sum(1 for a, b in zip(z['dailySnow'], ds) if abs(a - b) > 1e-9)
        win = [T for t, T in zip(times, rz['hourly']['temperature_2m']) if inWin(t)]
        zt.append((z['zone'], sum(win) / len(win), min(win), max(win)))
        print(f' elevation {z["zone"]} {z["ft"]} ft: rain/snow split + daily sums: {bad} mismatches | ski-window temps avg {zt[-1][1]:.1f} min {zt[-1][2]} max {zt[-1][3]} ({len(win)} h, {winDate})')
        if bad: problems.append(f'{m}: elevation split mismatches {bad} at {z["zone"]}')
    call = snap['call']
    if call.get('temp'):
        for (k, a, lo, hi), sz in zip(zt, call['temp']['zones']):
            check(m, f'ski-window avg temp {k}', sz['avg'], a, 1e-6); check(m, f'ski-window min {k}', sz['min'], lo, 1e-6); check(m, f'ski-window max {k}', sz['max'], hi, 1e-6)
        fl = [v for t, v in zip([iso(t) for t in E[0]['times']], E[0]['fl']) if inWin(t)]
        check(m, 'freezing level avg', call['temp']['freezing'], sum(fl) / len(fl) if fl else None, 1e-6)
    # past snow (3 days), split by temperature (no NWS snow level for the past)
    pastR = resp(r'hourly=precipitation,temperature_2m&past_days=3')
    pastR = pastR if isinstance(pastR, list) else [pastR]
    zi = next(i for i, z in enumerate(zones) if z['key'] == M['snowZone'])
    if pastR and pastR[0]:
        pr = pastR[zi]; off = timedelta(seconds=pr['utc_offset_seconds'])
        pt = [datetime.fromisoformat(t).replace(tzinfo=timezone.utc) - off for t in pr['hourly']['time']]
        pp, pT = pr['hourly']['precipitation'], pr['hourly']['temperature_2m']
    else:  # the 3-day request failed: the page falls back to the season-long series from the same model
        print('   (3-day past-snow request failed; checking the page\'s fallback to the season series)')
        z_ = snap['preRaw'][zi]; pt = [iso(t) for t in z_['times']]; pp, pT = z_['precip'], z_['temp']
    psn = [((p or 0) * min(1, max(0, (36 - T) / 4)) * 7 if T is not None else 0) for p, T in zip(pp, pT)]
    # the page uses its own clock (seconds before capture): same hours unless an hour boundary fell between
    d24 = sum(v for t, v in zip(pt, psn) if now - timedelta(hours=24) < t <= now); d72 = sum(v for t, v in zip(pt, psn) if now - timedelta(hours=72) < t <= now)
    print(f' fresh snow (model, {zones[zi]["ft"]} ft): 24h site {call["snow"]["d24"]:.2f} mine {d24:.2f} | 72h site {call["snow"]["d72"]:.2f} mine {d72:.2f}')
    check(m, 'fresh snow 24h', call['snow']['d24'], d24, 0.01); check(m, 'fresh snow 72h', call['snow']['d72'], d72, 0.01)

    # ---------- ski-day call from the hourly rows
    win = [(t, r) for t, r in zip(rowT, rows) if inWin(t)]
    if win:
        gust = max((r['gust'] or 0) for _, r in win); wind = max((r['wind'] or 0) for _, r in win)
        dirs = [r['dir'] for _, r in win if r['dir'] is not None]
        mdir = (math.degrees(math.atan2(sum(math.sin(math.radians(x)) for x in dirs), sum(math.cos(math.radians(x)) for x in dirs))) + 360) % 360
        sky = sum((r['sky'] or 0) for _, r in win) / len(win)
        vis = [r['vis'] for _, r in win if r['vis'] is not None]
        chill = min((r['chill'] if r['chill'] is not None else (r['temp'] if r['temp'] is not None else 99)) for _, r in win)
        snowF = sum((r['snow'] or 0) for t, r in zip(rowT, rows) if t <= win[-1][0])
        print(f' ski day {winDate}: gust {gust:.1f} wind {wind:.1f} dir {mdir:.0f} | sky {sky:.0f}% vis {min(vis) if vis else None} | wind chill {chill:.1f} | snow to 4pm {snowF:.2f}')
        check(m, 'window gust', call['wind']['gust'], gust, 1e-6); check(m, 'window wind', call['wind']['wind'], wind, 1e-6); check(m, 'window dir', call['wind']['dir'], mdir, 0.01)
        check(m, 'window sky', call['sky']['avg'], sky, 1e-6); check(m, 'window vis', call['sky']['vis'], min(vis) if vis else None, 1e-6)
        check(m, 'window chill', call['temp']['chill'], chill, 1e-6); check(m, 'snow to 4pm', call['snow']['forecast'], snowF, 1e-6)
        wet = [r for _, r in win if (r['qpf'] or 0) > 0.005]
        print(f'   wet hours {len(wet)}, water {sum(r["qpf"] or 0 for r in wet):.2f} in | site rain class {call["rain"]["cls"]}, snow level {call["rain"].get("snowLevel")}')

    # ---------- week: 82-run ranges per ski day (4pm to 4pm), models, temps by elevation
    W = snap['week']; ens = resp(r'ensemble-api.*elevation=\d+&'); mod = resp(r'hourly=snowfall,temperature_2m,wind_gusts_10m&models=')
    eh = ens['hourly']; et = eh['time']
    def members(var): return [v for k, v in eh.items() if k == var or re.match(rf'^{var}_(member\d+_)?[a-z]', k)]
    snowM = members('snowfall')
    print(f' week: {len(snowM)} ensemble runs')
    for dd in W['days']:
        date = dd['date']; prev = (datetime.fromisoformat(date) - timedelta(days=1)).date().isoformat()
        ws, we = f'{prev}T16:00', f'{date}T16:00'
        ix = [k for k, t in enumerate(et) if ws < t <= we]  # Open-Meteo sums are end-stamped
        complete = len(ix) >= (6 if dd is W['days'][0] else 20)
        tot = sorted(sum((mm[k] or 0) for k in ix) for mm in snowM) if complete else []
        if dd['ens'] and tot:
            check(m, f'week {date} p10', dd['ens']['p10'], pct(tot, .1), 1e-6); check(m, f'week {date} p50', dd['ens']['p50'], pct(tot, .5), 1e-6); check(m, f'week {date} p90', dd['ens']['p90'], pct(tot, .9), 1e-6)
            for th in (1, 3, 6, 12): check(m, f'week {date} chance>={th}', dd['ens']['chance'][str(th)], round(100 * sum(v >= th for v in tot) / len(tot)), 0)
        for md in dd['models']:
            arr = mod['hourly'].get(f'snowfall_{md["key"]}')
            if arr is None: continue
            vals = [arr[k] for k, t in enumerate(mod['hourly']['time']) if ws < t <= we and arr[k] is not None]
            mine = sum(vals) if len(vals) >= (6 if dd is W['days'][0] else 20) else None
            check(m, f'week {date} model {md["key"]}', md['snow'], mine, 1e-6)
    # next 7 days (tile and chart's mid bar)
    off = timedelta(seconds=ens['utc_offset_seconds'])
    tt = [datetime.fromisoformat(t).replace(tzinfo=timezone.utc) - off for t in et]
    ix = [k for k, t in enumerate(tt) if now < t <= now + timedelta(days=7)]
    tot = sorted(sum((mm[k] or 0) for k in ix) for mm in snowM)
    we_ = W['weekEns']
    print(f' next 7 days at mid-mountain: site {we_["p10"]:.2f}/{we_["p50"]:.2f}/{we_["p90"]:.2f} mine {pct(tot,.1):.2f}/{pct(tot,.5):.2f}/{pct(tot,.9):.2f} ({len(ix)} h)')
    check(m, 'next7 p50', we_['p50'], pct(tot, .5), 0.05); check(m, 'next7 p10', we_['p10'], pct(tot, .1), 0.05); check(m, 'next7 p90', we_['p90'], pct(tot, .9), 0.05)

    # ---------- preseason snowfall since Oct 1 (+ the next 7 days)
    if snap['pre']:
        P = snap['pre']; PR = snap['preRaw']; start = datetime.fromisoformat(P['start'] + 'T00:00:00').replace(tzinfo=None)
        det = []; season = []; last7 = []
        for z in PR:
            ts = [iso(t) for t in z['times']]
            snow = [split(t, p, T, z['ft'])[0] for t, p, T in zip(ts, z['precip'], z['temp'])]
            if any(abs(a - b) > 1e-9 for a, b in zip(snow, z['snow'])): problems.append(f'{m}: preseason split differs at {z["zone"]}')
            # the site compares "t >= local-midnight Oct 1" using the browser clock's zone (UTC in the test runner)
            season.append(sum(v for t, v, key in zip(ts, snow, z['keys']) if key > P['start'] + 'T00:00' and t <= now))
            last7.append(sum(v for t, v in zip(ts, snow) if now - timedelta(days=7) < t <= now))
            det.append(sum(v for t, v in zip(ts, snow) if now < t <= now + timedelta(days=7)))
        for i, (z, s_, l7) in enumerate(zip(P['zones'], season, last7)):
            share = det[i] / det[midI] if det[midI] >= 0.1 else (1 if i == midI else 0)
            coming = P['week']['p50'] * share if P['week'] else det[i]
            print(f' preseason {z["key"]}: since Oct 1 site {z["seasonSnow"]:.2f} mine {s_:.2f} | last 7 days {z["last7"]:.2f}/{l7:.2f} | coming {z["next7"]:.2f}/{coming:.2f}')
            check(m, f'season snow {z["key"]}', z['seasonSnow'], s_, 0.01); check(m, f'last7 {z["key"]}', z['last7'], l7, 0.05); check(m, f'coming {z["key"]}', z['next7'], coming, 0.05)

    # ---------- model "Right now"
    if snap['modelNow']:
        for z, rz in zip(reversed(E), reversed(raw)):
            off = timedelta(seconds=rz['utc_offset_seconds']); ts = [datetime.fromisoformat(t).replace(tzinfo=timezone.utc) - off for t in rz['hourly']['time']]
            k = max(i for i, t in enumerate(ts) if t <= now); a, b = rz['hourly']['temperature_2m'][k], rz['hourly']['temperature_2m'][k + 1]
            mine = a + (b - a) * (now - ts[k]).total_seconds() / 3600
            site = next(x['temp'] for x in snap['modelNow']['zones'] if x['key'] == z['zone'])
            print(f' right now (model) {z["zone"]}: site {site:.2f} mine {mine:.2f}')
            check(m, f'model now {z["zone"]}', site, mine, 0.15)

    # ---------- ECCC daily (Sun Peaks)
    if snap['daily']:
        dr = resp(r'climate-daily'); feats = [f['properties'] for f in dr['features']]
        withSnow = [f for f in feats if f.get('SNOW_ON_GROUND') is not None]
        print(f' ECCC daily: {len(feats)} rows this season, {len(withSnow)} with snow on the ground; site latest: {[(s["id"], s["last"]) for s in snap["daily"]]}')
        if withSnow and not any(s['last'] for s in snap['daily']): problems.append(f'{m}: ECCC has snow reports the site missed')

    # ---------- configuration vs the sources' own records
    for cfg in M['stations']:
        md = resp(rf'/stations/{cfg["id"]}/observations')['features']
        el = md[0]['properties']['elevation']['value'] * 3.28084 if md else None
        print(f' config station {cfg["id"]}: config {cfg["ft"]} ft, reported at {round(el) if el else "(no recent reports)"} ft')
    print(' rendered text:', snap['text']['chips'], '|', snap['text']['snowNums'], '|', snap['text']['windCap'], '|', snap['text']['skySub'])

print('\n==================== SUMMARY')
print('\n'.join(problems) if problems else 'No mismatches.')
