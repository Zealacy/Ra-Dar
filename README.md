# Ra-Dar: ski weather 🎿

A ski weather tracker for **Mt. Bachelor** and **Willamette Pass**, Oregon: **https://ra-dar-alpha.vercel.app/**

It's a static site hosted on Vercel, with no server, no build step and no API keys. Everything loads live in the visitor's browser from public sources. It's written for experienced skiers: it gives the data and calculations, and leaves the decisions to them.

## Two mountains, one layout

A switcher at the top of the page picks the mountain. The address carries the choice (`?mtn=bachelor`, `?mtn=willamette`), so links can be shared, and the browser remembers the last one. Every section sits in the same place for both mountains. Each mountain uses its own data sources, because weather changes sharply from one pass to the next:

| | Mt. Bachelor | Willamette Pass |
|---|---|---|
| Elevations | 6,300 / 7,800 / 9,065 ft | 5,120 / ~5,900 (midpoint) / 6,683 ft |
| Live weather | ODOT Century Dr (base), COAC Moon Mountain (7,450 ft, 5 mi N, labeled not at the ski area) | ODOT road station on Highway 58 at the pass (base). No public station on the upper mountain. |
| Measured snow | Snow stake cam | Cascade Summit SNOTEL snow depth (5,100 ft, 1.4 mi W, base elevation) |
| Forecast office | NWS Pendleton | NWS Medford (no visibility forecast published) |
| Webcams | 9 resort cams, led by the snow stake | Resort Base Area live stream (YouTube) and 2 ODOT road cams at the pass |
| Lift board | Resort's board, embedded | Resort's board, linked (the resort blocks embedding) |
| Opening Day | Dec 4, 2026 (scheduled) | Not announced yet |

## Two views

**Preseason** (automatic until each mountain's Opening Day; stays on while a closed resort hasn't announced a date):

- Opening Day countdown (or "TBA") and a measured **Right now** readout
- **Snowfall by elevation** since Oct 1, plus the next 7 days (model)
- Last-7-day snowfall, the week's snow range from 82 ensemble runs, and the chance of ≥6"/≥12"
- A large live cam: the snow stake where there is one, otherwise the resort's base cam
- A **Snowpack** tab with season and daily snowfall charts, plus measured season snow depth where the mountain has a snow sensor

**Ski-day view** (after Opening Day, or via the header button):

- **Ski-day forecast:** the day and hours it covers, factual status chips (new snow, rain, wind, sky, temps), and a big **mountain infographic** scaled to the mountain's own elevations:
  - temperature at the base, mid-mountain and summit
  - freezing or snow level ("↑ below freezing / ↓ above freezing")
  - summit wind
  - snow or rain in the sky
  - which day and hours it covers
- Cards around it:
  - **Wind** dial with labeled zones (Light / Breezy / Lift holds)
  - **Fresh snow**: model estimates by elevation, beside the stake cam or the measured snow depth
  - **Sky** cloud cover by hour
  - **Right now** station readings
- **Briefing:** short factual lines (snow and rain timing, temps by elevation, wind and lift-hold risk, measured snow depth, freeze-thaw, visibility, road sensor). No advice.

**Both views:**

- **Week ahead:** 7 day cards (Today, Tomorrow, …), each with likely snow range, highs, gusts and confidence in words. The summary line is factual.
- **Webcams:** a carousel with cameras labeled by their real location. Live-stream cams show the stream's still and play YouTube's own player when tapped.

## Detail tabs

| Tab | What it shows | Source |
|---|---|---|
| Snowpack (preseason) | Running and daily snowfall by elevation, with the forecast continued, a table, and measured snow depth where available | Open-Meteo (model); NRCS SNOTEL |
| Live readings | 48-hour temperature and wind from the mountain's stations, measured snow depth or the resort's lift-top station graphic, a station table, and SNOTEL (on-site station plus a labeled regional reference) | NWS station network; NRCS; the resort |
| Hour by hour | 96 hours of NWS forecast: temperature, wind chill, wind, gusts, sky, precipitation, snowfall, snow level, visibility | National Weather Service |
| Next 7 days | Day picker with the NWS written forecast, chance of ≥1/3/6/12", per-model snow, temps by elevation and hourly charts; week charts and a chance-of-snow grid; accuracy guide | NWS; Open-Meteo (GFS, ECMWF, GEM, ICON; GEFS + ECMWF ensembles) |
| Base to summit | 7-day temperatures, snow, rain, gusts and freezing level at three elevations | Open-Meteo |
| Lifts | The resort's own live lift board: embedded where the resort allows it, otherwise a link | The resort |
| Radar loop | The last 2 hours of radar | RainViewer |
| Forecaster notes | The NWS forecast discussion, made readable: key messages, ski-relevant highlights, jargon explained, the original at the bottom | NWS Pendleton or Medford |

All values are in US units (°F, inches, mph, feet). Data refreshes every 10 minutes and webcams every 5.

## Data quality rules

- **Only data that represents the ski area.** Each mountain uses stations on or right next to it. A station that isn't on the ski area (Bachelor's Moon Mountain) is labeled "not at the ski area" everywhere it appears. Distant SNOTEL stations are a labeled regional reference only.
- **Stale data is dropped.** Weather stations silent for 3+ hours, and snow sensors silent for 6+ hours, show as offline and are ignored.
- **Every value is tagged** *Measured*, *Forecast* or *Model*. Modeled snow *depth* isn't used, because it proved wrong. Modeled snowfall sits beside the measured view of the ground: the stake cam at Bachelor, the Cascade Summit snow sensor at Willamette Pass.
- **Forecasts are never shown as current conditions.** Each forecast graphic names its day and hours.
- **No private APIs.** Real open/closed lift status comes only from each resort's own board. The per-lift wind estimate is shelved (`features.liftEstimate` in `mountains.js`).
- Sources and their limits are listed on the page under "Where the data comes from".

## Files

- `index.html`: page structure, plus link-preview tags
- `style.css`: styling (light/dark mode, phone/tablet/desktop, preseason layout, mountain switcher)
- `mountains.js`: everything that differs between mountains (location, elevations, forecast grid, stations, snow sensor, cams, lift board, season dates, wording). Add a new mountain here.
- `app.js`: loads the data, does the calculations, and draws the ski-day forecast, cams, tabs and charts
- `week.js`: the 7-day forecast (Week ahead strip and Next 7 days tab)
- `preseason.js`: preseason mode (snowfall graphic, tiles, Snowpack tab, view switch)
- `preview.png`, `icon.svg`, `icon-180.png`: link preview and site icons
- `CLAUDE.md`: working notes and rules for Claude sessions

## Run locally

`python3 -m http.server`, then open http://localhost:8000.

An unofficial fan site, not affiliated with any ski resort. Official sources: each resort's own conditions page, and for Mt. Bachelor the Central Oregon Avalanche Center forecast.
