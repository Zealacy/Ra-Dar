# Freshness and fields of NWS-listed stations' last 48 reports. Usage: python3 -I obs.py STATION [STATION ...]
import json, urllib.request, sys, datetime as dt
H={'User-Agent':'radar-research','Accept':'application/geo+json'}
now=dt.datetime.now(dt.timezone.utc)
for sid in sys.argv[1:]:
  try:
    d=json.load(urllib.request.urlopen(urllib.request.Request(f'https://api.weather.gov/stations/{sid}/observations?limit=48',headers=H),timeout=60))
  except Exception as e: print(f'{sid:6} ERR {e}'); continue
  fs=[f['properties'] for f in d['features']]
  if not fs: print(f'{sid:6} no observations'); continue
  cnt=lambda k: sum((p.get(k) or {}).get('value') is not None for p in fs)
  t0=dt.datetime.fromisoformat(fs[0]['timestamp']); age=(now-t0).total_seconds()/3600
  c=lambda v: None if v is None else round(v*9/5+32,1); k=lambda v: None if v is None else round(v/1.609)
  g=lambda p,key:(p.get(key) or {}).get('value')
  T=[(p['timestamp'][11:16],c(g(p,'temperature'))) for p in fs[:3]]
  print(f"{sid:6} {len(fs):2} obs, newest {age:4.1f} h ago | T {cnt('temperature')} wind {cnt('windSpeed')} gust {cnt('windGust')} dir {cnt('windDirection')} RH {cnt('relativeHumidity')} | now T {c(g(fs[0],'temperature'))}F wind {k(g(fs[0],'windSpeed'))} gust {k(g(fs[0],'windGust'))} dir {g(fs[0],'windDirection')} | {T}")
