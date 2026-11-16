# How close Open-Meteo's hourly temperature is to measured stations over the last 7 days (for Mt. Spokane's Right now estimates,
# nowModel). Each site is modeled at the station's own point and height. Usage: python3 -I model-check-spokane.py
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
        if t.minute == 0: out[t] = v * 9 / 5 + 32
    return out
def model(lat, lon, elev_m):
    d = get(f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&elevation={elev_m}&hourly=temperature_2m&past_days=8&forecast_days=1&temperature_unit=fahrenheit&timezone=GMT')
    return {dt.datetime.fromisoformat(t).replace(tzinfo=dt.timezone.utc): v for t, v in zip(d['hourly']['time'], d['hourly']['temperature_2m']) if v is not None}
def compare(name, meas, mod):
    pairs = [(meas[t], mod[t]) for t in meas if t in mod and begin <= t <= end]
    err = [m2 - m1 for m1, m2 in pairs]; ab = [abs(e) for e in err]
    print(f"{name}: {len(pairs)} hours | average miss {st.mean(ab):.1f}F | bias {st.mean(err):+.1f}F (model minus measured) | within 2F {100*sum(a<=2 for a in ab)/len(ab):.0f}% | within 3F {100*sum(a<=3 for a in ab)/len(ab):.0f}% | worst {max(ab):.1f}F")
print('7 days ending', end.isoformat())
compare('Mt. Spokane area: Quartz Peak SNOTEL 4,710 ft', snotel('707:WA:SNTL'), model(47.8793, -117.0894, round(4710/3.28084)))
compare('Mt. Spokane area: Ragged Mtn SNOTEL 4,210 ft ', snotel('1081:ID:SNTL'), model(47.8558, -117.0367, round(4210/3.28084)))
compare('Yardstick: Stevens Pass Tye Mill 5,180 ft     ', nws('STS54'), model(47.7316, -121.0853, round(5180/3.28084)))
compare('Yardstick: Stevens Pass SNOTEL 3,940 ft       ', snotel('791:WA:SNTL'), model(47.7461, -121.0929, round(3940/3.28084)))
