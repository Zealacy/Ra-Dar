"""Checks the facts written into mountains.js against each source's own records.
Usage: python3 -I meta.py <captureDir>"""
import json, sys, os, math, re, time, urllib.request

CAP = sys.argv[1]
def get(url):
    for i in range(4):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'check', 'Accept': 'application/geo+json' if 'weather.gov' in url else 'application/json'}), timeout=60))
        except Exception as e: err = e; time.sleep(3)
    raise err
def mi(a, b, c, d):
    R = 3958.8; p1, p2 = math.radians(a), math.radians(c); dl = math.radians(d - b)
    x = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(x))
def bearing(a, b, c, d):
    y = math.sin(math.radians(d - b)) * math.cos(math.radians(c))
    x = math.cos(math.radians(a)) * math.sin(math.radians(c)) - math.sin(math.radians(a)) * math.cos(math.radians(c)) * math.cos(math.radians(d - b))
    return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][round(((math.degrees(math.atan2(y, x)) + 360) % 360) / 45) % 8]
flags = []
A = 'https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1'
for m in sorted(n for n in os.listdir(CAP) if os.path.isfile(os.path.join(CAP, n, 'snapshot.json'))):
    snap = json.load(open(os.path.join(CAP, m, 'snapshot.json'))); M = snap['M']
    print(f'\n== {m}  point {M["lat"]}, {M["lon"]}')
    if M['nws']:
        g = get(f'https://api.weather.gov/gridpoints/{M["nws"]["office"]}/{M["nws"]["x"]},{M["nws"]["y"]}')
        print(f'  NWS cell {M["nws"]["office"]}/{M["nws"]["x"]},{M["nws"]["y"]}: averages {g["properties"]["elevation"]["value"]*3.28084:.0f} ft')
        pt = get(f'https://api.weather.gov/points/{M["lat"]},{M["lon"]}')['properties']
        same = (pt['gridId'], pt['gridX'], pt['gridY']) == (M['nws']['office'], M['nws']['x'], M['nws']['y'])
        print(f'  the site\'s point falls in cell {pt["gridId"]}/{pt["gridX"]},{pt["gridY"]} ({"same" if same else "DIFFERENT"} cell)')
    for s in M['stations']:
        md = get(f'https://api.weather.gov/stations/{s["id"]}')
        lon, lat = md['geometry']['coordinates']; el = md['properties']['elevation']['value'] * 3.28084
        print(f'  station {s["id"]} {s["name"]}: config {s["ft"]} ft | NWS record {el:.0f} ft at {lat:.4f},{lon:.4f} | {mi(M["lat"],M["lon"],lat,lon):.1f} mi {bearing(M["lat"],M["lon"],lat,lon)} of the site point')
        if abs(el - s['ft']) > 15: flags.append(f'{m} {s["id"]}: elevation config {s["ft"]} vs record {el:.0f}')
    sn = ([M['snowSensor']] if M['snowSensor'] else []) + (M['snotel'] or [])
    if sn:
        meta = get(f'{A}/stations?stationTriplets={",".join(x["id"] for x in sn)}&returnStationElements=false')
        for x in sn:
            r = next(y for y in meta if y['stationTriplet'] == x['id'])
            d_ = mi(M['lat'], M['lon'], r['latitude'], r['longitude'])
            print(f'  SNOTEL {x["id"]} {x["name"]}: config {x["ft"]} ft, {x.get("mi")} mi | record {r["elevation"]:.0f} ft at {r["latitude"]:.4f},{r["longitude"]:.4f} | {d_:.1f} mi {bearing(M["lat"],M["lon"],r["latitude"],r["longitude"])} of the site point')
            if abs(r['elevation'] - x['ft']) > 15: flags.append(f'{m} {x["id"]}: elevation config {x["ft"]} vs record {r["elevation"]:.0f}')
    if M['snowDaily']:
        st_ = get(f'https://api.weather.gc.ca/collections/climate-stations/items?f=json&bbox={M["snowDaily"]["bbox"]}&skipGeometry=false&properties=CLIMATE_IDENTIFIER,STATION_NAME,ELEVATION')
        for f in st_['features']:
            p = f['properties']; cfg = next((x for x in M['snowDaily']['stations'] if x['id'] == p['CLIMATE_IDENTIFIER']), None)
            el = float(p['ELEVATION']) * 3.28084
            print(f'  ECCC {p["CLIMATE_IDENTIFIER"]} {p["STATION_NAME"]}: config {cfg and cfg["ft"]} ft | record {el:.0f} ft')
            if cfg and abs(el - cfg['ft']) > 15: flags.append(f'{m} ECCC {cfg["id"]}: elevation {cfg["ft"]} vs {el:.0f}')
    print('  zones:', ', '.join(f'{z["key"]} {z["ft"]} ft' for z in M['zones']), '| season', M['season'])
print('\nFLAGS:\n' + ('\n'.join(flags) if flags else 'none'))
