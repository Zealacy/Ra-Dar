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
    links: [
      { label: 'Official mountain report', url: 'https://www.mtbachelor.com/the-mountain/mountain-report/' },
      { label: 'Official webcams', url: 'https://www.mtbachelor.com/the-mountain/webcams/' },
      { label: 'Central Oregon Avalanche Center', url: 'https://www.coavalanche.org/' },
      { label: 'Three Creeks Meadow SNOTEL', url: 'https://wcc.sc.egov.usda.gov/nwcc/site?sitenum=815' },
      { label: 'ODOT TripCheck (roads)', url: 'https://www.tripcheck.com/' },
    ],
  },
};
