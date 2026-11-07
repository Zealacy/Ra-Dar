# Ra-Dar: ski weather 🎿

A ski-focused weather tracker for **Mt. Bachelor, Oregon**, published with GitHub Pages.
It's a static site with no server, no build step and no API keys. Everything loads live in the visitor's browser.

## What's on the page

| Section | What it shows | Source | Type |
|---|---|---|---|
| **The Call** | A 1–10 ski score, a headline, and color-coded factors: new snow, snow forecast, rain/snow line, wind and lift-hold risk, visibility, temperature and snow surface, snowpack | Combines the sources below | Measured + forecast |
| **Snow stake** | Live West Village snow stake cam | Mt. Bachelor | Measured |
| **Resort weather stations** | Temp and wind at the lift tops | Mt. Bachelor station graphic | Measured |
| **Webcams** | 8 official cams, ordered by how useful they are for skiing, refreshed every 5 minutes | Mt. Bachelor | Live |
| **Measured snowpack** | Depth, 24/48/72h change, SWE, % of median, new-snow density, temps, precip, 7-day chart | NRCS SNOTEL (3 stations) | Measured |
| **Hourly forecast** | 96 hours of temp, wind chill, dewpoint, RH, wind, gusts, sky, precip chance and amount, snowfall, snow level, visibility | National Weather Service | Forecast |
| **By elevation** | 7-day hi/lo, snow, rain and gusts at base, mid and summit, plus freezing level | Open-Meteo | Forecast |
| **Discussion** | The NWS forecaster's written discussion | NWS Pendleton | Forecast |
| **Radar** | Latest precipitation radar | RainViewer | Measured |

All values are in US units (°F, inches, mph, feet). Data refreshes every 10 minutes and webcams every 5.

## Files

- `index.html`: page layout
- `style.css`: styling, with light/dark mode and phone layout
- `mountains.js`: mountain settings (location, elevations, SNOTEL stations, cams). Add a new mountain here.
- `app.js`: loads the data, does the calculations, and draws the charts and The Call

Open another mountain with `?mtn=<key>` once it's added to `mountains.js`.

## Run locally

`python3 -m http.server`, then open http://localhost:8000.

Unofficial fan site, not affiliated with Mt. Bachelor. Always check the official mountain report and the avalanche forecast.
