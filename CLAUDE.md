# Ra-Dar: notes for Claude

Ra-Dar is a **ski weather tracker** website for **Mt. Bachelor** and **Willamette Pass** (Oregon), **Stevens Pass** (Washington; built, not published yet) and **Sun Peaks** (British Columbia), with a switcher at the top of the page. More mountains can be added through `mountains.js`.
It's a static site published on **Vercel** at **https://ra-dar-alpha.vercel.app/**. There's no build step, no server and no API keys in the code.

The owner isn't a programmer. Explain things in plain language, keep setup steps they have to do themselves to a minimum, and tell them plainly what went live and what didn't work.

## Where things live (since Nov 9, 2026)

- **Live website: Vercel**, at **https://ra-dar-alpha.vercel.app/**. See Publishing below.
- **Code and history: GitLab**, in the private project **https://gitlab.com/zealacy-group/ra-dar-storage**, branch `main`. This is the only code repository in use. Its git remote is `origin`.
  - Getting the code in a new session: `git clone https://gitlab.com/zealacy-group/ra-dar-storage.git`. A cloud session may first try to check out an old repository elsewhere and fail; that's expected, so ignore it.
  - Access: the owner's GitLab token is a network secret on the Ra-Dar environment for `gitlab.com` (basic auth). It's a legacy personal access token with only `read_repository` and `write_repository`, so it can't call the GitLab API, and it expires within a year; the owner renews it through the secure credential form.
  - Saving work: commit, then `git push origin HEAD:main`. **Check `git remote -v` first:** after a container restart the harness may point `origin` back at the old GitHub address. GitLab is then the `gitlab` remote, so push with `git push gitlab HEAD:main`.
  - The tag `archive/2026-11-08-old-host-final` marks the last version published on the previous host. It's history only.
- **GitHub is not used. Don't push there, open pull requests there, or point the owner to it.** The project started on GitHub, but GitHub locked the owner's account on Nov 8, 2026, and the old `github.io` address is dead. The owner has an appeal open; if access comes back, ask the owner before using it for anything. Don't suggest a second GitHub account, since GitHub allows one free account per person.
  - On Nov 9 the session's automatic checkout of the GitHub repository *succeeded* (an old Nov 8 copy), so access may be back. The owner was told and kept the rule: GitLab only.
- **Cloudflare Pages was tried and doesn't work from cloud sessions. Don't retry it.** The proxy injects the saved token into every request to `api.cloudflare.com`, overwriting the short-lived upload JWT, so asset uploads fail (code 8000013). An empty `ra-dar` Pages project and a Pages-only token remain on the owner's Cloudflare account.

## Handoff: where things stand (updated 2026-11-10, 9pm Pacific)

- **Vercel serves commit `2b192c6`** (the security hardening, published Nov 10 after the owner said "publish it"): Mt. Bachelor, Willamette Pass and Sun Peaks.
- **Stevens Pass is built on GitLab `main` but NOT published.** The owner asked (Nov 10) for a complete draft held "just shy of publishing". **Don't deploy it until the owner says so.**
  - It passed `node --check` and the browser test on all four mountains (desktop and phone, both views), with no page errors and nothing blocked by the Content Security Policy.
  - The commit also changes shared code, so publishing it changes the live mountains too: the phone header (the mountain row scrolls and fades at the edge), the forecaster-notes parser (two fixes), and the cam player button.
  - **Before publishing, in daylight:** look at the resort's "Skyline" and "Jupiter" cams. They were dark and rain-smeared at 8:30pm, so they carry the resort's names only. Describe what each picture shows and where it looks (see "Mountains").
  - **Told to the owner, waiting for a decision (affects every mountain):** the page's two snow forecasts disagree when temperatures are near freezing. On Nov 10 at Stevens, mid-mountain, the chart's "+10.3 in coming" (our split by temperature) sat next to the tile's "0–4 in" (82 ensemble runs).
    - The ensemble and 4-model snowfall is Open-Meteo's own rain/snow split, which isn't adjusted for elevation: its members showed 0 in of snow in wet hours at 32.6–34.5°F. Over 8 days it gave a median of 1.5 in; the same members split by temperature gave 6.5 in.
    - The temperature split can be too snowy when cold air pools at a pass under warm air (Stevens that day: 33–36°F measured at 5,180 ft while the NWS put the snow level near 6,000 ft, and the stake board looked almost clean).
    - Options put to the owner: use the NWS snow level to decide rain vs. snow where NWS covers the hours; apply the temperature split to the ensemble runs too; or leave both and label the difference.
- **Live on Vercel: commit `26b92bd`** (published Nov 9 at about 10pm Pacific, with the owner's go-ahead in the conversation). It made three changes:
  - Forecaster notes: the update headline is no longer shown as fake forecaster credits.
  - The sources table hides the shelved wind-hold estimate and lift list rows.
  - Ski-day chips state facts, per the owner's decision (see "Audience").
  - Before the deploy: `node --check`, and the browser test on both mountains, desktop and phone, both views. After it: all nine live files matched the deploy, both production addresses pointed at the new deployment, and the same browser test against the live site passed with every source loaded and no page errors. The owner's newly installed security plugins flagged nothing.
- **Sun Peaks is live** (published Nov 9, about 10:45pm Pacific, after the owner said "publish it"). It passed `node --check`, the browser test on all three mountains (desktop and phone, both views), forced-failure tests (GEM blocked, elevation data blocked), and the same test against the live site.
  - Before publishing, the `security-guidance` plugin flagged `innerHTML` twice: the daily-reports table and the preseason "Right now" line. Every value placed in that HTML was reviewed: all are escaped with `esc()` or are formatted numbers. The owner was told, then approved.
  - The owner asked to be told before publishing whenever the security plugins flag something. Keep doing that.
- **Rain/snow split by elevation: fixed and live** (Nov 9, about 11pm Pacific, owner said yes). Open-Meteo's own rain/snow split isn't adjusted for elevation: at Sun Peaks on Nov 10 it gave the same "rain" at 41°F and 31°F, and at Pine Marten it called 27–29°F precipitation rain. So `splitPrecip()` in `app.js` splits each elevation's precipitation by that elevation's model temperature: all snow at 32°F and colder, all rain at 36°F and warmer, mixed in between, with Open-Meteo's 7:1 snow-to-water ratio.
  - It's used for preseason snowfall since Oct 1, the Snowpack tab, Fresh snow by elevation, the Base to summit tab's daily snow and rain, and `week.js`'s fallback past NWS coverage.
  - The week's snow ranges and the 4-model comparison (one elevation, the models' own split) are unchanged.
  - Effect on Nov 9: Bachelor's last 7 days at 7,800 ft went from 0.1" to 2.4". Season snowfall now rises with elevation at every mountain (Sun Peaks 5.3 / 6.8 / 7.0", was 4" everywhere). It matches Willamette's measured 0" base and bare base cam.
