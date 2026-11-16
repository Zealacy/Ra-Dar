import json, math, urllib.request
def mi(a,b,c,e):
  R=3958.8;p1,p2=math.radians(a),math.radians(c);dl=math.radians(e-b)
  return 2*R*math.asin(math.sqrt(math.sin((p2-p1)/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2))
# Every NWS-listed station within 10 miles of one or two points. Usage: python3 -I stations-near.py STATE lat,lon [lat,lon]
# Example (Palisades Tahoe village and Alpine Meadows base): python3 -I stations-near.py CA 39.1970,-120.2357 39.1641,-120.2386
import sys
PAL=tuple(map(float,sys.argv[2].split(','))); ALP=tuple(map(float,(sys.argv[3] if len(sys.argv)>3 else sys.argv[2]).split(',')))
url=f'https://api.weather.gov/stations?state={sys.argv[1]}&limit=500'; out=[]; n=0
while url and n<40:
  n+=1
  d=json.load(urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'radar-research','Accept':'application/geo+json'}),timeout=90))
  fs=d['features']
  if not fs: break
  for f in fs:
    lon,lat=f['geometry']['coordinates'][:2];p=f['properties']
    d1,d2=mi(*PAL,lat,lon),mi(*ALP,lat,lon)
    if min(d1,d2)<10: out.append((min(d1,d2),d1,d2,p['stationIdentifier'],p['name'],(p['elevation']['value'] or 0)*3.28084,lat,lon))
  url=d.get('pagination',{}).get('next')
print('pages',n)
for o in sorted(out): print(f'{o[3]:9} {o[4][:44]:44} {o[5]:6.0f} ft  pt1 {o[1]:4.1f} mi  pt2 {o[2]:4.1f} mi  {o[6]:.4f},{o[7]:.4f}')
