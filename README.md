# Ra-Dar: ski weather 🎿

A ski weather tracker for twelve mountains: **https://ra-dar-alpha.vercel.app/**

It's a static site hosted on Vercel, with no server, no build step and no API keys. Everything loads live in the visitor's browser from public sources. It's written for experienced skiers: it gives the data and calculations, and leaves the decisions to them.

## Twelve mountains, one layout

A switcher at the top of the page picks the mountain (sorted alphabetically). The address carries the choice (`?mtn=bachelor`, `?mtn=skibowl`, …), so links can be shared, and the browser remembers the last one. Every section sits in the same place for every mountain; where a mountain lacks something, the page says so. Each mountain uses its own data sources, because weather changes sharply from one pass to the next:

| Mountain | Base / mid / summit (ft) | Measured weather | Measured snow | Opening Day |
|---|---|---|---|---|
| Alpental (WA) | 3,140 / 4,280 / 5,420 | 3 stations on the mountain | Regional reference only | Not announced |
| Alpine Meadows (CA) | 6,835 / 7,736 / 8,637 | 4 stations on the mountain | Regional reference only | Nov 25, 2026 |
| Appalachian Ski Mtn. (NC) | 3,635 / 3,818 / 4,000 | None public: labeled model estimates | None | Nov 20, 2026 |
| Mission Ridge (WA) | 4,570 / 5,695 / 6,820 | 3 stations on the mountain | Upper Wheeler snow sensor (base level) | Nov 27, 2026 (planned) |
| Mt. Bachelor (OR) | 6,300 / 7,800 / 9,065 | Road and snow-pillow sensors, Moon Mountain (labeled not at the ski area) | Snow stake cam | Dec 4, 2026 |
| Mt. Hood Skibowl (OR) | 3,650 / 4,340 / 5,027 | 2 stations on the mountain, road sensor | Regional reference only | Not announced |
| Mt. Spokane (WA) | 4,200 / 5,045 / 5,889 | None public: labeled model estimates | Snow stake cam | Dec 5, 2026 (projected) |
| Palisades Tahoe (CA) | 6,200 / 7,625 / 9,050 | 3 stations on the mountain | On-site snow sensor | Nov 25, 2026 |
| Stevens Pass (WA) | 4,061 / 4,950 / 5,845 | 3 stations on the mountain | On-site snow sensor and stake cam | Not announced |
| Summit at Snoqualmie (WA) | 3,000 / 3,430 / 3,865 | 2 stations on the mountain, road sensor | Regional reference only | Not announced |
| Sun Peaks (BC) | 4,117 / 6,086 / 6,824 | None public: labeled model estimates | Daily reports (Environment Canada) | Nov 21, 2026 |
| Willamette Pass (OR) | 5,120 / 5,900 / 6,683 | Road sensor at the pass | Cascade Summit snow sensor (base) | Dec 11, 2026 |

Opening Days are the resorts' own scheduled dates, as checked in November 2026. Forecasts come from each mountain's National Weather Service office (Sun Peaks: Canada's GEM model), and its own resort and road cams.

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
| Forecaster notes | The NWS forecast discussion, made readable: key messages, ski-relevant highlights, jargon explained, the original at the bottom | The mountain's NWS office |

All values are in US units (°F, inches, mph, feet). Data refreshes every 10 minutes and webcams every 5.

## Data quality rules

- **Only data that represents the ski area.** Each mountain uses stations on or right next to it. A station that isn't on the ski area (Bachelor's Moon Mountain) is labeled "not at the ski area" everywhere it appears. Where no public station exists (Appalachian, Mt. Spokane, Sun Peaks), "Right now" shows model estimates labeled "Model, not measured". Distant SNOTEL stations are a labeled regional reference only.
- **Stale data is dropped.** Weather stations silent for 3+ hours, and snow sensors silent for 6+ hours, show as offline and are ignored.
- **Every value is tagged** *Measured*, *Forecast* or *Model*. Modeled snow *depth* isn't used, because it proved wrong. Modeled snowfall sits beside the measured view of the ground: a stake cam or an on-site snow sensor where the mountain has one.
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
- `tools/`: test, audit, research and deploy scripts for Claude sessions (not part of the website; see `tools/README.md`)

## Run locally

`python3 -m http.server`, then open http://localhost:8000.

An unofficial fan site, not affiliated with any ski resort. Official sources: each resort's own conditions page, and the regional avalanche center's forecast.
