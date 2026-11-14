# How close Open-Meteo's hourly temperature is to measured stations over the last 7 days (for Appalachian Ski Mtn.'s Right now estimates,
# nowModel). Each site is modeled at the station's own point and height. Usage: python3 -I model-check-appalachian.py
import json, urllib.request, urllib.parse, time, datetime as dt, statistics as st
A = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1'
def get(url, tries=4):
    for i in range(tries):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'check'}), timeout=60))
        except Exception as e: err = e; time.sleep(4)
    raise err
end = dt.datetime.now(dt.timezone.utc).replace(minute=0, second=0, microsecond=0) - dt.timedelta(hours=2)
begin = end - dt.timedelta(days=7)
def snotel(trip):
    q = urllib.parse.urlencode({'stationTriplets': trip, 'elements': 'TOBS', 'duration': 'HOURLY', 'periodRef': 'END',
        'beginDate': (begin - dt.timedelta(hours=8)).strftime('%Y-%m-%d %H:%M'), 'endDate': (end - dt.timedelta(hours=8)).strftime('%Y-%m-%d %H:%M')})
    d = get(f'{A}/data?{q}')
    return {dt.datetime.fromisoformat(v['date']).replace(tzinfo=dt.timezone.utc) + dt.timedelta(hours=8): v['value'] for v in d[0]['data'][0]['values'] if v.get('value') is not None}
def nws(sid):
    d = get(f'https://api.weather.gov/stations/{sid}/observations?start={begin.strftime("%Y-%m-%dT%H:%M:%SZ")}&limit=500')
    out = {}
    for f in d['features']:
        p = f['properties']; v = p['temperature']['value']
        if v is None: continue
        t = dt.datetime.fromisoformat(p['timestamp']).astimezone(dt.timezone.utc)
        r = (t + dt.timedelta(minutes=10)).replace(minute=0, second=0)
        if abs((t - r).total_seconds()) <= 600 and r not in out: out[r] = v * 9 / 5 + 32
    return out
def model(lat, lon, elev_m):
    d = get(f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&elevation={elev_m}&hourly=temperature_2m&past_days=8&forecast_days=1&temperature_unit=fahrenheit&timezone=GMT')
    return {dt.datetime.fromisoformat(t).replace(tzinfo=dt.timezone.utc): v for t, v in zip(d['hourly']['time'], d['hourly']['temperature_2m']) if v is not None}
def compare(name, meas, mod):
    pairs = [(meas[t], mod[t]) for t in meas if t in mod and begin <= t <= end]
    err = [m2 - m1 for m1, m2 in pairs]; ab = [abs(e) for e in err]
    print(f"{name}: {len(pairs)} hours | average miss {st.mean(ab):.1f}F | bias {st.mean(err):+.1f}F (model minus measured) | within 2F {100*sum(a<=2 for a in ab)/len(ab):.0f}% | within 3F {100*sum(a<=3 for a in ab)/len(ab):.0f}% | worst {max(ab):.1f}F")
print('7 days ending', end.isoformat())
compare('Boone: KTNB hospital heliport 3,146 ft        ', nws('KTNB'), model(36.1986, -81.6517, round(3146/3.28084)))
compare('Boone: App State WeatherSTEM 3,291 ft         ', nws('0586W'), model(36.2114, -81.6855, round(3291/3.28084)))
compare('Yardstick: Stevens Pass Tye Mill 5,180 ft     ', nws('STS54'), model(47.7316, -121.0853, round(5180/3.28084)))
