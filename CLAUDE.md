# Ra-Dar: notes for Claude

Ra-Dar is a **ski weather tracker** website. The first mountain is **Mt. Bachelor, Oregon**, and more mountains will be added later through `mountains.js`.
It's a static site published with GitHub Pages at **https://zealacy.github.io/Ra-Dar/**. There's no build step, no server and no API keys in the code.

The owner isn't a programmer. Explain things in plain language, keep setup steps they have to do themselves to a minimum, and tell them plainly what went live and what didn't work.

## Handoff: where things stand (updated 2026-11-08)

- **Season:** Mt. Bachelor is closed until **Opening Day, Dec 4, 2026 (scheduled)**, per the official Lift & Trail Status page (re-checked Nov 7, 10pm Pacific). **Preseason mode** is on until then, and switches off by itself on that date.
- **Everything below is built and live.** The last real-data check (Nov 7, 10:24pm Pacific) passed: every source loaded with no page errors on desktop and phone, and live station readings matched the resort's own sensors.
- **No scheduled check-ins or routines are pending.**
- **Decided against: measured snow depth on the site.** The owner decided on Nov 8 that the stake cam is enough. **Don't propose it again unless the owner asks.** What the research found (Nov 8):
  - The OSU snow pillow `OSUSP` does measure snow depth and SWE every 10 minutes. It reports in bursts: 4.45" depth and 1.42" SWE at noon on Nov 7, which matched the resort's sensor.
  - Only MesoWest/Synoptic carries those readings. The NWS feed has its temperature only, and has been silent since Oct 31.
  - There's no allowed way to show the readings:
    - Synoptic's free tier is now for .edu research only, and its paid plans need an extra license to display data publicly.
    - MesoWest's terms require written permission from the sensor's owner (Oregon State) for uses beyond general information, and scraping its pages is off-limits.
    - NOAA's NOHRSC doesn't carry this sensor.
  - The resort's own West Village depth appears only inside its station *image*.
- **Open items and ideas (none in progress):**
  - **Real lift status in the top graphic.** It would need Mt. Bachelor's permission to use their data. The owner may ask them.
  - **More mountains.** Add each one to `mountains.js` and verify every station, camera and elevation for it the same careful way.
  - **Post-season.** Nothing handles the end of the season yet (the site would stay in ski-day mode).

## Data: the most important rules

Good data is the backbone of this site. These rules come from mistakes the owner has corrected.

- **Use only reputable sources that actually represent the ski area.** Mountain weather changes sharply with elevation and location, so a "nearby" station can be badly wrong for the ski area.
  - *Mistake that was corrected:* the score used the Three Creeks Meadow SNOTEL station (5,680 ft, 11.6 mi away, a different drainage) for new snow and snowpack. It read 0" while the mountain had snow, and it made the score wrong.
  - Before using any station, check its **elevation, distance, location and how recent its readings are**. Use stations on or right next to the ski area. Distant or lower stations may appear only as a clearly labeled regional reference, and must never feed the summary or score.
