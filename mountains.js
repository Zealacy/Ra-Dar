// Mountain configuration: everything that differs between mountains lives here.
// Elevations in feet, distances in miles. The page layout is the same for every mountain;
// where a mountain lacks something (a snow stake cam, an upper-mountain station, an embeddable
// lift board) the same slot shows its nearest equivalent or says plainly that there is none.
//
// Adding a mountain: verify every station, camera and elevation first (see CLAUDE.md), then add
// a block. The key is what goes in the address (?mtn=key) and the order here is the order of
// the switcher at the top of the page.
//
// Outside the US (no National Weather Service), leave out `nws` and give `forecast` instead: a
// national weather model read through Open-Meteo for the hourly forecast. With no `nws` there is
// no written forecast or forecast discussion either; `discussion` says so and links the nearest
// equivalent. `nowModel: true` lets "Right now" show labeled model estimates where no public
// station measures the mountain (owner's choice; never where a usable station exists).
// `snowDaily` reads Environment Canada's daily climate stations for measured snow, with dates.
// A cam with `video` (a player page) shows its still and opens that page in a new tab for live video.
// `snowStake` can be a still (`src`) or a YouTube stream (`youtube`), like any cam.
// `season.projected: true` says "projected" instead of "scheduled" for an Opening Day the resort calls projected.