- **Mountains:** Mt. Bachelor, Willamette Pass and Sun Peaks are all live; Stevens Pass is built but not published (see above). A switcher at the top of the page picks the mountain; see "Mountains" below.
- **Seasons:**
  - **Stevens Pass** has **no Opening Day announced**: the resort's Hours of Operation page lists "Winter 2026/27: Skiing & Riding TBD" (checked Nov 10). `season: { openingDay: null, closed: true }` keeps preseason on. **Set the date when they post one.**
  - **Mt. Bachelor** is closed until **Opening Day, Dec 4, 2026 (scheduled)**, per the official Lift & Trail Status page (re-checked Nov 9, 9pm Pacific). **Preseason mode** is on until then, and switches off by itself on that date.
  - **Sun Peaks** opens **Nov 21, 2026 (scheduled)**, season to Apr 4, 2027, per the resort's Winter Hours of Operation page (checked Nov 9, 10:20pm Pacific). Preseason mode until then.
  - **Willamette Pass** is closed with **no Opening Day announced** ("Opening Soon for 2026/2027!", checked Nov 9). `season: { openingDay: null, closed: true }` keeps preseason on and shows "TBA". **Set the date when they post one.**
    - Since Nov 9, 9pm, `www.willamettepass.ski` answers cloud sessions with a Cloudflare bot check (HTTP 403, "Attention Required"). Don't get around it. Ask the owner to check the resort's Hours of Operation page instead. The site's links to the resort are unaffected for visitors.
- **Everything below is built and live.** The last real-data check (Nov 9, 10:01pm Pacific, on the live site) passed for both mountains with every source loaded. The check before it (Nov 9, 9:20pm Pacific) also passed for both mountains: every source loaded with no page errors on desktop and phone. Open-Meteo dropped some requests from the sandbox (once a real 503), and the page showed its "unavailable" notes as designed.
- **No scheduled check-ins or routines are pending.**
- **Decided against: measured snow depth for Mt. Bachelor.** The owner decided on Nov 8 that the stake cam is enough. **Don't propose it again unless the owner asks.** (Willamette Pass is different: a public SNOTEL sensor sits at its base, so it shows measured depth; see Mountains.) What the Bachelor research found (Nov 8):
  - The OSU snow pillow `OSUSP` does measure snow depth and SWE every 10 minutes. It reports in bursts: 4.45" depth and 1.42" SWE at noon on Nov 7, which matched the resort's sensor.
  - Only MesoWest/Synoptic carries those readings. The NWS feed has its temperature only, and has been silent since Oct 31.
  - There's no allowed way to show the readings:
    - Synoptic's free tier is now for .edu research only, and its paid plans need an extra license to display data publicly.
    - MesoWest's terms require written permission from the sensor's owner (Oregon State) for uses beyond general information, and scraping its pages is off-limits.
    - NOAA's NOHRSC doesn't carry this sensor.
  - The resort's own West Village depth appears only inside its station *image*.
- **Open items and ideas (none in progress):**
  - **More mountains.** Add each one to `mountains.js` and verify every station, camera and elevation for it the same careful way (see "Adding a mountain" below).
  - *Owner decisions (Nov 9, Pacific) on Sun Peaks:* build it (done and live). The owner **won't be getting the resort's permission** to use its live readings any time soon, so don't plan on them.
  - *Owner decision (Nov 9, 10pm Pacific):* **Sun Peaks' "Right now" may show model estimates** (Open-Meteo, at base, mid and summit), clearly labeled **"Model, not measured"**, because no live public station exists and the alternative is no data at all. The owner judged them reliable and precise enough (on Nov 9 they were within about 2°F of the resort's own readings). This exception covers only a mountain with no usable measured station (`nowModel: true` in `mountains.js`). If a measured source becomes usable, it replaces the estimates. Every other mountain's "Right now" stays measured-only.
  - **Willamette Pass's "Eagle Peak" cam** (YouTube `uav7cBNVv0k`) is left out: its still was black and unchanged at night on Nov 8 and in daylight on Nov 9. Re-check it in daylight; if it shows a real view, label it by what its picture shows and add it to `cams`.
  - **Post-season.** Nothing handles the end of the season yet (the site would stay in ski-day mode).

## Mountains

The page layout is identical for every mountain. **Everything that differs lives in `mountains.js`**, and no code names a mountain. Where a mountain lacks something, the same slot shows its nearest equivalent or says plainly that there is none.

- **Choosing the mountain:** `?mtn=<key>` in the address wins, then the last one this browser showed (localStorage `radar-mtn`), then the first in `MOUNTAINS`. The switcher in the header is plain links (`?mtn=key`), so every view can be shared. The preseason/ski-day choice is remembered per mountain (`radar-view:<key>`).
  - On a phone the switcher row scrolls sideways once the mountains don't fit (four don't): the current one is brought into view and the row fades at the edge where more are hidden (`data-more` on `#mtn-switch`).
