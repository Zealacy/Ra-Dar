// Ra-Dar: a tiny weather tracker that runs entirely in the browser.
// No API keys needed — Open-Meteo (forecast) and RainViewer (radar) are free.

const $ = (id) => document.getElementById(id);
let units = localStorageGet('units') || 'celsius';
let lastPlace = null;

// WMO weather codes -> [description, emoji]
const WEATHER = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'],
  51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Heavy freezing rain', '🌧️'],
  71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'], 77: ['Snow grains', '🌨️'],
  80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Violent showers', '⛈️'],
  85: ['Snow showers', '🌨️'], 86: ['Heavy snow showers', '❄️'],
  95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm, hail', '⛈️'], 99: ['Thunderstorm, heavy hail', '⛈️'],
};
const describe = (code) => WEATHER[code] || ['Unknown', '❔'];

function localStorageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch {} }

// ---------- Map + radar ----------
const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);
let marker = null;

async function loadRadar() {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    const data = await res.json();
    const frame = data.radar.past[data.radar.past.length - 1];
    L.tileLayer(`${data.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
      opacity: 0.6,
      maxNativeZoom: 7,
      maxZoom: 18,
      attribution: 'Radar &copy; RainViewer',
    }).addTo(map);
  } catch (e) {
    console.warn('Radar unavailable', e);
  }
}

// ---------- Weather ----------
async function geocode(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`;
  const data = await (await fetch(url)).json();
  if (!data.results || !data.results.length) throw new Error(`No place found for "${name}"`);
  const r = data.results[0];
  return { name: [r.name, r.admin1, r.country].filter(Boolean).join(', '), lat: r.latitude, lon: r.longitude };
}

async function showWeather(place) {
  lastPlace = place;
  $('status').textContent = 'Loading…';
  const tempUnit = units;
  const windUnit = units === 'fahrenheit' ? 'mph' : 'kmh';
  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${place.lat}&longitude=${place.lon}`
    + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    + `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto`;

  try {
    const w = await (await fetch(url)).json();
    const c = w.current;
    const [desc, icon] = describe(c.weather_code);
    const deg = units === 'fahrenheit' ? '°F' : '°C';

    $('place').textContent = place.name;
    $('icon').textContent = icon;
    $('temp').textContent = `${Math.round(c.temperature_2m)}${deg}`;
    $('desc').textContent = desc;
    $('feels').textContent = `${Math.round(c.apparent_temperature)}${deg}`;
    $('humidity').textContent = `${c.relative_humidity_2m}%`;
    $('wind').textContent = `${Math.round(c.wind_speed_10m)} ${windUnit === 'mph' ? 'mph' : 'km/h'}`;
    $('current').hidden = false;

    const f = $('forecast');
    f.innerHTML = '';
    w.daily.time.forEach((day, i) => {
      const [dDesc, dIcon] = describe(w.daily.weather_code[i]);
      const label = new Date(day + 'T12:00').toLocaleDateString(undefined, { weekday: 'short' });
      const el = document.createElement('div');
      el.className = 'day';
      el.title = dDesc;
      el.innerHTML = `<div>${label}</div><div class="d-icon">${dIcon}</div>
        <div><strong>${Math.round(w.daily.temperature_2m_max[i])}°</strong>
        <span class="d-lo">${Math.round(w.daily.temperature_2m_min[i])}°</span></div>
        <div class="d-rain">💧 ${w.daily.precipitation_probability_max[i] ?? 0}%</div>`;
      f.appendChild(el);
    });
    f.hidden = false;

    map.setView([place.lat, place.lon], 7);
    if (marker) marker.remove();
    marker = L.marker([place.lat, place.lon]).addTo(map).bindPopup(place.name);

    localStorageSet('lastPlace', JSON.stringify(place));
    $('status').textContent = '';
  } catch (e) {
    $('status').textContent = 'Could not load weather. Please try again.';
    console.error(e);
  }
}

// ---------- UI ----------
$('search').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    showWeather(await geocode($('city').value.trim()));
  } catch (err) {
    $('status').textContent = err.message;
  }
});

$('locate').addEventListener('click', () => {
  if (!navigator.geolocation) return ($('status').textContent = 'Geolocation not supported.');
  $('status').textContent = 'Finding your location…';
  navigator.geolocation.getCurrentPosition(
    (pos) => showWeather({ name: 'My location', lat: pos.coords.latitude, lon: pos.coords.longitude }),
    () => ($('status').textContent = 'Location permission denied.'),
  );
});

function renderUnitsButton() { $('units').textContent = units === 'fahrenheit' ? '°F' : '°C'; }
$('units').addEventListener('click', () => {
  units = units === 'fahrenheit' ? 'celsius' : 'fahrenheit';
  localStorageSet('units', units);
  renderUnitsButton();
  if (lastPlace) showWeather(lastPlace);
});

// ---------- Start ----------
renderUnitsButton();
loadRadar();
let saved = null;
try { saved = JSON.parse(localStorageGet('lastPlace')); } catch {}
showWeather(saved || { name: 'London, England, United Kingdom', lat: 51.5085, lon: -0.1257 });
