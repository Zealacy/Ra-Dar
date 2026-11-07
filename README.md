# Ra-Dar: ski weather 🎿

A ski-focused weather tracker for **Mt. Bachelor, Oregon**, published with GitHub Pages.
It's a static site with no server, no build step and no API keys. Everything loads live in the visitor's browser.

## What's on the page

| Section | What it shows | Source | Type |
|---|---|---|---|
| **The Call** | Animated score dial, headline and status chips, plus visual cards: a mountain profile with temperature at base/mid/summit and the freezing or snow line, a snow stake meter with falling snow, a wind compass with gust dial, a cloud-cover timeline, and a snowpack meter vs normal | Combines the sources below | Measured + forecast |
| **Snow stake** | Live West Village snow stake cam | Mt. Bachelor | Measured |
| **Resort weather stations** | Temp and wind at the lift tops | Mt. Bachelor station graphic | Measured |
| **Webcams** | 8 official cams, ordered by how useful they are for skiing, refreshed every 5 minutes | Mt. Bachelor | Live |
| **Live readings** tab: snowpack | Depth, 24/48/72h change, SWE, % of median, new-snow density, temps, precip, 7-day chart | NRCS SNOTEL (3 stations) | Measured |
| **Hour by hour** | 96 hours of temp, wind chill, dewpoint, RH, wind, gusts, sky, precip chance and amount, snowfall, snow level, visibility | National Weather Service | Forecast |
| **Base to summit** | 7-day hi/lo, snow, rain and gusts at base, mid and summit, plus freezing level | Open-Meteo | Forecast |
| **Forecaster notes** | The NWS forecasters' written discussion, turned into readable sections: key messages up front, ski-relevant sentences highlighted, jargon explained on tap, and the original text kept at the bottom | NWS Pendleton | Forecast |
| **Radar loop** | Latest precipitation radar | RainViewer | Measured |

All values are in US units (°F, inches, mph, feet). Data refreshes every 10 minutes and webcams every 5.

## Layout

The page detects phone, tablet or desktop (`<html data-device>`) and adapts:
desktop uses a dashboard grid, and phones get swipeable charts and a compact header.
The technical data lives in tabs (Live readings · Hour by hour · Base to summit · Radar loop · Forecaster notes), so the page stays short.
Animations turn off automatically for visitors who have reduced motion enabled.

## Files

- `index.html`: page layout
- `style.css`: styling, with light/dark mode and phone layout
- `mountains.js`: mountain settings (location, elevations, SNOTEL stations, cams). Add a new mountain here.
- `app.js`: loads the data, does the calculations, and draws the charts and The Call

Open another mountain with `?mtn=<key>` once it's added to `mountains.js`.

## Run locally

`python3 -m http.server`, then open http://localhost:8000.

Unofficial fan site, not affiliated with Mt. Bachelor. Always check the official mountain report and the avalanche forecast.
