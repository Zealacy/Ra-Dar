// Mountain configuration: everything that differs between mountains lives here.
// Elevations in feet, distances in miles. The page layout is the same for every mountain;
// where a mountain lacks something (a snow stake cam, an upper-mountain station, an embeddable
// lift board) the same slot shows its nearest equivalent or says plainly that there is none.
//
// Adding a mountain: verify every station, camera and elevation first (see CLAUDE.md), then add
// a block. The key is what goes in the address (?mtn=key) and the order here is the order of
// the switcher at the top of the page.

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
};
