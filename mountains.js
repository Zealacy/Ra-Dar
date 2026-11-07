// Mountain configuration. Add another mountain by copying the `bachelor` block.
// Elevations in feet, distances in miles.

const MOUNTAINS = {
  bachelor: {
    name: 'Mt. Bachelor',
    region: 'Central Oregon Cascades · Oregon, USA',
    lat: 43.9792,
    lon: -121.6886,
    timezone: 'America/Los_Angeles',
    zones: [
      { key: 'base', name: 'West Village base', ft: 6300 },
      { key: 'mid', name: 'Pine Marten (mid)', ft: 7800 },
      { key: 'summit', name: 'Summit', ft: 9065 },
    ],
    // National Weather Service forecast grid cell covering the ski area.
    nws: { office: 'PDT', x: 23, y: 40 },
    // On-mountain weather stations, read through the National Weather Service
    // observation network (api.weather.gov). Only these feed "Right now" and The Call.
    stations: [
      { id: 'MOONM', name: 'Moon Mountain', operator: 'Central Oregon Avalanche Center', ft: 7450, where: 'about 5 mi N of the summit, near the Cascade crest' },
      { id: 'OD131', name: 'Century Dr at the ski area', operator: 'Oregon DOT', ft: 6424, where: 'Century Drive at milepost 21, by the West Village entrance' },
      { id: 'OSUSP', name: 'West Village snow pillow', operator: 'Oregon State University', ft: 6375, where: 'West Village base area' },
    ],
    // Readings older than this are treated as offline and ignored.
    stationMaxAgeHours: 3,
    // Elevation zone used for the modeled new-snow number in The Call.
    snowZone: 'mid',
    // NRCS SNOTEL stations. Reputable, but lower and 11-18 miles away in other
    // drainages, so they are shown only as a regional reference and are NOT used in The Call.
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
    },
    // Ordered by how useful each view is for judging ski conditions.
    cams: [
      { name: 'The Cone (summit)', why: 'Summit visibility, cloud cover and wind-blown snow up top', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/3' },
      { name: 'Tumalo Mtn & top of Pine Marten', why: 'Upper-mountain visibility and the inversion/cloud deck', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/12' },
      { name: 'Pine Marten Lodge', why: 'Mid-mountain snow surface and visibility', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/9' },
      { name: 'Outback lift line', why: 'Tree skiing and lift-line crowds on the north side', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/11' },
      { name: 'Sunrise base', why: 'Lower-mountain snow and Sunrise lodge conditions', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/5' },
      { name: 'West Village base & parking', why: 'Base snow, crowds and how full the lots are', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/13' },
      { name: 'Base of Pine Marten lift', why: 'Base area and lift-line length', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/1' },
      { name: 'Nordic Center', why: 'Nordic trail conditions', src: 'https://api.mtbachelor.com/api/v1/cams/mtn/16' },
    ],
    // Season status, from the official Lift & Trail Status page (checked 2026-11-07):
    // "Closed Until Winter. Mt. Bachelor will re-open for winter operations on Opening Day,
    // scheduled for December 4, 2026." Update this when the resort announces changes.
    season: { openingDay: '2026-12-04', checked: '2026-11-07' },
    liftStatusUrl: 'https://www.mtbachelor.com/the-mountain/lift-trail-report/',
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
  },
};
