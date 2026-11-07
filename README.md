# Ra-Dar 🌦️

A simple weather tracker website that runs on **GitHub Pages** — no server and no API keys.

- Current conditions (temperature, feels-like, humidity, wind)
- 7-day forecast
- Live rain radar map
- City search, "use my location", °C/°F toggle

## How it works

It's a static site: `index.html` (layout), `style.css` (looks) and `app.js` (logic).
When the page loads, the browser calls free public APIs directly:

| What | Service |
|---|---|
| City name → coordinates | Open-Meteo Geocoding API |
| Current weather + forecast | Open-Meteo Forecast API |
| Radar images | RainViewer |
| Map tiles | OpenStreetMap via Leaflet |

Because everything happens in the browser, GitHub Pages only needs to serve the files.

## Publish it on GitHub Pages

1. Merge these files into your default branch (e.g. `main`).
2. On GitHub go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. After a minute your site is live at `https://<your-username>.github.io/Ra-Dar/`.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.
