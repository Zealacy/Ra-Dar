# Ra-Dar: notes for Claude

Ra-Dar is a **ski weather tracker** website. The first mountain is **Mt. Bachelor, Oregon**, and more mountains will be added later through `mountains.js`.
It's a static site published with GitHub Pages: `index.html`, `style.css`, `app.js` and `mountains.js`, with no build step, no server and no API keys in the code.

The owner isn't a programmer. Explain things in plain language, and keep setup steps they have to do themselves to a minimum.

## Data: the most important rules

Good data is the backbone of this site. These rules come from mistakes the owner has corrected.

- **Use only reputable sources that actually represent the ski area.** Mountain weather changes sharply with elevation and location, so a "nearby" station can be badly wrong for the ski area.
  - *Mistake that was corrected:* the score used the Three Creeks Meadow SNOTEL station (5,680 ft, 11.6 mi away, a different drainage) for new snow and snowpack. It read 0" while the mountain had snow, and it made the score wrong.
  - Before using any station, check its **elevation, distance, location and how recent its readings are**. Use stations on or right next to the ski area. Distant or lower stations may appear only as a clearly labeled regional reference, and must never feed the summary or score.
- **Ignore stale data.** A station whose last report is older than `stationMaxAgeHours` is shown as offline and left out of the calculations. Check sensor timestamps: the resort's station graphic has had sensors stuck since June, and a 145" snow depth reading that was clearly wrong.
- **Label every value** as *Measured* (live sensors on the mountain), *Forecast* (NWS or model prediction) or *Model* (an estimate of what already fell). Never present an estimate as a measurement.
- **Never invent data or use mock values.** If a source is down, say so on the page.
- **Never use private or undocumented APIs, and never impersonate a website** to get around access controls (for example, spoofing Origin or Referer headers for `api.mtbachelor.com/.../dor/*`). Public webcam image URLs are fine.
- Currently approved sources, all of which allow browser requests (CORS):
  - NWS observations (`api.weather.gov/stations/{id}/observations`) for the on-mountain stations: COAC Moon Mountain `MOONM`, ODOT `OD131`, and the OSU snow pillow `OSUSP`.
  - The NWS gridpoint forecast (`PDT/23,40`) and NWS forecast discussions.
  - Open-Meteo, for forecasts and new-snow estimates at each elevation, the 4-model comparison (GFS, ECMWF, GEM, ICON), and the ensembles (`ensemble-api.open-meteo.com`: GEFS 31 + ECMWF 51 runs) behind the 7-day ranges and confidence. Never show a single far-out snow number without its range and confidence, and only crown a "best day" if it beats every other day outright.
  - NRCS SNOTEL, as a regional reference only.
  - RainViewer radar.
  - Mt. Bachelor webcams and the station graphic.
- **Lifts:** there is no public live lift-status feed. The resort's feed is the private API, and Liftie (liftie.info) sits behind a Cloudflare bot check, which must not be bypassed. The site shows a wind-hold **estimate** per lift, labeled as such, and always links to the official live status page. The lift list and stats come from the official Mountain Stats page (`/the-mountain/resort-policies-safety/mountain-stats/`). `season.openingDay` in `mountains.js` is set by hand from the official Lift & Trail Status page, so re-check it when working on the site. Never present estimated lift status as real open/closed status. The official board is embedded in the Lifts tab, shifted up by `liftStatusOffsetPx` so it opens at the lift list. If the resort redesigns that page, re-measure the offset. Their board counts 14 lifts (including 2 surface carpets); the wind estimate covers the 12 chairlifts.
- **Known gap:** no public snow-depth sensor currently reports from the mountain. A possible fix is MesoWest/Synoptic, which needs an API key that must not go in the public code. Ask the owner before setting that up.

## Units

The owner asked for "empirical measurements". That's been read as **US imperial units** (°F, inches, mph, feet) **and** real measured data first. Keep both.

## Design preferences

- **The summary at the top ("The Call") must be visual**, with graphics like the score dial, mountain profile, stake meter, wind compass and sky ribbon, so it doesn't push numbers at people. Exact numbers go in tooltips and the detail tabs.
- **Plenty of technical data is wanted, but it lives further down**, in the tabs and in collapsible tables.
- **Keep the page short vertically:** use tabs, carousels and collapsible sections instead of long stacks.
- **The layout must work on every device:** JS sets `<html data-device="mobile|tablet|desktop">`, and CSS and charts adapt to it. Test phone and desktop every time.
- **Smooth animations are wanted**, but always respect `prefers-reduced-motion`.
- **Always include a snow stake camera.** Pick other cams by how useful they are for judging ski conditions.
- **Tab labels are plain words:** Live readings · Hour by hour · Next 7 days · Base to summit · Lifts · Radar loop · Forecaster notes.
- **Every feature gets two parts:** an easy-to-read summary with a visual near the top, and an in-depth version further down (usually its own tab).
- **Forecaster notes can be technical but must be readable by people.** Never show raw teletype text (`000 FXUS66…`, `&&`, `$$`) as the main view. Parse it into sections, explain jargon, and keep the original at the bottom.
- **Charts** follow the dataviz rules: one y-axis per chart (no dual axes), the validated palette (`--s1`, `--s2`, `--s3`), hairline grids, hover tooltips, and a table for every chart. Status colors always come with an icon and a label.
- Support light and dark mode.

## Working in this repo

- **Test in a real browser before pushing.** Use Playwright with `proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' }` and serve the site with `python3 -m http.server`. Take screenshots on desktop and phone, and look at them.
- This sandbox's connection sometimes drops requests (Open-Meteo especially). `getJSON` retries once. Don't mistake these sandbox failures for bugs in the site.
- Cloud sessions should use the **Ra-Dar** environment, which allows the hosts listed above, in **Auto** mode.
## Publishing (standing permission from the owner)

The owner wants finished changes to go live without extra approval steps, and has given permission for this rule.

- GitHub Pages builds from the branch set in the repo's Settings → Pages, currently `claude/weather-tracker-github-v48153`. Pushing to that branch publishes the site.
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
