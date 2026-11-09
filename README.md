# Ra-Dar: ski weather 🎿

A ski weather tracker for **Mt. Bachelor, Oregon**: **https://ra-dar-alpha.vercel.app/**

It's a static site hosted on Vercel, with no server, no build step and no API keys. Everything loads live in the visitor's browser from public sources. It's written for experienced skiers: it gives the data and calculations, and leaves the decisions to them.

## Two views

**Preseason** (automatic until Opening Day, Dec 4, 2026; switches off by itself):

- Opening Day countdown and a measured **Right now** readout from the on-mountain stations
- **Snowfall by elevation** since Oct 1, plus the next 7 days (model)
- Last-7-day snowfall, the week's snow range from 82 ensemble runs, and the chance of ≥6"/≥12"
- The live **snow stake cam**
- A **Snowpack** tab with season and daily snowfall charts

**Ski-day view** (after Opening Day, or via the header button):

- **Ski-day forecast:** the day and hours it covers, factual status chips (new snow, rain, wind, sky, temps), and a big **mountain infographic**:
  - temperature at the base, mid-mountain and summit
  - freezing or snow level ("↑ below freezing / ↓ above freezing")
  - summit wind
  - snow or rain in the sky
  - which day and hours it covers
- Cards around it:
  - **Wind** dial with labeled zones (Light / Breezy / Lift holds)
  - **Fresh snow** stake meter with the stake cam
  - **Sky** cloud cover by hour
  - **Right now** station readings
- **Briefing:** short factual lines (snow and rain timing, temps by elevation, wind and lift-hold risk, freeze-thaw, visibility, road sensor). No advice.

**Both views:**

- **Week ahead:** 7 day cards (Today, Tomorrow, …), each with likely snow range, highs, gusts and confidence in words. The summary line is factual.
- **Webcams:** a carousel led by the snow stake, with cameras labeled by their real location (none is at the summit).

## Detail tabs

| Tab | What it shows | Source |
|---|---|---|
| Snowpack (preseason) | Running and daily snowfall by elevation, with the forecast continued, and a table | Open-Meteo (model) |
| Live readings | 48-hour temperature and wind from the on-mountain stations, the resort's lift-top station graphic, a station table, and regional SNOTEL (labeled, reference only) | COAC, ODOT, OSU via NWS; Mt. Bachelor; NRCS |
| Hour by hour | 96 hours of NWS forecast: temperature, wind chill, wind, gusts, sky, precipitation, snowfall, snow level, visibility | National Weather Service |
| Next 7 days | Day picker with the NWS written forecast, chance of ≥1/3/6/12", per-model snow, temps by elevation and hourly charts; week charts and a chance-of-snow grid; accuracy guide | NWS; Open-Meteo (GFS, ECMWF, GEM, ICON; GEFS + ECMWF ensembles) |
| Base to summit | 7-day temperatures, snow, rain, gusts and freezing level at three elevations | Open-Meteo |
| Lifts | Mt. Bachelor's own live lift board (Open / Closed / On Hold / Expected), embedded | Mt. Bachelor |
| Radar loop | The last 2 hours of radar | RainViewer |
| Forecaster notes | The NWS forecast discussion, made readable: key messages, ski-relevant highlights, jargon explained, the original at the bottom | NWS Pendleton |

All values are in US units (°F, inches, mph, feet). Data refreshes every 10 minutes and webcams every 5.

## Data quality rules

- **Only data that represents the ski area.** Live readings come from stations on or beside it: COAC Moon Mountain (7,450 ft), ODOT Century Dr (6,424 ft) and the OSU West Village snow pillow (6,375 ft), via the NWS network. Distant SNOTEL stations are a labeled regional reference only.
- **Stale data is dropped.** Stations silent for 3+ hours show as offline and are ignored.
- **Every value is tagged** *Measured*, *Forecast* or *Model*. No public sensor measures snow depth on the mountain, so snow amounts are model estimates, shown beside the stake cam. Modeled snow *depth* isn't used, because it proved wrong.
- **Forecasts are never shown as current conditions.** Each forecast graphic names its day and hours.
- **No private APIs.** Real open/closed lift status comes only from the resort's own embedded board. The per-lift wind estimate is shelved (`features.liftEstimate` in `mountains.js`).
- Sources and their limits are listed on the page under "Where the data comes from".

## Files

- `index.html`: page structure, plus link-preview tags
- `style.css`: styling (light/dark mode, phone/tablet/desktop, preseason layout)
- `mountains.js`: mountain settings (location, elevations, stations, cams, lifts, season dates, feature switches). Add a new mountain here.
- `app.js`: loads the data, does the calculations, and draws The Call, cams, tabs and charts
- `week.js`: the 7-day forecast (Week ahead strip and Next 7 days tab)
- `preseason.js`: preseason mode (snowfall graphic, tiles, Snowpack tab, view switch)
- `preview.png`, `icon.svg`, `icon-180.png`: link preview and site icons
- `CLAUDE.md`: working notes and rules for Claude sessions

Open another mountain with `?mtn=<key>` once it's added to `mountains.js`.

## Run locally

`python3 -m http.server`, then open http://localhost:8000.

An unofficial fan site, not affiliated with Mt. Bachelor. Official sources: the Mt. Bachelor mountain report and the Central Oregon Avalanche Center forecast.
