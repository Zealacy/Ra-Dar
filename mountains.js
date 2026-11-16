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
// `snowStake.thumbLabel` replaces the Fresh snow card's "Measured: stake cam" label (Mt. Spokane, while its stream is off).
// `season.projected: true` says "projected" instead of "scheduled" for an Opening Day the resort calls projected;
// `season.word` gives the resort's own word instead (Mission Ridge: "planned").
// `skiHours` sets the lift hours the ski-day forecast covers, by day of week (0 = Sunday), e.g. { default: [9, 22], 5: [9, 24] };
// without it, 9am-4pm. A cam with `embed` (and no `src`) is a live player with no still picture, played when tapped.
// `nws.afdOffice` reads the forecast discussion from another office than the grid (Palisades: grid from
// Sacramento, discussion from Reno). `liftStatusLinkWhy` says why a lift board is linked, not embedded.
// `draft: true` keeps a finished mountain off the site (out of the switcher and unreachable by ?mtn=)
// until it's ready to publish. Set it to false to test the mountain locally.

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

  whitepass: {
    name: 'White Pass',
    region: 'US-12 at the Cascade crest, SE of Mt. Rainier · Washington, USA',
    // A point on the ski area between the base and Pigtail Peak. Researched 2026-11-14 (see CLAUDE.md).
    lat: 46.630,
    lon: -121.390,
    timezone: 'America/Los_Angeles',
    // The resort publishes no base or summit elevation (checked 2026-11-14). Base 4,500 ft matches NWAC's base
    // station; summit 6,500 ft (top of Paradise Basin) is Wikipedia's figure, confirmed against terrain data
    // (Open-Meteo elevation service, 2026-11-14: top of the Paradise Basin lift that ends below Hogback Mountain
    // 6,476 ft; base 4,475 ft; the Pigtail Peak SNOTEL 5,807 ft vs its record 5,800). Mid-mountain is Pigtail Peak, the top of
    // the Great White Express, where NWAC's Pigtail Peak station stands (5,970 ft; base 4,500 + the lift's
    // 1,500 ft of vertical = 6,000).
    zones: [
      { key: 'base', name: 'Base area', short: 'Base', ft: 4500 },
      { key: 'mid', name: 'Pigtail Peak (top of Great White)', short: 'Pigtail Peak', ft: 5970 },
      { key: 'summit', name: 'Top of Paradise Basin', short: 'Summit', ft: 6500 },
    ],
    // Base-area lifts 8:45am-4pm daily (Paradise Basin closes 3:15pm), so the default 9am-4pm fits. Night skiing
    // (4-8pm) runs only on listed dates, which `skiHours` can't express by day of week.
    // National Weather Service Seattle. This cell holds NWAC's Upper station and averages 5,463 ft; the base is in
    // 145,17 (4,623 ft). The Cascade crest runs through the ski area: Pigtail Peak's station falls in Pendleton's
    // 56,159 (5,827 ft). All publish snow level, visibility and snowfall.
    nws: { office: 'SEW', officeName: 'Seattle', x: 145, y: 16 },
    // Northwest Avalanche Center stations on the ski area, read through the NWS network (hourly). Checked
    // 2026-11-14, 7pm, against NWAC's own table: Upper 33.5°F = 34, Base 37.7°F = 38. Pigtail Peak measures wind
    // only; Upper and Base measure temperature and humidity. WSDOT's road sensor at the pass (TWHIT, beside the
    // base) had not reported for 33 hours on 2026-11-14; it shows as offline until it reports again.
    stations: [
      { id: 'WPS60', name: 'Pigtail Peak', operator: 'Northwest Avalanche Center', ft: 5970, where: 'at the top of the Great White Express, 0.9 mi S of the base' },
      { id: 'WPS58', name: 'White Pass Upper', operator: 'Northwest Avalanche Center', ft: 5800, where: 'upper mountain, just south of Pigtail Peak, 1.1 mi S of the base' },
      { id: 'WPS45', name: 'White Pass Base', operator: 'Northwest Avalanche Center', ft: 4500, where: 'base area, by the lodge' },
      { id: 'TWHIT', name: 'US-12 at White Pass', operator: 'Washington DOT', ft: 4498, where: 'US-12 at the pass, beside the base area', road: 'US-12 at White Pass', sheltered: 'road level' },
    ],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    windHoldLifts: 'Great White, Couloir Express and Basin Quad',
    // Measured snow on the ground: the Pigtail Peak SNOTEL, on the ski area beside the top of the Great White
    // Express (OpenStreetMap lift map), 5,800 ft. Owner decision (2026-11-14): "use pigtail peak". Last season
    // (Nov 15, 2025 - Apr 15, 2026): depth in 94% of hours, longest gap 13 h, peak 133" on Mar 13. On 2026-11-14
    // it read 3" (1.5" of water: a dense early-season pack) while NWAC's Upper sensor read 6".
    snowSensor: { id: '692:WA:SNTL', name: 'Pigtail Peak', operator: 'USDA NRCS SNOTEL', ft: 5800, mi: 0.6, where: 'on the ski area, beside the top of the Great White Express', maxAgeHours: 6 },
    // Regional reference only (collapsed in Live readings); never feeds the summary. White Pass E.S. is close
    // (0.9 mi from this point) but across US-12 by Leech Lake, off the ski area.
    snotel: [
      // Distances from this mountain's point above (measured 2026-11-14 from the NRCS station records).
      { id: '863:WA:SNTL', name: 'White Pass E.S.', ft: 4440, mi: 0.9 },
      { id: '502:WA:SNTL', name: 'Green Lake', ft: 5920, mi: 11.9 },
      { id: '375:WA:SNTL', name: 'Bumping Ridge', ft: 4600, mi: 12.8 },
    ],
    // The resort's cams are live video on Brownrice's player (as at Stevens Pass); each has a public snapshot
    // image. `video` is the player page, opened in a new tab. Names are the resort's (Mountain Cams page). Checked in
    // daylight on 2026-11-15, 12:18pm: all six live (changing between downloads a minute apart) and matching the text
    // below: stake board with a trace of snow; High Camp lodge on snow-dusted ground; Pigtail Peak's long view over a
    // forested valley; Paradise Basin's snow-covered upper slopes (Couloir); the base area across US-12, bare; the
    // Nordic Center's yurts, bare. WSDOT's cam carried a 12:16pm stamp.
    snowStake: {
      name: 'Snow stake (5,800 ft)',
      ft: 5800,
      src: 'https://player.brownrice.com/snapshot/whitepasssnowstake',
      video: 'https://player.brownrice.com/embed/whitepasssnowstake',
      note: 'Resort snow stake, numbered in inches; its sign reads "White Pass 5800\'". Lit at night. The resort doesn\'t say when the board is cleared.',
      caption: 'Measured: snow stake cam (resort), 5,800 ft',
    },
    cams: [
      { name: 'High Camp (resort cam)', why: 'Resort camera at High Camp, the mid-mountain lodge: snow on the ground and visibility mid-mountain. Tap for live video on the resort\'s player.', src: 'https://player.brownrice.com/snapshot/whitepasshighcamp', video: 'https://player.brownrice.com/embed/whitepasshighcamp', heavy: true },
      { name: 'Pigtail Peak (resort cam)', why: 'Resort camera at Pigtail Peak, the top of the Great White Express, with a long view out: upper-mountain visibility. Tap for live video on the resort\'s player.', src: 'https://player.brownrice.com/snapshot/pigtailpeak', video: 'https://player.brownrice.com/embed/pigtailpeak' },
      { name: 'Couloir Express (resort cam)', why: 'Resort camera in Paradise Basin, named for the Couloir Express: snow cover on the upper slopes, and upper-mountain visibility. Tap for live video on the resort\'s player.', src: 'https://player.brownrice.com/snapshot/couloir', video: 'https://player.brownrice.com/embed/couloir' },
      { name: 'Base Area (resort cam)', why: 'Resort camera looking across US-12 at the base area and its lifts: snow at the bottom of the mountain and the road. Tap for live video on the resort\'s player.', src: 'https://player.brownrice.com/snapshot/whitepasslive', video: 'https://player.brownrice.com/embed/whitepasslive' },
      { name: 'US 12 at White Pass summit', why: 'Highway 12 at the pass (4,500 ft), by the base area: the road and what is falling at base level. © WSDOT.', src: 'https://images.wsdot.wa.gov/sc/012vc15095.jpg', small: true },
      { name: 'Nordic Center (resort cam)', why: 'Resort camera at the Nordic Center, across US-12 from the ski area: snow at base level. Tap for live video on the resort\'s player.', src: 'https://player.brownrice.com/snapshot/whitepassnordic', video: 'https://player.brownrice.com/embed/whitepassnordic' },
    ],
    // Snow report (2026-11-13): "White Pass typically opens for daily operation late November or early December.
    // Watch this page for updates." No date; the ski area is closed to all access until then.
    season: { openingDay: null, closed: true, checked: '2026-11-14' },
    liftStatusUrl: 'https://skiwhitepass.com/the-mountain/hours-and-lifts',
    // The resort's pages send "X-Frame-Options: SAMEORIGIN", so the board can only be linked. Its lift table read
    // "OPEN" for every lift on 2026-11-14 while the area was closed, so the snow report is linked too.
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; before the season its lift list may not be current, so check the snow report too',
    features: { liftEstimate: false },
    links: [
      { label: 'Official snow report', url: 'https://skiwhitepass.com/the-mountain/snow-report' },
      { label: 'Official hours & lifts', url: 'https://skiwhitepass.com/the-mountain/hours-and-lifts' },
      { label: 'Official mountain cams', url: 'https://skiwhitepass.com/mountain-cams' },
      // The zone the resort's own snow report links (checked 2026-11-15; NWAC has no zone named for White Pass).
      { label: 'Northwest Avalanche Center: East Slopes South forecast', url: 'https://nwac.us/forecasts/avalanche/east-slopes-south' },
      { label: 'NWAC White Pass stations (every hour, incl. snow depth)', url: 'https://nwac.us/weather/stations/white-pass' },
      { label: 'Pigtail Peak SNOTEL', url: 'https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=692' },
      { label: 'WSDOT mountain pass reports (White Pass, US 12)', url: 'https://wsdot.com/travel/real-time/mountainpasses' },
    ],
    afdWords: ['cascades?', 'cascade crest', 'white pass', 'us 12', 'highway 12', 'packwood', 'rainier', 'passes', 'east winds?', 'snow levels?'],
    text: {
      liveLead: 'Live readings from the Northwest Avalanche Center\'s stations on the ski area (Pigtail Peak, the upper mountain and the base), Washington DOT\'s road sensor at the pass, and the federal snow station at Pigtail Peak.',
      stationsNote: 'Northwest Avalanche Center stations on the ski area, reporting hourly, and Washington DOT\'s road sensor at the pass (wind sheltered at road level), read through the National Weather Service network. Pigtail Peak measures wind only; the upper and base stations measure temperature. Offline stations are ignored.',
      snowDepthNote: 'Measured snow depth comes from the Pigtail Peak snow station on the ski area (5,800 ft). NWAC also measures depth at its upper station, on its own site only (see Links).',
      regionalWhy: 'off the ski area or in other valleys, so their snow differs from the ski area\'s',
      camsSource: 'White Pass (live video, Brownrice); Washington State DOT',
      camsNote: 'Resort cams show a current snapshot; tap for live video on the resort\'s player. Road camera © WSDOT. The stake is the best on-mountain check of new snow.',
      radarNote: 'Radar coverage over the Cascades is limited by terrain, so light snow can be missed.',
      footer: 'Webcams © White Pass Ski Area, via Brownrice. Road camera © WSDOT. Official sources: the White Pass snow report and the Northwest Avalanche Center forecast.',
    },
  },

  skibowl: {
    name: 'Mt. Hood Skibowl',
    region: 'Government Camp, Mt. Hood, US-26 · Oregon, USA',
    // Between Skibowl West's base and the summit. Open-Meteo picks a cell per elevation here: base 45.317, -121.782,
    // mid 45.291, -121.772, summit 45.324, -121.745 (checked 2026-11-13).
    lat: 45.297,
    lon: -121.775,
    timezone: 'America/Los_Angeles',
    // The resort's "By The Numbers" page (checked 2026-11-13): base 3,650 ft, summit 5,027 ft (it also says
    // "1500 ft" of vertical; the two heights give 1,377). "Mid" is the halfway elevation.
    zones: [
      { key: 'base', name: 'Skibowl West base', short: 'Base', ft: 3650 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 4340 },
      { key: 'summit', name: 'Summit', short: 'Summit', ft: 5027 },
    ],
    // Lift hours (projected operating schedule, checked 2026-11-13): Monday-Friday 3pm-10pm; Saturday, Sunday and
    // holidays 9am-10pm. "America's Largest Night Ski Area." Owner's decision (Nov 13): each mountain uses its own hours.
    skiHours: { default: [9, 22], 1: [15, 22], 2: [15, 22], 3: [15, 22], 4: [15, 22], 5: [15, 22] },
    // National Weather Service Portland. This cell holds the summit station and averages 4,469 ft, about
    // mid-mountain; the base station is in 140,88 (3,740 ft). Both publish snow level and visibility.
    nws: { office: 'PQR', officeName: 'Portland', x: 139, y: 87 },
    // Northwest Avalanche Center stations on the ski area, through the NWS network (hourly). The feed leaves the
    // summit's temperature out of about half its reports (NWAC's own table has every hour; linked). Oregon DOT's
    // road station at Skibowl West reports every 10 minutes. All current on 2026-11-13.
    stations: [
      { id: 'GVT50', name: 'Skibowl Summit', operator: 'Northwest Avalanche Center', ft: 5010, where: 'top of the ski area, 1.0 mi SSW of the West base' },
      { id: 'GVT36', name: 'Skibowl Base', operator: 'Northwest Avalanche Center', ft: 3660, where: 'Skibowl West base area' },
      { id: 'OD162', name: 'US-26 at Skibowl West', operator: 'Oregon DOT', ft: 3655, where: 'US-26 at the West base, 0.3 mi WNW', road: 'US-26 at Government Camp', sheltered: 'road level' },
    ],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    // No snow-depth sensor this site can read on the ski area (NWAC's summit sensor is on its own site only; linked).
    // As at the other mountains without one, the nearest SNOTELs are regional only.
    snotel: [
      // Distances from this mountain's point above (measured 2026-11-13 from the NRCS station records).
      { id: '651:OR:SNTL', name: 'Mt Hood Test Site', ft: 5380, mi: 3.3 },
      { id: '655:OR:SNTL', name: 'Mud Ridge', ft: 4070, mi: 3.5 },
      { id: '401:OR:SNTL', name: 'Clear Lake', ft: 3810, mi: 8.5 },
    ],
    // The resort's own live cams are a Google Nest public stream (Skibowl West) and a Verkada player (Skibowl East).
    // Neither offers a still picture (Nest's snapshot endpoints aren't documented, so they're off-limits). Nest's
    // official embed player isn't blocked from other sites, so Skibowl West plays here when tapped (`embed`). The
    // Verkada player is locked by its owner to skibowl.com, so Skibowl East is only linked. A third Nest stream on
    // the resort's home page (npsFa2hlJU) isn't named anywhere and couldn't be viewed here, so it's left out.
    // Oregon DOT's TripCheck stills carry their own time, elevation and temperature; ODOT allows their use with
    // credit (TripCheck FAQ). All current on 2026-11-13. No snow stake cam.
    cams: [
      { name: 'US-26 at Skibowl West', why: 'Highway 26 at Skibowl West\'s base (3,624 ft): the road and what is falling at the base. Time, elevation and temperature are on the picture. Camera courtesy of ODOT.', src: 'https://tripcheck.com/roadcams/cams/US26%20at%20Ski%20Bowl%20West%20EB_pid4117.jpg', small: true, caption: 'ODOT TripCheck cam at Skibowl West (time-stamped). The resort\'s own cam is a live stream: see the cams below. No snow stake cam.' },
      { name: 'Skibowl West (resort, live)', why: 'The resort\'s live stream of Skibowl West (Google Nest). It has no still picture, so tap to play the live video. Skibowl East\'s stream plays only on the resort\'s own site (Links).', embed: 'https://video.nest.com/embedded/live/SUFOrgWa6m?autoplay=1', link: 'https://video.nest.com/live/SUFOrgWa6m' },
      { name: 'US-26 at Government Camp Loop Rd', why: 'Highway 26 at the west end of the Government Camp loop (3,715 ft), by Skibowl East. Camera courtesy of ODOT.', src: 'https://tripcheck.com/roadcams/cams/US26%20at%20Govt%20Camp%20Lp%20Rd_pid1776.JPG', small: true },
      { name: 'US-26 at Government Camp', why: 'Highway 26 at Government Camp (3,989 ft), at the Timberline Highway: the road through town. Camera courtesy of ODOT.', src: 'https://tripcheck.com/roadcams/cams/GovernmentCamp_pid624.jpg', small: true },
    ],
    // Opening Day not announced ("WE ARE PREPARING FOR THE UPCOMING 26.27 WINTER SEASON", checked 2026-11-13).
    season: { openingDay: null, closed: true, checked: '2026-11-13' },
    liftStatusUrl: 'https://skibowl.com/winter-condition-and-lift-status/',
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; the resort\'s conditions & lift status page',
    features: { liftEstimate: false },
    links: [
      { label: 'Official conditions, lift status & live cams', url: 'https://skibowl.com/winter-condition-and-lift-status/' },
      { label: 'Official operating schedule', url: 'https://skibowl.com/about-winter/operating-schedule/' },
      { label: 'Northwest Avalanche Center: Mt Hood forecast', url: 'https://nwac.us/forecasts/avalanche/mt-hood' },
      { label: 'NWAC Skibowl stations (every hour, incl. summit snow depth)', url: 'https://nwac.us/weather/stations/skibowl-ski-area' },
      { label: 'ODOT TripCheck (roads)', url: 'https://www.tripcheck.com/' },
    ],
    afdWords: ['cascades?', 'cascade crest', 'mount hood', 'mt\\.? hood', 'government camp', 'passes', 'us 26', 'highway 26', 'east winds?', 'snow levels?'],
    text: {
      liveLead: 'Live readings from the Northwest Avalanche Center\'s stations on the ski area (summit and base) and Oregon DOT\'s road station at Skibowl West. No snow-depth sensor this site can read stands on the mountain; the nearest snow stations appear below as regional references.',
      stationsNote: 'Northwest Avalanche Center stations on the ski area, reporting hourly, and Oregon DOT\'s road station on US-26 (every 10 minutes; wind sheltered at road level), read through the National Weather Service network. The feed leaves the summit\'s temperature out of some reports; the latest within 3 hours is shown, with its age. Offline stations are ignored.',
      snowDepthNote: 'NWAC measures snow depth at the summit, on its own site only (see Links). The nearest snow station this site reads, Mt Hood Test Site, is on Timberline\'s side, 3 mi away: a regional reference.',
      regionalWhy: 'on other slopes of Mt. Hood and lower valleys, so their snow differs from the ski area\'s',
      camsSource: 'Oregon DOT TripCheck; Mt. Hood Skibowl (Google Nest live stream)',
      camsNote: 'Road cameras courtesy of ODOT, with their own time stamps. The resort\'s Skibowl West cam is a live stream with no still picture: tap to play it. Skibowl East\'s plays only on the resort\'s site. No snow stake cam.',
      radarNote: 'Radar coverage over the Cascades is limited by terrain, so light snow can be missed.',
      footer: 'Road cameras courtesy of ODOT. Skibowl West live stream © Mt. Hood Skibowl, via Google Nest. Official sources: the Skibowl conditions page and the Northwest Avalanche Center forecast.',
    },
  },

  timberline: {
    name: 'Timberline',
    region: 'Mt. Hood, south side, above Government Camp · Oregon, USA',
    // Timberline Lodge. Researched 2026-11-14 (see CLAUDE.md).
    lat: 45.330,
    lon: -121.711,
    timezone: 'America/Los_Angeles',
    // The main ski area, from the lowest lift to the top of the terrain. Lodge 6,000 ft and top of Palmer 8,540 ft
    // ("highest operation point") are the resort's own figures (Skiing & Snowboarding page). The bottom of the Jeff
    // Flood chair, 4,850 ft, is the lowest lift on the mountain (USFS lift specifications, via Wikipedia's lift
    // table; NWS cell 142,88 averages 4,843 ft). Owner left it to Claude (2026-11-14): Summit Pass, the resort's
    // small separate area in Government Camp (bottom 4,000 ft, reached by the Alpine Trail and a shuttle), is not
    // part of the picture; its cam and the resort's "4,540' vertical" are mentioned instead.
    zones: [
      { key: 'base', name: 'Bottom of Jeff Flood', short: 'Jeff Flood bottom', ft: 4850 },
      { key: 'mid', name: 'Timberline Lodge', short: 'Lodge', ft: 6000 },
      { key: 'summit', name: 'Top of Palmer', short: 'Top of Palmer', ft: 8540 },
    ],
    // Winter lift hours aren't posted yet (fall hours only, 2026-11-14), so the default 9am-4pm applies.
    // National Weather Service Portland. This cell holds both the lodge and Magic Mile stations and averages
    // 6,339 ft; 142,90 (6,975 ft) covers the upper mountain and 142,88 (4,843 ft) the lower. All three publish
    // snow level, visibility and snowfall.
    nws: { office: 'PQR', officeName: 'Portland', x: 142, y: 89 },
    // Northwest Avalanche Center stations on the ski area, read through the NWS network (hourly). Checked
    // 2026-11-14 against NWAC's own tables (Magic Mile 31.2°F in the feed = 31°F on NWAC's page at 1pm).
    // The lodge station's temperature is missing from about a quarter of the feed's reports; the latest within
    // 3 hours is used. Left out: Timberline - Pucci (TPI59, 5,920 ft, the lodge-level wind sensor): no reports in
    // the NWS feed, and NWAC lists its last report as Oct 27, 2026. Add it when it reports again. Nothing measures
    // the weather above the Magic Mile. ODOT's US-26 sensors at Government Camp (2.6 mi, ~4,000 ft) are left out:
    // below and away from the ski area.
    stations: [
      { id: 'TIM70', name: 'Magic Mile', operator: 'Northwest Avalanche Center', ft: 6990, where: 'top of the Magic Mile chair, beside Silcox Hut, 1.0 mi N of the lodge' },
      { id: 'TIM59', name: 'Timberline Lodge', operator: 'Northwest Avalanche Center', ft: 5800, where: 'at the lodge' },
    ],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    windHoldLifts: 'Magic Mile and Palmer',
    // Measured snow on the ground: the Mt Hood Test Site SNOTEL, on the ski area among the lower-mountain runs
    // (between two lift lines on OpenStreetMap's lift map), 0.7 mi SSW of the lodge, 5,380 ft. Owner decision
    // (2026-11-14): yes. Checked over 2025-26 (Nov 15 - Apr 15): depth in 97% of hours, longest gap 24 h, peak 75"
    // on Mar 12. On 2026-11-14 it read 2" while NWAC's lodge sensor and the resort (top of Pucci) read 3".
    snowSensor: { id: '651:OR:SNTL', name: 'Mt Hood Test Site', operator: 'USDA NRCS SNOTEL', ft: 5380, mi: 0.7, where: 'on the lower mountain, among the runs 0.7 mi SSW of the lodge', maxAgeHours: 6 },
    // Regional reference only (collapsed in Live readings); never feeds the summary.
    snotel: [
      // Distances from this mountain's point above (measured 2026-11-14 from the NRCS station records).
      { id: '655:OR:SNTL', name: 'Mud Ridge', ft: 4070, mi: 5.4 },
      { id: '401:OR:SNTL', name: 'Clear Lake', ft: 3810, mi: 9.8 },
      { id: '351:OR:SNTL', name: 'Blazed Alder', ft: 3660, mi: 9.8 },
    ],
    // The resort's own cams: public stills on its site, 720x480, each with an on-image date and time, updated every
    // minute or two (checked 2026-11-14 in fog, and in daylight on 2026-11-15, 12:18pm). Names are the resort's (its
    // webcams page). The resort's snow stake cam (/snowcameras/snowstake.jpg) showed "No signal ... timeout" on
    // 2026-11-14 and again at midday on 2026-11-15, so it is left out for now; when it works, add it as `snowStake`.
    // On 2026-11-15 the Summit Pass cam showed the same "No signal" card (it worked the day before); it stays in,
    // since the resort stamps the card with the time. The "Magic Mile" cam shows a lift terminal building in the
    // forest; which lift is still not confirmed from the picture.
    // The first camera is the one shown large at the top in preseason.
    cams: [
      { name: 'Pucci', why: 'Resort camera at the Pucci chair, just below the lodge: snow cover on the runs. Date and time are on the picture.', src: 'https://timberlinelodge.com/snowcameras/pucci.jpg', caption: 'Pucci cam (resort), time-stamped. The resort\'s snow stake cam was offline when checked (Nov 14 and 15).' },
      { name: 'Jeff Flood', why: 'Resort camera at the top of the Jeff Flood chair, looking down the lift line: snow cover on the lower mountain and the cloud below.', src: 'https://timberlinelodge.com/snowcameras/FloodSouth.jpg' },
      { name: 'Palmer / Silcox', why: 'Resort camera by Silcox Hut at the bottom of Palmer (about 7,000 ft): upper-mountain visibility. White means cloud.', src: 'https://timberlinelodge.com/snowcameras/palmerbottom.jpg' },
      { name: 'Magic Mile (resort\'s name)', why: 'A chairlift terminal and lift building in the trees. The resort calls this its Magic Mile camera; its exact spot isn\'t confirmed.', src: 'https://timberlinelodge.com/snowcameras/FloodEast.jpg' },
      { name: 'Bruno\'s', why: 'Resort camera at the Bruno\'s chair, the beginner area beside the lodge, looking toward the parking lot.', src: 'https://timberlinelodge.com/snowcameras/brunotop.jpg' },
      { name: 'Timberline Lodge', why: 'The lodge (6,000 ft) and its parking lot: snow on the roofs and the lot.', src: 'https://timberlinelodge.com/snowcameras/lodge.jpg' },
      { name: 'Summit Pass (Government Camp)', why: 'Timberline\'s small separate area in Government Camp (about 4,000 ft), at the bottom of its 4,540 ft run. Not part of the main ski area shown above.', src: 'https://timberlinelodge.com/snowcameras/summit.jpg' },
    ],
    // Conditions page (checked 2026-11-14): "Timberline is Closed for Skiing & Snowboarding: We plan to open for the
    // winter season as soon as there is enough snow to responsibly operate." No date. The resort says its season
    // "typically" runs "from mid-November through late May".
    season: { openingDay: null, closed: true, checked: '2026-11-14' },
    liftStatusUrl: 'https://timberlinelodge.com/conditions/',
    // The resort's pages send "X-Frame-Options: SAMEORIGIN", so the board can only be linked.
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; the resort\'s conditions page lists every lift',
    features: { liftEstimate: false },
    links: [
      { label: 'Official conditions & lift status', url: 'https://timberlinelodge.com/conditions/' },
      { label: 'Official webcams', url: 'https://timberlinelodge.com/webcams/' },
      { label: 'Official hours of operation', url: 'https://timberlinelodge.com/mountain/hours-of-operation/' },
      { label: 'Northwest Avalanche Center: Mt Hood forecast', url: 'https://nwac.us/forecasts/avalanche/mt-hood' },
      { label: 'NWAC Timberline Lodge station (every hour, incl. snow depth)', url: 'https://nwac.us/weather/stations/timberline-base' },
      { label: 'NWAC Magic Mile station (every hour)', url: 'https://nwac.us/weather/stations/timberline-upper' },
      { label: 'Mt Hood Test Site SNOTEL', url: 'https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=651' },
      { label: 'ODOT TripCheck (roads)', url: 'https://www.tripcheck.com/' },
    ],
    afdWords: ['cascades?', 'cascade crest', 'mount hood', 'mt\\.? hood', 'timberline', 'government camp', 'passes', 'us 26', 'highway 26', 'east winds?', 'snow levels?'],
    text: {
      liveLead: 'Live readings from the Northwest Avalanche Center\'s stations on the ski area (top of the Magic Mile and the lodge) and the federal snow station on the lower mountain. Nothing measures the weather above the Magic Mile.',
      stationsNote: 'Northwest Avalanche Center stations on the ski area, reporting hourly, read through the National Weather Service network. The feed leaves the lodge\'s temperature out of some reports; the latest within 3 hours is shown, with its age. The lodge\'s wind sensor (Pucci) has been offline since Oct 27, so only the Magic Mile measures wind. Offline stations are ignored.',
      snowDepthNote: 'Measured snow depth comes from the Mt Hood Test Site snow station on the lower mountain (5,380 ft, 600 ft below the lodge). NWAC also measures depth at the lodge, on its own site only (see Links).',
      regionalWhy: 'lower and on other slopes of Mt. Hood, so their snow differs from the ski area\'s',
      camsSource: 'Timberline Lodge',
      camsNote: 'Official resort cameras, each with its own date and time on the picture. The resort\'s snow stake cam was offline when checked (Nov 14 and 15), so it isn\'t shown.',
      radarNote: 'Radar coverage over the Cascades is limited by terrain, so light snow can be missed.',
      footer: 'Webcams © Timberline Lodge. Official sources: the Timberline conditions page and the Northwest Avalanche Center forecast.',
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
      // Distances from this mountain's point above (re-measured 2026-11-10 from the NRCS station records).
      { id: '729:OR:SNTL', name: 'Salt Creek Falls', ft: 4220, mi: 4.6 },
      { id: '660:OR:SNTL', name: 'New Crescent Lake', ft: 4910, mi: 6.8 },
      { id: '801:OR:SNTL', name: 'Summit Lake', ft: 5610, mi: 12.1 },
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
    // Season status: the resort's home page headline reads "Scheduled Opening Date: December 11!" (page last
    // edited 2026-11-05 UTC; checked 2026-11-10). Its Hours of Operation page (last edited Oct 9) still says
    // "Opening Soon for 2026/2027!". Re-check both when working on the site.
    season: { openingDay: '2026-12-11', checked: '2026-11-10' },
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
      // Distances from this mountain's point above (re-measured 2026-11-10 from the NRCS station records).
      { id: '1338:WA:SNTL', name: 'Icicle Creek', ft: 4550, mi: 14.1 },
      { id: '478:WA:SNTL', name: 'Fish Lake', ft: 3440, mi: 14.2 },
      { id: '912:WA:SNTL', name: 'Skookum Creek', ft: 3320, mi: 24.3 },
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
    // All four resort cams were checked against their pictures (Skyline and Jupiter in daylight on
    // 2026-11-11; they carry the resort's names, described by what each shows). Washington DOT's cams carry their own name and time stamp.
    cams: [
      { name: 'Skyline (resort cam)', why: 'Resort camera high on the front side, looking down across the ski area toward the valley: snow cover on the upper runs and cloud below. Tap for live video on the resort\'s player.', src: 'https://player.brownrice.com/snapshot/stevenspassskyline', video: 'https://player.brownrice.com/embed/stevenspassskyline' },
      { name: 'Jupiter (resort cam)', why: 'Resort camera named for the Jupiter Express lift, on the back side: a close view of a lift building and the ground around it, good for snow on the ground and visibility. Tap for live video on the resort\'s player.', src: 'https://player.brownrice.com/snapshot/stevenspassjupiter', video: 'https://player.brownrice.com/embed/stevenspassjupiter' },
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

  alpental: {
    name: 'Alpental',
    region: 'Snoqualmie Pass, north of I-90 (part of the Summit at Snoqualmie) · Washington, USA',
    // Alpental is one of the Summit at Snoqualmie's four areas, the only one north of I-90; `snoqualmie` below
    // covers the other three (owner's choice, 2026-11-12). A point toward Denny Mountain: Open-Meteo then uses
    // the base cell 47.427, -121.440 and, for mid and summit, 47.452, -121.450 on Alpental's side of the valley
    // (from the base lodge itself it picked Snoqualmie Mountain's side, NE). Checked 2026-11-12.
    lat: 47.438,
    lon: -121.437,
    timezone: 'America/Los_Angeles',
    // The resort's figures (help-center Mountain Stats page): highest point 5,420 ft, vertical 2,280 ft, so the
    // base is 3,140 ft (its Alpental page says 2,290 vertical). "Mid" is the halfway elevation.
    zones: [
      { key: 'base', name: 'Base area', short: 'Base', ft: 3140 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 4280 },
      { key: 'summit', name: 'Top of Alpental', short: 'Summit', ft: 5420 },
    ],
    // National Weather Service Seattle. This cell holds the Mid-Mountain station and averages 3,983 ft. The
    // Cascade crest splits Seattle and Pendleton through the pass; all of Alpental is in Seattle's area.
    nws: { office: 'SEW', officeName: 'Seattle', x: 151, y: 54 },
    // Northwest Avalanche Center stations on the ski area, read through the NWS network (hourly, 1-2 hours late).
    // On 2026-11-12 Base and Mid-Mountain stopped reporting about 2pm (blank in NWAC's own table too); the site
    // shows them offline until they return. NWAC's table also has snow depth at Base and Mid (linked below).
    stations: [
      { id: 'ALP55', name: 'Alpental Summit', operator: 'Northwest Avalanche Center', ft: 5470, where: 'top of the ski area, 0.9 mi WSW of the base' },
      { id: 'ALP44', name: 'Alpental Mid-Mountain', operator: 'Northwest Avalanche Center', ft: 4350, where: 'mid-mountain, 0.8 mi SSW of the base' },
      { id: 'ALP31', name: 'Alpental Base', operator: 'Northwest Avalanche Center', ft: 3100, where: 'base area' },
    ],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    // No snow-depth sensor this site can read on the ski area (NWAC's depth sensors are on its own site only).
    // As at Mt. Spokane and Alpine Meadows (owner: "sure", 2026-11-12), the nearest SNOTELs are regional only.
    snotel: [
      // Distances from this mountain's point above (measured 2026-11-12 from the NRCS station records).
      { id: '672:WA:SNTL', name: 'Olallie Meadows', ft: 4010, mi: 4.4 },
      { id: '899:WA:SNTL', name: 'Tinkham Creek', ft: 3000, mi: 7.5 },
      { id: '788:WA:SNTL', name: 'Stampede Pass', ft: 3850, mi: 12.2 },
    ],
    // The resort's cams are CamStreamer embeds that redirect to YouTube live streams; these are the YouTube ids
    // they pointed to on 2026-11-12 (re-resolve through camstreamer.com/embed/<id> if a still stops working:
    // Base NGuSbRSJ…, Mid 1YTKigZZ…, Top a9V1ciOD…). Daylight check, Nov 13 3:35pm: none live. Base and Mid show
    // title cards; Top shows a frozen night frame (blowing snow), byte-identical to Nov 12 10pm. So the time-stamped
    // WSDOT pass cam leads, and each resort cam says its stream was off. Re-check; when live, drop that sentence.
    cams: [
      { name: 'I-90 Snoqualmie Pass Summit', why: 'Interstate 90 at the pass (about 3,000 ft), 1.4 mi from Alpental\'s base: the road and what is falling at the pass. Its own name and time stamp are on the picture. © WSDOT.', src: 'https://images.wsdot.wa.gov/sc/090vc05200.jpg', small: true, caption: 'WSDOT I-90 cam at the pass (time-stamped). The resort\'s own streams were off when checked (Nov 13). No snow stake cam.' },
      { name: 'Alpental Top', why: 'Resort camera at the top of Alpental. Its stream was off when checked in daylight on Nov 13 (an old frozen frame or the resort\'s title card), so this may not be today\'s view. Tap for live video (YouTube).', youtube: 'bWf5rScCIas' },
      { name: 'Alpental Mid-Mountain', why: 'Resort camera at mid-mountain. Its stream was off when checked in daylight on Nov 13 (an old frozen frame or the resort\'s title card), so this may not be today\'s view. Tap for live video (YouTube).', youtube: 'c_XLrUYV8tk' },
      { name: 'Alpental Base', why: 'Resort camera at the base area. Its stream was off when checked in daylight on Nov 13 (an old frozen frame or the resort\'s title card), so this may not be today\'s view. Tap for live video (YouTube).', youtube: '8wk81COX2cg' },
    ],
    // Opening Day: the resort's hours page (updated Sep 27, 2026) says "Opening day for the winter season is to be
    // determined". Last season Alpental opened Jan 7, 2026. `closed: true` keeps preseason mode on.
    season: { openingDay: null, closed: true, checked: '2026-11-12' },
    liftStatusUrl: 'https://www.summitatsnoqualmie.com/alpental/mountain-report',
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; its lift list loads by script',
    features: { liftEstimate: false },
    links: [
      { label: 'Official Alpental mountain report', url: 'https://www.summitatsnoqualmie.com/alpental/mountain-report' },
      { label: 'Official webcams', url: 'https://www.summitatsnoqualmie.com/webcams' },
      { label: 'Northwest Avalanche Center: Snoqualmie Pass forecast', url: 'https://nwac.us/forecasts/avalanche/snoqualmie-pass' },
      { label: 'NWAC Alpental stations (every hour, incl. snow depth)', url: 'https://nwac.us/weather/stations/alpental' },
      { label: 'WSDOT Snoqualmie Pass I-90 (roads)', url: 'https://wsdot.com/travel/real-time/mountainpasses/snoqualmie' },
    ],
    afdWords: ['cascades?', 'cascade crest', 'snoqualmie', 'snoqualmie pass', 'passes', 'i-90', 'east winds?', 'easterly', 'offshore', 'convergence zone'],
    text: {
      liveLead: 'Live readings from the Northwest Avalanche Center\'s weather stations on the ski area (summit, mid-mountain and base). No snow-depth sensor this site can read stands on the mountain; the nearest snow stations appear below as regional references.',
      stationsNote: 'Northwest Avalanche Center stations on the ski area, reporting hourly; reports arrive 1 to 2 hours late. Read through the National Weather Service network. Offline stations are ignored.',
      snowDepthNote: 'NWAC measures snow depth at Alpental\'s base and mid-mountain, on its own site only (see Links). The nearest snow station this site reads, Olallie Meadows, is in another valley 4 mi away: a regional reference.',
      regionalWhy: 'in other valleys and drainages, so their snow differs from the ski area\'s',
      camsSource: 'Summit at Snoqualmie (YouTube live, via CamStreamer); Washington State DOT',
      camsNote: 'Resort cameras: each shows its stream\'s live still, refreshed about every 5 minutes; tap one for live video in YouTube\'s player. When checked on Nov 13 the resort\'s streams were off (frozen frames or title cards), so their pictures may be old; the WSDOT road cams carry their own time stamps. Road camera © WSDOT.',
      footer: 'Resort cams © Summit at Snoqualmie, via YouTube. Road camera © WSDOT. Official sources: the Alpental mountain report and the Northwest Avalanche Center forecast.',
    },
  },

  snoqualmie: {
    name: 'Summit at Snoqualmie',
    region: 'Snoqualmie Pass, south of I-90: Summit West, Central and East · Washington, USA',
    // Summit West, Summit Central and Summit East as one mountain (owner's choice, 2026-11-12); Alpental is
    // `alpental` above. A point at Summit Central: Open-Meteo uses the cell 47.408, -121.391 (Central/East) for
    // base and mid, and 47.433, -121.402 (north of I-90, 1.9 mi) for the summit height. Checked 2026-11-12.
    lat: 47.405,
    lon: -121.405,
    timezone: 'America/Los_Angeles',
    // The three areas differ: West about 3,000-3,765 ft, Central 2,840-3,865 ft, East 2,610-3,710 ft (Wikipedia
    // verticals 765 / 1,025 / 1,100 ft; Central's top 3,865 ft per SnowForecast and Family Ski Trips; the pass
    // itself is 3,015 ft). The resort publishes no per-area heights. Base is the pass level, where Summit West's
    // base and the NWAC station sit; the summit is Summit Central's top, the highest point of the three.
    zones: [
      { key: 'base', name: 'Base areas at the pass', short: 'Base', ft: 3000 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 3430 },
      { key: 'summit', name: 'Top of Summit Central', short: 'Summit', ft: 3865 },
    ],
    // The Cascade crest splits NWS Seattle and Pendleton through the pass. This Seattle cell holds Summit West's base
    // and averages 3,087 ft. Central and East fall in Pendleton's cells, which average 2,570-2,810 ft because they
    // take in the Lake Keechelus valley, below the ski terrain. Seattle writes the passes' forecast discussion.
    nws: { office: 'SEW', officeName: 'Seattle', x: 152, y: 54 },
    // Northwest Avalanche Center stations at Summit West plus Washington DOT's road sensor at the pass, all read
    // through the NWS network. NWAC's East Shed station (ESS38, 3,770 ft, above Lake Keechelus) has been offline
    // since Nov 10, 2026; add it if it returns. On 2026-11-12 at 10pm an easterly cold pool sat in the pass:
    // Dodge Ridge 34°F with an east wind while Alpental's summit read 41°F, which the model missed (44°F).
    stations: [
      { id: 'SNO38', name: 'Dodge Ridge', operator: 'Northwest Avalanche Center', ft: 3760, where: 'top of Summit West, 0.7 mi WSW of its base' },
      { id: 'SNO30', name: 'Snoqualmie Pass', operator: 'Northwest Avalanche Center', ft: 3010, where: 'Summit West base area, at the pass' },
      { id: 'TALPE', name: 'I-90 at the Alpental exit', operator: 'Washington DOT', ft: 2972, where: 'I-90 at the pass, 0.2 mi from Summit West\'s base', road: 'I-90 at the pass', sheltered: 'road level' },
    ],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    // As at Alpental: no snow-depth sensor this site can read on the ski area; SNOTELs regional only.
    snotel: [
      { id: '672:WA:SNTL', name: 'Olallie Meadows', ft: 4010, mi: 2.8 },
      { id: '899:WA:SNTL', name: 'Tinkham Creek', ft: 3000, mi: 5.9 },
      { id: '788:WA:SNTL', name: 'Stampede Pass', ft: 3850, mi: 9.5 },
    ],
    // Resort cams: CamStreamer embeds redirecting to YouTube live streams (ids as of 2026-11-12; re-resolve
    // through camstreamer.com/embed/<id> if a still stops working: Central Base fd40qLVR…, Central Top
    // QmtJtO3W…, Silver Fir Base QOEw0n5i…, West Base PZyoJBnQ…). Daylight check, Nov 13 3:35pm: none live; Central
    // Base shows a frozen night frame (identical to Nov 12 10pm), the rest title cards. So WSDOT's time-stamped I-90
    // cams lead and each resort cam says its stream was off. Re-check; when live, drop that sentence.
    cams: [
      { name: 'I-90 Snoqualmie Pass Summit', why: 'Interstate 90 at the pass (about 3,000 ft), by Summit West: the road and what is falling at the pass. Its own name and time stamp are on the picture. © WSDOT.', src: 'https://images.wsdot.wa.gov/sc/090vc05200.jpg', small: true, caption: 'WSDOT I-90 cam at the pass (time-stamped). The resort\'s own streams were off when checked (Nov 13). No snow stake cam.' },
      { name: 'I-90 East Snoqualmie Summit', why: 'Interstate 90 east of the pass, by Summit East (Hyak): the road on the east side. Its own name and time stamp are on the picture. © WSDOT.', src: 'https://images.wsdot.wa.gov/sc/090vc05347.jpg', small: true },
      { name: 'Summit Central Base', why: 'Resort camera at Summit Central\'s base. Its stream was off when checked in daylight on Nov 13 (an old frozen frame or the resort\'s title card), so this may not be today\'s view. Tap for live video (YouTube).', youtube: 'GcIAQ5iD35o' },
      { name: 'Summit Central Top', why: 'Resort camera at the top of Summit Central (Central Express). Its stream was off when checked in daylight on Nov 13 (an old frozen frame or the resort\'s title card), so this may not be today\'s view. Tap for live video (YouTube).', youtube: 'w4Sno8NIjmU' },
      { name: 'Silver Fir Base', why: 'Resort camera at the base of Silver Fir Express, between Central and East. Its stream was off when checked in daylight on Nov 13 (an old frozen frame or the resort\'s title card), so this may not be today\'s view. Tap for live video (YouTube).', youtube: 'H7HwsNLqVC8' },
      { name: 'Summit West Base', why: 'Resort camera at Summit West\'s base. Its stream was off when checked in daylight on Nov 13 (an old frozen frame or the resort\'s title card), so this may not be today\'s view. Tap for live video (YouTube).', youtube: 'vhO8nNqg9iw' },
    ],
    // Opening Day "to be determined" (hours page, updated Sep 27, 2026). Last season Summit West opened Dec 23, 2025.
    season: { openingDay: null, closed: true, checked: '2026-11-12' },
    liftStatusUrl: 'https://www.summitatsnoqualmie.com/mountain-report',
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; its lift list loads by script',
    features: { liftEstimate: false },
    links: [
      { label: 'Official mountain report & lift status', url: 'https://www.summitatsnoqualmie.com/mountain-report' },
      { label: 'Official webcams', url: 'https://www.summitatsnoqualmie.com/webcams' },
      { label: 'Northwest Avalanche Center: Snoqualmie Pass forecast', url: 'https://nwac.us/forecasts/avalanche/snoqualmie-pass' },
      { label: 'NWAC Snoqualmie Pass stations (every hour, incl. snow depth)', url: 'https://nwac.us/weather/stations/snoqualmie-pass' },
      { label: 'WSDOT Snoqualmie Pass I-90 (roads)', url: 'https://wsdot.com/travel/real-time/mountainpasses/snoqualmie' },
      { label: 'Olallie Meadows SNOTEL (regional)', url: 'https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=672' },
    ],
    afdWords: ['cascades?', 'cascade crest', 'snoqualmie', 'snoqualmie pass', 'passes', 'i-90', 'east winds?', 'easterly', 'offshore', 'convergence zone'],
    text: {
      liveLead: 'Live readings from the Northwest Avalanche Center\'s stations at Summit West (Dodge Ridge and the pass) and Washington DOT\'s road sensor on I-90. No snow-depth sensor this site can read stands on the ski area; the nearest snow stations appear below as regional references.',
      stationsNote: 'Northwest Avalanche Center stations at Summit West, reporting hourly (1 to 2 hours late), and Washington DOT\'s road sensor at the pass (wind sheltered at road level), read through the National Weather Service network. No station reports from Summit Central or East right now. Offline stations are ignored.',
      snowDepthNote: 'NWAC measures snow depth at the pass, on its own site only (see Links). The nearest snow station this site reads, Olallie Meadows, is in another valley 3 mi away: a regional reference.',
      regionalWhy: 'in other valleys and drainages, so their snow differs from the ski area\'s',
      camsSource: 'Summit at Snoqualmie (YouTube live, via CamStreamer); Washington State DOT',
      camsNote: 'Resort cameras: each shows its stream\'s live still, refreshed about every 5 minutes; tap one for live video in YouTube\'s player. When checked on Nov 13 the resort\'s streams were off (frozen frames or title cards), so their pictures may be old; the WSDOT road cams carry their own time stamps. Road cameras © WSDOT.',
      footer: 'Resort cams © Summit at Snoqualmie, via YouTube. Road cameras © WSDOT. Official sources: the Summit at Snoqualmie mountain report and the Northwest Avalanche Center forecast.',
    },
  },

  mission: {
    name: 'Mission Ridge',
    region: 'Wenatchee Mountains, east slope of the Cascades · Washington, USA',
    // The base lodge. Open-Meteo uses one grid cell (47.278, -120.407) for mid-mountain and the summit;
    // for the base elevation it picks the cell at 47.285, -120.369, about 1.5 mi E down the same side,
    // from any point on the ski area (checked 2026-11-11).
    lat: 47.292,
    lon: -120.399,
    timezone: 'America/Los_Angeles',
    // Base and summit are the resort's official figures (Mountain Safety page): 4,570 ft and 6,820 ft,
    // 2,250 ft vertical. It names no mid-mountain elevation, so "mid" is the halfway elevation.
    zones: [
      { key: 'base', name: 'Base lodge', short: 'Base', ft: 4570 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 5695 },
      { key: 'summit', name: 'Top of the ski area', short: 'Summit', ft: 6820 },
    ],
    // National Weather Service Spokane. This cell holds both the Mid-Mountain and Summit stations and
    // averages 6,257 ft; the base station falls in the cell east (43,89; 5,978 ft). Both publish snow
    // level and visibility. Points just south of the ridge top fall in Pendleton's area, so don't
    // re-derive the cell from a guessed summit point.
    nws: { office: 'OTX', officeName: 'Spokane', x: 42, y: 89 },
    // Northwest Avalanche Center stations on the ski area, read through the National Weather Service
    // network (hourly; reports arrive 1 to 2 hours late). Checked 2026-11-10/11 against NWAC's own table
    // (same values, e.g. 36 / 43 / 46°F summit / mid / base at 11pm) and the model at each elevation.
    // The summit's wind speed and direction are missing from about half the reports in this feed (its
    // gust from about a third); NWAC's own table has every hour. The site uses the latest wind within
    // 3 hours and shows its age. Base and Mid-Mountain measure temperature and humidity only.
    stations: [
      { id: 'MSR67', name: 'Summit', operator: 'Northwest Avalanche Center', ft: 6730, where: 'near the top of the ski area, 1.8 mi SW of the base lodge' },
      { id: 'MSR52', name: 'Mid-Mountain', operator: 'Northwest Avalanche Center', ft: 5160, where: 'lower mountain, 0.7 mi SW of the base lodge (NWAC\'s name; it sits 590 ft above the base)' },
      { id: 'MSR46', name: 'Base', operator: 'Northwest Avalanche Center', ft: 4610, where: 'base area, beside the lodge' },
    ],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    // Measured snow on the ground: the Upper Wheeler SNOTEL, 1.4 mi ESE of the base lodge and 240 ft
    // below the base. Owner decision (2026-11-11): use it, labeled as base-level. Checked over 2025-26:
    // depth in 87% of hours (longest gap 24 h), no spike readings; it tracked the stations above it
    // through every storm but reads about 3/4 of Grouse Camp's depth (1,000 ft higher), so it is a
    // base-level reading, not the mountain's. 0-1" on Oct 28 when the resort reported 1-2" at the base.
    snowSensor: { id: '841:WA:SNTL', name: 'Upper Wheeler', operator: 'USDA NRCS SNOTEL', ft: 4330, mi: 1.4, where: '1.4 mi ESE of the base lodge, 240 ft below the base', maxAgeHours: 6 },
    // Regional reference only (collapsed in Live readings); never feeds the summary.
    snotel: [
      // Distances from this mountain's point above (measured 2026-11-11 from the NRCS station records).
      { id: '507:WA:SNTL', name: 'Grouse Camp', ft: 5390, mi: 4.2 },
      { id: '832:WA:SNTL', name: 'Trough', ft: 5480, mi: 6.4 },
      { id: '352:WA:SNTL', name: 'Blewett Pass', ft: 4240, mi: 13.7 },
    ],
    // The resort lists three cams, all YouTube live streams on its channel (@MissionRidgeResort), checked
    // live at night and in daylight on 2026-11-11. They carry no on-image name or time stamp, so each is
    // described by what it shows. There is no snow stake cam: the resort reads its Upper Basin stake by
    // hand in its reports. The first camera is the one shown large at the top in preseason.
    cams: [
      { name: 'Sunspot', why: 'Resort camera looking down across several runs to the valley: snow cover on the slopes below it. Tap for live video (YouTube).', youtube: '28Vhz4mcM64', caption: 'Sunspot cam (resort). This resort has no snow stake cam.' },
      { name: 'Midway', why: 'Resort camera at the bottom of a chairlift beside a building deck, looking up the slope: snow on the ground mid-mountain. Tap for live video (YouTube).', youtube: 'AlJPPPl1yIw' },
      { name: 'Mimi', why: 'Resort camera looking up a lower run toward the upper mountain: snow on the lower slopes. Tap for live video (YouTube).', youtube: 'TERghSgEi_o' },
    ],
    // The resort's Operating Schedule page: on 2026-11-11 (owner's screenshot) Fri Nov 27 - Sun Nov 29 read "Open –
    // 2 Chairs Planned"; by 2026-11-14 (read directly; the site no longer blocked this sandbox) those days were
    // retitled "Possible Open", with "Open – 3 Chairs Planned" from Dec 4 and "Open – All Chairs Planned" from Dec 18.
    // The resort's own word for Nov 27 is now "possible" (owner: "fix and publish", Nov 14). Past openings: Dec 4,
    // 2025 (delayed by a warm November); Nov 23, 2024; Nov 25, 2023.
    season: { openingDay: '2026-11-27', word: 'possible', checked: '2026-11-14' },
    liftStatusUrl: 'https://www.missionridge.com/mountain-report/',
    // Not confirmed whether the resort's pages allow framing (its site blocks this sandbox), so the
    // board is linked, not embedded.
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; its site could not be checked for embedding',
    features: { liftEstimate: false },
    links: [
      { label: 'Official mountain report & lift status', url: 'https://www.missionridge.com/mountain-report/' },
      { label: 'Official webcams', url: 'https://www.missionridge.com/webcams' },
      { label: 'Northwest Avalanche Center: East Slopes Central forecast', url: 'https://nwac.us/forecasts/avalanche/east-slopes-central' },
      { label: 'NWAC Mission Ridge stations (every hour, incl. mid-mountain snow depth)', url: 'https://nwac.us/weather/stations/mission-ridge' },
      { label: 'Upper Wheeler SNOTEL', url: 'https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=841' },
    ],
    afdWords: ['cascades?', 'east slopes?', 'cascade crest', 'mission ridge', 'wenatchee', 'blewett', 'leavenworth', 'chelan'],
    text: {
      liveLead: 'Live readings from the Northwest Avalanche Center\'s weather stations on the ski area (summit, lower mountain and base), and the federal snow station 1.4 mi from the base lodge.',
      stationsNote: 'Northwest Avalanche Center stations on the ski area, reporting hourly; reports arrive 1 to 2 hours late. Read through the National Weather Service network, which leaves the summit\'s wind speed out of many reports; the latest within 3 hours is shown, with its age. NWAC\'s own table has every hour. Offline stations are ignored.',
      snowDepthNote: 'Measured snow depth comes from the Upper Wheeler snow station (4,330 ft, 240 ft below the base); it reads less than the upper mountain holds. NWAC measures depth at its Mid-Mountain station (5,160 ft), on its own site only (see Links).',
      regionalWhy: 'at other heights and on other ridges, so their snow differs from the ski area\'s',
      camsSource: 'Mission Ridge (YouTube live)',
      camsNote: 'Resort cameras: each shows its stream\'s live still, refreshed about every 5 minutes; tap one for live video in YouTube\'s player. This resort has no snow stake cam.',
      footer: 'Webcams © Mission Ridge, via YouTube. Official sources: the Mission Ridge mountain report and the Northwest Avalanche Center forecast.',
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
      // Distances from this mountain's point above (Quartz Peak is 3.1 mi from the summit itself).
      { id: '707:WA:SNTL', name: 'Quartz Peak', ft: 4710, mi: 2.9 },
      { id: '1081:ID:SNTL', name: 'Ragged Mountain', ft: 4210, mi: 5.6 },
    ],
    // The resort streams its cams on YouTube (as Willamette Pass does). Captions are the resort's own
    // (webcams page, 2026-11-10). Through Nov 11 (night and daylight) every live still was the resort's
    // title card: an old winter photo behind a "Live Stream" box. The owner chose to publish anyway
    // ("they'll fix it", Nov 12), so each cam says so. When the streams come back, check each picture
    // against its caption and remove the title-card sentences.
    snowStake: {
      name: 'Snow stake (Lodge 2)',
      youtube: 'lBgqL-YwCcE',
      note: 'Resort snow stake at Lodge 2, numbered in inches. Until the resort switches its streams on, this shows their title card: an old winter photo, not today\'s snow. Tap for live video (YouTube).',
      caption: 'Snow stake cam, Lodge 2 (resort). Until the resort switches its streams on, this is their title card: an old photo, not today\'s snow.',
      // Replaces "Measured: stake cam" on the Fresh snow card while the stream shows a title card.
      thumbLabel: 'Stake cam ↓',
    },
    cams: [
      { name: 'Top of Vista Cruiser, Chair 1 (summit)', why: 'Resort camera at the top of Chair 1, the summit: upper-mountain snow and visibility. Until the resort switches its streams on, this shows their title card (an old photo). Tap for live video (YouTube).', youtube: 'r1N4CmHq0RA' },
      { name: 'Top of Northwood, Chair 6', why: 'Resort camera at the top of Chair 6, on the back side. Until the resort switches its streams on, this shows their title card (an old photo). Tap for live video (YouTube).', youtube: 'm1kzBdiTyFU' },
      { name: 'Top of Parkway Express, Chair 3', why: 'Resort camera at the top of Chair 3. Until the resort switches its streams on, this shows their title card (an old photo). Tap for live video (YouTube).', youtube: 'KSIuO1ITLlU' },
      { name: 'Top of Hidden Treasure, Chair 4', why: 'Resort camera at the top of Chair 4. Until the resort switches its streams on, this shows their title card (an old photo). Tap for live video (YouTube).', youtube: 'rQnOjOnHrpw' },
      { name: 'Hourglass (Chair 1)', why: 'Resort camera on the Hourglass run, on Chair 1. Until the resort switches its streams on, this shows their title card (an old photo). Tap for live video (YouTube).', youtube: 'rvY2pHYzMlE' },
      { name: 'View from Lodge 2', why: 'Resort camera at Lodge 2, by the base: snow at the bottom of the mountain. Until the resort switches its streams on, this shows their title card (an old photo). Tap for live video (YouTube).', youtube: '0i8hMjxhnho' },
      { name: 'Half Hitch Terrain Park', why: 'Resort camera at the top of the Half Hitch terrain park. Until the resort switches its streams on, this shows their title card (an old photo). Tap for live video (YouTube).', youtube: 'itPwz9u27K4' },
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
      stationsNote: 'No public weather station on the ski area. The nearest, the Quartz Peak snow station (about 3 mi SE of the summit), is a regional reference only.',
      snowDepthNote: 'No snow-depth sensor on the ski area; the snow stake cam shows the ground. The nearest snow station, Quartz Peak (about 3 mi SE of the summit), is a regional reference.',
      regionalWhy: 'on separate peaks away from the ski runs, so their snow can differ from the ski area\'s',
      camsSource: 'Mt. Spokane Ski & Snowboard Park (YouTube live)',
      camsNote: 'Resort cameras: each shows its stream\'s live still, refreshed about every 5 minutes; tap one for live video in YouTube\'s player. While a stream is off, YouTube shows the resort\'s title card (an old photo).',
      footer: 'Webcams © Mt. Spokane Ski & Snowboard Park, via YouTube. Official source: the Mt. Spokane weather & conditions page.',
    },
  },

  palisades: {
    name: 'Palisades Tahoe',
    region: 'Olympic Valley side of Palisades Tahoe, Lake Tahoe · California, USA',
    // Palisades Tahoe is two mountains joined by a gondola; this is the Palisades (Olympic Valley) side,
    // and `alpine` below is the other (owner's choice, 2026-11-12). A point between the village and
    // Belmont. Open-Meteo picks a cell per elevation here: base 39.194, -120.223 (valley floor), mid
    // 39.187, -120.257, summit 39.181, -120.290 (Emigrant / Granite Chief side), checked 2026-11-12.
    lat: 39.19,
    lon: -120.25,
    timezone: 'America/Los_Angeles',
    // The resort's official figures (Mountain Statistics page, checked 2026-11-12): base 6,200 ft, peak
    // 9,050 ft, 2,850 ft vertical. It names no mid-mountain elevation, so "mid" is the halfway elevation.
    zones: [
      { key: 'base', name: 'Village base', short: 'Base', ft: 6200 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 7625 },
      { key: 'summit', name: 'Top of the ski area', short: 'Summit', ft: 9050 },
    ],
    // The Sierra crest splits two NWS offices through this ski area. Mid-mountain (Belmont and the SNOTEL)
    // lies in Sacramento's area; this cell averages 7,385 ft. Reno's grid covers the same ground as its
    // cell 27,94 but forecast different snowfall on 2026-11-12 (1.8" vs 0.4" in one 6-hour period), so the
    // owning office is used. Reno writes the Tahoe forecast discussion, so the notes come from Reno.
    nws: { office: 'STO', officeName: 'Sacramento', x: 89, y: 87, afdOffice: 'REV', afdOfficeName: 'Reno' },
    // On-mountain stations, read through the National Weather Service network (MesoWest, "TAHOE" network;
    // the record doesn't name who runs them). Every 15 minutes; all current on 2026-11-12. Siberia drops
    // its wind from about half its reports; the site uses the latest within 3 hours.
    stations: [
      { id: 'SIBSV', name: 'Siberia', operator: 'MesoWest TAHOE network', ft: 8700, where: 'upper mountain, 2.2 mi WSW of the village' },
      { id: 'BMTSV', name: 'Belmont', operator: 'MesoWest TAHOE network', ft: 8000, where: 'upper mountain, 1.5 mi WSW of the village' },
      { id: 'OVBOW', name: 'Olympic Valley base', operator: 'MesoWest TAHOE network', ft: 6237, where: 'base area, 0.2 mi from the village' },
    ],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    // Measured snow on the ground: the federal SNOTEL station on the ski area (formerly Squaw Valley G.C.),
    // 8,010 ft near Belmont. Hourly depth and water content. 0" depth on 2026-11-12, when the High Camp
    // cam showed patchy snow and the Siberia cam snow on the upper slopes.
    snowSensor: { id: '784:CA:SNTL', name: 'Palisades Tahoe', operator: 'USDA NRCS SNOTEL', ft: 8010, mi: 1.7, where: 'on the ski area near Belmont, 1.7 mi WSW of the village', maxAgeHours: 6 },
    // Regional reference only (collapsed in Live readings); never feeds the summary.
    snotel: [
      // Distances from this mountain's point above (measured 2026-11-12 from the NRCS station records).
      { id: '848:CA:SNTL', name: 'Ward Creek #3', ft: 6750, mi: 4.1 },
      { id: '809:CA:SNTL', name: 'Tahoe City Cross', ft: 6760, mi: 5.3 },
      { id: '834:CA:SNTL', name: 'Truckee #2', ft: 6500, mi: 8.4 },
    ],
    // The resort's cams are Ozolio live streams. Each has a public poster still (the player's own
    // pre-play image; 1920x1080, 180-430 KB, refreshed about every 15 minutes), shown here; tapping opens
    // the player. Each image carries its own name and time stamp; names follow those stamps (the resort's
    // page calls High Camp "Scope 8200'"). Checked live at sunset, 2026-11-12. No snow stake cam.
    // Caltrans' road cams are small stamped stills, offered free for use in apps (its developer portal).
    cams: [
      { name: 'Top of Siberia', why: 'Resort camera at the top of Siberia, upper mountain: snow on the upper slopes, with Lake Tahoe beyond. Tap for live video.', src: 'https://relay.ozolio.com/pub.api?cmd=poster&oid=EMB_OBCE00000ECB', video: 'https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_OBCE00000ECB', heavy: true, caption: 'Top of Siberia cam (resort). This resort has no snow stake cam.' },
      { name: 'High Camp (8,200 ft)', why: 'Resort camera on the High Camp deck at the top of the tram, looking toward Lake Tahoe: snow around High Camp. Tap for live video.', src: 'https://relay.ozolio.com/pub.api?cmd=poster&oid=EMB_EIFC0000015B', video: 'https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_EIFC0000015B', heavy: true },
      { name: 'Top of Far East Express', why: 'Resort camera at the top of Far East Express, looking across the valley to the upper mountain. Tap for live video.', src: 'https://relay.ozolio.com/pub.api?cmd=poster&oid=EMB_EMST000001C4', video: 'https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_EMST000001C4', heavy: true },
      { name: 'The Village', why: 'Resort camera over the village plaza at the base: what is falling at base level. Tap for live video.', src: 'https://relay.ozolio.com/pub.api?cmd=poster&oid=EMB_ZIGI00000147', video: 'https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_ZIGI00000147', heavy: true },
      { name: 'Hwy 89 at Olympic Valley', why: 'Highway 89 at the Olympic Valley turnoff (6,122 ft), 2 mi E of the village: the road and what is falling in the valley. Caltrans.', src: 'https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy89atolympicvalley/hwy89atolympicvalley.jpg', small: true },
    ],
    // The resort's Opening Day page (checked 2026-11-12): "Opening Day is November 25, 2026",
    // conditions permitting. The same day for Alpine.
    season: { openingDay: '2026-11-25', checked: '2026-11-12' },
    liftStatusUrl: 'https://www.palisadestahoe.com/mountain-information/mountain-report',
    // The resort's pages don't block embedding, but the lift list loads by script inside a long page.
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; its lift list loads inside a long page',
    features: { liftEstimate: false },
    links: [
      { label: 'Official mountain report & lift status', url: 'https://www.palisadestahoe.com/mountain-information/mountain-report' },
      { label: 'Official webcams', url: 'https://www.palisadestahoe.com/mountain-information/webcams' },
      { label: 'Sierra Avalanche Center: Central Sierra Nevada forecast', url: 'https://www.sierraavalanchecenter.org/forecasts/avalanche/central-sierra-nevada' },
      { label: 'Palisades Tahoe SNOTEL', url: 'https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=784' },
      { label: 'Caltrans QuickMap (roads)', url: 'https://quickmap.dot.ca.gov/' },
    ],
    afdWords: ['sierra', 'sierra crest', 'tahoe', 'lake tahoe', 'truckee', 'donner', 'i-80', 'highway 89', 'hwy 89', 'olympic valley', 'palisades'],
    text: {
      liveLead: 'Live readings from weather stations on the ski area (upper mountain and base), and the federal snow station on the mountain near Belmont.',
      stationsNote: 'On-mountain stations reporting every 15 minutes, read through the National Weather Service network (MesoWest\'s TAHOE network). Siberia leaves its wind out of many reports; the latest within 3 hours is shown, with its age. Offline stations are ignored.',
      snowDepthNote: 'Measured snow depth comes from the Palisades Tahoe snow station on the mountain near Belmont (8,010 ft); the base usually holds less.',
      regionalWhy: 'in other valleys and lower down, so their snow differs from the ski area\'s',
      camsSource: 'Palisades Tahoe (Ozolio live cams); Caltrans',
      camsNote: 'Resort cams show the stream\'s latest still (about every 15 minutes); tap for live video in Ozolio\'s player. Road camera: Caltrans. This resort has no snow stake cam.',
      radarNote: 'Radar coverage over the Sierra is limited by terrain, so light snow can be missed.',
      footer: 'Resort cams © Palisades Tahoe, via Ozolio. Road camera: Caltrans. Official sources: the Palisades Tahoe mountain report and the Sierra Avalanche Center forecast.',
    },
  },

  alpine: {
    name: 'Alpine Meadows',
    region: 'Alpine side of Palisades Tahoe, Lake Tahoe · California, USA',
    // The Alpine side of Palisades Tahoe (the resort calls it "Alpine"); `palisades` above is the other
    // side. The base. Open-Meteo picks a cell per elevation here: base 39.168, -120.214 (down the valley),
    // mid and summit 39.161, -120.248 (on the mountain), checked 2026-11-12.
    lat: 39.1641,
    lon: -120.2386,
    timezone: 'America/Los_Angeles',
    // The resort's official figures (Mountain Statistics page, checked 2026-11-12): base 6,835 ft, peak
    // 8,637 ft (Ward Peak), 1,802 ft vertical. "Mid" is the halfway elevation.
    zones: [
      { key: 'base', name: 'Base lodge', short: 'Base', ft: 6835 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 7736 },
      { key: 'summit', name: 'Ward Peak', short: 'Summit', ft: 8637 },
    ],
    // National Weather Service Reno. This cell holds the base area and averages 7,772 ft, about
    // mid-mountain. Roundhouse top and Ward Peak fall in Sacramento's cell 89,85 (8,235 ft).
    nws: { office: 'REV', officeName: 'Reno', x: 27, y: 93 },
    // On-mountain stations, read through the National Weather Service network (MesoWest, "TAHOE" network).
    // Every 15 minutes; all current on 2026-11-12. Ward Peak reports gusts but never wind speed or
    // direction. Its NWS record says 8,399 ft, but its name says 8,643' and it sits at Ward Peak's summit
    // (8,637 ft, resort figure), so the name's height is used. Left out, at heights these cover:
    // Treeline Cirque mid TLCAM (7,555), Yellow Valve House YVHAM (7,640) and Scott bottom SCBAM (7,075;
    // temperature and humidity only).
    stations: [
      { id: 'SUMAM', name: 'Ward Peak summit', operator: 'MesoWest TAHOE network', ft: 8643, where: 'top of the ski area, 1.1 mi SSW of the base lodge' },
      { id: 'SCTAM', name: 'Scott top', operator: 'MesoWest TAHOE network', ft: 8120, where: 'upper mountain, 0.7 mi ESE of the base lodge' },
      { id: 'RHTAM', name: 'Roundhouse top', operator: 'MesoWest TAHOE network', ft: 7880, where: 'mid-mountain, 0.7 mi SSW of the base lodge' },
      { id: 'RHBAM', name: 'Roundhouse bottom', operator: 'MesoWest TAHOE network', ft: 6950, where: 'base area, beside the lodge' },
    ],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    // No snow-depth sensor on this ski area (checked on SNOTEL and California's CDEC, 2026-11-12). As at
    // Mt. Spokane, the nearest are regional references only: the Palisades Tahoe SNOTEL is across the
    // ridge on the other mountain, Ward Creek #3 in the next valley south, below this base.
    snotel: [
      // Distances from this mountain's point above (measured 2026-11-12 from the NRCS station records).
      { id: '848:CA:SNTL', name: 'Ward Creek #3', ft: 6750, mi: 2.3 },
      { id: '784:CA:SNTL', name: 'Palisades Tahoe', ft: 8010, mi: 2.3 },
      { id: '809:CA:SNTL', name: 'Tahoe City Cross', ft: 6760, mi: 4.6 },
    ],
    // Ozolio live cams, as at Palisades; names follow each image's own stamp (the resort's page calls the
    // Alpine Lodge cam "Alpine Peak" and the Kangaroo cam "Alpine Race"). Checked live at sunset,
    // 2026-11-12. No snow stake cam.
    cams: [
      { name: 'Alpine Chalet', why: 'Resort camera at the Alpine Chalet, looking up the slope: snow cover on the lower mountain. Tap for live video.', src: 'https://relay.ozolio.com/pub.api?cmd=poster&oid=EMB_FPOI000010AB', video: 'https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_FPOI000010AB', heavy: true, caption: 'Alpine Chalet cam (resort). This resort has no snow stake cam.' },
      { name: 'Kangaroo race course', why: 'Resort camera on the Kangaroo race course, looking up the slope: snow on the run and snowmaking. Tap for live video.', src: 'https://relay.ozolio.com/pub.api?cmd=poster&oid=EMB_KIYV000003C2', video: 'https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_KIYV000003C2', heavy: true },
      { name: 'Alpine Lodge (base)', why: 'Resort camera at the Alpine Lodge, by the base lifts: snow at the bottom of the mountain. Tap for live video.', src: 'https://relay.ozolio.com/pub.api?cmd=poster&oid=EMB_VPAY0000014C', video: 'https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_VPAY0000014C', heavy: true },
      { name: 'Hwy 89 at Alpine Meadows', why: 'Highway 89 at the Alpine Meadows Road junction (6,220 ft), 2.8 mi from the base: the road and what is falling in the valley. Caltrans.', src: 'https://cwwp2.dot.ca.gov/data/d3/cctv/image/hwy89atalpinemeadows/hwy89atalpinemeadows.jpg', small: true },
    ],
    // Same Opening Day page as Palisades (checked 2026-11-12): "Opening Day is November 25, 2026".
    season: { openingDay: '2026-11-25', checked: '2026-11-12' },
    liftStatusUrl: 'https://www.palisadestahoe.com/mountain-information/mountain-report',
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; its lift list loads inside a long page',
    features: { liftEstimate: false },
    links: [
      { label: 'Official mountain report & lift status', url: 'https://www.palisadestahoe.com/mountain-information/mountain-report' },
      { label: 'Official webcams', url: 'https://www.palisadestahoe.com/mountain-information/webcams' },
      { label: 'Sierra Avalanche Center: Central Sierra Nevada forecast', url: 'https://www.sierraavalanchecenter.org/forecasts/avalanche/central-sierra-nevada' },
      { label: 'Caltrans QuickMap (roads)', url: 'https://quickmap.dot.ca.gov/' },
    ],
    afdWords: ['sierra', 'sierra crest', 'tahoe', 'lake tahoe', 'truckee', 'donner', 'i-80', 'highway 89', 'hwy 89', 'alpine meadows'],
    text: {
      liveLead: 'Live readings from weather stations on the ski area, from Ward Peak down to the base. No snow-depth sensor stands on this mountain; the nearest snow stations appear below as regional references.',
      stationsNote: 'On-mountain stations reporting every 15 minutes, read through the National Weather Service network (MesoWest\'s TAHOE network). Ward Peak reports gusts only. Offline stations are ignored.',
      snowDepthNote: 'No snow-depth sensor on this ski area; the resort cams show the ground. The nearest snow stations (Ward Creek #3 in the next valley south, and Palisades Tahoe across the ridge) are regional references.',
      regionalWhy: 'in other valleys, so their snow differs from this mountain\'s',
      camsSource: 'Palisades Tahoe (Ozolio live cams); Caltrans',
      camsNote: 'Resort cams show the stream\'s latest still (about every 15 minutes); tap for live video in Ozolio\'s player. Road camera: Caltrans. This resort has no snow stake cam.',
      radarNote: 'Radar coverage over the Sierra is limited by terrain, so light snow can be missed.',
      footer: 'Resort cams © Palisades Tahoe, via Ozolio. Road camera: Caltrans. Official sources: the Palisades Tahoe mountain report and the Sierra Avalanche Center forecast.',
    },
  },

  sugar: {
    name: 'Sugar Mountain',
    region: 'Blue Ridge Mountains, Banner Elk · North Carolina, USA',
    // A point on the slopes between the base area (lodge and lift bottoms about 36.1305, -81.8585) and the lift tops
    // (about 36.1252, -81.8751, beside the GNIS peak), from OpenStreetMap's lift map. Researched 2026-11-16.
    lat: 36.1275,
    lon: -81.868,
    timezone: 'America/New_York',
    // The resort's Stats page (checked 2026-11-16): summit 5,300 ft, base 4,100 ft, 1,200 ft vertical (the most in North
    // Carolina). It names no mid-mountain point, so "mid" is the halfway elevation.
    zones: [
      { key: 'base', name: 'Base area', short: 'Base', ft: 4100 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 4700 },
      { key: 'summit', name: 'Summit', short: 'Summit', ft: 5300 },
    ],
    // Day session 9am-4:30pm and night session 6-10pm, daily (lifts closed 4:30-6pm). Owner's choice (Nov 16): 9am-10pm,
    // covering night skiing, as at Appalachian and Beech.
    skiHours: { default: [9, 22] },
    // National Weather Service Greenville-Spartanburg. This one cell (averages 4,498 ft) covers the base, mid-mountain
    // and the summit. No snow level (rain vs. snow from each elevation's model temperature); visibility and snowfall yes.
    nws: { office: 'GSP', officeName: 'Greenville-Spartanburg', x: 78, y: 101 },
    // No public station on or near the ski area (checked 2026-11-16): Banner Elk's BEKN7 is a rain gauge, and Grandfather
    // Meadows and the COOP observers send nothing through the NWS feed. The resort's home page shows its own base and
    // summit thermometers (credited AveryWeather.com), written into its HTML with no public feed: cross-check only.
    // Model estimates in Right now (nowModel) were checked against them before building and left OFF: at 2:22-2:40am
    // on Nov 16 Open-Meteo read 4.7°F too warm at the base (31.8 vs 27.1°F; the base sits in a hollow where cold air
    // pools) and 2.4°F at the summit. They were recommended to the owner only if this check passed (Beech and
    // Appalachian, where they are on, miss by about 1-2°F). Re-check by day; turn on with `nowModel: true` if it holds up.
    stations: [],
    stationMaxAgeHours: 3,
    snowZone: 'mid',
    // No SNOTEL in North Carolina; the resort reports its depth by hand ("Average depth 10" - 30"" on Nov 16).
    snotel: [],
    // The resort's seven cams are live streams on Castr with no still picture, so they are tap-to-play live players
    // (`embed`), as at Skibowl West. Castr's official embed player (player.castr.com, the one ResortCams uses for the
    // "Sugar Ski & Country Club" cam) reported no domain restriction on any of them (`__domainWhitelists = false`,
    // no frame-blocking header) and every stream was live (checked 2026-11-16, 3am Eastern). Names are the resort's
    // cams-page tabs; stream titles agree. The Tubing/Ice Skating cam is left out (nothing about the slopes). Not yet
    // seen in daylight: the sandbox's Chromium can't decode the video, so describe each view when seen.
    // The first camera is the one shown first in the cam viewer. No snow stake cam.
    cams: [
      { name: 'Summit (resort, live)', why: 'The resort\'s live summit cam (5,300 ft): snow and visibility at the top. No still picture: tap to play the live stream.', embed: 'https://player.castr.com/live_da100dd0d3b211f089454b7c25f2965f', link: 'https://skisugar.com/cams/', caption: 'Summit cam (resort, live stream). This resort has no snow stake cam.' },
      { name: 'Oma\'s Top Lift (resort, live)', why: 'The resort\'s live cam at the top of Oma\'s lift, near the top of the mountain, looking out over Oma\'s Meadow. Tap to play the live stream.', embed: 'https://player.castr.com/live_6e6c0df06f2e11f1862cc590260dd311', link: 'https://skisugar.com/cams/' },
      { name: 'Oma\'s (resort, live)', why: 'The resort\'s live cam on Oma\'s. Tap to play the live stream.', embed: 'https://player.castr.com/live_c3cb3b10cfbd11f094eff94566b39e7c', link: 'https://skisugar.com/cams/' },
      { name: 'Easy Street (resort, live)', why: 'The resort\'s live cam on Easy Street, a lower-mountain slope. Tap to play the live stream.', embed: 'https://player.castr.com/live_7603aa40cecb11f093049346b8bbe416', link: 'https://skisugar.com/cams/' },
      { name: 'Base (resort, live)', why: 'The resort\'s live base-area cam (4,100 ft): snow at the bottom of the mountain. Tap to play the live stream.', embed: 'https://player.castr.com/live_fe980e10d22b11f0affbc9f04d80c8bf', link: 'https://skisugar.com/cams/' },
      { name: 'Grandfather View (resort, live)', why: 'The resort\'s live cam looking toward Grandfather Mountain: visibility and the cloud deck. Tap to play the live stream.', embed: 'https://player.castr.com/live_f373e500cfbe11f0b06b595bb3be6c70', link: 'https://skisugar.com/cams/' },
    ],
    // Already open: the Stats page records "Opening: November 15, 2026" and the home page said "We're Open!" on Nov 16.
    season: { openingDay: '2026-11-15', checked: '2026-11-16' },
    // The lift and slope board ("See What's Open") is on the home page. Its pages send "X-Frame-Options: SAMEORIGIN".
    liftStatusUrl: 'https://skisugar.com/',
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; the resort\'s home page lists every lift and slope, open or closed, with snowmaking and its own base and summit temperatures',
    features: { liftEstimate: false },
    links: [
      { label: 'Official conditions, lifts & slopes (home page; incl. the resort\'s own base & summit temperatures)', url: 'https://skisugar.com/' },
      { label: 'Official live cams', url: 'https://skisugar.com/cams/' },
      { label: 'Official hours & mountain info', url: 'https://skisugar.com/mountain-info/' },
      { label: 'Official stats (incl. past opening dates)', url: 'https://skisugar.com/sugar-mountain-stats/' },
    ],
    afdWords: ['high country', 'northern mountains', 'mountains', 'blue ridge', 'sugar', 'banner elk', 'avery', 'grandfather', 'northwest flow', 'upslope', 'tennessee border'],
    text: {
      liveLead: 'No public weather station on the ski area, and no snow-depth sensor (there are no SNOTEL stations in North Carolina). The resort posts its own base and summit thermometer readings and its hand-reported snow depth on its home page (see Links).',
      stationsNote: 'No public weather station on the ski area. The resort posts its own base and summit thermometer readings on its home page; they aren\'t available as public data, so they aren\'t shown here.',
      noStationNow: 'No public weather station on the ski area. The resort posts its own base and summit thermometer readings on its home page (see Links); the live cams show conditions.',
      snowDepthNote: 'No snow-depth sensor on the ski area; the resort reports its depth by hand on its home page. Nearly all the snow here is made by the resort.',
      regionalWhy: 'away from the ski area',
      camsSource: 'Sugar Mountain Resort (live streams via Castr)',
      camsNote: 'The resort\'s cams are live streams with no still picture: tap one to play it. This resort has no snow stake cam.',
      radarNote: 'Radar coverage over the mountains is limited by terrain, so light snow can be missed.',
      footer: 'Live cams © Sugar Mountain Resort, via Castr. Official source: the Sugar Mountain Resort home page (conditions, lifts and slopes).',
    },
  },

  beech: {
    name: 'Beech Mountain',
    region: 'Blue Ridge Mountains, Banner Elk · North Carolina, USA',
    // A point on the slopes between the base area (about 36.195, -81.879) and the lift tops (about 36.185, -81.880),
    // from OpenStreetMap's lift map. Researched 2026-11-14 (see CLAUDE.md).
    lat: 36.190,
    lon: -81.8795,
    timezone: 'America/New_York',
    // The resort's Mountain Stats page (checked 2026-11-14): peak 5,506 ft, base 4,675 ft, 830 ft vertical, "the highest
    // ski area in Eastern America". It names no mid-mountain point, so "mid" is the halfway elevation.
    zones: [
      { key: 'base', name: 'Base area', short: 'Base', ft: 4675 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 5090 },
      { key: 'summit', name: 'Summit', short: 'Summit', ft: 5506 },
    ],
    // Regular season (Dec 4 - Mar 7): Monday-Thursday 9am-9pm, Friday-Sunday 9am-10pm (Hours of Operation page).
    // Owner's choice (Nov 14): use these all season. Opening Day to Dec 3 and the late season (Mar 8-20) run 9am-5pm
    // daily, which `skiHours` (by weekday only) can't express, so those weeks show forecasts to 9 or 10pm.
    skiHours: { default: [9, 21], 5: [9, 22], 6: [9, 22], 0: [9, 22] },
    // The Watauga/Avery county line crosses the middle of the slopes: the base is in NWS Blacksburg's RNK/10,14,
    // mid-mountain and the lift tops in Greenville-Spartanburg's cell below. Both average 4,925 ft; neither publishes a
    // snow level (rain vs. snow comes from each elevation's model temperature, as at Appalachian). GSP covers most of
    // the slopes, so it's used, with its forecast discussion.
    nws: { office: 'GSP', officeName: 'Greenville-Spartanburg', x: 77, y: 104 },
    // No reputable live station on or near the ski area (checked 2026-11-14): the stations on Beech Mountain in the NWS
    // feed are amateur (CWOP/APRS: FW4626 at the Pinnacle Inn, WB4ROX AX345), left out as at Appalachian; NWS COOP
    // "Fred's Store" reports daily by hand, outside the observation feed. The resort's own weather box is
    // OpenWeatherMap (a model). Owner decision (Nov 14): labeled model estimates in Right now. Checked over Nov 8-15,
    // hourly, at each station's own point and height: average miss 1.6°F (FW4626) and 1.1°F (AX345), 1.7°F at Boone's
    // KTNB; yardstick Stevens Pass Tye Mill 1.8°F (tools/research/model-check-beech.py).
    stations: [],
    stationMaxAgeHours: 3,
    nowModel: true,
    snowZone: 'mid',
    // No SNOTEL in North Carolina; the resort reports its base depth by hand (Conditions & Maps page).
    snotel: [],
    // The resort's cams are on resortcams.com (as at Appalachian): public stills, each stamped with its own date and
    // time (Eastern), refreshed every few minutes by day and slowly at night. Seen at 1-1:30am Eastern on 2026-11-15,
    // and at 3:18pm that day in thick cloud (all four stamped within two minutes; the summit lens iced over), so
    // what each shows in clear weather is still to be described.
    // The 5506' cam is the resort's summit cam; the Base Cam showed the lit slope with snow guns running. Town cams
    // (Beech Mountain Club, Buckeye Lake) are left out: they show nothing of the ski area. No snow stake cam.
    // The first camera is the one shown large at the top in preseason.
    cams: [
      { name: 'Summit (5,506 ft)', why: 'The resort\'s summit cam: snow and visibility at the top of the mountain. The picture carries its own date and time. Tap for live video.', src: 'https://preview.resortcams.com/thumbnail?application=live&streamname=beechsummit.stream&size=1280x720', video: 'https://www.resortcams.com/webcams/beech-mountain-summit/', caption: 'Summit cam (resort), time-stamped. This resort has no snow stake cam.' },
      { name: 'Base area', why: 'The resort\'s base cam, looking at the lower slope: snow cover, and snowmaking when the guns are running. Tap for live video.', src: 'https://preview.resortcams.com/thumbnail?application=live&streamname=beechbase.stream&size=1280x720', video: 'https://www.resortcams.com/webcams/beech-base-cam/' },
      { name: 'Sledding Hill', why: 'Beech Mountain\'s sledding hill, near the resort: snow on the ground and snowmaking in town. Tap for live video.', src: 'https://preview.resortcams.com/thumbnail?application=live&streamname=beechsledding.stream&size=1280x720', video: 'https://www.resortcams.com/webcams/beech-mountain-sledding-hill/' },
      { name: 'Beech Mountain Parkway (town)', why: 'The town on the Beech Mountain Parkway (NC 184), the road up to the resort: snow on the ground and the road. Tap for live video.', src: 'https://preview.resortcams.com/thumbnail?application=live&streamname=beechparkway.stream&size=1280x720', video: 'https://www.resortcams.com/webcams/beech-parkway/' },
    ],
    // Hours of Operation page (checked 2026-11-14): "Our projected opening date for the 2026 – 2027 winter season is
    // November 21, 2026." Closing Day Saturday, March 20, 2027.
    season: { openingDay: '2026-11-21', projected: true, checked: '2026-11-14' },
    liftStatusUrl: 'https://www.beechmountainresort.com/mountain/winter-trail-map/',
    // The resort's pages send "X-Frame-Options: SAMEORIGIN", so the board can only be linked.
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; the resort\'s Conditions & Maps page, with every lift and trail, base depth and snowmaking',
    features: { liftEstimate: false },
    links: [
      { label: 'Official conditions, lifts & trails (base depth, snowmaking)', url: 'https://www.beechmountainresort.com/mountain/winter-trail-map/' },
      { label: 'Official web cameras', url: 'https://www.beechmountainresort.com/mountain/webcams/' },
      { label: 'Official hours of operation', url: 'https://www.beechmountainresort.com/hours-of-operation-winter/' },
      { label: 'Official mountain stats', url: 'https://www.beechmountainresort.com/mountain/mountain-stats/' },
    ],
    afdWords: ['high country', 'northern mountains', 'mountains', 'blue ridge', 'beech', 'banner elk', 'avery', 'watauga', 'grandfather', 'northwest flow', 'upslope', 'tennessee border'],
    text: {
      liveLead: 'No public weather station this site can use on the ski area, and no snow-depth sensor (there are no SNOTEL stations in North Carolina). The resort reports its base depth by hand on its Conditions & Maps page.',
      stationsNote: 'No reputable public weather station on the ski area: the stations on Beech Mountain in the National Weather Service network are amateur, and the official observer in town reports once a day by hand. Right now shows model estimates, labeled.',
      snowDepthNote: 'No snow-depth sensor on the ski area; the cams show the ground, and the resort reports its base depth by hand. Most of the snow here is made by the resort.',
      regionalWhy: 'away from the ski area',
      camsSource: 'Beech Mountain Resort and the town of Beech Mountain (resortcams.com)',
      camsNote: 'Latest stills from the resort\'s and the town\'s cams, each stamped with its date and time; tap for live video. They refresh slowly at night. This resort has no snow stake cam.',
      radarNote: 'Radar coverage over the mountains is limited by terrain, so light snow can be missed.',
      footer: 'Cams © Beech Mountain Resort and the Town of Beech Mountain, via resortcams.com. Official source: the Beech Mountain Resort Conditions & Maps page.',
    },
  },

  appalachian: {
    name: 'Appalachian Ski Mtn.',
    region: 'Blue Ridge Mountains, Blowing Rock · North Carolina, USA',
    // The ski area (Wikipedia's point; 940 Ski Mountain Rd). Open-Meteo picks a cell per elevation here:
    // base 36.186, -81.664 (0.8 mi N), mid and summit 36.160, -81.670 (1 mi S), checked 2026-11-12.
    lat: 36.174,
    lon: -81.662,
    timezone: 'America/New_York',
    // The resort's official figures (Mountain Stats page, checked 2026-11-12): base 3,635 ft, peak 4,000 ft,
    // 365 ft vertical, 100% snowmaking. "Mid" is the halfway elevation.
    zones: [
      { key: 'base', name: 'Base lodge', short: 'Base', ft: 3635 },
      { key: 'mid', name: 'Mid-mountain', short: 'Mid-mountain', ft: 3818 },
      { key: 'summit', name: 'Top of the ski area', short: 'Summit', ft: 4000 },
    ],
    // National Weather Service Blacksburg. This cell is centered on the ski area and averages 3,507 ft.
    // Blacksburg publishes no snow level here (visibility yes), so rain vs. snow comes from temperatures.
    // Lift hours (Mountain Stats page, projected 26-27 season, checked 2026-11-13): 9am-10pm, to midnight on
    // Fridays and Saturdays (and listed holidays, not modelled). Owner's decision (Nov 13): own hours.
    skiHours: { default: [9, 22], 5: [9, 24], 6: [9, 24] },
    nws: { office: 'RNK', officeName: 'Blacksburg', x: 18, y: 14 },
    // No public weather station on or beside the ski area (checked on the NWS network, 2026-11-12): Blackburn
    // Knob and Howards Knob send no readings; Boone's hospital heliport (KTNB, 3,146 ft) is 1.8 mi N in town,
    // 490 ft below the base, temperature only; the rest are in town or amateur stations.
    stations: [],
    stationMaxAgeHours: 3,
    // As at Mt. Spokane (the owner's choice there; "build it" here on Nov 12, after this was recommended): "Right now" shows labeled
    // model estimates. Checked over 7 days to 2026-11-13, hour by hour, at each station's own location and
    // height: the model missed Boone's heliport by 2.1°F on average and App State's station by 1.6°F, as good as
    // at Stevens Pass's on-mountain station (2.1°F).
    nowModel: true,
    snowZone: 'mid',
    // No snow-depth sensor: there are no SNOTEL stations in North Carolina. The resort hand-reports its base
    // depth on its slope report (linked). No regional snow stations either.
    snotel: [],
    // The resort's live slope stream (resortcams.com) has a public still, stamped with its own date and time.
    // The stream stops at night (the still read 10:51pm at 11:43pm Eastern, 2026-11-12); re-check that it
    // updates through the day, and describe what it shows (only seen at night so far: slope lights). The resort's other "Slope Image" (asmslopecam.com, "updates every 1 minute")
    // was frozen at Sep 29, 2026, so it's left out; re-check before adding. No snow stake cam.
    cams: [
      { name: 'Slope cam', why: 'The resort\'s live slope camera. The picture carries its own date and time; the stream stops at night. Tap for live video.', src: 'https://preview.resortcams.com/thumbnail?application=live&streamname=appskimtn2.stream&size=1280x720', video: 'https://www.resortcams.com/webcams/app-ski-mtn-live/', caption: 'Slope cam (resort). This resort has no snow stake cam.' },
    ],
    // The resort's Opening Day event page (checked 2026-11-12): "The 2026-27 Season's scheduled Opening Day is
    // set for Friday, Nov 20 (weather permitting)". Its Mountain Stats page lists 30 seasons of opening dates
    // (Nov 15 to Dec 21; last season Nov 29).
    season: { openingDay: '2026-11-20', checked: '2026-11-12' },
    liftStatusUrl: 'https://appskimtn.com/slope-report',
    liftStatusEmbed: false,
    liftStatusLinkWhy: 'linked; the resort\'s daily slope report, with lifts, slopes and base depth',
    features: { liftEstimate: false },
    links: [
      { label: 'Official slope report (lifts, slopes, base depth)', url: 'https://appskimtn.com/slope-report' },
      { label: 'Official live cams', url: 'https://appskimtn.com/live-cams' },
      { label: 'Official mountain stats & hours', url: 'https://appskimtn.com/mountain-stats' },
      { label: 'Ray\'s Weather (local forecaster the resort links)', url: 'https://raysweather.com/' },
    ],
    afdWords: ['high country', 'boone', 'blowing rock', 'watauga', 'blue ridge', 'northwest flow', 'upslope', 'mountains'],
    text: {
      liveLead: 'No public weather station on the ski area, and no snow-depth sensor (there are no SNOTEL stations in North Carolina). The resort reports its base depth by hand on its slope report.',
      stationsNote: 'No public weather station on the ski area. The nearest, at Boone\'s hospital heliport, is 1.8 mi away in town and 490 ft below the base.',
      snowDepthNote: 'No snow-depth sensor on the ski area; the slope cam shows the ground, and the resort reports its base depth by hand on its slope report. Nearly all the snow here is made by the resort.',
      regionalWhy: 'away from the ski area',
      camsSource: 'Appalachian Ski Mtn. (resortcams.com live stream)',
      camsNote: 'The resort\'s slope stream: its latest still, stamped with date and time; tap for live video. The stream stops at night. This resort has no snow stake cam.',
      radarNote: 'Radar coverage over the mountains is limited by terrain, so light snow can be missed.',
      footer: 'Slope cam © Appalachian Ski Mtn., via resortcams.com. Official source: the Appalachian Ski Mtn. slope report.',
    },
  },

  sunpeaks: {
    name: 'Sun Peaks',
    region: 'Thompson Okanagan · British Columbia, Canada',
    // A point on the ski area between the village and the top of Burfield.
    lat: 50.893,
    lon: -119.900,
    // British Columbia stopped changing its clocks on 2026-11-01 and stays on UTC-7 (tz database 2026e; Open-Meteo
    // and the resort's own page times agree). Browsers with older time-zone data still put 'America/Vancouver'
    // on UTC-8 in winter, which shifted every Sun Peaks time and the 9am-4pm window by an hour (found 2026-11-10).
    // A fixed UTC-7 zone is right for every date since March 2026. (POSIX sign: 'Etc/GMT+7' means UTC-7.)
    timezone: 'Etc/GMT+7',
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

// Mountains marked `draft` aren't published (see the note at the top).
for (const k of Object.keys(MOUNTAINS)) if (MOUNTAINS[k].draft) delete MOUNTAINS[k];
