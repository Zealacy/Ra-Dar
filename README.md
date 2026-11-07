# Ra-Dar: ski weather 🎿

A ski-focused weather tracker for **Mt. Bachelor, Oregon**, published with GitHub Pages.
It's a static site with no server, no build step and no API keys. Everything loads live in the visitor's browser.

## What's on the page

| Section | What it shows | Source | Type |
|---|---|---|---|
| **The Call** | Animated score dial, headline and status chips, plus visual cards: a mountain profile with temperature at base/mid/summit and the freezing or snow line, a snow stake meter with falling snow, a wind compass with gust dial, a cloud-cover timeline, and a snowpack meter vs normal | Combines the sources below | Measured + forecast |
| **Briefing** | Short factual lines for the morning-of or night-before check: lift status, current readings, overnight snow, snow or rain timing and snow level, temps by elevation, wind chill, freezing level, wind and lift-hold risk, modeled new snow, freeze-thaw, visibility, the road sensor, and the score. Facts only, no advice | Same data as the cards | Measured + forecast |
| **Lifts** (summary, shelved) | Season status and Opening Day countdown, a ring of all 12 lifts, and lift pills grouped by exposure, colored by wind-hold risk during ski hours | Official lift list + NWS gust forecast | Estimate |
| **Lifts** tab | Mt. Bachelor's official live lift board (Open / Closed / On Hold / Expected). The wind-hold estimate is shelved (`features.liftEstimate` in `mountains.js`) | Mt. Bachelor | Live |
| **Week ahead** (summary) | 7 day cards: weather icon, 1–10 ski score, likely snow range, base and summit highs, gusts, a confidence rating, a "Most snow" badge when one day clearly leads, and a factual one-line week summary | NWS + 4 models + 82 ensemble runs | Forecast |
| **Next 7 days** tab | Day picker with the NWS written forecast, chance of ≥1/3/6/12", per-model snow, temps by elevation, freezing level, gusts and hourly charts; plus week charts (ensemble snow range, total snow by model, base/summit lows–highs, gust ranges), a chance-of-snow grid, an accuracy guide and a full table | NWS; Open-Meteo (GFS, ECMWF, GEM, ICON; GEFS + ECMWF ensembles) | Forecast |
| **Snow stake** | Live West Village snow stake cam | Mt. Bachelor | Measured |
| **Resort weather stations** | Temp and wind at the lift tops | Mt. Bachelor station graphic | Measured |
| **Webcams** | 8 official cams, ordered by how useful they are for skiing, refreshed every 5 minutes | Mt. Bachelor | Live |
| **Live readings** | 48-hour temperature and wind charts from the on-mountain stations, the resort's lift-top graphic, a station table, and the regional SNOTEL stations (labeled, not used in the score) | COAC, ODOT, OSU via NWS; Mt. Bachelor; NRCS SNOTEL | Measured |
| **Hour by hour** | 96 hours of temp, wind chill, dewpoint, RH, wind, gusts, sky, precip chance and amount, snowfall, snow level, visibility | National Weather Service | Forecast |
| **Base to summit** | 7-day hi/lo, snow, rain and gusts at base, mid and summit, plus freezing level | Open-Meteo | Forecast |
| **Forecaster notes** | The NWS forecasters' written discussion, turned into readable sections: key messages up front, ski-relevant sentences highlighted, jargon explained on tap, and the original text kept at the bottom | NWS Pendleton | Forecast |
| **Radar loop** | Latest precipitation radar | RainViewer | Measured |

All values are in US units (°F, inches, mph, feet). Data refreshes every 10 minutes and webcams every 5.

## Preseason mode

Before Opening Day (`season.openingDay` in `mountains.js`), the page leads with snowpack: modeled snow depth at the base, mid-mountain and summit now and 7 days out, season snowfall since Oct 1, the week's snow range and chances (82 ensemble runs), and the snow stake cam, plus a Snowpack tab with 30-day and 7-day charts. Ski-day cards are hidden. It turns off by itself on Opening Day, and visitors can switch views with the button in the header.

## Data quality rules

- **On-mountain readings only.** "Right now" and The Call use live stations on or beside the ski area: COAC Moon Mountain (7,450 ft), ODOT Century Dr at the ski area (6,424 ft) and the OSU West Village snow pillow (6,375 ft). They come through the National Weather Service observation network.
- **Stale data is dropped.** A station that hasn't reported within `stationMaxAgeHours` (3 hours) shows as offline and is ignored.
- **Distant stations are not used for conditions.** The SNOTEL stations are 11–18 miles away and up to 1,500 ft below the base, so they appear only as a labeled regional reference.
- **Estimates are labeled.** No public snow-depth sensor reports from the mountain, so new snow is a model estimate at the ski area's elevations, tagged *Model*, with the snow stake cam beside it as the real-world check.
- Every value is tagged *Measured*, *Forecast* or *Model*, and the page lists every source in "Where the data comes from".

## Layout

The page detects phone, tablet or desktop (`<html data-device>`) and adapts:
desktop uses a dashboard grid, and phones get swipeable charts and a compact header.
The technical data lives in tabs (Live readings · Hour by hour · Base to summit · Radar loop · Forecaster notes), so the page stays short.
Animations turn off automatically for visitors who have reduced motion enabled.

## Files

- `index.html`: page layout
- `style.css`: styling, with light/dark mode and phone layout
- `mountains.js`: mountain settings (location, elevations, SNOTEL stations, cams). Add a new mountain here.
- `preseason.js`: preseason mode (snowpack-first layout and the Snowpack tab)
- `week.js`: the 7-day forecast (Week ahead strip and Next 7 days tab)
- `app.js`: loads the data, does the calculations, and draws the charts and The Call

Open another mountain with `?mtn=<key>` once it's added to `mountains.js`.

## Run locally

`python3 -m http.server`, then open http://localhost:8000.

Unofficial fan site, not affiliated with Mt. Bachelor. Always check the official mountain report and the avalanche forecast.
