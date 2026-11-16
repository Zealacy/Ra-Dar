# Builds preview.html: a general landscape for the link preview (1200x630). No live data, no mountain names.
import random, math
W, H = 1200, 630
rnd = random.Random(7)

def ridge(base, amp, rough, peaks=(), step=6, seed=0):
    """A natural ridgeline: smoothed random walk plus optional peaks (x, height, width)."""
    r = random.Random(seed)
    ys, y = [], 0.0
    for x in range(0, W + step, step):
        y += r.uniform(-rough, rough); y *= 0.97
        ys.append(y)
    pts = []
    for i, x in enumerate(range(0, W + step, step)):
        v = base + ys[i] * amp
        for px, ph, pw in peaks:
            d = abs(x - px) / pw
            if d < 1: v -= ph * (1 - d) ** 1.6 * (1 + 0.04 * r.uniform(-1, 1))
        pts.append((x, v))
    return pts

def path(pts):
    return 'M0,%d ' % H + ' '.join('L%.1f,%.1f' % p for p in pts) + ' L%d,%d Z' % (W, H)

def line(pts):
    return 'M' + ' L'.join('%.1f,%.1f' % p for p in pts)

far = ridge(372, 1.0, 3.2, peaks=[(150, 70, 150), (470, 40, 120), (1010, 85, 170)], seed=1)
main = ridge(430, 0.6, 2.6, peaks=[(760, 245, 260), (560, 120, 150), (1060, 140, 170), (300, 90, 160)], seed=2)
mid = ridge(492, 1.2, 3.0, peaks=[(120, 70, 190), (980, 60, 220)], seed=3)
near = ridge(560, 0.9, 2.4, peaks=[(420, 50, 260), (1140, 40, 160)], seed=4)

# Snow on the main range: everything above a snowline, with a ragged lower edge.
snowline = 322
_r = random.Random(11); _w, _edge = 0.0, []
for _ in range(W // 6 + 2):
    _w += _r.uniform(-7, 7); _w *= 0.85; _edge.append(_w)
def snow_edge(x):
    return snowline + _edge[int(x) // 6] * 1.4 + (6 if (int(x) // 6) % 5 == 0 else 0)
def snowpath(pts):
    out = []
    for x, y in pts:
        edge = snow_edge(x)
        out.append((x, min(y, edge) if y < edge else edge))
    # polygon: ridge on top, ragged snowline below
    top = ' L'.join('%.1f,%.1f' % p for p in out)
    bottom = ' L'.join('%.1f,%.1f' % (x, snow_edge(x)) for x, _ in reversed(out))
    return 'M' + top + ' L' + bottom + ' Z'

# Trees along the near ridge
trees = []
for x, y in near[::2]:
    if rnd.random() < 0.82:
        h = rnd.uniform(26, 58); w = h * rnd.uniform(0.32, 0.42); xx = x + rnd.uniform(-4, 4)
        trees.append(f'<path d="M{xx:.1f},{y - h:.1f} L{xx + w / 2:.1f},{y + 4:.1f} L{xx - w / 2:.1f},{y + 4:.1f} Z"/>')
trees_mid = []
for x, y in mid[::3]:
    if rnd.random() < 0.5:
        h = rnd.uniform(12, 24); w = h * 0.38; xx = x + rnd.uniform(-3, 3)
        trees_mid.append(f'<path d="M{xx:.1f},{y - h:.1f} L{xx + w / 2:.1f},{y + 3:.1f} L{xx - w / 2:.1f},{y + 3:.1f} Z"/>')

stars = ''.join(f'<circle cx="{rnd.uniform(0, W):.0f}" cy="{rnd.uniform(0, 210) ** 1.15 / 210 ** 0.15:.0f}" r="{rnd.choice([0.8, 1, 1.2, 1.6])}" opacity="{rnd.uniform(0.25, 0.8):.2f}"/>' for _ in range(70))
flakes = ''.join(f'<circle cx="{rnd.uniform(0, W):.0f}" cy="{rnd.uniform(0, H):.0f}" r="{rnd.uniform(1.2, 3.2):.1f}" opacity="{rnd.uniform(0.35, 0.85):.2f}"/>' for _ in range(55))

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#0b1a2b"/><stop offset="0.26" stop-color="#1d3557"/>
    <stop offset="0.42" stop-color="#4f5f92"/><stop offset="0.53" stop-color="#b58aa6"/><stop offset="0.62" stop-color="#f2b59a"/><stop offset="0.7" stop-color="#ffd7a6"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.64" cy="0.56" r="0.42">
    <stop offset="0" stop-color="#ffe2b8" stop-opacity="0.6"/><stop offset="1" stop-color="#ffd9a8" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="snow" x1="0" y1="0" x2="1" y2="0.3">
    <stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#ffeef0"/><stop offset="1" stop-color="#d7e2f7"/>
  </linearGradient>
  <linearGradient id="rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a7fae"/><stop offset="1" stop-color="#3f4d78"/></linearGradient>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a2b" stop-opacity="0"/><stop offset="1" stop-color="#0b1a2b" stop-opacity="0.35"/></linearGradient>
</defs>
<rect width="{W}" height="{H}" fill="url(#sky)"/>
<rect width="{W}" height="{H}" fill="url(#glow)"/>
<g fill="#ffffff">{stars}</g>
<path d="{path(far)}" fill="#a597c0" opacity="0.8"/>
<path d="{path(main)}" fill="url(#rock)"/>
<path d="{snowpath(main)}" fill="url(#snow)"/>
<path d="{path(mid)}" fill="#2b3f63"/>
<g fill="#22355a">{''.join(trees_mid)}</g>
<path d="{path(near)}" fill="#13253f"/>
<g fill="#13253f">{''.join(trees)}</g>
<rect width="{W}" height="{H}" fill="url(#fade)"/>
<g fill="#ffffff">{flakes}</g>
<g font-family="Inter, sans-serif" fill="#ffffff">
  <text x="72" y="132" font-size="92" font-weight="800" letter-spacing="-2">Ra-Dar</text>
  <text x="76" y="180" font-size="27" font-weight="600" letter-spacing="7" fill="#8fc1ff">SKI WEATHER</text>
</g>
</svg>'''
html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: Inter; font-weight: 800; src: url(file:///usr/share/fonts/opentype/inter/Inter-ExtraBold.otf); }}
@font-face {{ font-family: Inter; font-weight: 600; src: url(file:///usr/share/fonts/opentype/inter/Inter-SemiBold.otf); }}
html,body{{margin:0;padding:0;background:#0b1a2b}} svg{{display:block}}
</style></head><body>{svg}</body></html>'''
open('preview.html', 'w').write(html)
print('ok')