- **Settings a mountain can have** (see the comments in `mountains.js`):
  - `zones` with a `short` name for labels, and `nws` with `officeName`.
  - `stations` (NWS observation ids). Use `offSite` for a station that isn't on the ski area, `road` for a road sensor (the briefing's road line), and `sheltered` for a sensor whose wind isn't representative (no lift-hold line on its wind chart).
  - `snowSensor`: an on-site SNOTEL used as **measured snow depth**, in Right now, the Fresh snow card, the briefing, Live readings and the Snowpack tab. It goes offline after `maxAgeHours`.
  - `snotel`: the regional reference only.
  - `snowStake` and `stationGraphic`: optional. Without a stake, the first cam is the preseason hero cam.
  - `cams`: still images (`src`, add `small: true` for small stamped road cams) or YouTube live streams (`youtube: id`). A stream shows YouTube's live still (`i.ytimg.com/vi/<id>/maxresdefault_live.jpg`, refreshed about every 5 minutes) and loads YouTube's own embed player only when tapped.
  - `season: { openingDay, closed, checked }`, where `openingDay: null` with `closed: true` means "not announced yet".
  - `liftStatusUrl` and `liftStatusEmbed`: embed only where the resort doesn't block framing.
  - `windHoldLifts` (named in the briefing's wind line), `afdWords` (place names to highlight in the forecaster notes), `links`, and `text` (per-mountain wording: Live readings lead, sources notes, snow-depth note, cam credits, footer, and optional `elevSource`, `radarSource`, `radarNote`, `dataCredits`).
  - **Outside the US (no NWS):** leave out `nws` and give `forecast: { model, short, name }`, a national model read through Open-Meteo (Sun Peaks: `gem_seamless`). Then:
    - `app.js` builds the same hourly rows from it (`loadModelHourly`), with wind chill computed by the NWS formula. It has no snow level or visibility, so those show as unavailable, and the Hour by hour tab shows the freezing level in the snow-level slot, saying so.
    - Rain vs. snow comes from each elevation's model temperature during wet hours (`rainTopZone`, rain at `RAIN_F` = 35°F or warmer). If the elevation data fails, the page says "rain/snow unknown" instead of guessing.
    - Every label names the source through `FC` (NWS, or the model's short name). A model is never called "official".
    - There's no written forecast or forecaster notes; `discussion: { none, link }` says so and links the nearest equivalent.
  - `nowModel: true`: "Right now" shows labeled model estimates when no station is live (owner's decision; Sun Peaks only).
  - `snowDaily`: Environment Canada's daily climate stations (measured snow on the ground and new snow, cm → in), read with one bounding-box request (`climate-daily`) plus their last report dates (`climate-stations`). They're shown with their dates in the Fresh snow card, a preseason tile, the briefing, a Live readings table and the Snowpack tab, never as "right now". A report counts as recent for `maxAgeDays` (3).
  - Cams can be `heavy: true` (4K stills): their thumbnails refresh every 30 minutes instead of every 5, to save data.
- **Mt. Bachelor:** see "Approved sources" below.
- **Stevens Pass, WA** (sources verified Nov 10, 7–9pm Pacific; built, not published):
  - **Basics** (resort's Mountain Info & Stats page): base 4,061 ft, highest elevation 5,845 ft, 1,125 acres, 460 in average snowfall. Mid-mountain is the halfway elevation, 4,950 ft (the resort names none). Model point 47.7405, -121.095, where Open-Meteo uses one grid cell for all three elevations. At the base lodge's own coordinates it picked a different cell for each elevation.
  - **Measured:**
    - Northwest Avalanche Center (NWAC) stations on the ski area, through the NWS feed, hourly: Tye Mill `STS54` (5,180 ft; temperature, wind and gusts), Brooks `STB48` (4,800 ft; temperature, humidity), Schmidt Haus `STS40` (3,950 ft; temperature, humidity).
    - **Their reports arrive 1 to 1.7 hours late**, so "2 hr ago" is normal. With `stationMaxAgeHours` 3, one missed report shows a station offline for up to an hour.
    - Cross-checks: Schmidt Haus 39.3°F vs. the SNOTEL sensor beside it 38.8°F; each station within 1°F of the model at its elevation; WSDOT's pass report 41°F at road level.
    - **Left out:** Skyline `STS52` (5,250 ft) read 3–4°F warmer than Tye Mill at the same height, and warmer than stations 460 ft lower, in steady rain, and jumped about 3°F hour to hour. Re-check before adding. Grace Lakes `STS48` (4,790 ft, temperature) and Old Faithful `STS46` (4,590 ft, wind only) sit just west of the lifts at heights already covered. `SVNW1` has no observations.
    - Snow depth: Stevens Pass SNOTEL `791:WA:SNTL` (3,940 ft, 0.2 mi from the base lodge, hourly; depth about every other hour). It read 0 in while the base cams showed bare ground and WSDOT reported "bare and wet". It's `snowSensor`, so it feeds the summary.
    - Regional reference only: Icicle Creek `1338` (4,550 ft, 14.2 mi), Fish Lake `478` (3,440 ft, 14.5 mi), Skookum Creek `912` (3,320 ft, 24.6 mi).
    - WSDOT's road weather and pass report need an access code (its Traveler API) or its page's internal API. Don't use either.
  - **Forecast:** NWS **Seattle** `SEW/165,67` (averages 4,879 ft; holds the base and lower front side). The cell south, `165,66` (5,167 ft), holds the upper mountain; on Nov 10 they differed by 2 mph in gusts and under 3°F. Zone WAZ302. It publishes snow level and visibility. AFDs come from SEW.
  - **Cams:**
    - Five resort cams run on Brownrice's player (`player.brownrice.com/embed/<name>`): `stevenspasssnowstake`, `…skyline`, `…jupiter`, `…school`, `…courtyard`. Each has a public snapshot (`/snapshot/<name>`, the player page's own preview image; 1280×720, no time stamp, refreshed within a minute, no referrer check).
    - The site shows the snapshot and links to the player page in a new tab (`video` in `mountains.js`). An inline player wasn't tried: it would need `frame-src` for Brownrice in the CSP and a check that their player isn't locked to the resort's domain.
    - **Snow stake cam:** a white board with a stake numbered 1–24 in. The resort doesn't say where on the mountain it stands or when the board is cleared, and the page says so. On Nov 10 it showed patchy snow around it while the base was bare, so it's probably above the base.
    - WSDOT road cams at the pass (335 px wide, own name and time stamp): `images.wsdot.wa.gov/nc/002vc06458.jpg` ("E Stevens Summit") and `002vc06430.jpg` ("W Stevens Summit"). `002vc06190.jpg` ("W Stevens Pass", lower on the west side) isn't used.
    - **WSDOT permission:** WSDOT offers its camera images to third parties through its Traveler Information API, which hands out these same image addresses, but no written "you may display them" statement like ODOT's was found. They're credited "© WSDOT". The owner was told.
  - **Resort (stevenspass.com, Vail Resorts):** its pages send `X-Frame-Options: SAMEORIGIN`, so the Lifts tab links to its Lift & Terrain Status page. Its weather page is a forecast, not sensors.
  - **Avalanche:** NWAC, `nwac.us/forecasts/avalanche/stevens-pass` (linked). NWAC's own site is a JavaScript app; its data API wasn't used.
  - **First mountain with both a stake cam and a snow sensor:** the Fresh snow card shows the measured box with a "New snow: stake cam" link, in place of the stake thumbnail.
- **Willamette Pass** (sources verified Nov 8–9):
  - **Measured:**
    - Base weather: ODOT `ODT03` "OR58 at Willamette Pass" (5,121 ft, 0.3 mi from the base lodge, NWS feed). Temperature, wind and gust, but its wind is sheltered at road level.
    - Snow depth and SWE: Cascade Summit SNOTEL `388:OR:SNTL` (5,100 ft, 1.4 mi W, base elevation, hourly). It read 0" on Nov 8–9, matching the resort's 0" base depth and its base cam. It's on the ski area's doorstep at base elevation, so unlike Bachelor's distant SNOTELs it may feed the summary.
    - **No public station exists on the upper mountain** (checked on NWS and MesoWest), so everything above the base is a forecast.
    - Regional reference only: Salt Creek Falls `729` (4,220 ft, 4 mi W), New Crescent Lake `660` (4,910 ft, 7 mi SE), Summit Lake `801` (5,610 ft, 12 mi S).
  - **Forecast:**
    - NWS **Medford** `MFR/145,125`. The cell averages 5,538 ft and covers base to summit; the resort's own forecast link uses the same point. Zone ORZ027. The written forecast and AFD come from MFR too.
    - **MFR publishes no visibility forecast**, so visibility shows as "no visibility forecast for this area" instead of being assumed.
    - Open-Meteo at 43.604, -122.026: base 5,120 / mid 5,900 (halfway; the resort names no mid-mountain landmark) / summit 6,683 ft (Eagle Peak).
  - **Cams** (there's no snow stake cam):
    - The resort's "Willamette Pass Base Area" YouTube stream `sNVA6oC7vcM` looks up the lift line from the base.
    - ODOT TripCheck stills `https://tripcheck.com/roadcams/cams/Willamette%20Pass_pid3351.JPG` (looking W) and `WillamettePass_pid658.jpg` (looking E), 328×314 with their own stamp. ODOT allows their use with the credit "Camera courtesy of ODOT", per the TripCheck FAQ.
  - **Resort (willamettepass.ski):**
    - Its pages send `X-Frame-Options: DENY`, so the Lifts tab links to its Lifts & Trails page.
    - Its weather widget is just the NOAA forecast, read from an internal JSON file. Don't use it.
    - Stats: 5,120 / 6,683 ft, 1,563 ft vertical, 555 acres, 430" average snowfall.
    - Lifts: Eagle Peak Accelerator (six-seat); Peak 2, Twilight, Midway, Sleepy Hollow (triples); Magic Carpet. Frontside 9–4, Peak 2 9:30–3:30.
  - **No avalanche forecast zone covers it.** Don't link one.
- **Sun Peaks, BC, Canada: built and live since Nov 9 (Pacific).** The owner accepts no live station reading if none exists ("having numbers is always best, but if none exist then so be it").
  - **As built** (re-verified Nov 9, 10pm Pacific):
    - Point 50.893, -119.900. Zones: Village base 4,117 ft / Mid-mountain 6,086 ft / Top of the World (Burfield summit) 6,824 ft.
    - Hourly forecast: GEM (`gem_seamless`) at mid-mountain. Its gusts are real (they equal the sustained wind only in calm hours), and it has a chance of precipitation, but no freezing level, visibility or snow level.
    - Elevation temperatures and "Right now": Open-Meteo's default model. On Nov 9 at 10pm it was within 0.7–1.7°F of the resort's own thermometers (+0.7 village, −0.9 mid, −1.7 top); GEM alone was −1.6 at mid.
    - Measured snow: the three ECCC climate stations (Upper 2,055 m = 6,742 ft, Mountain 1,847.4 m = 6,061 ft, Lower 1,310.6 m = 4,300 ft, elevations from ECCC's station list). **Last season they reported only Jan 13 to Apr 6, 2026**, with gaps, so expect "no reports yet" until about January.
    - Eight of the nine resort cams, ordered: Juniper Ridge and Crystal Bowl (top of Burfield), Mt. Tod from Morrisey, top of Sundance, Mt. Morrisey from the Elevation chair, Base of OSV, Village Day Lodge slope, Village/Valley. The Village Clock Tower view is left out: it shows the village square, nothing about ski conditions. The cams last updated about 5pm Pacific and pause overnight; the 4K ones are 1.3–1.6 MB.
    - Lift board: linked (`X-Frame-Options: SAMEORIGIN`). Links: the official report, lifts, cams, Avalanche Canada (map and Mountain Weather Forecast), DriveBC.
  - **Basics** (resort's Trail Maps & Stats and Hours pages, checked Nov 9):
    - Village base 1,255 m (4,117 ft). Mid-mountain 1,855 m (6,086 ft), the resort's own mid-mountain weather point, about the top of Sunburst Express (1,850 m). Summit "Top of the World", the top of Burfield, 2,080 m (6,824 ft).
    - West Bowl Express tops out at 2,093 m. Mt. Tod's summit (2,152 m) is outside the boundary. Vertical 896 m (2,940 ft).
    - Village about 50.889, -119.883. Time zone America/Vancouver.
    - Season **Nov 21, 2026 to Apr 4, 2027 (scheduled)**.
    - Lifts mostly 9:00 or 9:30am to 4:00pm (from Feb 1, about 30 min earlier), so the site's 9am–4pm ski day fits.
    - The resort sends `X-Frame-Options: SAMEORIGIN`, so its lift board (`/ski-ride/weather-conditions-cams/lifts-trail-status`) can only be linked.
  - **No NWS in Canada.** Every NWS piece (stations, hourly gridpoint, written forecast, AFD) needs a Canadian replacement or an honest "none published here".
  - **Live measured weather: none on the mountain in winter.**
    - BC Wildfire station CAHILTY (`BC_WMB_253`, 1,543 m, 3 km E of the village) is fire-season only. Last report Oct 31, with temperature, wind, RH and rain but no snow.
    - ECCC SWOB and Avalanche Canada's station list have nothing else nearby but valley or highway sensors (Barriere 390 m, Squilax 366 m, Kamloops A 345 m), which don't represent the mountain.
    - The resort's web page shows live temperature and wind for Top of the World 2,080 m, Mid-mountain 1,855 m, Top of Morrisey 1,675 m and Valley 1,255 m. The page builds them into its own HTML; there's no public feed. Use them for by-eye cross-checks only, unless the owner gets the resort's permission.
  - **Measured snow:** ECCC climate stations on the ski area, via `api.weather.gc.ca/collections/climate-daily` (CORS `*`):
    - SUN PEAKS LOWER `116Q20D` (1,311 m), SUN PEAKS MOUNTAIN `1168204` (1,847 m), SUN PEAKS UPPER `116QK0M` (2,055 m, about 50.902, -119.918).
    - Daily, hand-read: SNOW_ON_GROUND (cm), TOTAL_SNOW, MAX/MIN_TEMPERATURE, TOTAL_PRECIPITATION. They have gaps and report in season only (Jan–Apr 2026; Upper read 190 cm on Mar 31). Days appear with a delay; measure it once the season starts.
    - Good for a measured season chart, labeled with dates. Not "right now".
  - **No regional snow-pillow reference.** BC's snow pillows (`bc-env-snow`) reach browsers only through the Datamart (`dd.weather.gc.ca`, no CORS), and the nearest, Deadman River `1C32P`, is 56 km away at 1,460 m.
  - **Forecast:**
    - Open-Meteo works at Sun Peaks (grid point 50.883, -119.914). On Nov 9 at 9:30pm, model temperatures at 1,255 / 1,855 / 2,080 m (2 / −2 / −3.5°C) matched the resort's readings (1 / −2 / −3°C).
    - Canada's HRDPS 2.5 km model is available as `models=gem_hrdps_continental` (48 h; cell averages 1,692 m). It's the natural replacement for the NWS hourly gridpoint.
    - ECCC's nearest city-page forecast is Kamloops (`bc-45`, valley, 45 km), which doesn't represent the mountain.
    - ECCC publishes no forecast discussion (the FX bulletins are aviation tables).
    - Avalanche Canada's written Mountain Weather Forecast is seasonal (it "has ended for the season", last issued Nov 4) and isn't in their documented API, so link it only.
  - **Avalanche Canada:**
    - Documented public API (`/api-docs`): `api.avalanche.ca` / `avcan-services-api.prod.avalanche.ca` (`/forecasts/{lang}/areas|metadata|products|products/point`) and `weather.prod.avalanche.ca` (`/stations`, measurements). CORS `*`.
    - Sun Peaks sits in the single early-season BC area until regular regions start; re-check its winter region then. Link it like COAC for Bachelor.
  - **Radar:** RainViewer covers it (echoes over Sun Peaks at 05:30 UTC Nov 10, while the Mt. Tod cam showed snow).
  - **Cams:** nine resort stills at `https://www.sunpeaksresort.com/sites/default/files/spr_website_data/webcams/<file>.jpg`, checked Nov 9 against each picture.
    - None has an on-image time stamp. They pause at night (last update about 5pm). They're large (up to 3840×2160, 1.6 MB). There's no snow stake cam.
    - By caption and file: Crystal Bowl (`Wild flowers 1`) and Juniper Ridge (`Wild flowers 2`), both top of Burfield 2,080 m; Mt. Tod, view from Mt. Morrisey (`view of mt todd`, top of Morrisey Express 1,672 m); Sundance (`sundance`, top of Sundance Express 1,731 m); Elevation (`ele_view_of_morrisey`) and Base of OSV (`ele_view_of_OSV`), both at the base of the Elevation chair, 1,600 m; Village Day Lodge Slopeside, Valley, Village Clock Tower (village 1,255 m).
    - The two Burfield-top cams are the most useful (alpine snow surface).
  - **Roads:** no DriveBC camera or road sensor on Sun Peaks Road. The nearest are valley highway cams 16–44 km away.
  - **Code work:** done (the non-NWS forecast path, the ECCC loader, "none published here" states, unit conversion, all three mountains tested). See "Settings a mountain can have" above.
  - **Mountain picture fix that came with it:** Sun Peaks' mid-mountain is only 738 ft below the summit, so the temperature boxes overlapped, and its freezing level ran just under the summit. Now boxes that would overlap are pushed apart, and a line label with no room goes to the open sky at the top left with a dashed sample. The old "compact label" fallback could never run because of a `??` default; that's fixed. Layouts that already fit don't move (Bachelor checked against the live version).
- **Adding a mountain:**
  1. Research and verify every station, camera, elevation and the forecast grid cell. Find the cell with `api.weather.gov/points/<lat>,<lon>` and check its elevation.
  2. Check the resort's pages for frame-blocking headers, and its cams' on-image stamps. Add every new host to the Content Security Policy in `index.html`.
  3. Add a block to `mountains.js`.
  4. Test both views on desktop and phone for **every** mountain, since shared code changes affect all of them.

## Data: the most important rules

Good data is the backbone of this site. These rules come from mistakes the owner has corrected.

- **Use only reputable sources that actually represent the ski area.** Mountain weather changes sharply with elevation and location, so a "nearby" station can be badly wrong for the ski area.
  - *Mistake that was corrected:* the old ski score (since removed) used the Three Creeks Meadow SNOTEL station (5,680 ft, 11.6 mi away, a different drainage) for new snow and snowpack. It read 0" while the mountain had snow, which made the result wrong.
  - **Any station that isn't on the ski area must say so** on the page. Set `offSite` in `mountains.js`, for example `'5 mi N of the summit, not at the ski area'`.
- Before using any station, check its **elevation, distance, location and how recent its readings are**. Use stations on or right next to the ski area. Distant or lower stations may appear only as a clearly labeled regional reference, and must never feed the summary or any calculation.
- **Don't use modeled snow depth.** *Mistake that was corrected:* preseason mode first showed Open-Meteo's modeled snow **depth**. It read 0" at every elevation on Nov 7 while the stake cam and the resort's sensor showed snow on the ground. Modeled **snowfall** (snow that fell) is used instead, labeled Model.
- **Cross-check against the resort's own sensors** whenever adding or changing a data source: Bachelor's station graphic `cams/mtn/weather-server-image` and stake cam, and Willamette Pass's reported base depth and base cam.
- **Ignore stale data.** A station whose last report is older than `stationMaxAgeHours` (3) is shown as offline and left out of the calculations. Check sensor timestamps: the resort's station graphic has a Northwest lift-top sensor stuck since June 3, and showed a bogus 145" West Village snow depth on Nov 6 (4" on Nov 7).
- **Label every value** as *Measured* (live sensors on the mountain), *Forecast* (NWS or model prediction) or *Model* (an estimate of what already fell). Never present an estimate as a measurement.
- **Never invent data or use mock values.** If a source is down, say so on the page. Every section has an "unavailable" state, and the Week ahead strip warns when a source failed.
- **Never use private or undocumented APIs, and never impersonate a website** to get around access controls (for example, spoofing Origin or Referer headers for `api.mtbachelor.com/.../dor/*`; the safety checks rightly blocked this). Never bypass bot checks (for example, Liftie's Cloudflare challenge). Public webcam image URLs are fine.
- **Approved sources**, all of which allow browser requests (CORS):
  - **NWS observations** (`api.weather.gov/stations/{id}/observations`) for ODOT Century Dr `OD131` (6,424 ft) and the OSU West Village snow pillow `OSUSP` (6,375 ft; NWS carries only its temperature, silent since Oct 31) at the base, and COAC Moon Mountain `MOONM` (7,450 ft).
    - Moon Mountain is **5 mi N of the summit, not on the ski area**. It's kept, at the owner's choice on Nov 9, because it's the only public station at upper-mountain height, and its readings track the resort's own mid-mountain sensors.
    - Its `offSite` field in `mountains.js` makes every label say so: Right now, the preseason readout, the briefing, the charts, the station table and the sources. A status chip is too short to carry that label, so off-site stations don't feed the chips (for example, the freeze-thaw chip).
    - Its thermometer sometimes drops out for a few hourly reports while wind keeps coming in. `stationStats` then uses the latest temperature only if it's within `stationMaxAgeHours` and shows that temperature's own age; otherwise the card says "no temp in 3 hrs".
  - **NWS gridpoint forecast** `PDT/23,40` (grid cell averages ~7,638 ft), its written 7-day forecast (`/forecast`), and the forecast discussions (AFD, Pendleton).
  - **Open-Meteo:** forecasts and snowfall at each elevation (base 6,300 / mid 7,800 / summit 9,065 ft); the 4-model comparison (GFS, ECMWF, GEM, ICON); and the ensembles (`ensemble-api.open-meteo.com`: GEFS 31 + ECMWF 51 runs) behind the 7-day ranges and confidence. Never show a single far-out snow number without its range and confidence.
  - **NRCS SNOTEL**, as a regional reference only (collapsed in Live readings), except a mountain's on-site `snowSensor` (Willamette Pass: Cascade Summit), which is measured snow depth.
  - **Willamette Pass:** NWS observations for ODOT `ODT03`, the NWS Medford gridpoint `MFR/145,125` and AFDs, the resort's YouTube live stream (still image plus YouTube's embed player on tap), ODOT TripCheck camera images, and a link to the resort's Lifts & Trails page. See "Mountains".
  - **Sun Peaks:**
    - Open-Meteo GEM (`models=gem_seamless`) for the hourly forecast.
    - Environment Canada's documented OGC API (`api.weather.gc.ca/collections/climate-daily` and `climate-stations`, CORS `*`) for measured daily snow.
    - The resort's public webcam stills (`/sites/default/files/spr_website_data/webcams/`).
    - Links to its lift board and to Avalanche Canada.
  - **RainViewer** radar; OpenStreetMap tiles.
  - **Mt. Bachelor:** webcams and the station graphic (public image URLs), the official Lift & Trail Status page (embedded), and the Mountain Stats page (the lift list).
- **Lifts:** there is no public live lift-status feed at either resort. The notes below are for Mt. Bachelor; Willamette Pass's board can only be linked. The resort's feed is the private API, and Liftie sits behind a Cloudflare bot check. The per-lift wind-hold **estimate** is **shelved** (`features.liftEstimate: false` in `mountains.js`): the owner found it confusing and didn't want to send people to the wrong area. **Don't bring it back unless the owner asks.** The Lifts tab shows only the resort's official board, embedded and shifted up by `liftStatusOffsetPx` (1040) so it opens at the lift list. If the resort redesigns that page, re-measure the offset. `season.openingDay` is set by hand from the official page, so re-check it when working on the site. Their board counts 14 lifts (including 2 surface carpets); the stats list in `mountains.js` has the 12 chairlifts.

## Security (reviewed Nov 10, 2026)

- **Review, Nov 10:** the owner asked for a full security review. The Claude Security plugin's full scan couldn't run in that session (it needs the Workflow tool), and the `security-review` skill covers only diffs, so the whole codebase was reviewed by hand.
  - Every `innerHTML` sink was traced: outside data is either escaped with `esc()` or turned into a number (`r0`/`r1`/`ftFmt`, and math such as `(dir + 180) % 360`, which makes bad input NaN).
  - No secrets or Vercel IDs are anywhere in the git history. Every `target="_blank"` link has `rel="noopener"`. `?mtn=` only accepts real keys (`Object.hasOwn`).
  - No vulnerability was found. Four hardening fixes went live (below).
- **Content Security Policy** (a `<meta>` tag at the top of `index.html`): the only hosts the page may load scripts, data, images and frames from.
  - **When adding a mountain or source, add its hosts there**, or they'll be blocked: `connect-src` for data, `img-src` for cams and tiles, `frame-src` for embeds. (Stevens Pass added `player.brownrice.com` and `images.wsdot.wa.gov` to `img-src`.)
  - Test for violations by listening for `securitypolicyviolation` in Playwright. A test injecting `<img onerror>` and an outside script was blocked.
  - Style attributes are inline, so styles allow `'unsafe-inline'`. There are no inline scripts or `on…=` handlers; keep it that way.
- **Subresource Integrity** on Leaflet and Chart.js: they now load `leaflet.js`, `leaflet.css` and `chart.umd.js`, whose cdnjs copies are byte-identical to the npm packages. The hashes were checked against both. If you change a version, recompute the hash from the npm package. (cdnjs re-minifies its `.min` files, so those can't be checked against npm.)
- **Data-built URLs are allowlisted:** the AFD product `@id` must be `https://api.weather.gov/products/…`, and RainViewer's tile host must be `*.rainviewer.com`, with paths `/v2/radar/…`.
- **The owner wants to be told before publishing whenever the security plugins flag something.**

## Units

The owner asked for "empirical measurements". That's been read as **US imperial units** (°F, inches, mph, feet) **and** real measured data first. Keep both.

## Audience: expert skiers

- The site is a **one-stop source of information** for experienced skiers who aren't at the mountain yet. Give them the data and let them decide.
- **Do calculate** things they can't easily work out themselves: snow amounts, lift-hold and closure risk, ranges and confidence.
- **Don't make decisions for them:** no gear or pack lists, no "best day to go", no verdicts like "mediocre day", and no instructions ("cover exposed skin", "bring chains"). State the facts, such as the road sensor's low temperature, and leave the conclusion to the reader.
- *Correction from the owner:* a "Pack" list was added to the briefing and then removed for this reason.
- *Owner decision (Nov 9):* the 1–10 ski score was removed everywhere because it didn't work well, along with its one-line verdict ("Powder day", "Firm, mixed conditions") and the "Mainly because…" line. **Don't bring back a score or verdict unless the owner asks.**
- *Owner decision (Nov 9):* **the ski-day status chips state the fact behind them, never a verdict.** "Good temps", "Soft / icy snow" and "Bitter cold" became "Highs 41–51°F" (neutral dot, not a green check), "Base above 40°F", "Freeze-thaw last 24 hrs" and "Wind chill −12°F". Keep any new chip to a plain fact.
- *Owner decision (Nov 9):* **no lift-status data in our own graphics.** The owner cares most about weather during the season and snow during preseason. Keep showing the resort's official lift board as it is: embedded for Bachelor, or a link where a resort blocks embedding. Don't propose lift-status features unless the owner asks.

## Design preferences

- **Every feature gets two parts:** an easy-to-read summary with a visual near the top, and an in-depth version further down (usually its own tab).
- **The infographic is front and center** on the home screen (ski-day view): a heading naming the day and hours it covers, the factual status chips, then the big mountain picture (2/3 width) with wind and fresh snow beside it, and sky and right-now below. The text briefing sits under the graphics.
- **Graphics must explain themselves.** Put labels, scales, units, zone names and values directly on the graphic (for example, the elevation scale, "↑ below freezing / ↓ above freezing", wind zones "Light / Breezy / Lift holds", mph marks, cloud % per hour). Don't add paragraphs under a graphic explaining how to read it. A bit more clutter is fine; making people read a lot is not.
- **Never let a forecast pass for current conditions.** After 3pm the ski-day view shows tomorrow, so every forecast graphic says which day and hours it covers ("Tomorrow (Sun), 9am–4pm forecast"), the Week ahead strip always starts with "Today" then "Tomorrow", and preseason mode shows a measured "Right now" readout. *Correction from the owner:* they saw the summit in the 20s (Sunday's forecast after a cold front) while the resort app showed ~50°F now, and thought the data was wrong.
- **Plenty of technical data is wanted, but it lives further down**, in the tabs and in collapsible tables.
- **Keep the page short vertically:** use tabs, carousels and collapsible sections instead of long stacks.
- **The layout must work on every device:** JS sets `<html data-device="mobile|tablet|desktop">`, and CSS and charts adapt to it. Test phone and desktop every time.
- **Smooth animations are wanted**, but always respect `prefers-reduced-motion`.
- **Snow stake camera** (Mt. Bachelor and Stevens Pass. Willamette Pass's Base Area cam and Sun Peaks' Juniper Ridge cam, at the top of Burfield, take the same slot): always included, with high visual priority, but **only one large stake image per view.** In preseason the big stake sits in the snowpack section and the cam carousel opens on the next camera; in the ski-day view the carousel opens on the stake. The stake is the first entry in the carousel. *Correction from the owner:* two large stake cams at once was too much.
- **Other cams:** pick them by how useful they are for judging ski conditions, and **label them by their real location**. Check each camera's own on-image stamp. *Mistake that was corrected:* camera 3 was labeled "The Cone (summit)", but it sits at West Village. **No camera is at the summit**; the highest are three cameras at the top of Outback (mid-mountain).
- **Tab labels are plain words:** Snowpack (preseason only) · Live readings · Hour by hour · Next 7 days · Base to summit · Lifts · Radar loop · Forecaster notes.
- **Preseason mode** (`preseason.js`): turns on automatically before `season.openingDay` and off on Opening Day. A closed resort with no date announced (`openingDay: null, closed: true`) stays in preseason. It leads with:
  - the Opening Day countdown ("TBA" when no date is announced)
  - a measured "Right now" readout
  - snowfall by elevation (since Oct 1, plus the next 7 days stacked on top; Model)
  - tiles for last-7-day snowfall, the week's snow range (82 runs) and the chance of ≥6"/≥12"
  - the big stake cam, or the first cam where there's no stake
  - measured snow depth where the mountain has a snow sensor (Right now readout and Snowpack tab)
  - a Snowpack tab (running and daily snowfall charts, table)

  It hides the ski-day cards (the ski-day forecast and briefing). A header button switches to the ski-day view; the choice is remembered (localStorage) until Opening Day.
- **Forecaster notes can be technical but must be readable by people.** Never show raw teletype text (`000 FXUS66…`, `&&`, `$$`) as the main view. Parse it into sections, highlight ski-relevant sentences, explain jargon on tap, and keep the original at the bottom.
  - Offices format these differently, so check a new office's notes against the original text at the bottom. Seattle puts the first words of a section on the header line after a `/subtitle/` (they were being dropped; fixed Nov 10) and wraps long warning lists (an indented line now continues the alert above it).
- **Charts** follow the dataviz rules: one y-axis per chart (no dual axes), the validated palette (`--s1`…`--s4`), hairline grids, hover tooltips, and a table for every chart. Status colors always come with an icon and a label. Set axis ranges before drawing, never mid-animation (that once misplaced a line).
- **Link preview:** `preview.png` (1200×630) and `icon.svg`/`icon-180.png` are referenced by the Open Graph tags in `index.html`. The preview has no live numbers on purpose, so it never goes stale. The Open Graph tags point at `https://ra-dar-alpha.vercel.app/`. The very first version of the site showed London, and some apps cached that preview; adding `?v=2` (or a higher number) to a shared link forces a fresh one.
- Support light and dark mode.

## How the code fits together

- `index.html`: page structure. Scripts load in this order: `mountains.js`, `week.js`, `preseason.js`, `app.js`. `week.js` and `preseason.js` contain only functions, because `app.js` starts the page as soon as it loads.
- `mountains.js`: everything specific to a mountain (see "Mountains" above). `app.js` picks it at load as `M` (`MTN_KEY`); `setupMountain()` builds the switcher and fills in per-mountain wording and slots.
- `app.js`:
  - `refreshData()` loads the sources in parallel into the `state` object (`stations`, `snotel`, `nws`, `elev`, `week`, `pre`), then:
    - `computeCall()` → `renderCall()` (day heading, status chips, mountain, wind, snow, sky, right-now, briefing)
    - `buildWeek()` → `renderWeekStrip()`
    - `renderPreseason()`
    - `drawActiveTab()`
  - Helpers: `getJSON` (retries once) and `getJSONCached` (localStorage, for Open-Meteo and the ECCC daily data). `snowSensor()` returns the on-site SNOTEL from `state.snotel` (loaded together with the regional ones).
  - Mountains without the NWS:
    - `FC` names the hourly source.
    - `loadNws()` hands off to `loadModelHourly()`.
    - `rainTopZone()` decides rain vs. snow by elevation.
    - `loadSnowDaily()` fills `state.daily`, read through `dailyLatest()` and `dailyNone()`.
    - `modelNow()` and `renderNowModel()` build the labeled "Right now" estimates.
  - The mountain picture's elevation scale and shape are computed from the mountain's own base and summit, so it works for any vertical.
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
  - On Nov 9 at 10:40pm Pacific, `api.weather.gc.ca` also reset connections from the sandbox for several minutes (curl: "Connection reset by peer"), then answered again. `weather.gc.ca` loaded fine meanwhile. The page showed "no daily snow reports" as designed.
  - To test a failure state on purpose, block the request in the Playwright test only (`page.route(..., r => r.abort())`), never in the site.
- **Open-Meteo's free tier allows 10,000 requests per day per IP address, and ensemble requests count heavily.** Heavy browser testing from the sandbox can use up the whole day's allowance (HTTP 429 "Daily API request limit exceeded"; resets at 00:00 UTC = 4pm Pacific). **Keep test page loads few.** When it's blocked, test layout with fixtures injected in the test only, never in the site. The site caches Open-Meteo responses in each visitor's browser (`getJSONCached`: 45 min, ensemble 90 min, preseason snowfall 3 h).
- Cloud sessions should use the **Ra-Dar** environment, in **Auto** mode. It allows these hosts:
  - `api.weather.gov`, `api.open-meteo.com`, `ensemble-api.open-meteo.com`, `wcc.sc.egov.usda.gov`
  - `api.mtbachelor.com`, `www.mtbachelor.com`
  - `api.rainviewer.com`, `tilecache.rainviewer.com`, `tile.openstreetmap.org`, `cdnjs.cloudflare.com`
  - `ra-dar-alpha.vercel.app` (live-site checks), plus `gitlab.com`, `api.vercel.com` and `api.cloudflare.com` via saved network secrets
  - `tripcheck.com`, `i.ytimg.com`, `www.youtube.com`, `www.willamettepass.ski` (Willamette Pass cams and source checks)
  - For Sun Peaks (added Nov 9 with the owner's approval): `api.weather.gc.ca`, `dd.weather.gc.ca`, `weather.gc.ca`, `www.sunpeaksresort.com`, `sunpeaksresort.com`, `avalanche.ca`, `www.avalanche.ca`, `api.avalanche.ca`, `www2.gov.bc.ca`, `www.env.gov.bc.ca`, `www.drivebc.ca`. Not yet allowed: `weather.prod.avalanche.ca` and `avcan-services-api.prod.avalanche.ca` (Avalanche Canada's documented station and forecast APIs).
  - For Stevens Pass (added Nov 10 with the owner's approval): `www.stevenspass.com`, `stevenspass.com`, `nwac.us`, `www.nwac.us`, `images.wsdot.wa.gov`, `wsdot.com`, `www.wsdot.com`, `wsdot.wa.gov`, `player.brownrice.com`. Not allowed: Brownrice's video servers (`live6.brownrice.com` and others), so live video can't be tested from the sandbox.
  - plus a few used only for research (MesoWest, Synoptic, COAC, NOHRSC and others)
- Libraries (from cdnjs): Leaflet 1.9.4, Chart.js 4.4.1.

## Publishing (standing permission from the owner)

The owner wants finished changes to go live without extra approval steps, and has given permission for this rule.

- **The live site is on Vercel:** the owner's Hobby team, project `ra-dar`, at **https://ra-dar-alpha.vercel.app/** (also `ra-dar-barnhart.vercel.app`). `ra-dar.vercel.app` belongs to someone else.
- **When a requested change is finished**, publish it without waiting to be asked:
  1. Run the checks first: `node --check` on every JS file, then the Playwright browser test on desktop and phone (local server), with no page errors and the screenshots looked at.
  2. Commit with a clear message, then push it to GitLab (`git push origin HEAD:main`).
  3. Copy **only the site files** (`index.html`, `style.css`, `app.js`, `week.js`, `preseason.js`, `mountains.js`, `icon.svg`, `icon-180.png`, `preview.png`) into a folder in the scratchpad. Never include `CLAUDE.md`, `README.md` or `.git`.
  4. Deploy from inside that folder with the Vercel CLI (`npm install vercel` in the scratchpad):
     - Command: `VERCEL_TELEMETRY_DISABLED=1 VERCEL_ORG_ID=… VERCEL_PROJECT_ID=… vercel deploy --prod --yes --token proxyinjectedplaceholder`
     - The real token is a network secret on the Ra-Dar environment for `api.vercel.com`, and the proxy swaps it in. The CLI rejects placeholders that contain `-`.
     - Look up the team and project IDs with the API (`GET https://api.vercel.com/v2/teams`, `GET https://api.vercel.com/v9/projects/ra-dar?teamId=…`).
     - **Never write account, team or project IDs into the repo** (the owner asked).
  5. Check the live site: confirm `https://ra-dar-alpha.vercel.app/` serves the new files, then run the Playwright test against it.
  6. Tell the owner what went live and give the link.
- **The Auto-mode safety check can block the production deploy** (it did on Nov 9), because it doesn't count this file as the owner's go-ahead. If it blocks, don't work around it: ask the owner to say "publish it" in the conversation, or to switch the session's mode menu to "Accept edits" and approve the deploy prompt.
- Vercel's default Deployment Protection ("all except custom domains") puts a Vercel login in front of the individual deployment URLs. The production addresses above stay public, so leave the setting alone.
- **Limits on this permission:**
  - Never publish a change that failed its checks. Fix it, or tell the owner what's broken.
  - Never force-push, rewrite history, or delete branches or tags on GitLab.
  - Only publish the owner's own requested changes.
  - The permission covers this website only.