const MOUNTAINS = {
  bachelor: {
    name: 'Mt. Bachelor',
    region: 'Central Oregon Cascades · Oregon, USA',
    lat: 43.9792,
    lon: -121.6886,
    timezone: 'America/Los_Angeles',
    zones: [
      { key: 'base', name: 'West Village base', short: 'West Village', ft: 6300 },
      { key: 'mid', name: 'Pine Marten (mid)', short: 'Pine Marten', ft: 7800 },
      { key: 'summit', name: 'Summit', short: 'Summit', ft: 9065 },
    ],
    // National Weather Service forecast grid cell covering the ski area.
    nws: { office: 'PDT', officeName: 'Pendleton', x: 23, y: 40 },
    // Live weather stations, read through the National Weather Service observation network
    // (api.weather.gov). Only these feed "Right now". A station that isn't on the ski area
    // gets `offSite`, which is shown next to its name everywhere it appears.
    stations: [
      // The nearest public station at upper-mountain height; Mt. Bachelor's own lift-top sensors are image-only.
      { id: 'MOONM', name: 'Moon Mountain', operator: 'Central Oregon Avalanche Center', ft: 7450, where: 'about 5 mi N of the summit, near the Cascade crest', offSite: '5 mi N of the summit, not at the ski area' },
      // `road` names the road for the briefing's road line.
      { id: 'OD131', name: 'Century Dr at the ski area', operator: 'Oregon DOT', ft: 6424, where: 'Century Drive at milepost 21, by the West Village entrance', road: 'Century Dr' },
      { id: 'OSUSP', name: 'West Village snow pillow', operator: 'Oregon State University', ft: 6375, where: 'West Village base area' },
    ],
    // Readings older than this are treated as offline and ignored.
    stationMaxAgeHours: 3,
    // Elevation zone used for the modeled new-snow number in the ski-day summary.
    snowZone: 'mid',
    // Lifts named in the wind line when forecast gusts reach hold thresholds.
    windHoldLifts: 'Summit and Northwest',
    // NRCS SNOTEL stations. Reputable, but lower and 11-18 miles away in other
    // drainages, so they are shown only as a regional reference and never feed the summary.
    snotel: [
      { id: '815:OR:SNTL', name: 'Three Creeks Meadow', ft: 5680, mi: 11.6 },
      { id: '545:OR:SNTL', name: 'Irish Taylor', ft: 5540, mi: 17.7 },
      { id: '619:OR:SNTL', name: 'McKenzie', ft: 4770, mi: 18.4 },
    ],
    // Resort-published graphic with measured temp/wind at lift-top weather stations.
    stationGraphic: 'https://api.mtbachelor.com/api/v1/cams/mtn/weather-server-image',
    snowStake: {
      name: 'West Village snow stake',
      ft: 6300,
      src: 'https://api.mtbachelor.com/api/v1/cams/mtn/14',
      note: 'Stake is in inches. It is cleared after lifts close, so the reading shows new snow since then.',
      caption: 'Measured: snow stake cam, West Village',
    },
    // Ordered by how useful each view is for judging ski conditions, highest camera first.
    // Locations are checked against each camera's own on-image stamp (verified 2026-11-07):
    // no camera is at the summit; the highest ones are at the top of Outback (mid-mountain).
    cams: [
      { name: 'Tumalo Mtn & top of Pine Marten', why: 'Mid-mountain camera at the top of Outback: upper-mountain visibility and the cloud deck', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/12' },
      { name: 'Pine Marten Lodge', why: 'Mid-mountain camera at the top of Outback: snow surface and visibility around the lodge', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/9' },
      { name: 'Outback lift line', why: 'Mid-mountain camera at the top of Outback: tree runs and the lift line', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/11' },
      { name: 'The Cone (from West Village)', why: 'Lower-mountain camera at West Village looking at The Cone', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/3' },
      { name: 'Sunrise base', why: 'Lower mountain: snow and conditions at Sunrise Lodge', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/5' },
      { name: 'West Village base & parking', why: 'Base snow, crowds and how full the lots are', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/13' },
      { name: 'Base of Pine Marten lift', why: 'West Village base area and the Pine Marten lift line', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/1' },
      { name: 'Nordic Center', why: 'Nordic trail conditions', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/16' },
    ],
    // Season status, from the official Lift & Trail Status page (checked 2026-11-07):
    // "Closed Until Winter. Mt. Bachelor will re-open for winter operations on Opening Day,
    // scheduled for December 4, 2026." Update this when the resort announces changes.
    season: { openingDay: '2026-12-04', checked: '2026-11-07' },
    liftStatusUrl: 'https://www.mtbachelor.com/the-mountain/lift-trail-report/',
    // The resort allows its board to be shown inside other sites (no frame-blocking headers).
    liftStatusEmbed: true,
    // The lift list (legend: Open / Closed / On Hold / Expected) starts about 1,130-1,150 px down the
    // official page (measured 2026-11-07, desktop and phone). The embed is shifted up by this much,
    // leaving slack above the list so a slightly shorter header never cuts it off.
    liftStatusOffsetPx: 1040,
    // Official lift stats (mtbachelor.com > Mountain Stats): name, type, length, vertical.
    // topFt only where an official figure exists or can be derived from official figures.
    // exposure: how wind-exposed the lift top is ('high' = alpine, 'mid' = mid-mountain, 'low' = base area).
    // There is no public live lift-status feed, so the site estimates wind-hold risk from these tiers.
    lifts: [
      { name: 'Summit Express', type: 'High-speed quad', lengthFt: 4783, vertFt: 1725, topFt: 9065, exposure: 'high', topNote: 'official top elevation' },
      { name: 'Northwest Express', type: 'High-speed quad', lengthFt: 8377, vertFt: 2365, topFt: 8065, exposure: 'high', topNote: 'official lowest elevation 5,700 ft + vertical' },
      { name: 'Cloudchaser', type: 'High-speed quad', lengthFt: 6576, vertFt: 1448, topFt: 7700, exposure: 'mid', topNote: 'resort lift-top station' },
      { name: 'Pine Marten Express', type: 'High-speed quad', lengthFt: 4779, vertFt: 1360, topFt: 7800, exposure: 'mid', topNote: 'resort Pine Marten Lodge station' },
      { name: 'Skyliner Express', type: 'High-speed six-pack', lengthFt: 5878, vertFt: 1293, topFt: null, exposure: 'mid' },
      { name: 'Outback Express', type: 'High-speed quad', lengthFt: 6991, vertFt: 1780, topFt: null, exposure: 'mid' },
      { name: 'Sunrise Express', type: 'High-speed quad', lengthFt: 3732, vertFt: 808, topFt: 7300, exposure: 'mid', topNote: 'resort lift-top station' },
      { name: 'Rainbow', type: 'Triple chair', lengthFt: 5512, vertFt: 1215, topFt: null, exposure: 'mid' },
      { name: 'Red Chair', type: 'Triple chair', lengthFt: 4042, vertFt: 1158, topFt: null, exposure: 'mid' },
      { name: 'Little Pine', type: 'High-speed quad', lengthFt: 1888, vertFt: 257, topFt: null, exposure: 'low' },
      { name: 'Alpenglow', type: 'Triple chair', lengthFt: 1194, vertFt: 171, topFt: null, exposure: 'low' },
      { name: 'Early Riser', type: 'Quad chair', lengthFt: 647, vertFt: 70, topFt: null, exposure: 'low' },
    ],
    // Feature switches. The per-lift wind-hold estimate is shelved (owner found it confusing);
    // set to true to bring back the summary card and the estimate in the Lifts tab.
    features: { liftEstimate: false },
    // Rule-of-thumb forecast gusts (mph) where wind holds become possible / likely, by exposure.
    liftWind: { high: [30, 40], mid: [40, 50], low: [50, 60] },
    links: [
      { label: 'Official mountain report', url: 'https://www.mtbachelor.com/the-mountain/mountain-report/' },
      { label: 'Official lift & trail status', url: 'https://www.mtbachelor.com/the-mountain/lift-trail-report/' },
      { label: 'Official webcams', url: 'https://www.mtbachelor.com/the-mountain/webcams/' },
      { label: 'Central Oregon Avalanche Center', url: 'https://www.coavalanche.org/' },
      { label: 'Three Creeks Meadow SNOTEL', url: 'https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=815' },
      { label: 'ODOT TripCheck (roads)', url: 'https://www.tripcheck.com/' },
    ],
    // Place names worth highlighting in the forecaster notes (regular-expression fragments).
    afdWords: ['cascades?', 'cascade crest', 'central oregon', 'deschutes', 'bend', 'mt\\.? bachelor', 'bachelor'],
    // Wording that differs by mountain.
    text: {
      liveLead: 'Live readings from public weather stations at the ski area, plus the nearest one at upper-mountain height where the ski area has none (marked "not at the ski area"), and the resort\'s own lift-top stations.',
      stationsNote: 'Stations at the ski area, plus the nearest public station at upper-mountain height where the ski area has none (marked "not at the ski area"). Read through the National Weather Service network. Offline stations are ignored.',
      snowDepthNote: 'No snow-depth sensor on the mountain publishes data this site can use; the stake cam and the resort\'s West Village sensor (Live readings tab) show the ground.',
      stationGraphicNote: 'Published by the resort as an image, so it\'s shown for reference and not used in the calculations. Check the date on each box: some sensors stop updating in the off-season, and the West Village snow depth reading isn\'t reliable early in the season.',
      regionalWhy: 'in different drainages, so they often get far less snow than the ski area',
      camsSource: 'Mt. Bachelor',
      camsNote: 'Official resort cameras. The stake is the best on-mountain check of new snow.',
      footer: 'Webcams and station graphic © Mt. Bachelor. Official sources: the Mt. Bachelor mountain report and the Central Oregon Avalanche Center forecast.',
    },
  },

  willamette: {
    name: 'Willamette Pass',
    region: 'Oregon Cascades, Highway 58 · Oregon, USA',
    // A point on the slope between the base lodge and the Eagle Peak summit.
    lat: 43.604,
    lon: -122.026,
    timezone: 'America/Los_Angeles',
    // Base and summit are the resort's official figures (About the Mountain page). The resort
    // names no mid-mountain landmark, so "mid" is simply the halfway elevation.
    zones: [
      { key: 'base', name: 'Base area', short: 'Base', ft: 5120 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 5900 },
      { key: 'summit', name: 'Eagle Peak summit', short: 'Summit', ft: 6683 },
    ],
    // National Weather Service Medford. This grid cell averages 5,538 ft and covers the ski area
    // from base to summit; it is the same point the resort's own forecast link uses.
    // Medford publishes no visibility forecast for it, so visibility shows as unavailable.
    nws: { office: 'MFR', officeName: 'Medford', x: 145, y: 125 },
    // The only live weather station at the ski area is Oregon DOT's road station on Highway 58
    // at the pass, 0.3 mi from the base lodge. No public station exists on the upper mountain
    // (checked on the NWS and MesoWest networks, 2026-11-08), so upper-mountain values are forecasts.
    stations: [
      { id: 'ODT03', name: 'OR-58 at Willamette Pass', operator: 'Oregon DOT', ft: 5121, where: 'Highway 58 at the pass (milepost 62), 0.3 mi from the base lodge', road: 'OR-58 at the pass', sheltered: 'road level, sheltered by trees' },
    ],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    // Measured snow on the ground: the federal SNOTEL station at the pass, at base elevation.
    // Cross-checked 2026-11-08 and 11-09: it read 0" while the resort reported a 0" base depth and
    // its base cam showed bare ground. Read hourly from the NRCS (same service as `snotel` below).
    snowSensor: { id: '388:OR:SNTL', name: 'Cascade Summit', operator: 'USDA NRCS SNOTEL', ft: 5100, mi: 1.4, where: '1.4 mi W of the base area, at base elevation', maxAgeHours: 6 },
    // Regional reference only (collapsed in Live readings); never feeds the summary.
    snotel: [
      { id: '729:OR:SNTL', name: 'Salt Creek Falls', ft: 4220, mi: 4.2 },
      { id: '660:OR:SNTL', name: 'New Crescent Lake', ft: 4910, mi: 6.7 },
      { id: '801:OR:SNTL', name: 'Summit Lake', ft: 5610, mi: 11.6 },
    ],
    // There is no snow stake cam and no resort station graphic here.
    // Cameras (verified 2026-11-09, 2:40pm):
    //  - The resort streams its cams on YouTube. `youtube` shows the stream's live still (YouTube
    //    refreshes it about every 5 minutes) and loads YouTube's own player when tapped.
    //  - The resort's second stream, "Eagle Peak" (YouTube id uav7cBNVv0k), is left out: its still was
    //    black and byte-identical at night on 11-08 and in daylight on 11-09. Re-check before adding.
    //  - Oregon DOT's TripCheck road cameras at the pass are small stills with their own stamp.
    //    ODOT allows their use with credit (TripCheck FAQ).
    // The first camera is the one shown large at the top in preseason.
    cams: [
      { name: 'Base Area', why: 'Resort camera at the base, looking up the lift line: snow on the ground and visibility at the bottom of the mountain. Tap for live video (YouTube).', youtube: 'sNVA6oC7vcM', caption: 'Base Area cam (resort). This resort has no snow stake cam.' },
      { name: 'OR-58 at the pass, looking west', why: 'Highway 58 at Willamette Pass (5,090 ft), 0.3 mi from the base lodge: what is falling at base level, and the road. Camera courtesy of ODOT.', src: 'https://tripcheck.com/roadcams/cams/Willamette%20Pass_pid3351.JPG', small: true },
      { name: 'OR-58 at the pass, looking east', why: 'Highway 58 at Willamette Pass (5,090 ft), looking toward the ski area entrance. Camera courtesy of ODOT.', src: 'https://tripcheck.com/roadcams/cams/WillamettePass_pid658.jpg', small: true },
    ],
    // Season status, from the resort's site (checked 2026-11-09): "Willamette Pass is currently
    // closed" and "Opening Soon for 2026/2027!" with no date. `closed: true` keeps preseason mode on
    // until a date is set here. Re-check the resort's Hours of Operation page when working on the site.
    season: { openingDay: null, closed: true, checked: '2026-11-09' },
    liftStatusUrl: 'https://www.willamettepass.ski/weather-conditions-webcams/lifts-trails/',
    // The resort's pages send "X-Frame-Options: DENY", so the board can only be linked, not embedded.
    liftStatusEmbed: false,
    features: { liftEstimate: false },
    links: [
      { label: 'Official conditions & snow report', url: 'https://www.willamettepass.ski/weather-conditions-webcams/' },
      { label: 'Official lifts & trails', url: 'https://www.willamettepass.ski/weather-conditions-webcams/lifts-trails/' },
      { label: 'Official webcams', url: 'https://www.willamettepass.ski/weather-conditions-webcams/webcams/' },
      { label: 'Cascade Summit SNOTEL', url: 'https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=388' },
      { label: 'ODOT TripCheck (roads)', url: 'https://www.tripcheck.com/' },
    ],
    afdWords: ['cascades?', 'cascade crest', 'willamette pass', 'highway 58', 'hwy 58', 'crater lake', 'diamond lake', 'crescent lake', 'chemult'],
    text: {
      liveLead: 'Live readings from the two public stations at the ski area: Oregon DOT\'s weather station on Highway 58 at the pass, and the federal snow station at Cascade Summit. No public station exists on the upper mountain, so everything above the base is a forecast.',
      stationsNote: 'Oregon DOT\'s road weather station at the pass, 0.3 mi from the base lodge. Its wind is sheltered at road level. No public station exists on the upper mountain. Read through the National Weather Service network. Offline stations are ignored.',
      snowDepthNote: 'Measured snow depth comes from the Cascade Summit snow station at base level (5,100 ft); nothing measures it higher up.',
      regionalWhy: 'at different elevations and exposures, so their snow differs from the ski area\'s',
      camsSource: 'Willamette Pass Resort (YouTube live); Oregon DOT TripCheck',
      camsNote: 'The resort cam shows the stream\'s live still, refreshed about every 5 minutes; tap it for live video in YouTube\'s player. Road cameras courtesy of ODOT. This resort has no snow stake cam.',
      footer: 'Resort cam © Willamette Pass Resort, via YouTube. Road cameras courtesy of ODOT. Official source: the Willamette Pass conditions page.',
    },
  },

  stevens: {
    name: 'Stevens Pass',
    region: 'Central Cascades, US Highway 2 · Washington, USA',
    // A point on the front side between the base lodge and Cowboy Mountain. At this point Open-Meteo
    // uses one model grid cell for all three elevations (checked 2026-11-10).
    lat: 47.7405,
    lon: -121.095,
    timezone: 'America/Los_Angeles',
    // Base and top are the resort's official figures (Mountain Info & Stats page, checked 2026-11-10):
    // base 4,061 ft, highest elevation 5,845 ft. The resort names no mid-mountain elevation, so "mid"
    // is the halfway elevation.
    zones: [
      { key: 'base', name: 'Base area', short: 'Base', ft: 4061 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 4950 },
      { key: 'summit', name: 'Top of the ski area', short: 'Summit', ft: 5845 },
    ],
    // National Weather Service Seattle. This grid cell holds the base area and the lower front side
    // and averages 4,879 ft, close to mid-mountain. The next cell south (165,66; 5,167 ft) holds the
    // upper mountain; on 2026-11-10 the two differed by 2 mph in gusts and under 3°F.
    nws: { office: 'SEW', officeName: 'Seattle', x: 165, y: 67 },
    // Northwest Avalanche Center stations on the ski area, read through the National Weather Service
    // network (hourly; reports arrive about an hour late). Checked 2026-11-10 against each other, the
    // SNOTEL station beside Schmidt Haus (39.3 vs 38.8°F) and the model at each elevation (within 1°F).
    // Left out: Skyline (STS52, 5,250 ft) read 3-4°F warmer than Tye Mill at the same height and than
    // stations 460 ft lower, in steady rain, and jumped about 3°F hour to hour; re-check before adding.
    // Grace Lakes (STS48, temperature) and Old Faithful (STS46, wind only) sit just west of the lifts
    // at heights the three below already cover.
    stations: [
      { id: 'STS54', name: 'Tye Mill', operator: 'Northwest Avalanche Center', ft: 5180, where: 'upper mountain, about 0.9 mi S of the base lodge' },
      { id: 'STB48', name: 'Brooks', operator: 'Northwest Avalanche Center', ft: 4800, where: 'mid-mountain, about 1 mi WSW of the base lodge' },
      { id: 'STS40', name: 'Schmidt Haus', operator: 'Northwest Avalanche Center', ft: 3950, where: 'base area, at the pass' },
    ],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    // Measured snow on the ground: the federal SNOTEL station at the pass, 0.2 mi from the base lodge.
    // Cross-checked 2026-11-10: it read 0" while the resort's base cams showed bare ground and
    // Washington DOT reported the road "bare and wet". It reports depth about every other hour.
    snowSensor: { id: '791:WA:SNTL', name: 'Stevens Pass', operator: 'USDA NRCS SNOTEL', ft: 3940, mi: 0.2, where: 'at the pass, 0.2 mi from the base lodge, at base elevation', maxAgeHours: 6 },
    // Regional reference only (collapsed in Live readings); never feeds the summary.
    snotel: [
      { id: '1338:WA:SNTL', name: 'Icicle Creek', ft: 4550, mi: 14.2 },
      { id: '478:WA:SNTL', name: 'Fish Lake', ft: 3440, mi: 14.5 },
      { id: '912:WA:SNTL', name: 'Skookum Creek', ft: 3320, mi: 24.6 },
    ],
    // The resort's cams are live video on Brownrice's player; each has a public snapshot image
    // (the player page's own preview image), refreshed continuously. `video` is the player page,
    // opened in a new tab. Checked 2026-11-10, 8:30pm: all five were live. The images carry no time
    // stamp, and the resort doesn't say where on the mountain the stake stands or when its board is
    // cleared. The stake is numbered in inches (1 to 24).
    snowStake: {
      name: 'Snow stake',
      src: 'https://player.brownrice.com/snapshot/stevenspasssnowstake',
      video: 'https://player.brownrice.com/embed/stevenspasssnowstake',
      note: 'Resort snow stake, numbered in inches. The resort doesn\'t say where on the mountain it stands or when the board is cleared.',
      caption: 'Measured: snow stake cam (resort)',
    },
    // Skyline and Jupiter were dark and rain-smeared when checked (night), so they carry the resort's
    // own names only: RE-CHECK IN DAYLIGHT and describe what each picture shows. The two base cams
    // were checked against their pictures. Washington DOT's cams carry their own name and time stamp.
    cams: [
      { name: 'Skyline (resort cam)', why: 'Resort camera named for the Skyline Express lift. Tap for live video on the resort\'s player.', src: 'https://player.brownrice.com/snapshot/stevenspassskyline', video: 'https://player.brownrice.com/embed/stevenspassskyline' },
      { name: 'Jupiter (resort cam)', why: 'Resort camera named for the Jupiter Express lift. Tap for live video on the resort\'s player.', src: 'https://player.brownrice.com/snapshot/stevenspassjupiter', video: 'https://player.brownrice.com/embed/stevenspassjupiter' },
      { name: 'Ski & Snowboard School (base)', why: 'Resort camera at the base, looking at the bottom of a chairlift and the lower slope: snow on the ground at the bottom of the mountain.', src: 'https://player.brownrice.com/snapshot/stevenspassschool', video: 'https://player.brownrice.com/embed/stevenspassschool' },
      { name: 'Courtyard (base area)', why: 'Resort camera over the base-area courtyard and lodges: what is falling at base level.', src: 'https://player.brownrice.com/snapshot/stevenspasscourtyard', video: 'https://player.brownrice.com/embed/stevenspasscourtyard' },
      { name: 'US 2 at the summit, east side', why: 'Highway 2 at Stevens Pass (4,061 ft), by the ski area: the road and what is falling at the pass. © WSDOT.', src: 'https://images.wsdot.wa.gov/nc/002vc06458.jpg', small: true },
      { name: 'US 2 at the summit, west side', why: 'Highway 2 just west of the Stevens Pass summit: the road on the west approach. © WSDOT.', src: 'https://images.wsdot.wa.gov/nc/002vc06430.jpg', small: true },
    ],
    // Season status, from the resort's Hours of Operation page (checked 2026-11-10): "Winter 2026/27
    // Hours of Operation: Skiing & Riding TBD". `closed: true` keeps preseason mode on until a date
    // is set here.
    season: { openingDay: null, closed: true, checked: '2026-11-10' },
    liftStatusUrl: 'https://www.stevenspass.com/the-mountain/mountain-conditions/lift-and-terrain-status.aspx',
    // The resort's pages send "X-Frame-Options: SAMEORIGIN", so the board can only be linked.
    liftStatusEmbed: false,
    features: { liftEstimate: false },
    links: [
      { label: 'Official weather report', url: 'https://www.stevenspass.com/the-mountain/mountain-conditions/weather-report.aspx' },
      { label: 'Official lift & terrain status', url: 'https://www.stevenspass.com/the-mountain/mountain-conditions/lift-and-terrain-status.aspx' },
      { label: 'Official mountain cams', url: 'https://www.stevenspass.com/the-mountain/mountain-conditions/mountain-cams.aspx' },
      { label: 'Northwest Avalanche Center: Stevens Pass forecast', url: 'https://nwac.us/forecasts/avalanche/stevens-pass' },
      { label: 'Northwest Avalanche Center mountain weather', url: 'https://nwac.us/weather/forecast' },
      { label: 'Stevens Pass SNOTEL', url: 'https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=791' },
      { label: 'WSDOT Stevens Pass US 2 (roads)', url: 'https://wsdot.com/travel/real-time/mountainpasses/stevens' },
    ],
    afdWords: ['cascades?', 'cascade crest', 'stevens pass', 'stevens', 'snoqualmie', 'passes', 'highway 2', 'us 2', 'skykomish', 'convergence zone'],
    text: {
      liveLead: 'Live readings from the Northwest Avalanche Center\'s weather stations on the ski area (upper mountain, mid-mountain and base), and the federal snow station at the pass.',
      stationsNote: 'Northwest Avalanche Center stations on the ski area, reporting hourly; reports arrive about an hour late. Read through the National Weather Service network. Offline stations are ignored.',
      snowDepthNote: 'Measured snow depth comes from the Stevens Pass snow station at the pass (3,940 ft); nothing measures it higher up. The resort\'s snow stake cam shows new snow.',
      regionalWhy: 'at lower or drier sites away from the pass, so their snow differs from the ski area\'s',
      camsSource: 'Stevens Pass (Brownrice player snapshots); Washington State DOT',
      camsNote: 'Resort cams show a current snapshot; tap for live video on the resort\'s player. Road cameras © WSDOT. The stake is the best on-mountain check of new snow.',
      footer: 'Resort cams © Stevens Pass, via Brownrice. Road cameras © WSDOT. Official sources: the Stevens Pass weather report and the Northwest Avalanche Center forecast.',
    },
  },

  spokane: {
    name: 'Mt. Spokane',
    region: 'Selkirk Mountains, Mount Spokane State Park · Washington, USA',
    // A point on the ski area between the base lodge and the summit. Open-Meteo uses one grid cell
    // (47.912, -117.100) for all three elevations here (checked 2026-11-10).
    lat: 47.918,
    lon: -117.115,
    timezone: 'America/Los_Angeles',
    // The resort's official figures (Trail Maps page, checked 2026-11-10): summit 5,889 ft, base lodge
    // 4,200 ft. It names no mid-mountain elevation, so "mid" is the halfway elevation.
    zones: [
      { key: 'base', name: 'Base lodge', short: 'Base', ft: 4200 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 5045 },
      { key: 'summit', name: 'Summit (top of Chair 1)', short: 'Summit', ft: 5889 },
    ],
    // National Weather Service Spokane. This cell holds the summit and averages 4,806 ft; the cell just
    // south (152,100) averages 4,144 ft. It publishes snow level and visibility.
    nws: { office: 'OTX', officeName: 'Spokane', x: 152, y: 101 },
    // No public weather station on the ski area (checked on the NWS and MesoWest networks, 2026-11-10).
    // The nearest, the Quartz Peak SNOTEL, is 3.1 mi SE on a separate peak: the owner chose (2026-11-10)
    // to show it only as a regional reference, not in "Right now".
    stations: [],
    stationMaxAgeHours: 3,
    // Owner decision (2026-11-10): "if the data is sufficiently accurate include it". Checked the same day over
    // 7 days, hour by hour, at the nearby snow stations: the model missed by 1.7°F on average at Quartz Peak
    // (84% of hours within 3°F) and 2.3°F at Ragged Mountain, as good as at Stevens Pass's on-mountain station
    // (2.4°F). So "Right now" shows labeled model estimates, as at Sun Peaks.
    nowModel: true,
    snowZone: 'mid',
    windHoldLifts: 'Upper-mountain',
    // Regional reference only (collapsed in Live readings); never feeds the summary.
    snotel: [
      { id: '707:WA:SNTL', name: 'Quartz Peak', ft: 4710, mi: 3.1 },
      { id: '1081:ID:SNTL', name: 'Ragged Mountain', ft: 4210, mi: 5.7 },
    ],
    // The resort streams its cams on YouTube (as Willamette Pass does). Captions are the resort's own
    // (webcams page, 2026-11-10). At 9:50pm every live still was the resort's title card (an old photo
    // with a "Live Stream" label), probably an overnight placeholder: RE-CHECK IN DAYLIGHT that each
    // picture matches its caption before publishing.
    snowStake: {
      name: 'Snow stake (Lodge 2)',
      youtube: 'lBgqL-YwCcE',
      note: 'Resort snow stake at Lodge 2, numbered in inches. Tap for live video (YouTube).',
      caption: 'Measured: snow stake cam, Lodge 2 (resort)',
    },
    cams: [
      { name: 'Top of Vista Cruiser, Chair 1 (summit)', why: 'Resort camera at the top of Chair 1, the summit: upper-mountain snow and visibility. Tap for live video (YouTube).', youtube: 'r1N4CmHq0RA' },
      { name: 'Top of Northwood, Chair 6', why: 'Resort camera at the top of Chair 6, on the back side. Tap for live video (YouTube).', youtube: 'm1kzBdiTyFU' },
      { name: 'Top of Parkway Express, Chair 3', why: 'Resort camera at the top of Chair 3. Tap for live video (YouTube).', youtube: 'KSIuO1ITLlU' },
      { name: 'Top of Hidden Treasure, Chair 4', why: 'Resort camera at the top of Chair 4. Tap for live video (YouTube).', youtube: 'rQnOjOnHrpw' },
      { name: 'Hourglass (Chair 1)', why: 'Resort camera on the Hourglass run, on Chair 1. Tap for live video (YouTube).', youtube: 'rvY2pHYzMlE' },
      { name: 'View from Lodge 2', why: 'Resort camera at Lodge 2, by the base: snow at the bottom of the mountain. Tap for live video (YouTube).', youtube: '0i8hMjxhnho' },
      { name: 'Half Hitch Terrain Park', why: 'Resort camera at the top of the Half Hitch terrain park. Tap for live video (YouTube).', youtube: 'itPwz9u27K4' },
    ],
    // From the resort's own post (October 2026): "Dec. 5: Projected Opening Day". `projected` makes the
    // page say "projected", not "scheduled". Its conditions page reads "N/A" until it opens.
    season: { openingDay: '2026-12-05', projected: true, checked: '2026-11-10' },
    liftStatusUrl: 'https://www.mtspokane.com/trail-maps',
    // The resort's pages send "X-Frame-Options: SAMEORIGIN", so the board can only be linked.
    liftStatusEmbed: false,
    features: { liftEstimate: false },
    links: [
      { label: 'Official weather & conditions', url: 'https://www.mtspokane.com/conditions' },
      { label: 'Official trail report & lift status', url: 'https://www.mtspokane.com/trail-maps' },
      { label: 'Official webcams', url: 'https://www.mtspokane.com/webcams' },
      { label: 'Quartz Peak SNOTEL (regional)', url: 'https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=707' },
    ],
    afdWords: ['mt\\.? spokane', 'mount spokane', 'spokane area', 'northern mountains', 'idaho panhandle', 'northeast washington', 'selkirks?'],
    text: {
      liveLead: 'No public weather station on the ski area. The nearest, the Quartz Peak snow station, sits 3 mi SE of the summit on a separate peak, so it appears only as a regional reference below.',
      stationsNote: 'No public weather station on the ski area. The nearest, the Quartz Peak snow station (3.1 mi SE), is a regional reference only.',
      snowDepthNote: 'No snow-depth sensor on the ski area; the snow stake cam shows the ground. The nearest snow station, Quartz Peak (3.1 mi SE), is a regional reference.',
      regionalWhy: 'on separate peaks away from the ski runs, so their snow can differ from the ski area\'s',
      camsSource: 'Mt. Spokane Ski & Snowboard Park (YouTube live)',
      camsNote: 'Resort cameras: each shows its stream\'s live still, refreshed about every 5 minutes; tap one for live video in YouTube\'s player.',
      footer: 'Webcams © Mt. Spokane Ski & Snowboard Park, via YouTube. Official source: the Mt. Spokane weather & conditions page.',
    },
  },

  sunpeaks: {
    name: 'Sun Peaks',
    region: 'Thompson Okanagan · British Columbia, Canada',
    // A point on the ski area between the village and the top of Burfield.
    lat: 50.893,
    lon: -119.900,
    timezone: 'America/Vancouver',
    // The resort's own figures (Trail Maps & Stats, checked 2026-11-09): village base 1,255 m,
    // Burfield chair summit ("Top of the World") 2,080 m. Mid-mountain is the resort's own
    // mid-mountain weather point, 1,855 m, about the top of Sunburst Express (1,850 m).
    zones: [
      { key: 'base', name: 'Village base', short: 'Village', ft: 4117 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 6086 },
      { key: 'summit', name: 'Top of the World (Burfield summit)', short: 'Summit', ft: 6824 },
    ],
    // There is no National Weather Service in Canada. The hourly forecast is Environment Canada's
    // GEM model through Open-Meteo: its 2.5 km HRDPS run for the first 48 hours, then its regional
    // and global runs. It is raw model output (no forecaster), at mid-mountain elevation. It has no
    // snow-level or visibility forecast, so those show as unavailable instead of being assumed.
    forecast: { model: 'gem_seamless', short: 'GEM', name: 'Environment Canada GEM model (2.5 km HRDPS for the first 48 hrs), via Open-Meteo' },
    // No public weather station on the mountain reports in winter (checked 2026-11-09): the BC
    // Wildfire station near the village runs in fire season only, and the nearest others are valley
    // and highway sensors 30+ km away. The resort's own readings are on its web page only.
    stations: [],
    stationMaxAgeHours: 3,
    // Owner decision (2026-11-09): with no live station, "Right now" shows model estimates at each
    // elevation, labeled "Model, not measured". Only for a mountain with no usable measured station.
    nowModel: true,
    snowZone: 'mid',
    windHoldLifts: 'Upper-mountain',
    // Measured snow: Environment Canada's climate stations on the ski area, read by hand once a day.
    // They report in season only (2025-26: Jan 13 to Apr 6, with gaps) and appear with a delay, so
    // they are shown with their dates and never as "right now". Elevations from ECCC's station list.
    snowDaily: {
      operator: 'Environment and Climate Change Canada',
      bbox: '-119.93,50.88,-119.87,50.91',
      maxAgeDays: 3,
      stations: [
        { id: '116QK0M', name: 'Sun Peaks Upper', ft: 6742, where: 'upper mountain, near the top of Burfield' },
        { id: '1168204', name: 'Sun Peaks Mountain', ft: 6061, where: 'mid-mountain' },
        { id: '116Q20D', name: 'Sun Peaks Lower', ft: 4300, where: 'just above the village' },
      ],
    },
    // No regional snow-pillow reference: BC's pillows don't reach browsers, and the nearest is 56 km away.
    snotel: [],
    // No snow stake cam. Nine resort stills exist (checked 2026-11-09 against each picture and the
    // resort's own captions). They have no time stamp on the image and pause overnight. The Village
    // Clock Tower view is left out (village square, nothing about ski conditions). The large 4K images
    // are `heavy`: their thumbnails refresh less often to save data.
    // The first camera is the one shown large at the top in preseason.
    cams: [
      { name: 'Juniper Ridge (top of Burfield)', why: 'Top of the Burfield chair, 6,824 ft: the alpine snow surface and visibility up top. Resort camera; no time stamp on the image, and it pauses overnight.', src: 'https://www.sunpeaksresort.com/sites/default/files/spr_website_data/webcams/Wild%20flowers%202.jpg', heavy: true, caption: 'Juniper Ridge cam, top of Burfield (resort). This resort has no snow stake cam.' },
      { name: 'Crystal Bowl (top of Burfield)', why: 'Top of the Burfield chair, 6,824 ft, looking into Crystal Bowl: alpine snow and visibility.', src: 'https://www.sunpeaksresort.com/sites/default/files/spr_website_data/webcams/Wild%20flowers%201.jpg', heavy: true },
      { name: 'Mt. Tod from the top of Morrisey', why: 'Top of Morrisey Express, 5,495 ft, looking at Mt. Tod: falling snow and the cloud deck.', src: 'https://www.sunpeaksresort.com/sites/default/files/spr_website_data/webcams/view%20of%20mt%20todd.jpg' },
      { name: 'Top of Sundance Express', why: 'Top of Sundance Express, 5,677 ft: mid-mountain snow cover.', src: 'https://www.sunpeaksresort.com/sites/default/files/spr_website_data/webcams/sundance.jpg' },
      { name: 'Mt. Morrisey from the Elevation chair', why: 'Base of the Elevation chair, 5,249 ft, looking across at Mt. Morrisey\'s runs: snow cover from top to bottom.', src: 'https://www.sunpeaksresort.com/sites/default/files/spr_website_data/webcams/ele_view_of_morrisey.jpg' },
      { name: 'Base of OSV (Elevation chair)', why: 'Base of the Elevation chair, 5,249 ft: snow on a lower-mountain run.', src: 'https://www.sunpeaksresort.com/sites/default/files/spr_website_data/webcams/ele_view_of_OSV.jpg' },
      { name: 'Village Day Lodge slope', why: 'Village base, 4,117 ft: snow on the bottom of the mountain.', src: 'https://www.sunpeaksresort.com/sites/default/files/spr_website_data/webcams/Village%20Day%20Lodge%20Slopeside.jpg', heavy: true },
      { name: 'Village and lower slopes', why: 'Village Square, 4,117 ft, looking over the village to the lower slopes.', src: 'https://www.sunpeaksresort.com/sites/default/files/spr_website_data/webcams/Valley.jpg', heavy: true },
    ],
    // Season dates from the resort's Winter Hours of Operation page (checked 2026-11-09):
    // "Operating Season November 21, 2026 to April 4, 2027".
    season: { openingDay: '2026-11-21', checked: '2026-11-09' },
    liftStatusUrl: 'https://www.sunpeaksresort.com/ski-ride/weather-conditions-cams/lifts-trail-status',
    // The resort's pages send "X-Frame-Options: SAMEORIGIN", so the board can only be linked.
    liftStatusEmbed: false,
    features: { liftEstimate: false },
    // Environment Canada publishes no forecast discussion. Avalanche Canada's forecasters write a
    // Mountain Weather Forecast in avalanche season; it's not in their documented API, so it's linked.
    discussion: {
      none: 'Environment Canada doesn\'t publish a forecasters\' discussion like the US National Weather Service\'s. The closest equivalent for the BC mountains is Avalanche Canada\'s Mountain Weather Forecast, written by their forecasters during avalanche season.',
      link: { label: 'Avalanche Canada Mountain Weather Forecast', url: 'https://avalanche.ca/weather/forecast' },
    },
    links: [
      { label: 'Official weather & snow report', url: 'https://www.sunpeaksresort.com/ski-ride/weather-conditions-cams/weather-snow-report' },
      { label: 'Official lifts & trail status', url: 'https://www.sunpeaksresort.com/ski-ride/weather-conditions-cams/lifts-trail-status' },
      { label: 'Official webcams', url: 'https://www.sunpeaksresort.com/ski-ride/weather-conditions-cams/webcams' },
      { label: 'Avalanche Canada forecasts', url: 'https://avalanche.ca/map' },
      { label: 'Avalanche Canada Mountain Weather Forecast', url: 'https://avalanche.ca/weather/forecast' },
      { label: 'DriveBC (roads)', url: 'https://www.drivebc.ca/' },
    ],
    text: {
      liveLead: 'No public weather station on the mountain reports in winter, so there are no live measured readings here. Measured snow comes from Environment Canada\'s three climate stations on the ski area, read by hand once a day in season.',
      stationsNote: 'No public weather station on the mountain reports in winter. The resort shows its own readings on its website only.',
      snowDepthNote: 'Measured snow depth comes from Environment Canada\'s daily, hand-read reports at three stations on the ski area, in season only.',
      regionalWhy: '',
      camsSource: 'Sun Peaks Resort',
      camsNote: 'Official resort cameras. They have no time stamp on the image and pause overnight. This resort has no snow stake cam.',
      elevSource: 'Open-Meteo, blending national weather models',
      radarSource: 'RainViewer, combining national weather radars',
      radarNote: 'Mountains block parts of the radar beam in the BC Interior, so light snow can be missed.',
      noStation: 'No public station on the mountain reports in winter',
      dataCredits: 'Environment and Climate Change Canada, Open-Meteo, RainViewer, OpenStreetMap.',
      footer: 'Webcams © Sun Peaks Resort. Official sources: the Sun Peaks weather & snow report and Avalanche Canada.',
    },
  },
};
