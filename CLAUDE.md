# Ra-Dar: notes for Claude

Ra-Dar is a **ski weather tracker** website for nine mountains: **Mt. Bachelor** and **Willamette Pass** (Oregon); **Stevens Pass**, **Mission Ridge** and **Mt. Spokane** (Washington); **Palisades Tahoe** and **Alpine Meadows** (California; the two sides of Palisades Tahoe); **Appalachian Ski Mtn.** (North Carolina); and **Sun Peaks** (British Columbia), with a switcher at the top of the page, sorted alphabetically. More mountains can be added through `mountains.js`.
It's a static site published on **Vercel** at **https://ra-dar-alpha.vercel.app/**. There's no build step, no server and no API keys in the code.

The owner isn't a programmer. Explain things in plain language, keep setup steps they have to do themselves to a minimum, and tell them plainly what went live and what didn't work.

## Where things live (since Nov 9, 2026)

- **Live website: Vercel**, at **https://ra-dar-alpha.vercel.app/**. See Publishing below.
- **Code and history: GitLab**, in the private project **https://gitlab.com/zealacy-group/ra-dar-storage**, branch `main`. This is the only code repository in use. Its git remote is `origin`.
  - Getting the code in a new session: `git clone https://gitlab.com/zealacy-group/ra-dar-storage.git`. A cloud session may first try to check out an old repository elsewhere and fail; that's expected, so ignore it.
  - Access: the owner's GitLab token is a network secret on the Ra-Dar environment for `gitlab.com` (basic auth). It's a legacy personal access token with only `read_repository` and `write_repository`, so it can't call the GitLab API, and it expires within a year; the owner renews it through the secure credential form.
  - Saving work: commit, then `git push origin HEAD:main`. **Check `git remote -v` first:** after a container restart the harness may point `origin` back at the old GitHub address. GitLab is then the `gitlab` remote, so push with `git push gitlab HEAD:main`.
  - The tag `archive/2026-11-08-old-host-final` marks the last version published on the previous host. It's history only.
- **GitHub is back (Nov 12, 2026), as a backup only for now.** The owner said they fixed the account; checked read-only: the profile loads normally with no restriction notice, `Zealacy/Ra-Dar` is public, and a dry-run push was accepted.
  - The owner asked to "back it up atm" and will decide "the ultimate solution" later (keep Vercel, move back to GitHub Pages, or something else). **Ask before doing more than the backup.**
  - Backup: GitLab `main` was pushed to GitHub branch `claude/ecstatic-mccarthy-firdru` (it has GitLab's history, unrelated to GitHub's old branches). To refresh it: `git push https://github.com/Zealacy/Ra-Dar origin/main:refs/heads/claude/ecstatic-mccarthy-firdru` from the GitLab clone (a fast-forward; never force).
  - **Not touched:** `claude/weather-tracker-github-v48153` (the old Pages branch, still the Nov 8 version) and `claude/youthful-allen-iq65pi`. Whether `zealacy.github.io/Ra-Dar/` is serving again wasn't checked (cloud sessions can't reach that host); if it is, it shows Nov 8 data and should be updated or redirected, at the owner's choice.
  - The GitHub repository is **public**; GitLab is private. Everything pushed there, CLAUDE.md included, is visible to anyone.
- **Before Nov 12: GitHub was not used.** The project started on GitHub, but GitHub locked the owner's account on Nov 8, 2026, and the old `github.io` address is dead. The owner has an appeal open; if access comes back, ask the owner before using it for anything. Don't suggest a second GitHub account, since GitHub allows one free account per person.
  - On Nov 9 the session's automatic checkout of the GitHub repository *succeeded* (an old Nov 8 copy), so access may be back. The owner was told and kept the rule: GitLab only.
- **Cloudflare Pages was tried and doesn't work from cloud sessions. Don't retry it.** The proxy injects the saved token into every request to `api.cloudflare.com`, overwriting the short-lived upload JWT, so asset uploads fail (code 8000013). An empty `ra-dar` Pages project and a Pages-only token remain on the owner's Cloudflare account.

## Handoff: where things stand (updated 2026-11-13, 12:10am Eastern / Nov 12, 9:10pm Pacific)

- **Vercel serves commit `c1a1999`** (Nov 12, about 9pm Pacific; owner: "Build it, then publish it all"): nine mountains, adding **Palisades Tahoe**, **Alpine Meadows** and **Appalachian Ski Mtn.**, the alphabetical switcher (wrapping onto two lines on wider screens), and the shared changes listed under each of those mountains. Checked: `node --check`, the browser test on all nine mountains locally (desktop and phone, both views) and on the new three plus Mt. Bachelor against the live site, and the switcher at 1024/1280/1600 px and on a phone. No page errors and nothing blocked anywhere. The sandbox dropped many Open-Meteo requests that evening (connection drops, not limits), so some test loads showed "no Open-Meteo"; every mountain loaded fully in at least one view.
  - **Still to do:** look at Appalachian's slope cam in daylight and describe it (see its section).