- **Don't use modeled snow depth.** *Mistake that was corrected:* preseason mode first showed Open-Meteo's modeled snow **depth**. It read 0" at every elevation on Nov 7 while the stake cam and the resort's sensor showed snow on the ground. Modeled **snowfall** (snow that fell) is used instead, labeled Model.
- **Cross-check against the resort's own sensors** (the station graphic `cams/mtn/weather-server-image` and the stake cam) whenever adding or changing a data source.
- **Ignore stale data.** A station whose last report is older than `stationMaxAgeHours` (3) is shown as offline and left out of the calculations. Check sensor timestamps: the resort's station graphic has a Northwest lift-top sensor stuck since June 3, and showed a bogus 145" West Village snow depth on Nov 6 (4" on Nov 7).
- **Label every value** as *Measured* (live sensors on the mountain), *Forecast* (NWS or model prediction) or *Model* (an estimate of what already fell). Never present an estimate as a measurement.
- **Never invent data or use mock values.** If a source is down, say so on the page. Every section has an "unavailable" state, and the Week ahead strip warns when a source failed.
- **Never use private or undocumented APIs, and never impersonate a website** to get around access controls (for example, spoofing Origin or Referer headers for `api.mtbachelor.com/.../dor/*`; the safety checks rightly blocked this). Never bypass bot checks (for example, Liftie's Cloudflare challenge). Public webcam image URLs are fine.
- **Approved sources**, all of which allow browser requests (CORS):
  - **NWS observations** (`api.weather.gov/stations/{id}/observations`) for the on-mountain stations: COAC Moon Mountain `MOONM` (7,450 ft), ODOT Century Dr `OD131` (6,424 ft), and the OSU West Village snow pillow `OSUSP` (6,375 ft; NWS carries only its temperature, silent since Oct 31).
  - **NWS gridpoint forecast** `PDT/23,40` (grid cell averages ~7,638 ft), its written 7-day forecast (`/forecast`), and the forecast discussions (AFD, Pendleton).
  - **Open-Meteo:** forecasts and snowfall at each elevation (base 6,300 / mid 7,800 / summit 9,065 ft); the 4-model comparison (GFS, ECMWF, GEM, ICON); and the ensembles (`ensemble-api.open-meteo.com`: GEFS 31 + ECMWF 51 runs) behind the 7-day ranges and confidence. Never show a single far-out snow number without its range and confidence.
  - **NRCS SNOTEL**, as a regional reference only (collapsed in Live readings).
  - **RainViewer** radar; OpenStreetMap tiles.
  - **Mt. Bachelor:** webcams and the station graphic (public image URLs), the official Lift & Trail Status page (embedded), and the Mountain Stats page (the lift list).
- **Lifts:** there is no public live lift-status feed. The resort's feed is the private API, and Liftie sits behind a Cloudflare bot check. The per-lift wind-hold **estimate** is **shelved** (`features.liftEstimate: false` in `mountains.js`): the owner found it confusing and didn't want to send people to the wrong area. **Don't bring it back unless the owner asks.** The Lifts tab shows only the resort's official board, embedded and shifted up by `liftStatusOffsetPx` (1040) so it opens at the lift list. If the resort redesigns that page, re-measure the offset. `season.openingDay` is set by hand from the official page, so re-check it when working on the site. Their board counts 14 lifts (including 2 surface carpets); the stats list in `mountains.js` has the 12 chairlifts.

## Units

The owner asked for "empirical measurements". That's been read as **US imperial units** (°F, inches, mph, feet) **and** real measured data first. Keep both.

## Audience: expert skiers

- The site is a **one-stop source of information** for experienced skiers who aren't at the mountain yet. Give them the data and let them decide.
- **Do calculate** things they can't easily work out themselves: snow amounts, lift-hold and closure risk, scores, ranges and confidence.
- **Don't make decisions for them:** no gear or pack lists, no "best day to go", no verdicts like "mediocre day", and no instructions ("cover exposed skin", "bring chains"). State the facts, such as the road sensor's low temperature, and leave the conclusion to the reader.
- *Correction from the owner:* a "Pack" list was added to the briefing and then removed for this reason. The 1–10 score and its short label were kept; the owner hasn't objected to them.

## Design preferences

- **Every feature gets two parts:** an easy-to-read summary with a visual near the top, and an in-depth version further down (usually its own tab).
- **The infographic is front and center** on the home screen (ski-day view): the score dial, then the big mountain picture (2/3 width) with wind and fresh snow beside it, and sky and right-now below. The text briefing sits under the graphics.
- **Graphics must explain themselves.** Put labels, scales, units, zone names and values directly on the graphic (for example, the elevation scale, "↑ below freezing / ↓ above freezing", wind zones "Light / Breezy / Lift holds", mph marks, cloud % per hour). Don't add paragraphs under a graphic explaining how to read it. A bit more clutter is fine; making people read a lot is not.
- **Never let a forecast pass for current conditions.** After 3pm the ski-day view shows tomorrow, so every forecast graphic says which day and hours it covers ("Tomorrow (Sun), 9am–4pm forecast"), the Week ahead strip always starts with "Today" then "Tomorrow", and preseason mode shows a measured "Right now" readout. *Correction from the owner:* they saw the summit in the 20s (Sunday's forecast after a cold front) while the resort app showed ~50°F now, and thought the data was wrong.
- **Plenty of technical data is wanted, but it lives further down**, in the tabs and in collapsible tables.
- **Keep the page short vertically:** use tabs, carousels and collapsible sections instead of long stacks.
- **The layout must work on every device:** JS sets `<html data-device="mobile|tablet|desktop">`, and CSS and charts adapt to it. Test phone and desktop every time.
- **Smooth animations are wanted**, but always respect `prefers-reduced-motion`.
- **Snow stake camera:** always included, with high visual priority, but **only one large stake image per view.** In preseason the big stake sits in the snowpack section and the cam carousel opens on the next camera; in the ski-day view the carousel opens on the stake. The stake is the first entry in the carousel. *Correction from the owner:* two large stake cams at once was too much.
- **Other cams:** pick them by how useful they are for judging ski conditions, and **label them by their real location**. Check each camera's own on-image stamp. *Mistake that was corrected:* camera 3 was labeled "The Cone (summit)", but it sits at West Village. **No camera is at the summit**; the highest are three cameras at the top of Outback (mid-mountain).
- **Tab labels are plain words:** Snowpack (preseason only) · Live readings · Hour by hour · Next 7 days · Base to summit · Lifts · Radar loop · Forecaster notes.
- **Preseason mode** (`preseason.js`): turns on automatically before `season.openingDay` and off on Opening Day. It leads with:
  - the Opening Day countdown
  - a measured "Right now" readout
  - snowfall by elevation (since Oct 1, plus the next 7 days stacked on top; Model)
  - tiles for last-7-day snowfall, the week's snow range (82 runs) and the chance of ≥6"/≥12"
  - the big stake cam
  - a Snowpack tab (running and daily snowfall charts, table)

  It hides the ski-day cards (The Call, briefing). A header button switches to the ski-day view; the choice is remembered (localStorage) until Opening Day.
- **Forecaster notes can be technical but must be readable by people.** Never show raw teletype text (`000 FXUS66…`, `&&`, `$$`) as the main view. Parse it into sections, highlight ski-relevant sentences, explain jargon on tap, and keep the original at the bottom.
- **Charts** follow the dataviz rules: one y-axis per chart (no dual axes), the validated palette (`--s1`…`--s4`), hairline grids, hover tooltips, and a table for every chart. Status colors always come with an icon and a label. Set axis ranges before drawing, never mid-animation (that once misplaced a line).
- **Link preview:** `preview.png` (1200×630) and `icon.svg`/`icon-180.png` are referenced by the Open Graph tags in `index.html`. The preview has no live numbers on purpose, so it never goes stale. The very first version of the site showed London, and some apps cached that preview; sharing `…/Ra-Dar/?v=2` forces a fresh one.
- Support light and dark mode.

## How the code fits together

- `index.html`: page structure. Scripts load in this order: `mountains.js`, `week.js`, `preseason.js`, `app.js`. `week.js` and `preseason.js` contain only functions, because `app.js` starts the page as soon as it loads.
- `mountains.js`: everything specific to a mountain: location, zones (base/mid/summit), NWS grid, stations, SNOTEL, cams (the stake is separate, as `snowStake`), lifts, season dates, feature flags, links.
- `app.js`:
  - `refreshData()` loads the sources in parallel into the `state` object (`stations`, `snotel`, `nws`, `elev`, `week`, `pre`), then:
    - `computeCall()` → `renderCall()` (score dial, mountain, wind, snow, sky, right-now, briefing)
    - `buildWeek()` → `renderWeekStrip()`
    - `renderPreseason()`
    - `drawActiveTab()`
  - Helpers: `getJSON` (retries once) and `getJSONCached` (localStorage, for Open-Meteo).
  - Data refreshes every 10 minutes, but not while the tab is hidden. Webcams refresh every 5 minutes.
- `week.js`: the 7-day forecast. It combines NWS hourly + written forecasts, the 4 models and the ensembles. Snow is counted per **ski day (4pm to 4pm)**. Confidence comes from ensemble and model spread plus lead time. It also computes `weekEns` (the whole-week total per ensemble run).
- `preseason.js`: `viewMode()` and `applyViewMode()`, `loadPreseason()` (Open-Meteo snowfall since Oct 1 + 8 forecast days), the snowfall graphic and tiles, and the Snowpack tab.
- `style.css`: tokens for light/dark mode, `[data-device]` and `[data-mode="preseason"]` layouts.

## Working in this repo

- **Test in a real browser before pushing.**
  - Use Playwright with `proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }`, and serve the site with `python3 -m http.server 8765`.
  - Wait for `#updated` to contain "Updated", and check that `state.elev`, `state.nws`, `state.week.models`, `state.week.ens` and `state.pre` loaded before judging the numbers. The `#updated` text lists any source that failed.
  - Take screenshots on desktop (1280px) and phone (iPhone 13), and look at them.
  - To test the ski-day view in preseason, click `#view-toggle`. Its choice persists in that browser.
- This sandbox's connection sometimes drops requests (Open-Meteo especially). `getJSON` retries once. Don't mistake these sandbox failures for bugs in the site.
- **Open-Meteo's free tier allows 10,000 requests per day per IP address, and ensemble requests count heavily.** Heavy browser testing from the sandbox can use up the whole day's allowance (HTTP 429 "Daily API request limit exceeded"; resets at 00:00 UTC = 4pm Pacific). **Keep test page loads few.** When it's blocked, test layout with fixtures injected in the test only, never in the site. The site caches Open-Meteo responses in each visitor's browser (`getJSONCached`: 45 min, ensemble 90 min, preseason snowfall 3 h).
- Cloud sessions should use the **Ra-Dar** environment, in **Auto** mode. It allows these hosts:
  - `api.weather.gov`, `api.open-meteo.com`, `ensemble-api.open-meteo.com`, `wcc.sc.egov.usda.gov`
  - `api.mtbachelor.com`, `www.mtbachelor.com`
  - `api.rainviewer.com`, `tilecache.rainviewer.com`, `tile.openstreetmap.org`, `cdnjs.cloudflare.com`
  - plus a few used only for research
- Libraries (from cdnjs): Leaflet 1.9.4, Chart.js 4.4.1.

## Publishing (standing permission from the owner)

The owner wants finished changes to go live without extra approval steps, and has given permission for this rule.

- GitHub Pages builds from the branch set in the repo's Settings → Pages, currently **`claude/weather-tracker-github-v48153`**. Pushing to that branch publishes the site.
- **A new session usually works on a different branch.** Base it on the latest `claude/weather-tracker-github-v48153`, then publish through a pull request into that branch (step 3 below).
- **When a requested change is finished**, publish it without waiting to be asked:
  1. Run the checks first: `node --check` on every JS file, then the Playwright browser test on desktop and phone, with no page errors and the screenshots looked at.
  2. Commit with a clear message.
  3. If the session's branch *is* the Pages branch, push it. If it's a different branch, push that branch, open a pull request into the Pages branch, and merge it once the checks above have passed.
  4. Tell the owner what went live and give the site link: https://zealacy.github.io/Ra-Dar/
- **Limits on this permission:**
  - Never publish a change that failed its checks. Fix it, or tell the owner what's broken.
  - Never force-push, rewrite history, or delete branches.
  - Only merge pull requests this session opened for the owner's own requested changes. Never merge anyone else's.
  - The permission covers this repository's website only.