- **Earlier publish, commit `108cd55`** (Nov 12, about 12:20am Pacific, owner: "Publish it"): Mission Ridge's Opening Day, Fri Nov 27 (planned), from the resort's Operating Schedule page (screenshot from the owner). Checked on the live site: the countdown on Mission Ridge, Mt. Spokane, Willamette Pass and Mt. Bachelor (desktop and phone, no page errors). Open-Meteo was switched off in that check because this sandbox was over its daily limit; nothing else changed.
- **Earlier publish, commit `02288eb`** (Nov 11, about 8:40am Pacific, from the owner's "check cams and publish" and "ok publish it in the morning"): Mt. Bachelor, Willamette Pass, Stevens Pass and Sun Peaks, with the Nov 10 data-audit fixes (see "Data audit" below).
  - It passed `node --check` and the browser test on all four mountains (desktop and phone, both views), locally and against the live site. No page errors and nothing blocked by the Content Security Policy.
- **Earlier publish, commit `7ee2ea3`** (Nov 11, about 7:25pm Pacific): all five mountains. Mt. Spokane went live after the owner said "go ahead and publish spokane, theyll fix it" (Nov 11 evening). Checked like the morning publish: `node --check`, the browser test on all five mountains locally and against the live site.
- **Mt. Spokane is live with its cams still showing title cards.** In daylight on Nov 11 all eight YouTube streams, the snow stake included, showed the resort's title cards (old winter photos behind a "Live Stream" box), unchanged since Nov 10; still the same that evening.
  - So each cam's text says "Until the resort switches its streams on, this shows their title card (an old photo)", the stake caption says it's "not today's snow", and the Fresh snow card's thumbnail reads "Stake cam" instead of "Measured: stake cam" (`snowStake.thumbLabel`).
  - **When the streams come back** (probably near the projected Dec 5 opening): check each picture against its caption, then remove those sentences and `thumbLabel`.
  - `draft: true` (added Nov 11 morning, removed that evening) still works for holding any finished mountain off the site: it's removed from the switcher and from `?mtn=`.
  - Quartz Peak is regional only ("3 miles is a lil too much"), and "Right now" shows labeled model estimates (`nowModel: true`; "if the data is sufficiently accurate include it"). Model accuracy over 7 days, hour by hour, at each station's own location and height: Quartz Peak 1.7°F average miss (84% of hours within 3°F), Ragged Mountain 2.3°F; yardstick, Stevens Pass's on-mountain station 2.4°F, its SNOTEL 2.6°F. Script: session scratchpad `spokane/verify.py`.
  - Shared code it brought: YouTube snow stake (`snowStake.youtube`), `season.projected`, the "no station" Right now state (`text.noStation`), and the switcher's own header row when five mountains don't fit at 1280 px.
- **Stevens Pass cams checked in daylight (Nov 11):** Skyline looks down across the front side from high on the mountain (dusting of snow on the upper runs, cloud in the valley); Jupiter is a close view of a lift building on the back side (fogged in). Their `why` text says so.
- **Earlier publish, commit `aacce7d`** (Nov 11, about 9:50pm Pacific, owner: "Publish them both"): all six mountains, Mission Ridge included, and the new general link preview (see "Link preview").
  - Checked: `node --check`, the browser test on all six mountains locally and against the live site, desktop and phone. No page errors and nothing blocked anywhere; Mission Ridge loaded every source on both live loads.
  - **That evening this sandbox hit Open-Meteo's limit** (HTTP 429 after a 200) from repeated full test runs, so several test loads showed "no Open-Meteo" / "no GEM forecast". Visitors have their own allowance, so the live site is unaffected. Keep test runs few, as the Working section says.
- **Mission Ridge** went live after the owner said "build" (Nov 11, about 9pm Pacific) and decided to use Upper Wheeler as measured snow depth, labeled as base-level. The Auto-mode check blocked the first deploy; the owner then said "Publish them both".
  - Its cams (checked in daylight Nov 11): Sunspot looks down over the snowmaking-whitened runs to the valley; Midway shows a chair's bottom terminal beside a building deck; Mimi looks up a lower run with a snow gun. Opening Day "not announced" (`openingDay: null, closed: true`); the resort's site blocks this sandbox, so ask the owner if a date appears.
  - **Shared change that came with it:** station wind speed and direction now come from the latest report that has them within `stationMaxAgeHours`, with their own age shown ("(wind 2 hr ago)"), as temperature already did. With no recent wind speed but a gust, a station shows "gust N mph". Mission Ridge's summit feed drops wind from about half its reports; Bachelor and Stevens rarely do.
- **Earlier publish, commit `26b92bd`** (Nov 9 at about 10pm Pacific, with the owner's go-ahead in the conversation). It made three changes:
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
- **Mountains:** Mt. Bachelor, Willamette Pass, Stevens Pass and Sun Peaks are all live. A switcher at the top of the page picks the mountain; see "Mountains" below.
- **Seasons:**
  - **Stevens Pass** has **no Opening Day announced**: the resort's Hours of Operation page lists "Winter 2026/27: Skiing & Riding TBD" (checked Nov 10). `season: { openingDay: null, closed: true }` keeps preseason on. **Set the date when they post one.**
  - **Mt. Bachelor** is closed until **Opening Day, Dec 4, 2026 (scheduled)**, per the official Lift & Trail Status page (re-checked Nov 9, 9pm Pacific). **Preseason mode** is on until then, and switches off by itself on that date.
  - **Sun Peaks** opens **Nov 21, 2026 (scheduled)**, season to Apr 4, 2027, per the resort's Winter Hours of Operation page (checked Nov 9, 10:20pm Pacific). Preseason mode until then.
  - **Willamette Pass** opens **Dec 11, 2026 (scheduled)**: the resort's home page headline reads "Scheduled Opening Date: December 11!" (page last edited Nov 5 UTC; found in the Nov 10 audit). Its Hours of Operation page, last edited Oct 9, still said "Opening Soon for 2026/2027!", so check the home page too.
    - Its site blocked cloud sessions with a Cloudflare bot check (HTTP 403) from Nov 9, 9pm, but answered normally on Nov 10 at 11pm. If it blocks again, don't get around it: ask the owner to check the resort's pages.
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
  - *Owner decision (Nov 9, 10pm Pacific):* **Sun Peaks' "Right now" may show model estimates** (Open-Meteo, at base, mid and summit), clearly labeled **"Model, not measured"**, because no live public station exists and the alternative is no data at all. The owner judged them reliable and precise enough (on Nov 9 they were within about 2°F of the resort's own readings). This exception covers only a mountain with no usable measured station (`nowModel: true` in `mountains.js`). The owner extended it to Mt. Spokane on Nov 10, on the condition that the estimates are accurate enough (see Handoff). If a measured source becomes usable, it replaces the estimates. Every other mountain's "Right now" stays measured-only.
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
- **Stevens Pass, WA** (sources verified Nov 10, 7–9pm Pacific; live since Nov 10):
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
- **The Summit at Snoqualmie, WA: researched Nov 12 (9:30–10:40pm Pacific); not built.** Four base areas on Snoqualmie Pass (I-90), run by Boyne: Summit West, Summit Central, Summit East (south of I-90, side by side) and Alpental (north of I-90, separate). Owner decisions pending (end of this list).
  - **Basics:** resort's help center ("Mountain Stats & Snowfall", read through a search: the page fails certificate checks from here): highest point 5,420 ft (Alpental), verticals from about 765 ft (West) to 2,280 ft (Alpental), about 1,994 acres, 25 lifts, ~426" a year at Summit West. Wikipedia: verticals Alpental 2,280, Central 1,025, West 765, East 1,100; lowest base 2,610 ft (East). **The resort publishes no base/top height per area** besides Alpental's top; measure the rest (e.g. Open-Meteo's elevation API at lift tops) before building.
    - **Opening Day 2026–27: "to be determined"** (hours page, updated Sep 27). Last season: Summit West Dec 23, 2025; Alpental Jan 7, 2026.
    - Site: Next.js behind Cloudflare, no frame-blocking headers seen; mountain reports `/mountain-report` and `/alpental/mountain-report` load by script.
  - **Measured: NWAC stations through the NWS feed (MesoWest "NWAVAL"), hourly, 1–2 h late:**
    - Summit side: `SNO30` Snoqualmie Pass (3,010 ft, at Summit West's base; temp, RH), `SNO38` Dodge Ridge (3,760 ft, 0.7 mi; temp, wind, gust, no RH) — both current. `ESS38` East Shed (3,770 ft, above Lake Keechelus): last report Nov 10, offline.
    - Alpental: `ALP55` Summit (5,470 ft; temp, wind, gust) current; `ALP31` Base (3,100) and `ALP44` Mid-Mountain (4,350) stopped about 2pm Nov 12 (blank in NWAC's own table too).
    - WSDOT `TALPE` "Alpental Exit" (2,972 ft, I-90 road sensor, 15 min).
    - Nov 12, 10pm: an inversion with east wind through the pass: Dodge Ridge 34°F (E 18 mph), pass 40.5°F, Alpental summit 40.5–42°F (SE 33, gusts 47). Open-Meteo missed the cold pool (44°F at 3,000 ft).
    - NWAC's tables also have snow depth (SnoHt) at the pass (3,010) and at Alpental (3,100, 4,350), on its site only (`nwac.us/weather/stations/snoqualmie-pass`, `/alpental`); link them.
  - **Snow depth:** no SNOTEL on any area. Olallie Meadows `672:WA:SNTL` (4,010 ft, 2.7–5 mi, another valley; 1" Nov 12) is the nearest; Tinkham Creek `899`, Meadows Pass `897`, Stampede Pass `788` regional.
  - **Forecast:** the Cascade crest splits NWS Seattle (`SEW`) and Pendleton (`PDT`) through the pass. Alpental: `SEW/151,54` (3,983 ft, holds the mid station), `152,55` (4,862), `151,55` (4,777). Summit West base: `SEW/152,54` (3,087 ft). Dodge Ridge, Central and East fall in Pendleton's cells (`PDT/62,197` 2,569 ft, `63,196` 2,812, `63,195` 2,759), which average below the ski terrain (they take in the Keechelus valley). Seattle's AFD covers the passes. NWAC avalanche zone: **Snoqualmie Pass** (`nwac.us/forecasts/avalanche/snoqualmie-pass`).
    - Open-Meteo at Alpental: base cell 47.427, -121.440; mid/top 47.459, -121.412. At the Summit: 47.408, -121.391.
  - **Cams:** seven resort cams, CamStreamer embeds (`camstreamer.com/embed/<id>`) that redirect to YouTube live streams (the site's `youtube` cams). Resolved Nov 12: Alpental Base `8wk81COX2cg`, Alpental Mid-Mountain `c_XLrUYV8tk`, Alpental Top `bWf5rScCIas`, Summit West Base `vhO8nNqg9iw`, Silver Fir Base `H7HwsNLqVC8`, Summit Central Top `w4Sno8NIjmU`, Summit Central Base `GcIAQ5iD35o`. **YouTube ids can change when a stream restarts**; re-resolve through CamStreamer when building. At 10pm only Alpental Top (live, blowing snow) and Central Base were live; the other five showed title cards over old winter photos (as at Mt. Spokane). Re-check in daylight. No snow stake cam found.
    - WSDOT I-90 cams (320 px, own name and time stamp, current at 10:13pm): `images.wsdot.wa.gov/sc/090vc05130.jpg` "I-90 Franklin Falls", `090vc05200.jpg` "I-90 Snoqualmie Pass Summit", `090vc05347.jpg` "I-90 East Snoqualmie Summit". Same permission situation as Stevens Pass's WSDOT cams.
  - **Owner decisions needed:** (1) how to split: Alpental separate, and West/Central/East as one or three entries; (2) snow depth: no sensor on the areas, so Olallie Meadows etc. regional only (as at Mt. Spokane/Alpine)?
- **Appalachian Ski Mtn, NC: researched Nov 12 (10–11:40pm Eastern); built Nov 12 as `appalachian` ("Appalachian Ski Mtn.").** The owner said "Build it, then publish it all" after the recommendations below; the optional ideas (snowmaking-weather readout, night-skiing window) were not built.
  - **Shared change that came with it:** on wider screens the mountain switcher wraps onto a second line when even its own row is too narrow (nine mountains at 1280 px), instead of hiding the last mountains off the edge (`.top-row.sw-wrap .mtn-switch` in `style.css`). Phones keep the sideways-scrolling row.
  - **As built:** `nowModel: true` (labeled model estimates, as at Mt. Spokane), `stations: []`, `snotel: []`, NWS `RNK/18,14`, time zone America/New_York, one cam (the resortcams.com stream still). **Still to do:** look at the slope cam in daylight, describe what it shows (only seen at night so far), and confirm the still updates through the day.
  - **Basics** (resort's Mountain Stats page): base 3,635 ft, peak 4,000 ft, 365 ft vertical, 27 acres (Wikipedia), 100% snowmaking; about 60" natural snowfall a year (Wikipedia). Lifts: #1 and #3 quads, #2 double, two conveyors, a handle tow. Ski area 36.174, -81.662 (Wikipedia; 940 Ski Mountain Rd, Blowing Rock). Time zone America/New_York.
    - **Opening Day: "The 2026-27 Season's scheduled Opening Day is set for Friday, Nov 20 (weather permitting)"**; season Nov 20 – Mar 14 (projected). 30 years of opening dates on the stats page: Nov 15 to Dec 21 (last season Nov 29).
    - **Night skiing is central:** lifts 9am–10pm, to midnight Fridays, Saturdays and holidays. The site's ski day is 9am–4pm.
    - Its pages (WordPress, nginx) send no frame-blocking headers. The **slope report** (`/slope-report`) is plain HTML: slopes, lifts, base depth (hand-reported), "Snowmaking last night", road note; last updated Mar 16, 2026 (off-season). It links the NWS point 36.160, -81.621 (generic, 2.4 mi ESE) and Ray's Weather (local forecaster).
  - **Measured: no public station on or beside the ski area.**
    - `BNKN7` Blackburn Knob (4,000 ft, 1.5 mi E) and `HKWN7` Howards Knob (4,432 ft, 3.9 mi N): listed, no observations.
    - `KTNB` Watauga County Hospital heliport (3,146 ft, 1.8 mi N in Boone, 490 ft below the base; temperature only, about every 20 min). `0586W` App State WeatherSTEM (3,291 ft, 2.8 mi, in town). `G5604`, `G2394`: amateur (APRSWXNET/CWOP) — not reputable enough.
    - **Model accuracy** (7 days to Nov 13, hourly, model at each station's own location and height): KTNB 2.1°F average miss (model 1.7°F cooler), App State 1.6°F; yardstick Stevens Pass Tye Mill 2.1°F. As good as at Mt. Spokane. Script: session scratchpad `appski/verify.py`.
    - **No snow-depth sensor:** no SNOTEL in North Carolina; CDEC-like state networks don't cover it. The resort hand-reports base depth on its slope report.
  - **Forecast:** NWS **Blacksburg** `RNK`, zone NCZ018. Cell `18,14` is centered on the ski area (36.175, -81.664) and averages 3,507 ft; neighbors 17,14 (3,632), 19,14 (3,704), 18,13 (3,501). **RNK publishes no snow level** here (visibility yes), so rain vs. snow comes from temperatures, as at Sun Peaks. Open-Meteo: base cell 36.186, -81.664 (0.8 mi N), mid/top 36.160, -81.670 (1 mi S); Nov 12, 10:45pm: 35.2 / 34.5 / 33.9°F at 3,635 / 3,819 / 3,999 ft.
  - **Cams:**
    - Live slope stream (resortcams.com, `appskimtn2.stream`); public still `https://preview.resortcams.com/thumbnail?application=live&streamname=appskimtn2.stream&size=1280x720` (1280×720, CORS `*`, stamped "©2026 AppSkiMtn.com 11/12/26 10:51:02 PM"); player page `https://www.resortcams.com/webcams/app-ski-mtn-live/` (its iframe page sends `X-Frame-Options: ALLOWALL`). At 11:32pm Eastern the still was 41 minutes old and unchanged over 2 minutes: **re-check in daylight** whether it updates steadily.
    - The resort's "Slope Image" `www.asmslopecam.com/axis/slopecam.jpg` ("updates every 1 minute") is **frozen at Sep 29, 2026** (its own stamp and Last-Modified). Don't use unless it starts updating.
    - A second stream (Ray's Weather, HLS on streamlock.net) has no still. The ice-rink cam isn't useful.
  - **Roads:** NCDOT's DriveNC camera API needs a developer key (a key can't be hidden in this static site), so no road cams.
  - **Avalanche:** no avalanche center covers the Southern Appalachians; don't link one.
  - **Ideas offered, not built (owner didn't take them up yet):** a "snowmaking weather" readout (hours cold and dry enough to make snow), since the mountain runs on snowmaking; a longer ski-day window for night-skiing mountains (here and Mt. Spokane). Don't build without asking.
- **Palisades Tahoe, CA: researched Nov 12 (4:30–5:30pm Pacific); built Nov 12 evening as two mountains, `palisades` ("Palisades Tahoe") and `alpine` ("Alpine Meadows").** Two connected mountains 2 mi apart, joined by the Base-to-Base gondola.
  - **Owner decisions (Nov 12):** "feel free to split them into 2 mountains"; Alpine's snow depth "whatever is most consistent" → as at Mt. Spokane, no measured depth claimed; Ward Creek #3, the Palisades SNOTEL and Tahoe City Cross are regional only. Also: "organize the mountain selector at the top alphabetically" (done in `setupMountain()`; the default mountain is still the first key in `mountains.js`, Mt. Bachelor).
  - **As built:** Palisades uses Sacramento's cell `STO/89,87` with Reno's forecast discussion (`nws.afdOffice: 'REV'`); Alpine uses Reno's `REV/27,93`. Stations: Palisades Siberia, Belmont, Olympic Valley base; Alpine Ward Peak summit (8,643 ft per its name; the NWS record says 8,399), Scott top, Roundhouse top, Roundhouse bottom. Cams named by their on-image stamps: the resort's page calls High Camp "Scope 8200'", the Alpine Lodge cam "Alpine Peak" and the Kangaroo race cam "Alpine Race". Ozolio stills are `heavy` (thumbnails every 30 minutes). Lift boards linked (`liftStatusLinkWhy`).
  - **Shared changes that came with it:** stations that report gusts but no sustained wind count as having wind (`hasWind`; the wind chart uses `hasSpeed`); the Fresh snow card says "Model" when a mountain has no snow sensor, daily reports or stake cam; `liftStatusLinkWhy` (Mission Ridge now says its site couldn't be checked for embedding); `relay.ozolio.com` and `cwwp2.dot.ca.gov` in the CSP's `img-src`.
  - **Basics** (resort's Mountain Statistics page):
    - Palisades: base 6,200 ft, peak 9,050 ft, 2,850 vertical, 3,600 acres. Its peaks include KT-22 8,070, Emigrant 8,774, Granite Chief 9,006. High Camp (tram top) about 8,200 ft.
    - Alpine: base 6,835 ft, peak 8,637 ft (Ward Peak), 1,802 vertical, 2,400 acres. Scott 8,289.
    - 400" average snowfall; lifts 9am–4pm. Village about 39.197, -120.236; Alpine base about 39.164, -120.239.
    - **Opening Day: "Opening Day is November 25, 2026"** (Wed), conditions permitting (resort's Opening Day event page, checked Nov 12).
    - The resort's pages (Alterra; Imperva CDN) send no X-Frame-Options or frame-ancestors, so its Mountain Report could be embedded like Bachelor's board; the lift list loads by script, so measure the offset at build time. `liftStatusUrl`: `https://www.palisadestahoe.com/mountain-information/mountain-report`.
  - **Measured: resort stations on both mountains, through the NWS feed, every 15 minutes, all current on Nov 12:**
    - Palisades: `OVBOW` "OV-Base 6200" (6,237 ft, 0.2 mi from the village; temp, wind, gust, RH), `BMTSV` "OV-Belmont 8000'" (8,000 ft), `SIBSV` "OV-Siberia 8700'" (8,700 ft; wind in about half its reports).
    - Alpine: `RHBAM` Roundhouse bottom 6,950, `SCBAM` Scott bottom 7,075 (temp/RH only), `TLCAM` Treeline Cirque mid 7,555, `YVHAM` Yellow Valve House 7,640 (temp/RH only), `RHTAM` Roundhouse top 7,880, `SCTAM` Scott top 8,120, `SUMAM` "AM-Summit 8643' (Ward Mt.)" (NWS elevation 8,399 ft; gusts but never wind speed or direction).
    - The "OV-"/"AM-" names suggest the resort runs them; MesoWest's page didn't name the network (not confirmed). Nov 12 at 4:15pm: Palisades base 51.0°F, Belmont 44.3, Siberia 41.0; Alpine base 48.4, Roundhouse top 45.0, Ward 43.4.
    - Also near: `LIB13`/`LIB12` (Liberty utility weather stations in the valleys, 6,202/6,458 ft), `CF060` Hwy 89 at Rampart (Caltrans, wind only). Not needed.
  - **Snow depth:**
    - SNOTEL `784:CA:SNTL` "Palisades Tahoe" (formerly Squaw Valley G.C.; NWS id `SQWC1`, CDEC `SQV`), 8,010 ft, 1.7 mi W of the village, on the Palisades ski area near Belmont. Hourly depth, water content, temperature (and wind). 0" depth, 0.8" water content on Nov 12 (Siberia cam: snow on the upper slopes; Scope cam: patchy).
    - **Nothing on the Alpine ski area.** Ward Creek #3 `848:CA:SNTL` (6,750 ft, 2.2 mi S of the Alpine base, next valley south; depth in about 2/3 of hours). Tahoe City Cross `809` (6,760 ft, 4.6 mi), Truckee #2 `834` (6,500 ft, 7.7 mi) are regional.
    - CDEC (California's network) carries the same NRCS sensors under other ids; it adds nothing here.
  - **Forecast:**
    - The Sierra crest splits two NWS offices through the ski areas. `/points`: Palisades base → Reno `REV/28,94` (6,283 ft); Belmont, the SNOTEL → Sacramento `STO/89,87` (7,385 ft); Siberia → `STO/88,87` (8,599); Alpine base → `REV/27,93` (7,772 ft); Scott top → `REV/28,92` (7,379); Roundhouse top, Ward → `STO/89,85` (8,235).
    - The offices' grids overlap: `REV/27,94` is the same ground as `STO/89,87`. On Nov 12 their precipitation was identical and temperatures/snow levels close, but **snowfall differed** (one 6-hour period: Reno 1.8", Sacramento 0.4"). The site uses NWS `snowfallAmount`, so use the owning office's cell: Palisades `STO/89,87` (7,385 ft, mid 7,625), Alpine `REV/27,93` (7,772 ft, mid 7,736).
    - Reno's forecast discussion is the Tahoe one; the site reads AFDs from `nws.office`, so Palisades on Sacramento would need a separate AFD office setting (small code change).
    - Open-Meteo picks a cell per elevation, all within about 2.5 mi. Nov 12, 4:45pm: Palisades 50.1 / 43.7 / 38.2°F at 6,200 / 7,625 / 9,050 ft (stations: base 51.0, Belmont 44.3, SNOTEL 45.0); Alpine 47.2 / 43.1 / 39.9 at 6,835 / 7,736 / 8,637 (stations 48.4 / ~45 / Ward 43.4, half an hour earlier, at sunset).
  - **Cams:** seven resort cams, Ozolio live streams (embed `https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_<id>`). Each has a public poster still: `https://relay.ozolio.com/pub.api?cmd=poster&oid=EMB_<id>` (1920×1080 JPEG, 180–430 KB, CORS `*`, cached up to 15 min; the player's own pre-play image). Checked at sunset Nov 12, all live:
    - Palisades Base 6200' `ZIGI00000147` (the village plaza; no slopes in view), Palisades Scope 8200' `EIFC0000015B` (High Camp deck, Lake Tahoe view, patchy snow), Palisades Siberia `OBCE00000ECB` (upper mountain, Siberia bowl, snow-covered slope and a chair), Far East `EMST000001C4` (across the valley to the upper runs).
    - Alpine Peak `VPAY0000014C` (a base deck by chairlifts), Alpine Race `KIYV000003C2` (a grassy slope, snow guns running), Alpine Chalet `FPOI000010AB` (the Chalet, patchy snow).
    - No snow stake cam. Needs `img-src relay.ozolio.com` (and the player page opened in a new tab, `video`).
  - **Roads:** Caltrans cams "Hwy 89 at Olympic Valley" (2.0 mi from the village) and "Hwy 89 at Alpine Meadows" (at the Alpine Meadows Road junction), `https://cwwp2.dot.ca.gov/data/d3/cctv/image/<name>/<name>.jpg`, updated every minute (list: `cctvStatusD03.json`, CORS `*`). Caltrans' developer portal says "There is no charge for the use of this data" and offers it "for integration into your application"; its Conditions of Use treat site content as public domain unless marked (the page itself couldn't be read from here). Credit "Caltrans".
  - **Avalanche:** Sierra Avalanche Center, `sierraavalanchecenter.org/forecasts/avalanche/central-sierra-nevada`.
- **Mt. Spokane, WA: researched Nov 10 (9:30–10pm Pacific); built, not published** (see Handoff).
  - **Basics** (resort's Trail Maps page): summit 5,889 ft, base lodge 4,200 ft, 2,000 skiable vertical ft, 1,704 acres, 6 chairs, 53 runs, night skiing. A nonprofit resort inside Mount Spokane State Park.
    - **Season:** "Dec. 5: Projected Opening Day", from the resort's own post (October). Its conditions page reads "N/A" until it opens. Last season it opened Dec 27 and closed early, citing warm temperatures.
    - **Hours:** last season Wednesday–Saturday 9am–9pm, Sunday 9am–4pm, closed Monday–Tuesday.
    - Its pages send `X-Frame-Options: SAMEORIGIN`, so the lift board (on `/trail-maps`) can only be linked.
  - **Measured:**
    - **No station on the ski area.** NWS and MesoWest list nothing within 3 mi except one SNOTEL.
    - Quartz Peak SNOTEL `707:WA:SNTL` (4,710 ft, 3.1 mi SE of the summit, on a separate peak in the state park): hourly temperature, snow depth every few hours, water content. It also reaches the NWS feed as `QUPW1` (temperature only).
    - On Nov 10 at 9pm it read 43.3°F (the model at 4,711 ft: 42.7°F) and 0 in of depth, while water content still showed 0.6 in.
    - Last season its depth peaked at only 35 in (Mar 13), and snow first appeared Nov 26. Cross-check it against the resort's reported base once the resort opens.
    - **Owner decision (Nov 10): regional reference only** ("3 miles is a lil too much"). It's in `snotel`, not `stations` or `snowSensor`.
    - Ragged Mountain SNOTEL `1081:ID:SNTL` (4,210 ft, 5.7 mi SE, in Idaho) is regional only.
  - **Forecast:**
    - NWS Spokane `OTX`. Cell `152,101` holds the summit and averages 4,806 ft; `152,100` (4,144 ft) is just south. Zone WAZ037. It publishes snow level and visibility, and Spokane AFDs.
    - Open-Meteo near 47.918, -117.115 uses one grid cell (47.912, -117.100) for all elevations.
  - **Cams:** eight resort YouTube streams, in page order:
    - Snow stake at Lodge 2 `lBgqL-YwCcE`, Half Hitch Terrain Park `itPwz9u27K4`, view from Lodge 2 `0i8hMjxhnho`.
    - Top of Vista Cruiser, Chair 1 (summit) `r1N4CmHq0RA`; top of Northwood, Chair 6 `m1kzBdiTyFU`; top of Parkway Express, Chair 3 `KSIuO1ITLlU`; top of Hidden Treasure, Chair 4 `rQnOjOnHrpw`; Hourglass, Chair 1 `rvY2pHYzMlE`.
    - At 9:50pm all eight live stills were the resort's title cards (an old photo with a "Live Stream" label), unchanged over 90 seconds. The resort's own posts showed live views in October, so this is probably overnight. **Re-check in daylight.**
    - YouTube's watch pages redirect through `www.google.com`, which this sandbox can't reach.
  - **Avalanche:** no forecast zone appears to cover it. IPAC covers the Idaho Selkirks, Cabinets, Purcells and Silver Valley; NWAC stops at the Cascades. Not confirmed on an official zone map.
  - **Roads:** no road camera or sensor found for Mt. Spokane Park Drive. Checking WSDOT's camera list needs its access-coded API, so it wasn't done.
- **Mission Ridge, WA: researched Nov 11 (12:15–1am Pacific); built Nov 11 evening** (see Handoff). Owner decisions: Upper Wheeler as base-level measured depth (yes, Nov 11); Opening Day **Fri, Nov 27, 2026 (planned)**, from the resort's Operating Schedule page (screenshot from the owner, Nov 11): "Open – 2 Chairs Planned" Nov 27–29, "Open – 3 Chairs Planned" from Dec 4. Google showed Nov 29. `season.word: 'planned'` uses the resort's own word.
  - **Basics:** base 4,570 ft, summit 6,820 ft (the resort's Mountain Safety page), 2,250 vertical ft, 2,000 acres, 200" average snowfall, slopes face mainly northeast. Lifts: Chairs 1–4 (Chair 2 is the Wenatchee Express bubble), Ottobahn carpet, Pika Peak and 100 Laps rope tows. Night skiing exists. Base lodge about 47.292, -120.399. Mid-mountain would be the halfway elevation, 5,695 ft (the resort names no mid-mountain point; "Midway" is a place on the mountain, elevation not found).
  - **The resort's site (`www.missionridge.com`, WP Engine) blocks this sandbox with a Cloudflare "you have been blocked" page (HTTP 403), even though the host is allowed.** Don't get around it. Facts above came from search-engine copies of its pages. Lift status is on its `/webcams` page; it probably can only be linked (the block page sent `X-Frame-Options: SAMEORIGIN`; not confirmed for the real page).
    - **Opening Day 2026–27: Fri, Nov 27 (planned)**, per the resort's Operating Schedule page (the owner sent a screenshot on Nov 11, since this sandbox can't load it). Before that, searching found no announcement (no announcement found; one search summary said "Dec 6" from the season-pass page, probably left over from last season, when Dec 6 was a Saturday). Past openings: Dec 4, 2025 (then closed and reopened Dec 21 with Chair 1 only), Nov 23, 2024, Nov 25, 2023. The resort's Nov 2 report: snowmaking started Nov 1, "Upper Basin snow stake ... around 2 inches"; Oct 28: 1–2" at the base, about 5" in the Upper Basin.
  - **Measured:**
    - NWAC stations on the ski area, through the NWS feed, hourly (about 1–2 hours late, like Stevens): Summit `MSR67` (6,730 ft, 1.8 mi SW of the lodge; temperature, humidity, wind, gust, direction), Mid-Mountain `MSR52` (5,160 ft, 0.7 mi; temperature, humidity), Base `MSR46` (4,610 ft, 0.1 mi; temperature, humidity).
    - **The NWS feed drops the summit's wind in about half the hours and its gust in about a quarter**, while NWAC's own table (`nwac.us/weather/stations/mission-ridge`) has every hour. Where both have a value they match (Nov 10, 11pm: 31 mph SW, 220°). Gusts there ran 38–45 mph on Nov 10 with SW winds, so the summit sensor is exposed, not sheltered.
    - NWAC's table also shows Mid-Mountain precipitation, 24-hour snow and **snow depth (SnoHt, 5,160 ft)**, which the NWS feed doesn't carry. NWAC's data API isn't documented for public use, so it's link-only.
    - Cross-check Nov 10, 11pm: NWS feed 36.4 / 43.2 / 46.2°F (summit/mid/base) = NWAC table 36 / 43 / 46. The base read warmer than mid all evening, with rain and a warm front (Upper Wheeler jumped 3°F at the same hour).
    - **Upper Wheeler reliability, checked over last season (Nov 15, 2025 to Apr 15, 2026, hourly):** depth in 87% of hours, longest gap 24 h, no spike readings; water content nearly every hour. Same record as Willamette's Cascade Summit sensor (88%, 24 h). It tracks Trough (5,480 ft) closely (daily correlation 0.91; Grouse Camp 0.78) and rose with every storm the others saw (Mar 11–13, 2026: 8" to 26", while the resort reported 12" on the summit stake on Mar 12). Snow densities 20–48%, plausible. **It reads about 77% of Grouse Camp's depth** (1,000 ft lower) and held snow later in spring (11" on Apr 1 when Grouse Camp was bare), so it's a base-level, fairly sheltered reading: label it as the base, never as the mountain's depth.
    - Snow depth: Upper Wheeler SNOTEL `841:WA:SNTL` (4,330 ft, 1.4 mi E of the lodge, 240 ft below the base; hourly temperature and water content, depth hourly at times and every few hours at others). 0" on Nov 10; 0–1" on Oct 28 when the resort reported 1–2" at the base. Last season it peaked at 34" (Mar 13) and melted out Apr 18. It's the same distance as Willamette's Cascade Summit sensor, which feeds that summary.
    - Regional: Grouse Camp `507:WA:SNTL` (5,390 ft, 4.2 mi W; has wind), Trough `832:WA:SNTL` (5,480 ft, 6.4 mi SE), Blewett Pass `352:WA:SNTL` (4,240 ft, 13.7 mi NW).
    - Other nearby NWS ids are precipitation gauges or valley sites (PV1 `MCRW1` 4,543 ft 2.5 mi, Wenatchee 600–2,000 ft). Leave them out.
  - **Forecast:**
    - NWS **Spokane** `OTX`, zone WAZ047. Cell `42,89` (averages 6,257 ft) holds both the Mid-Mountain and Summit stations; the base station falls in `43,89` (5,978 ft). Both publish snow level and visibility. The ridge-top county line puts points just south in Pendleton's area (`PDT`), so use the station coordinates, not a guessed summit point.
    - Open-Meteo at 47.292, -120.399: mid and summit share the cell at 47.278, -120.407; the base elevation picks the cell at 47.285, -120.369 (about 1.5 mi E, down the same side). On Nov 11 at 12:30am it read 43.6 / 39.2 / 35.2°F at 4,570 / 5,696 / 6,821 ft, 1–3°F below the stations.
  - **Cams:** the resort lists three, all YouTube live streams on its channel "Mission Ridge (Ski Area)" (`@MissionRidgeResort`): Sunspot `28Vhz4mcM64`, Midway `AlJPPPl1yIw`, Mimi `TERghSgEi_o`. At 12:40am all three were live night views (Midway: a chair's bottom terminal, bare wet ground), not title cards. No on-image stamp. **No snow stake cam** (the Upper Basin stake is read by staff). Check what each shows in daylight before labeling.
  - **Avalanche:** NWAC **East Slopes Central** (`nwac.us/forecasts/avalanche/east-slopes-central`); its page uses the Mission Ridge stations as its weather data.
  - **Roads:** Mission Ridge Road is a county road with no road camera or sensor found. The nearest WSDOT cams and sensor are at Blewett Pass (US 97, about 9 mi, a different pass); leave them out.
  - **Owner decisions needed:** (1) Upper Wheeler as measured snow depth (feeds the summary) or regional only; (2) Opening Day, since the resort's site can't be read from here.
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

## Data audit (Nov 10, 2026, 11pm Pacific)

The owner asked for every number to be double-checked ("we cant be having shoddy numbers").

- **Method:** for each mountain, the page was loaded and every raw response it received was saved. A separate program, written from the definitions rather than the site's code, recomputed every displayed number and compared it with the page's:
  - hourly forecast rows and unit conversions
  - station readings (latest, 24-hour high and low, gusts, freshness)
  - SNOTEL depth, change and water content
  - elevation temperatures in the 9am–4pm window, freezing level, and the rain/snow split
  - fresh snow over 24 and 72 hours
  - the ski-day summary (gusts, wind direction, cloud, visibility, wind chill, snow to 4pm)
  - 82-run ranges, chances and the 4 models per ski day
  - the next-7-days tile
  - the preseason chart (since Oct 1, last 7 days, coming)
  - model Right now, and ECCC daily reports

  The scripts are in the session scratchpad (`audit/capture.js`, `audit.py`, `meta.py`). **Re-run them after any change to how numbers are computed.**
- **Config checked against the sources' records:** every station, SNOTEL and ECCC elevation matches its owner's record exactly. Each NWS cell's height matches its comment.
- **Fixed:**
  1. **Sun Peaks' time zone.** British Columbia stopped changing its clocks on Nov 1, 2026 and stays on UTC−7 (tz database 2026e; Open-Meteo and the resort's own page times agree). Browsers with older time-zone data still put `America/Vancouver` on UTC−8, which shifted every Sun Peaks time and its 9am–4pm window by an hour. Sun Peaks now uses `Etc/GMT+7` (that's UTC−7). **If BC ever changes its clocks again, revisit this.**
  2. **Open-Meteo hours are stamped at their end** (the 4pm value is 3–4pm); the NWS stamps the start.
     - The ski day's 4pm-to-4pm snow (82 runs and 4 models) now counts the hours stamped after 16:00 the day before, up to 16:00 (`t > ws && t <= we`).
     - Ensemble gusts and the week's model fallback use `inSkiEnd` (stamps 10:00–16:00).
     - The NWS snow level applied to Open-Meteo precipitation now uses the hour the precipitation fell in.
  3. **Preseason "since Oct 1"** now starts at the mountain's own midnight (from its local time stamps), not the viewer's.
  4. **Willamette Pass Opening Day:** Dec 11 (scheduled), replacing "TBA".
  5. **Regional snow-station distances** are all measured from each mountain's point (`lat`/`lon`), and the table column says "Miles from ski area". A few moved by 0.1–0.5 mi.
- **Checked and left alone:**
  - Mt. Spokane's site point falls in NWS cell 152,100 (4,144 ft, base height). The config uses 152,101 (4,806 ft, holds the summit) on purpose, as nearer mid-mountain.
  - The date labels that use the viewer's clock (`new Date(date + 'T12:00')`) only name a calendar day, which is right in any time zone.
  - For hours before Nov 1, Open-Meteo responses carry a single UTC offset, so past hours from before the clock change are shifted an hour. That only moves Oct snow between neighboring hours, never the totals.

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
- **Link preview:** `preview.png` (1200×630) and `icon.svg`/`icon-180.png` are referenced by the Open Graph tags in `index.html`, which point at `https://ra-dar-alpha.vercel.app/`.
  - **Since Nov 11 the preview is deliberately general** (owner: "more general and less informative... just look pretty"): a dawn mountain landscape with alpenglow, stars and light snow, and only "Ra-Dar / SKI WEATHER". No mountain names, feature lists or live numbers, so it never goes stale when mountains are added. The link title is "Ra-Dar · Ski Weather" and the descriptions name no mountains, for the same reason.
  - It's drawn as an SVG by a script and rendered with Playwright (session scratchpad `preview/make.py`, `shot.js`); redraw it the same way rather than editing the PNG.
  - The image address carries `?v=3`. Raise the number whenever the picture changes, so apps fetch the new one instead of a cached copy. Old shares may still show the old card; adding `?v=2` (or higher) to a shared page link forces a fresh one too. (The very first version of the site showed London, and some apps cached that.)
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
